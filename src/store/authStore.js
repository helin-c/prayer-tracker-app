// ============================================================================
// FILE: src/store/authStore.js (FIXED - 401 Error)
// ============================================================================
import { create } from 'zustand';
import api from '../api/backend';
import { storage } from '../services/storage';
import { STORAGE_KEYS } from '../utils/constants';


export const useAuthStore = create((set, get) => ({
  // State
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // ============================================================================
  // INITIALIZE (Load tokens from storage)
  // ============================================================================
  initialize: async () => {
    try {
      const [accessToken, refreshToken, userData] = await Promise.all([
        storage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
        storage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
        storage.getItem(STORAGE_KEYS.USER_DATA),
      ]);
  
      if (accessToken && userData) {
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        
        set({
          accessToken,
          refreshToken,
          user: userData,   // storage wrapper JSON parse ediyorsa düz koyabilirsin
          isAuthenticated: true,
        });
  
        try {
          await get().getCurrentUser();
        } catch (error) {
          console.log('Failed to fetch user data, token might be expired');
        }
      }
    } catch (error) {
      console.error('Initialize error:', error);
    }
  },  

  // ============================================================================
  // REGISTER
  // ============================================================================
  register: async ({ email, password, full_name }) => {
    set({ isLoading: true, error: null });
  
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        full_name,
      });
  
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Registration failed';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },  

  // ============================================================================
  // LOGIN
  // ============================================================================
  login: async ({ email, password }) => {
    set({ isLoading: true, error: null });
 
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, refresh_token } = response.data;
 
      await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
      await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);
 
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
 
      set({
        accessToken: access_token,
        refreshToken: refresh_token,
        isAuthenticated: true,
        isLoading: false,
      });
 
      await get().getCurrentUser();
 
      // ✅ LoginScreen’in beklediği format
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Login failed';
      set({ error: errorMessage, isLoading: false });
 
      // ✅ Burada throw yerine obje döndürelim
      return { success: false, error: errorMessage };
    }
  },
  

  // ============================================================================
  // LOGOUT
  // ============================================================================
  logout: async () => {
    try {
      await api.post('/auth/logout').catch(() => {});
    } catch (error) {
      console.log('Logout API error:', error);
    }
  
    await storage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    await storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    await storage.removeItem(STORAGE_KEYS.USER_DATA);
  
    delete api.defaults.headers.common['Authorization'];
  
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      error: null,
    });
  },
  

  // ============================================================================
  // GET CURRENT USER
  // ============================================================================
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      const userData = response.data;
  
      await storage.setItem(STORAGE_KEYS.USER_DATA, userData);
  
      set({ user: userData });
      return userData;
    } catch (error) {
      console.error('Get current user error:', error);
      
      if (error.response?.status === 401) {
        await get().logout();
      }
      
      throw error;
    }
  },
  

  // ============================================================================
  // REFRESH TOKEN
  // ============================================================================
  refreshAccessToken: async () => {
    try {
      const { refreshToken } = get();
      
      if (!refreshToken) {
        throw new Error('No refresh token');
      }
  
      const response = await api.post('/auth/refresh', {
        refresh_token: refreshToken,
      });
  
      const { access_token, refresh_token: new_refresh_token } = response.data;
  
      // ✅ storage + STORAGE_KEYS kullan
      await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
      await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, new_refresh_token);
  
      // Authorization header’ı güncelle
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
  
      set({
        accessToken: access_token,
        refreshToken: new_refresh_token,
      });
  
      return access_token;
    } catch (error) {
      console.error('Refresh token error:', error);
      await get().logout();
      throw error;
    }
  },  

  // ============================================================================
  // UPDATE PROFILE
  // ============================================================================
  updateProfile: async (profileData) => {
    set({ isLoading: true, error: null });
  
    try {
      const response = await api.put('/users/me', profileData);
      const updatedUser = response.data;
  
      // ✅ storage + STORAGE_KEYS.USER_DATA kullan
      await storage.setItem(STORAGE_KEYS.USER_DATA, updatedUser);
  
      set({
        user: updatedUser,
        isLoading: false,
      });
  
      return updatedUser;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to update profile';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },  

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================
  clearError: () => set({ error: null }),
}));


// ============================================================================
// API INTERCEPTOR - Auto refresh token on 401
// ============================================================================
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Add to queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { refreshAccessToken } = useAuthStore.getState();
        const newToken = await refreshAccessToken();
        
        processQueue(null, newToken);
        
        originalRequest.headers['Authorization'] = 'Bearer ' + newToken;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);