// ============================================================================
// FILE: src/api/backend.js 
// ============================================================================
import axios from 'axios';
import { STORAGE_KEYS, API_CONFIG } from '../utils/constants';
import { storage } from '../services/storage';

const api = axios.create({
  baseURL: `${API_CONFIG.BASE_URL}/api/v1`,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      // TODO Redis
      const token = await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Smart error logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if this is a 401 that will be handled by refresh
    const is401 = error.response?.status === 401;
    const willRetry = error.config && !error.config._retry;
    const isAuthEndpoint = error.config?.url?.includes('/auth/');
    
    // Don't log expected 401s that will be auto-fixed by token refresh
    if (is401 && willRetry && !isAuthEndpoint) {
      // This is a normal 401 that will be handled by refresh - don't log
      return Promise.reject(error);
    }
    
    // Log actual errors that matter
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      const url = error.config?.url;
      
      // Only log if it's not a handled 401
      if (!(is401 && willRetry)) {
        console.error('API Error:', {
          status,
          message: data?.detail || data?.message || 'Unknown error',
          url,
        });
      }
    } else if (error.request) {
      // Request was made but no response received (network error)
      console.error('Network Error:', {
        message: error.message,
        url: error.config?.url,
      });
    } else {
      // Something else happened
      console.error('Request Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Auth API methods
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  refreshToken: (refreshToken) =>
    api.post('/auth/refresh', { refresh_token: refreshToken }),
};

// User API methods
export const userAPI = {
  getUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  updateProfile: (data) => api.put('/users/me', data),
  changePassword: (data) => api.post('/users/me/change-password', data),
  deleteAccount: () => api.delete('/users/me'),
  deactivateAccount: () => api.post('/users/me/deactivate'),
};
export const streaksAPI = {
  getCurrentStreak: () => api.get('/prayers/streak/current'),
  getFriendStreak: (friendId) => api.get(`/friends/${friendId}/streak`),
  getStreakHistory: (params) => api.get('/prayers/streak/history', { params }),
};

export default api;