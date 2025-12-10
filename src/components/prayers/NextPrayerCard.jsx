// ============================================================================
// FILE: src/components/prayers/NextPrayerCard.jsx (WITH i18n & TIME FORMAT)
// ============================================================================
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { formatTime } from '../../utils/timeUtils';

export const NextPrayerCard = ({ prayerTimes }) => {
  const { t, i18n } = useTranslation();
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    if (!prayerTimes) return;

    const interval = setInterval(() => {
      calculateTimeRemaining();
    }, 1000);

    calculateTimeRemaining();

    return () => clearInterval(interval);
  }, [prayerTimes]);

  const calculateTimeRemaining = () => {
    if (!prayerTimes?.next_prayer) return;

    const now = new Date();
    const nextPrayerName = prayerTimes.next_prayer.toLowerCase();
    
    const nextPrayer = prayerTimes[nextPrayerName];
    if (!nextPrayer?.time) return;

    const [hours, minutes] = nextPrayer.time.split(':');
    let prayerTime = new Date();
    prayerTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    if (prayerTime < now) {
      prayerTime.setDate(prayerTime.getDate() + 1);
    }

    const diff = prayerTime - now;
    const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
    const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secondsLeft = Math.floor((diff % (1000 * 60)) / 1000);

    if (hoursLeft > 0) {
      setTimeRemaining(`${hoursLeft}h ${minutesLeft}m ${secondsLeft}s`);
    } else {
      setTimeRemaining(`${minutesLeft}m ${secondsLeft}s`);
    }
  };

  const getPrayerIcon = (prayerName) => {
    const icons = {
      fajr: 'cloudy-night-outline',
      dhuhr: 'sunny',
      asr: 'partly-sunny-outline',
      maghrib: 'cloudy-night',
      isha: 'moon',
    };
    return icons[prayerName?.toLowerCase()] || 'time';
  };

  const getPrayerName = (prayerName) => {
    const names = {
      fajr: t('prayers.fajr'),
      dhuhr: t('prayers.dhuhr'),
      asr: t('prayers.asr'),
      maghrib: t('prayers.maghrib'),
      isha: t('prayers.isha'),
    };
    return names[prayerName?.toLowerCase()] || prayerName;
  };

  if (!prayerTimes) return null;

  const nextPrayerName = prayerTimes.next_prayer;
  const nextPrayer = prayerTimes[nextPrayerName?.toLowerCase()];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons 
          name={getPrayerIcon(nextPrayerName)} 
          size={32} 
          color="#00A86B" 
        />
        <Text style={styles.title}>{t('home.nextPrayer')}</Text>
      </View>

      <Text style={styles.prayerName}>{getPrayerName(nextPrayerName)}</Text>
      <Text style={styles.prayerTime}>
        {formatTime(nextPrayer?.time, i18n.language)}
      </Text>
      
      <View style={styles.countdownContainer}>
        <Ionicons name="timer-outline" size={20} color="#666" />
        <Text style={styles.countdown}>{timeRemaining}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  prayerName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  prayerTime: {
    fontSize: 24,
    color: '#00A86B',
    fontWeight: '600',
    marginBottom: 16,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  countdown: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },
});