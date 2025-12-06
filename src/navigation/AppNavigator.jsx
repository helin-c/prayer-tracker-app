// ============================================================================
// FILE: src/navigation/AppNavigator.jsx (UPDATED)
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
  const { isAuthenticated, isLoading, initialize } = useAuthStore();
  const { initialize: initializeSettings } = useSettingsStore();
  const { loadSessions } = useTasbihStore();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize all stores in parallel
      await Promise.all([
        initialize(),
        initializeSettings(),
        loadSessions(),
      ]);
    } catch (error) {
      console.error('App initialization error:', error);
    } finally {
      setAppReady(true);
    }
  };

  // Show loading screen while initializing
  if (!appReady || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00A86B" />
        <Text style={styles.loadingText}>Loading...</Text>
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
    backgroundColor: '#FFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});