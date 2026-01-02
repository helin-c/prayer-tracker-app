// @ts-nocheck
// ============================================================================
// FILE: src/screens/profile/ProfileScreen.jsx (OPTIMIZED WITH SELECTORS)
// ============================================================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

// IMPORT THE NEW LAYOUT
import { ScreenLayout } from '../../components/layout/ScreenLayout';

// STORE IMPORTS
import { useAuthStore, selectUser } from '../../store/authStore';
import {
  useFriendsStore,
  selectFriends,
  selectPendingRequests,
  selectFriendsIsLoading,
} from '../../store/friendsStore';
import {
  usePrayerTrackerStore,
  selectPeriodStats,
  selectTrackerIsLoading,
} from '../../store/prayerTrackerStore';
import { usePrayerStore, selectLocation } from '../../store/prayerStore';

// COMPONENT IMPORTS
import {
  SkeletonLoader,
  SkeletonLine,
  SkeletonCircle,
} from '../../components/loading/SkeletonLoader';

// ... [ProfileSkeleton remains exactly the same] ...
const ProfileSkeleton = () => {
  const skeletonStyle = { backgroundColor: 'rgba(255, 255, 255, 0.4)' };
  return (
    <View style={{ padding: 20 }}>
      {/* Header Skeleton */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <SkeletonLine width={120} height={32} style={skeletonStyle} />
        <SkeletonCircle size={40} style={skeletonStyle} />
      </View>
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
          height={16}
          style={{ ...skeletonStyle, marginBottom: 20 }}
        />
        <View
          style={{
            flexDirection: 'row',
            width: '100%',
            justifyContent: 'space-around',
            marginBottom: 20,
          }}
        >
          {[1, 2, 3].map((i) => (
            <View key={i} style={{ alignItems: 'center' }}>
              <SkeletonLine
                width={30}
                height={24}
                style={{ ...skeletonStyle, marginBottom: 4 }}
              />
              <SkeletonLine width={50} height={12} style={skeletonStyle} />
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
          <SkeletonLoader
            width="48%"
            height={44}
            borderRadius={12}
            style={skeletonStyle}
          />
          <SkeletonLoader
            width="48%"
            height={44}
            borderRadius={12}
            style={skeletonStyle}
          />
        </View>
      </View>
      <SkeletonLine
        width={100}
        height={20}
        style={{ ...skeletonStyle, marginBottom: 12 }}
      />
      {[1, 2].map((i) => (
        <SkeletonLoader
          key={i}
          width="100%"
          height={80}
          borderRadius={12}
          style={{ ...skeletonStyle, marginBottom: 12 }}
        />
      ))}
    </View>
  );
};

export const ProfileScreen = ({ navigation }) => {
  const { t } = useTranslation();

  // ✅ OPTIMIZED: Use selectors
  const user = useAuthStore(selectUser);
  const logout = useAuthStore((state) => state.logout);

  const friends = useFriendsStore(selectFriends);
  const pendingRequests = useFriendsStore(selectPendingRequests);
  const isFriendsLoading = useFriendsStore(selectFriendsIsLoading);
  const fetchFriends = useFriendsStore((state) => state.fetchFriends);
  const fetchPendingRequests = useFriendsStore(
    (state) => state.fetchPendingRequests
  );

  const periodStats = usePrayerTrackerStore(selectPeriodStats);
  const isStatsLoading = usePrayerTrackerStore(selectTrackerIsLoading);
  const fetchPeriodStats = usePrayerTrackerStore(
    (state) => state.fetchPeriodStats
  );

  const location = usePrayerStore(selectLocation);

  const [refreshing, setRefreshing] = useState(false);

  // Use a local loading state for initial mount
  const [initialMountLoading, setInitialMountLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Start loading state
    setInitialMountLoading(true);
    try {
      await Promise.all([
        fetchFriends(),
        fetchPendingRequests(),
        // Ensure we explicitly fetch 'week' stats on load
        fetchPeriodStats('week'),
      ]);
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      // Small delay to ensure UI doesn't flash
      setTimeout(() => {
        setInitialMountLoading(false);
      }, 300);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchFriends(),
      fetchPendingRequests(),
      fetchPeriodStats('week'),
    ]);
    setRefreshing(false);
  };

  const handleLogout = () => {
    if (isLoggingOut) return;

    Alert.alert(t('profile.logout'), t('profile.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.logout'),
        style: 'destructive',
        onPress: async () => {
          setIsLoggingOut(true);
          try {
            await logout();
          } catch (error) {
            console.error(error);
            setIsLoggingOut(false);
          }
        },
      },
    ]);
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

  const getLocationDisplay = () => {
    if (location?.city && location?.country) {
      return `${location.city}, ${location.country}`;
    } else if (location?.city) {
      return location.city;
    } else if (location?.country) {
      return location.country;
    } else if (user?.location) {
      return user.location;
    }
    return t('profile.locationPlaceholder');
  };

  // CHECK: Should we show the skeleton?
  // Show if:
  // 1. Initial mount is happening
  // 2. OR Stats are loading AND we don't have stats data yet
  // 3. OR Friends are loading AND we don't have friends data yet
  const shouldShowSkeleton =
    initialMountLoading ||
    (isStatsLoading && !periodStats) ||
    (isFriendsLoading && !friends);

  return (
    // WRAPPED IN SCREEN LAYOUT
    <ScreenLayout noPaddingBottom={true}>
      {shouldShowSkeleton ? (
        <ProfileSkeleton />
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#5BA895"
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('profile.profile')}</Text>
            <TouchableOpacity
              style={styles.settingsButtonWrapper}
              onPress={() => navigation.navigate('Settings')}
            >
              <LinearGradient
                colors={[
                  'rgba(255, 255, 255, 0.95)',
                  'rgba(255, 255, 255, 0.95)',
                ]}
                style={styles.settingsButton}
              >
                <Ionicons name="settings-outline" size={24} color="#1A1A1A" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Profile Card */}
          <View style={styles.profileCardWrapper}>
            <LinearGradient
              colors={['rgba(240, 255, 244, 0.7)', 'rgba(240, 255, 244, 0.6)']}
              style={styles.profileCard}
            >
              <View style={styles.avatarContainer}>
                <View style={styles.avatarWrapper}>
                  <LinearGradient
                    colors={['#5BA895', '#4A9B87']}
                    style={styles.avatar}
                  >
                    <Text style={styles.avatarText}>
                      {getInitials(user?.full_name || user?.email)}
                    </Text>
                  </LinearGradient>
                </View>
                <View style={styles.statusBadge}>
                  <View style={styles.statusDot} />
                </View>
              </View>

              <Text style={styles.userName}>
                {user?.full_name || t('home.guest')}
              </Text>
              <Text style={styles.userEmail}>{user?.email}</Text>

              {/* Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {periodStats?.current_streak || 0}
                  </Text>
                  <Text style={styles.statLabel}>{t('friends.dayStreak')}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {/* Ensure completion_rate exists, default to 0 */}
                    {periodStats?.completion_rate !== undefined
                      ? Math.round(periodStats.completion_rate)
                      : 0}
                    %
                  </Text>
                  <Text style={styles.statLabel}>
                    {t('profile.completion')}
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{friends?.length || 0}</Text>
                  <Text style={styles.statLabel}>{t('friends.friends')}</Text>
                </View>
              </View>

              {/* Quick Actions */}
              <View style={styles.quickActions}>
                <TouchableOpacity
                  style={styles.actionButtonWrapper}
                  onPress={() => navigation.navigate('EditProfile')}
                >
                  <LinearGradient
                    colors={[
                      'rgba(255, 255, 255, 0.95)',
                      'rgba(255, 255, 255, 0.95)',
                    ]}
                    style={styles.actionButton}
                  >
                    <Ionicons name="create-outline" size={20} color="#5BA895" />
                    <Text style={styles.actionButtonText}>
                      {t('profile.editProfile')}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButtonWrapper}
                  onPress={() => navigation.navigate('AddFriend')}
                >
                  <LinearGradient
                    colors={['#5BA895', '#4A9B87']}
                    style={styles.actionButton}
                  >
                    <Ionicons
                      name="person-add-outline"
                      size={20}
                      color="#FFF"
                    />
                    <Text style={styles.actionButtonTextSecondary}>
                      {t('friends.addFriend')}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>

          {/* Pending Requests */}
          {pendingRequests && pendingRequests.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="mail-outline" size={20} color="#5BA895" />
                <Text style={styles.sectionTitle}>
                  {t('friends.friendRequests')}
                </Text>
                <View style={styles.badgeWrapper}>
                  <LinearGradient
                    colors={['#5BA895', '#4A9B87']}
                    style={styles.badge}
                  >
                    <Text style={styles.badgeText}>
                      {pendingRequests.length}
                    </Text>
                  </LinearGradient>
                </View>
              </View>

              {pendingRequests.map((request, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.requestCardWrapper}
                  onPress={() =>
                    navigation.navigate('FriendRequest', { request })
                  }
                >
                  <LinearGradient
                    colors={[
                      'rgba(255, 255, 255, 0.95)',
                      'rgba(255, 255, 255, 0.95)',
                    ]}
                    style={styles.requestCard}
                  >
                    <View style={styles.requestAvatarWrapper}>
                      <LinearGradient
                        colors={['#3498DB', '#2E86C1']}
                        style={styles.requestAvatar}
                      >
                        <Text style={styles.requestAvatarText}>
                          {getInitials(request.sender_name)}
                        </Text>
                      </LinearGradient>
                    </View>
                    <View style={styles.requestInfo}>
                      <Text style={styles.requestName}>
                        {request.sender_name}
                      </Text>
                      <Text style={styles.requestEmail}>
                        {request.sender_email}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#5BA895"
                    />
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Friends List */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="people-outline" size={20} color="#1A1A1A" />
              <Text style={styles.sectionTitle}>{t('friends.friends')}</Text>
              <Text style={styles.sectionCount}>{friends?.length || 0}</Text>
            </View>

            {friends && friends.length > 0 ? (
              friends.map((friend, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.friendCardWrapper}
                  onPress={() =>
                    navigation.navigate('FriendProfile', { friend })
                  }
                >
                  <LinearGradient
                    colors={[
                      'rgba(255, 255, 255, 0.95)',
                      'rgba(255, 255, 255, 0.95)',
                    ]}
                    style={styles.friendCard}
                  >
                    <View style={styles.friendAvatarWrapper}>
                      <LinearGradient
                        colors={['#5BA895', '#4A9B87']}
                        style={styles.friendAvatar}
                      >
                        <Text style={styles.friendAvatarText}>
                          {getInitials(friend.friend_name)}
                        </Text>
                      </LinearGradient>
                    </View>
                    <View style={styles.friendInfo}>
                      <Text style={styles.friendName}>
                        {friend.friend_name}
                      </Text>
                      <View style={styles.friendStats}>
                        <Ionicons name="flame" size={14} color="#FF8C42" />
                        <Text style={styles.friendStatsText}>
                          {friend.current_streak || 0}{' '}
                          {t('friends.dayStreak').toLowerCase()}
                        </Text>
                      </View>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#5BA895"
                    />
                  </LinearGradient>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyStateWrapper}>
                <LinearGradient
                  colors={[
                    'rgba(240, 255, 244, 0.7)',
                    'rgba(240, 255, 244, 0.6)',
                  ]}
                  style={styles.emptyState}
                >
                  <View style={styles.emptyIconWrapper}>
                    <LinearGradient
                      colors={['#5BA895', '#4A9B87']}
                      style={styles.emptyIconGradient}
                    >
                      <Ionicons
                        name="people-outline"
                        size={48}
                        color="#FFFFFF"
                      />
                    </LinearGradient>
                  </View>
                  <Text style={styles.emptyText}>{t('friends.noFriends')}</Text>
                  <Text style={styles.emptySubtext}>
                    {t('friends.noFriendsDescription')}
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyButtonWrapper}
                    onPress={() => navigation.navigate('AddFriend')}
                  >
                    <LinearGradient
                      colors={['#5BA895', '#4A9B87']}
                      style={styles.emptyButton}
                    >
                      <Text style={styles.emptyButtonText}>
                        {t('friends.addFriend')}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            )}
          </View>

          {/* Profile Info */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#1A1A1A"
              />
              <Text style={styles.sectionTitle}>
                {t('profile.accountInfo')}
              </Text>
            </View>

            <View style={styles.infoCardWrapper}>
              <LinearGradient
                colors={[
                  'rgba(255, 255, 255, 0.95)',
                  'rgba(255, 255, 255, 0.95)',
                ]}
                style={styles.infoCard}
              >
                <View style={styles.infoRow}>
                  <View style={styles.infoLeft}>
                    <Ionicons
                      name="location-outline"
                      size={20}
                      color="#1A1A1A"
                    />
                    <Text style={styles.infoLabel}>
                      {t('profile.location')}
                    </Text>
                  </View>
                  <Text style={styles.infoValue}>{getLocationDisplay()}</Text>
                </View>

                <View style={styles.infoDivider} />

                <View style={styles.infoRow}>
                  <View style={styles.infoLeft}>
                    <Ionicons
                      name="language-outline"
                      size={20}
                      color="#1A1A1A"
                    />
                    <Text style={styles.infoLabel}>
                      {t('profile.language')}
                    </Text>
                  </View>
                  <Text style={styles.infoValue}>
                    {user?.preferred_language?.toUpperCase() || 'EN'}
                  </Text>
                </View>

                <View style={styles.infoDivider} />

                <View style={styles.infoRow}>
                  <View style={styles.infoLeft}>
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color="#1A1A1A"
                    />
                    <Text style={styles.infoLabel}>
                      {t('profile.memberSince')}
                    </Text>
                  </View>
                  <Text style={styles.infoValue}>
                    {user?.created_at
                      ? new Date(user.created_at).toLocaleDateString()
                      : '-'}
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutButtonWrapper}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            <LinearGradient
              colors={[
                'rgba(255, 255, 255, 0.95)',
                'rgba(255, 255, 255, 0.95)',
              ]}
              style={styles.logoutButton}
            >
              {isLoggingOut ? (
                <ActivityIndicator size="small" color="#DC3545" />
              ) : (
                <>
                  <Ionicons name="log-out-outline" size={20} color="#DC3545" />
                  <Text style={styles.logoutText}>{t('profile.logout')}</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Version */}
          <Text style={styles.versionText}>{t('profile.version')} 1.0.0</Text>

          {/* CinkoTech Footer */}
          <View style={styles.footerContainer}>
            <View style={styles.footerDivider} />

            <Text style={styles.footerBrand}>
              {t('profile.designedBy')}{' '}
              <Text style={styles.cinkoTechHighlight}>CinkoTech</Text>
            </Text>

            <Text style={styles.footerMessage}>
              {t('profile.nonProfitMessage')}
            </Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#1A1A1A' },
  settingsButtonWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Profile Card
  profileCardWrapper: {
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  profileCard: {
    padding: 24,
    alignItems: 'center',
  },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatarWrapper: {
    borderRadius: 50,
    overflow: 'hidden',
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  avatar: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: '#FFF' },
  statusBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  statusDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#5BA895',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#1A1A1A',
    marginBottom: 20,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5BA895',
    marginBottom: 4,
  },
  statLabel: { fontSize: 12, color: '#1A1A1A', fontWeight: '600' },
  statDivider: {
    width: 2,
    height: 40,
    backgroundColor: 'rgba(91, 168, 149, 0.2)',
  },
  quickActions: { flexDirection: 'row', width: '100%', gap: 12 },
  actionButtonWrapper: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  actionButtonText: { fontSize: 14, fontWeight: '700', color: '#5BA895' },
  actionButtonTextSecondary: { fontSize: 14, fontWeight: '700', color: '#FFF' },

  // Section
  section: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A', flex: 1 },
  sectionCount: { fontSize: 14, color: '#1A1A1A', fontWeight: '600' },
  badgeWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: { fontSize: 12, fontWeight: 'bold', color: '#FFF' },

  // Request Card
  requestCardWrapper: {
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  requestAvatarWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    marginRight: 12,
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  requestAvatar: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestAvatarText: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  requestInfo: { flex: 1 },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  requestEmail: { fontSize: 14, color: '#1A1A1A', fontWeight: '500' },

  // Friend Card
  friendCardWrapper: {
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  friendAvatarWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    marginRight: 12,
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  friendAvatar: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendAvatarText: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  friendInfo: { flex: 1 },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  friendStats: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  friendStatsText: { fontSize: 12, color: '#1A1A1A', fontWeight: '600' },

  // Empty State
  emptyStateWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyIconWrapper: {
    borderRadius: 40,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  emptyIconGradient: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#1A1A1A',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptyButtonWrapper: {
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 16,
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyButtonText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  // Info Card
  infoCardWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  infoCard: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoLabel: { fontSize: 15, color: '#1A1A1A', fontWeight: '600' },
  infoValue: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  infoDivider: { height: 2, backgroundColor: 'rgba(91, 168, 149, 0.15)' },

  // Logout Button
  logoutButtonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 16,
    shadowColor: '#DC3545',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
    borderWidth: 2,
    borderColor: '#DC3545',
    borderRadius: 12,
    height: 56, // Fixed height for consistent layout with spinner
  },
  logoutText: { fontSize: 16, fontWeight: '700', color: '#DC3545' },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  footerContainer: {
    marginTop: 20,
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  footerDivider: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 16,
  },
  footerBrand: {
    fontSize: 13,
    color: '#1A1A1A',
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  cinkoTechHighlight: {
    color: '#00A86B',
    fontWeight: '800',
  },
  footerMessage: {
    fontSize: 11,
    color: '#1A1A1A',
    textAlign: 'center',
    lineHeight: 16,
    fontStyle: 'italic',
  },
});
