// ============================================================================
// FILE: src/screens/tracker/PrayerTrackerScreen.jsx (PRODUCTION READY)
// ============================================================================
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Dimensions,
  AppState,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

// IMPORT THE NEW LAYOUT
import { ScreenLayout } from '../../components/layout/ScreenLayout';

// IMPORT Store and Selectors
import {
  usePrayerTrackerStore,
  selectDayPrayers,
  selectWeekPrayers,
  selectTrackerIsLoading,
  selectTrackerError,
} from '../../store/prayerTrackerStore';
import { useTasbihStore } from '../../store/tasbihStore';
import { useAuthStore, selectUser } from '../../store/authStore'; // ✅ ADDED: Auth Store

// COMPONENT IMPORTS
import { StatsSection } from '../../components/tracker/StatsSection';
import {
  SkeletonLoader,
  SkeletonLine,
  SkeletonCircle,
} from '../../components/loading/SkeletonLoader';

const { width } = Dimensions.get('window');

// 📐 Constants for scroll calculation
const DAY_ITEM_WIDTH = 50;
const DAY_ITEM_MARGIN = 8;
const TOTAL_ITEM_WIDTH = DAY_ITEM_WIDTH + DAY_ITEM_MARGIN * 2;
const SCREEN_CENTER = width / 2;

export const PRAYER_ICONS = {
  Fajr: { icon: 'weather-sunset-up', iconSet: 'mci' },
  Dhuhr: { icon: 'sunny-outline', iconSet: 'ion' },
  Asr: { icon: 'partly-sunny-outline', iconSet: 'ion' },
  Maghrib: { icon: 'weather-sunset-down', iconSet: 'mci' },
  Isha: { icon: 'moon-outline', iconSet: 'ion' },
};

