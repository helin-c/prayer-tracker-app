// ============================================================================
// FILE: src/services/widgetService.js 
// ============================================================================

import { NativeModules, Platform } from 'react-native';
import { useStreakStore } from '../store/streakStore'; 

const { WidgetDataManager } = NativeModules;

class WidgetService {
  
  // ============================================================================
  // UPDATE NEXT PRAYER WIDGET
  // ============================================================================
  updateNextPrayerWidget(prayerTimes, location, currentNextPrayer) {
    if (Platform.OS !== 'ios' || !WidgetDataManager) {
      console.log('⚠️  Widget updates only available on iOS');
      return;
    }
    
    if (!prayerTimes) {
      console.log('⚠️  No prayer times available for widget');
      return;
    }
    
    try {
      const now = new Date();
      const prayerOrder = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
      
      let nextPrayer = currentNextPrayer || 'fajr';
      let nextPrayerTime = prayerTimes[nextPrayer]?.time || '--:--';
      
      // Calculate time remaining
      if (nextPrayerTime !== '--:--') {
        const [hours, minutes] = nextPrayerTime.split(':').map(Number);
        const prayerTime = new Date();
        prayerTime.setHours(hours, minutes, 0, 0);
        
        if (prayerTime < now) {
          prayerTime.setDate(prayerTime.getDate() + 1);
        }
        
        const diff = Math.max(0, prayerTime - now);
        const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
        const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        const timeRemaining = hoursLeft > 0 
          ? `${hoursLeft}h ${minutesLeft}m` 
          : `${minutesLeft}m`;
        
        // Prepare all prayers for medium/large widgets
        const allPrayers = prayerOrder.map(name => ({
          name,
          time: prayerTimes[name]?.time || '--:--',
          icon: this.getPrayerIcon(name)
        }));
        
        const data = {
          nextPrayer,
          nextPrayerTime,
          location: location?.city || 'Unknown',
          timeRemaining,
          allPrayers
        };
        
        WidgetDataManager.updateNextPrayer(data);
        console.log('✅ Next Prayer Widget Updated:', nextPrayer, nextPrayerTime);
      }
    } catch (error) {
      console.error('❌ Failed to update Next Prayer Widget:', error);
    }
  }
  
  // ============================================================================
  // UPDATE DAILY PROGRESS WIDGET (✅ WITH REAL-TIME STREAK)
  // ============================================================================
  updateDailyProgressWidget(dayPrayers) {
    if (Platform.OS !== 'ios' || !WidgetDataManager) {
      console.log('⚠️  Widget updates only available on iOS');
      return;
    }
    
    if (!dayPrayers) {
      console.log('⚠️  No day prayers data available for widget');
      return;
    }
    
    try {
      // Map prayers array
      const prayers = dayPrayers.prayers?.map(prayer => ({
        name: prayer.prayer_name,
        completed: prayer.completed,
        onTime: prayer.on_time
      })) || [];
      
      // Calculate completed and on-time counts from the prayers array
      const completedCount = prayers.filter(p => p.completed).length;
      const onTimeCount = prayers.filter(p => p.onTime).length;
      
      // ✅ GET STREAK FROM STREAK STORE (not from dayPrayers)
      const streakStore = useStreakStore.getState();
      const currentStreak = streakStore.userStreak.current || 0;
      
      const data = {
        completionPercentage: dayPrayers.completion_percentage || 0,
        completedPrayers: completedCount,
        totalPrayers: 5,
        onTimePrayers: onTimeCount,
        currentStreak: currentStreak, // ✅ Use streak from store
        prayers
      };
      
      console.log('📊 Widget Data:', {
        percentage: data.completionPercentage,
        completed: data.completedPrayers,
        onTime: data.onTimePrayers,
        streak: data.currentStreak,
        prayersCount: prayers.length
      });
      
      WidgetDataManager.updateDailyProgress(data);
      console.log('✅ Daily Progress Widget Updated:', `${data.completionPercentage}% (${data.completedPrayers}/5)`);
    } catch (error) {
      console.error('❌ Failed to update Daily Progress Widget:', error);
    }
  }
  
  // ============================================================================
  // UPDATE FRIEND STREAKS WIDGET
  // ============================================================================
  updateFriendStreaksWidget(friends) {
    if (Platform.OS !== 'ios' || !WidgetDataManager) {
      console.log('⚠️  Widget updates only available on iOS');
      return;
    }
    
    if (!friends || friends.length === 0) {
      console.log('⚠️  No friends data available for widget');
      // Still update with empty data to show "No Friends Yet" state
      try {
        const data = {
          friends: [],
          totalFriends: 0
        };
        WidgetDataManager.updateFriendStreaks(data);
      } catch (error) {
        console.error('❌ Failed to update Friend Streaks Widget:', error);
      }
      return;
    }
    
    try {
      // Sort by streak and take top 5
      const topFriends = friends
        .sort((a, b) => (b.current_streak || 0) - (a.current_streak || 0))
        .slice(0, 5)
        .map(friend => ({
          name: friend.friend_name,
          streak: friend.current_streak || 0,
          initials: this.getInitials(friend.friend_name)
        }));
      
      const data = {
        friends: topFriends,
        totalFriends: friends.length
      };
      
      WidgetDataManager.updateFriendStreaks(data);
      console.log('✅ Friend Streaks Widget Updated:', `${friends.length} friends`);
    } catch (error) {
      console.error('❌ Failed to update Friend Streaks Widget:', error);
    }
  }
  
  // ============================================================================
  // SAVE LANGUAGE PREFERENCE
  // ============================================================================
  saveLanguage(language) {
    if (Platform.OS !== 'ios' || !WidgetDataManager) {
      console.log('⚠️  Widget language update only available on iOS');
      return;
    }
    
    try {
      WidgetDataManager.saveLanguage(language);
      console.log('✅ Widget Language Updated:', language);
    } catch (error) {
      console.error('❌ Failed to update widget language:', error);
    }
  }
  
  // ============================================================================
  // UPDATE ALL WIDGETS
  // ============================================================================
  async updateAllWidgets() {
    if (Platform.OS !== 'ios' || !WidgetDataManager) {
      console.log('⚠️  Widget updates only available on iOS');
      return;
    }
    
    try {
      WidgetDataManager.reloadAllWidgets();
      console.log('✅ All Widgets Reloaded');
    } catch (error) {
      console.error('❌ Failed to reload widgets:', error);
    }
  }
  
  // ============================================================================
  // HELPERS
  // ============================================================================
  getPrayerIcon(prayer) {
    const icons = {
      fajr: 'sunrise',
      dhuhr: 'sun',
      asr: 'cloud.sun',
      maghrib: 'sunset',
      isha: 'moon'
    };
    return icons[prayer.toLowerCase()] || 'moon';
  }
  
  getInitials(name) {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}

export default new WidgetService();