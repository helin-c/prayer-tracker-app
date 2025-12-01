// ============================================================================
// FILE: src/navigation/MainNavigator.jsx (FIXED)
// ============================================================================
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ROUTES } from './routes';

import { HomeScreen } from '../screens/home/HomeScreen';
import { QiblaScreen } from '../screens/qibla/QiblaScreen';
import { PrayerTrackerScreen } from '../screens/tracker/PrayerTrackerScreen';
import { GuidesNavigator } from './GuidesNavigator'; 

// Placeholder screens
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';

const PlaceholderScreen = ({ title }) => {
  const { user, logout } = useAuthStore();
  
  return (
    <SafeAreaView style={styles.placeholderContainer}>
      <Text style={styles.placeholderTitle}>{title}</Text>
      <Text style={styles.placeholderSubtitle}>
        Welcome, {user?.full_name || user?.email?.split('@')[0] || 'User'}!
      </Text>
      <Text style={styles.placeholderText}>
        This screen will be implemented in the next phase
      </Text>
      
      {title === 'Settings' && (
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFF',
  },
  placeholderTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  placeholderSubtitle: {
    fontSize: 18,
    color: '#00A86B',
    marginBottom: 16,
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  logoutButton: {
    marginTop: 32,
    backgroundColor: '#DC3545',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  logoutText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

const Tab = createBottomTabNavigator();

export const MainNavigator = () => {
  return (
    <Tab.Navigator
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
          } else if (route.name === ROUTES.SETTINGS) {
            iconName = focused ? 'settings' : 'settings-outline';
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
        },
      })}
    >
      <Tab.Screen name={ROUTES.HOME} component={HomeScreen} />
      <Tab.Screen 
        name={ROUTES.PRAYER_TRACKER}
        component={PrayerTrackerScreen}
        options={{ tabBarLabel: 'Tracker' }}
      />
      <Tab.Screen name={ROUTES.QIBLA} component={QiblaScreen} />
      <Tab.Screen 
        name={ROUTES.GUIDES}
        component={GuidesNavigator} 
        options={{ tabBarLabel: 'Learn' }}
      />
      <Tab.Screen name={ROUTES.SETTINGS}>
        {() => <PlaceholderScreen title="Settings" />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};