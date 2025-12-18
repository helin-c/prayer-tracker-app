// ============================================================================
// FILE: src/navigation/MainNavigator.jsx
// ============================================================================
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ROUTES } from './routes';

// Import screens and navigators
import { HomeScreen } from '../screens/home/HomeScreen';
import { QiblaScreen } from '../screens/qibla/QiblaScreen';
import { TrackerNavigator } from './TrackerNavigator';
import { ProfileNavigator } from './ProfileNavigator';
import { GuidesNavigator } from './GuidesNavigator';

const Tab = createBottomTabNavigator();

export const MainNavigator = () => {
  return (
    <Tab.Navigator
      // 👇 Tab'lerin oturduğu alanın şeffaf olması için bu çok önemli:
      sceneContainerStyle={{ backgroundColor: 'transparent' }}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === ROUTES.HOME) {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === ROUTES.PRAYER_TRACKER) {
            iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
          } else if (route.name === ROUTES.QIBLA) {
            iconName = focused ? 'compass' : 'compass-outline';
          } else if (route.name === ROUTES.GUIDES) {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === ROUTES.PROFILE) {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#00A86B',
        tabBarInactiveTintColor: '#666',
        headerShown: false,
        tabBarStyle: {
          paddingBottom: 4,
          paddingTop: 4,
          height: 65,
          backgroundColor: 'rgba(255, 255, 255, 0.95)', // Tab bar arkası hafif dolu olsun
          borderTopWidth: 0, // Çizgiyi kaldır modern görünüm için
          elevation: 0,
        },
        lazy: false, 
        unmountOnBlur: false, 
        freezeOnBlur: false, 
      })}
    >
      <Tab.Screen
        name={ROUTES.HOME}
        component={HomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name={ROUTES.PRAYER_TRACKER}
        component={TrackerNavigator}
        options={{ tabBarLabel: 'Tracker' }}
      />
      <Tab.Screen
        name={ROUTES.QIBLA}
        component={QiblaScreen}
        options={{ tabBarLabel: 'Qibla' }}
      />
      <Tab.Screen
        name={ROUTES.GUIDES}
        component={GuidesNavigator}
        options={{ tabBarLabel: 'Learn' }}
      />
      <Tab.Screen
        name={ROUTES.PROFILE}
        component={ProfileNavigator}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};