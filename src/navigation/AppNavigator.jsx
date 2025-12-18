// ============================================================================
// FILE: src/navigation/AppNavigator.jsx
// ============================================================================
import React from 'react';
import { ImageBackground, StyleSheet } from 'react-native'; 
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'transparent', 
  },
};

export const AppNavigator = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    // 👇 Global Arka Plan Burada Tanımlanıyor
    <ImageBackground
      source={require('../assets/images/illustrations/background.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <NavigationContainer theme={AppTheme}>
        {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
      </NavigationContainer>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});