const TrackerSkeleton = () => {
  const skeletonStyle = { backgroundColor: '#DCEFE3' };

  return (
    <View style={{ padding: 20 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
        <View>
          <SkeletonLine width={150} height={32} style={{ ...skeletonStyle, marginBottom: 8 }} />
          <SkeletonLine width={200} height={16} style={skeletonStyle} />
        </View>
        <SkeletonCircle size={50} style={skeletonStyle} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
        {[...Array(7)].map((_, i) => (
          <View key={i} style={{ alignItems: 'center' }}>
            <SkeletonLine width={20} height={12} style={{ ...skeletonStyle, marginBottom: 8 }} />
            <SkeletonCircle size={40} style={skeletonStyle} />
          </View>
        ))}
      </View>
      <SkeletonLoader width="100%" height={160} borderRadius={20} style={{ ...skeletonStyle, marginBottom: 24 }} />
      {[1, 2, 3, 4, 5].map((i) => (
        <SkeletonLoader key={i} width="100%" height={80} borderRadius={16} style={{ ...skeletonStyle, marginBottom: 12 }} />
      ))}
    </View>
  );
};

export const PrayerTrackerScreen = ({ navigation }) => {
  const { t } = useTranslation();

  // Store Selectors
  const dayPrayers = usePrayerTrackerStore(selectDayPrayers);
  const weekPrayers = usePrayerTrackerStore(selectWeekPrayers);
  const isLoading = usePrayerTrackerStore(selectTrackerIsLoading);
  const error = usePrayerTrackerStore(selectTrackerError);

  // ✅ Auth & Cache Logic
  const currentUser = useAuthStore(selectUser);
  const currentUserId = currentUser?.id;
  
  // Store Actions
  const fetchDayPrayers = usePrayerTrackerStore((state) => state.fetchDayPrayers);
  const fetchWeekPrayers = usePrayerTrackerStore((state) => state.fetchWeekPrayers);
  const trackPrayer = usePrayerTrackerStore((state) => state.trackPrayer);
  const clearAllCache = usePrayerTrackerStore((state) => state.clearAllCache); // ✅ ADDED: Cache clear
  const loadSessions = useTasbihStore((state) => state.loadSessions);

  // Local State
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState([]);
  const [selectedPrayer, setSelectedPrayer] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState(null);
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);

  // Refs for logic
  const lastProcessedDate = useRef(new Date().toDateString());
  const lastUserId = useRef(currentUserId); // ✅ ADDED: Track user ID
  const appState = useRef(AppState.currentState);
  const scrollViewRef = useRef(null);
  const hasScrolledInitially = useRef(false);

  // 1. ✅ UPDATED: Trigger Data Load & Handle Account Switch
  useFocusEffect(
    useCallback(() => {
      const userChanged = currentUserId !== lastUserId.current;

      if (userChanged) {
        console.log(`🔄 Account switched (User ${lastUserId.current} -> ${currentUserId}). Clearing cache...`);
        
        // Clear all cached data
        clearAllCache();
        
        // Reset loading state to show skeleton
        setInitialLoading(true);
        setStatsRefreshKey(prev => prev + 1);
        
        // Update ref
        lastUserId.current = currentUserId;
      }

      // Load fresh data
      // !userChanged passed as isFocusEvent:
      // If user changed (false), we want full loading (not optimistic).
      // If user same (true), we want optimistic loading.
      loadData(selectedDate, !userChanged); 
      loadSessions();
      checkDayChange();

      return () => {};
    }, [selectedDate, currentUserId]) // ✅ Added currentUserId dependency
  );

  // 2. Initial Setup (One-time)
  useEffect(() => {
    generateWeekDates();
    
    // Interval to check for midnight (00:00) while app is open
    const minuteInterval = setInterval(checkDayChange, 60000);

    // AppState Listener (Background -> Foreground)
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        checkDayChange(); // Check date immediately upon waking app
        loadData(selectedDate, true); // Refresh data silently
      }
      appState.current = nextAppState;
    });

    return () => {
      clearInterval(minuteInterval);
      subscription.remove();
    };
  }, []);

  // 3. Scroll Logic
  useEffect(() => {
    if (weekDates.length > 0 && !hasScrolledInitially.current) {
      setTimeout(() => {
        scrollToSelectedDate(false);
        hasScrolledInitially.current = true;
      }, 100);
    }
  }, [weekDates]);

  // ✅ Auto-detect Day Change Logic
  const checkDayChange = useCallback(() => {
    const today = new Date();
    const todayStr = today.toDateString();

    if (todayStr !== lastProcessedDate.current) {
      console.log('📅 Day changed detected! Refreshing data...');
      lastProcessedDate.current = todayStr;
      setSelectedDate(today);
      generateWeekDates();
      setStatsRefreshKey(prev => prev + 1);
      loadData(today); 
    }
  }, []);

  // ✅ Data Loading Logic
  const loadData = async (dateOverride = null, isFocusEvent = false) => {
    const targetDate = dateOverride || selectedDate;
    
    // Only show full skeleton if we have absolutely no data OR if we forced it via isFocusEvent=false
    // If isFocusEvent is true (tab switch same user), we act optimistically
    if (!dayPrayers && !isFocusEvent) setInitialLoading(true);

    try {
      const dateStr = formatDate(targetDate);
      const currentDay = targetDate.getDay();
      const monday = new Date(targetDate);
      const dayDiff = currentDay === 0 ? 6 : currentDay - 1;
      monday.setDate(targetDate.getDate() - dayDiff);
      const weekStartStr = formatDate(monday);

      await Promise.all([
        fetchDayPrayers(dateStr),
        fetchWeekPrayers(weekStartStr),
      ]);
      
      // Force stats to re-render to catch up with new data
      setStatsRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  const scrollToSelectedDate = (animated = true) => {
    if (weekDates.length === 0 || !scrollViewRef.current) return;
    const selectedIndex = weekDates.findIndex((d) => d.toDateString() === selectedDate.toDateString());
    if (selectedIndex === -1) return;
    const itemCenterPosition = selectedIndex * TOTAL_ITEM_WIDTH + TOTAL_ITEM_WIDTH / 2;
    const targetScrollX = itemCenterPosition - SCREEN_CENTER;
    const maxScrollX = weekDates.length * TOTAL_ITEM_WIDTH - width;
    const finalScrollX = Math.max(0, Math.min(targetScrollX, maxScrollX));
    scrollViewRef.current.scrollTo({ x: finalScrollX, animated: animated });
  };

  // ✅ UPDATED: onRefresh clears cache now
  const onRefresh = async () => {
    setRefreshing(true);
    clearAllCache(); // Clear cache on pull-to-refresh
    await loadData(selectedDate);
    setStatsRefreshKey(prev => prev + 1);
    setRefreshing(false);
  };

  const generateWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    const dayDiff = currentDay === 0 ? 6 : currentDay - 1;
    monday.setDate(today.getDate() - dayDiff);

    const week = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      week.push(date);
    }
    setWeekDates(week);
  };

  // Helper Functions
  const formatDate = (date) => date.toISOString().split('T')[0];
  const formatDisplayDate = (date) => {
    const months = [
      t('prayerTracker.months.jan'), t('prayerTracker.months.feb'), t('prayerTracker.months.mar'),
      t('prayerTracker.months.apr'), t('prayerTracker.months.may'), t('prayerTracker.months.jun'),
      t('prayerTracker.months.jul'), t('prayerTracker.months.aug'), t('prayerTracker.months.sep'),
      t('prayerTracker.months.oct'), t('prayerTracker.months.nov'), t('prayerTracker.months.dec'),
    ];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };
  const isToday = (date) => date.toDateString() === new Date().toDateString();
  const isFutureDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate > today;
  };
  const getPrayerName = (prayerName) => t(`prayerTracker.prayers.${prayerName.toLowerCase()}`);
  const getCompletionPercentage = () => dayPrayers?.completion_percentage || 0;

  // Interaction Handlers
  const handlePrayerPress = (prayer) => {
    if (isFutureDate(selectedDate)) {
      Alert.alert(t('common.notice'), t('prayerTracker.futureDateLocked'));
      return;
    }
    setSelectedPrayer(prayer);
    setModalVisible(true);
  };

  const handlePrayerAction = async (actionType) => {
    if (!selectedPrayer) return;
    setProcessingAction(actionType);
    const completed = actionType !== 'missed';
    const onTime = actionType === 'ontime';
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
      
      // Delay fetch slightly to allow DB update to propagate
      setTimeout(() => {
        loadData(selectedDate, true); // Silent refresh
      }, 200);
    } catch (err) {
      Alert.alert(t('tasbih.alerts.error'), 'Failed to track prayer. Please try again.');
    } finally {
      setProcessingAction(null);
    }
  };

  // --- Sub-components ---
  const CircularProgress = ({ percentage, size = 120, strokeWidth = 12 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = (percentage / 100) * circumference;
    return (
      <View style={styles.circularProgress}>
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#E0E0E0" strokeWidth={strokeWidth} fill="none" />
          <Circle
            cx={size / 2} cy={size / 2} r={radius}
            stroke="#5BA895" strokeWidth={strokeWidth}
            fill="none" strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round" rotation="-90" origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <View style={styles.circularProgressText}>
          <Text style={styles.percentageText}>{Math.round(percentage)}%</Text>
          <Text style={styles.percentageLabel}>{t('prayerTracker.complete')}</Text>
        </View>
      </View>
    );
  };

  const WeekDayCircle = ({ date, percentage }) => {
    const size = DAY_ITEM_WIDTH;
    const strokeWidth = 4;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = (percentage / 100) * circumference;
    const today = isToday(date);
    const isSelected = date.toDateString() === selectedDate.toDateString();
    const isFuture = isFutureDate(date);
    
    if(!date) return null;

    const weekDayLabels = [
      t('prayerTracker.weekDays.sunday'), t('prayerTracker.weekDays.monday'),
      t('prayerTracker.weekDays.tuesday'), t('prayerTracker.weekDays.wednesday'),
      t('prayerTracker.weekDays.thursday'), t('prayerTracker.weekDays.friday'),
      t('prayerTracker.weekDays.saturday')
    ];
    const dayLabel = weekDayLabels[date.getDay()];

    return (
      <TouchableOpacity
        style={[styles.weekDayContainer, isSelected && styles.weekDayContainerSelected]}
        onPress={() => {
          if (isFuture) {
            Alert.alert(t('common.notice'), t('prayerTracker.futureDateLocked'));
            return;
          }
          setSelectedDate(date);
          loadData(date, true); // Optimistic load
        }}
        activeOpacity={0.7}
      >
        <Text style={[styles.weekDayName, today && styles.todayText, isSelected && styles.selectedDayNameText]}>
          {dayLabel}
        </Text>
        <View style={[styles.weekDayCircle, isFuture && styles.weekDayCircleFuture, isSelected && styles.weekDayCircleSelected]}>
          <Svg width={size} height={size}>
            <Circle
              cx={size / 2} cy={size / 2} r={radius}
              stroke={isFuture ? '#F5F5F5' : '#EAEAEA'} strokeWidth={strokeWidth}
              fill={isSelected ? '#5BA895' : '#FFF'}
            />
            {percentage > 0 && !isFuture && (
              <Circle
                cx={size / 2} cy={size / 2} r={radius}
                stroke={isSelected ? '#FFF' : '#5BA895'} strokeWidth={strokeWidth}
                fill="none" strokeDasharray={circumference}
                strokeDashoffset={circumference - progress}
                strokeLinecap="round" rotation="-90" origin={`${size / 2}, ${size / 2}`}
                opacity={isSelected ? 0.5 : 1}
              />
            )}
          </Svg>
          <Text style={[styles.weekDayDate, isSelected && styles.todayDateText, isFuture && styles.futureDateText]}>
            {date.getDate()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // --- Main Render ---
  const shouldShowSkeleton = initialLoading || (isLoading && !dayPrayers);

  if (shouldShowSkeleton) {
    return (
      <ScreenLayout noPaddingBottom={true}>
        <TrackerSkeleton />
      </ScreenLayout>
    );
  }

  const isSelectedDateFuture = isFutureDate(selectedDate);

  if (error && !dayPrayers) {
    return (
      <ScreenLayout>
        <View style={styles.errorContainer}>
          <View style={styles.errorContent}>
            <Ionicons name="alert-circle-outline" size={48} color="#DC3545" />
            <Text style={styles.errorText}>{t('common.error')}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => loadData(selectedDate)}>
              <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout noPaddingBottom={true}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5BA895" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{t('prayerTracker.title')}</Text>
            <Text style={styles.subtitle}>{t('prayerTracker.subtitle')}</Text>
          </View>
          <TouchableOpacity
            style={styles.calendarButtonWrapper}
            onPress={() => navigation.navigate('PrayerCalendar')}
            activeOpacity={0.7}
          >
            <LinearGradient colors={['#5BA895', '#5BA895']} style={styles.calendarButton}>
              <Ionicons name="calendar-outline" size={28} color="#E0F5EC" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Week Calendar */}
        <View style={styles.weekCalendar}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.weekScrollContent}
            decelerationRate="fast"
            snapToInterval={TOTAL_ITEM_WIDTH}
            snapToAlignment="center"
          >
            {weekDates.map((date, index) => {
              const dateStr = formatDate(date);
              const dayData = weekPrayers?.days?.find((d) => d.date === dateStr);
              const percentage = dayData?.completion_percentage || 0;
              return <WeekDayCircle key={index} date={date} percentage={percentage} />;
            })}
          </ScrollView>
        </View>

        {/* Selected Date & Progress */}
        <View style={styles.todaySection}>
          <LinearGradient colors={['#E0F5EC', '#E0F5EC']} style={styles.todaySectionGradient}>
            <View style={styles.todayHeader}>
              <View>
                <Text style={styles.todayLabel}>
                  {isToday(selectedDate) ? t('prayerTracker.today') : t('prayerTracker.selectedDate')}
                </Text>
                <Text style={styles.todayDate}>{formatDisplayDate(selectedDate)}</Text>
              </View>
              <CircularProgress percentage={getCompletionPercentage()} />
            </View>
          </LinearGradient>
        </View>

        {/* Prayer List */}
        <View style={[styles.prayerList, isSelectedDateFuture && { opacity: 0.5 }]}>
          <Text style={styles.sectionTitle}>
            {isToday(selectedDate) ? t('prayerTracker.todaysPrayers') : t('prayerTracker.prayers1')}
          </Text>

          {dayPrayers?.prayers?.map((prayer, index) => {
            const prayerIconData = PRAYER_ICONS[prayer.prayer_name];
            return (
              <TouchableOpacity
                key={index}
                style={styles.prayerCardWrapper}
                onPress={() => !isSelectedDateFuture && handlePrayerPress(prayer)}
                activeOpacity={isSelectedDateFuture ? 1 : 0.7}
              >
                <LinearGradient
                  colors={
                    prayer.completed
                      ? ['#E0F5EC', '#E0F5EC']
                      : prayer.id && !prayer.completed
                      ? ['rgba(255, 235, 238, 0.95)', 'rgba(255, 235, 238, 0.95)']
                      : ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.95)']
                  }
                  style={styles.prayerCard}
                >
                  <View style={styles.prayerCardLeft}>
                    <View
                      style={[
                        styles.prayerIcon,
                        prayer.completed && styles.prayerIconCompleted,
                        prayer.id && !prayer.completed && styles.prayerIconMissed,
                        isSelectedDateFuture && { backgroundColor: '#F0F0F0' },
                      ]}
                    >
                      {prayerIconData?.iconSet === 'mci' ? (
                        <MaterialCommunityIcons
                          name={prayerIconData.icon}
                          size={24}
                          color={
                            isSelectedDateFuture
                              ? '#CCC'
                              : prayer.completed || (prayer.id && !prayer.completed)
                              ? '#FFF'
                              : '#5BA895'
                          }
                        />
                      ) : (
                        <Ionicons
                          name={prayerIconData?.icon || 'time-outline'}
                          size={24}
                          color={
                            isSelectedDateFuture
                              ? '#CCC'
                              : prayer.completed || (prayer.id && !prayer.completed)
                              ? '#FFF'
                              : '#5BA895'
                          }
                        />
                      )}
                    </View>
                    <View>
                      <Text style={[styles.prayerName, isSelectedDateFuture && { color: '#999' }]}>
                        {getPrayerName(prayer.prayer_name)}
                      </Text>
                      {!isSelectedDateFuture && (
                        <>
                          {prayer.completed && prayer.on_time && (
                            <Text style={styles.onTimeLabel}>{t('prayerTracker.status.onTime')}</Text>
                          )}
                          {prayer.completed && !prayer.on_time && (
                            <Text style={styles.lateLabel}>{t('prayerTracker.status.late')}</Text>
                          )}
                          {prayer.id && !prayer.completed && (
                            <Text style={styles.missedLabel}>{t('prayerTracker.status.missed')}</Text>
                          )}
                        </>
                      )}
                    </View>
                  </View>
                  <View style={styles.prayerCardRight}>
                    {!isSelectedDateFuture && (
                      <>
                        {prayer.completed ? (
                          <View style={styles.completedBadge}>
                            <Ionicons name="checkmark-circle" size={28} color="#5BA895" />
                          </View>
                        ) : prayer.id && !prayer.completed ? (
                          <View style={styles.missedBadge}>
                            <Ionicons name="close-circle" size={28} color="#DC3545" />
                          </View>
                        ) : (
                          <Ionicons name="chevron-forward" size={24} color="#1A1A1A" />
                        )}
                      </>
                    )}
                    {isSelectedDateFuture && <Ionicons name="lock-closed" size={20} color="#CCC" />}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tasbih Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('prayerTracker.afterPrayerRemembrance')}</Text>
          </View>
          <TouchableOpacity
            style={styles.tasbihCardWrapper}
            onPress={() => navigation.navigate('Tasbih')}
            activeOpacity={0.7}
          >
            <LinearGradient colors={['#E0F5EC', '#E0F5EC']} style={styles.tasbihCard}>
              <View style={styles.tasbihIconContainer}>
                <LinearGradient colors={['#5BA895', '#4A9B87']} style={styles.tasbihIconGradient}>
                  <Ionicons name="infinite" size={48} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <View style={styles.tasbihContent}>
                <Text style={styles.tasbihTitle}>{t('prayerTracker.digitalTasbih')}</Text>
                <Text style={styles.tasbihSubtitle}>{t('prayerTracker.countDhikr')}</Text>
                <View style={styles.tasbihBadges}>
                  <View style={styles.tasbihBadge}>
                    <Ionicons name="bookmark-outline" size={14} color="#1A1A1A" />
                    <Text style={styles.tasbihBadgeText}>{t('prayerTracker.saveProgress')}</Text>
                  </View>
                  <View style={styles.tasbihBadge}>
                    <Ionicons name="trending-up-outline" size={14} color="#1A1A1A" />
                    <Text style={styles.tasbihBadgeText}>{t('prayerTracker.trackHistory')}</Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#5BA895" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Stats Section with Refresh Key */}
        <StatsSection key={statsRefreshKey} />
      </ScrollView>

      {/* Action Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => !processingAction && setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedPrayer && getPrayerName(selectedPrayer.prayer_name)}</Text>
              <TouchableOpacity onPress={() => !processingAction && setModalVisible(false)}>
                <Ionicons name="close" size={28} color={processingAction ? '#CCC' : '#666'} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>{t('prayerTracker.modal.markAs')}</Text>

            <TouchableOpacity
              style={styles.modalButtonWrapper}
              onPress={() => handlePrayerAction('ontime')}
              disabled={processingAction !== null}
            >
              <LinearGradient colors={['#5BA895', '#4A9B87']} style={styles.modalButton}>
                {processingAction === 'ontime' ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="time" size={24} color="#FFF" />
                    <Text style={styles.modalButtonText}>{t('prayerTracker.modal.doneOnTime')}</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButtonWrapper}
              onPress={() => handlePrayerAction('done')}
              disabled={processingAction !== null}
            >
              <LinearGradient colors={['#3498DB', '#2E86C1']} style={styles.modalButton}>
                {processingAction === 'done' ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={24} color="#FFF" />
                    <Text style={styles.modalButtonText}>{t('prayerTracker.modal.doneLate')}</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButtonWrapper}
              onPress={() => handlePrayerAction('missed')}
              disabled={processingAction !== null}
            >
              <LinearGradient colors={['#DC3545', '#C82333']} style={styles.modalButton}>
                {processingAction === 'missed' ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="close-circle" size={24} color="#FFF" />
                    <Text style={styles.modalButtonText}>{t('prayerTracker.modal.missed')}</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  headerLeft: { flex: 1 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#1A1A1A' },
  calendarButtonWrapper: { borderRadius: 25, overflow: 'hidden', shadowColor: '#2D6856', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  calendarButton: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  weekCalendar: { marginBottom: 24 },
  weekScrollContent: { paddingVertical: 8, paddingHorizontal: 12 },
  weekDayContainer: { alignItems: 'center', marginHorizontal: DAY_ITEM_MARGIN, width: DAY_ITEM_WIDTH },
  weekDayContainerSelected: { transform: [{ translateY: -4 }] },
  weekDayName: { fontSize: 12, color: '#666', marginBottom: 8, fontWeight: '600' },
  selectedDayNameText: { color: '#5BA895', fontWeight: 'bold' },
  todayText: { color: '#5BA895' },
  weekDayCircle: { position: 'relative', alignItems: 'center', justifyContent: 'center', width: DAY_ITEM_WIDTH, height: DAY_ITEM_WIDTH, borderRadius: DAY_ITEM_WIDTH / 2 },
  weekDayCircleSelected: { shadowColor: '#5BA895', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 5 },
  weekDayCircleFuture: { opacity: 0.6 },
  weekDayDate: { position: 'absolute', fontSize: 16, fontWeight: 'bold', color: '#1A1A1A' },
  todayDateText: { color: '#FFF' },
  futureDateText: { color: '#CCC' },
  todaySection: { borderRadius: 20, marginBottom: 24, overflow: 'hidden', shadowColor: '#2D6856', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 },
  todaySectionGradient: { padding: 24 },
  todayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  todayLabel: { fontSize: 14, color: '#1A1A1A', marginBottom: 4, fontWeight: '600' },
  todayDate: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A' },
  circularProgress: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  circularProgressText: { position: 'absolute', alignItems: 'center' },
  percentageText: { fontSize: 28, fontWeight: 'bold', color: '#5BA895' },
  percentageLabel: { fontSize: 12, color: '#1A1A1A', fontWeight: '600' },
  prayerList: { marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 12 },
  prayerCardWrapper: { borderRadius: 16, marginBottom: 12, overflow: 'hidden', shadowColor: '#2D6856', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  prayerCard: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 0.6, borderColor: 'rgba(91,168,149,0.6)' },
  prayerCardLeft: { flexDirection: 'row', alignItems: 'center' },
  prayerIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(91, 168, 149, 0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  prayerIconCompleted: { backgroundColor: '#5BA895' },
  prayerIconMissed: { backgroundColor: '#DC3545' },
  prayerName: { fontSize: 18, fontWeight: '600', color: '#1A1A1A', marginBottom: 2 },
  onTimeLabel: { fontSize: 12, color: '#5BA895', fontWeight: '600' },
  lateLabel: { fontSize: 12, color: '#F39C12', fontWeight: '600' },
  missedLabel: { fontSize: 12, color: '#DC3545', fontWeight: '600' },
  prayerCardRight: { flexDirection: 'row', alignItems: 'center' },
  completedBadge: { marginRight: 8 },
  missedBadge: { marginRight: 8 },
  tasbihCardWrapper: { borderRadius: 16, overflow: 'hidden', shadowColor: '#2D6856', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 5 },
  tasbihCard: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  tasbihIconContainer: { borderRadius: 35, overflow: 'hidden', marginRight: 16, shadowColor: '#2D6856', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 },
  tasbihIconGradient: { width: 70, height: 70, alignItems: 'center', justifyContent: 'center' },
  tasbihContent: { flex: 1 },
  tasbihTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 4 },
  tasbihSubtitle: { fontSize: 14, color: '#1A1A1A', marginBottom: 8, fontWeight: '600' },
  tasbihBadges: { flexDirection: 'row', gap: 12 },
  tasbihBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tasbihBadgeText: { fontSize: 12, color: '#1A1A1A', fontWeight: '600' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorContent: { alignItems: 'center', padding: 24, backgroundColor: '#FFF', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  errorText: { fontSize: 16, color: '#1A1A1A', textAlign: 'center', marginTop: 16, marginBottom: 24, fontWeight: '600' },
  retryButton: { backgroundColor: '#5BA895', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A' },
  modalSubtitle: { fontSize: 14, color: '#666', marginBottom: 24 },
  modalButtonWrapper: { borderRadius: 12, overflow: 'hidden', marginBottom: 12, shadowColor: '#2D6856', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 },
  modalButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, height: 56 },
  modalButtonText: { fontSize: 16, fontWeight: '600', color: '#FFF', marginLeft: 8 },
});