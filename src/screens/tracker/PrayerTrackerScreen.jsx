// @ts-nocheck
// ============================================================================
// FILE: src/screens/tracker/PrayerTrackerScreen.jsx (FIXED DATA LOADING & FUTURE DATE BLOCK)
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
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

// IMPORT THE NEW LAYOUT
import { ScreenLayout } from '../../components/layout/ScreenLayout';

// STORE IMPORTS
import { usePrayerTrackerStore } from '../../store/prayerTrackerStore';
import { useTasbihStore } from '../../store/tasbihStore';

// COMPONENT IMPORTS
import { StatsSection } from '../../components/tracker/StatsSection';
import {
  SkeletonLoader,
  SkeletonLine,
  SkeletonCircle,
} from '../../components/loading/SkeletonLoader';

const { width } = Dimensions.get('window');

const PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
export const PRAYER_ICONS = {
  Fajr: 'cloudy-night-outline',
  Dhuhr: 'sunny',
  Asr: 'partly-sunny-outline',
  Maghrib: 'cloudy-night',
  Isha: 'moon',
};

// ... [TrackerSkeleton remains the same] ...
const TrackerSkeleton = () => { /* ... skeleton code ... */ return <View /> };

export const PrayerTrackerScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState([]);
  const [selectedPrayer, setSelectedPrayer] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState(null); 

  const { loadSessions } = useTasbihStore();
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
    loadSessions();
    loadData(); 
  }, []);

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    if (!dayPrayers) setInitialLoading(true);
    try {
      const dateStr = formatDate(selectedDate);
      const currentDay = selectedDate.getDay();
      const monday = new Date(selectedDate);
      const dayDiff = currentDay === 0 ? 6 : currentDay - 1; 
      monday.setDate(selectedDate.getDate() - dayDiff);
      const weekStartStr = formatDate(monday);

      await Promise.all([
        fetchDayPrayers(dateStr),
        fetchWeekPrayers(weekStartStr),
      ]);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
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

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const formatDisplayDate = (date) => {
    const months = [
      t('prayerTracker.months.jan'), t('prayerTracker.months.feb'), t('prayerTracker.months.mar'),
      t('prayerTracker.months.apr'), t('prayerTracker.months.may'), t('prayerTracker.months.jun'),
      t('prayerTracker.months.jul'), t('prayerTracker.months.aug'), t('prayerTracker.months.sep'),
      t('prayerTracker.months.oct'), t('prayerTracker.months.nov'), t('prayerTracker.months.dec'),
    ];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Helper to check if a date is in the future
  const isFutureDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    return checkDate > today;
  };

  const handlePrayerPress = (prayer) => {
    // BLOCK FUTURE DATES: Don't allow opening modal if selected date is in future
    if (isFutureDate(selectedDate)) {
        Alert.alert(t('common.notice'), t('prayerTracker.futureDateLocked'));
        return;
    }
    setSelectedPrayer(prayer);
    setModalVisible(true);
  };

  // ... [handlePrayerAction, getCompletionPercentage, CircularProgress remain same] ...
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
      setTimeout(() => loadData(), 200);
    } catch (err) {
      Alert.alert(t('tasbih.alerts.error'), 'Failed to track prayer. Please try again.');
    } finally {
      setProcessingAction(null);
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
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#E0E0E0" strokeWidth={strokeWidth} fill="none" />
          <Circle
            cx={size / 2} cy={size / 2} r={radius} stroke="#5BA895" strokeWidth={strokeWidth} fill="none"
            strokeDasharray={circumference} strokeDashoffset={circumference - progress}
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
    const size = 50;
    const strokeWidth = 4;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = (percentage / 100) * circumference;
    const today = isToday(date);
    const isSelected = date.toDateString() === selectedDate.toDateString();
    
    // Check if this specific day is in the future
    const isFuture = isFutureDate(date);

    const weekDayLabels = [
      t('prayerTracker.weekDays.monday'), t('prayerTracker.weekDays.tuesday'),
      t('prayerTracker.weekDays.wednesday'), t('prayerTracker.weekDays.thursday'),
      t('prayerTracker.weekDays.friday'), t('prayerTracker.weekDays.saturday'),
      t('prayerTracker.weekDays.sunday'),
    ];

    return (
      <TouchableOpacity 
        style={[
            styles.weekDayContainer,
            // Add visual cue for future dates (optional: reduce opacity)
            isFuture && { opacity: 0.5 } 
        ]} 
        onPress={() => {
            // Allow selecting future dates to SEE them (e.g. empty state), 
            // but the actions are blocked in handlePrayerPress.
            // OR prevent selection entirely:
            if (isFuture) {
                 Alert.alert(t('common.notice'), t('prayerTracker.futureDateLocked'));
                 return;
            }
            setSelectedDate(date);
        }} 
        activeOpacity={0.7}
      >
        <Text style={[styles.weekDayName, today && styles.todayText]}>
          {weekDayLabels[date.getDay() === 0 ? 6 : date.getDay() - 1]}
        </Text>
        <View style={styles.weekDayCircle}>
          <Svg width={size} height={size}>
            <Circle 
                cx={size / 2} cy={size / 2} r={radius} 
                stroke={isFuture ? "#F0F0F0" : "#E0E0E0"} 
                strokeWidth={strokeWidth} 
                fill={isSelected ? '#5BA895' : '#FFF'} 
            />
            {percentage > 0 && !isFuture && (
              <Circle
                cx={size / 2} cy={size / 2} r={radius} stroke="#5BA895" strokeWidth={strokeWidth} fill="none"
                strokeDasharray={circumference} strokeDashoffset={circumference - progress}
                strokeLinecap="round" rotation="-90" origin={`${size / 2}, ${size / 2}`}
              />
            )}
          </Svg>
          <Text style={[
              styles.weekDayDate, 
              isSelected && styles.todayDateText,
              isFuture && styles.futureDateText // Optional style for future text
          ]}>
              {date.getDate()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const getPrayerName = (prayerName) => {
    return t(`prayerTracker.prayers.${prayerName.toLowerCase()}`);
  };

  const shouldShowSkeleton = initialLoading || (isLoading && !dayPrayers);

  if (shouldShowSkeleton) {
    return (
      <ScreenLayout noPaddingBottom={true}>
        <TrackerSkeleton />
      </ScreenLayout>
    );
  }

  // Check if currently selected date is in future for disabling the list
  const isSelectedDateFuture = isFutureDate(selectedDate);

  if (error && !dayPrayers) {
    return (
      <ScreenLayout>
        <View style={styles.errorContainer}>
          {/* Error View Code... */}
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5BA895" />
        }
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
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.95)']}
              style={styles.calendarButton}
            >
              <Ionicons name="calendar-outline" size={28} color="#5BA895" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Week Calendar */}
        <View style={styles.weekCalendar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekScrollContent}>
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
          <LinearGradient
            colors={['rgba(240, 255, 244, 0.7)', 'rgba(240, 255, 244, 0.6)']}
            style={styles.todaySectionGradient}
          >
            <View style={styles.todayHeader}>
              <View>
                <Text style={styles.todayLabel}>
                  {isToday(selectedDate)
                    ? t('prayerTracker.today')
                    : t('prayerTracker.selectedDate')}
                </Text>
                <Text style={styles.todayDate}>
                  {formatDisplayDate(selectedDate)}
                </Text>
              </View>
              <CircularProgress percentage={getCompletionPercentage()} />
            </View>
          </LinearGradient>
        </View>

        {/* Prayer List */}
        <View style={[styles.prayerList, isSelectedDateFuture && { opacity: 0.5 }]}>
          <Text style={styles.sectionTitle}>
            {isToday(selectedDate)
              ? t('prayerTracker.todaysPrayers')
              : t('prayerTracker.prayers1')}
          </Text>

          {dayPrayers?.prayers?.map((prayer, index) => (
            <TouchableOpacity
              key={index}
              style={styles.prayerCardWrapper}
              // Disable press if date is in future
              onPress={() => !isSelectedDateFuture && handlePrayerPress(prayer)}
              activeOpacity={isSelectedDateFuture ? 1 : 0.7}
            >
              <LinearGradient
                colors={
                  prayer.completed
                    ? ['rgba(240, 255, 244, 0.95)', 'rgba(240, 255, 244, 0.95)']
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
                      isSelectedDateFuture && { backgroundColor: '#F0F0F0' } // Grey out icon if future
                    ]}
                  >
                    <Ionicons
                      name={PRAYER_ICONS[prayer.prayer_name]}
                      size={24}
                      color={
                        isSelectedDateFuture ? '#CCC' :
                        (prayer.completed || (prayer.id && !prayer.completed) ? '#FFF' : '#5BA895')
                      }
                    />
                  </View>
                  <View>
                    <Text style={[styles.prayerName, isSelectedDateFuture && { color: '#999' }]}>
                        {getPrayerName(prayer.prayer_name)}
                    </Text>
                    {/* Status Labels */}
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
                  {isSelectedDateFuture && (
                      <Ionicons name="lock-closed" size={20} color="#CCC" />
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Digital Tasbih Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="leaf-outline" size={20} color="#5BA895" />
            <Text style={styles.sectionTitle}>{t('prayerTracker.afterPrayerRemembrance')}</Text>
          </View>
          <TouchableOpacity
            style={styles.tasbihCardWrapper}
            onPress={() => navigation.navigate('Tasbih')}
            activeOpacity={0.7}
          >
             {/* ... Tasbih Card Content ... */}
             <LinearGradient
              colors={['rgba(240, 255, 244, 0.7)', 'rgba(240, 255, 244, 0.6)']}
              style={styles.tasbihCard}
            >
              <View style={styles.tasbihIconContainer}>
                <LinearGradient
                  colors={['#5BA895', '#4A9B87']}
                  style={styles.tasbihIconGradient}
                >
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

        <StatsSection />
      </ScrollView>

      {/* Modal ... */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => !processingAction && setModalVisible(false)}
      >
         {/* ... Modal Content ... */}
         <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedPrayer && getPrayerName(selectedPrayer.prayer_name)}
              </Text>
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
  // Removed container since ScreenLayout handles bg
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  calendarButtonWrapper: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  calendarButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
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
    color: '#5BA895',
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
  futureDateText: {
    color: '#999', // Grey text for future dates
  },
  todaySection: {
    borderRadius: 20,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  todaySectionGradient: {
    padding: 24,
  },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  todayLabel: {
    fontSize: 14,
    color: '#1A1A1A',
    marginBottom: 4,
    fontWeight: '600',
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
    color: '#5BA895',
  },
  percentageLabel: {
    fontSize: 12,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  prayerList: {
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  prayerCardWrapper: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  prayerCard: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prayerCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prayerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(91, 168, 149, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  prayerIconCompleted: {
    backgroundColor: '#5BA895',
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
    color: '#5BA895',
    fontWeight: '600',
  },
  lateLabel: {
    fontSize: 12,
    color: '#F39C12',
    fontWeight: '600',
  },
  missedLabel: {
    fontSize: 12,
    color: '#DC3545',
    fontWeight: '600',
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
  tasbihCardWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  tasbihCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  tasbihIconContainer: {
    borderRadius: 35,
    overflow: 'hidden',
    marginRight: 16,
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  tasbihIconGradient: {
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tasbihContent: {
    flex: 1,
  },
  tasbihTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  tasbihSubtitle: {
    fontSize: 14,
    color: '#1A1A1A',
    marginBottom: 8,
    fontWeight: '600',
  },
  tasbihBadges: {
    flexDirection: 'row',
    gap: 12,
  },
  tasbihBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tasbihBadgeText: {
    fontSize: 12,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  errorGradient: {
    width: '100%',
    padding: 24,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#1A1A1A',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    fontWeight: '600',
  },
  retryButton: {
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  retryButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 12,
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
  modalButtonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    height: 56,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 8,
  },
});