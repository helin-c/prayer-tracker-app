// ============================================================================
// FILE: src/components/tracker/StatsSection.jsx (FIXED AUTO-REFRESH)
// ============================================================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { usePrayerTrackerStore } from '../../store/prayerTrackerStore';

export const StatsSection = () => {
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const { periodStats, isLoading, fetchPeriodStats } = usePrayerTrackerStore();

  const PERIODS = [
    { key: 'week', label: t('prayerTracker.stats.week') },
    { key: 'month', label: t('prayerTracker.stats.month') },
    { key: 'year', label: t('prayerTracker.stats.year') },
  ];

  useEffect(() => {
    fetchPeriodStats(selectedPeriod);
  }, [selectedPeriod]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchPeriodStats(selectedPeriod);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [selectedPeriod]);

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
  };

  const StatCard = ({ icon, label, value, color = '#5BA895', suffix = '' }) => (
    <View style={styles.statCardWrapper}>
      <LinearGradient
        colors={['#E0F5EC', '#E0F5EC']}
        style={styles.statCard}
      >
        <View style={styles.statIconContainer}>
          <LinearGradient
            colors={[color, color]}
            style={styles.statIconGradient}
          >
            <Ionicons name={icon} size={24} color="#FFFFFF" />
          </LinearGradient>
        </View>
        <Text style={styles.statValue}>
          {value !== undefined && value !== null ? value : 0}{suffix}
        </Text>
        <Text style={styles.statLabel}>{label}</Text>
      </LinearGradient>
    </View>
  );

  const formatDateRange = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
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
    
    const startStr = `${months[startDate.getMonth()]} ${startDate.getDate()}`;
    const endStr = `${months[endDate.getMonth()]} ${endDate.getDate()}`;
    
    return `${startStr} - ${endStr}, ${endDate.getFullYear()}`;
  };

  const getPrayerName = (prayerName) => {
    if (!prayerName) return '';
    return t(`prayerTracker.prayers.${prayerName.toLowerCase()}`);
  };

  if (isLoading && !periodStats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5BA895" />
        <Text style={styles.loadingText}>{t('prayerTracker.stats.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('prayerTracker.statistics')}</Text>
        
        {/* Period Selector */}
        <View style={styles.periodSelectorWrapper}>
          <LinearGradient
            colors={['#E0F5EC', '#E0F5EC']}
            style={styles.periodSelector}
          >
            {PERIODS.map((period) => {
              const isActive = selectedPeriod === period.key;
              return (
                <TouchableOpacity
                  key={period.key}
                  style={styles.periodButtonContainer}
                  onPress={() => handlePeriodChange(period.key)}
                  activeOpacity={0.7}
                >
                  {isActive ? (
                    <LinearGradient
                      colors={['#5BA895', '#4A9B87']}
                      style={styles.periodButtonActiveGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.periodButtonTextActive}>
                        {period.label}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.periodButtonInactive}>
                      <Text style={styles.periodButtonTextInactive}>
                        {period.label}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </LinearGradient>
        </View>
      </View>

      {periodStats ? (
        <>
          {/* Main Stats Grid */}
          <View style={styles.statsGrid}>
            <StatCard
              icon="checkmark-circle"
              label={t('prayerTracker.stats.completionRate')}
              value={periodStats.completion_rate}
              suffix="%"
              color="#5BA895"
            />
            <StatCard
              icon="flame"
              label={t('prayerTracker.stats.currentStreak')}
              value={periodStats.current_streak}
              suffix={` ${t('prayerTracker.stats.days')}`}
              color="#FF8C42"
            />
            <StatCard
              icon="time"
              label={t('prayerTracker.stats.onTimePrayers')}
              value={periodStats.on_time_prayers}
              color="#3498DB"
            />
            <StatCard
              icon="trophy"
              label={t('prayerTracker.stats.bestStreak')}
              value={periodStats.best_streak}
              suffix={` ${t('prayerTracker.stats.days')}`}
              color="#F39C12"
            />
          </View>

          {/* Summary Card */}
          <View style={styles.summaryCardWrapper}>
            <LinearGradient
              colors={['rgba(240, 255, 244, 0.7)', 'rgba(240, 255, 244, 0.6)']}
              style={styles.summaryCard}
            >
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  {t('prayerTracker.stats.totalPrayers')}
                </Text>
                <Text style={styles.summaryValue}>{periodStats.total_prayers}</Text>
              </View>
              <View style={styles.summaryDivider} />
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  {t('prayerTracker.stats.completed')}
                </Text>
                <Text style={[styles.summaryValue, { color: '#5BA895' }]}>
                  {periodStats.completed_prayers}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  {t('prayerTracker.stats.missed')}
                </Text>
                <Text style={[styles.summaryValue, { color: '#DC3545' }]}>
                  {periodStats.missed_prayers}
                </Text>
              </View>
              
              {periodStats.most_consistent_prayer && (
                <>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>
                      {t('prayerTracker.stats.mostConsistent')}
                    </Text>
                    <Text style={[styles.summaryValue, { color: '#F39C12' }]}>
                      {getPrayerName(periodStats.most_consistent_prayer)}
                    </Text>
                  </View>
                </>
              )}
            </LinearGradient>
          </View>

          {/* Period Info */}
          <Text style={styles.periodInfo}>
            {formatDateRange(periodStats.start_date, periodStats.end_date)}
          </Text>
        </>
      ) : (
        <View style={styles.emptyStateWrapper}>
          <LinearGradient
            colors={['rgba(240, 255, 244, 0.7)', 'rgba(240, 255, 244, 0.6)']}
            style={styles.emptyState}
          >
            <Ionicons name="stats-chart" size={64} color="#5BA895" />
            <Text style={styles.emptyStateText}>
              {t('prayerTracker.stats.noStats')}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {t('prayerTracker.stats.startTracking')}
            </Text>
          </LinearGradient>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  periodSelectorWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    backgroundColor: '#FFF',
  },
  periodSelector: {
    flexDirection: 'row',
    padding: 4,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  periodButtonContainer: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    overflow: 'hidden',
  },
  periodButtonActiveGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonInactive: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  periodButtonTextActive: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  periodButtonTextInactive: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 16,
  },
  statCardWrapper: {
    width: '50%',
    padding: 6,
  },
  statCard: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
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
  summaryCardWrapper: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  summaryCard: {
    padding: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  summaryDivider: {
    height: 2,
    backgroundColor: 'rgba(91, 168, 149, 0.2)',
    marginVertical: 4,
  },
  periodInfo: {
    fontSize: 12,
    color: '#1A1A1A',
    textAlign: 'center',
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  emptyStateWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#1A1A1A',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
});