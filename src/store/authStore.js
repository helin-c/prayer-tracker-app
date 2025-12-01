import { create } from 'zustand';
import { authAPI } from '../api/backend';
import { storage } from '../services/storage';
import { STORAGE_KEYS } from '../utils/constants';

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,

  // Initialize - Check for stored tokens
  initialize: async () => {
    set({ isLoading: true });
    try {
      const accessToken = await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      const user = await storage.getItem(STORAGE_KEYS.USER_DATA);

      if (accessToken && refreshToken && user) {
        set({
          accessToken,
          refreshToken,
          user,
          isAuthenticated: true,
        });
        
        // Try to fetch fresh user data
        try {
          await get().fetchUser();
        } catch (error) {
          // If fetch fails, tokens might be expired - logout
          console.log('Token expired, logging out');
          await get().logout();
        }
      }
      
      set({ isLoading: false });
    } catch (error) {
      console.error('Initialize error:', error);
      set({ isLoading: false });
    }
  },

  // Register
  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.register(userData);
      
      // After registration, auto-login
      await get().login({
        email: userData.email,
        password: userData.password,
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Registration failed';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Login
  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login(credentials);
      const { access_token, refresh_token } = response.data;

      // Save tokens
      await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
      await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);

      set({
        accessToken: access_token,
        refreshToken: refresh_token,
      });

      // Fetch user data
      await get().fetchUser();

      set({ isLoading: false });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Login failed';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Fetch user data
  fetchUser: async () => {
    try {
      const response = await authAPI.getMe();
      const userData = response.data;

      await storage.setItem(STORAGE_KEYS.USER_DATA, userData);

      set({
        user: userData,
        isAuthenticated: true,
      });
      
      return { success: true };
    } catch (error) {
      console.error('Fetch user error:', error);
      
      // If unauthorized, clear everything
      if (error.response?.status === 401) {
        await get().clearAuthData();
      }
      
      throw error;
    }
  },

  // Clear auth data (helper function)
  clearAuthData: async () => {
    await storage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    await storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    await storage.removeItem(STORAGE_KEYS.USER_DATA);

    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      error: null,
    });
  },

  // Logout
  logout: async () => {
    try {
      // Only call API if we have a token
      if (get().accessToken) {
        await authAPI.logout();
      }
    } catch (error) {
      console.log('Logout API error (ignoring):', error.message);
    } finally {
      // Always clear local data
      await get().clearAuthData();
    }
  },

  // Update user
  updateUser: (userData) => {
    set({ user: { ...get().user, ...userData } });
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
