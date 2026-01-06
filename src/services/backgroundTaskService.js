// ============================================================================
// FILE: src/services/backgroundTaskService.js (UPDATED)
// ============================================================================
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

// Stores
import { usePrayerTrackerStore } from '../store/prayerTrackerStore';
import { usePrayerStore } from '../store/prayerStore';
import { useFriendsStore } from '../store/friendsStore';
import { useStreakStore } from '../store/streakStore';

const WIDGET_UPDATE_TASK = 'WIDGET_UPDATE_TASK';

// ============================================================================
// BACKGROUND TASK DEFINITION
// ============================================================================
TaskManager.defineTask(WIDGET_UPDATE_TASK, async () => {
  console.log('🔄 Background Task: Widget update triggered');
  
  try {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // ✅ Fetch today's data 
    // The Stores are responsible for calling widgetService.updateX() upon success.
    const prayerTrackerStore = usePrayerTrackerStore.getState();
    const streakStore = useStreakStore.getState();
    const friendsStore = useFriendsStore.getState();
    
    // Fetch all data in parallel
    // We do NOT call widgetService.updateAllWidgets() here anymore 
    // to avoid double-refreshing the widgets.
    await Promise.all([
      prayerTrackerStore.fetchDayPrayers(dateStr).catch(err => {
        console.log('Background: Failed to fetch day prayers:', err);
      }),
      streakStore.fetchUserStreak().catch(err => {
        console.log('Background: Failed to fetch streak:', err);
      }),
      friendsStore.fetchFriends().catch(err => {
        console.log('Background: Failed to fetch friends:', err);
      }),
    ]);
    
    console.log('✅ Background Task: Data fetched successfully (Widgets updated via Stores)');
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('❌ Background Task: Error fetching data:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// ============================================================================
// REGISTER BACKGROUND TASK
// ============================================================================
export const registerBackgroundTask = async () => {
  if (Platform.OS !== 'ios') {
    console.log('⚠️ Background tasks only supported on iOS');
    return;
  }
  
  try {
    // Check if task is already registered
    const isRegistered = await TaskManager.isTaskRegisteredAsync(WIDGET_UPDATE_TASK);
    
    if (isRegistered) {
      console.log('✅ Background task already registered');
      return;
    }
    
    // Register background fetch
    await BackgroundFetch.registerTaskAsync(WIDGET_UPDATE_TASK, {
      minimumInterval: 60 * 15, // 15 minutes (minimum allowed by iOS)
      stopOnTerminate: false, // Continue after app is closed
      startOnBoot: true, // Start after device reboot
    });
    
    console.log('✅ Background task registered successfully');
  } catch (error) {
    console.error('❌ Failed to register background task:', error);
  }
};

// ============================================================================
// UNREGISTER BACKGROUND TASK
// ============================================================================
export const unregisterBackgroundTask = async () => {
  try {
    await BackgroundFetch.unregisterTaskAsync(WIDGET_UPDATE_TASK);
    console.log('✅ Background task unregistered');
  } catch (error) {
    console.error('❌ Failed to unregister background task:', error);
  }
};

// ============================================================================
// CHECK TASK STATUS
// ============================================================================
export const getBackgroundTaskStatus = async () => {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    const isRegistered = await TaskManager.isTaskRegisteredAsync(WIDGET_UPDATE_TASK);
    
    console.log('📊 Background Task Status:', {
      status: status === BackgroundFetch.BackgroundFetchStatus.Available ? 'Available' : 'Restricted',
      isRegistered,
    });
    
    return { status, isRegistered };
  } catch (error) {
    console.error('❌ Failed to get task status:', error);
    return null;
  }
};