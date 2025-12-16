// ============================================================================
// FILE: src/components/prayers/CircularPrayerCard.jsx (UPDATED DESIGN)
// ============================================================================
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { formatTime } from '../../utils/timeUtils';

const { width } = Dimensions.get('window');

export const CircularPrayerCard = ({ prayerTimes }) => {
  const { t, i18n } = useTranslation();
  const [timeRemaining, setTimeRemaining] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [currentNextPrayer, setCurrentNextPrayer] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!prayerTimes) return;
    updatePrayerStatus();
    intervalRef.current = setInterval(() => {
      updatePrayerStatus();
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [prayerTimes]);

  const updatePrayerStatus = () => {
    if (!prayerTimes) return;

    const now = new Date();
    const prayerOrder = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

    let nextPrayer = null;
    let nextPrayerTime = null;

    for (const prayerName of prayerOrder) {
      const prayer = prayerTimes[prayerName];
      if (!prayer?.time) continue;

      const [hours, minutes] = prayer.time.split(':').map(Number);
      const prayerTime = new Date();
      prayerTime.setHours(hours, minutes, 0, 0);

      if (prayerTime > now) {
        nextPrayer = prayerName;
        nextPrayerTime = prayerTime;
        break;
      }
    }

    if (!nextPrayer) {
      nextPrayer = 'fajr';
      const prayer = prayerTimes.fajr;
      if (prayer?.time) {
        const [hours, minutes] = prayer.time.split(':').map(Number);
        nextPrayerTime = new Date();
        nextPrayerTime.setHours(hours, minutes, 0, 0);
        nextPrayerTime.setDate(nextPrayerTime.getDate() + 1);
      }
    }

    if (currentNextPrayer !== nextPrayer) {
      setCurrentNextPrayer(nextPrayer);
    }

    if (nextPrayerTime) {
      const diff = Math.max(0, nextPrayerTime - now);
      const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
      const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secondsLeft = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({
        hours: hoursLeft,
        minutes: minutesLeft,
        seconds: secondsLeft,
      });
    }
  };

  const getProgressPercentage = () => {
    if (!prayerTimes || !currentNextPrayer) return 0;

    const now = new Date();
    const prayerOrder = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const currentIndex = prayerOrder.indexOf(currentNextPrayer);
    const previousPrayerName =
      currentIndex > 0 ? prayerOrder[currentIndex - 1] : 'isha';

    const nextPrayer = prayerTimes[currentNextPrayer];
    const previousPrayer = prayerTimes[previousPrayerName];

    if (!nextPrayer?.time || !previousPrayer?.time) return 0;

    const [nextH, nextM] = nextPrayer.time.split(':').map(Number);
    const [prevH, prevM] = previousPrayer.time.split(':').map(Number);

    let nextTime = new Date();
    nextTime.setHours(nextH, nextM, 0, 0);

    let prevTime = new Date();
    prevTime.setHours(prevH, prevM, 0, 0);

    if (nextTime <= now) {
      nextTime.setDate(nextTime.getDate() + 1);
    }

    if (
      prevTime > nextTime ||
      (currentNextPrayer === 'fajr' && now < nextTime)
    ) {
      prevTime.setDate(prevTime.getDate() - 1);
    }

    const totalDuration = nextTime - prevTime;
    const elapsed = now - prevTime;
    const progress = Math.min(Math.max(elapsed / totalDuration, 0), 1);

    return progress * 100;
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

  const getPrayerIcon = (prayerName) => {
    const icons = {
      fajr: { icon: 'weather-sunset-up', iconSet: 'mci' },
      dhuhr: { icon: 'sunny-outline', iconSet: 'ion' },
      asr: { icon: 'partly-sunny-outline', iconSet: 'ion' },
      maghrib: { icon: 'weather-sunset-down', iconSet: 'mci' },
      isha: { icon: 'moon-outline', iconSet: 'ion' },
    };
    return icons[prayerName?.toLowerCase()] || icons.fajr;
  };

  const getAllPrayerTimes = () => [
    {
      key: 'fajr',
      time: prayerTimes.fajr?.time,
      icon: 'weather-sunset-up',
      iconSet: 'mci',
    },
    {
      key: 'dhuhr',
      time: prayerTimes.dhuhr?.time,
      icon: 'sunny-outline',
      iconSet: 'ion',
    },
    {
      key: 'asr',
      time: prayerTimes.asr?.time,
      icon: 'partly-sunny-outline',
      iconSet: 'ion',
    },
    {
      key: 'maghrib',
      time: prayerTimes.maghrib?.time,
      icon: 'weather-sunset-down',
      iconSet: 'mci',
    },
    {
      key: 'isha',
      time: prayerTimes.isha?.time,
      icon: 'moon-outline',
      iconSet: 'ion',
    },
  ];

  if (!prayerTimes || !currentNextPrayer) return null;

  const nextPrayer = prayerTimes[currentNextPrayer];
  const nextTimeStr = formatTime(nextPrayer?.time, i18n.language) || '00:00';
  const [hh, mm] = nextTimeStr.split(':');

  const allPrayers = getAllPrayerTimes();
  const progressPercentage = getProgressPercentage();

  const radius = 115;
  const centerX = 130;
  const centerY = 130;
  const strokeWidth = 14;

  const arcLength = Math.PI * radius;
  const progressLength = (arcLength * progressPercentage) / 100;
  const dashOffset = arcLength - progressLength;

  const nextPrayerIcon = getPrayerIcon(currentNextPrayer);

  return (
    <View style={styles.container}>
      <ExpoLinearGradient
        colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.08)']}
        style={styles.cardWrapper}
      >
        <View style={styles.circleContainer}>
          {/* Prayer Name Label - Transparent with Gradient Border */}
          <View style={styles.arcTopLabelOuter}>
            <View style={styles.pillBorder}>
              <View style={styles.pillInner}>
                {nextPrayerIcon.iconSet === 'mci' ? (
                  <MaterialCommunityIcons
                    name={nextPrayerIcon.icon}
                    size={16}
                    color="#FFFFFF"
                  />
                ) : (
                  <Ionicons
                    name={nextPrayerIcon.icon}
                    size={16}
                    color="#FFFFFF"
                  />
                )}
                <Text style={styles.upcomingText}>{t('home.upcoming')}</Text>
                <Text style={styles.prayerNameText}>
                  {getPrayerName(currentNextPrayer)}
                </Text>
              </View>
            </View>
          </View>

          {/* SVG Arc with Matching Gradient */}
          <Svg
            height="170"
            width="260"
            viewBox="0 0 260 170"
            style={styles.svg}
          >
            <Defs>
              <LinearGradient
                id="progressGradient"
                gradientUnits="userSpaceOnUse"
                x1="15"
                y1={centerY}
                x2={centerX * 2 - 15}
                y2={centerY}
              >
                <Stop offset="0%" stopColor="#5F8D7E" stopOpacity="1" />
                <Stop offset="100%" stopColor="#4F6F64" stopOpacity="1" />
              </LinearGradient>

              <LinearGradient
                id="glowGradient"
                gradientUnits="userSpaceOnUse"
                x1="15"
                y1={centerY}
                x2={centerX * 2 - 15}
                y2={centerY}
              >
                <Stop offset="0%" stopColor="#6F9C8C" stopOpacity="0.28" />
                <Stop offset="100%" stopColor="#4F6F64" stopOpacity="0.28" />
              </LinearGradient>
            </Defs>

            {/* Glow effect */}
            <Path
              d={`M 15 ${centerY} A ${radius} ${radius} 0 0 1 ${centerX * 2 - 15} ${centerY}`}
              fill="none"
              stroke="url(#glowGradient)"
              strokeWidth={strokeWidth + 6}
              strokeLinecap="round"
              strokeDasharray={arcLength}
              strokeDashoffset={dashOffset}
              opacity="0.25"
            />

            {/* Background arc */}
            <Path
              d={`M 15 ${centerY} A ${radius} ${radius} 0 0 1 ${centerX * 2 - 15} ${centerY}`}
              fill="none"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />

            {/* Progress arc with gradient */}
            <Path
              d={`M 15 ${centerY} A ${radius} ${radius} 0 0 1 ${centerX * 2 - 15} ${centerY}`}
              fill="none"
              stroke="url(#progressGradient)" // ✅ HOME ile AYNI
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={arcLength}
              strokeDashoffset={dashOffset}
            />
          </Svg>

          {/* Center Time Display - Transparent with Gradient Border */}
          <View style={styles.centerContentOuter}>
            <View style={styles.timeBorder}>
              <View style={styles.timeInner}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                  <Text style={styles.timeHour}>{hh}</Text>
                  <Text style={styles.timeColon}>:</Text>
                  <Text style={styles.timeMinute}>{mm}</Text>
                </View>

                <View style={styles.remainingContainer}>
                  <Ionicons
                    name="hourglass-outline"
                    size={12}
                    color="rgba(255,255,255,0.95)"
                  />
                  <Text style={styles.remainingText}>
                    {timeRemaining.hours > 0 && `${timeRemaining.hours}h `}
                    {timeRemaining.minutes}m {timeRemaining.seconds}s{' '}
                    {t('home.left')}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Prayer Times Row - Clean, only highlight active */}
        <View style={styles.prayerTimesRow}>
          {allPrayers.map((prayer) => {
            const isNext = prayer.key === currentNextPrayer;
            return (
              <View key={prayer.key} style={styles.prayerTimeItem}>
                <View
                  style={[
                    styles.prayerIconWrapper,
                    isNext && styles.prayerIconWrapperActive,
                  ]}
                >
                  {prayer.iconSet === 'mci' ? (
                    <MaterialCommunityIcons
                      name={prayer.icon}
                      size={isNext ? 22 : 18}
                      color={isNext ? '#FFFFFF' : 'rgba(255, 255, 255, 0.55)'}
                    />
                  ) : (
                    <Ionicons
                      name={prayer.icon}
                      size={isNext ? 20 : 16}
                      color={isNext ? '#FFFFFF' : 'rgba(255, 255, 255, 0.55)'}
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.prayerLabel,
                    isNext && styles.prayerLabelActive,
                  ]}
                >
                  {getPrayerName(prayer.key)}
                </Text>
                <Text
                  style={[
                    styles.prayerTimeText,
                    isNext && styles.prayerTimeActive,
                  ]}
                >
                  {formatTime(prayer.time, i18n.language)}
                </Text>
              </View>
            );
          })}
        </View>
      </ExpoLinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  cardWrapper: {
    width: '100%',
    borderRadius: 32,
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  circleContainer: {
    width: '100%',
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 20,
  },
  svg: {
    position: 'absolute',
    top: 30,
  },

  // Transparent label with gradient border
  arcTopLabelOuter: {
    position: 'absolute',
    top: 0,
    zIndex: 10,
    shadowColor: '#4F6F64',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  labelGradientBorder: {
    borderRadius: 20,
    padding: 2,
  },
  labelInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 18,
  },
  upcomingText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  prayerNameText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '800',
    textTransform: 'capitalize',
  },

  // Transparent time display with gradient border
  centerContentOuter: {
    position: 'absolute',
    top: 95,
    alignItems: 'center',
    zIndex: 5,
    shadowColor: '#4F6F64',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  remainingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  remainingText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Clean bottom row - only highlight active
  prayerTimesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  prayerTimeItem: {
    alignItems: 'center',
    flex: 1,
  },
  prayerIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  prayerIconWrapperActive: {
    borderColor: 'rgba(255,255,255,0.55)',
    transform: [{ scale: 1.08 }],
  },

  prayerLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    marginBottom: 2,
  },
  prayerLabelActive: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  prayerTimeText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '700',
  },
  prayerTimeActive: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  timeHour: {
    fontSize: 44,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  timeColon: {
    fontSize: 36,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginHorizontal: 2,
    marginBottom: 4,
  },
  timeMinute: {
    fontSize: 44,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  pillBorder: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'transparent',
  },
  pillInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    gap: 6,
    backgroundColor: 'transparent',
    borderRadius: 20,
  },

  timeBorder: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'transparent',
  },
  timeInner: {
    paddingHorizontal: 26,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 24,
  },
});
