// @ts-nocheck
// ============================================================================
// FILE: src/screens/qibla/QiblaScreen.jsx (OPTIMIZED - Uses Store Location)
// ============================================================================
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
  Alert,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';
import { usePrayerStore } from '../../store/prayerStore';

const { width, height } = Dimensions.get('window');
const KAABA_LOCATION = { latitude: 21.4225, longitude: 39.8262 };
const COMPASS_SIZE = Math.min(width * 0.7, 320);
const SECCADE_WIDTH = 160;
const SECCADE_HEIGHT = 200;
const ALIGNMENT_THRESHOLD = 5; // degrees
const ASSET_OFFSET = 0; // Adjust if seccade image orientation is off

export const QiblaScreen = () => {
  const { t } = useTranslation();

  // 🎯 Use location from prayer store instead of fetching again
  const { location: storeLocation, fetchWithCurrentLocation } =
    usePrayerStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qiblaDirection, setQiblaDirection] = useState(0);
  const [currentHeading, setCurrentHeading] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('checking');

  const compassRotation = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const headingSub = useRef(null);
  const lastValidReading = useRef(0);

  // Pulse animation for aligned state
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Calculate Qibla direction using proper great circle formula
  const calculateQiblaDirection = (userLat, userLon) => {
    const φ1 = (userLat * Math.PI) / 180;
    const φ2 = (KAABA_LOCATION.latitude * Math.PI) / 180;
    const Δλ = ((KAABA_LOCATION.longitude - userLon) * Math.PI) / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x =
      Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    const θ = Math.atan2(y, x);
    const bearing = ((θ * 180) / Math.PI + 360) % 360;

    return bearing;
  };

  // 🚀 OPTIMIZED: Use store location first, only fetch if not available
  const initializeLocation = async () => {
    try {
      setLoading(true);
      setPermissionStatus('checking');

      // ✅ Try to use location from store first
      if (storeLocation?.latitude && storeLocation?.longitude) {
        console.log('✅ Using location from store:', storeLocation.city);
        setUserLocation({
          latitude: storeLocation.latitude,
          longitude: storeLocation.longitude,
        });

        const qibla = calculateQiblaDirection(
          storeLocation.latitude,
          storeLocation.longitude
        );
        setQiblaDirection(qibla);
        setPermissionStatus('granted');
        setLoading(false);
        return;
      }

      // ⚠️ No store location available, need to fetch
      console.log('⚠️ No location in store, fetching...');
      setPermissionStatus('requesting');

      const result = await fetchWithCurrentLocation();

      if (!result.success) {
        throw new Error(result.error || t('qibla.errors.locationFailed'));
      }

      // After fetching, try again with updated store location
      // Note: fetchWithCurrentLocation updates the store, so we can use the result directly or check store again.
      // Since store updates might be async in React state, better use result data if available,
      // but fetchWithCurrentLocation returns success boolean usually. Let's assume store updates.
      // Or we can rely on re-render if store changes. But to be safe, let's re-check store or fetch fresh.

      // Re-fetching strictly for coordinates just in case
      let finalLat, finalLon;

      if (storeLocation?.latitude) {
        finalLat = storeLocation.latitude;
        finalLon = storeLocation.longitude;
      } else {
        // Fallback if store update is slow
        const loc = await Location.getCurrentPositionAsync({});
        finalLat = loc.coords.latitude;
        finalLon = loc.coords.longitude;
      }

      if (finalLat && finalLon) {
        setUserLocation({
          latitude: finalLat,
          longitude: finalLon,
        });

        const qibla = calculateQiblaDirection(finalLat, finalLon);
        setQiblaDirection(qibla);
        setPermissionStatus('granted');
      } else {
        throw new Error(t('qibla.errors.locationFailed'));
      }

      setLoading(false);
    } catch (err) {
      console.error('Location initialization error:', err);

      let errorMessage = t('qibla.errors.locationFailed');

      if (
        err.message?.includes('denied') ||
        err.message?.includes('permission')
      ) {
        errorMessage = t('qibla.errors.permissionDenied');
        setPermissionStatus('denied');
      } else {
        setPermissionStatus('error');
      }

      setError(errorMessage);
      setLoading(false);
    }
  };

  // Subscribe to device heading (tilt-compensated)
  const subscribeHeading = async () => {
    try {
      const hasLocation = await Location.hasServicesEnabledAsync();
      if (!hasLocation) {
        // Even if GPS off, heading might work, but let's warn
        // Actually for compass only magnetometer is needed usually
      }

      headingSub.current = await Location.watchHeadingAsync((headingData) => {
        const rawHeading =
          headingData.trueHeading !== undefined && headingData.trueHeading >= 0
            ? headingData.trueHeading
            : headingData.magHeading;

        // Apply low-pass filter for smooth rotation
        const alpha = 0.85;
        const smoothHeading =
          alpha * rawHeading + (1 - alpha) * lastValidReading.current;
        lastValidReading.current = smoothHeading;

        setCurrentHeading(smoothHeading);

        // Calculate difference between Qibla direction and current device heading
        let diff = qiblaDirection - smoothHeading + ASSET_OFFSET;

        // Normalize to -180 to 180 range for shortest rotation path
        while (diff > 180) diff -= 360;
        while (diff < -180) diff += 360;

        // Animate the seccade rotation
        Animated.spring(compassRotation, {
          toValue: diff,
          useNativeDriver: true,
          friction: 12,
          tension: 35,
          restDisplacementThreshold: 0.1,
          restSpeedThreshold: 0.1,
        }).start();
      });

      console.log('✅ Heading subscription started');
    } catch (err) {
      console.error('Heading error:', err);
      setError(t('qibla.errors.magnetometerUnavailable'));
    }
  };

  // Initialize location on mount
  useEffect(() => {
    initializeLocation();

    return () => {
      if (headingSub.current) {
        headingSub.current.remove();
      }
    };
  }, []);

  // Subscribe to heading once location is available
  useEffect(() => {
    if (!loading && !error && userLocation && qiblaDirection > 0) {
      subscribeHeading();
    }

    return () => {
      if (headingSub.current) {
        headingSub.current.remove();
      }
    };
  }, [loading, error, userLocation, qiblaDirection]);

  const handleRetry = () => {
    setError(null);
    if (headingSub.current) {
      headingSub.current.remove();
    }
    initializeLocation();
  };

  const openSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  // Loading state (Inline - Not Blocking Entire Screen if possible, but for initial setup it blocks center)
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <View style={styles.loadingCircle}>
            <Ionicons name="compass-outline" size={48} color="#00A86B" />
          </View>
          <ActivityIndicator
            size="large"
            color="#00A86B"
            style={{ marginTop: 20 }}
          />
          <Text style={styles.loadingText}>{t('qibla.findingLocation')}</Text>
          <Text style={styles.loadingSubtext}>
            {permissionStatus === 'requesting'
              ? t('qibla.requestingPermission')
              : permissionStatus === 'checking'
                ? t('qibla.checkingStoredLocation')
                : t('qibla.gettingCoordinates')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <View style={styles.errorCircle}>
            <Ionicons name="alert-circle-outline" size={64} color="#DC3545" />
          </View>
          <Text style={styles.errorTitle}>{t('qibla.notFound')}</Text>
          <Text style={styles.errorText}>{error}</Text>

          <View style={styles.errorActions}>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetry}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh-outline" size={20} color="#FFF" />
              <Text style={styles.retryButtonText}>{t('qibla.retry')}</Text>
            </TouchableOpacity>

            {permissionStatus === 'denied' && (
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={openSettings}
                activeOpacity={0.8}
              >
                <Ionicons name="settings-outline" size={20} color="#00A86B" />
                <Text style={styles.settingsButtonText}>
                  {t('home.openSettings')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const interpolatedRotation = compassRotation.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  });

  // Calculate alignment using normalized difference
  const diff = qiblaDirection - currentHeading + ASSET_OFFSET;
  const normalizedDiff = ((diff + 540) % 360) - 180;
  const isAligned = Math.abs(normalizedDiff) < ALIGNMENT_THRESHOLD;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('qibla.qiblaDirection')}</Text>
          <Text style={styles.headerSubtitle}>
            {t('qibla.faceTowardsKaaba')}
          </Text>
          {storeLocation?.city && (
            <View style={styles.locationBadge}>
              <Ionicons name="location" size={14} color="#00A86B" />
              <Text style={styles.locationText}>
                {storeLocation.city}, {storeLocation.country}
              </Text>
            </View>
          )}
        </View>

        {/* Main Compass Area */}
        <View style={styles.compassArea}>
          {/* Compass Background Circle */}
          <View style={styles.compassBackground}>
            {/* Degree Markers */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(
              (degree) => (
                <View
                  key={degree}
                  style={[
                    styles.degreeMarker,
                    { transform: [{ rotate: `${degree}deg` }] },
                  ]}
                >
                  <View
                    style={[
                      styles.degreeTick,
                      degree % 90 === 0 && styles.degreeTickMajor,
                    ]}
                  />
                </View>
              )
            )}

            {/* Rotating Seccade Container */}
            <Animated.View
              style={[
                styles.seccadeContainer,
                {
                  transform: [
                    { rotate: interpolatedRotation },
                    { scale: isAligned ? pulseAnim : 1 },
                  ],
                },
              ]}
            >
              <Image
                source={
                  isAligned
                    ? require('../../assets/images/qibla/seccade.png')
                    : require('../../assets/images/qibla/seccade-red.png')
                }
                style={styles.seccadeImage}
                resizeMode="contain"
              />
            </Animated.View>
          </View>

          {/* Status Badge */}
          <View
            style={[
              styles.statusBadge,
              isAligned
                ? styles.statusBadgeAligned
                : styles.statusBadgeNotAligned,
            ]}
          >
            <Ionicons
              name={isAligned ? 'checkmark-circle' : 'sync-outline'}
              size={24}
              color={isAligned ? '#00A86B' : '#DC3545'}
            />
            <Text
              style={[
                styles.statusText,
                isAligned
                  ? styles.statusTextAligned
                  : styles.statusTextNotAligned,
              ]}
            >
              {isAligned ? t('qibla.aligned') : t('qibla.rotateDevice')}
            </Text>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <View style={styles.instructionRow}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>1</Text>
            </View>
            <Text style={styles.instructionText}>
              {t('qibla.instructions.step1')}
            </Text>
          </View>
          <View style={styles.instructionRow}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>2</Text>
            </View>
            <Text style={styles.instructionText}>
              {t('qibla.instructions.step2')}
            </Text>
          </View>
          <View style={styles.instructionRow}>
            <View style={styles.instructionNumber}>
              <Text style={styles.instructionNumberText}>3</Text>
            </View>
            <Text style={styles.instructionText}>
              {t('qibla.instructions.step3')}
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0FFF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  errorCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 32,
    marginBottom: 24,
    lineHeight: 22,
  },
  errorActions: {
    gap: 12,
    width: '100%',
    paddingHorizontal: 32,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#00A86B',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#00A86B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F0FFF4',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#00A86B',
  },
  settingsButtonText: {
    color: '#00A86B',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 8,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FFF4',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D4F4E6',
    marginTop: 8,
  },
  locationText: {
    fontSize: 13,
    color: '#00A86B',
    fontWeight: '600',
  },
  compassArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    position: 'relative',
  },
  compassBackground: {
    position: 'absolute',
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    borderRadius: COMPASS_SIZE / 2,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 6,
    borderColor: '#F0FFF4',
  },
  degreeMarker: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  degreeTick: {
    width: 2,
    height: 8,
    backgroundColor: '#D1D5DB',
    position: 'absolute',
    top: 0,
  },
  degreeTickMajor: {
    width: 3,
    height: 14,
    backgroundColor: '#9CA3AF',
  },
  seccadeContainer: {
    position: 'absolute',
    width: SECCADE_WIDTH,
    height: SECCADE_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  seccadeImage: {
    width: SECCADE_WIDTH,
    height: SECCADE_HEIGHT,
  },
  statusBadge: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  statusBadgeAligned: {
    backgroundColor: '#F0FFF4',
    borderColor: '#00A86B',
  },
  statusBadgeNotAligned: {
    backgroundColor: '#FFF5F5',
    borderColor: '#DC3545',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusTextAligned: {
    color: '#00A86B',
  },
  statusTextNotAligned: {
    color: '#DC3545',
  },
  instructionsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#F0FFF4',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D4F4E6',
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#00A86B',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  instructionNumberText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
  },
});
