// ============================================================================
// FILE: src/screens/tracker/PrayerCalendarScreen.jsx (UPDATED & PRODUCTION READY)
// ============================================================================
// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

// IMPORT THE NEW LAYOUT
import { ScreenLayout } from '../../components/layout/ScreenLayout';

// STORE IMPORTS
import { 
  usePrayerTrackerStore, 
  selectTrackerIsLoading 
} from '../../store/prayerTrackerStore';
import { useAuthStore, selectUser } from '../../store/authStore';
import { useStreakStore, selectUserStreak } from '../../store/streakStore'; 

// COMPONENT IMPORTS
import {
  SkeletonLoader,
  SkeletonLine,
  SkeletonCircle,
} from '../../components/loading/SkeletonLoader';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = (width - 80) / 7;

const CalendarSkeleton = () => {
  const skeletonStyle = { backgroundColor: '#DCEFE3' };

  return (
    <View style={{ padding: 20 }}>
      {/* Month Selector Skeleton */}
      <SkeletonLoader
        width="100%"
        height={72}
        borderRadius={16}
        style={{ ...skeletonStyle, marginBottom: 20 }}
      />

      {/* Calendar Grid Skeleton */}
      <View
        style={{
          borderRadius: 20,
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          padding: 16,
          marginBottom: 24,
        }}
      >
        {/* Weekday Headers */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          {[...Array(7)].map((_, i) => (
            <SkeletonLine
              key={i}
              width={30}
              height={12}
              style={skeletonStyle}
            />
          ))}
        </View>

        {/* Days Grid (5 rows) */}
        {[...Array(5)].map((row, rIndex) => (
          <View
            key={rIndex}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            {[...Array(7)].map((col, cIndex) => (
              <SkeletonCircle
                key={cIndex}
                size={CIRCLE_SIZE - 4}
                style={skeletonStyle}
              />
            ))}
          </View>
        ))}
      </View>

      {/* Stats Skeleton (2 Rows of 2 Cards) */}
      {[1, 2].map((row) => (
        <View
          key={row}
          style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}
        >
          <SkeletonLoader
            width="48%"
            height={100}
            borderRadius={16}
            style={skeletonStyle}
          />
          <SkeletonLoader
            width="48%"
            height={100}
            borderRadius={16}
            style={skeletonStyle}
          />
        </View>
      ))}
    </View>
  );
};

