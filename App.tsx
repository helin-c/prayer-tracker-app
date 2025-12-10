// ============================================================================
// FILE: App.js (WITH i18n - FIXED)
// ============================================================================
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { I18nextProvider } from 'react-i18next';
import i18n from './src/i18n';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    // Initialize i18n
    const initI18n = async () => {
      try {
        // Wait a bit for i18n to fully initialize
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check if i18n is initialized
        if (i18n.isInitialized) {
          setI18nReady(true);
        } else {
          // If not, wait for the initialized event
          i18n.on('initialized', () => {
            setI18nReady(true);
          });
        }
      } catch (error) {
        console.error('i18n initialization error:', error);
        // Set ready anyway to prevent blocking the app
        setI18nReady(true);
      }
    };

    initI18n();
  }, []);

  if (!i18nReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00A86B" />
      </View>
    );
  }

  return (
    <I18nextProvider i18n={i18n}>
      <StatusBar style="auto" />
      <AppNavigator />
    </I18nextProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
});