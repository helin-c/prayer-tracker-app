// ============================================================================
// FILE: src/screens/friends/FriendProfileScreen.jsx (WITH Islamic Loading)
// ============================================================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFriendsStore } from '../../store/friendsStore';
import { format, startOfWeek } from 'date-fns';
import { IslamicLoadingScreen } from '../../components/loading/IslamicLoadingScreen';

export const FriendProfileScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { friend } = route.params;
  const { getFriendWeekPrayers, removeFriend, isLoading } = useFriendsStore();
  
  const [weekData, setWeekData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeekData();
  }, []);

  const loadWeekData = async () => {
    try {
      const startDate = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const data = await getFriendWeekPrayers(friend.friend_id, startDate);
      setWeekData(data);
    } catch (error) {
      console.error('Error loading friend week data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFriend = () => {
    Alert.alert(
      t('friends.removeFriend'),
      t('friends.removeFriendConfirm', { name: friend.friend_name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFriend(friend.id);
              Alert.alert(t('common.success'), t('friends.friendRemoved'));
              navigation.goBack();
            } catch (error) {
              Alert.alert(t('common.error'), t('friends.errors.removeFailed'));
            }
          },
        },
      ]
    );
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getCompletionColor = (percentage) => {
    if (percentage >= 80) return '#00A86B';
    if (percentage >= 60) return '#FFA500';
    return '#DC3545';
  };

  if (loading) {
    return (
      <IslamicLoadingScreen 
        message={t('friends.loadingProfile')}
        submessage={t('common.pleaseWait')}
      />
    );
  }

  return (
    <ImageBackground
      source={require('../../assets/images/illustrations/background.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('friends.friendProfile')}</Text>
          <TouchableOpacity style={styles.moreButton} onPress={handleRemoveFriend}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getInitials(friend.friend_name)}
              </Text>
            </View>
            <Text style={styles.name}>{friend.friend_name}</Text>
            <Text style={styles.email}>{friend.friend_email}</Text>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="flame" size={32} color="#FF6B35" />
                <Text style={styles.statValue}>{friend.current_streak || 0}</Text>
                <Text style={styles.statLabel}>{t('friends.dayStreak')}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="trophy" size={32} color="#FFD700" />
                <Text style={styles.statValue}>{friend.best_streak || 0}</Text>
                <Text style={styles.statLabel}>{t('friends.bestStreak')}</Text>
              </View>
            </View>
          </View>

          {/* Week Progress */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('friends.thisWeekProgress')}</Text>
            
            {weekData ? (
              <View style={styles.weekGrid}>
                {weekData.days.map((day, index) => (
                  <View key={index} style={styles.dayCard}>
                    <Text style={styles.dayName}>
                      {format(new Date(day.date), 'EEE')}
                    </Text>
                    <View
                      style={[
                        styles.dayCircle,
                        {
                          backgroundColor: getCompletionColor(day.completion_percentage),
                        },
                      ]}
                    >
                      <Text style={styles.dayPercentage}>
                        {Math.round(day.completion_percentage)}%
                      </Text>
                    </View>
                    <Text style={styles.dayDate}>
                      {format(new Date(day.date), 'd')}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noData}>{t('friends.noPrayerData')}</Text>
            )}
          </View>

          {/* Remove Friend Button */}
          <TouchableOpacity
            style={styles.removeButton}
            onPress={handleRemoveFriend}
          >
            <Ionicons name="person-remove-outline" size={20} color="#DC3545" />
            <Text style={styles.removeButtonText}>{t('friends.removeFriend')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#00A86B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: '#E0E0E0',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  weekGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCard: {
    alignItems: 'center',
    flex: 1,
  },
  dayName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  dayPercentage: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFF',
  },
  dayDate: {
    fontSize: 10,
    color: '#999',
  },
  noData: {
    textAlign: 'center',
    fontSize: 14,
    color: '#999',
    padding: 20,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#DC3545',
    marginTop: 20,
  },
  removeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC3545',
  },
});