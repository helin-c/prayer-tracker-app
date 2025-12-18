// ============================================================================
// FILE: App.tsx
// ============================================================================
import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, LogBox } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { I18nextProvider } from 'react-i18next';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Services & Config
import i18n from './src/i18n';
import { preloadImages } from './src/utils/imagePreloader';

// Navigation
import { AppNavigator } from './src/navigation/AppNavigator';

// Stores
import { useAuthStore } from './src/store/authStore';
import { useSettingsStore } from './src/store/settingsStore';
import { useTasbihStore } from './src/store/tasbihStore';

// Gereksiz sarı uyarıları production'da gizle
LogBox.ignoreLogs(['Require cycle:']); 

// Splash Screen'in otomatik kapanmasını engelle (Biz manuel kapatacağız)
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  // Store actions
  const { initialize: initAuth } = useAuthStore();
  const { initialize: initSettings } = useSettingsStore();
  const { loadSessions: initTasbih } = useTasbihStore();

  useEffect(() => {
    async function prepare() {
      try {
        // 1. Kritik İşlemleri Paralel Başlat
        const initPromises = [
          // Dil Yüklemesi
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
          // Resimlerin Önbelleğe Alınması
          preloadImages(),
          // Store'ların Başlatılması (Auth, Settings, Data)
          initAuth(),
          initSettings(),
          initTasbih(),
        ];

        // Hepsini bekle (Maksimum 8 saniye timeout koyduk)
        await Promise.race([
          Promise.all(initPromises),
          // 👇 DÜZELTİLEN SATIR BURASI: 'resolve' parametresi eklendi
          new Promise((resolve) => setTimeout(() => resolve(null), 8000)) 
        ]);

      } catch (e) {
        console.warn('App initialization warning:', e);
        // Hata olsa bile uygulamayı açmaya çalış, kullanıcı takılı kalmasın
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  // Root View Layout olduğunda Splash Screen'i gizle
  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // Animasyonlu bir geçiş istenirse burada yapılabilir ama native hide yeterlidir
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null; // Splash screen hala görünür durumda
  }

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <I18nextProvider i18n={i18n}>
        <StatusBar style="auto" />
        <View style={styles.container}>
          <AppNavigator />
        </View>
      </I18nextProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4A9B87', // Theme background color ile eşleşmeli
  },
});