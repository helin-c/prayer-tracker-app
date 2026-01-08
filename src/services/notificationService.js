// ============================================================================
// FILE: src/services/notificationService.js (ENHANCED WITH AZAN)
// ============================================================================
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import Constants from 'expo-constants';
import { storage } from './storage';
import i18n from '../i18n';

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
    this.azanSound = null;
    this.isPlayingAzan = false;
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

      // ✅ NEW: Load Azan sound
      await this.loadAzanSound();

      this.setupListeners();

      console.log('✅ Notifications initialized with Azan support');
      return { success: true, token };
    } catch (error) {
      console.error('❌ Notification initialization error:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================================================
  // AZAN SOUND MANAGEMENT (NEW)
  // ============================================================================

  async loadAzanSound() {
    try {
      // Configure audio mode
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      // Load Azan audio file
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/azan.mp3'), // You'll add this file
        { shouldPlay: false, volume: 1.0 },
        this.onAzanPlaybackStatusUpdate
      );

      this.azanSound = sound;
      console.log('✅ Azan sound loaded');
    } catch (error) {
      console.error('❌ Error loading Azan sound:', error);
    }
  }

  onAzanPlaybackStatusUpdate = (status) => {
    if (status.didJustFinish) {
      this.isPlayingAzan = false;
      console.log('🎵 Azan playback finished');
    }
  };

  async playAzan() {
    try {
      if (this.isPlayingAzan) {
        console.log('⚠️ Azan already playing');
        return;
      }

      if (!this.azanSound) {
        console.warn('⚠️ Azan sound not loaded');
        return;
      }

      this.isPlayingAzan = true;
      
      // Replay from beginning if already played
      await this.azanSound.setPositionAsync(0);
      await this.azanSound.playAsync();
      
      console.log('🎵 Playing Azan...');
    } catch (error) {
      console.error('❌ Error playing Azan:', error);
      this.isPlayingAzan = false;
    }
  }

  async stopAzan() {
    try {
      if (this.azanSound && this.isPlayingAzan) {
        await this.azanSound.stopAsync();
        this.isPlayingAzan = false;
        console.log('⏹️ Azan stopped');
      }
    } catch (error) {
      console.error('❌ Error stopping Azan:', error);
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
  // NOTIFICATION CHANNELS (Android Only) - UPDATED
  // ============================================================================

  async setupNotificationChannels() {
    try {
      // ✅ NEW: Prayer Time Channel (with custom Azan sound)
      await Notifications.setNotificationChannelAsync('prayer-times', {
        name: 'Prayer Times (Azan)',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'azan.mp3', // Custom sound file
        vibrationPattern: [0, 500, 500, 500],
        lightColor: '#00A86B',
        enableVibrate: true,
        showBadge: true,
      });

      // Regular prayer reminders (default sound)
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

      await Notifications.setNotificationChannelAsync('social', {
        name: 'Social Notifications',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#5BA895',
      });

      console.log('✅ Notification channels created with Azan support');
    } catch (error) {
      console.error('❌ Error creating channels:', error);
    }
  }

  // ============================================================================
  // LISTENERS (ENHANCED)
  // ============================================================================

  setupListeners() {
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('📬 Notification received:', notification);
        
        // ✅ NEW: Play Azan for prayer time notifications
        const notificationType = notification.request.content.data?.type;
        if (notificationType === 'prayer_time') {
          this.playAzan();
        }
      }
    );

    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('👆 Notification tapped:', response.notification.request.content.data);
        
        // Stop Azan if user taps notification
        const notificationType = response.notification.request.content.data?.type;
        if (notificationType === 'prayer_time') {
          this.stopAzan();
        }
      }
    );
  }

  cleanup() {
    if (this.notificationListener) Notifications.removeNotificationSubscription(this.notificationListener);
    if (this.responseListener) Notifications.removeNotificationSubscription(this.responseListener);
    if (this.azanSound) {
      this.azanSound.unloadAsync();
      this.azanSound = null;
    }
  }

  // ============================================================================
  // SCHEDULE NOTIFICATIONS
  // ============================================================================

  // ✅ NEW: Schedule Prayer Time Notification (AT prayer time with Azan)
  async schedulePrayerTimeNotification(prayerName, prayerTime) {
    try {
      const notificationTime = new Date(prayerTime);

      if (notificationTime <= new Date()) {
        console.log(`⏭️ ${prayerName} time is in the past, skipping`);
        return null;
      }

      const title = i18n.t('notifications.prayerTimeTitle', { prayer: prayerName });
      const body = i18n.t('notifications.prayerTimeBody');

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: `${title} 🕌`,
          body,
          sound: Platform.OS === 'ios' ? 'azan.mp3' : 'azan.mp3',
          data: { 
            type: 'prayer_time', 
            prayerName, 
            prayerTime: prayerTime.toISOString() 
          },
          priority: Notifications.AndroidNotificationPriority.HIGH,
          ...(Platform.OS === 'android' && { 
            color: '#00A86B',
            channelId: 'prayer-times' // Channel with Azan sound
          }),
        },
        trigger: {
          type: 'date',
          date: notificationTime,
        },
      });

      console.log(`✅ Scheduled prayer time notification for ${prayerName}`);
      return identifier;
    } catch (error) {
      console.error('❌ Error scheduling prayer time notification:', error);
      return null;
    }
  }

  // Prayer Reminder (BEFORE prayer time - default sound)
  async schedulePrayerReminder(prayerName, prayerTime, minutesBefore = 5) {
    try {
      const notificationTime = new Date(prayerTime);
      notificationTime.setMinutes(notificationTime.getMinutes() - minutesBefore);

      if (notificationTime <= new Date()) {
        console.log(`⏭️ ${prayerName} reminder time is in the past, skipping`);
        return null;
      }

      const title = i18n.t('notifications.prayerReminderTitle', { 
         prayer: prayerName, 
         minutes: minutesBefore 
       });
      const body = i18n.t('notifications.prayerReminderBody');

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: `${title} ⏰`,
          body,
          sound: 'default', // Regular sound for reminders
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

  // Prayer Completion Reminder (AFTER prayer time - default sound)
  async schedulePrayerCompletionReminder(prayerName, prayerTime, minutesAfter = 40) {
    try {
      const notificationTime = new Date(prayerTime);
      notificationTime.setMinutes(notificationTime.getMinutes() + minutesAfter);

      if (notificationTime <= new Date()) return null;

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

  // ✅ UPDATED: Helper to schedule all daily prayers (includes prayer time + reminders)
  async scheduleDailyPrayerNotifications(
    prayerTimes, 
    reminderMinutesBefore = 5, 
    completionMinutesAfter = 40,
    prayerTimeNotificationsEnabled = true // NEW parameter
  ) {
    try {
      await this.cancelAllPrayerNotifications();

      const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
      const scheduledIds = [];

      for (const prayerName of prayers) {
        const prayer = prayerTimes[prayerName];
        if (!prayer || !prayer.time) continue;

        const [hours, minutes] = prayer.time.split(':').map(Number);
        const prayerTime = new Date();
        prayerTime.setHours(hours, minutes, 0, 0);

        const displayName = prayerName.charAt(0).toUpperCase() + prayerName.slice(1);

        // ✅ NEW: Schedule prayer time notification (with Azan)
        if (prayerTimeNotificationsEnabled) {
          const prayerTimeId = await this.schedulePrayerTimeNotification(
            displayName,
            prayerTime
          );
          if (prayerTimeId) scheduledIds.push(prayerTimeId);
        }

        // Schedule reminder BEFORE prayer time
        const reminderId = await this.schedulePrayerReminder(
          displayName,
          prayerTime,
          reminderMinutesBefore
        );
        if (reminderId) scheduledIds.push(reminderId);

        // Schedule completion reminder AFTER prayer time
        const completionId = await this.schedulePrayerCompletionReminder(
          displayName,
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

  // Daily Verse (default sound)
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

  // Streak Reminder (default sound)
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

  // Jumuah Reminder (default sound)
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
            channelId: 'social'
          }),
        },
        trigger: null,
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
      console.log('🗑️ Cancelled all notifications');
    } catch (error) {
      console.error('❌ Error cancelling all notifications:', error);
    }
  }
}

export const notificationService = new NotificationService();