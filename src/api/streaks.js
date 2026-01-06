// ============================================================================
// FILE: src/api/streaks.js (NEW - DEDICATED STREAK API)
// ============================================================================
import api from './backend';

export const streaksAPI = {
  /**
   * Get current user's streak (real-time calculation)
   */
  getCurrentStreak: () => api.get('/prayers/streak/current'),

  /**
   * Get friend's streak
   */
  getFriendStreak: (friendId) => api.get(`/friends/${friendId}/streak`),

  /**
   * Get streak history for calendar view
   */
  getStreakHistory: (startDate, endDate) => 
    api.get('/prayers/streak/history', {
      params: { start_date: startDate, end_date: endDate }
    }),
};