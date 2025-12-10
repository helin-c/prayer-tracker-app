// ============================================================================
// FILE: src/screens/tracker/ZikrHistoryScreen.jsx (i18n INTEGRATED)
// ============================================================================
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTasbihStore } from '../../store/tasbihStore';
import { formatDistanceToNow } from 'date-fns';
import { enUS, tr } from 'date-fns/locale';

export const ZikrHistoryScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const { 
    sessions, 
    deleteSession, 
    clearAllSessions,
    continueSession,
    loadSessions 
  } = useTasbihStore();

  useEffect(() => {
    loadSessions();
  }, []);

  const getDateFnsLocale = () => {
    return i18n.language === 'tr' ? tr : enUS;
  };

  const handleContinue = (session) => {
    continueSession(session);
    navigation.goBack();
  };

  const handleDelete = (id, name) => {
    Alert.alert(
      t('zikrHistory.deleteSession'),
      t('zikrHistory.deleteConfirm', { name }),
      [
        { text: t('zikrHistory.cancel'), style: 'cancel' },
        {
          text: t('zikrHistory.delete'),
          style: 'destructive',
          onPress: () => deleteSession(id),
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      t('zikrHistory.clearAllHistory'),
      t('zikrHistory.clearAllConfirm'),
      [
        { text: t('zikrHistory.cancel'), style: 'cancel' },
        {
          text: t('zikrHistory.clearAll'),
          style: 'destructive',
          onPress: clearAllSessions,
        },
      ]
    );
  };

  const renderSession = ({ item }) => {
    const hasTarget = item.target > 0;
    const progress = hasTarget ? Math.min((item.count / item.target) * 100, 100) : null;
    const isComplete = hasTarget && item.count >= item.target;

    return (
      <View style={styles.sessionCard}>
        <TouchableOpacity
          style={styles.sessionContent}
          onPress={() => handleContinue(item)}
          activeOpacity={0.7}
        >
          {/* Session Icon */}
          <View style={[
            styles.sessionIcon,
            isComplete && styles.sessionIconComplete,
          ]}>
            <Ionicons 
              name={isComplete ? "checkmark-circle" : "infinite"} 
              size={28} 
              color={isComplete ? "#00A86B" : "#3498DB"} 
            />
          </View>

          {/* Session Info */}
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionName}>{item.name}</Text>
            
            <View style={styles.sessionStats}>
              <View style={styles.statItem}>
                <Ionicons name="radio-button-on" size={14} color="#00A86B" />
                <Text style={styles.statText}>
                  {item.count} {t('zikrHistory.counts')}
                </Text>
              </View>
              
              {hasTarget && (
                <View style={styles.statItem}>
                  <Ionicons name="flag" size={14} color="#3498DB" />
                  <Text style={styles.statTextSecondary}>
                    {t('zikrHistory.target')} {item.target}
                  </Text>
                </View>
              )}
            </View>

            {/* Progress Bar */}
            {hasTarget && (
              <View style={styles.miniProgressContainer}>
                <View style={styles.miniProgressBar}>
                  <View 
                    style={[
                      styles.miniProgressFill,
                      { width: `${progress}%` },
                      isComplete && styles.miniProgressFillComplete,
                    ]} 
                  />
                </View>
                <Text style={[
                  styles.miniProgressText,
                  isComplete && styles.miniProgressTextComplete,
                ]}>
                  {Math.round(progress)}%
                </Text>
              </View>
            )}

            <Text style={styles.sessionDate}>
              {formatDistanceToNow(new Date(item.lastUpdated), { 
                addSuffix: true,
                locale: getDateFnsLocale()
              })}
            </Text>
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => handleContinue(item)}
          >
            <Ionicons name="play-circle" size={32} color="#00A86B" />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Delete Button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id, item.name)}
        >
          <Ionicons name="trash-outline" size={18} color="#DC3545" />
        </TouchableOpacity>
      </View>
    );
  };

  // Calculate total stats
  const totalSessions = sessions.length;
  const totalCounts = sessions.reduce((sum, s) => sum + s.count, 0);
  const completedSessions = sessions.filter(s => 
    s.target > 0 && s.count >= s.target
  ).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('zikrHistory.title')}</Text>
        {totalSessions > 0 && (
          <TouchableOpacity onPress={handleClearAll}>
            <Text style={styles.clearAllText}>{t('zikrHistory.clearAll')}</Text>
          </TouchableOpacity>
        )}
        {totalSessions === 0 && <View style={{ width: 70 }} />}
      </View>

      {/* Stats Summary */}
      {totalSessions > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="bookmark" size={20} color="#00A86B" />
            <Text style={styles.statValue}>{totalSessions}</Text>
            <Text style={styles.statLabel}>{t('zikrHistory.sessions')}</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="infinite" size={20} color="#3498DB" />
            <Text style={styles.statValue}>{totalCounts}</Text>
            <Text style={styles.statLabel}>{t('zikrHistory.totalCounts')}</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={20} color="#9B59B6" />
            <Text style={styles.statValue}>{completedSessions}</Text>
            <Text style={styles.statLabel}>{t('zikrHistory.completed')}</Text>
          </View>
        </View>
      )}

      {/* Sessions List */}
      {totalSessions > 0 ? (
        <FlatList
          data={sessions}
          renderItem={renderSession}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="bookmark-outline" size={64} color="#CCC" />
          </View>
          <Text style={styles.emptyTitle}>{t('zikrHistory.empty.title')}</Text>
          <Text style={styles.emptyText}>
            {t('zikrHistory.empty.message')}
          </Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="add-circle" size={20} color="#FFF" />
            <Text style={styles.startButtonText}>
              {t('zikrHistory.empty.startButton')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC3545',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  sessionCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  sessionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  sessionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  sessionIconComplete: {
    backgroundColor: '#F0FFF4',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  sessionStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00A86B',
  },
  statTextSecondary: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3498DB',
  },
  miniProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  miniProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: '#3498DB',
    borderRadius: 3,
  },
  miniProgressFillComplete: {
    backgroundColor: '#00A86B',
  },
  miniProgressText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3498DB',
    minWidth: 36,
  },
  miniProgressTextComplete: {
    color: '#00A86B',
  },
  sessionDate: {
    fontSize: 12,
    color: '#999',
  },
  continueButton: {
    marginLeft: 8,
  },
  deleteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#00A86B',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#00A86B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
});