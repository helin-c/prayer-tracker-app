// ============================================================================
// FILE: src/stores/usePrayerStore.js (WITH AUTO-DETECTION)
// ============================================================================
import { create } from 'zustand';
import { prayersAPI } from '../api/prayers';
import { locationService } from '../services/location';
import { storage } from '../services/storage';
import { STORAGE_KEYS } from '../utils/constants';

const PRAYER_TIMES_CACHE_KEY = '@prayer_times_cache';
const LOCATION_CACHE_KEY = '@location_cache';
const CACHE_EXPIRY_KEY = '@prayer_times_expiry';

export const usePrayerStore = create((set, get) => ({
  prayerTimes: null,
  location: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
  fromCache: false,

  // Initialize from storage
  initialize: async () => {
    try {
      // Load cached location
      const cachedLocation = await storage.getItem(LOCATION_CACHE_KEY);
      if (cachedLocation) {
        set({ location: cachedLocation });
      }

      // Load cached prayer times
      const cachedTimes = await storage.getItem(PRAYER_TIMES_CACHE_KEY);
      const cacheExpiry = await storage.getItem(CACHE_EXPIRY_KEY);

      if (cachedTimes && cacheExpiry) {
        const now = new Date();
        const expiryDate = new Date(cacheExpiry);

        if (now.toDateString() === expiryDate.toDateString() && now < expiryDate) {
          set({
            prayerTimes: cachedTimes,
            lastUpdated: new Date(cachedTimes.lastFetched),
            fromCache: true,
          });
          console.log('✅ Loaded prayer times from cache');
          return;
        } else {
          await storage.removeItem(PRAYER_TIMES_CACHE_KEY);
          await storage.removeItem(CACHE_EXPIRY_KEY);
        }
      }

      // If we have location but no valid cache, fetch fresh data
      if (cachedLocation) {
        await get().fetchPrayerTimes(
          cachedLocation.latitude,
          cachedLocation.longitude
        );
      }
    } catch (error) {
      console.error('❌ Prayer store initialization error:', error);
    }
  },

  fetchPrayerTimes: async (latitude, longitude, forceRefresh = false) => {
    // Check cache validity
    if (!forceRefresh && get().fromCache && get().prayerTimes) {
      const cachedDate = get().prayerTimes.date;
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      if (cachedDate === today) {
        console.log('✅ Using existing cache');
        return { success: true, data: get().prayerTimes, fromCache: true };
      }
    }

    set({ isLoading: true, error: null, fromCache: false });

    try {
      // 🎯 Let backend auto-detect method/school based on location
      // Don't pass method/school parameters - backend will choose the best one
      const response = await prayersAPI.getPrayerTimes(latitude, longitude);
      const data = response.data;

      data.lastFetched = new Date().toISOString();

      // Cache until tomorrow at midnight
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      await storage.setItem(PRAYER_TIMES_CACHE_KEY, data);
      await storage.setItem(CACHE_EXPIRY_KEY, tomorrow.toISOString());

      set({
        prayerTimes: data,
        lastUpdated: new Date(),
        isLoading: false,
        fromCache: data.from_cache || false,
      });

      console.log('✅ Prayer times fetched successfully');
      return { success: true, data };
    } catch (error) {
      let errorMessage = 'Failed to fetch prayer times';

      // Check if it's an auth error
      if (error.response?.status === 401) {
        errorMessage = 'Please log in again to fetch prayer times';
      } else if (error.message?.includes('Network')) {
        // Try to use cache as fallback
        const cachedTimes = await storage.getItem(PRAYER_TIMES_CACHE_KEY);
        if (cachedTimes) {
          console.log('⚠️  Network error, using cached data');
          set({
            prayerTimes: cachedTimes,
            lastUpdated: new Date(cachedTimes.lastFetched),
            isLoading: false,
            fromCache: true,
            error: 'Using offline data - network unavailable',
          });
          return { success: true, data: cachedTimes, fromCache: true };
        }
        errorMessage = 'Network error. Please check your connection.';
      } else {
        errorMessage = error.response?.data?.detail || errorMessage;
      }

      set({ error: errorMessage, isLoading: false });
      console.error('❌ Failed to fetch prayer times:', errorMessage);
      return { success: false, error: errorMessage };
    }
  },

  fetchWithCurrentLocation: async (forceRefresh = false) => {
    set({ isLoading: true, error: null });

    try {
      console.log('📍 Getting current location...');
      const coords = await locationService.getCurrentLocation();
      
      console.log('🌍 Getting location info...');
      const locationInfo = await locationService.getCityCountry(
        coords.latitude,
        coords.longitude
      );

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const fullLocation = { ...coords, ...locationInfo, timezone };
      
      set({ location: fullLocation });
      await storage.setItem(LOCATION_CACHE_KEY, fullLocation);

      console.log(`✅ Location: ${fullLocation.city}, ${fullLocation.country}`);

      // Fetch prayer times (backend will auto-detect method)
      await get().fetchPrayerTimes(
        coords.latitude,
        coords.longitude,
        forceRefresh
      );

      // Save to backend (don't wait, don't fail on error)
      prayersAPI.saveLocation(fullLocation).catch(e => {
        console.log('⚠️  Failed to save location to backend (ignored):', e.message);
      });

      return { success: true };
    } catch (error) {
      let errorMessage = 'Failed to get location';

      if (error.message === 'Location permission denied') {
        errorMessage = 'Please enable location access in your device settings';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Location request timed out. Please try again.';
      }

      set({ error: errorMessage, isLoading: false });
      console.error('❌ Location error:', errorMessage);
      return { success: false, error: errorMessage };
    }
  },

  loadSavedLocation: async () => {
    try {
      const cachedLocation = await storage.getItem(LOCATION_CACHE_KEY);
      if (cachedLocation) {
        set({ location: cachedLocation });
      }

      // Try backend (don't fail if it errors)
      try {
        const response = await prayersAPI.getLocation();
        if (response.data) {
          set({ location: response.data });
          await storage.setItem(LOCATION_CACHE_KEY, response.data);
        }
      } catch (error) {
        console.log('⚠️  Could not load location from backend (using cache)');
      }
    } catch (error) {
      console.log('⚠️  No saved location');
    }
  },

  clearCache: async () => {
    await storage.removeItem(PRAYER_TIMES_CACHE_KEY);
    await storage.removeItem(CACHE_EXPIRY_KEY);
    await storage.removeItem(LOCATION_CACHE_KEY);
    set({
      prayerTimes: null,
      location: null,
      lastUpdated: null,
      fromCache: false,
    });
    console.log('🧹 Cache cleared');
  },

  isCacheValid: () => {
    const { prayerTimes, lastUpdated } = get();
    if (!prayerTimes || !lastUpdated) return false;

    const now = new Date();
    const lastFetch = new Date(lastUpdated);
    return now.toDateString() === lastFetch.toDateString();
  },

  clearError: () => set({ error: null }),
  setLoading: (isLoading) => set({ isLoading }),
}));