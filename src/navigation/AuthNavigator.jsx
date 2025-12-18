import React from 'react';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack'; // Import eklendi
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ROUTES } from './routes';

const Stack = createStackNavigator();

export const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        // 👇 GLOBAL BACKGROUND İÇİN KRİTİK AYAR:
        cardStyle: { backgroundColor: 'transparent' },
        // 👇 Fade animasyonu (Native Driver destekli):
        cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter,
        transitionSpec: {
          open: { animation: 'timing', config: { duration: 200 } },
          close: { animation: 'timing', config: { duration: 200 } },
        },
      }}
    >
      <Stack.Screen name={ROUTES.ONBOARDING} component={OnboardingScreen} />
      <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} />
      <Stack.Screen name={ROUTES.REGISTER} component={RegisterScreen} />
    </Stack.Navigator>
  );
};