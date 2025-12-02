import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { SettingsScreen } from '../screens/profile/SettingsScreen';
import { AddFriendScreen } from '../screens/profile/AddFriendScreen';
import { FriendRequestScreen } from '../screens/profile/FriendRequestScreen';
import { FriendProfileScreen } from '../screens/profile/FriendProfileScreen';

const Stack = createStackNavigator();

export const ProfileNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="AddFriend" component={AddFriendScreen} />
      <Stack.Screen name="FriendRequest" component={FriendRequestScreen} />
      <Stack.Screen name="FriendProfile" component={FriendProfileScreen} />
    </Stack.Navigator>
  );
};