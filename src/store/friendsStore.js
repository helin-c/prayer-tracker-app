// ============================================================================
// FILE: src/store/friendsStore.js (OPTIMIZED)
// ============================================================================
import { create } from 'zustand';
import api from '../api/backend';
import widgetService from '../services/widgetService';

export const useFriendsStore = create((set, get) => ({
  // State
  friends: [],
  pendingRequests: [],
  sentRequests: [],
  friendsCount: {
    current_count: 0,
    max_limit: 5,
    can_add_more: true,
  },
  
  // Notification Preferences
  notificationPreferences: {
    friend_requests: true,
    friend_prayers: true,
    friend_streaks: true,
  },
  
  isLoading: false,
  error: null,

  // ============================================================================
  // FETCH FRIENDS
  // ============================================================================
  fetchFriends: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.get('/friends');
      
      set({ 
        friends: response.data, 
        isLoading: false 
      });
      
      // Also fetch count after getting friends
      await get().fetchFriendsCount();

      // ✅ UPDATE WIDGET
      widgetService.updateFriendStreaksWidget(response.data);
      
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to fetch friends';
      console.error('Fetch friends error:', error);
      
      set({ 
        error: errorMessage, 
        isLoading: false 
      });
      
      throw error;
    }
  },

  // ============================================================================
  // FETCH FRIENDS COUNT
  // ============================================================================
  fetchFriendsCount: async () => {
    try {
      const response = await api.get('/friends/count');
      set({ friendsCount: response.data });
      return response.data;
    } catch (error) {
      console.error('Fetch friends count error:', error);
    }
  },

  // ============================================================================
  // FETCH NOTIFICATION PREFERENCES
  // ============================================================================
  fetchNotificationPreferences: async () => {
    try {
      const response = await api.get('/users/me');
      
      if (response.data.notification_preferences) {
        set({ 
          notificationPreferences: response.data.notification_preferences 
        });
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    }
  },

  // ============================================================================
  // UPDATE NOTIFICATION PREFERENCES
  // ============================================================================
  updateNotificationPreferences: async (preferences) => {
    try {
      await api.put('/users/me', {
        notification_preferences: preferences
      });
      
      set({ notificationPreferences: preferences });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return { success: false, error: error.message };
    }
  },

  // ============================================================================
  // FETCH PENDING REQUESTS
  // ============================================================================
  fetchPendingRequests: async () => {
    try {
      const response = await api.get('/friends/requests/pending');
      set({ pendingRequests: response.data });
      return response.data;
    } catch (error) {
      console.error('Fetch pending requests error:', error);
      throw error;
    }
  },

  // ============================================================================
  // FETCH SENT REQUESTS
  // ============================================================================
  fetchSentRequests: async () => {
    try {
      const response = await api.get('/friends/requests/sent');
      set({ sentRequests: response.data });
      return response.data;
    } catch (error) {
      console.error('Fetch sent requests error:', error);
      throw error;
    }
  },

  // ============================================================================
  // SEND FRIEND REQUEST
  // ============================================================================
  sendFriendRequest: async (email) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.post('/friends/request', { friend_email: email });
      
      // Refresh sent requests
      await get().fetchSentRequests();
      
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to send friend request';
      console.error('Send friend request error:', error);
      set({ 
        error: errorMessage, 
        isLoading: false 
      });
      throw error;
    }
  },

  // ============================================================================
  // ACCEPT FRIEND REQUEST
  // ============================================================================
  acceptFriendRequest: async (requestId) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.post(`/friends/request/${requestId}/accept`);
      
      // Refresh friends and pending requests
      await Promise.all([
        get().fetchFriends(),
        get().fetchPendingRequests(),
      ]);
      
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to accept request';
      console.error('Accept friend request error:', error);
      set({ 
        error: errorMessage, 
        isLoading: false 
      });
      throw error;
    }
  },

  // ============================================================================
  // REJECT FRIEND REQUEST
  // ============================================================================
  rejectFriendRequest: async (requestId) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.post(`/friends/request/${requestId}/reject`);
      
      // Refresh pending requests
      await get().fetchPendingRequests();
      
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to reject request';
      console.error('Reject friend request error:', error);
      set({ 
        error: errorMessage, 
        isLoading: false 
      });
      throw error;
    }
  },

  // ============================================================================
  // CANCEL SENT REQUEST
  // ============================================================================
  cancelSentRequest: async (requestId) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.delete(`/friends/request/${requestId}/cancel`);
      
      // Refresh sent requests
      await get().fetchSentRequests();
      
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to cancel request';
      console.error('Cancel sent request error:', error);
      set({ 
        error: errorMessage, 
        isLoading: false 
      });
      throw error;
    }
  },

  // ============================================================================
  // REMOVE FRIEND
  // ============================================================================
  removeFriend: async (friendshipId) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.delete(`/friends/${friendshipId}`);
      
      // Refresh friends list and count
      await get().fetchFriends();
      
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to remove friend';
      console.error('Remove friend error:', error);
      set({ 
        error: errorMessage, 
        isLoading: false 
      });
      throw error;
    }
  },

  // ============================================================================
  // GET FRIEND'S WEEK PRAYERS
  // ============================================================================
  getFriendWeekPrayers: async (friendId, startDate) => {
    try {
      const response = await api.get(`/friends/${friendId}/prayers/week`, {
        params: { start_date: startDate },
      });
      return response.data;
    } catch (error) {
      console.error('Get friend week prayers error:', error);
      throw error;
    }
  },

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================
  clearError: () => set({ error: null }),

  resetStore: () => set({
    friends: [],
    pendingRequests: [],
    sentRequests: [],
    friendsCount: {
      current_count: 0,
      max_limit: 5,
      can_add_more: true,
    },
    notificationPreferences: {
      friend_requests: true,
      friend_prayers: true,
      friend_streaks: true,
    },
    isLoading: false,
    error: null,
  }),
}));

// ============================================================================
// SELECTORS
// ============================================================================
export const selectFriends = (state) => state.friends;
export const selectPendingRequests = (state) => state.pendingRequests;
export const selectSentRequests = (state) => state.sentRequests;
export const selectFriendsCount = (state) => state.friendsCount;
export const selectNotificationPreferences = (state) => state.notificationPreferences;
export const selectFriendsIsLoading = (state) => state.isLoading;
export const selectFriendsError = (state) => state.error;