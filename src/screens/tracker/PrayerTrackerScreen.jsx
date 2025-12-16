// ============================================================================
// FILE: src/screens/tracker/PrayerTrackerScreen.jsx (UPDATED)
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
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { usePrayerTrackerStore } from '../../store/prayerTrackerStore';
import { useTasbihStore } from '../../store/tasbihStore';
import { StatsSection } from '../../components/tracker/StatsSection';
import { IslamicLoadingScreen } from '../../components/loading/IslamicLoadingScreen';

const PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
export const PRAYER_ICONS = {
  Fajr: 'cloudy-night-outline',
  Dhuhr: 'sunny',
  Asr: 'partly-sunny-outline',
  Maghrib: 'cloudy-night',
  Isha: 'moon',
};

export const PrayerTrackerScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState([]);
  const [selectedPrayer, setSelectedPrayer] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
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
    monday.setDate(today.getDate() - ((currentDay + 6) % 7));

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
      t('prayerTracker.months.dec')
    ];
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

    const completed = action !== 'missed';
    const onTime = action === 'ontime';
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
      await loadData();
      
    } catch (err) {
      Alert.alert(t('tasbih.alerts.error'), 'Failed to track prayer. Please try again.');
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
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E0E0E0"
            strokeWidth={strokeWidth}
            fill="none"
          />
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

    const weekDayLabels = [
      t('prayerTracker.weekDays.monday'),
      t('prayerTracker.weekDays.tuesday'),
      t('prayerTracker.weekDays.wednesday'),
      t('prayerTracker.weekDays.thursday'),
      t('prayerTracker.weekDays.friday'),
      t('prayerTracker.weekDays.saturday'),
      t('prayerTracker.weekDays.sunday')
    ];

    return (
      <TouchableOpacity
        style={styles.weekDayContainer}
        onPress={() => setSelectedDate(date)}
        activeOpacity={0.7}
      >
        <Text style={[styles.weekDayName, today && styles.todayText]}>
          {weekDayLabels[date.getDay() === 0 ? 6 : date.getDay() - 1]}
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

  const getPrayerName = (prayerName) => {
    return t(`prayerTracker.prayers.${prayerName.toLowerCase()}`);
  };

  if (initialLoading) {
    return (
      <IslamicLoadingScreen 
        message={t('prayerTracker.loading')} 
        submessage={t('prayerTracker.loadingSubtitle')}
      />
    );
  }

  if (error && !dayPrayers) {
    return (
      <ImageBackground
        source={require('../../assets/images/illustrations/background.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={64} color="#DC3545" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadData}>
              <Text style={styles.retryButtonText}>{t('prayerTracker.retry')}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require('../../assets/images/illustrations/background.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
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
            <View style={styles.headerLeft}>
              <Text style={styles.title}>{t('prayerTracker.title')}</Text>
              <Text style={styles.subtitle}>{t('prayerTracker.subtitle')}</Text>
            </View>
            <TouchableOpacity
              style={styles.calendarButton}
              onPress={() => navigation.navigate('PrayerCalendar')}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={28} color="#00A86B" />
            </TouchableOpacity>
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
                  {isToday(selectedDate) ? t('prayerTracker.today') : t('prayerTracker.selectedDate')}
                </Text>
                <Text style={styles.todayDate}>{formatDisplayDate(selectedDate)}</Text>
              </View>
              <CircularProgress percentage={getCompletionPercentage()} />
            </View>
          </View>

          {/* Prayer List */}
          <View style={styles.prayerList}>
            <Text style={styles.sectionTitle}>
              {isToday(selectedDate) ? t('prayerTracker.todaysPrayers') : t('prayerTracker.prayers1')}
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
                      <Text style={styles.prayerName}>{getPrayerName(prayer.prayer_name)}</Text>
                      {prayer.completed && prayer.on_time && (
                        <Text style={styles.onTimeLabel}>{t('prayerTracker.status.onTime')}</Text>
                      )}
                      {prayer.completed && !prayer.on_time && (
                        <Text style={styles.lateLabel}>{t('prayerTracker.status.late')}</Text>
                      )}
                      {prayer.id && !prayer.completed && (
                        <Text style={styles.missedLabel}>{t('prayerTracker.status.missed')}</Text>
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

          {/* Digital Tasbih Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="leaf-outline" size={20} color="#00A86B" />
              <Text style={styles.sectionTitle}>{t('prayerTracker.afterPrayerRemembrance')}</Text>
            </View>

            <TouchableOpacity
              style={styles.tasbihCard}
              onPress={() => navigation.navigate('Tasbih')}
              activeOpacity={0.7}
            >
              <View style={styles.tasbihIconContainer}>
                <Ionicons name="infinite" size={48} color="#00A86B" />
              </View>
              
              <View style={styles.tasbihContent}>
                <Text style={styles.tasbihTitle}>{t('prayerTracker.digitalTasbih')}</Text>
                <Text style={styles.tasbihSubtitle}>
                  {t('prayerTracker.countDhikr')}
                </Text>
                <View style={styles.tasbihBadges}>
                  <View style={styles.tasbihBadge}>
                    <Ionicons name="bookmark-outline" size={14} color="#666" />
                    <Text style={styles.tasbihBadgeText}>{t('prayerTracker.saveProgress')}</Text>
                  </View>
                  <View style={styles.tasbihBadge}>
                    <Ionicons name="trending-up-outline" size={14} color="#666" />
                    <Text style={styles.tasbihBadgeText}>{t('prayerTracker.trackHistory')}</Text>
                  </View>
                </View>
              </View>

              <Ionicons name="chevron-forward" size={24} color="#CCC" />
            </TouchableOpacity>
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
                  {selectedPrayer && getPrayerName(selectedPrayer.prayer_name)}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={28} color="#666" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>{t('prayerTracker.modal.markAs')}</Text>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonOnTime]}
                onPress={() => handlePrayerAction('ontime')}
              >
                <Ionicons name="time" size={24} color="#FFF" />
                <Text style={styles.modalButtonText}>{t('prayerTracker.modal.doneOnTime')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDone]}
                onPress={() => handlePrayerAction('done')}
              >
                <Ionicons name="checkmark-circle" size={24} color="#FFF" />
                <Text style={styles.modalButtonText}>{t('prayerTracker.modal.doneLate')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonMissed]}
                onPress={() => handlePrayerAction('missed')}
              >
                <Ionicons name="close-circle" size={24} color="#FFF" />
                <Text style={styles.modalButtonText}>{t('prayerTracker.modal.missed')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
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
    color: '#666',
  },
  calendarButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
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
  prayerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
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
    backgroundColor: 'rgba(240, 255, 244, 0.95)',
  },
  prayerCardMissed: {
    backgroundColor: 'rgba(255, 235, 238, 0.95)',
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
  tasbihCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 2,
    borderColor: '#F0FFF4',
  },
  tasbihIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F0FFF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
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
    color: '#666',
    marginBottom: 8,
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
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    margin: 20,
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