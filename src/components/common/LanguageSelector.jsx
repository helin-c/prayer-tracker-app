// ============================================================================
// FILE: src/components/common/LanguageSelector.jsx
// ============================================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { SUPPORTED_LANGUAGES } from '../../utils/constants';

export const LanguageSelector = ({ style, onLanguageChange }) => {
  const { t, i18n } = useTranslation();
  const { changeLanguage, isAuthenticated } = useAuthStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const currentLanguage = SUPPORTED_LANGUAGES.find(
    (lang) => lang.code === i18n.language
  ) || SUPPORTED_LANGUAGES[0];

  const handleLanguageSelect = async (languageCode) => {
    if (languageCode === i18n.language) {
      setModalVisible(false);
      return;
    }

    setIsChanging(true);

    try {
      if (isAuthenticated) {
        // If logged in, update backend
        const result = await changeLanguage(languageCode);
        
        if (result.success) {
          Alert.alert(
            t('common.success'),
            t('profile.languageChanged'),
            [{ text: t('common.done') }]
          );
          onLanguageChange?.(languageCode);
        } else {
          Alert.alert(t('common.error'), result.error);
        }
      } else {
        // If not logged in, just change locally
        await i18n.changeLanguage(languageCode);
        onLanguageChange?.(languageCode);
      }
    } catch (error) {
      console.error('Language change error:', error);
      Alert.alert(t('common.error'), 'Failed to change language');
    } finally {
      setIsChanging(false);
      setModalVisible(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.container, style]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.content}>
          <Ionicons name="language" size={24} color="#00A86B" />
          <View style={styles.textContainer}>
            <Text style={styles.label}>{t('profile.language')}</Text>
            <Text style={styles.value}>{currentLanguage.nativeName}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#CCC" />
      </TouchableOpacity>

      {/* Language Selection Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('profile.selectLanguage')}</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                disabled={isChanging}
              >
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Language Options */}
            <View style={styles.languageList}>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageOption,
                    lang.code === i18n.language && styles.languageOptionActive,
                  ]}
                  onPress={() => handleLanguageSelect(lang.code)}
                  disabled={isChanging}
                >
                  <Text style={styles.languageFlag}>{lang.flag}</Text>
                  
                  <View style={styles.languageInfo}>
                    <Text style={styles.languageName}>{lang.nativeName}</Text>
                    <Text style={styles.languageNameEn}>{lang.name}</Text>
                  </View>

                  {lang.code === i18n.language && (
                    <Ionicons name="checkmark-circle" size={24} color="#00A86B" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Loading Indicator */}
            {isChanging && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00A86B" />
                <Text style={styles.loadingText}>
                  {t('common.loading')}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  languageList: {
    gap: 12,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageOptionActive: {
    backgroundColor: '#F0FFF4',
    borderColor: '#00A86B',
  },
  languageFlag: {
    fontSize: 32,
    marginRight: 16,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  languageNameEn: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    marginTop: 24,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
});