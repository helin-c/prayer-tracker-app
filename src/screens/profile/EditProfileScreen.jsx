// @ts-nocheck
// ============================================================================
// FILE: src/screens/profile/EditProfileScreen.jsx (PRODUCTION READY)
// ============================================================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator, // Spinner için eklendi
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';

const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
];

export const EditProfileScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const { user, updateProfile } = useAuthStore();

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    location: '',
    preferred_language: 'en',
  });

  // Kaydetme işlemi durumu
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        location: user.location || '',
        preferred_language: user.preferred_language || i18n.language || 'en',
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (isSaving) return;

    setIsSaving(true);

    try {
      const result = await updateProfile(formData);

      if (result.success) {
        Alert.alert(t('common.success'), t('profile.profileUpdated'), [
          {
            text: t('common.done'),
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert(
          t('common.error'),
          result.error || t('profile.updateFailed')
        );
      }
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error.message || t('profile.updateFailed')
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleLanguageSelect = (langCode) => {
    setFormData({ ...formData, preferred_language: langCode });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={isSaving}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.editProfile')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Full Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('auth.fullName')}</Text>
          <View style={styles.inputContainer}>
            <Ionicons
              name="person-outline"
              size={20}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={formData.full_name}
              onChangeText={(text) =>
                setFormData({ ...formData, full_name: text })
              }
              placeholder={t('auth.fullNamePlaceholder')}
              placeholderTextColor="#999"
              editable={!isSaving}
            />
          </View>
        </View>

        {/* Phone */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('profile.phoneNumber')}</Text>
          <View style={styles.inputContainer}>
            <Ionicons
              name="call-outline"
              size={20}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder="+90 5XX XXX XX XX"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              editable={!isSaving}
            />
          </View>
        </View>

        {/* Location */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('profile.location')}</Text>
          <View style={styles.inputContainer}>
            <Ionicons
              name="location-outline"
              size={20}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={formData.location}
              onChangeText={(text) =>
                setFormData({ ...formData, location: text })
              }
              placeholder={t('profile.locationPlaceholder')}
              placeholderTextColor="#999"
              editable={!isSaving}
            />
          </View>
        </View>

        {/* Language Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('profile.language')}</Text>
          <Text style={styles.labelSubtext}>
            {t('profile.languageDescription')}
          </Text>

          <View style={styles.languageList}>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageOption,
                  formData.preferred_language === lang.code &&
                    styles.languageOptionActive,
                ]}
                onPress={() => !isSaving && handleLanguageSelect(lang.code)}
                activeOpacity={0.7}
                disabled={isSaving}
              >
                <View style={styles.languageLeft}>
                  <Text style={styles.languageFlag}>{lang.flag}</Text>
                  <View style={styles.languageText}>
                    <Text style={styles.languageName}>{lang.nativeName}</Text>
                    <Text style={styles.languageNameEn}>{lang.name}</Text>
                  </View>
                </View>

                {formData.preferred_language === lang.code && (
                  <Ionicons name="checkmark-circle" size={24} color="#00A86B" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {formData.preferred_language !== i18n.language && (
            <View style={styles.languageNote}>
              <Ionicons name="information-circle" size={16} color="#3498DB" />
              <Text style={styles.languageNoteText}>
                {t('profile.languageChangeNote')}
              </Text>
            </View>
          )}
        </View>

        {/* Save Button with Spinner */}
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#FFF" />
              <Text style={styles.saveButtonText}>{t('common.save')}</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Discard Button */}
        <TouchableOpacity
          style={styles.discardButton}
          onPress={() => navigation.goBack()}
          disabled={isSaving}
        >
          <Text
            style={[styles.discardButtonText, isSaving && { color: '#CCC' }]}
          >
            {t('common.cancel')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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

  // Input Groups
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  labelSubtext: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#1A1A1A',
  },

  // Language Selection
  languageList: {
    gap: 12,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  languageOptionActive: {
    borderColor: '#00A86B',
    backgroundColor: '#F0FFF4',
  },
  languageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  languageFlag: {
    fontSize: 32,
    marginRight: 16,
  },
  languageText: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  languageNameEn: {
    fontSize: 13,
    color: '#666',
  },
  languageNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  languageNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#3498DB',
    lineHeight: 18,
  },

  // Buttons
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00A86B',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
    height: 56, // Fixed height to prevent resizing when spinner appears
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  discardButton: {
    alignItems: 'center',
    padding: 16,
    marginTop: 12,
    marginBottom: 32,
  },
  discardButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});
