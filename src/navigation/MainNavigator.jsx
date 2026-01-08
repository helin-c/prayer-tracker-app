import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ROUTES } from './routes';

// Screens
import { HomeScreen } from '../screens/home/HomeScreen';
import { QiblaScreen } from '../screens/qibla/QiblaScreen';
import { TrackerNavigator } from './TrackerNavigator';
import { ProfileNavigator } from './ProfileNavigator';
import { GuidesNavigator } from './GuidesNavigator';

const Tab = createBottomTabNavigator();

export const MainNavigator = () => {
  const { t } = useTranslation();
  
  return (
    <Tab.Navigator
      sceneContainerStyle={{ 
        backgroundColor: '#F0FFF4' 
      }}
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
        
        lazy: false,
        unmountOnBlur: false,
        
        tabBarStyle: {
          paddingBottom: 4,
          paddingTop: 4,
          height: 65,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderTopWidth: 0,
          elevation: 0,
        },
      })}
    >
      <Tab.Screen
        name={ROUTES.HOME}
        component={HomeScreen}
        options={{ tabBarLabel: t('tabs.home') }}
      />
      <Tab.Screen
        name={ROUTES.PRAYER_TRACKER}
        component={TrackerNavigator}
        options={{ tabBarLabel: t('tabs.tracker') }}
      />
      <Tab.Screen
        name={ROUTES.QIBLA}
        component={QiblaScreen}
        options={{ tabBarLabel: t('tabs.qibla') }}
      />
      <Tab.Screen
        name={ROUTES.GUIDES}
        component={GuidesNavigator}
        options={{ tabBarLabel: t('tabs.guides') }}
      />
      <Tab.Screen
        name={ROUTES.PROFILE}
        component={ProfileNavigator}
        options={{ tabBarLabel: t('tabs.profile') }}
      />
    </Tab.Navigator>
  );
};
