// ============================================================================
// FILE: src/screens/friends/AddFriendScreen.jsx (WITH i18n)
// ============================================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFriendsStore } from '../../store/friendsStore';

export const AddFriendScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { sendFriendRequest, isLoading } = useFriendsStore();
  const [email, setEmail] = useState('');

  const handleSendRequest = async () => {
    if (!email.trim()) {
      Alert.alert(t('common.error'), t('friends.errors.enterEmail'));
      return;
    }

    try {
      await sendFriendRequest(email.trim().toLowerCase());
      Alert.alert(t('common.success'), t('friends.friendRequestSent'));
      navigation.goBack();
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error.message || t('friends.errors.sendFailed')
      );
    }
  };

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
        <Text style={styles.headerTitle}>{t('friends.addFriend')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="person-add" size={64} color="#00A86B" />
        </View>

        <Text style={styles.title}>{t('friends.addAFriend')}</Text>
        <Text style={styles.subtitle}>{t('friends.enterEmailPrompt')}</Text>

        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder={t('friends.emailPlaceholder')}
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
          onPress={handleSendRequest}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#FFF" />
              <Text style={styles.sendButtonText}>{t('friends.sendRequest')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
    marginBottom: 32,
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
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});