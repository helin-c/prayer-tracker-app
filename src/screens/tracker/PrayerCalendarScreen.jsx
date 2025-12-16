// ============================================================================
// FILE: src/screens/tracker/PrayerCalendarScreen.jsx
// ============================================================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  ActivityIndicator,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { usePrayerTrackerStore } from '../../store/prayerTrackerStore';
import { useAuthStore } from '../../store/authStore';
import { IslamicLoadingScreen } from '../../components/loading/IslamicLoadingScreen';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = (width - 80) / 7;

export const PrayerCalendarScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { fetchWeekPrayers, isLoading } = usePrayerTrackerStore();

  const [calendarData, setCalendarData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [totalStats, setTotalStats] = useState({
    totalDays: 0,
    completedDays: 0,
    onTimePrayers: 0,
    totalPrayers: 0,
    currentStreak: 0,
    longestStreak: 0,
  });

  useEffect(() => {
    loadMonthData();
  }, [selectedMonth]);

  const loadMonthData = async () => {
    try {
      const firstDay = new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth(),
        1
      );
      const joinDate = user?.created_at ? new Date(user.created_at) : firstDay;
      const startDate = firstDay > joinDate ? firstDay : joinDate;

      const weeks = [];
      let currentDate = new Date(startDate);

      const dayOfWeek = currentDate.getDay();
      const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      currentDate.setDate(currentDate.getDate() + daysToMonday);

      const lastDayOfMonth = new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() + 1,
        0
      );

      while (currentDate <= lastDayOfMonth || weeks.length === 0) {
        const weekStart = new Date(currentDate);
        const response = await fetchWeekPrayers(formatDate(weekStart));

        if (response?.days) {
          weeks.push(...response.days);
        }

        currentDate.setDate(currentDate.getDate() + 7);

        if (
          currentDate.getMonth() !== selectedMonth.getMonth() &&
          weeks.length > 0
        ) {
          break;
        }
      }

      calculateStats(weeks);
      const grouped = groupByWeeks(weeks);
      setCalendarData(grouped);
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const groupByWeeks = (days) => {
    const weeks = [];
    let currentWeek = [];

    days.forEach((day, index) => {
      const date = new Date(day.date);
      const dayOfWeek = date.getDay();
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      if (index === 0 && adjustedDay > 0) {
        for (let i = 0; i < adjustedDay; i++) {
          currentWeek.push(null);
        }
      }

      currentWeek.push(day);

      if (adjustedDay === 6) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return weeks;
  };

  const calculateStats = (days) => {
    let totalDays = 0;
    let completedDays = 0;
    let onTimePrayers = 0;
    let totalPrayers = 0;
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sortedDays = [...days].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    sortedDays.forEach((day) => {
      const dayDate = new Date(day.date);
      dayDate.setHours(0, 0, 0, 0);

      if (dayDate <= today) {
        totalDays++;
        totalPrayers += 5;

        const completion = day.completion_percentage || 0;
        const onTimeCount = day.on_time_count || 0;

        onTimePrayers += onTimeCount;

        if (completion === 100) {
          completedDays++;
          tempStreak++;

          if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
          }

          if (
            dayDate.getTime() === today.getTime() ||
            (new Date(sortedDays[sortedDays.length - 1].date).getTime() ===
              today.getTime() &&
              completion === 100)
          ) {
            currentStreak = tempStreak;
          }
        } else {
          tempStreak = 0;
        }
      }
    });

    setTotalStats({
      totalDays,
      completedDays,
      onTimePrayers,
      totalPrayers,
      currentStreak,
      longestStreak,
    });
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const changeMonth = (direction) => {
    const newMonth = new Date(selectedMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);

    const today = new Date();
    if (newMonth > today) return;

    const joinDate = user?.created_at ? new Date(user.created_at) : new Date();
    if (newMonth < new Date(joinDate.getFullYear(), joinDate.getMonth(), 1))
      return;

    setSelectedMonth(newMonth);
  };

  const getMonthYearText = () => {
    const months = [
      t('prayerTracker.months.jan'),
      t('prayerTracker.months.feb'),
      t('prayerTracker.months.mar'),
      t('prayerTracker.months.apr'),
      t('prayerTracker.months.may'),
      t('prayerTracker.months.jun'),
      t('prayerTracker.months.jul'),
      t('prayerTracker.months.aug'),
      t('prayerTracker.months.sep'),
      t('prayerTracker.months.oct'),
      t('prayerTracker.months.nov'),
      t('prayerTracker.months.dec'),
    ];
    return `${months[selectedMonth.getMonth()]} ${selectedMonth.getFullYear()}`;
  };

  const handleDayPress = (day) => {
    if (!day) return;

    const date = new Date(day.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    if (date > today) return;

    setSelectedDay(day);
    setShowDayModal(true);
  };

  const DayCircle = ({ day, size = CIRCLE_SIZE }) => {
    if (!day) {
      return <View style={[styles.dayCircle, { width: size, height: size }]} />;
    }

    const percentage = day.completion_percentage || 0;
    const date = new Date(day.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    const isToday = date.getTime() === today.getTime();
    const isFuture = date > today;

    if (isFuture) {
      return (
        <View style={[styles.dayCircle, { width: size, height: size }]}>
          <View style={styles.futureDayCircle}>
            <Text style={styles.futureDayText}>{date.getDate()}</Text>
          </View>
        </View>
      );
    }

    const strokeWidth = 3;
    const radius = (size - strokeWidth * 2) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = (percentage / 100) * circumference;

    return (
      <TouchableOpacity
        style={[styles.dayCircle, { width: size, height: size }]}
        onPress={() => handleDayPress(day)}
        activeOpacity={0.7}
      >
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E0E0E0"
            strokeWidth={strokeWidth}
            fill="#FFF"
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
        <View style={styles.dayContent}>
          <Text style={[styles.dayNumber, isToday && styles.todayNumber]}>
            {date.getDate()}
          </Text>
          {percentage === 100 && (
            <Ionicons name="checkmark-circle" size={14} color="#00A86B" />
          )}
        </View>
        {isToday && <View style={styles.todayDot} />}
      </TouchableOpacity>
    );
  };

  const DayDetailModal = () => {
    if (!selectedDay) return null;

    const date = new Date(selectedDay.date);
    const prayerNames = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const prayerTranslations = [
      t('prayerTracker.prayers.fajr'),
      t('prayerTracker.prayers.dhuhr'),
      t('prayerTracker.prayers.asr'),
      t('prayerTracker.prayers.maghrib'),
      t('prayerTracker.prayers.isha'),
    ];

    const formatDateLong = (date) => {
      const day = date.getDate();
      const month = date.toLocaleString('default', { month: 'long' });
      const year = date.getFullYear();
      const weekday = date.toLocaleString('default', { weekday: 'long' });
      return `${weekday}, ${day} ${month} ${year}`;
    };

    const lateCount = selectedDay.prayers
      ? prayerNames.filter((prayer) => {
          const p = selectedDay.prayers[prayer];
          return p?.completed && !p?.on_time;
        }).length
      : 0;

    return (
      <Modal
        visible={showDayModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDayModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Text style={styles.modalDate}>{formatDateLong(date)}</Text>
                <Text style={styles.modalCompletion}>
                  {selectedDay.completion_percentage || 0}%{' '}
                  {t('calendar.completed')}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowDayModal(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.prayerList}
              showsVerticalScrollIndicator={false}
            >
              {prayerNames.map((prayer, index) => {
                const prayerData = selectedDay.prayers?.[prayer];
                const isCompleted = prayerData?.completed === true;
                const isOnTime = isCompleted && prayerData?.on_time === true;
                const isLate = isCompleted && prayerData?.on_time === false;
                const isMissed = !isCompleted;

                return (
                  <View key={prayer} style={styles.prayerItem}>
                    <View style={styles.prayerItemLeft}>
                      <View
                        style={[
                          styles.prayerIconContainer,
                          isCompleted && styles.prayerIconContainerCompleted,
                          isMissed && styles.prayerIconContainerMissed,
                        ]}
                      >
                        {isCompleted ? (
                          <Ionicons
                            name="checkmark"
                            size={20}
                            color={isOnTime ? '#00A86B' : '#F39C12'}
                          />
                        ) : (
                          <Ionicons name="close" size={20} color="#E74C3C" />
                        )}
                      </View>
                      <View style={styles.prayerInfo}>
                        <Text style={styles.prayerName}>
                          {prayerTranslations[index]}
                        </Text>
                        
                      </View>
                    </View>
                    <View style={styles.prayerStatusBadge}>
                      {isOnTime && (
                        <View style={[styles.statusBadge, styles.onTimeBadge]}>
                          <Ionicons name="time" size={12} color="#00A86B" />
                          <Text style={styles.onTimeText}>
                            {t('calendar.onTime')}
                          </Text>
                        </View>
                      )}
                      {isLate && (
                        <View style={[styles.statusBadge, styles.lateBadge]}>
                          <Ionicons
                            name="time-outline"
                            size={12}
                            color="#F39C12"
                          />
                          <Text style={styles.lateText}>
                            {t('calendar.late')}
                          </Text>
                        </View>
                      )}
                      {isMissed && (
                        <View style={[styles.statusBadge, styles.missedBadge]}>
                          <Ionicons
                            name="close-circle"
                            size={12}
                            color="#E74C3C"
                          />
                          <Text style={styles.missedText}>
                            {t('calendar.missed')}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <View style={styles.modalSummary}>
              <View style={styles.summaryItem}>
                <Ionicons name="checkmark-circle" size={20} color="#00A86B" />
                <Text style={styles.summaryText}>
                  {selectedDay.on_time_count || 0} {t('calendar.onTimePrayers')}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="time" size={20} color="#F39C12" />
                <Text style={styles.summaryText}>
                  {lateCount} {t('calendar.latePrayers')}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (initialLoading) {
    return (
      <IslamicLoadingScreen
        message={t('calendar.loading')}
        submessage={t('calendar.loadingSubtitle')}
      />
    );
  }

  const weekDayLabels = [
    t('prayerTracker.weekDays.monday'),
    t('prayerTracker.weekDays.tuesday'),
    t('prayerTracker.weekDays.wednesday'),
    t('prayerTracker.weekDays.thursday'),
    t('prayerTracker.weekDays.friday'),
    t('prayerTracker.weekDays.saturday'),
    t('prayerTracker.weekDays.sunday'),
  ];

  return (
    <ImageBackground
      source={require('../../assets/images/illustrations/background.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('calendar.title')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.monthSelector}>
            <TouchableOpacity
              style={styles.monthButton}
              onPress={() => changeMonth(-1)}
            >
              <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
            </TouchableOpacity>

            <Text style={styles.monthText}>{getMonthYearText()}</Text>

            <TouchableOpacity
              style={styles.monthButton}
              onPress={() => changeMonth(1)}
              disabled={
                selectedMonth.getMonth() === new Date().getMonth() &&
                selectedMonth.getFullYear() === new Date().getFullYear()
              }
            >
              <Ionicons
                name="chevron-forward"
                size={24}
                color={
                  selectedMonth.getMonth() === new Date().getMonth() &&
                  selectedMonth.getFullYear() === new Date().getFullYear()
                    ? '#CCC'
                    : '#1A1A1A'
                }
              />
            </TouchableOpacity>
          </View>

          <View style={styles.calendarContainer}>
            <View style={styles.weekDayHeader}>
              {weekDayLabels.map((label, index) => (
                <Text key={index} style={styles.weekDayLabel}>
                  {label.substring(0, 3)}
                </Text>
              ))}
            </View>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00A86B" />
              </View>
            ) : (
              calendarData.map((week, weekIndex) => (
                <View key={weekIndex} style={styles.weekRow}>
                  {week.map((day, dayIndex) => (
                    <DayCircle key={dayIndex} day={day} />
                  ))}
                </View>
              ))
            )}
          </View>

          <View style={styles.statsSection}>
            <View style={styles.statRow}>
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="flame" size={24} color="#F39C12" />
                </View>
                <Text style={styles.statValue}>{totalStats.currentStreak}</Text>
                <Text style={styles.statLabel}>
                  {t('calendar.currentStreak')}
                </Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="trophy" size={24} color="#00A86B" />
                </View>
                <Text style={styles.statValue}>{totalStats.longestStreak}</Text>
                <Text style={styles.statLabel}>
                  {t('calendar.longestStreak')}
                </Text>
              </View>
            </View>

            <View style={styles.statRow}>
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="checkmark-circle" size={24} color="#00A86B" />
                </View>
                <Text style={styles.statValue}>
                  {totalStats.completedDays}/{totalStats.totalDays}
                </Text>
                <Text style={styles.statLabel}>
                  {t('calendar.perfectDays')}
                </Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="time" size={24} color="#00A86B" />
                </View>
                <Text style={styles.statValue}>
                  {totalStats.totalPrayers > 0
                    ? Math.round(
                        (totalStats.onTimePrayers / totalStats.totalPrayers) *
                          100
                      )
                    : 0}
                  %
                </Text>
                <Text style={styles.statLabel}>{t('calendar.onTimeRate')}</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <DayDetailModal />
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: { flex: 1 },
  container: { flex: 1, backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },
  statsSection: { marginBottom: 24 },
  statRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statLabel: { fontSize: 12, color: '#666', textAlign: 'center' },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  monthButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthText: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A' },
  calendarContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  weekDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  weekDayLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    width: CIRCLE_SIZE,
    textAlign: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  dayCircle: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  todayNumber: { color: '#00A86B', fontWeight: 'bold' },
  todayDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#00A86B',
  },
  futureDayCircle: {
    width: '80%',
    height: '80%',
    borderRadius: 100,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  futureDayText: { fontSize: 12, color: '#CCC' },
  loadingContainer: { padding: 40, alignItems: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalHeaderLeft: { flex: 1 },
  modalDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  modalCompletion: { fontSize: 14, color: '#666' },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prayerList: { paddingHorizontal: 24, paddingTop: 20 },
  prayerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  prayerItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  prayerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  prayerIconContainerCompleted: { backgroundColor: '#E8F5E9' },
  prayerIconContainerMissed: { backgroundColor: '#FFEBEE' },
  prayerInfo: { flex: 1 },
  prayerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  prayerTime: { fontSize: 13, color: '#666' },
  prayerStatusBadge: { marginLeft: 8 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  onTimeBadge: { backgroundColor: '#E8F5E9' },
  onTimeText: { fontSize: 11, fontWeight: '600', color: '#00A86B' },
  lateBadge: { backgroundColor: '#FFF3E0' },
  lateText: { fontSize: 11, fontWeight: '600', color: '#F39C12' },
  missedBadge: { backgroundColor: '#FFEBEE' },
  missedText: { fontSize: 11, fontWeight: '600', color: '#E74C3C' },
  modalSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginTop: 10,
  },
  summaryItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryText: { fontSize: 14, color: '#666', fontWeight: '500' },
});
