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

// Response interceptor - Log errors for debugging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API Error Response:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.baseURL + error.config?.url,
      });
    } else if (error.request) {
      console.error('API Network Error:', {
        message: error.message,
        url: error.config?.baseURL + error.config?.url,
      });
    } else {
      console.error('API Error:', error.message);
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
  deleteAccount: () => api.delete('/users/me'),
};

export default api;
