// ============================================================================
// FILE: src/screens/profile/SettingsScreen.jsx (OPTIMIZED WITH SELECTORS)
// ============================================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator, 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useAuthStore } from '../../store/authStore';

import { ScreenLayout } from '../../components/layout/ScreenLayout';

export const SettingsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  
  const logout = useAuthStore(state => state.logout);

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLogout = () => {
    if (isLoggingOut || isDeleting) return;

    Alert.alert(t('profile.logout'), t('profile.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.logout'),
        style: 'destructive',
        onPress: async () => {
          setIsLoggingOut(true);
          try {
            await logout();
          } catch (error) {
            console.error('Logout error:', error);
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  };

  const handleChangePassword = () => {
    if (isLoggingOut || isDeleting) return;
    navigation.navigate('ChangePassword');
  };

  const handleNotificationSettings = () => {
    if (isLoggingOut || isDeleting) return;
    navigation.navigate('NotificationSettings');
  };

  const handleDeleteAccount = () => {
    if (isLoggingOut || isDeleting) return;

    Alert.alert(t('profile.deleteAccount'), t('profile.deleteAccountConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          setIsDeleting(true);
          setTimeout(() => {
            setIsDeleting(false);
            Alert.alert(
              t('profile.comingSoon'),
              t('profile.featureComingSoon')
            );
          }, 1000);
        },
      },
    ]);
  };

  return (
    <ScreenLayout>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={isLoggingOut || isDeleting}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.settings')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        
        {/* App Settings Section (NEW) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.appSettings')}</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleNotificationSettings}
            disabled={isLoggingOut || isDeleting}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={24} color="#6F9C8C" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingText}>
                  {t('settings.notifications')}
                </Text>
                <Text style={styles.settingDescription}>
                  {t('notifications.manageNotifications')}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.accountInfo')}</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleChangePassword}
            disabled={isLoggingOut || isDeleting}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="key-outline" size={24} color="#6F9C8C" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingText}>
                  {t('profile.changePassword')}
                </Text>
                <Text style={styles.settingDescription}>
                  {t('profile.updateYourPassword')}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleDeleteAccount}
            disabled={isLoggingOut || isDeleting}
          >
            <View style={styles.settingLeft}>
              {isDeleting ? (
                <View
                  style={{
                    width: 24,
                    height: 24,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ActivityIndicator size="small" color="#DC3545" />
                </View>
              ) : (
                <Ionicons name="trash-outline" size={24} color="#DC3545" />
              )}

              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingText, { color: '#DC3545' }]}>
                  {t('profile.deleteAccount')}
                </Text>
                <Text style={styles.settingDescription}>
                  {t('profile.permanentlyDelete')}
                </Text>
              </View>
            </View>
            {!isDeleting && (
              <Ionicons name="chevron-forward" size={20} color="#CCC" />
            )}
          </TouchableOpacity>
        </View>

        {/* Logout Button with Spinner */}
        <TouchableOpacity
          style={[
            styles.logoutButton,
            (isLoggingOut || isDeleting) && { opacity: 0.7 },
          ]}
          onPress={handleLogout}
          disabled={isLoggingOut || isDeleting}
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color="#DC3545" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={24} color="#DC3545" />
              <Text style={styles.logoutText}>{t('profile.logout')}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#1A1A1A',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E0F5EC',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#999',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#DC3545',
    marginTop: 20,
    marginBottom: 40,
    height: 56,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC3545',
  },
});