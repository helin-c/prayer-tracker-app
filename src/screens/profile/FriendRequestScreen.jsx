// @ts-nocheck
// ============================================================================
// FILE: src/screens/friends/FriendRequestScreen.jsx (OPTIMIZED WITH SELECTORS)
// ============================================================================
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator, 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

// ✅ IMPORT Store and Selectors
import { 
  useFriendsStore, 
  selectFriendsCount, 
  selectFriendsIsLoading 
} from '../../store/friendsStore';

// IMPORT THE NEW LAYOUT
import { ScreenLayout } from '../../components/layout/ScreenLayout';

// COMPONENT IMPORTS
import {
  SkeletonLoader,
  SkeletonLine,
  SkeletonCircle,
} from '../../components/loading/SkeletonLoader';

const RequestSkeleton = () => {
  const skeletonStyle = { backgroundColor: 'rgba(255, 255, 255, 0.5)' };

  return (
    <View style={{ padding: 20, alignItems: 'center', paddingTop: 60 }}>
      {/* Avatar Skeleton */}
      <SkeletonCircle
        size={100}
        style={{ ...skeletonStyle, marginBottom: 24 }}
      />

      {/* Name & Email Skeleton */}
      <SkeletonLine
        width={200}
        height={28}
        style={{ ...skeletonStyle, marginBottom: 8 }}
      />
      <SkeletonLine
        width={150}
        height={16}
        style={{ ...skeletonStyle, marginBottom: 32 }}
      />

      {/* Info Card Skeleton */}
      <SkeletonLoader
        width="100%"
        height={140}
        borderRadius={16}
        style={{ ...skeletonStyle, marginBottom: 32 }}
      />

      {/* Buttons Skeleton */}
      <SkeletonLoader
        width="100%"
        height={56}
        borderRadius={12}
        style={{ ...skeletonStyle, marginBottom: 12 }}
      />
      <SkeletonLoader
        width="100%"
        height={56}
        borderRadius={12}
        style={{ ...skeletonStyle }}
      />
    </View>
  );
};

// ============================================================================
// MAIN SCREEN
// ============================================================================
export const FriendRequestScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { request } = route.params;
  
  // ✅ OPTIMIZED: Use selectors
  const friendsCount = useFriendsStore(selectFriendsCount);
  const isLoading = useFriendsStore(selectFriendsIsLoading);
  
  // Actions
  const acceptFriendRequest = useFriendsStore(state => state.acceptFriendRequest);
  const rejectFriendRequest = useFriendsStore(state => state.rejectFriendRequest);
  const fetchFriendsCount = useFriendsStore(state => state.fetchFriendsCount);

  // İşlem durumları
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionType, setActionType] = useState(null); // 'accept' | 'reject'

  useEffect(() => {
    fetchFriendsCount();
  }, []);

  const handleAccept = async () => {
    if (isProcessing) return;

    // Check friend limit before accepting
    if (!friendsCount.can_add_more) {
      Alert.alert(
        t('friends.limitReached'),
        t('friends.limitReachedMessage', { limit: friendsCount.max_limit }),
        [{ text: t('common.ok'), style: 'default' }]
      );
      return;
    }

    setIsProcessing(true);
    setActionType('accept');

    try {
      await acceptFriendRequest(request.id);
      Alert.alert(t('common.success'), t('friends.requestAccepted'));
      navigation.goBack();
    } catch (error) {
      const errorMsg =
        error.response?.data?.detail || t('friends.errors.acceptFailed');
      Alert.alert(t('common.error'), errorMsg);
    } finally {
      setIsProcessing(false);
      setActionType(null);
    }
  };

  const handleReject = async () => {
    if (isProcessing) return;

    Alert.alert(t('friends.rejectRequest'), t('friends.rejectConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('friends.decline'),
        style: 'destructive',
        onPress: async () => {
          setIsProcessing(true);
          setActionType('reject');
          try {
            await rejectFriendRequest(request.id);
            navigation.goBack();
          } catch (error) {
            Alert.alert(t('common.error'), t('friends.errors.rejectFailed'));
          } finally {
            setIsProcessing(false);
            setActionType(null);
          }
        },
      },
    ]);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading && !friendsCount) {
    return (
      <ScreenLayout>
        <RequestSkeleton />
      </ScreenLayout>
    );
  }

  return (
    // WRAPPED IN SCREEN LAYOUT
    <ScreenLayout>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={isProcessing}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('friends.friendRequest')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getInitials(request.sender_name)}
            </Text>
          </View>
        </View>

        {/* User Info */}
        <Text style={styles.name}>{request.sender_name}</Text>
        <Text style={styles.email}>{request.sender_email}</Text>

        {/* Friends Limit Warning */}
        {!friendsCount.can_add_more && (
          <View style={styles.warningCard}>
            <Ionicons name="warning" size={24} color="#FF6B35" />
            <Text style={styles.warningText}>
              {t('friends.limitReachedMessage', {
                limit: friendsCount.max_limit,
              })}
            </Text>
          </View>
        )}

        {/* Request Info */}
        <View style={styles.infoCard}>
          <Ionicons name="mail-outline" size={48} color="#00A86B" />
          <Text style={styles.infoTitle}>{t('friends.friendRequest')}</Text>
          <Text style={styles.infoText}>
            {t('friends.requestFrom', { name: request.sender_name })}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.acceptButton,
              (!friendsCount.can_add_more || isProcessing) &&
                styles.buttonDisabled,
            ]}
            onPress={handleAccept}
            disabled={!friendsCount.can_add_more || isProcessing}
          >
            {actionType === 'accept' ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                <Text style={styles.acceptButtonText}>
                  {friendsCount.can_add_more
                    ? t('friends.accept')
                    : t('friends.limitReached')}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.rejectButton,
              isProcessing && styles.buttonDisabled,
            ]}
            onPress={handleReject}
            disabled={isProcessing}
          >
            {actionType === 'reject' ? (
              <ActivityIndicator size="small" color="#DC3545" />
            ) : (
              <>
                <Ionicons
                  name="close-circle-outline"
                  size={20}
                  color="#DC3545"
                />
                <Text style={styles.rejectButtonText}>
                  {t('friends.decline')}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  // Removed container since Layout handles bg
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3498DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#E65100',
    lineHeight: 20,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  actions: {
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    height: 56, // Fixed height
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  acceptButton: {
    backgroundColor: '#00A86B',
  },
  acceptButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rejectButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DC3545',
  },
  rejectButtonText: {
    color: '#DC3545',
    fontSize: 16,
    fontWeight: '600',
  },
});