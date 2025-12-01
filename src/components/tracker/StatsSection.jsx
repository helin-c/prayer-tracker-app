// ============================================================================
// FILE: src/components/tracker/StatsSection.jsx
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
import { usePrayerTrackerStore } from '../../store/prayerTrackerStore';

const PERIODS = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
];

export const StatsSection = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const { periodStats, isLoading, fetchPeriodStats } = usePrayerTrackerStore();

  useEffect(() => {
    fetchPeriodStats(selectedPeriod);
  }, [selectedPeriod]);

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
  };

  const StatCard = ({ icon, label, value, color = '#00A86B', suffix = '' }) => (
    <View style={styles.statCard}>
      <View style={styles.statCardInner}>
        <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <Text style={styles.statValue}>
          {value !== undefined && value !== null ? value : 0}{suffix}
        </Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );

  if (isLoading && !periodStats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00A86B" />
        <Text style={styles.loadingText}>Loading statistics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Statistics</Text>
        
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {PERIODS.map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                selectedPeriod === period.key && styles.periodButtonActive,
              ]}
              onPress={() => handlePeriodChange(period.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period.key && styles.periodButtonTextActive,
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {periodStats ? (
        <>
          {/* Main Stats Grid */}
          <View style={styles.statsGrid}>
            <StatCard
              icon="checkmark-circle"
              label="Completion Rate"
              value={periodStats.completion_rate}
              suffix="%"
              color="#00A86B"
            />
            <StatCard
              icon="flame"
              label="Current Streak"
              value={periodStats.current_streak}
              suffix=" days"
              color="#FF6B35"
            />
            <StatCard
              icon="time"
              label="On-Time Prayers"
              value={periodStats.on_time_prayers}
              color="#3498DB"
            />
            <StatCard
              icon="trophy"
              label="Best Streak"
              value={periodStats.best_streak}
              suffix=" days"
              color="#F39C12"
            />
          </View>

          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Prayers</Text>
              <Text style={styles.summaryValue}>{periodStats.total_prayers}</Text>
            </View>
            <View style={styles.summaryDivider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Completed</Text>
              <Text style={[styles.summaryValue, { color: '#00A86B' }]}>
                {periodStats.completed_prayers}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Missed</Text>
              <Text style={[styles.summaryValue, { color: '#DC3545' }]}>
                {periodStats.missed_prayers}
              </Text>
            </View>
            
            {periodStats.most_consistent_prayer && (
              <>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Most Consistent</Text>
                  <Text style={[styles.summaryValue, { color: '#F39C12' }]}>
                    {periodStats.most_consistent_prayer}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Period Info */}
          <Text style={styles.periodInfo}>
            {formatDateRange(periodStats.start_date, periodStats.end_date)}
          </Text>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="stats-chart" size={64} color="#CCC" />
          <Text style={styles.emptyStateText}>No statistics available</Text>
          <Text style={styles.emptyStateSubtext}>
            Start tracking your prayers to see your progress
          </Text>
        </View>
      )}
    </View>
  );
};

const formatDateRange = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  const options = { month: 'short', day: 'numeric' };
  const startStr = startDate.toLocaleDateString('en-US', options);
  const endStr = endDate.toLocaleDateString('en-US', options);
  
  return `${startStr} - ${endStr}, ${endDate.getFullYear()}`;
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
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  periodButtonTextActive: {
    color: '#00A86B',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 16,
  },
  statCard: {
    width: '50%',
    padding: 6,
  },
  statCardInner: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 4,
  },
  periodInfo: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});