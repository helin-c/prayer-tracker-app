// ============================================================================
// FILE: src/navigation/TrackerNavigator.jsx (UPDATED)
// ============================================================================
import React from 'react';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { PrayerTrackerScreen } from '../screens/tracker/PrayerTrackerScreen';
import { TasbihScreen } from '../screens/tracker/TasbihScreen';
import { ZikrHistoryScreen } from '../screens/tracker/ZikrHistoryScreen';
import { PrayerCalendarScreen } from '../screens/tracker/PrayerCalendarScreen';

const Stack = createStackNavigator();

export const TrackerNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'transparent' }, // Şeffaflık
        cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter, // Fade
        transitionSpec: {
          open: { animation: 'timing', config: { duration: 200 } },
          close: { animation: 'timing', config: { duration: 200 } },
        },
      }}
    >
      <Stack.Screen name="TrackerMain" component={PrayerTrackerScreen} />
      <Stack.Screen name="Tasbih" component={TasbihScreen} />
      <Stack.Screen name="ZikrHistory" component={ZikrHistoryScreen} />
      <Stack.Screen name="PrayerCalendar" component={PrayerCalendarScreen} />
    </Stack.Navigator>
  );
};