// @ts-nocheck
// ============================================================================
// FILE: src/screens/home/HomeScreen.jsx (REDESIGNED - PROFESSIONAL & AESTHETIC)
// ============================================================================
import React, { useEffect, useState, useCallback } from 'react';
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
  ImageBackground,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../store/authStore';
import { usePrayerStore } from '../../store/prayerStore';
import { useFriendsStore } from '../../store/friendsStore';
import { CircularPrayerCard } from '../../components/prayers/CircularPrayerCard';
import { formatIslamicDate } from '../../utils/timeUtils';
import { IslamicLoadingScreen } from '../../components/loading/IslamicLoadingScreen';
import { DailyQuoteCard } from '../../components/quotes/DailyQuoteCard';

const { width } = Dimensions.get('window');

export const HomeScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const {
    prayerTimes,
    location,
    isLoading,
    error,
    fetchWithCurrentLocation,
    loadSavedLocation,
    clearError,
    isCacheValid,
  } = usePrayerStore();

  const { friends, fetchFriends } = useFriendsStore();

  const [refreshing, setRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    initializePrayerTimes();
    fetchFriends();
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
      onPress={() => navigation.navigate('Profile', {
        screen: 'FriendProfile',
        params: { friend: item }
      })}
    >
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.08)']}
        style={styles.friendCardGradient}
      >
        <View style={styles.friendAvatar}>
          <LinearGradient
            colors={['#6F9C8C', '#4F6F64']}
            style={styles.friendAvatarGradient}
          >
            <Text style={styles.friendAvatarText}>
              {getInitials(item.friend_name)}
            </Text>
          </LinearGradient>
        </View>
        <Text style={styles.friendName} numberOfLines={1}>
          {item.friend_name}
        </Text>
        <View style={styles.friendStats}>
          <Ionicons name="flame" size={14} color="#FFB84D" />
          <Text style={styles.friendStreakText}>{item.current_streak || 0}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (isLoading && !prayerTimes) {
    return (
      <IslamicLoadingScreen
        message={
          retryCount > 0 ? t('home.retrying') : t('home.fetchingPrayerTimes')
        }
        submessage={
          retryCount > 0
            ? `${t('home.attempt')} ${retryCount + 1}`
            : t('home.gettingLocation')
        }
      />
    );
  }

  return (
    <ImageBackground
      source={require('../../assets/images/illustrations/background4.jpeg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFFFFF"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Symmetric Top Header Bar - Location & Islamic Date */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.headerItemOuter}
              onPress={handleLocationPress}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#6F9C8C', '#4F6F64']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.headerGradientBorder}
              >
                <View style={styles.headerItemInner}>
                  <View style={styles.locationIconWrapper}>
                    <Ionicons name="location-sharp" size={13} color="#FFFFFF" />
                  </View>
                  <Text
                    style={styles.headerText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {location?.city || t('home.unknownLocation')}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.headerItemOuter}>
              <LinearGradient
                colors={['#6F9C8C', '#4F6F64']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.headerGradientBorder}
              >
                <View style={styles.headerItemInner}>
                  <Ionicons
                    name="calendar-outline"
                    size={13}
                    color="rgba(255, 255, 255, 0.9)"
                  />
                  <Text style={styles.headerText}>
                    {formatIslamicDate(new Date(), i18n.language)}
                  </Text>
                </View>
              </LinearGradient>
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
                colors={['#6F9C8C', '#4F6F64']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.headerGradientBorder}
              >
                <View style={styles.notificationInner}>
                  <View style={styles.notificationContent}>
                    <View style={styles.notificationLeft}>
                      <View style={styles.notificationIconCircle}>
                        <Ionicons name="checkbox" size={28} color="#FFFFFF" />
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
                      <Ionicons
                        name="arrow-forward"
                        size={20}
                        color="rgba(255, 255, 255, 0.9)"
                      />
                    </View>
                  </View>

                  <View style={styles.decorCircle1} />
                  <View style={styles.decorCircle2} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Friends Section */}
          {friends && friends.length > 0 && (
            <View style={styles.friendsSection}>
              <View style={styles.sectionHeaderContainer}>
                <View style={styles.sectionHeaderOuter}>
                  <LinearGradient
                    colors={['#6F9C8C', '#4F6F64']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.sectionHeaderBorder}
                  >
                    <View style={styles.sectionHeaderInner}>
                      <Ionicons name="people" size={18} color="#FFFFFF" />
                      <Text style={styles.sectionTitle}>
                        {t('friends.myFriends')}
                      </Text>
                    </View>
                  </LinearGradient>
                </View>

                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => navigation.navigate('Profile', {
                    screen: 'ProfileMain'
                  })}
                >
                  <Text style={styles.viewAllText}>{t('common.viewAll')}</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={14}
                    color="rgba(255, 255, 255, 0.9)"
                  />
                </TouchableOpacity>
              </View>

              <FlatList
                data={friends.slice(0, 5)}
                renderItem={renderFriendItem}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.friendsList}
              />
            </View>
          )}

          {/* Daily Inspiration Quote Card - Shareable */}
          <View style={styles.quoteSection}>
            <View style={styles.quoteSectionHeaderOuter}>
              <LinearGradient
                colors={['#6F9C8C', '#4F6F64']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.quoteSectionBorder}
              >
                <View style={styles.quoteSectionHeaderInner}>
                  <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                  <Text style={styles.quoteSectionTitle}>
                    {t('home.dailyInspiration')}
                  </Text>
                </View>
              </LinearGradient>
            </View>
            <DailyQuoteCard />
          </View>

          {/* Error Banner */}
          {error && (
            <View style={styles.errorBanner}>
              <LinearGradient
                colors={['rgba(239, 68, 68, 0.15)', 'rgba(220, 38, 38, 0.15)']}
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
                colors={[
                  'rgba(255, 255, 255, 0.12)',
                  'rgba(255, 255, 255, 0.08)',
                ]}
                style={styles.emptyStateGradient}
              >
                <View style={styles.emptyIconContainer}>
                  <LinearGradient
                    colors={[
                      'rgba(255, 255, 255, 0.25)',
                      'rgba(255, 255, 255, 0.15)',
                    ]}
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
                    colors={['#FFFFFF', '#F8FAFC']}
                    style={styles.buttonGradient}
                  >
                    <Ionicons name="location" size={20} color="#10B981" />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // ============================================================================
  // SYMMETRIC TOP BAR - Location & Islamic Date
  // ============================================================================
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerItemOuter: {
    shadowColor: '#4F6F64',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  headerGradientBorder: {
    borderRadius: 20,
    padding: 1.5,
  },
  headerItemInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18.5,
  },
  locationIconWrapper: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 0.3,
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
    shadowColor: '#4F6F64',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  notificationInner: {
    borderRadius: 22.5,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingVertical: 9,
    paddingHorizontal: 9,
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
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  notificationSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  notificationArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  decorCircle1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    top: -40,
    right: -20,
  },
  decorCircle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    bottom: -20,
    left: 40,
  },

  // ============================================================================
  // FRIENDS SECTION
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
  },
  sectionHeaderBorder: {
    borderRadius: 16,
    padding: 1.5,
  },
  sectionHeaderInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 14.5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.95)',
  },
  friendsList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  friendCard: {
    width: 100,
    marginRight: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#4F6F64',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  friendCardGradient: {
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
  },
  friendAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 10,
    overflow: 'hidden',
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
  friendName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  friendStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 184, 77, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  friendStreakText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFB84D',
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
  },
  quoteSectionBorder: {
    borderRadius: 16,
    padding: 1.5,
  },
  quoteSectionHeaderInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 14.5,
  },
  quoteSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // ============================================================================
  // ERROR BANNER
  // ============================================================================
  errorBanner: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
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
  },
  emptyStateGradient: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 28,
  },
  emptyIconContainer: {
    marginBottom: 24,
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
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  emptyText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 23,
    fontWeight: '500',
  },
  enableLocationButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
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
    color: '#10B981',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bottomSpacing: {
    height: 40,
  },
});