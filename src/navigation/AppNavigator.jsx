// ============================================================================
// FILE: src/navigation/AppNavigator.jsx (FIXED)
// ============================================================================
import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { useAuthStore, selectIsAuthenticated } from '../store/authStore';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#f0fff4', 
  },
};

const linking = {
  prefixes: ['prayertracker://', 'exp://'],
  config: {
    screens: {
      MainNavigator: {
        screens: {
          Home: 'home',
          PrayerTracker: 'tracker',
          Profile: {
            screens: {
              ProfileMain: 'profile',
              FriendRequest: 'friend-requests',
              FriendProfile: 'friend/:friendId',
            }
          },
          Stats: 'stats',
        },
      },
      AuthNavigator: {
        screens: {
          Login: 'login',
        }
      }
    },
  },
};

export const AppNavigator = () => {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const navigationRef = useRef(null);
  const notificationListener = useRef(null);
  const responseListener = useRef(null);

  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('📬 Notification received (foreground):', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log('👆 Notification tapped:', data);

      if (!navigationRef.current?.isReady()) return;

      switch (data.type) {
        case 'prayer_reminder':
        case 'prayer_completion':
          navigationRef.current.navigate('MainNavigator', { 
            screen: 'PrayerTracker' 
          });
          break;

        case 'streak':
          navigationRef.current.navigate('MainNavigator', { 
            screen: 'Stats' 
          });
          break;

        case 'friend_request':
          navigationRef.current.navigate('MainNavigator', {
            screen: 'Profile',
            params: { screen: 'FriendRequest' }
          });
          break;

        case 'friend_request_accepted':
          navigationRef.current.navigate('MainNavigator', {
            screen: 'Profile',
            params: { screen: 'ProfileMain' }
          });
          break;

        case 'friend_prayer_milestone':
        case 'friend_streak_milestone':
          if (data.friend_id) {
            navigationRef.current.navigate('MainNavigator', {
              screen: 'Profile',
              params: {
                screen: 'FriendProfile',
                params: {
                  friend: {
                    friend_id: data.friend_id,
                    friend_name: data.friend_name,
                  }
                }
              }
            });
          }
          break;

        case 'daily_verse':
        default:
          navigationRef.current.navigate('MainNavigator', { 
            screen: 'Home' 
          });
          break;
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();  
      }
      if (responseListener.current) {
        responseListener.current.remove();  
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <NavigationContainer 
        ref={navigationRef}
        theme={AppTheme}
        linking={linking}
      >
        {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
      </NavigationContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fff4', 
  },
});