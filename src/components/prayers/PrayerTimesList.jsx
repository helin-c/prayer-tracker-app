import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const PrayerTimesList = ({ prayerTimes }) => {
  if (!prayerTimes) return null;

  const prayers = [
    { name: 'Fajr', data: prayerTimes.fajr, icon: 'cloudy-night-outline' },
    { name: 'Sunrise', data: prayerTimes.sunrise, icon: 'sunny-outline'},
    { name: 'Dhuhr', data: prayerTimes.dhuhr, icon: 'sunny' },
    { name: 'Asr', data: prayerTimes.asr, icon: 'partly-sunny-outline' },
    { name: 'Maghrib', data: prayerTimes.maghrib, icon: 'cloudy-night' },
    { name: 'Isha', data: prayerTimes.isha, icon: 'moon' },
  ];
  

  const isNextPrayer = (prayerName) => {
    return prayerName.toLowerCase() === prayerTimes.next_prayer?.toLowerCase();
  };

  const renderPrayer = ({ item }) => (
    <View 
      style={[
        styles.prayerItem,
        isNextPrayer(item.name) && styles.nextPrayerItem,
        item.isSubtle && styles.subtlePrayer
      ]}
    >
      <View style={styles.prayerLeft}>
        <View style={[
          styles.iconContainer,
          isNextPrayer(item.name) && styles.nextPrayerIcon
        ]}>
          <Ionicons 
            name={item.icon} 
            size={24} 
            color={isNextPrayer(item.name) ? '#00A86B' : '#666'} 
          />
        </View>
        <Text style={[
          styles.prayerName,
          item.isSubtle && styles.subtleText
        ]}>
          {item.name}
        </Text>
      </View>
      
      <Text style={[
        styles.prayerTime,
        isNextPrayer(item.name) && styles.nextPrayerTime,
        item.isSubtle && styles.subtleText
      ]}>
        {item.data?.readable}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Today's Prayer Times</Text>
        <Text style={styles.hijriDate}>{prayerTimes.hijri_date}</Text>
      </View>
      
      <FlatList
        data={prayers}
        renderItem={renderPrayer}
        keyExtractor={(item) => item.name}
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
  header: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  hijriDate: {
    fontSize: 14,
    color: '#666',
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