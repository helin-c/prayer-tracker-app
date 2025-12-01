// @ts-nocheck
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { usePrayerStore } from '../../store/prayerStore';
import { NextPrayerCard } from '../../components/prayers/NextPrayerCard';
import { PrayerTimesList } from '../../components/prayers/PrayerTimesList';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export const HomeScreen = ({ navigation }) => {
  const { user } = useAuthStore();
  const {
    prayerTimes,
    location,
    isLoading,
    error,
    fromCache,
    lastUpdated,
    fetchWithCurrentLocation,
    loadSavedLocation,
    clearError,
    isCacheValid,
  } = usePrayerStore();

  const [refreshing, setRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Initialize on mount
  useEffect(() => {
    initializePrayerTimes();
  }, []);

  // Check cache validity when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // If cache is expired, fetch new data
      if (prayerTimes && !isCacheValid()) {
        console.log('Cache expired, refreshing prayer times');
        fetchWithCurrentLocation(true);
      }
    }, [prayerTimes])
  );

  const initializePrayerTimes = async () => {
    // Try to load saved location first
    await loadSavedLocation();

    // If no saved location, fetch current location
    if (!location && !prayerTimes) {
      await fetchWithCurrentLocation();
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    clearError();

    const result = await fetchWithCurrentLocation(true); // Force refresh

    if (!result.success) {
      // Show user-friendly error
      Alert.alert(
        'Unable to Refresh',
        result.error,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Retry',
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
    Alert.alert(
      'Update Location',
      'Get prayer times for your current location?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            clearError();
            const result = await fetchWithCurrentLocation(true);

            if (!result.success) {
              // More specific error handling
              if (result.error.includes('permission')) {
                Alert.alert(
                  'Location Permission Required',
                  'Please enable location access in your device settings.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Open Settings',
                      onPress: () => {
                        // Open app settings
                        if (Platform.OS === 'ios') {
                          Linking.openURL('app-settings:');
                        } else {
                          Linking.openSettings();
                        }
                      },
                    },
                  ]
                );
              } else {
                Alert.alert('Error', result.error);
              }
            }
          },
        },
      ]
    );
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getGreetingIcon = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'sunny-outline';
    if (hour < 17) return 'partly-sunny-outline';
    return 'moon-outline';
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return '';

    const now = new Date();
    const updated = new Date(lastUpdated);
    const diffMinutes = Math.floor((now - updated) / (1000 * 60));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return updated.toLocaleDateString();
  };

  // Loading state (first load)
  if (isLoading && !prayerTimes) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIcon}>
            <Ionicons name="time-outline" size={48} color="#00A86B" />
          </View>
          <ActivityIndicator size="large" color="#00A86B" style={styles.spinner} />
          <Text style={styles.loadingText}>
            {retryCount > 0
              ? 'Retrying... Please wait'
              : 'Fetching prayer times...'}
          </Text>
          <Text style={styles.loadingSubtext}>
            {retryCount > 0 ? `Attempt ${retryCount + 1}` : 'Getting your location'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00A86B"
            title="Pull to refresh"
            titleColor="#666"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Gradient */}
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <View style={styles.greetingSection}>
              <View style={styles.greetingIconContainer}>
                <Ionicons name={getGreetingIcon()} size={24} color="#00A86B" />
              </View>
              <View>
                <Text style={styles.greeting}>{getGreeting()}</Text>
                <Text style={styles.userName}>
                  {user?.full_name || user?.username || 'Guest'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <Ionicons name="person-circle-outline" size={36} color="#00A86B" />
            </TouchableOpacity>
          </View>

          {/* Location Banner */}
          {location && (
            <TouchableOpacity
              style={styles.locationBanner}
              onPress={handleLocationPress}
              activeOpacity={0.7}
            >
              <View style={styles.locationIcon}>
                <Ionicons name="location" size={18} color="#00A86B" />
              </View>
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationText}>
                  {location.city
                    ? `${location.city}, ${location.country}`
                    : 'Current Location'}
                </Text>
              </View>
              <Ionicons name="refresh-outline" size={18} color="#00A86B" />
            </TouchableOpacity>
          )}
        </View>

        {/* Error Banner */}
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons
              name={
                error.includes('offline') || error.includes('network')
                  ? 'cloud-offline-outline'
                  : 'alert-circle-outline'
              }
              size={20}
              color="#DC3545"
            />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={clearError}>
              <Ionicons name="close-circle" size={20} color="#DC3545" />
            </TouchableOpacity>
          </View>
        )}

        {/* Success Banner (when using cache offline) */}
        {fromCache && error && error.includes('offline') && (
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle-outline" size={20} color="#17A2B8" />
            <Text style={styles.infoText}>
              Prayer times are available offline for today
            </Text>
          </View>
        )}

        {/* Next Prayer Card */}
        {prayerTimes && (
          <View style={styles.cardContainer}>
            <NextPrayerCard prayerTimes={prayerTimes} />
          </View>
        )}

        {/* All Prayer Times */}
        {prayerTimes && (
          <View style={styles.listContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="list-outline" size={22} color="#00A86B" />
              <Text style={styles.sectionTitle}>Today's Prayer Times</Text>
            </View>
            <PrayerTimesList prayerTimes={prayerTimes} />
          </View>
        )}

        {/* Islamic Date & Info Card */}
        {prayerTimes && (
          <View style={styles.islamicDateCard}>
            <View style={styles.dateIconContainer}>
              <Ionicons name="calendar-outline" size={24} color="#00A86B" />
            </View>
            <View style={styles.dateContent}>
              <Text style={styles.dateLabel}>Islamic Date</Text>
              <Text style={styles.dateValue}>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </View>
          </View>
        )}

        {/* No Prayer Times State */}
        {!prayerTimes && !isLoading && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="location-outline" size={64} color="#00A86B" />
            </View>
            <Text style={styles.emptyTitle}>Welcome to Prayer Tracker</Text>
            <Text style={styles.emptyText}>
              Enable location access to get accurate prayer times for your area and never miss a prayer
            </Text>
            <TouchableOpacity
              style={styles.enableLocationButton}
              onPress={handleLocationPress}
            >
              <Ionicons name="location" size={20} color="#FFF" />
              <Text style={styles.enableLocationText}>Enable Location</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0FFF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  spinner: {
    marginTop: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greetingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  greetingIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0FFF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0FFF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FFF4',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D4F4E6',
  },
  locationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationText: {
    fontSize: 14,
    color: '#00A86B',
    fontWeight: '600',
  },
  locationSubtext: {
    fontSize: 12,
    color: '#00A86B',
    opacity: 0.7,
    marginTop: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 14,
    borderRadius: 14,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  errorText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#DC3545',
    fontWeight: '500',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 14,
    borderRadius: 14,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#17A2B8',
    fontWeight: '500',
  },
  cardContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  listContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  islamicDateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    padding: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 14,
  },
  dateIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F0FFF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateContent: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0FFF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  enableLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00A86B',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#00A86B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  enableLocationText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 20,
  },
});