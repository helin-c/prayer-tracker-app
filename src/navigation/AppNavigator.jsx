// ============================================================================
// FILE: src/navigation/AppNavigator.jsx
// ============================================================================
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { useTasbihStore } from '../store/tasbihStore';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

export const AppNavigator = () => {
  const { isAuthenticated, initialize } = useAuthStore();
  const { initialize: initializeSettings } = useSettingsStore();
  const { loadSessions } = useTasbihStore();
  
  const [appReady, setAppReady] = useState(false);
  const [initError, setInitError] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize all stores in parallel with timeout
      await Promise.race([
        Promise.all([
          initialize(),
          initializeSettings(),
          loadSessions(),
        ]),
        // Timeout after 10 seconds
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Initialization timeout')), 10000)
        )
      ]);
      
      setAppReady(true);
    } catch (error) {
      console.error('App initialization error:', error);
      setInitError(true);
      // Still mark as ready to show login screen
      setAppReady(true);
    }
  };

  // Show loading screen while initializing
  if (!appReady) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>🕌</Text>
        </View>
        <ActivityIndicator size="large" color="#00A86B" style={styles.spinner} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Show error screen if initialization failed badly
  if (initError && !isAuthenticated) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>Initialization Error</Text>
        <Text style={styles.errorSubtext}>Please restart the app</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0FFF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoIcon: {
    fontSize: 48,
  },
  spinner: {
    marginTop: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC3545',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
  },
});