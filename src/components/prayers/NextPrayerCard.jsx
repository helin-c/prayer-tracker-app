// ============================================================================
// FILE: src/components/prayers/NextPrayerCard.jsx (AESTHETIC REDESIGN)
// ============================================================================
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { formatTime } from '../../utils/timeUtils';

const { width } = Dimensions.get('window');

export const NextPrayerCard = ({ prayerTimes }) => {
  const { t, i18n } = useTranslation();
  const [timeRemaining, setTimeRemaining] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!prayerTimes) return;
    const interval = setInterval(() => calculateTimeRemaining(), 1000);
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

    setTimeRemaining({ hours: hoursLeft, minutes: minutesLeft, seconds: secondsLeft });
  };

  const getPrayerIcon = (prayerName) => {
    const icons = {
      fajr: 'cloudy-night-outline',
      dhuhr: 'sunny',
      asr: 'partly-sunny-outline',
      maghrib: 'moon',
      isha: 'moon-outline',
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.upcomingLabel}>Next Prayer</Text>
        <View style={styles.timerBadge}>
          <Ionicons name="timer-outline" size={12} color="#10B981" />
          <Text style={styles.timerText}>
            {timeRemaining.hours > 0 && `${timeRemaining.hours}h `}
            {timeRemaining.minutes}m {timeRemaining.seconds}s
          </Text>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        <View style={styles.iconContainer}>
          <Ionicons 
            name={getPrayerIcon(nextPrayerName)} 
            size={32} 
            color="#10B981" 
          />
        </View>

        <View style={styles.prayerInfo}>
          <Text style={styles.prayerName}>{getPrayerName(nextPrayerName)}</Text>
          <Text style={styles.prayerTime}>{formatTime(nextPrayer?.time, i18n.language)}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${getProgressPercentage()}%` }]} />
      </View>
    </View>
  );

  function getProgressPercentage() {
    if (!prayerTimes?.next_prayer) return 0;

    const now = new Date();
    const nextPrayerName = prayerTimes.next_prayer.toLowerCase();
    const nextPrayer = prayerTimes[nextPrayerName];
    
    const prayerOrder = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const currentIndex = prayerOrder.indexOf(nextPrayerName);
    const previousPrayerName = currentIndex > 0 ? prayerOrder[currentIndex - 1] : 'isha';
    const previousPrayer = prayerTimes[previousPrayerName];

    if (!nextPrayer?.time || !previousPrayer?.time) return 0;

    const [nextH, nextM] = nextPrayer.time.split(':').map(Number);
    const [prevH, prevM] = previousPrayer.time.split(':').map(Number);

    let nextTime = new Date();
    nextTime.setHours(nextH, nextM, 0, 0);

    let prevTime = new Date();
    prevTime.setHours(prevH, prevM, 0, 0);

    if (nextTime < prevTime) {
      nextTime.setDate(nextTime.getDate() + 1);
    }
    if (now < prevTime && nextPrayerName === 'fajr') {
      prevTime.setDate(prevTime.getDate() - 1);
    }

    const totalDuration = nextTime - prevTime;
    const elapsed = now - prevTime;
    const progress = Math.min(Math.max(elapsed / totalDuration, 0), 1);

    return progress * 100;
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  upcomingLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  timerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: 0.3,
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prayerInfo: {
    flex: 1,
  },
  prayerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  prayerTime: {
    fontSize: 32,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: -1,
  },
  progressContainer: {
    height: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
});