// ============================================================================
// MAIN SCREEN
// ============================================================================
export const PrayerCalendarScreen = ({ navigation }) => {
  const { t } = useTranslation();
  
  // ✅ STORES
  const currentUser = useAuthStore(selectUser);
  const currentUserId = currentUser?.id;
  const isLoading = usePrayerTrackerStore(selectTrackerIsLoading);
  const fetchWeekPrayers = usePrayerTrackerStore(state => state.fetchWeekPrayers);
  
  // Streak Store
  const userStreak = useStreakStore(selectUserStreak);
  const fetchUserStreak = useStreakStore(state => state.fetchUserStreak);
  const clearStreakCache = useStreakStore(state => state.clearCache);

  // ✅ REFS
  const lastUserId = useRef(currentUserId);

  // LOCAL STATE
  const [calendarData, setCalendarData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showDayModal, setShowDayModal] = useState(false);

  // Simplified Stats State (No local streak calc)
  const [totalStats, setTotalStats] = useState({
    totalDays: 0,
    completedDays: 0,
    onTimePrayers: 0,
    totalPrayers: 0,
  });

  // ============================================================================
  // LOGIC: Data Loading
  // ============================================================================

  const loadMonthData = async () => {
    try {
      const firstDay = new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth(),
        1
      );
      const joinDate = currentUser?.created_at ? new Date(currentUser.created_at) : firstDay;
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

      // Fetch loop
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

  const calculateStats = (days) => {
    let totalDays = 0;
    let completedDays = 0;
    let onTimePrayers = 0;
    let totalPrayers = 0;

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
        }
      }
    });

    setTotalStats({
      totalDays,
      completedDays,
      onTimePrayers,
      totalPrayers,
    });
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // 1. Initial Load & Month Change
  useEffect(() => {
    loadMonthData();
    fetchUserStreak();
  }, [selectedMonth]);

  // 2. ✅ ACCOUNT SWITCH DETECTION
  useEffect(() => {
    // Check if user changed from what we last tracked
    if (currentUserId !== lastUserId.current) {
      console.log(`🔄 Account switched in Calendar (User ${lastUserId.current} -> ${currentUserId}). Reloading...`);
      
      // 1. Clear streak cache to prevent stale data
      if (clearStreakCache) clearStreakCache();
      
      // 2. Reset local state
      setInitialLoading(true);
      setCalendarData([]);
      setTotalStats({
        totalDays: 0,
        completedDays: 0,
        onTimePrayers: 0,
        totalPrayers: 0,
      });
      
      // 3. Update Ref to current
      lastUserId.current = currentUserId;
      
      // 4. Reload Data for the new user
      loadMonthData();
      fetchUserStreak();
    }
  }, [currentUserId]); // Only run when ID changes

  // ============================================================================
  // HELPERS
  // ============================================================================

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

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const changeMonth = (direction) => {
    if (isLoading) return;

    const newMonth = new Date(selectedMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);

    const today = new Date();
    if (newMonth > today) return;

    const joinDate = currentUser?.created_at ? new Date(currentUser.created_at) : new Date();
    if (newMonth < new Date(joinDate.getFullYear(), joinDate.getMonth(), 1))
      return;

    setSelectedMonth(newMonth);
  };

  const getMonthYearText = () => {
    const months = [
      t('prayerTracker.months.jan'), t('prayerTracker.months.feb'), t('prayerTracker.months.mar'),
      t('prayerTracker.months.apr'), t('prayerTracker.months.may'), t('prayerTracker.months.jun'),
      t('prayerTracker.months.jul'), t('prayerTracker.months.aug'), t('prayerTracker.months.sep'),
      t('prayerTracker.months.oct'), t('prayerTracker.months.nov'), t('prayerTracker.months.dec'),
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

  // ============================================================================
  // SUB-COMPONENTS
  // ============================================================================

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
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#E0E0E0" strokeWidth={strokeWidth} fill="#FFF" />
          {percentage > 0 && (
            <Circle
              cx={size / 2} cy={size / 2} r={radius} stroke="#5BA895" strokeWidth={strokeWidth}
              fill="none" strokeDasharray={circumference} strokeDashoffset={circumference - progress}
              strokeLinecap="round" rotation="-90" origin={`${size / 2}, ${size / 2}`}
            />
          )}
        </Svg>
        <View style={styles.dayContent}>
          <Text style={[styles.dayNumber, isToday && styles.todayNumber]}>
            {date.getDate()}
          </Text>
          {percentage === 100 && (
            <Ionicons name="checkmark-circle" size={14} color="#5BA895" />
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
      t('prayerTracker.prayers.fajr'), t('prayerTracker.prayers.dhuhr'),
      t('prayerTracker.prayers.asr'), t('prayerTracker.prayers.maghrib'),
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
                          <Ionicons name="checkmark" size={20} color={isOnTime ? '#5BA895' : '#F39C12'} />
                        ) : (
                          <Ionicons name="close" size={20} color="#E74C3C" />
                        )}
                      </View>
                      <View style={styles.prayerInfo}>
                        <Text style={styles.prayerName}>{prayerTranslations[index]}</Text>
                      </View>
                    </View>
                    <View style={styles.prayerStatusBadge}>
                      {isOnTime && (
                        <View style={[styles.statusBadge, styles.onTimeBadge]}>
                          <Ionicons name="time" size={12} color="#5BA895" />
                          <Text style={styles.onTimeText}>{t('calendar.onTime')}</Text>
                        </View>
                      )}
                      {isLate && (
                        <View style={[styles.statusBadge, styles.lateBadge]}>
                          <Ionicons name="time-outline" size={12} color="#F39C12" />
                          <Text style={styles.lateText}>{t('calendar.late')}</Text>
                        </View>
                      )}
                      {isMissed && (
                        <View style={[styles.statusBadge, styles.missedBadge]}>
                          <Ionicons name="close-circle" size={12} color="#E74C3C" />
                          <Text style={styles.missedText}>{t('calendar.missed')}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <View style={styles.modalSummary}>
              <View style={styles.summaryItem}>
                <Ionicons name="checkmark-circle" size={20} color="#5BA895" />
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

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (initialLoading) {
    return (
      <ScreenLayout>
        <CalendarSkeleton />
      </ScreenLayout>
    );
  }

  const weekDayLabels = [
    t('prayerTracker.weekDays.monday'), t('prayerTracker.weekDays.tuesday'),
    t('prayerTracker.weekDays.wednesday'), t('prayerTracker.weekDays.thursday'),
    t('prayerTracker.weekDays.friday'), t('prayerTracker.weekDays.saturday'),
    t('prayerTracker.weekDays.sunday'),
  ];

  return (
    <ScreenLayout noPaddingBottom={true}>
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
        {/* Month Selector */}
        <View style={styles.monthSelectorWrapper}>
          <LinearGradient
            colors={['#E0F5EC', '#E0F5EC']}
            style={styles.monthSelector}
          >
            <TouchableOpacity
              style={[styles.monthButton, isLoading && { opacity: 0.5 }]}
              onPress={() => changeMonth(-1)}
              disabled={isLoading}
            >
              <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
            </TouchableOpacity>

            <Text style={styles.monthText}>{getMonthYearText()}</Text>

            <TouchableOpacity
              style={[styles.monthButton, isLoading && { opacity: 0.5 }]}
              onPress={() => changeMonth(1)}
              disabled={
                isLoading ||
                (selectedMonth.getMonth() === new Date().getMonth() &&
                  selectedMonth.getFullYear() === new Date().getFullYear())
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
          </LinearGradient>
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarContainerWrapper}>
          <LinearGradient
            colors={[]}
            style={styles.calendarContainer}
          >
            <View style={styles.weekDayHeader}>
              {weekDayLabels.map((label, index) => (
                <Text key={index} style={styles.weekDayLabel}>
                  {label.substring(0, 3)}
                </Text>
              ))}
            </View>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#5BA895" />
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
          </LinearGradient>
        </View>

        {/* Quick Stats Section */}
        <View style={styles.quickStatsSection}>
          <View style={styles.statRow}>
            {/* Current Streak */}
            <View style={styles.statCardWrapper}>
              <LinearGradient
                colors={['#E0F5EC', '#E0F5EC']}
                style={styles.statCard}
              >
                <View style={styles.statIconContainer}>
                  <LinearGradient
                    colors={['#FF8C42', '#FF6B35']}
                    style={styles.statIconGradient}
                  >
                    <Ionicons name="flame" size={24} color="#FFFFFF" />
                  </LinearGradient>
                </View>
                <Text style={styles.statValue}>{userStreak.current || 0}</Text>
                <Text style={styles.statLabel}>
                  {t('calendar.currentStreak')}
                </Text>
              </LinearGradient>
            </View>

            {/* Best Streak */}
            <View style={styles.statCardWrapper}>
              <LinearGradient
                colors={['#E0F5EC', '#E0F5EC']}
                style={styles.statCard}
              >
                <View style={styles.statIconContainer}>
                  <LinearGradient
                    colors={['#5BA895', '#4A9B87']}
                    style={styles.statIconGradient}
                  >
                    <Ionicons name="trophy" size={24} color="#FFFFFF" />
                  </LinearGradient>
                </View>
                <Text style={styles.statValue}>{userStreak.best || 0}</Text>
                <Text style={styles.statLabel}>
                  {t('calendar.longestStreak')}
                </Text>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.statRow}>
            {/* Perfect Days */}
            <View style={styles.statCardWrapper}>
              <LinearGradient
                colors={['#E0F5EC', '#E0F5EC']}
                style={styles.statCard}
              >
                <View style={styles.statIconContainer}>
                  <LinearGradient
                    colors={['#5BA895', '#4A9B87']}
                    style={styles.statIconGradient}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#FFFFFF"
                    />
                  </LinearGradient>
                </View>
                <Text style={styles.statValue}>
                  {totalStats.completedDays}/{totalStats.totalDays}
                </Text>
                <Text style={styles.statLabel}>
                  {t('calendar.perfectDays')}
                </Text>
              </LinearGradient>
            </View>

            {/* On Time Rate */}
            <View style={styles.statCardWrapper}>
              <LinearGradient
                colors={['#E0F5EC', '#E0F5EC']}
                style={styles.statCard}
              >
                <View style={styles.statIconContainer}>
                  <LinearGradient
                    colors={['#5BA895', '#4A9B87']}
                    style={styles.statIconGradient}
                  >
                    <Ionicons name="time" size={24} color="#FFFFFF" />
                  </LinearGradient>
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
              </LinearGradient>
            </View>
          </View>
        </View>
      </ScrollView>

      <DayDetailModal />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },

  // Month Selector with Gradient
  monthSelectorWrapper: {
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  monthButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthText: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A' },

  // Calendar with Gradient
  calendarContainerWrapper: {
    borderRadius: 20,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    minHeight: 300, 
  },
  calendarContainer: {
    padding: 16,
    flex: 1,
  },
  weekDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(91, 168, 149, 0.2)',
  },
  weekDayLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A1A',
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
  todayNumber: { color: '#5BA895', fontWeight: 'bold' },
  todayDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#5BA895',
  },
  futureDayCircle: {
    width: '80%',
    height: '80%',
    borderRadius: 100,
    backgroundColor: 'rgba(91, 168, 149, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  futureDayText: { fontSize: 12, color: '#CCC', fontWeight: '600' },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },

  // Quick Stats Section
  quickStatsSection: { marginBottom: 24 },
  statRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCardWrapper: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  statCard: {
    padding: 16,
    alignItems: 'center',
  },
  statIconContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 8,
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  statIconGradient: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#1A1A1A',
    textAlign: 'center',
    fontWeight: '600',
  },

  // Modal Styles
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
  modalCompletion: { fontSize: 14, color: '#666', fontWeight: '600' },
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
    backgroundColor: 'rgba(91, 168, 149, 0.1)',
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
  onTimeText: { fontSize: 11, fontWeight: '600', color: '#5BA895' },
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
  summaryText: { fontSize: 14, color: '#666', fontWeight: '600' },
});