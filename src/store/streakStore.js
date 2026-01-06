// ============================================================================
// FILE: src/store/streakStore.js (NEW - CENTRALIZED STREAK MANAGEMENT)
// ============================================================================
import { create } from 'zustand';
import { streaksAPI } from '../api/streaks';

export const useStreakStore = create((set, get) => ({
  // State
  userStreak: {
    current: 0,
    best: 0,
    lastUpdated: null,
  },
  friendStreaks: new Map(), // friendId -> streak data
  isLoading: false,
  error: null,

  // ============================================================================
  // FETCH USER STREAK (Real-time from backend)
  // ============================================================================
  fetchUserStreak: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await streaksAPI.getCurrentStreak();
      const data = response.data;

      set({
        userStreak: {
          current: data.current_streak,
          best: data.best_streak,
          lastUpdated: new Date(),
        },
        isLoading: false,
      });

      return data;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to fetch streak';
      console.error('Fetch streak error:', error);
      
      set({ 
        error: errorMessage, 
        isLoading: false,
      });

      throw error;
    }
  },

  // ============================================================================
  // FETCH FRIEND STREAK
  // ============================================================================
  fetchFriendStreak: async (friendId) => {
    try {
      const response = await streaksAPI.getFriendStreak(friendId);
      const data = response.data;

      // Cache friend streak
      const { friendStreaks } = get();
      friendStreaks.set(friendId, {
        current: data.current_streak,
        best: data.best_streak,
        lastUpdated: new Date(),
      });

      set({ friendStreaks: new Map(friendStreaks) });

      return data;
    } catch (error) {
      console.error('Fetch friend streak error:', error);
      throw error;
    }
  },

  // ============================================================================
  // GET CACHED FRIEND STREAK (avoid re-fetching)
  // ============================================================================
  getCachedFriendStreak: (friendId) => {
    const { friendStreaks } = get();
    return friendStreaks.get(friendId) || { current: 0, best: 0 };
  },

  // ============================================================================
  // INVALIDATE STREAK (force refresh on next access)
  // ============================================================================
  invalidateStreak: () => {
    set({ 
      userStreak: { current: 0, best: 0, lastUpdated: null } 
    });
  },

  // ============================================================================
  // CLEAR CACHE
  // ============================================================================
  clearCache: () => {
    set({
      userStreak: { current: 0, best: 0, lastUpdated: null },
      friendStreaks: new Map(),
    });
  },
}));

// Selectors
export const selectUserStreak = (state) => state.userStreak;
export const selectFriendStreaks = (state) => state.friendStreaks;
export const selectStreakIsLoading = (state) => state.isLoading;