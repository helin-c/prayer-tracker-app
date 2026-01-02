// ============================================================================
// FILE: App.tsx
// ============================================================================
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, LogBox } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { I18nextProvider } from 'react-i18next';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainerRef } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';

// Services & Config
import i18n from './src/i18n';
import { preloadImages } from './src/utils/imagePreloader';
import { notificationService } from './src/services/notificationService';

// Components
import { ErrorBoundary } from './src/components/common/ErrorBoundary'; // ✅ Import Added

// Navigation
import { AppNavigator } from './src/navigation/AppNavigator';

// Stores
import { useAuthStore } from './src/store/authStore';
import { useSettingsStore } from './src/store/settingsStore';
import { useTasbihStore } from './src/store/tasbihStore';

// Notifications Stores
import { useNotificationStore } from './src/store/notificationStore';
import { usePrayerStore } from './src/store/prayerStore';

// Hide unnecessary warnings in production
LogBox.ignoreLogs(['Require cycle:']);

// Prevent Splash Screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  
  // Navigation Reference
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  // Store actions
  const { initialize: initAuth } = useAuthStore();
  const { initialize: initSettings } = useSettingsStore();
  const { loadSessions: initTasbih } = useTasbihStore();

  // Notification store actions
  const initializeNotifications = useNotificationStore((state) => state.initialize);
  const schedulePrayerNotifications = useNotificationStore(
    (state) => state.schedulePrayerNotifications
  );

  // Prayer times
  const prayerTimes = usePrayerStore((state) => state.prayerTimes);

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize Critical Processes in Parallel
        const initPromises = [
          // Language Loading
          new Promise<void>((resolve) => {
            if (i18n.isInitialized) {
              resolve();
            } else {
              const onInit = () => {
                i18n.off('initialized', onInit);
                resolve();
              };
              i18n.on('initialized', onInit);
            }
          }),

          // Image Preloading
          preloadImages(),

          // Store Initializations
          initAuth(),
          initSettings(),
          initTasbih(),

          // Initialize Notification Infrastructure
          initializeNotifications(),
        ];

        // Wait for all (Max 8 seconds timeout)
        await Promise.race([
          Promise.all(initPromises),
          new Promise((resolve) => setTimeout(() => resolve(null), 8000)),
        ]);
      } catch (e) {
        console.warn('App initialization warning:', e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, [initAuth, initSettings, initTasbih, initializeNotifications]);

  // Handle Notification Taps (Navigation Logic is in AppNavigator, but this listener exists for compatibility)
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      response => {
        // Just logging here, navigation is handled in AppNavigator or via linking
        // If you rely on manual navigation handling, ensure it doesn't conflict with AppNavigator logic
      }
    );

    return () => subscription.remove();
  }, []);

  // Schedule prayer notifications when times are available
  useEffect(() => {
    if (prayerTimes) {
      schedulePrayerNotifications(prayerTimes);
    }
  }, [prayerTimes, schedulePrayerNotifications]);

  // Hide Splash Screen on Layout
  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <I18nextProvider i18n={i18n}>
        <StatusBar style="auto" />
        <View style={styles.container}>
          <ErrorBoundary>
            <AppNavigator /> 
          </ErrorBoundary>
        </View>
      </I18nextProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4A9B87',
  },
});