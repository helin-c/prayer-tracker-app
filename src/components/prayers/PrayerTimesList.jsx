// ============================================================================
// FILE: src/components/prayers/PrayerTimesList.jsx (WITH i18n & TIME FORMAT)
// ============================================================================
import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { formatTime } from '../../utils/timeUtils';

export const PrayerTimesList = ({ prayerTimes }) => {
  const { t, i18n } = useTranslation();

  if (!prayerTimes) return null;

  const prayers = [
    { name: 'Fajr', key: 'fajr', data: prayerTimes.fajr, icon: 'cloudy-night-outline' },
    { name: 'Sunrise', key: 'sunrise', data: prayerTimes.sunrise, icon: 'sunny-outline', isSubtle: true },
    { name: 'Dhuhr', key: 'dhuhr', data: prayerTimes.dhuhr, icon: 'sunny' },
    { name: 'Asr', key: 'asr', data: prayerTimes.asr, icon: 'partly-sunny-outline' },
    { name: 'Maghrib', key: 'maghrib', data: prayerTimes.maghrib, icon: 'cloudy-night' },
    { name: 'Isha', key: 'isha', data: prayerTimes.isha, icon: 'moon' },
  ];

  const isNextPrayer = (prayerKey) => {
    return prayerKey.toLowerCase() === prayerTimes.next_prayer?.toLowerCase();
  };

  const getPrayerName = (key) => {
    if (key === 'sunrise') return t('home.sunrise');
    return t(`prayers.${key.toLowerCase()}`);
  };

  const renderPrayer = ({ item }) => (
    <View 
      style={[
        styles.prayerItem,
        isNextPrayer(item.key) && styles.nextPrayerItem,
        item.isSubtle && styles.subtlePrayer
      ]}
    >
      <View style={styles.prayerLeft}>
        <View style={[
          styles.iconContainer,
          isNextPrayer(item.key) && styles.nextPrayerIcon
        ]}>
          <Ionicons 
            name={item.icon} 
            size={24} 
            color={isNextPrayer(item.key) ? '#00A86B' : '#666'} 
          />
        </View>
        <Text style={[
          styles.prayerName,
          item.isSubtle && styles.subtleText
        ]}>
          {getPrayerName(item.key)}
        </Text>
      </View>
      <Text style={[
        styles.prayerTime,
        isNextPrayer(item.key) && styles.nextPrayerTime,
        item.isSubtle && styles.subtleText
      ]}>
        {formatTime(item.data?.time, i18n.language)}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={prayers}
        renderItem={renderPrayer}
        keyExtractor={(item) => item.key}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  prayerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  nextPrayerItem: {
    backgroundColor: '#F0FFF4',
    marginHorizontal: -20,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderBottomWidth: 0,
  },
  subtlePrayer: {
    opacity: 0.6,
  },
  prayerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  nextPrayerIcon: {
    backgroundColor: '#E8F5E9',
  },
  prayerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  prayerTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  nextPrayerTime: {
    color: '#00A86B',
    fontWeight: 'bold',
  },
  subtleText: {
    color: '#999',
  },
});