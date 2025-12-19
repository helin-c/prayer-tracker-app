// @ts-nocheck
// ============================================================================
// FILE: src/screens/home/HomeScreen.jsx (SKELETON LOADING ADDED)
// ============================================================================
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
  Linking,
  FlatList,
  Animated,
} from 'react-native';
// REMOVED: SafeAreaView (ScreenLayout handles this)
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

// IMPORT THE NEW LAYOUT
import { ScreenLayout } from '../../components/layout/ScreenLayout';

import { useAuthStore } from '../../store/authStore';
import { usePrayerStore } from '../../store/prayerStore';
import { useFriendsStore } from '../../store/friendsStore';
import { CircularPrayerCard } from '../../components/prayers/CircularPrayerCard';
import { formatIslamicDate } from '../../utils/timeUtils';
import { DailyQuoteCard } from '../../components/quotes/DailyQuoteCard';

const { width } = Dimensions.get('window');

// ============================================================================
// PRODUCTION-READY SKELETON COMPONENT
// ============================================================================
const SkeletonItem = ({ style }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        {
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          borderRadius: 12,
          opacity,
        },
        style,
      ]}
    />
  );
};

const HomeSkeleton = () => {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
      {/* Greeting Skeleton */}
      <SkeletonItem
        style={{
          height: 60,
          width: '100%',
          borderRadius: 20,
          marginBottom: 12,
        }}
      />

      {/* Chips Skeleton */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
        <SkeletonItem style={{ height: 40, flex: 1, borderRadius: 18 }} />
        <SkeletonItem style={{ height: 40, flex: 1, borderRadius: 18 }} />
      </View>

      {/* Main Prayer Card Skeleton */}
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <SkeletonItem
          style={{
            width: width - 80,
            height: width - 80,
            borderRadius: (width - 80) / 2,
          }}
        />
      </View>

      {/* Tracker Notification Skeleton */}
      <SkeletonItem
        style={{
          height: 90,
          width: '100%',
          borderRadius: 24,
          marginBottom: 28,
        }}
      />

      {/* Friends Section Skeleton */}
      <View style={{ marginBottom: 20 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <SkeletonItem style={{ width: 120, height: 24 }} />
          <SkeletonItem style={{ width: 60, height: 24 }} />
        </View>
        {[1, 2, 3].map((key) => (
          <SkeletonItem
            key={key}
            style={{
              height: 80,
              width: '100%',
              borderRadius: 20,
              marginBottom: 12,
            }}
          />
        ))}
      </View>
    </View>
  );
};

// ============================================================================
// MAIN SCREEN
// ============================================================================
export const HomeScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const {
    prayerTimes,
    location,
    isLoading, // Comes from PrayerStore
    error,
    fetchWithCurrentLocation,
    loadSavedLocation,
    clearError,
    isCacheValid,
  } = usePrayerStore();

  const { friends, fetchFriends } = useFriendsStore();

  const [refreshing, setRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // Local loading state to ensure we wait for initial mounting/checking
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const init = async () => {
      await initializePrayerTimes();
      await fetchFriends();
      // Only set this to false after we've attempted to fetch/load
      setIsInitializing(false); 
    };
    init();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (prayerTimes && !isCacheValid()) {
        fetchWithCurrentLocation(true);
      }
      fetchFriends();
    }, [prayerTimes])
  );

  const initializePrayerTimes = async () => {
    await loadSavedLocation();
    // Use stored location if available, otherwise fetch
    if (!location && !prayerTimes) {
      await fetchWithCurrentLocation();
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    clearError();
    const result = await fetchWithCurrentLocation(true);
    await fetchFriends();

    if (!result.success) {
      Alert.alert(
        t('home.unableToRefresh'),
        result.error,
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.retry'),
            onPress: () => {
              setRetryCount((prev) => prev + 1);
              onRefresh();
            },
          },
        ],
        { cancelable: true }
      );
    }
    setRefreshing(false);
  };

  const handleLocationPress = async () => {
    Alert.alert(t('home.updateLocation'), t('home.getLocationQuestion'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('home.update'),
        onPress: async () => {
          clearError();
          const result = await fetchWithCurrentLocation(true);
          if (!result.success) {
            if (result.error.includes('permission')) {
              Alert.alert(
                t('home.locationPermissionRequired'),
                t('home.enableLocationMessage'),
                [
                  { text: t('common.cancel'), style: 'cancel' },
                  {
                    text: t('home.openSettings'),
                    onPress: () => {
                      Platform.OS === 'ios'
                        ? Linking.openURL('app-settings:')
                        : Linking.openSettings();
                    },
                  },
                ]
              );
            } else {
              Alert.alert(t('common.error'), result.error);
            }
          }
        },
      },
    ]);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.goodMorning');
    if (hour < 17) return t('home.goodAfternoon');
    if (hour < 21) return t('home.goodEvening');
    return t('home.goodNight');
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

  const renderFriendItem = ({ item }) => (
    <TouchableOpacity
      style={styles.friendCard}
      activeOpacity={0.9}
      onPress={() =>
        navigation.navigate('Profile', {
          screen: 'FriendProfile',
          params: { friend: item },
        })
      }
    >
      <LinearGradient
        colors={['rgba(240, 255, 244, 0.95)', 'rgba(240, 255, 244, 0.95)']}
        style={styles.friendCardGradient}
      >
        <View style={styles.friendAvatar}>
          <LinearGradient
            colors={['#5BA895', '#4A9B87']}
            style={styles.friendAvatarGradient}
          >
            <Text style={styles.friendAvatarText}>
              {getInitials(item.friend_name)}
            </Text>
          </LinearGradient>
        </View>
        <View style={styles.friendInfo}>
          <Text style={styles.friendName} numberOfLines={1}>
            {item.friend_name}
          </Text>
          <View style={styles.friendStats}>
            <Ionicons name="flame" size={14} color="#FF8C42" />
            <Text style={styles.friendStreakText}>
              {item.current_streak || 0}{' '}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#1A1A1A" />
      </LinearGradient>
    </TouchableOpacity>
  );

  // KEY FIX: Improved Loading Logic
  // We show skeleton if:
  // 1. We are initializing (first boot check)
  // 2. PrayerStore says it is loading (fetching data)
  // 3. We don't have prayer times yet (critical data missing)
  const shouldShowSkeleton = isInitializing || isLoading || !prayerTimes;

  return (
    // WRAPPED IN SCREEN LAYOUT
    // We pass noPaddingBottom={true} because the ScrollView has its own contentContainer padding
    // to handle the TabBar space
    <ScreenLayout noPaddingBottom={true}>
      
      {shouldShowSkeleton ? (
        // SKELETON LOADING STATE (Only shows until we have data)
        <HomeSkeleton />
      ) : (
        // ACTUAL CONTENT (Only renders when we have Prayer Times)
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#5BA895"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Greeting, Location & Islamic Date Combined */}
          <View style={styles.topSection}>
            {/* Greeting Section */}
            <View style={styles.greetingCard}>
              <LinearGradient
                colors={[
                  'rgba(240, 255, 244, 0.95)',
                  'rgba(240, 255, 244, 0.95)',
                ]}
                style={styles.greetingGradient}
              >
                <Text style={styles.greetingText}>
                  {getGreeting()},{' '}
                  <Text style={styles.userName}>
                    {user?.full_name || user?.username || t('home.guest')}
                  </Text>
                </Text>
              </LinearGradient>
            </View>

            {/* Location & Islamic Date Row */}
            <View style={styles.topBar}>
              <TouchableOpacity
                style={styles.headerItemOuter}
                onPress={handleLocationPress}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['transparent', 'transparent']}
                  style={styles.headerGradientBorder}
                >
                  <View style={styles.locationIconWrapper}>
                    <Ionicons name="location-sharp" size={14} color="#1A1A1A" />
                  </View>
                  <Text
                    style={styles.headerText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {location?.city || t('home.unknownLocation')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.headerItemOuter}>
                <LinearGradient
                  colors={['transparent', 'transparent']}
                  style={styles.headerGradientBorder}
                >
                  <Ionicons name="calendar-outline" size={14} color="#1A1A1A" />
                  <Text style={styles.headerText}>
                    {formatIslamicDate(new Date(), i18n.language)}
                  </Text>
                </LinearGradient>
              </View>
            </View>
          </View>

          {/* Main Circular Prayer Card */}
          {prayerTimes && (
            <View style={styles.mainCardContainer}>
              <CircularPrayerCard prayerTimes={prayerTimes} />
            </View>
          )}

          {/* Prayer Tracker Reminder */}
          {prayerTimes && (
            <TouchableOpacity
              style={styles.trackerNotification}
              activeOpacity={0.95}
              onPress={() => navigation.navigate('PrayerTracker')}
            >
              <LinearGradient
                colors={[
                  'rgba(240, 255, 244, 0.95)',
                  'rgba(240, 255, 244, 0.95)',
                ]}
                style={styles.notificationGradient}
              >
                <View style={styles.notificationContent}>
                  <View style={styles.notificationLeft}>
                    <View style={styles.notificationIconCircle}>
                      <LinearGradient
                        colors={['#5BA895', '#4A9B87']}
                        style={styles.notificationIconGradient}
                      >
                        <Ionicons name="checkbox" size={28} color="#FFFFFF" />
                      </LinearGradient>
                    </View>

                    <View style={styles.notificationTextContainer}>
                      <Text style={styles.notificationTitle}>
                        {t('home.trackYourPrayers')}
                      </Text>
                      <Text style={styles.notificationSubtitle}>
                        {t('home.markPrayersCompleted')}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.notificationArrow}>
                    <Ionicons name="arrow-forward" size={20} color="#1A1A1A" />
                  </View>
                </View>

                <View style={styles.decorCircle1} />
                <View style={styles.decorCircle2} />
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Friends Section */}
          {friends && friends.length > 0 && (
            <View style={styles.friendsSection}>
              <View style={styles.sectionHeaderContainer}>
                <View style={styles.sectionHeaderOuter}>
                  <LinearGradient
                    colors={['transparent', 'transparent']}
                    style={styles.sectionHeaderBorder}
                  >
                    <Ionicons name="people" size={18} color="#1A1A1A" />
                    <Text style={styles.sectionTitle}>
                      {t('friends.myFriends')}
                    </Text>
                  </LinearGradient>
                </View>

                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() =>
                    navigation.navigate('Profile', {
                      screen: 'ProfileMain',
                    })
                  }
                >
                  <Text style={styles.viewAllText}>{t('common.viewAll')}</Text>
                  <Ionicons name="arrow-forward" size={14} color="#1A1A1A" />
                </TouchableOpacity>
              </View>

              <FlatList
                data={friends.slice(0, 5)}
                renderItem={renderFriendItem}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
                contentContainerStyle={styles.friendsList}
              />
            </View>
          )}

          {/* Daily Inspiration Quote Card */}
          <View style={styles.quoteSection}>
            <View style={styles.quoteSectionHeaderOuter}>
              <LinearGradient
                colors={['transparent', 'transparent']}
                style={styles.quoteSectionBorder}
              >
                <Ionicons name="sparkles" size={18} color="#1A1A1A" />
                <Text style={styles.quoteSectionTitle}>
                  {t('home.dailyInspiration')}
                </Text>
              </LinearGradient>
            </View>
            <DailyQuoteCard />
          </View>

          {/* Error Banner */}
          {error && (
            <View style={styles.errorBanner}>
              <LinearGradient
                colors={['rgba(239, 68, 68, 0.2)', 'rgba(220, 38, 38, 0.15)']}
                style={styles.errorGradient}
              >
                <Ionicons name="alert-circle" size={20} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                  onPress={clearError}
                  style={styles.errorClose}
                >
                  <Ionicons name="close" size={18} color="#DC2626" />
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}

          {/* Empty State */}
          {!prayerTimes && !isLoading && (
            <View style={styles.emptyState}>
              <LinearGradient
                colors={['#F0FFF4', '#F0FFF4']}
                style={styles.emptyStateGradient}
              >
                <View style={styles.emptyIconContainer}>
                  <LinearGradient
                    colors={['#5BA895', '#4A9B87']}
                    style={styles.emptyIconGradient}
                  >
                    <Ionicons name="location" size={56} color="#FFFFFF" />
                  </LinearGradient>
                </View>
                <Text style={styles.emptyTitle}>{t('home.welcome')}</Text>
                <Text style={styles.emptyText}>
                  {t('home.enableLocationDescription')}
                </Text>
                <TouchableOpacity
                  style={styles.enableLocationButton}
                  onPress={handleLocationPress}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={['#5BA895', '#4A9B87']}
                    style={styles.buttonGradient}
                  >
                    <Ionicons name="location" size={20} color="#FFFFFF" />
                    <Text style={styles.enableLocationText}>
                      {t('home.enableLocation')}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}

          <View style={styles.bottomSpacing} />
        </ScrollView>
      )}
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  // Removed container background since Layout handles it
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // ============================================================================
  // TOP SECTION - GREETING, LOCATION & DATE COMBINED
  // ============================================================================
  topSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
  },
  greetingCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  greetingGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  greetingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    letterSpacing: 0.3,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },

  // ============================================================================
  // LOCATION & DATE ROW
  // ============================================================================
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  headerItemOuter: {
    flex: 1,
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  headerGradientBorder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  locationIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(91, 168, 149, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 13,
    color: '#1A1A1A',
    fontWeight: '700',
    letterSpacing: 0.3,
    flex: 1,
  },

  // ============================================================================
  // CIRCULAR PRAYER CARD
  // ============================================================================
  mainCardContainer: {
    marginTop: 0,
  },

  // ============================================================================
  // PRAYER TRACKER REMINDER
  // ============================================================================
  trackerNotification: {
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  notificationGradient: {
    position: 'relative',
    overflow: 'hidden',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 20,
    zIndex: 2,
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationIconCircle: {
    borderRadius: 26,
    overflow: 'hidden',
    marginRight: 16,
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  notificationIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  notificationSubtitle: {
    fontSize: 13,
    color: '#1A1A1A',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  notificationArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(91, 168, 149, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  decorCircle1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(91, 168, 149, 0.08)',
    top: -40,
    right: -20,
  },
  decorCircle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(91, 168, 149, 0.06)',
    bottom: -20,
    left: 40,
  },

  // ============================================================================
  // FRIENDS SECTION - VERTICAL LIST
  // ============================================================================
  friendsSection: {
    marginTop: 28,
    marginBottom: 12,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionHeaderOuter: {
    alignSelf: 'flex-start',
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeaderBorder: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderRadius: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'transparent',
    borderRadius: 14,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  friendsList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  friendCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 12,
  },
  friendCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  friendAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  friendAvatarGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendAvatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  friendStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  friendStreakText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF8C42',
  },

  // ============================================================================
  // DAILY INSPIRATION QUOTE
  // ============================================================================
  quoteSection: {
    paddingHorizontal: 20,
    marginTop: 28,
  },
  quoteSectionHeaderOuter: {
    marginBottom: 16,
    alignSelf: 'flex-start',
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  quoteSectionBorder: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderRadius: 18,
  },
  quoteSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },

  // ============================================================================
  // ERROR BANNER
  // ============================================================================
  errorBanner: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  errorGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '600',
  },
  errorClose: {
    padding: 4,
  },

  // ============================================================================
  // EMPTY STATE
  // ============================================================================
  emptyState: {
    marginHorizontal: 20,
    marginTop: 40,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyStateGradient: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    marginBottom: 24,
    borderRadius: 60,
    overflow: 'hidden',
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  emptyIconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A4D3E',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  emptyText: {
    fontSize: 15,
    color: '#2D6856',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 23,
    fontWeight: '500',
  },
  enableLocationButton: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    gap: 10,
  },
  enableLocationText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bottomSpacing: {
    height: 40,
  },
});