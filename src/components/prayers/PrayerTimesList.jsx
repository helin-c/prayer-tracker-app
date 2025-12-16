// ============================================================================
// FILE: src/components/prayers/PrayerTimesList.jsx (COMPACT GRID LAYOUT)
// ============================================================================
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { formatTime } from '../../utils/timeUtils';

export const PrayerTimesList = ({ prayerTimes }) => {
  const { t, i18n } = useTranslation();

  if (!prayerTimes) return null;

  const prayers = [
    { name: 'Fajr', key: 'fajr', data: prayerTimes.fajr, icon: 'cloudy-night-outline' },
    { name: 'Dhuhr', key: 'dhuhr', data: prayerTimes.dhuhr, icon: 'sunny' },
    { name: 'Asr', key: 'asr', data: prayerTimes.asr, icon: 'partly-sunny-outline' },
    { name: 'Maghrib', key: 'maghrib', data: prayerTimes.maghrib, icon: 'moon' },
    { name: 'Isha', key: 'isha', data: prayerTimes.isha, icon: 'moon-outline' },
  ];

  const isNextPrayer = (prayerKey) => {
    return prayerKey.toLowerCase() === prayerTimes.next_prayer?.toLowerCase();
  };

  const isPrayerPassed = (prayerTime) => {
    if (!prayerTime) return false;
    const now = new Date();
    const [hours, minutes] = prayerTime.split(':');
    const prayerDate = new Date();
    prayerDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return now > prayerDate;
  };

  const getPrayerName = (key) => {
    return t(`prayers.${key.toLowerCase()}`);
  };

  const renderPrayerCard = (prayer, index) => {
    const isNext = isNextPrayer(prayer.key);
    const isPassed = isPrayerPassed(prayer.data?.time);
    
    return (
      <View 
        key={prayer.key}
        style={[
          styles.prayerCard,
          isNext && styles.nextPrayerCard,
          isPassed && styles.passedPrayerCard,
        ]}
      >
        <View style={[
          styles.iconContainer,
          isNext && styles.nextIconContainer,
          isPassed && styles.passedIconContainer,
        ]}>
          <Ionicons 
            name={prayer.icon} 
            size={22} 
            color={isNext ? '#FFFFFF' : isPassed ? '#94A3B8' : '#64748B'} 
          />
        </View>
        
        <Text style={[
          styles.prayerName,
          isNext && styles.nextPrayerName,
          isPassed && styles.passedPrayerName,
        ]}>
          {getPrayerName(prayer.key)}
        </Text>
        
        <Text style={[
          styles.prayerTime,
          isNext && styles.nextPrayerTime,
          isPassed && styles.passedPrayerTime,
        ]}>
          {formatTime(prayer.data?.time, i18n.language)}
        </Text>

        {isPassed && (
          <View style={styles.checkmark}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
          </View>
        )}
      </View>
    );
  };

  // Split into two rows: first 3 prayers, then 2 prayers
  const firstRow = prayers.slice(0, 3);
  const secondRow = prayers.slice(3);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {firstRow.map((prayer, index) => renderPrayerCard(prayer, index))}
      </View>
      <View style={styles.row}>
        {secondRow.map((prayer, index) => renderPrayerCard(prayer, index + 3))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  prayerCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  nextPrayerCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ scale: 1.02 }],
  },
  passedPrayerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    opacity: 0.75,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  nextIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  passedIconContainer: {
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
  },
  prayerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
    textAlign: 'center',
  },
  nextPrayerName: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  passedPrayerName: {
    color: '#94A3B8',
  },
  prayerTime: {
    fontSize: 16,
    fontWeight: '800',
    color: '#475569',
    textAlign: 'center',
  },
  nextPrayerTime: {
    color: '#FFFFFF',
    fontSize: 17,
  },
  passedPrayerTime: {
    color: '#94A3B8',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});