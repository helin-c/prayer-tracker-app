// @ts-nocheck
// ============================================================================
// FILE: src/screens/profile/EditProfileScreen.jsx (UPDATED BUTTON STYLE)
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
  ActivityIndicator, 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuthStore, selectUser } from '../../store/authStore';

import { ScreenLayout } from '../../components/layout/ScreenLayout';

const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
];

export const EditProfileScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  
  const user = useAuthStore(selectUser);
  const updateProfile = useAuthStore(state => state.updateProfile);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    location: '',
    preferred_language: 'en',
  });

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
        if (formData.preferred_language !== i18n.language) {
          await i18n.changeLanguage(formData.preferred_language);
        }

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
    <ScreenLayout noPaddingBottom={true}>
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

        <TouchableOpacity
          style={styles.saveButtonWrapper}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isSaving ? ['#999', '#777'] : ['#5BA895', '#4A9B87']}
            style={styles.saveButton}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                <Text style={styles.saveButtonText}>{t('common.save')}</Text>
              </>
            )}
          </LinearGradient>
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
        
        {/* Extra bottom padding */}
        <View style={{height: 40}} />
      </ScrollView>
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
    color: '#1A1A1A',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F5EC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    height: 56, 
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    height: '100%',
  },


  languageList: {
    gap: 12,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E0F5EC',
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

  // ✅ NEW: Button Styles (Matching ChangePasswordScreen)
  saveButtonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    height: 56,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700', // Bold text like in ChangePassword
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