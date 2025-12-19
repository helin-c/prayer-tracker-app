// ============================================================================
// FILE: src/navigation/AppNavigator.jsx
// ============================================================================
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

// Standard Theme - Force background to white
const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#5BA895', 
  },
};

export const AppNavigator = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <View style={styles.container}>
      <NavigationContainer theme={AppTheme}>
        {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
      </NavigationContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#5BA895', 
  },
});