// @ts-nocheck
// ============================================================================
// FILE: src/screens/friends/FriendProfileScreen.jsx (PRODUCTION READY)
// ============================================================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
// REMOVED: SafeAreaView (ScreenLayout handles this)
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFriendsStore } from '../../store/friendsStore';
import { format, startOfWeek } from 'date-fns';

// IMPORT THE NEW LAYOUT
import { ScreenLayout } from '../../components/layout/ScreenLayout';

// COMPONENT IMPORTS
import {
  SkeletonLoader,
  SkeletonLine,
  SkeletonCircle,
} from '../../components/loading/SkeletonLoader';

const FriendSkeleton = () => {
  const skeletonStyle = { backgroundColor: 'rgba(255, 255, 255, 0.4)' };

  return (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Profile Card Skeleton */}
      <View
        style={{
          padding: 24,
          alignItems: 'center',
          borderRadius: 20,
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          marginBottom: 20,
        }}
      >
        <SkeletonCircle
          size={100}
          style={{ ...skeletonStyle, marginBottom: 16 }}
        />
        <SkeletonLine
          width={180}
          height={24}
          style={{ ...skeletonStyle, marginBottom: 8 }}
        />
        <SkeletonLine
          width={140}
          height={14}
          style={{ ...skeletonStyle, marginBottom: 20 }}
        />

        {/* Stats Row */}
        <View
          style={{
            flexDirection: 'row',
            width: '100%',
            justifyContent: 'space-around',
            marginTop: 12,
          }}
        >
          <View style={{ alignItems: 'center' }}>
            <SkeletonCircle
              size={32}
              style={{ ...skeletonStyle, marginBottom: 8 }}
            />
            <SkeletonLine
              width={30}
              height={20}
              style={{ ...skeletonStyle, marginBottom: 4 }}
            />
            <SkeletonLine width={50} height={12} style={skeletonStyle} />
          </View>
          <View style={{ alignItems: 'center' }}>
            <SkeletonCircle
              size={32}
              style={{ ...skeletonStyle, marginBottom: 8 }}
            />
            <SkeletonLine
              width={30}
              height={20}
              style={{ ...skeletonStyle, marginBottom: 4 }}
            />
            <SkeletonLine width={50} height={12} style={skeletonStyle} />
          </View>
        </View>
      </View>

      {/* Week Progress Skeleton */}
      <View style={{ marginBottom: 20 }}>
        <SkeletonLine
          width={160}
          height={18}
          style={{ ...skeletonStyle, marginBottom: 16 }}
        />

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            borderRadius: 16,
            padding: 16,
          }}
        >
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <View key={i} style={{ alignItems: 'center' }}>
              <SkeletonLine
                width={20}
                height={10}
                style={{ ...skeletonStyle, marginBottom: 8 }}
              />
              <SkeletonCircle
                size={40}
                style={{ ...skeletonStyle, marginBottom: 4 }}
              />
              <SkeletonLine width={15} height={8} style={skeletonStyle} />
            </View>
          ))}
        </View>
      </View>

      {/* Button Skeleton */}
      <SkeletonLoader
        width="100%"
        height={56}
        borderRadius={12}
        style={{ ...skeletonStyle, marginTop: 20, marginBottom: 40 }}
      />
    </ScrollView>
  );
};


// ============================================================================
// MAIN COMPONENT
// ============================================================================
export const FriendProfileScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { friend } = route.params;
  const { getFriendWeekPrayers, removeFriend } = useFriendsStore();

  const [weekData, setWeekData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRemoving, setIsRemoving] = useState(false); 
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadWeekData();
  }, []);

  const loadWeekData = async () => {
    try {
      const startDate = format(
        startOfWeek(new Date(), { weekStartsOn: 1 }),
        'yyyy-MM-dd'
      );
      const data = await getFriendWeekPrayers(friend.friend_id, startDate);
      setWeekData(data);
    } catch (error) {
      console.error('Error loading friend week data:', error);
    } finally {
      setLoading(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleRemoveFriend = () => {
    if (isRemoving) return;

    Alert.alert(
      t('friends.removeFriend'),
      t('friends.removeFriendConfirm', { name: friend.friend_name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            setIsRemoving(true);
            try {
              await removeFriend(friend.id);
              Alert.alert(t('common.success'), t('friends.friendRemoved'));
              navigation.goBack();
            } catch (error) {
              Alert.alert(t('common.error'), t('friends.errors.removeFailed'));
              setIsRemoving(false);
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
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getCompletionColor = (percentage) => {
    if (percentage >= 80) return '#00A86B';
    if (percentage >= 60) return '#FFA500';
    return '#DC3545';
  };

  return (
    // WRAPPED IN SCREEN LAYOUT
    <ScreenLayout noPaddingBottom={true}>
        {/* Header - Always Visible */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            disabled={isRemoving}
          >
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('friends.friendProfile')}</Text>
          <TouchableOpacity
            style={styles.moreButton}
            onPress={handleRemoveFriend}
            disabled={loading || isRemoving}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Content - Shows Skeleton or Real Data */}
        {loading ? (
          <FriendSkeleton />
        ) : (
          <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
            >
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
                    <Text style={styles.statValue}>
                      {friend.current_streak || 0}
                    </Text>
                    <Text style={styles.statLabel}>
                      {t('friends.dayStreak')}
                    </Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Ionicons name="trophy" size={32} color="#FFD700" />
                    <Text style={styles.statValue}>
                      {friend.best_streak || 0}
                    </Text>
                    <Text style={styles.statLabel}>
                      {t('friends.bestStreak')}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Week Progress */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {t('friends.thisWeekProgress')}
                </Text>

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
                              backgroundColor: getCompletionColor(
                                day.completion_percentage
                              ),
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

              {/* Remove Friend Button with Spinner */}
              <TouchableOpacity
                style={styles.removeButton}
                onPress={handleRemoveFriend}
                disabled={isRemoving}
              >
                {isRemoving ? (
                  <ActivityIndicator size="small" color="#DC3545" />
                ) : (
                  <>
                    <Ionicons
                      name="person-remove-outline"
                      size={20}
                      color="#DC3545"
                    />
                    <Text style={styles.removeButtonText}>
                      {t('friends.removeFriend')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              
              {/* Extra bottom padding */}
              <View style={{height: 40}} />
            </ScrollView>
          </Animated.View>
        )}
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  // Removed container and safeArea since Layout handles them
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  // ... [Rest of the styles remain exactly the same] ...
  profileCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  // ...
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
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    height: 56, 
  },
  removeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC3545',
  },
  // Add other styles back here (avatar, name, email, statsRow, etc.)
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#00A86B', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: '#FFF' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 4 },
  email: { fontSize: 14, color: '#666', marginBottom: 20 },
  statsRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginTop: 24 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A', marginTop: 8, marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#666' },
  statDivider: { width: 1, height: 60, backgroundColor: '#E0E0E0' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 16 },
  weekGrid: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#FFF', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  dayCard: { alignItems: 'center', flex: 1 },
  dayName: { fontSize: 12, fontWeight: '600', color: '#666', marginBottom: 8 },
  dayCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  dayPercentage: { fontSize: 11, fontWeight: 'bold', color: '#FFF' },
  dayDate: { fontSize: 10, color: '#999' },
  noData: { textAlign: 'center', fontSize: 14, color: '#999', padding: 20, backgroundColor: '#FFF', borderRadius: 16 },
});