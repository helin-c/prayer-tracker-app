// ============================================================================
// FILE: src/screens/profile/NotificationSettingsScreen.jsx (UPDATED WITH AZAN)
// ============================================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

import { ScreenLayout } from '../../components/layout/ScreenLayout';

import { 
  useNotificationStore, 
  selectPrayerTimeNotificationsEnabled, // NEW
  selectPrayerRemindersEnabled,
  selectCompletionRemindersEnabled,
  selectDailyVerseEnabled,
  selectStreakReminderEnabled,
  selectReminderMinutesBefore,
  selectCompletionMinutesAfter,
  selectJumuahReminderEnabled,
  selectJumuahReminderTime
} from '../../store/notificationStore';

import { 
  useFriendsStore, 
  selectNotificationPreferences 
} from '../../store/friendsStore';

export const NotificationSettingsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  
  // ✅ NEW: Prayer Time Notifications (Azan)
  const prayerTimeNotificationsEnabled = useNotificationStore(selectPrayerTimeNotificationsEnabled);
  const togglePrayerTimeNotifications = useNotificationStore(state => state.togglePrayerTimeNotifications);
  
  const prayerRemindersEnabled = useNotificationStore(selectPrayerRemindersEnabled);
  const completionRemindersEnabled = useNotificationStore(selectCompletionRemindersEnabled);
  const dailyVerseEnabled = useNotificationStore(selectDailyVerseEnabled);
  const streakReminderEnabled = useNotificationStore(selectStreakReminderEnabled);
  const reminderMinutesBefore = useNotificationStore(selectReminderMinutesBefore);
  const completionMinutesAfter = useNotificationStore(selectCompletionMinutesAfter);
  
  const jumuahReminderEnabled = useNotificationStore(selectJumuahReminderEnabled);
  const jumuahReminderTime = useNotificationStore(selectJumuahReminderTime);

  const togglePrayerReminders = useNotificationStore(state => state.togglePrayerReminders);
  const toggleCompletionReminders = useNotificationStore(state => state.toggleCompletionReminders);
  const toggleDailyVerse = useNotificationStore(state => state.toggleDailyVerse);
  const toggleStreakReminder = useNotificationStore(state => state.toggleStreakReminder);
  const updateSettings = useNotificationStore(state => state.updateSettings);
  const toggleJumuahReminder = useNotificationStore(state => state.toggleJumuahReminder);
  const updateJumuahReminderTime = useNotificationStore(state => state.updateJumuahReminderTime);

  const notificationPreferences = useFriendsStore(selectNotificationPreferences);
  const updateNotificationPreferences = useFriendsStore(state => state.updateNotificationPreferences);

  const [loading, setLoading] = useState(false);

  const handleToggle = async (toggleFunction) => {
    setLoading(true);
    await toggleFunction();
    setLoading(false);
  };

  const toggleSocialNotification = async (key) => {
    setLoading(true);
    
    const newPreferences = {
      ...notificationPreferences,
      [key]: !notificationPreferences[key],
    };
    
    await updateNotificationPreferences(newPreferences);
    
    setLoading(false);
  };

  return (
    <ScreenLayout noPaddingBottom={true}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButtonWrapper}
          >
            <LinearGradient
              colors={[]}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('settings.notifications')}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* ✅ NEW: Prayer Time Notifications (Azan) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('notifications.prayerTimeNotifications')}</Text>
          </View>
          
          <View style={styles.settingCardWrapper}>
            <LinearGradient
              colors={['#E0F5EC', '#E0F5EC']}
              style={styles.settingCard}
            >
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <View style={styles.labelRow}>
                    <Text style={styles.settingLabel}>
                      {t('notifications.enablePrayerTimeNotifications')}
                    </Text>
                  </View>
                  <Text style={styles.settingDesc}>
                    {t('notifications.prayerTimeNotificationsDesc')}
                  </Text>
                </View>
                <Switch
                  value={prayerTimeNotificationsEnabled}
                  onValueChange={() => handleToggle(togglePrayerTimeNotifications)}
                  trackColor={{ false: '#E0E0E0', true: '#5BA895' }}
                  thumbColor="#FFFFFF"
                  disabled={loading}
                />
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Prayer Reminders (Before Prayer Time) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('notifications.prayerReminders')}</Text>
          </View>
          
          <View style={styles.settingCardWrapper}>
            <LinearGradient
              colors={['#E0F5EC', '#E0F5EC']}
              style={styles.settingCard}
            >
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Text style={styles.settingLabel}>
                    {t('notifications.enablePrayerReminders')}
                  </Text>
                  <Text style={styles.settingDesc}>
                    {t('notifications.prayerRemindersDesc')}
                  </Text>
                </View>
                <Switch
                  value={prayerRemindersEnabled}
                  onValueChange={() => handleToggle(togglePrayerReminders)}
                  trackColor={{ false: '#E0E0E0', true: '#5BA895' }}
                  thumbColor="#FFFFFF"
                  disabled={loading}
                />
              </View>

              {prayerRemindersEnabled && (
                <View style={styles.subSetting}>
                  <Text style={styles.subSettingLabel}>
                    {t('notifications.reminderTime')}
                  </Text>
                  <View style={styles.timeOptions}>
                    {[5, 10, 15, 30].map(minutes => (
                      <TouchableOpacity
                        key={minutes}
                        style={styles.timeOptionWrapper}
                        onPress={() => updateSettings({ reminderMinutesBefore: minutes })}
                      >
                        <LinearGradient
                          colors={
                            reminderMinutesBefore === minutes
                              ? ['#5BA895', '#4A9B87']
                              : ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.95)']
                          }
                          style={[
                            styles.timeOption,
                            reminderMinutesBefore === minutes && styles.timeOptionActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.timeOptionText,
                              reminderMinutesBefore === minutes && styles.timeOptionTextActive,
                            ]}
                          >
                            {minutes} min
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </LinearGradient>
          </View>
        </View>

        {/* Completion Reminders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('notifications.completionReminders')}</Text>
          </View>
          
          <View style={styles.settingCardWrapper}>
            <LinearGradient
              colors={['#E0F5EC', '#E0F5EC']}
              style={styles.settingCard}
            >
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Text style={styles.settingLabel}>
                    {t('notifications.enableCompletionReminders')}
                  </Text>
                  <Text style={styles.settingDesc}>
                    {t('notifications.completionRemindersDesc')}
                  </Text>
                </View>
                <Switch
                  value={completionRemindersEnabled}
                  onValueChange={() => handleToggle(toggleCompletionReminders)}
                  trackColor={{ false: '#E0E0E0', true: '#5BA895' }}
                  thumbColor="#FFFFFF"
                  disabled={loading}
                />
              </View>

              {completionRemindersEnabled && (
                <View style={styles.subSetting}>
                  <Text style={styles.subSettingLabel}>
                    {t('notifications.reminderAfter')}
                  </Text>
                  <View style={styles.timeOptions}>
                    {[30, 40, 60, 90].map(minutes => (
                      <TouchableOpacity
                        key={minutes}
                        style={styles.timeOptionWrapper}
                        onPress={() => updateSettings({ completionMinutesAfter: minutes })}
                      >
                        <LinearGradient
                          colors={
                            completionMinutesAfter === minutes
                              ? ['#5BA895', '#4A9B87']
                              : ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.95)']
                          }
                          style={[
                            styles.timeOption,
                            completionMinutesAfter === minutes && styles.timeOptionActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.timeOptionText,
                              completionMinutesAfter === minutes && styles.timeOptionTextActive,
                            ]}
                          >
                            {minutes} min
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </LinearGradient>
          </View>
        </View>

        {/* Daily Verse */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('notifications.dailyVerse')}</Text>
          </View>
          
          <View style={styles.settingCardWrapper}>
            <LinearGradient
              colors={['#E0F5EC', '#E0F5EC']}
              style={styles.settingCard}
            >
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Text style={styles.settingLabel}>
                    {t('notifications.enableDailyVerse')}
                  </Text>
                  <Text style={styles.settingDesc}>
                    {t('notifications.dailyVerseDesc')}
                  </Text>
                </View>
                <Switch
                  value={dailyVerseEnabled}
                  onValueChange={() => handleToggle(toggleDailyVerse)}
                  trackColor={{ false: '#E0E0E0', true: '#5BA895' }}
                  thumbColor="#FFFFFF"
                  disabled={loading}
                />
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Streak Reminder */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('notifications.streakReminder')}</Text>
          </View>
          
          <View style={styles.settingCardWrapper}>
            <LinearGradient
              colors={['#E0F5EC', '#E0F5EC']}
              style={styles.settingCard}
            >
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Text style={styles.settingLabel}>
                    {t('notifications.enableStreakReminder')}
                  </Text>
                  <Text style={styles.settingDesc}>
                    {t('notifications.streakReminderDesc')}
                  </Text>
                </View>
                <Switch
                  value={streakReminderEnabled}
                  onValueChange={() => handleToggle(toggleStreakReminder)}
                  trackColor={{ false: '#E0E0E0', true: '#5BA895' }}
                  thumbColor="#FFFFFF"
                  disabled={loading}
                />
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Jumuah Reminder */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('notifications.jumuahReminder')}</Text>
          </View>
          
          <View style={styles.settingCardWrapper}>
            <LinearGradient
              colors={['#E0F5EC', '#E0F5EC']}
              style={styles.settingCard}
            >
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Text style={styles.settingLabel}>
                    {t('notifications.enableJumuahReminder')}
                  </Text>
                  <Text style={styles.settingDesc}>
                    {t('notifications.jumuahReminderDesc')}
                  </Text>
                </View>
                <Switch
                  value={jumuahReminderEnabled}
                  onValueChange={() => handleToggle(toggleJumuahReminder)}
                  trackColor={{ false: '#E0E0E0', true: '#5BA895' }}
                  thumbColor="#FFFFFF"
                  disabled={loading}
                />
              </View>

              {jumuahReminderEnabled && (
                <View style={styles.subSetting}>
                  <Text style={styles.subSettingLabel}>
                    {t('notifications.reminderTime')}
                  </Text>
                  <View style={styles.timeOptions}>
                    {[
                      { hour: 11, minute: 30, label: '11:30' },
                      { hour: 12, minute: 0, label: '12:00' },
                      { hour: 12, minute: 30, label: '12:30' },
                      { hour: 13, minute: 0, label: '13:00' },
                    ].map(({ hour, minute, label }) => (
                      <TouchableOpacity
                        key={label}
                        style={styles.timeOptionWrapper}
                        onPress={() => updateJumuahReminderTime(hour, minute)}
                      >
                        <LinearGradient
                          colors={
                            jumuahReminderTime.hour === hour && 
                            jumuahReminderTime.minute === minute
                              ? ['#5BA895', '#4A9B87']
                              : ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.95)']
                          }
                          style={[
                            styles.timeOption,
                            jumuahReminderTime.hour === hour && 
                            jumuahReminderTime.minute === minute && 
                            styles.timeOptionActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.timeOptionText,
                              jumuahReminderTime.hour === hour && 
                              jumuahReminderTime.minute === minute && 
                              styles.timeOptionTextActive,
                            ]}
                          >
                            {label}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </LinearGradient>
          </View>
        </View>

        {/* Social Notifications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('notifications.socialNotifications')}</Text>
          </View>
          
          <View style={styles.settingCardWrapper}>
            <LinearGradient
              colors={['#E0F5EC', '#E0F5EC']}
              style={styles.settingCard}
            >
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Text style={styles.settingLabel}>
                    {t('notifications.friendRequests')}
                  </Text>
                  <Text style={styles.settingDesc}>
                    {t('notifications.friendRequestsDesc')}
                  </Text>
                </View>
                <Switch
                  value={notificationPreferences?.friend_requests ?? true}
                  onValueChange={() => toggleSocialNotification('friend_requests')}
                  trackColor={{ false: '#E0E0E0', true: '#5BA895' }}
                  thumbColor="#FFFFFF"
                  disabled={loading}
                />
              </View>

              <View style={styles.settingDivider} />

              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Text style={styles.settingLabel}>
                    {t('notifications.friendPrayers')}
                  </Text>
                  <Text style={styles.settingDesc}>
                    {t('notifications.friendPrayersDesc')}
                  </Text>
                </View>
                <Switch
                  value={notificationPreferences?.friend_prayers ?? true}
                  onValueChange={() => toggleSocialNotification('friend_prayers')}
                  trackColor={{ false: '#E0E0E0', true: '#5BA895' }}
                  thumbColor="#FFFFFF"
                  disabled={loading}
                />
              </View>

              <View style={styles.settingDivider} />

              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Text style={styles.settingLabel}>
                    {t('notifications.friendStreaks')}
                  </Text>
                  <Text style={styles.settingDesc}>
                    {t('notifications.friendStreaksDesc')}
                  </Text>
                </View>
                <Switch
                  value={notificationPreferences?.friend_streaks ?? true}
                  onValueChange={() => toggleSocialNotification('friend_streaks')}
                  trackColor={{ false: '#E0E0E0', true: '#5BA895' }}
                  thumbColor="#FFFFFF"
                  disabled={loading}
                />
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Test Notification */}
        <TouchableOpacity
          style={styles.testButtonWrapper}
          onPress={async () => {
            const { notificationService } = require('../../services/notificationService');
            await notificationService.sendInstantNotification(
              'Test Notification 🔔',
              'This is a test notification from My Salah!',
              { type: 'test' }
            );
          }}
        >
          <LinearGradient
            colors={['#5BA895', '#4A9B87']}
            style={styles.testButton}
          >
            <Ionicons name="notifications" size={20} color="#FFFFFF" />
            <Text style={styles.testButtonText}>{t('notifications.testNotification')}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButtonWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    flex: 1,
    textAlign: 'center',
  },
  
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  
  settingCardWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  settingCard: {
    padding: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLeft: {
    flex: 1,
    marginRight: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  settingDesc: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    fontWeight: '500',
  },
  settingDivider: {
    height: 2,
    backgroundColor: 'rgba(91, 168, 149, 0.15)',
    marginVertical: 16,
  },
  
  subSetting: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: 'rgba(91, 168, 149, 0.15)',
  },
  subSettingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  
  timeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  timeOptionWrapper: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  timeOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  timeOptionTextActive: {
    color: '#FFFFFF',
  },
  
  testButtonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});