// ============================================================================
// FILE: src/store/authStore.js (FIXED - CLEARS STORES ON LOGOUT)
// ============================================================================
import { create } from 'zustand';
import api from '../api/backend';
import { storage } from '../services/storage';
import { STORAGE_KEYS } from '../utils/constants';
import i18n from '../i18n';
import languageManager from '../services/languageManager';
import widgetService from '../services/widgetService';

// ✅ NEW IMPORTS to clear data on logout
import { usePrayerTrackerStore } from './prayerTrackerStore';
import { useStreakStore } from './streakStore';

export const useAuthStore = create((set, get) => ({
  // State
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // ============================================================================
  // CLEAR AUTH - Complete cleanup
  // ============================================================================
  clearAuth: async () => {
    try {
      // Clear storage
      await Promise.all([
        storage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
        storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
        storage.removeItem(STORAGE_KEYS.USER_DATA),
      ]);

      // Clear axios header
      delete api.defaults.headers.common['Authorization'];

      // Reset state
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        error: null,
      });
    } catch (error) {
      console.error('Clear auth error:', error);
    }
  },

  // ============================================================================
  // INITIALIZE (Load tokens from storage)
  // ============================================================================
  initialize: async () => {
    try {
      set({ isLoading: true });

      const [accessToken, refreshToken, userData] = await Promise.all([
        storage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
        storage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
        storage.getItem(STORAGE_KEYS.USER_DATA),
      ]);

      // If we have both tokens and user data
      if (accessToken && refreshToken && userData) {
        // Set authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

        // Set user's preferred language and sync to widgets
        if (userData?.preferred_language) {
          try {
            await languageManager.changeLanguage(userData.preferred_language);
          } catch (error) {
            console.log('Language change error:', error);
          }
        }

        // Update state
        set({
          accessToken,
          refreshToken,
          user: userData,
          isAuthenticated: true,
          isLoading: false,
        });

        // Try to verify token validity by fetching user data
        try {
          await get().getCurrentUser();
        } catch (error) {
          console.log('Token verification failed, clearing auth');
          await get().clearAuth();
        }
      } else {
        // ✅ FIX: No valid auth data, clear auth BUT keep current language
        await get().clearAuth();
        set({ isLoading: false });
        
        // Ensure widgets use current language (from AsyncStorage/i18n)
        const currentLang = languageManager.getCurrentLanguage();
        await languageManager.syncLanguageToWidgets(currentLang);
      }
    } catch (error) {
      console.error('Initialize error:', error);
      await get().clearAuth();
      set({ isLoading: false });
    }
  },

  // ============================================================================
  // REGISTER
  // ============================================================================
  register: async ({ email, password, full_name, preferred_language }) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        full_name,
        preferred_language: preferred_language || i18n.language || 'en',
      });

      const userData = response.data;

      // Set language after registration and sync to widgets
      if (userData?.preferred_language) {
        try {
          await languageManager.changeLanguage(userData.preferred_language);
        } catch (error) {
          console.log('Language change error:', error);
        }
      }

      set({ isLoading: false });

      return { success: true, data: userData };
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Registration failed';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
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

      // Save tokens
      await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
      await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);

      // Set authorization header
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      // Update state
      set({
        accessToken: access_token,
        refreshToken: refresh_token,
        isAuthenticated: true,
        isLoading: false,
      });

      // Get user data and set language with widget sync
      const userData = await get().getCurrentUser();

      if (userData?.preferred_language) {
        try {
          await languageManager.changeLanguage(userData.preferred_language);
        } catch (error) {
          console.log('Language change error:', error);
        }
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Login failed';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  // ============================================================================
  // LOGOUT (✅ UPDATED - CLEARS STORES)
  // ============================================================================
  logout: async () => {
    try {
      // Try to call logout endpoint, but don't block on failure
      const { accessToken } = get();
      if (accessToken) {
        await api.post('/auth/logout').catch(() => {
          // Ignore logout API errors
        });
      }
    } catch (error) {
      console.log('Logout API error (ignored):', error);
    }

    // ✅ FIX: Get current language BEFORE clearing auth
    const currentLanguage = languageManager.getCurrentLanguage();
    
    // Clear auth
    await get().clearAuth();

    // ✅ NEW: Clear prayer and streak stores to prevent data mixing between users
    // We access .getState() because we are inside a vanilla JS function, not a React component
    usePrayerTrackerStore.getState().resetStore();
    useStreakStore.getState().clearCache();

    // ✅ FIX: Keep the current language (don't reset to 'en')
    try {
      console.log('🌐 Keeping language after logout:', currentLanguage);
      await languageManager.syncLanguageToWidgets(currentLanguage);
    } catch (error) {
      console.log('Language sync error on logout:', error);
    }
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

      // If 401, token is invalid
      if (error.response?.status === 401) {
        await get().clearAuth();
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
        throw new Error('No refresh token available');
      }

      const response = await api.post('/auth/refresh', {
        refresh_token: refreshToken,
      });

      const { access_token, refresh_token: new_refresh_token } = response.data;

      // Save new tokens
      await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
      await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, new_refresh_token);

      // Update authorization header
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      // Update state
      set({
        accessToken: access_token,
        refreshToken: new_refresh_token,
      });

      return access_token;
    } catch (error) {
      console.error('Refresh token error:', error);
      
      // If refresh fails, clear everything
      await get().clearAuth();
      
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

      await storage.setItem(STORAGE_KEYS.USER_DATA, updatedUser);

      // Update language if changed AND sync to widgets
      if (
        profileData.preferred_language &&
        profileData.preferred_language !== get().user?.preferred_language
      ) {
        try {
          console.log('🌐 Changing language to:', profileData.preferred_language);
          
          // This will update i18n, AsyncStorage, AND widgets
          await languageManager.changeLanguage(profileData.preferred_language);
          
          // Force reload all widgets to pick up new language immediately
          await widgetService.updateAllWidgets();
          
          console.log('✅ Language and widgets updated successfully');
        } catch (error) {
          console.error('❌ Language change error:', error);
        }
      }

      set({
        user: updatedUser,
        isLoading: false,
      });

      return { success: true, data: updatedUser };
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail || 'Failed to update profile';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  // ============================================================================
  // LANGUAGE MANAGEMENT
  // ============================================================================

  getCurrentLanguage: () => {
    return i18n.language || 'en';
  },

  changeLanguage: async (languageCode) => {
    try {
      // Use language manager to change language (includes widget sync)
      await languageManager.changeLanguage(languageCode);

      // Update user profile if authenticated
      if (get().isAuthenticated) {
        const result = await get().updateProfile({
          preferred_language: languageCode,
        });
        return result;
      }

      return { success: true };
    } catch (error) {
      console.error('Language change error:', error);
      return { success: false, error: error.message };
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

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't retry auth endpoints
    if (
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register') ||
      originalRequest.url?.includes('/auth/refresh')
    ) {
      return Promise.reject(error);
    }

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
        
        // Clear auth on refresh failure
        const { clearAuth } = useAuthStore.getState();
        await clearAuth();
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// SELECTORS
// ============================================================================
export const selectUser = (state) => state.user;
export const selectIsAuthenticated = (state) => state.isAuthenticated;
export const selectAuthIsLoading = (state) => state.isLoading;
export const selectAuthError = (state) => state.error;
export const selectAccessToken = (state) => state.accessToken;