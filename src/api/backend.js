// ============================================================================
// FILE: src/api/backend.js
// ============================================================================
import axios from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from '../utils/constants';
import { storage } from '../services/storage';

// İstersen API_BASE_URL yerine sadece EXPO_PUBLIC_API_URL da kullanabilirsin,
// ama şu hali de çalışır, önemli olan baseURL ile tutarlı olması.
const API_BASE = process.env.EXPO_PUBLIC_API_URL || API_BASE_URL || 'http://192.168.1.132:8000';

const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  timeout: 10000,
});

// ---------------------------------------------------------------------------
// Request interceptor - Add auth token
// ---------------------------------------------------------------------------
api.interceptors.request.use(
  async (config) => {
    const token = await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);


// ---------------------------------------------------------------------------
// Auth API methods
// ---------------------------------------------------------------------------
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),

  refreshToken: (refreshToken) =>
    api.post('/auth/refresh', { refresh_token: refreshToken }),
};

// ---------------------------------------------------------------------------
// User API methods
// ---------------------------------------------------------------------------
export const userAPI = {
  getUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  updateProfile: (data) => api.put('/users/me', data),
  deleteAccount: () => api.delete('/users/me'),
};

export default api;
