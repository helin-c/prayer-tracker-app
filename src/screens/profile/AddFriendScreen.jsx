// ============================================================================
// FILE: src/screens/friends/AddFriendScreen.jsx
// ============================================================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFriendsStore } from '../../store/friendsStore';
import { IslamicLoadingScreen } from '../../components/loading/IslamicLoadingScreen';

export const AddFriendScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { sendFriendRequest, friendsCount, fetchFriendsCount, isLoading } = useFriendsStore();
  const [email, setEmail] = useState('');

  useEffect(() => {
    fetchFriendsCount();
  }, []);

  const handleSendRequest = async () => {
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
        [
          { text: t('common.ok'), style: 'default' },
        ]
      );
      return;
    }

    try {
      await sendFriendRequest(email.trim().toLowerCase());
      Alert.alert(t('common.success'), t('friends.friendRequestSent'));
      navigation.goBack();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.message || t('friends.errors.sendFailed');
      Alert.alert(t('common.error'), errorMsg);
    }
  };

  if (isLoading) {
    return (
      <IslamicLoadingScreen 
        message={t('friends.sendingRequest')}
        submessage={t('common.pleaseWait')}
      />
    );
  }

  return (
    <ImageBackground
      source={require('../../assets/images/illustrations/background.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
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
          <View style={[
            styles.limitInfo, 
            !friendsCount.can_add_more && styles.limitInfoWarning
          ]}>
            <Ionicons 
              name={friendsCount.can_add_more ? "information-circle" : "warning"} 
              size={20} 
              color={friendsCount.can_add_more ? "#00A86B" : "#FF6B35"} 
            />
            <Text style={[
              styles.limitInfoText,
              !friendsCount.can_add_more && styles.limitInfoTextWarning
            ]}>
              {friendsCount.current_count}/{friendsCount.max_limit} {t('friends.friendsAdded')}
            </Text>
          </View>

          {!friendsCount.can_add_more && (
            <View style={styles.warningCard}>
              <Ionicons name="alert-circle" size={24} color="#FF6B35" />
              <Text style={styles.warningText}>
                {t('friends.limitReachedMessage', { limit: friendsCount.max_limit })}
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
            editable={friendsCount.can_add_more}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              !friendsCount.can_add_more && styles.sendButtonDisabled
            ]}
            onPress={handleSendRequest}
            disabled={!friendsCount.can_add_more}
          >
            <Ionicons name="send" size={20} color="#FFF" />
            <Text style={styles.sendButtonText}>
              {friendsCount.can_add_more ? t('friends.sendRequest') : t('friends.limitReached')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
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
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  limitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
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
  },
  sendButton: {
    flexDirection: 'row',
    backgroundColor: '#00A86B',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  sendButtonDisabled: {
    backgroundColor: '#BDBDBD',
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});