import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { GuidesScreen } from '../screens/guides/GuideScreen';
import { GuideDetailScreen } from '../screens/guides/GuideDetailScreen';
import { ROUTES } from './routes';

const Stack = createStackNavigator();

export const GuidesNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="GuidesList" component={GuidesScreen} />
      <Stack.Screen name={ROUTES.PRAYER_GUIDE} component={GuideDetailScreen} />
      <Stack.Screen name={ROUTES.WUDU_GUIDE} component={GuideDetailScreen} />
      <Stack.Screen name={ROUTES.PILLARS_GUIDE} component={GuideDetailScreen} />
      <Stack.Screen name={ROUTES.DUAS_GUIDE} component={GuideDetailScreen} />
      <Stack.Screen name={ROUTES.QURAN_GUIDE} component={GuideDetailScreen} />
      <Stack.Screen name={ROUTES.RAMADAN_GUIDE} component={GuideDetailScreen} />
      <Stack.Screen name={ROUTES.HAJJ_GUIDE} component={GuideDetailScreen} />
      <Stack.Screen name={ROUTES.BASICS_GUIDE} component={GuideDetailScreen} />
    </Stack.Navigator>
  );
};
