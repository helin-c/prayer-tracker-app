// ============================================================================
// FILE: src/services/notificationService.js
// ============================================================================
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { storage } from './storage';
import i18n from '../i18n'; // ✅ ADDED: Import i18n

// ✅ Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  async initialize() {
    try {
      const token = await this.registerForPushNotifications();
      this.expoPushToken = token;

      if (Platform.OS === 'android') {
        await this.setupNotificationChannels();
      }

      this.setupListeners();

      console.log('✅ Notifications initialized');
      return { success: true, token };
    } catch (error) {
      console.error('❌ Notification initialization error:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================================================
  // PERMISSION & TOKEN
  // ============================================================================

  async registerForPushNotifications() {
    if (!Device.isDevice) {
      console.warn('Must use physical device for push notifications');
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        throw new Error('Permission to receive notifications was denied');
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId || 
                       Constants.easConfig?.projectId;

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      console.log('📱 Push token:', token.data);
      await storage.setItem('push_token', token.data);
      return token.data;
    } catch (error) {
      console.error('❌ Error getting push token:', error);
      throw error;
    }
  }

  // ============================================================================
  // NOTIFICATION CHANNELS (Android Only)
  // ============================================================================

  async setupNotificationChannels() {
    try {
      await Notifications.setNotificationChannelAsync('prayer-reminders', {
        name: 'Prayer Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#5BA895',
      });

      await Notifications.setNotificationChannelAsync('prayer-completion', {
        name: 'Prayer Completion',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
      });

      await Notifications.setNotificationChannelAsync('daily-verses', {
        name: 'Daily Verses',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('streaks', {
        name: 'Streaks',
        importance: Notifications.AndroidImportance.LOW,
        sound: 'default',
      });

      // ✅ ADDED: Social channel with High Importance for instant alerts
      await Notifications.setNotificationChannelAsync('social', {
        name: 'Social Notifications',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#5BA895',
      });

      console.log('✅ Notification channels created');
    } catch (error) {
      console.error('❌ Error creating channels:', error);
    }
  }

  // ============================================================================
  // LISTENERS
  // ============================================================================

  setupListeners() {
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('📬 Notification received:', notification);
      }
    );

    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('👆 Notification tapped:', response.notification.request.content.data);
      }
    );
  }

  cleanup() {
    if (this.notificationListener) Notifications.removeNotificationSubscription(this.notificationListener);
    if (this.responseListener) Notifications.removeNotificationSubscription(this.responseListener);
  }

  // ============================================================================
  // SCHEDULE NOTIFICATIONS (FIXED TRIGGERS)
  // ============================================================================

  // 1. Single Prayer Reminder (One-time) - i18n
  async schedulePrayerReminder(prayerName, prayerTime, minutesBefore = 5) {
    try {
      const notificationTime = new Date(prayerTime);
      notificationTime.setMinutes(notificationTime.getMinutes() - minutesBefore);

      if (notificationTime <= new Date()) {
        console.log(`⏭️  ${prayerName} time is in the past, skipping reminder`);
        return null;
      }

      // ✅ ADDED: Use i18n for notification text
      const title = i18n.t('notifications.prayerReminderTitle', { 
         prayer: prayerName, 
         minutes: minutesBefore 
       });
      const body = i18n.t('notifications.prayerReminderBody');

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: `${title} ⏰`,
          body,
          sound: 'default',
          data: { type: 'prayer_reminder', prayerName, prayerTime: prayerTime.toISOString() },
          ...(Platform.OS === 'android' && { color: '#5BA895' }),
        },
        trigger: {
          type: 'date',
          date: notificationTime,
          ...(Platform.OS === 'android' && { channelId: 'prayer-reminders' }),
        },
      });

      return identifier;
    } catch (error) {
      console.error('❌ Error scheduling prayer reminder:', error);
      return null;
    }
  }

  // 2. Prayer Completion Reminder (One-time) - i18n
  async schedulePrayerCompletionReminder(prayerName, prayerTime, minutesAfter = 40) {
    try {
      const notificationTime = new Date(prayerTime);
      notificationTime.setMinutes(notificationTime.getMinutes() + minutesAfter);

      if (notificationTime <= new Date()) return null;

      // ✅ ADDED: Use i18n
      const title = i18n.t('notifications.completionReminderTitle', { prayer: prayerName });
      const body = i18n.t('notifications.completionReminderBody');

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: `${title} ✅`,
          body,
          sound: 'default',
          data: { type: 'prayer_completion', prayerName, prayerTime: prayerTime.toISOString() },
          ...(Platform.OS === 'android' && { color: '#5BA895' }),
        },
        trigger: {
          type: 'date',
          date: notificationTime,
          ...(Platform.OS === 'android' && { channelId: 'prayer-completion' }),
        },
      });

      return identifier;
    } catch (error) {
      console.error('❌ Error scheduling completion reminder:', error);
      return null;
    }
  }

  // Helper to schedule all daily prayers
  async scheduleDailyPrayerNotifications(prayerTimes, reminderMinutesBefore = 5, completionMinutesAfter = 40) {
    try {
      // Clear old specific prayer notifications first
      await this.cancelAllPrayerNotifications();

      const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
      const scheduledIds = [];

      for (const prayerName of prayers) {
        const prayer = prayerTimes[prayerName];
        if (!prayer || !prayer.time) continue;

        const [hours, minutes] = prayer.time.split(':').map(Number);
        const prayerTime = new Date();
        prayerTime.setHours(hours, minutes, 0, 0);

        const reminderId = await this.schedulePrayerReminder(
          prayerName.charAt(0).toUpperCase() + prayerName.slice(1),
          prayerTime,
          reminderMinutesBefore
        );
        if (reminderId) scheduledIds.push(reminderId);

        const completionId = await this.schedulePrayerCompletionReminder(
          prayerName.charAt(0).toUpperCase() + prayerName.slice(1),
          prayerTime,
          completionMinutesAfter
        );
        if (completionId) scheduledIds.push(completionId);
      }

      await storage.setItem('scheduled_notifications', scheduledIds);
      console.log(`✅ Scheduled ${scheduledIds.length} prayer notifications`);
      return { success: true, count: scheduledIds.length };
    } catch (error) {
      console.error('❌ Error scheduling daily notifications:', error);
      return { success: false, error: error.message };
    }
  }

  // 3. Daily Verse (Recurring Daily) - i18n
  async scheduleDailyVerse(hour = 7, minute = 0) {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: i18n.t('notifications.dailyVerseTitle'),
          body: i18n.t('notifications.dailyVerseBody'),
          sound: 'default',
          data: { type: 'daily_verse' },
          ...(Platform.OS === 'android' && { color: '#5BA895' }),
        },
        trigger: {
          type: 'calendar',
          hour,
          minute,
          repeats: true,
          ...(Platform.OS === 'android' && { channelId: 'daily-verses' }),
        },
      });
  
      console.log('✅ Scheduled daily verse:', identifier);
      return identifier;
    } catch (error) {
      console.error('❌ Error scheduling daily verse:', error);
      return null;
    }
  }

  // 4. Streak Reminder (Recurring Daily) - i18n
  async scheduleStreakReminder(hour = 21, minute = 0) {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: i18n.t('notifications.streakReminderTitle'),
          body: i18n.t('notifications.streakReminderBody'),
          sound: 'default',
          data: { type: 'streak' },
          ...(Platform.OS === 'android' && { color: '#5BA895' }),
        },
        trigger: {
          type: 'calendar',
          hour,
          minute,
          repeats: true,
          ...(Platform.OS === 'android' && { channelId: 'streaks' }),
        },
      });
  
      console.log('✅ Scheduled streak reminder:', identifier);
      return identifier;
    } catch (error) {
      console.error('❌ Error scheduling streak reminder:', error);
      return null;
    }
  }

  // 5. Jumuah Reminder (Recurring Weekly) - i18n
  async scheduleJumuahReminder(hour = 12, minute = 0) {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: i18n.t('notifications.jumuahReminderTitle'),
          body: i18n.t('notifications.jumuahReminderBody'),
          sound: 'default',
          data: { type: 'jumuah_reminder' },
          ...(Platform.OS === 'android' && { color: '#5BA895' }),
        },
        trigger: {
          type: 'calendar',
          weekday: 6, // Friday
          hour,
          minute,
          repeats: true,
          ...(Platform.OS === 'android' && { channelId: 'prayer-reminders' }),
        },
      });
  
      console.log('✅ Scheduled Jumuah reminder:', identifier);
      return identifier;
    } catch (error) {
      console.error('❌ Error scheduling Jumuah reminder:', error);
      return null;
    }
  }

  // ============================================================================
  // INSTANT NOTIFICATION (For Testing & Social)
  // ============================================================================
  
  async sendInstantNotification(title, body, data = {}) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
          ...(Platform.OS === 'android' && {
             color: '#5BA895',
            channelId: 'social' // Ensured this channel exists in setupNotificationChannels
          }),
        },
        trigger: null, // Send immediately
      });
      console.log('✅ Instant notification sent');
      return { success: true };
    } catch (error) {
      console.error('❌ Error sending instant notification:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================================================
  // HELPERS & CANCELLATION
  // ============================================================================

  async cancelNotification(identifier) {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error('❌ Error cancelling notification:', error);
    }
  }

  async cancelAllPrayerNotifications() {
    try {
      const scheduledIds = (await storage.getItem('scheduled_notifications')) || [];
      for (const id of scheduledIds) {
        await this.cancelNotification(id);
      }
      await storage.removeItem('scheduled_notifications');
    } catch (error) {
      console.error('❌ Error cancelling prayer notifications:', error);
    }
  }

  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('🗑️  Cancelled all notifications');
    } catch (error) {
      console.error('❌ Error cancelling all notifications:', error);
    }
  }
}

export const notificationService = new NotificationService();