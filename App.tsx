// ============================================================================
// FILE: App.tsx (UPDATED - WITH BACKGROUND TASKS)
// ============================================================================
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, LogBox, AppState, Platform } from 'react-native'; 
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
import widgetService from './src/services/widgetService';
import languageManager from './src/services/languageManager';
import { registerBackgroundTask } from './src/services/backgroundTaskService'; // ✅ ADDED THIS

// Components
import { ErrorBoundary } from './src/components/common/ErrorBoundary';

// Navigation
import { AppNavigator } from './src/navigation/AppNavigator';

// Stores
import { useAuthStore } from './src/store/authStore';
import { useSettingsStore } from './src/store/settingsStore';
import { useTasbihStore } from './src/store/tasbihStore';
import { useNotificationStore } from './src/store/notificationStore';
import { usePrayerStore } from './src/store/prayerStore';
import { usePrayerTrackerStore } from './src/store/prayerTrackerStore';
import { useFriendsStore } from './src/store/friendsStore';

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

  // ============================================================================
  // WIDGET SYNCHRONIZATION (iOS)
  // ============================================================================
  
  useEffect(() => {
    if (Platform.OS === 'ios') {
      const updateWidgets = () => {
        setTimeout(() => {
          const prayerState = usePrayerStore.getState();
          const trackerState = usePrayerTrackerStore.getState();
          const friendsState = useFriendsStore.getState();
                  
          if (prayerState.prayerTimes) {
            widgetService.updateNextPrayerWidget(
              prayerState.prayerTimes,
              prayerState.location,
              null
            );
          }
                  
          if (trackerState.dayPrayers) {
            widgetService.updateDailyProgressWidget(trackerState.dayPrayers);
          }
                  
          if (friendsState.friends) {
            widgetService.updateFriendStreaksWidget(friendsState.friends);
          }
                  
          widgetService.updateAllWidgets();
        }, 1000);
      };
          
      updateWidgets();
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
      
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        // ✅ FIX: Also sync language on app foreground
        const currentLang = languageManager.getCurrentLanguage();
        languageManager.syncLanguageToWidgets(currentLang);
        widgetService.updateAllWidgets();
      }
    });
    
    return () => subscription?.remove();
  }, []);

  // ============================================================================
  // APP INITIALIZATION (✅ FIXED ORDER WITH PROPER LANGUAGE HANDLING)
  // ============================================================================
  useEffect(() => {
    async function prepare() {
      try {
        console.log('🚀 App initialization started...');

        // ✅ STEP 1: Initialize Language Manager FIRST
        // This loads saved language from AsyncStorage and syncs to widgets
        console.log('1️⃣ Initializing Language Manager...');
        await languageManager.initialize();
        console.log('✅ Language Manager initialized with:', languageManager.getCurrentLanguage());

        // ✅ STEP 2: Wait for i18n to be fully ready with loaded language
        console.log('2️⃣ Waiting for i18n to be ready...');
        await new Promise<void>((resolve) => {
          if (i18n.isInitialized) {
            console.log('✅ i18n already initialized with language:', i18n.language);
            resolve();
          } else {
            const onInit = () => {
              i18n.off('initialized', onInit);
              console.log('✅ i18n initialized with language:', i18n.language);
              resolve();
            };
            i18n.on('initialized', onInit);
          }
        });

        // ✅ STEP 3: Initialize Auth Store
        // This will load user data and sync user's preferred language if logged in
        // If not logged in, it will keep the current language from AsyncStorage
        console.log('3️⃣ Initializing Auth Store...');
        await initAuth();
        console.log('✅ Auth Store initialized');
        
        // ✅ STEP 3.5: Ensure widgets have latest language after auth init
        console.log('3️⃣.5 Syncing language to widgets after auth...');
        const finalLanguage = languageManager.getCurrentLanguage();
        await languageManager.syncLanguageToWidgets(finalLanguage);
        console.log('✅ Final language synced to widgets:', finalLanguage);

        // ✅ STEP 4: Initialize other stores and assets in parallel
        console.log('4️⃣ Initializing other services...');
        await Promise.all([
          preloadImages().catch((e: unknown) => console.warn('Image preload warning:', e)),
          initSettings().catch((e: unknown) => console.warn('Settings init warning:', e)),
          initTasbih().catch((e: unknown) => console.warn('Tasbih init warning:', e)),
          initializeNotifications().catch((e: unknown) => console.warn('Notifications init warning:', e)),
        ]);
        console.log('✅ All services initialized');

        // ✅ STEP 5: Register Background Task (iOS Only)
        if (Platform.OS === 'ios') {
          console.log('5️⃣ Registering background tasks...');
          await registerBackgroundTask();
          console.log('✅ Background tasks registered');
        }

        console.log('🎉 App initialization complete!');
      } catch (e: unknown) {
        console.error('❌ App initialization error:', e);
      } finally {
        // Always set app as ready, even if some things failed
        setAppIsReady(true);
      }
    }

    prepare();
  }, []); // ✅ Empty dependency array - run only once

  // Handle Notification Taps
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      response => {
        // Logging or custom logic here
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
    backgroundColor: '#F0FFF4',
  },
});