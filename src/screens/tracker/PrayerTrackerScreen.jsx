// ============================================================================
// FILE: src/screens/tracker/PrayerTrackerScreen.jsx
// ============================================================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { usePrayerTrackerStore } from '../../store/prayerTrackerStore';
import { StatsSection } from '../../components/tracker/StatsSection';

const PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
export const PRAYER_ICONS = {
  Fajr: 'cloudy-night-outline',
  Dhuhr: 'sunny',
  Asr: 'partly-sunny-outline',
  Maghrib: 'cloudy-night',
  Isha: 'moon',
};

export const PrayerTrackerScreen = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState([]);
  const [selectedPrayer, setSelectedPrayer] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const {
    dayPrayers,
    weekPrayers,
    isLoading,
    error,
    fetchDayPrayers,
    fetchWeekPrayers,
    trackPrayer,
  } = usePrayerTrackerStore();

  useEffect(() => {
    generateWeekDates();
  }, []);

  useEffect(() => {
    if (weekDates.length > 0) {
      loadData();
    }
  }, [selectedDate, weekDates]);

  const loadData = async () => {
    try {
      const dateStr = formatDate(selectedDate);
      const weekStartStr = formatDate(weekDates[0]);
      
      await Promise.all([
        fetchDayPrayers(dateStr),
        fetchWeekPrayers(weekStartStr),
      ]);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const generateWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((currentDay + 6) % 7)); // Go to Monday

    const week = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      week.push(date);
    }
    setWeekDates(week);
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const formatDisplayDate = (date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handlePrayerPress = (prayer) => {
    setSelectedPrayer(prayer);
    setModalVisible(true);
  };

  const handlePrayerAction = async (action) => {
    if (!selectedPrayer) return;

    // Determine prayer status
    const completed = action !== 'missed';
    const onTime = action === 'ontime';
    const missed = action === 'missed';

    const dateStr = formatDate(selectedDate);
    
    try {
      await trackPrayer({
        prayer_name: selectedPrayer.prayer_name,
        prayer_date: dateStr,
        prayer_time: selectedPrayer.prayer_time || '00:00',
        completed,
        on_time: onTime,
      });

      setModalVisible(false);
      
      // Reload data
      await loadData();
      
    } catch (err) {
      Alert.alert('Error', 'Failed to track prayer. Please try again.');
    }
  };

  const getCompletionPercentage = () => {
    if (!dayPrayers) return 0;
    return dayPrayers.completion_percentage || 0;
  };

  const CircularProgress = ({ percentage, size = 120, strokeWidth = 12 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = (percentage / 100) * circumference;

    return (
      <View style={styles.circularProgress}>
        <Svg width={size} height={size}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E0E0E0"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#00A86B"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <View style={styles.circularProgressText}>
          <Text style={styles.percentageText}>{Math.round(percentage)}%</Text>
          <Text style={styles.percentageLabel}>Complete</Text>
        </View>
      </View>
    );
  };

  const WeekDayCircle = ({ date, percentage }) => {
    const size = 50;
    const strokeWidth = 4;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = (percentage / 100) * circumference;
    const today = isToday(date);
    const isSelected = date.toDateString() === selectedDate.toDateString();

    return (
      <TouchableOpacity
        style={styles.weekDayContainer}
        onPress={() => setSelectedDate(date)}
        activeOpacity={0.7}
      >
        <Text style={[styles.weekDayName, today && styles.todayText]}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'][date.getDay() === 0 ? 6 : date.getDay() - 1]}
        </Text>
        <View style={styles.weekDayCircle}>
          <Svg width={size} height={size}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#E0E0E0"
              strokeWidth={strokeWidth}
              fill={isSelected ? '#00A86B' : '#FFF'}
            />
            {percentage > 0 && (
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#00A86B"
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - progress}
                strokeLinecap="round"
                rotation="-90"
                origin={`${size / 2}, ${size / 2}`}
              />
            )}
          </Svg>
          <Text style={[styles.weekDayDate, isSelected && styles.todayDateText]}>
            {date.getDate()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#DC3545" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Prayer Tracker</Text>
          <Text style={styles.subtitle}>Track your daily prayers</Text>
        </View>

        {/* Week Calendar */}
        <View style={styles.weekCalendar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.weekScrollContent}
          >
            {weekDates.map((date, index) => {
              const dateStr = formatDate(date);
              const dayData = weekPrayers?.days?.find(d => d.date === dateStr);
              const percentage = dayData?.completion_percentage || 0;
              
              return (
                <WeekDayCircle
                  key={index}
                  date={date}
                  percentage={percentage}
                />
              );
            })}
          </ScrollView>
        </View>

        {/* Selected Date & Progress */}
        <View style={styles.todaySection}>
          <View style={styles.todayHeader}>
            <View>
              <Text style={styles.todayLabel}>
                {isToday(selectedDate) ? 'Today' : 'Selected Date'}
              </Text>
              <Text style={styles.todayDate}>{formatDisplayDate(selectedDate)}</Text>
            </View>
            <CircularProgress percentage={getCompletionPercentage()} />
          </View>
        </View>

        {/* Prayer List */}
        <View style={styles.prayerList}>
          <Text style={styles.sectionTitle}>
            {isToday(selectedDate) ? "Today's Prayers" : "Prayers"}
          </Text>
          
          {isLoading && !dayPrayers ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#00A86B" />
            </View>
          ) : (
            dayPrayers?.prayers?.map((prayer, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.prayerCard,
                  prayer.completed && styles.prayerCardCompleted,
                  // Red style for missed prayers (tracked but not completed)
                  (prayer.id && !prayer.completed) && styles.prayerCardMissed,
                ]}
                onPress={() => handlePrayerPress(prayer)}
                activeOpacity={0.7}
              >
                <View style={styles.prayerCardLeft}>
                  <View
                    style={[
                      styles.prayerIcon,
                      prayer.completed && styles.prayerIconCompleted,
                      (prayer.id && !prayer.completed) && styles.prayerIconMissed,
                    ]}
                  >
                    <Ionicons
                      name={PRAYER_ICONS[prayer.prayer_name]}
                      size={24}
                      color={
                        prayer.completed 
                          ? '#FFF' 
                          : (prayer.id && !prayer.completed) 
                            ? '#FFF' 
                            : '#00A86B'
                      }
                    />
                  </View>
                  <View>
                    <Text style={styles.prayerName}>{prayer.prayer_name}</Text>
                    {prayer.completed && prayer.on_time && (
                      <Text style={styles.onTimeLabel}>✓ On Time</Text>
                    )}
                    {prayer.completed && !prayer.on_time && (
                      <Text style={styles.lateLabel}>Done (Late)</Text>
                    )}
                    {prayer.id && !prayer.completed && (
                      <Text style={styles.missedLabel}>✗ Missed</Text>
                    )}
                  </View>
                </View>
                <View style={styles.prayerCardRight}>
                  {prayer.completed ? (
                    <View style={styles.completedBadge}>
                      <Ionicons name="checkmark-circle" size={28} color="#00A86B" />
                    </View>
                  ) : prayer.id && !prayer.completed ? (
                    <View style={styles.missedBadge}>
                      <Ionicons name="close-circle" size={28} color="#DC3545" />
                    </View>
                  ) : (
                    <Ionicons name="chevron-forward" size={24} color="#CCC" />
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Statistics */}
        <StatsSection />
      </ScrollView>

      {/* Prayer Action Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedPrayer?.prayer_name}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>Mark this prayer as:</Text>

            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonOnTime]}
              onPress={() => handlePrayerAction('ontime')}
            >
              <Ionicons name="time" size={24} color="#FFF" />
              <Text style={styles.modalButtonText}>Done (On Time)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonDone]}
              onPress={() => handlePrayerAction('done')}
            >
              <Ionicons name="checkmark-circle" size={24} color="#FFF" />
              <Text style={styles.modalButtonText}>Done (Late)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonMissed]}
              onPress={() => handlePrayerAction('missed')}
            >
              <Ionicons name="close-circle" size={24} color="#FFF" />
              <Text style={styles.modalButtonText}>Missed</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  weekCalendar: {
    marginBottom: 24,
  },
  weekScrollContent: {
    paddingVertical: 8,
  },
  weekDayContainer: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  weekDayName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
  },
  todayText: {
    color: '#00A86B',
  },
  weekDayCircle: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayDate: {
    position: 'absolute',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  todayDateText: {
    color: '#FFF',
  },
  todaySection: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  todayLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  todayDate: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  circularProgress: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularProgressText: {
    position: 'absolute',
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00A86B',
  },
  percentageLabel: {
    fontSize: 12,
    color: '#666',
  },
  prayerList: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  prayerCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  prayerCardCompleted: {
    backgroundColor: '#F0FFF4',
  },
  prayerCardMissed: {
    backgroundColor: '#FFEBEE',
  },
  prayerCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prayerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0FFF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  prayerIconCompleted: {
    backgroundColor: '#00A86B',
  },
  prayerIconMissed: {
    backgroundColor: '#DC3545',
  },
  prayerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  onTimeLabel: {
    fontSize: 12,
    color: '#00A86B',
  },
  lateLabel: {
    fontSize: 12,
    color: '#F39C12',
  },
  missedLabel: {
    fontSize: 12,
    color: '#DC3545',
  },
  prayerCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completedBadge: {
    marginRight: 8,
  },
  missedBadge: {
    marginRight: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#00A86B',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  modalButtonOnTime: {
    backgroundColor: '#00A86B',
  },
  modalButtonDone: {
    backgroundColor: '#3498DB',
  },
  modalButtonMissed: {
    backgroundColor: '#DC3545',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 8,
  },
});