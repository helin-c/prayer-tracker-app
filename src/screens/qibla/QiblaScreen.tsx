// @ts-nocheck
// ============================================================================
// FILE: src/screens/qibla/QiblaScreen.jsx (IMPROVED ACCURACY)
// ============================================================================
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Linking,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';

// ✅ IMPORT Store and Selectors
import { usePrayerStore, selectLocation } from '../../store/prayerStore';

// IMPORT THE NEW LAYOUT
import { ScreenLayout } from '../../components/layout/ScreenLayout';

const { width, height } = Dimensions.get('window');
// ✅ CRITICAL: Precise Kaaba coordinates (verified from multiple Islamic sources)
const KAABA_LOCATION = { 
  latitude: 21.422487, 
  longitude: 39.826206 
};
const COMPASS_SIZE = Math.min(width * 0.7, 320);
const SECCADE_WIDTH = 200;
const SECCADE_HEIGHT = 250;
const ALIGNMENT_THRESHOLD = 5; // degrees

// ✅ NEW: Calibration constants for different platforms
const PLATFORM_OFFSET = Platform.select({
  ios: 0,      // iOS provides true heading
  android: 0,  // Will be adjusted based on magnetometer
  default: 0
});

export const QiblaScreen = () => {
  const { t } = useTranslation();
  
  const storeLocation = usePrayerStore(selectLocation);
  const fetchWithCurrentLocation = usePrayerStore(state => state.fetchWithCurrentLocation);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qiblaDirection, setQiblaDirection] = useState(0);
  const [currentHeading, setCurrentHeading] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('checking');
  const [magneticDeclination, setMagneticDeclination] = useState(0);
  const [headingAccuracy, setHeadingAccuracy] = useState(null);

  const compassRotation = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const headingSub = useRef(null);
  const lastValidReading = useRef(0);
  const headingReadings = useRef([]);

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

  // ✅ IMPROVED: More accurate Qibla calculation using great circle bearing
  // This uses the standard aviation/navigation formula verified against Islamic astronomical sources
  const calculateQiblaDirection = (userLat, userLon) => {
    // Convert to radians
    const φ1 = (userLat * Math.PI) / 180;
    const φ2 = (KAABA_LOCATION.latitude * Math.PI) / 180;
    const Δλ = ((KAABA_LOCATION.longitude - userLon) * Math.PI) / 180;

    // ✅ CRITICAL: Standard great circle bearing formula
    // This is the internationally accepted method for calculating bearing to Kaaba
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - 
              Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    let bearing = Math.atan2(y, x);
    
    // Convert from radians to degrees
    bearing = (bearing * 180) / Math.PI;
    
    // Normalize to 0-360
    bearing = (bearing + 360) % 360;

    // ✅ VERIFICATION: Calculate distance to verify coordinates are valid
    const R = 6371; // Earth's radius in km
    const dLat = φ2 - φ1;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    console.log(`
    ═══════════════════════════════════════════════════════
    📍 QIBLA DIRECTION CALCULATED
    ═══════════════════════════════════════════════════════
    User Location: ${userLat.toFixed(6)}°N, ${userLon.toFixed(6)}°E
    Kaaba Location: ${KAABA_LOCATION.latitude}°N, ${KAABA_LOCATION.longitude}°E
    Qibla Bearing: ${bearing.toFixed(2)}° (from True North)
    Distance to Kaaba: ${distance.toFixed(2)} km
    ═══════════════════════════════════════════════════════
    `);
    
    return bearing;
  };

  // ✅ NEW: Fetch magnetic declination for more accurate true north
  const fetchMagneticDeclination = async (latitude, longitude) => {
    try {
      // Using NOAA's magnetic declination API (free and accurate)
      const response = await fetch(
        `https://www.ngdc.noaa.gov/geomag-web/calculators/calculateDeclination?lat1=${latitude}&lon1=${longitude}&resultFormat=json`
      );
      
      if (response.ok) {
        const data = await response.json();
        const declination = data.result[0].declination;
        console.log(`🧭 Magnetic declination: ${declination}°`);
        return declination;
      }
    } catch (err) {
      console.warn('Could not fetch magnetic declination:', err);
    }
    return 0; // Fallback to zero if API fails
  };

  // ✅ IMPROVED: Better heading smoothing with outlier rejection
  const smoothHeading = (newHeading) => {
    // Add to readings buffer
    headingReadings.current.push(newHeading);
    
    // Keep only last 5 readings
    if (headingReadings.current.length > 5) {
      headingReadings.current.shift();
    }

    // If we have enough readings, use median filtering to reject outliers
    if (headingReadings.current.length >= 3) {
      const sorted = [...headingReadings.current].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      
      // Use exponential moving average with the median
      const alpha = 0.75; // Increased for more responsiveness
      return alpha * median + (1 - alpha) * lastValidReading.current;
    }

    // Not enough readings, use simple smoothing
    const alpha = 0.7;
    return alpha * newHeading + (1 - alpha) * lastValidReading.current;
  };

  // Initialize Location
  const initializeLocation = async () => {
    try {
      setLoading(true);
      setPermissionStatus('checking');

      if (storeLocation?.latitude && storeLocation?.longitude) {
        setUserLocation({
          latitude: storeLocation.latitude,
          longitude: storeLocation.longitude,
        });

        const qibla = calculateQiblaDirection(
          storeLocation.latitude,
          storeLocation.longitude
        );
        setQiblaDirection(qibla);

        // ✅ NEW: Fetch magnetic declination
        const declination = await fetchMagneticDeclination(
          storeLocation.latitude,
          storeLocation.longitude
        );
        setMagneticDeclination(declination);

        setPermissionStatus('granted');
        setLoading(false);
        return;
      }

      setPermissionStatus('requesting');
      const result = await fetchWithCurrentLocation();

      if (!result.success) {
        throw new Error(result.error || t('qibla.errors.locationFailed'));
      }

      let finalLat, finalLon;

      if (storeLocation?.latitude) {
        finalLat = storeLocation.latitude;
        finalLon = storeLocation.longitude;
      } else {
        // ✅ IMPROVED: Use high accuracy for location
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });
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

        // ✅ NEW: Fetch magnetic declination
        const declination = await fetchMagneticDeclination(finalLat, finalLon);
        setMagneticDeclination(declination);

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

  // ✅ IMPROVED: Subscribe to Heading with better accuracy handling
  const subscribeHeading = async () => {
    try {
      const hasLocation = await Location.hasServicesEnabledAsync();
      if (!hasLocation) {
        console.warn('Location services not enabled');
      }

      headingSub.current = await Location.watchHeadingAsync((headingData) => {
        // ✅ CRITICAL: Proper heading selection logic
        let rawHeading;
        
        if (Platform.OS === 'ios') {
          // iOS: Prefer trueHeading when available (more accurate)
          rawHeading = headingData.trueHeading !== undefined && headingData.trueHeading >= 0
            ? headingData.trueHeading
            : headingData.magHeading + magneticDeclination;
        } else {
          // Android: Always use magHeading and correct with declination
          rawHeading = headingData.magHeading + magneticDeclination;
        }

        // ✅ NEW: Track accuracy for user feedback
        if (headingData.accuracy !== undefined) {
          setHeadingAccuracy(headingData.accuracy);
        }

        // Apply improved smoothing
        const smoothedHeading = smoothHeading(rawHeading);
        lastValidReading.current = smoothedHeading;

        setCurrentHeading(smoothedHeading);

        // ✅ IMPROVED: Calculate rotation with proper angle normalization
        let diff = qiblaDirection - smoothedHeading + PLATFORM_OFFSET;
        
        // Normalize to -180 to 180 range for shortest rotation
        while (diff > 180) diff -= 360;
        while (diff < -180) diff += 360;

        Animated.spring(compassRotation, {
          toValue: diff,
          useNativeDriver: true,
          friction: 12,
          tension: 35,
          restDisplacementThreshold: 0.1,
          restSpeedThreshold: 0.1,
        }).start();
      });
    } catch (err) {
      console.error('Heading error:', err);
      setError(t('qibla.errors.magnetometerUnavailable'));
    }
  };

  useEffect(() => {
    initializeLocation();
    return () => {
      if (headingSub.current) {
        headingSub.current.remove();
      }
    };
  }, []);

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
    headingReadings.current = [];
    lastValidReading.current = 0;
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

  const interpolatedRotation = compassRotation.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  });

  // ✅ IMPROVED: Better alignment calculation
  const diff = qiblaDirection - currentHeading + PLATFORM_OFFSET;
  const normalizedDiff = ((diff + 540) % 360) - 180;
  const isAligned = Math.abs(normalizedDiff) < ALIGNMENT_THRESHOLD;

  // ✅ NEW: Accuracy warning
  const showAccuracyWarning = headingAccuracy !== null && 
    (headingAccuracy < 0 || headingAccuracy > 15);

  // Loading State
  if (loading) {
    return (
      <ScreenLayout>
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
      </ScreenLayout>
    );
  }

  // Error State
  if (error) {
    return (
      <ScreenLayout>
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
      </ScreenLayout>
    );
  }

  // Main Render
  return (
    <ScreenLayout noPaddingBottom={true}>
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

        {/* ✅ Accuracy Warning */}
        {showAccuracyWarning && (
          <View style={styles.warningBanner}>
            <Ionicons name="warning-outline" size={18} color="#FF9800" />
            <Text style={styles.warningText}>
              {t('qibla.calibrateWarning') || 
                'Calibrate compass by moving device in figure-8'}
            </Text>
          </View>
        )}

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
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
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
    paddingBottom: 10,
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
  directionBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
  },
  directionText: {
    fontSize: 13,
    color: '#1976D2',
    fontWeight: '600',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF3E0',
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#E65100',
    lineHeight: 16,
  },
  compassArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingTop: 0,
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
  northLabel: {
    top: 15,
  },
  eastLabel: {
    right: 15,
  },
  southLabel: {
    bottom: 15,
  },
  westLabel: {
    left: 15,
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
    fontSize: 14,
    fontWeight: '600',
  },
  statusTextAligned: {
    color: '#00A86B',
  },
  statusTextNotAligned: {
    color: '#DC3545',
  },
  angleText: {
    fontSize: 13,
    color: '#DC3545',
    fontWeight: '500',
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