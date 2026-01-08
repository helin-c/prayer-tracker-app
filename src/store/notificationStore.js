// ============================================================================
// FILE: src/store/notificationStore.js (UPDATED WITH PRAYER TIME NOTIFICATIONS)
// ============================================================================
import { create } from 'zustand';
import { storage } from '../services/storage';
import { notificationService } from '../services/notificationService';
import api from '../api/backend';

export const useNotificationStore = create((set, get) => ({
  // State
  isEnabled: true,
  prayerTimeNotificationsEnabled: true, // ✅ NEW: For Azan at prayer time
  prayerRemindersEnabled: true, // Before prayer time
  completionRemindersEnabled: true, // After prayer time
  dailyVerseEnabled: true,
  streakReminderEnabled: true,
  
  // Jumuah State
  jumuahReminderEnabled: true,
  jumuahReminderTime: { hour: 12, minute: 0 },
  jumuahNotificationId: null,

  // Notification IDs
  dailyVerseNotificationId: null,
  streakReminderNotificationId: null,

  // Timing settings
  reminderMinutesBefore: 5,
  completionMinutesAfter: 40,
  dailyVerseTime: { hour: 7, minute: 0 },
  streakReminderTime: { hour: 21, minute: 0 },
  
  pushToken: null,
  isInitialized: false,

  // ============================================================================
  // INITIALIZE
  // ============================================================================
  initialize: async () => {
    try {
      const settings = await storage.getItem('notification_settings');
      if (settings) {
        set(settings);
      }

      const result = await notificationService.initialize();
      
      if (result.success) {
        set({ 
          isInitialized: true,
          pushToken: result.token,
        });

        if (result.token) {
          try {
            const saveResult = await get().savePushTokenToBackend(result.token);
            if (saveResult.success) {
              console.log('✅ Push token saved to backend');
            }
          } catch (error) {
            console.error('❌ Error saving push token:', error);
          }
        }

        const state = get();
        
        if (state.dailyVerseEnabled && !state.dailyVerseNotificationId) {
          const { hour, minute } = state.dailyVerseTime;
          const notificationId = await notificationService.scheduleDailyVerse(hour, minute);
          set({ dailyVerseNotificationId: notificationId });
        }
        
        if (state.streakReminderEnabled && !state.streakReminderNotificationId) {
          const { hour, minute } = state.streakReminderTime;
          const notificationId = await notificationService.scheduleStreakReminder(hour, minute);
          set({ streakReminderNotificationId: notificationId });
        }
        
        if (state.jumuahReminderEnabled && !state.jumuahNotificationId) {
          const { hour, minute } = state.jumuahReminderTime;
          const notificationId = await notificationService.scheduleJumuahReminder(hour, minute);
          set({ jumuahNotificationId: notificationId });
        }
      }

      return result;
    } catch (error) {
      console.error('Notification store initialization error:', error);
      return { success: false, error: error.message };
    }
  },

  // ============================================================================
  // BACKEND SYNC
  // ============================================================================
  savePushTokenToBackend: async (pushToken) => {
    try {
      await api.post('/users/me/push-token', null, {
        params: { push_token: pushToken }
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error saving push token to backend:', error);
      return { success: false, error: error.message };
    }
  },

  // ============================================================================
  // SETTINGS
  // ============================================================================
  updateSettings: async (newSettings) => {
    try {
      const currentSettings = get();
      const updatedSettings = { ...currentSettings, ...newSettings };
      
      await storage.setItem('notification_settings', updatedSettings);
      set(updatedSettings);
      
      if (
        newSettings.reminderMinutesBefore !== undefined ||
        newSettings.completionMinutesAfter !== undefined ||
        newSettings.prayerTimeNotificationsEnabled !== undefined
      ) {
        try {
          const { usePrayerStore } = await import('./prayerStore');
          const prayerTimes = usePrayerStore.getState().prayerTimes;
          
          if (prayerTimes) {
            console.log('🔄 Rescheduling prayer notifications with new settings...');
            await get().schedulePrayerNotifications(prayerTimes);
          }
        } catch (error) {
          console.error('Error rescheduling prayers:', error);
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error updating notification settings:', error);
      return { success: false, error: error.message };
    }
  },

  // ✅ NEW: Toggle Prayer Time Notifications (Azan)
  togglePrayerTimeNotifications: async () => {
    const newValue = !get().prayerTimeNotificationsEnabled;
    
    set({ prayerTimeNotificationsEnabled: newValue });
    
    await storage.setItem('notification_settings', {
      ...get(),
      prayerTimeNotificationsEnabled: newValue
    });
    
    // Reschedule to apply changes
    try {
      const { usePrayerStore } = await import('./prayerStore');
      const prayerTimes = usePrayerStore.getState().prayerTimes;
      
      if (prayerTimes) {
        await get().schedulePrayerNotifications(prayerTimes);
      }
    } catch (error) {
      console.error('Error rescheduling:', error);
    }
    
    console.log('✅ Prayer time notifications (Azan) toggled:', newValue);
    return { success: true };
  },

  togglePrayerReminders: async () => {
    const newValue = !get().prayerRemindersEnabled;
    
    set({ prayerRemindersEnabled: newValue });
    
    await storage.setItem('notification_settings', {
      ...get(),
      prayerRemindersEnabled: newValue
    });
    
    console.log('✅ Prayer reminders toggled:', newValue);
    return { success: true };
  },

  toggleCompletionReminders: async () => {
    const newValue = !get().completionRemindersEnabled;
    return get().updateSettings({ completionRemindersEnabled: newValue });
  },

  toggleDailyVerse: async () => {
    const newValue = !get().dailyVerseEnabled;
    
    if (newValue) {
      const { hour, minute } = get().dailyVerseTime;
      const notificationId = await notificationService.scheduleDailyVerse(hour, minute);
      
      await get().updateSettings({ 
        dailyVerseEnabled: newValue,
        dailyVerseNotificationId: notificationId,
      });
    } else {
      const { dailyVerseNotificationId } = get();
      if (dailyVerseNotificationId) {
        await notificationService.cancelNotification(dailyVerseNotificationId);
      }
      
      await get().updateSettings({ 
        dailyVerseEnabled: newValue,
        dailyVerseNotificationId: null,
      });
    }
    
    return { success: true };
  },

  toggleStreakReminder: async () => {
    const newValue = !get().streakReminderEnabled;
    
    if (newValue) {
      const { hour, minute } = get().streakReminderTime;
      const notificationId = await notificationService.scheduleStreakReminder(hour, minute);
      
      await get().updateSettings({ 
        streakReminderEnabled: newValue,
        streakReminderNotificationId: notificationId,
      });
    } else {
      const { streakReminderNotificationId } = get();
      if (streakReminderNotificationId) {
        await notificationService.cancelNotification(streakReminderNotificationId);
      }
      
      await get().updateSettings({ 
        streakReminderEnabled: newValue,
        streakReminderNotificationId: null,
      });
    }
    
    return { success: true };
  },

  toggleJumuahReminder: async () => {
    const newValue = !get().jumuahReminderEnabled;
    
    if (newValue) {
      const { hour, minute } = get().jumuahReminderTime;
      const notificationId = await notificationService.scheduleJumuahReminder(hour, minute);
      
      await get().updateSettings({ 
        jumuahReminderEnabled: newValue,
        jumuahNotificationId: notificationId,
      });
    } else {
      const { jumuahNotificationId } = get();
      if (jumuahNotificationId) {
        await notificationService.cancelNotification(jumuahNotificationId);
      }
      
      await get().updateSettings({ 
        jumuahReminderEnabled: newValue,
        jumuahNotificationId: null,
      });
    }
    
    return { success: true };
  },

  updateJumuahReminderTime: async (hour, minute) => {
    try {
      const { jumuahNotificationId, jumuahReminderEnabled } = get();
      if (jumuahNotificationId) {
        await notificationService.cancelNotification(jumuahNotificationId);
      }
      
      let newNotificationId = null;
      if (jumuahReminderEnabled) {
        newNotificationId = await notificationService.scheduleJumuahReminder(hour, minute);
      }
      
      await get().updateSettings({
        jumuahReminderTime: { hour, minute },
        jumuahNotificationId: newNotificationId,
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating Jumuah reminder time:', error);
      return { success: false, error: error.message };
    }
  },

  // ============================================================================
  // SCHEDULE (UPDATED)
  // ============================================================================
  schedulePrayerNotifications: async (prayerTimes) => {
    try {
      const { 
        prayerTimeNotificationsEnabled,
        prayerRemindersEnabled, 
        completionRemindersEnabled,
        reminderMinutesBefore,
        completionMinutesAfter 
      } = get();
      
      if (!prayerTimeNotificationsEnabled && !prayerRemindersEnabled && !completionRemindersEnabled) {
        console.log('All prayer notifications disabled');
        return { success: true, count: 0 };
      }

      // ✅ Pass the prayerTimeNotificationsEnabled flag
      const result = await notificationService.scheduleDailyPrayerNotifications(
        prayerTimes,
        reminderMinutesBefore,
        completionMinutesAfter,
        prayerTimeNotificationsEnabled // NEW parameter
      );
      
      return result;
    } catch (error) {
      console.error('Error scheduling prayer notifications:', error);
      return { success: false, error: error.message };
    }
  },

  // ============================================================================
  // HELPERS
  // ============================================================================
  getPushToken: () => get().pushToken,
  
  getScheduledNotifications: async () => {
    return notificationService.getAllScheduledNotifications();
  },
  
  getAllNotificationIds: () => {
    const state = get();
    return {
      dailyVerse: state.dailyVerseNotificationId,
      streakReminder: state.streakReminderNotificationId,
      jumuah: state.jumuahNotificationId,
    };
  },
}));

// ============================================================================
// SELECTORS
// ============================================================================
export const selectPrayerTimeNotificationsEnabled = (state) => state.prayerTimeNotificationsEnabled; // NEW
export const selectPrayerRemindersEnabled = (state) => state.prayerRemindersEnabled;
export const selectCompletionRemindersEnabled = (state) => state.completionRemindersEnabled;
export const selectDailyVerseEnabled = (state) => state.dailyVerseEnabled;
export const selectStreakReminderEnabled = (state) => state.streakReminderEnabled;
export const selectReminderMinutesBefore = (state) => state.reminderMinutesBefore;
export const selectCompletionMinutesAfter = (state) => state.completionMinutesAfter;
export const selectJumuahReminderEnabled = (state) => state.jumuahReminderEnabled;
export const selectJumuahReminderTime = (state) => state.jumuahReminderTime;