// ============================================================================
// FILE: src/screens/profile/ProfileScreen.jsx (WITH i18n)
// ============================================================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useFriendsStore } from '../../store/friendsStore';
import { usePrayerTrackerStore } from '../../store/prayerTrackerStore';
import { usePrayerStore } from '../../store/prayerStore';

export const ProfileScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const { 
    friends, 
    pendingRequests, 
    fetchFriends, 
    fetchPendingRequests,
    isLoading 
  } = useFriendsStore();
  const { periodStats, fetchPeriodStats } = usePrayerTrackerStore();
  const { location } = usePrayerStore();
  
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      fetchFriends(),
      fetchPendingRequests(),
      fetchPeriodStats('week'),
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      t('profile.logout'),
      t('profile.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.logout'),
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getLocationDisplay = () => {
    if (location?.city && location?.country) {
      return `${location.city}, ${location.country}`;
    } else if (location?.city) {
      return location.city;
    } else if (location?.country) {
      return location.country;
    } else if (user?.location) {
      return user.location;
    }
    return t('profile.locationPlaceholder');
  };

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
          <Text style={styles.headerTitle}>{t('profile.profile')}</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getInitials(user?.full_name || user?.email)}
              </Text>
            </View>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
            </View>
          </View>

          <Text style={styles.userName}>
            {user?.full_name || t('home.guest')}
          </Text>
          <Text style={styles.userEmail}>{user?.email}</Text>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {periodStats?.current_streak || 0}
              </Text>
              <Text style={styles.statLabel}>{t('friends.dayStreak')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {periodStats?.completion_rate?.toFixed(0) || 0}%
              </Text>
              <Text style={styles.statLabel}>{t('profile.completion')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{friends?.length || 0}</Text>
              <Text style={styles.statLabel}>{t('friends.friends')}</Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Ionicons name="create-outline" size={20} color="#00A86B" />
              <Text style={styles.actionButtonText}>{t('profile.editProfile')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonSecondary]}
              onPress={() => navigation.navigate('AddFriend')}
            >
              <Ionicons name="person-add-outline" size={20} color="#FFF" />
              <Text style={styles.actionButtonTextSecondary}>{t('friends.addFriend')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pending Requests */}
        {pendingRequests && pendingRequests.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="mail-outline" size={20} color="#00A86B" />
              <Text style={styles.sectionTitle}>{t('friends.friendRequests')}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingRequests.length}</Text>
              </View>
            </View>

            {pendingRequests.map((request, index) => (
              <TouchableOpacity
                key={index}
                style={styles.requestCard}
                onPress={() => navigation.navigate('FriendRequest', { request })}
              >
                <View style={styles.requestAvatar}>
                  <Text style={styles.requestAvatarText}>
                    {getInitials(request.sender_name)}
                  </Text>
                </View>
                <View style={styles.requestInfo}>
                  <Text style={styles.requestName}>{request.sender_name}</Text>
                  <Text style={styles.requestEmail}>{request.sender_email}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CCC" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Friends List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people-outline" size={20} color="#00A86B" />
            <Text style={styles.sectionTitle}>{t('friends.friends')}</Text>
            <Text style={styles.sectionCount}>
              {friends?.length || 0}
            </Text>
          </View>

          {friends && friends.length > 0 ? (
            friends.map((friend, index) => (
              <TouchableOpacity
                key={index}
                style={styles.friendCard}
                onPress={() => navigation.navigate('FriendProfile', { friend })}
              >
                <View style={styles.friendAvatar}>
                  <Text style={styles.friendAvatarText}>
                    {getInitials(friend.friend_name)}
                  </Text>
                </View>
                <View style={styles.friendInfo}>
                  <Text style={styles.friendName}>{friend.friend_name}</Text>
                  <View style={styles.friendStats}>
                    <Ionicons name="flame" size={14} color="#FF6B35" />
                    <Text style={styles.friendStatsText}>
                      {friend.current_streak || 0} {t('friends.dayStreak').toLowerCase()}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CCC" />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#CCC" />
              <Text style={styles.emptyText}>{t('friends.noFriends')}</Text>
              <Text style={styles.emptySubtext}>
                {t('friends.noFriendsDescription')}
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('AddFriend')}
              >
                <Text style={styles.emptyButtonText}>{t('friends.addFriend')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Profile Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={20} color="#00A86B" />
            <Text style={styles.sectionTitle}>{t('profile.accountInfo')}</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Ionicons name="location-outline" size={20} color="#666" />
                <Text style={styles.infoLabel}>{t('profile.location')}</Text>
              </View>
              <Text style={styles.infoValue}>
                {getLocationDisplay()}
              </Text>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Ionicons name="language-outline" size={20} color="#666" />
                <Text style={styles.infoLabel}>{t('profile.language')}</Text>
              </View>
              <Text style={styles.infoValue}>
                {user?.preferred_language?.toUpperCase() || 'EN'}
              </Text>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Ionicons name="calendar-outline" size={20} color="#666" />
                <Text style={styles.infoLabel}>{t('profile.memberSince')}</Text>
              </View>
              <Text style={styles.infoValue}>
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString()
                  : '-'}
              </Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#DC3545" />
          <Text style={styles.logoutText}>{t('profile.logout')}</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.versionText}>{t('profile.version')} 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

// Styles remain the same as before...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#1A1A1A' },
  settingsButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  profileCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#00A86B', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: '#FFF' },
  statusBadge: { position: 'absolute', bottom: 4, right: 4, width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  statusDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#00A86B' },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 4 },
  userEmail: { fontSize: 14, color: '#666', marginBottom: 20 },
  statsRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 20 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#00A86B', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#666' },
  statDivider: { width: 1, height: 40, backgroundColor: '#E0E0E0' },
  quickActions: { flexDirection: 'row', width: '100%', gap: 12 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0FFF4', paddingVertical: 12, borderRadius: 12, gap: 6 },
  actionButtonText: { fontSize: 14, fontWeight: '600', color: '#00A86B' },
  actionButtonSecondary: { backgroundColor: '#00A86B' },
  actionButtonTextSecondary: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A', flex: 1 },
  sectionCount: { fontSize: 14, color: '#666' },
  badge: { backgroundColor: '#00A86B', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, minWidth: 24, alignItems: 'center' },
  badgeText: { fontSize: 12, fontWeight: 'bold', color: '#FFF' },
  requestCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  requestAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#3498DB', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  requestAvatarText: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  requestInfo: { flex: 1 },
  requestName: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 2 },
  requestEmail: { fontSize: 14, color: '#666' },
  friendCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  friendAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#00A86B', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  friendAvatarText: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  friendInfo: { flex: 1 },
  friendName: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 4 },
  friendStats: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  friendStatsText: { fontSize: 12, color: '#666' },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#666', marginTop: 12 },
  emptySubtext: { fontSize: 14, color: '#999', marginTop: 4, textAlign: 'center' },
  emptyButton: { backgroundColor: '#00A86B', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, marginTop: 16 },
  emptyButtonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  infoCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoLabel: { fontSize: 15, color: '#666' },
  infoValue: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  infoDivider: { height: 1, backgroundColor: '#F0F0F0' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginTop: 8, marginBottom: 16, gap: 8, borderWidth: 1, borderColor: '#DC3545' },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#DC3545' },
  versionText: { textAlign: 'center', fontSize: 12, color: '#999' },
});