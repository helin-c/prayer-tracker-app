// ============================================================================
// FILE: src/store/prayerTrackerStore.js
// ============================================================================
import { create } from 'zustand';
import api from '../api/backend';

export const usePrayerTrackerStore = create((set, get) => ({
  // State
  dayPrayers: null,
  weekPrayers: null,
  periodStats: null,
  isLoading: false,
  error: null,
  lastFetched: null,

  // Cache management
  cache: {
    dayPrayers: new Map(),
    weekPrayers: new Map(),
  },

  // ============================================================================
  // FETCH DAY PRAYERS
  // ============================================================================
  fetchDayPrayers: async (date) => {
    const { cache } = get();
    
    // Check cache first (5 minute TTL)
    const cached = cache.dayPrayers.get(date);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
      set({ dayPrayers: cached.data });
      return cached.data;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await api.get(`/prayers/day/${date}`);
      const data = response.data;
      
      // Update cache
      cache.dayPrayers.set(date, {
        data,
        timestamp: Date.now(),
      });

      set({ 
        dayPrayers: data, 
        isLoading: false,
        lastFetched: new Date(),
      });

      return data;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to fetch prayer data';
      console.error('Fetch day prayers error:', error);
      
      set({ 
        error: errorMessage, 
        isLoading: false,
        dayPrayers: null,
      });

      throw error;
    }
  },

  // ============================================================================
  // FETCH WEEK PRAYERS
  // ============================================================================
  fetchWeekPrayers: async (startDate) => {
    const { cache } = get();
    
    // Check cache
    const cached = cache.weekPrayers.get(startDate);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
      set({ weekPrayers: cached.data });
      return cached.data;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await api.get('/prayers/week', {
        params: { start_date: startDate },
      });
      
      const data = response.data;
      
      // Update cache
      cache.weekPrayers.set(startDate, {
        data,
        timestamp: Date.now(),
      });

      set({ 
        weekPrayers: data, 
        isLoading: false,
        lastFetched: new Date(),
      });

      return data;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to fetch week data';
      console.error('Fetch week prayers error:', error);
      
      set({ 
        error: errorMessage, 
        isLoading: false,
        weekPrayers: null,
      });

      throw error;
    }
  },

  // ============================================================================
  // TRACK PRAYER (Create/Update)
  // ============================================================================
  trackPrayer: async (prayerData) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.post('/prayers/track', prayerData);
      
      // Clear relevant caches
      get().clearCache(prayerData.prayer_date);

      set({ isLoading: false });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to track prayer';
      console.error('Track prayer error:', error);
      
      set({ 
        error: errorMessage, 
        isLoading: false,
      });

      throw error;
    }
  },

  // ============================================================================
  // UPDATE PRAYER LOG
  // ============================================================================
  updatePrayerLog: async (logId, updateData) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.put(`/prayers/track/${logId}`, updateData);
      
      // Clear all caches to be safe
      get().clearAllCache();

      set({ isLoading: false });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to update prayer';
      console.error('Update prayer error:', error);
      
      set({ 
        error: errorMessage, 
        isLoading: false,
      });

      throw error;
    }
  },

  // ============================================================================
  // FETCH PERIOD STATISTICS
  // ============================================================================
  fetchPeriodStats: async (period = 'month') => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.get('/prayers/stats/period', {
        params: { period },
      });
      
      const data = response.data;

      set({ 
        periodStats: data, 
        isLoading: false,
        lastFetched: new Date(),
      });

      return data;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to fetch statistics';
      console.error('Fetch stats error:', error);
      
      set({ 
        error: errorMessage, 
        isLoading: false,
        periodStats: null,
      });

      throw error;
    }
  },

  // ============================================================================
  // DELETE PRAYER LOG
  // ============================================================================
  deletePrayerLog: async (logId) => {
    set({ isLoading: true, error: null });

    try {
      await api.delete(`/prayers/track/${logId}`);
      
      // Clear all caches
      get().clearAllCache();

      set({ isLoading: false });
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to delete prayer';
      console.error('Delete prayer error:', error);
      
      set({ 
        error: errorMessage, 
        isLoading: false,
      });

      throw error;
    }
  },

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================
  clearCache: (date) => {
    const { cache } = get();
    
    // Clear specific date cache
    cache.dayPrayers.delete(date);
    
    // Clear week caches that might include this date
    cache.weekPrayers.forEach((value, key) => {
      cache.weekPrayers.delete(key);
    });
  },

  clearAllCache: () => {
    set({
      cache: {
        dayPrayers: new Map(),
        weekPrayers: new Map(),
      },
    });
  },

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================
  clearError: () => set({ error: null }),

  resetStore: () => set({
    dayPrayers: null,
    weekPrayers: null,
    periodStats: null,
    isLoading: false,
    error: null,
    lastFetched: null,
    cache: {
      dayPrayers: new Map(),
      weekPrayers: new Map(),
    },
  }),

  // Get completion percentage for specific date
  getCompletionForDate: (date) => {
    const { weekPrayers } = get();
    if (!weekPrayers?.days) return 0;
    
    const day = weekPrayers.days.find(d => d.date === date);
    return day?.completion_percentage || 0;
  },
}));