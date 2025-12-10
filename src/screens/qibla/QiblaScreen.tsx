// @ts-nocheck
// ============================================================================
// FILE: src/screens/qibla/QiblaScreen.jsx (PROFESSIONAL & i18n)
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';

const { width } = Dimensions.get('window');
const KAABA_LOCATION = { latitude: 21.4225, longitude: 39.8262 };
const COMPASS_SIZE = Math.min(width * 0.75, 300);
const ALIGNMENT_THRESHOLD = 5; // degrees
const CALIBRATION_THRESHOLD = 0.1;

export const QiblaScreen = () => {
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qiblaDirection, setQiblaDirection] = useState(0);
  const [magnetometerData, setMagnetometerData] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [calibrationNeeded, setCalibrationNeeded] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('checking');
  const [magnetometerAvailable, setMagnetometerAvailable] = useState(true);
  const [accuracy, setAccuracy] = useState('high');

  const compassRotation = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const subscription = useRef(null);
  const lastValidReading = useRef(0);

  // Pulse animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Calculate Qibla direction
  const calculateQiblaDirection = (userLat, userLon) => {
    const φ1 = (userLat * Math.PI) / 180;
    const φ2 = (KAABA_LOCATION.latitude * Math.PI) / 180;
    const Δλ = ((KAABA_LOCATION.longitude - userLon) * Math.PI) / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    const θ = Math.atan2(y, x);
    const bearing = ((θ * 180) / Math.PI + 360) % 360;

    return bearing;
  };

  // Calculate distance
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Format distance
  const formatDistance = (km) => {
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    } else if (km < 100) {
      return `${km.toFixed(1)} km`;
    } else {
      return `${Math.round(km)} km`;
    }
  };

  // Get user location
  const getUserLocation = async () => {
    try {
      setPermissionStatus('requesting');
      
      const isLocationEnabled = await Location.hasServicesEnabledAsync();
      if (!isLocationEnabled) {
        throw new Error('Location services disabled');
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setPermissionStatus('denied');
        setError(t('qibla.errors.permissionDenied'));
        setLoading(false);
        return;
      }

      setPermissionStatus('granted');
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        maximumAge: 10000,
        timeout: 15000,
      });

      const { latitude, longitude, accuracy: locationAccuracy } = location.coords;
      setUserLocation({ latitude, longitude });
      
      if (locationAccuracy < 20) setAccuracy('high');
      else if (locationAccuracy < 100) setAccuracy('medium');
      else setAccuracy('low');

      const qibla = calculateQiblaDirection(latitude, longitude);
      setQiblaDirection(qibla);

      const dist = calculateDistance(
        latitude,
        longitude,
        KAABA_LOCATION.latitude,
        KAABA_LOCATION.longitude
      );
      setDistance(dist);

      setLoading(false);
    } catch (err) {
      console.error('Location error:', err);
      
      let errorMessage = t('qibla.errors.locationFailed');
      
      if (err.message.includes('denied')) {
        errorMessage = t('qibla.errors.permissionDenied');
      }
      
      setError(errorMessage);
      setPermissionStatus('error');
      setLoading(false);
    }
  };

  // Subscribe to magnetometer
  const subscribeMagnetometer = () => {
    Magnetometer.isAvailableAsync().then((available) => {
      if (!available) {
        setMagnetometerAvailable(false);
        setError(t('qibla.errors.magnetometerUnavailable'));
        return;
      }

      subscription.current = Magnetometer.addListener((data) => {
        const { x, y, z } = data;
        
        const magnitude = Math.sqrt(x * x + y * y + z * z);
        
        if (magnitude < CALIBRATION_THRESHOLD) {
          setCalibrationNeeded(true);
        } else {
          setCalibrationNeeded(false);
        }

        let angle = Math.atan2(y, x) * (180 / Math.PI);
        angle = (angle + 360) % 360;

        if (Platform.OS === 'ios') {
          angle = (angle + 90) % 360;
        }

        // Low-pass filter
        const alpha = 0.8;
        angle = alpha * angle + (1 - alpha) * lastValidReading.current;
        lastValidReading.current = angle;

        setMagnetometerData(angle);

        const compassAngle = qiblaDirection - angle;
        
        Animated.spring(compassRotation, {
          toValue: compassAngle,
          useNativeDriver: true,
          friction: 10,
          tension: 40,
          restDisplacementThreshold: 0.1,
          restSpeedThreshold: 0.1,
        }).start();
      });

      Magnetometer.setUpdateInterval(100);
    });
  };

  useEffect(() => {
    getUserLocation();
    
    return () => {
      if (subscription.current) {
        subscription.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!loading && !error && userLocation && magnetometerAvailable) {
      subscribeMagnetometer();
    }
    
    return () => {
      if (subscription.current) {
        subscription.current.remove();
      }
    };
  }, [loading, error, userLocation, qiblaDirection, magnetometerAvailable]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setPermissionStatus('checking');
    setCalibrationNeeded(false);
    getUserLocation();
  };

  const showCalibrationInstructions = () => {
    Alert.alert(
      t('qibla.calibrationTitle'),
      t('qibla.calibrationMessage'),
      [{ text: t('common.done') }]
    );
  };

  const openSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <View style={styles.loadingCircle}>
            <Ionicons name="compass-outline" size={48} color="#00A86B" />
          </View>
          <ActivityIndicator size="large" color="#00A86B" style={{ marginTop: 20 }} />
          <Text style={styles.loadingText}>{t('qibla.findingLocation')}</Text>
          <Text style={styles.loadingSubtext}>
            {permissionStatus === 'requesting' 
              ? t('qibla.requestingPermission')
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
                <Text style={styles.settingsButtonText}>{t('home.openSettings')}</Text>
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

  const angleDiff = Math.abs((qiblaDirection - magnetometerData + 360) % 360);
  const isAligned = Math.min(angleDiff, 360 - angleDiff) < ALIGNMENT_THRESHOLD;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('qibla.qiblaDirection')}</Text>
          <Text style={styles.headerSubtitle}>{t('qibla.faceTowardsKaaba')}</Text>
        </View>

        {/* Calibration Warning */}
        {calibrationNeeded && (
          <TouchableOpacity
            style={styles.calibrationBanner}
            onPress={showCalibrationInstructions}
            activeOpacity={0.7}
          >
            <Ionicons name="warning-outline" size={20} color="#F59E0B" />
            <Text style={styles.calibrationText}>
              {t('qibla.calibrationNeeded')}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#F59E0B" />
          </TouchableOpacity>
        )}

        {/* Main Compass Area */}
        <View style={styles.compassArea}>
          {/* Outer Ring */}
          <View style={styles.outerRing}>
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((degree) => (
              <View
                key={degree}
                style={[
                  styles.degreeMarker,
                  { transform: [{ rotate: `${degree}deg` }] }
                ]}
              >
                <View style={[
                  styles.degreeTick,
                  degree % 90 === 0 && styles.degreeTickMajor
                ]} />
              </View>
            ))}
          </View>

          {/* Compass Circle */}
          <View style={[
            styles.compassCircle,
            isAligned && styles.compassCircleAligned
          ]}>
            {/* Cardinals */}
            <View style={styles.cardinalContainer}>
              <Text style={[styles.cardinalText, styles.north]}>
                {t('qibla.cardinals.north')}
              </Text>
              <Text style={[styles.cardinalText, styles.east]}>
                {t('qibla.cardinals.east')}
              </Text>
              <Text style={[styles.cardinalText, styles.south]}>
                {t('qibla.cardinals.south')}
              </Text>
              <Text style={[styles.cardinalText, styles.west]}>
                {t('qibla.cardinals.west')}
              </Text>
            </View>

            {/* Qibla Indicator */}
            <Animated.View
              style={[
                styles.qiblaIndicator,
                { transform: [{ rotate: interpolatedRotation }] }
              ]}
            >
              <View style={styles.arrowContainer}>
                <View style={styles.arrowLine} />
                <View style={styles.arrowHead} />
                
                <Animated.View 
                  style={[
                    styles.kaabaIconContainer,
                    isAligned && { 
                      transform: [{ scale: pulseAnim }],
                      shadowOpacity: 0.6
                    }
                  ]}
                >
                  <Text style={styles.kaabaIcon}>🕋</Text>
                </Animated.View>
              </View>
            </Animated.View>

            {/* Center Dot */}
            <View style={styles.centerDot}>
              <View style={[
                styles.centerDotInner,
                isAligned && styles.centerDotAligned
              ]} />
            </View>
          </View>

          {/* Aligned Banner */}
          {isAligned && (
            <Animated.View 
              style={[
                styles.alignedBanner,
                { transform: [{ scale: pulseAnim }] }
              ]}
            >
              <Ionicons name="checkmark-circle" size={24} color="#00A86B" />
              <Text style={styles.alignedText}>{t('qibla.aligned')}</Text>
            </Animated.View>
          )}
        </View>

        {/* Info Cards */}
        {distance && (
          <View style={styles.infoRow}>
            <View style={styles.infoCard}>
              <Ionicons name="location" size={24} color="#00A86B" />
              <Text style={styles.infoValue}>{formatDistance(distance)}</Text>
              <Text style={styles.infoLabel}>{t('qibla.distance')}</Text>
            </View>
            
            <View style={styles.infoCard}>
              <Ionicons name="compass" size={24} color="#3498DB" />
              <Text style={styles.infoValue}>{Math.round(qiblaDirection)}°</Text>
              <Text style={styles.infoLabel}>{t('qibla.direction')}</Text>
            </View>

            <View style={styles.infoCard}>
              <Ionicons 
                name={accuracy === 'high' ? 'checkmark-circle' : 'alert-circle'} 
                size={24} 
                color={accuracy === 'high' ? '#00A86B' : '#F59E0B'} 
              />
              <Text style={styles.infoValue}>
                {accuracy === 'high' ? '±5°' : '±15°'}
              </Text>
              <Text style={styles.infoLabel}>{t('qibla.accuracy')}</Text>
            </View>
          </View>
        )}

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

        {/* Refresh Button */}
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRetry}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh-outline" size={20} color="#00A86B" />
          <Text style={styles.refreshButtonText}>{t('qibla.refreshLocation')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
    paddingTop: 20,
    paddingBottom: 16,
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
  },
  calibrationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  calibrationText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
  },
  compassArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  outerRing: {
    position: 'absolute',
    width: COMPASS_SIZE + 40,
    height: COMPASS_SIZE + 40,
    justifyContent: 'center',
    alignItems: 'center',
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
  compassCircle: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    borderRadius: COMPASS_SIZE / 2,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 8,
    borderColor: '#F0FFF4',
  },
  compassCircleAligned: {
    borderColor: '#00A86B',
    shadowColor: '#00A86B',
    shadowOpacity: 0.3,
  },
  cardinalContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  cardinalText: {
    position: 'absolute',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
  north: {
    top: 16,
    left: '50%',
    marginLeft: -8,
  },
  east: {
    top: '50%',
    right: 16,
    marginTop: -10,
  },
  south: {
    bottom: 16,
    left: '50%',
    marginLeft: -8,
  },
  west: {
    top: '50%',
    left: 16,
    marginTop: -10,
  },
  qiblaIndicator: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowContainer: {
    alignItems: 'center',
  },
  arrowLine: {
    width: 4,
    height: COMPASS_SIZE / 2 - 60,
    backgroundColor: '#00A86B',
    borderRadius: 2,
  },
  arrowHead: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 16,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#00A86B',
    marginTop: -1,
  },
  kaabaIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#00A86B',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#00A86B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  kaabaIcon: {
    fontSize: 32,
  },
  centerDot: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  centerDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1A1A1A',
  },
  centerDotAligned: {
    backgroundColor: '#00A86B',
  },
  alignedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FFF4',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
    borderWidth: 2,
    borderColor: '#00A86B',
  },
  alignedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00A86B',
  },
  infoRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 6,
    marginBottom: 2,
  },
  infoLabel: {
    fontSize: 11,
    color: '#666',
  },
  instructionsCard: {
    marginHorizontal: 20,
    backgroundColor: '#F0FFF4',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D4F4E6',
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#00A86B',
  },
  refreshButtonText: {
    color: '#00A86B',
    fontSize: 16,
    fontWeight: '600',
  },
});