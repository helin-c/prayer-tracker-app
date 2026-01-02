// @ts-nocheck
// ============================================================================
// FILE: src/screens/friends/AddFriendScreen.jsx (UPDATED BUTTON STYLE)
// ============================================================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
// ✅ ADDED: LinearGradient import
import { LinearGradient } from 'expo-linear-gradient';

// ✅ IMPORT Store and Selectors
import { useFriendsStore, selectFriendsCount } from '../../store/friendsStore';

// IMPORT THE NEW LAYOUT
import { ScreenLayout } from '../../components/layout/ScreenLayout';

export const AddFriendScreen = ({ navigation }) => {
  const { t } = useTranslation();
  
  // ✅ OPTIMIZED: Use selectors
  const friendsCount = useFriendsStore(selectFriendsCount);
  
  // Actions
  const sendFriendRequest = useFriendsStore(state => state.sendFriendRequest);
  const fetchFriendsCount = useFriendsStore(state => state.fetchFriendsCount);

  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchFriendsCount();
  }, []);

  const handleSendRequest = async () => {
    if (isSending) return;

    if (!email.trim()) {
      Alert.alert(t('common.error'), t('friends.errors.enterEmail'));
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert(t('common.error'), 'Please enter a valid email address');
      return;
    }

    // Check friend limit before sending
    if (!friendsCount.can_add_more) {
      Alert.alert(
        t('friends.limitReached'),
        t('friends.limitReachedMessage', { limit: friendsCount.max_limit }),
        [{ text: t('common.ok'), style: 'default' }]
      );
      return;
    }

    setIsSending(true);
    try {
      await sendFriendRequest(email.trim().toLowerCase());
      Alert.alert(t('common.success'), t('friends.friendRequestSent'));
      navigation.goBack();
    } catch (error) {
      const errorMsg =
        error.response?.data?.detail ||
        error.message ||
        t('friends.errors.sendFailed');
      Alert.alert(t('common.error'), errorMsg);
    } finally {
      setIsSending(false);
    }
  };

  const isButtonDisabled = !friendsCount.can_add_more || isSending;

  return (
    // WRAPPED IN SCREEN LAYOUT
    <ScreenLayout>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={isSending}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('friends.addFriend')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="person-add" size={64} color="#00A86B" />
        </View>

        <Text style={styles.title}>{t('friends.addAFriend')}</Text>
        <Text style={styles.subtitle}>{t('friends.enterEmailPrompt')}</Text>

        {/* Friends Limit Info */}
        <View
          style={[
            styles.limitInfo,
            !friendsCount.can_add_more && styles.limitInfoWarning,
          ]}
        >
          <Ionicons
            name={friendsCount.can_add_more ? 'information-circle' : 'warning'}
            size={20}
            color={friendsCount.can_add_more ? '#00A86B' : '#4A9B87'}
          />
          <Text
            style={[
              styles.limitInfoText,
              !friendsCount.can_add_more && styles.limitInfoTextWarning,
            ]}
          >
            {friendsCount.current_count}/{friendsCount.max_limit}{' '}
            {t('friends.friendsAdded')}
          </Text>
        </View>

        {!friendsCount.can_add_more && (
          <View style={styles.warningCard}>
            <Ionicons name="alert-circle" size={24} color="#FF6B35" />
            <Text style={styles.warningText}>
              {t('friends.limitReachedMessage', {
                limit: friendsCount.max_limit,
              })}
            </Text>
          </View>
        )}

        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder={t('friends.emailPlaceholder')}
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={friendsCount.can_add_more && !isSending}
        />

        {/* ✅ NEW: Gradient Send Button */}
        <TouchableOpacity
          style={styles.sendButtonWrapper}
          onPress={handleSendRequest}
          disabled={isButtonDisabled}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isButtonDisabled ? ['#999', '#777'] : ['#5BA895', '#4A9B87']}
            style={styles.sendButton}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="#FFF" />
                <Text style={styles.sendButtonText}>
                  {friendsCount.can_add_more
                    ? t('friends.sendRequest')
                    : t('friends.limitReached')}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 24,
  },
  limitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#',
    padding: 2,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  limitInfoWarning: {
    backgroundColor: '#FFF3E0',
  },
  limitInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00A86B',
  },
  limitInfoTextWarning: {
    color: '#FF6B35',
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
  },
  input: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 16, // Added margin bottom for spacing
  },
  
  // ✅ NEW: Button Styles
  sendButtonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#00A86B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    height: 56,
  },
  sendButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700', 
  },
});