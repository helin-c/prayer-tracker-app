import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { PrayerTrackerScreen } from '../screens/tracker/PrayerTrackerScreen';
import { TasbihScreen } from '../screens/tracker/TasbihScreen';
import { ZikrHistoryScreen } from '../screens/tracker/ZikrHistoryScreen';
import { PrayerCalendarScreen } from '../screens/tracker/PrayerCalendarScreen';
import { GUARANTEED_STACK_OPTIONS } from './stackOptions';

const Stack = createStackNavigator();

export const TrackerNavigator = () => {
  return (
    <Stack.Navigator screenOptions={GUARANTEED_STACK_OPTIONS}>
      <Stack.Screen name="TrackerMain" component={PrayerTrackerScreen} />
      <Stack.Screen name="Tasbih" component={TasbihScreen} />
      <Stack.Screen name="ZikrHistory" component={ZikrHistoryScreen} />
      <Stack.Screen name="PrayerCalendar" component={PrayerCalendarScreen} />
    </Stack.Navigator>
  );
};
