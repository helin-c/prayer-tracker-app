import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { GuidesScreen } from '../screens/guides/GuidesScreen';
import { GuideDetailScreen } from '../screens/guides/GuideDetailScreen';
import { QuranSurahListScreen } from '../screens/quran/QuranSurahListScreen';
import { QuranReaderScreen } from '../screens/quran/QuranReaderScreen';
import { QuranBookmarksScreen } from '../screens/quran/QuranBookmarksScreen';
import { ROUTES } from './routes';
import { GUARANTEED_STACK_OPTIONS } from './stackOptions';

const Stack = createStackNavigator();

export const GuidesNavigator = () => {
  return (
    <Stack.Navigator screenOptions={GUARANTEED_STACK_OPTIONS}>
      <Stack.Screen name="GuidesList" component={GuidesScreen} />
      <Stack.Screen name="QuranSurahList" component={QuranSurahListScreen} />
      <Stack.Screen name="QuranReader" component={QuranReaderScreen} />
      <Stack.Screen name="QuranBookmarks" component={QuranBookmarksScreen} />
      <Stack.Screen name={ROUTES.PRAYER_GUIDE} component={GuideDetailScreen} />
      <Stack.Screen name={ROUTES.WUDU_GUIDE} component={GuideDetailScreen} />
      <Stack.Screen name={ROUTES.PILLARS_GUIDE} component={GuideDetailScreen} />
      <Stack.Screen name={ROUTES.DUAS_GUIDE} component={GuideDetailScreen} />
      <Stack.Screen name={ROUTES.RAMADAN_GUIDE} component={GuideDetailScreen} />
      <Stack.Screen name={ROUTES.HAJJ_GUIDE} component={GuideDetailScreen} />
      <Stack.Screen name={ROUTES.BASICS_GUIDE} component={GuideDetailScreen} />
    </Stack.Navigator>
  );
};
