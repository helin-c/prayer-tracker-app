import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { PrayerTrackerScreen } from '../screens/tracker/PrayerTrackerScreen';
import { TasbihScreen } from '../screens/tracker/TasbihScreen';
import { ZikrHistoryScreen } from '../screens/tracker/ZikrHistoryScreen';

const Stack = createStackNavigator();

export const TrackerNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="TrackerMain" component={PrayerTrackerScreen} />
      <Stack.Screen name="Tasbih" component={TasbihScreen} />
      <Stack.Screen name="ZikrHistory" component={ZikrHistoryScreen} />
    </Stack.Navigator>
  );
};
