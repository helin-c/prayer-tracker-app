// @ts-nocheck
// ============================================================================
// FILE: src/screens/auth/RegisterScreen.jsx (PRODUCTION READY)
// ============================================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
// REMOVED: SafeAreaView (ScreenLayout handles this)
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { Button, Input } from '../../components/common';

// IMPORT THE NEW LAYOUT
import { ScreenLayout } from '../../components/layout/ScreenLayout';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

export const RegisterScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    preferred_language: i18n.language || 'en',
  });
  const [errors, setErrors] = useState({});

  // Use isLoading for button spinner only
  const { register, isLoading } = useAuthStore();

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: '' });
  };

  const handleLanguageSelect = (langCode) => {
    updateField('preferred_language', langCode);
    i18n.changeLanguage(langCode);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = t('auth.errors.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('auth.errors.emailInvalid');
    }

    if (!formData.password) {
      newErrors.password = t('auth.errors.passwordRequired');
    } else if (formData.password.length < 8) {
      newErrors.password = t('auth.errors.passwordMinLength');
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.errors.passwordsNotMatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    const { confirmPassword, ...registerData } = formData;

    const cleanData = {
      ...registerData,
      email: registerData.email.toLowerCase().trim(),
    };

    const result = await register(cleanData);

    if (result.success) {
      Alert.alert(t('common.success'), t('auth.accountCreated'));
      navigation.navigate('Login');
    } else {
      Alert.alert(t('auth.errors.registerFailed'), result.error);
    }
  };

  return (
    // WRAPPED IN SCREEN LAYOUT
    <ScreenLayout>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Card Container */}
          <View style={styles.card}>
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              disabled={isLoading}
            >
              <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Ionicons name="person-add" size={50} color="#00A86B" />
              </View>
              <Text style={styles.title}>{t('auth.createAccount')}</Text>
              <Text style={styles.subtitle}>{t('auth.joinCommunity')}</Text>
            </View>

            {/* Language Selection */}
            <View style={styles.languageSection}>
              <Text style={styles.languageLabel}>
                {t('auth.selectLanguage')}
              </Text>
              <View style={styles.languageButtons}>
                {LANGUAGES.map((lang) => (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.languageButton,
                      formData.preferred_language === lang.code &&
                        styles.languageButtonActive,
                    ]}
                    onPress={() =>
                      !isLoading && handleLanguageSelect(lang.code)
                    }
                    disabled={isLoading}
                  >
                    <Text style={styles.languageFlag}>{lang.flag}</Text>
                    <Text
                      style={[
                        styles.languageName,
                        formData.preferred_language === lang.code &&
                          styles.languageNameActive,
                      ]}
                    >
                      {lang.name}
                    </Text>
                    {formData.preferred_language === lang.code && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#00A86B"
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <Input
                label={t('auth.emailAddress')}
                value={formData.email}
                onChangeText={(text) => updateField('email', text)}
                placeholder={t('auth.emailPlaceholder')}
                keyboardType="email-address"
                leftIcon="mail-outline"
                error={errors.email}
                editable={!isLoading}
              />

              <Input
                label={t('auth.fullNameOptional')}
                value={formData.full_name}
                onChangeText={(text) => updateField('full_name', text)}
                placeholder={t('auth.fullNamePlaceholder')}
                leftIcon="person-outline"
                autoCapitalize="words"
                editable={!isLoading}
              />

              <Input
                label={t('auth.password')}
                value={formData.password}
                onChangeText={(text) => updateField('password', text)}
                placeholder={t('auth.passwordPlaceholder')}
                secureTextEntry
                leftIcon="lock-closed-outline"
                error={errors.password}
                editable={!isLoading}
              />

              <Input
                label={t('auth.confirmPassword')}
                value={formData.confirmPassword}
                onChangeText={(text) => updateField('confirmPassword', text)}
                placeholder={t('auth.confirmPasswordPlaceholder')}
                secureTextEntry
                leftIcon="lock-closed-outline"
                error={errors.confirmPassword}
                editable={!isLoading}
              />

              {/* Create Account Button with Spinner */}
              <Button
                title={t('auth.createAccount')}
                onPress={handleRegister}
                loading={isLoading} 
                disabled={isLoading}
                style={styles.registerButton}
              />

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>
                  {t('auth.alreadyHaveAccount')}{' '}
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Login')}
                  disabled={isLoading}
                >
                  <Text style={styles.loginLink}>{t('auth.signIn')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer Quote */}
            <View style={styles.footerQuote}>
              <Text style={styles.quoteText}>{t('quotes.prayer1')}</Text>
              <Text style={styles.quoteReference}>
                {t('quotes.prayer1Ref')}
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  // Removed container since ScreenLayout handles bg
  
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    // Removed transparent bg
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0FFF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  languageSection: {
    marginBottom: 24,
  },
  languageLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  languageButtons: {
    gap: 12,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 249, 250, 0.8)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageButtonActive: {
    backgroundColor: 'rgba(240, 255, 244, 0.9)',
    borderColor: '#00A86B',
  },
  languageFlag: {
    fontSize: 28,
    marginRight: 12,
  },
  languageName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  languageNameActive: {
    color: '#00A86B',
    fontWeight: '600',
  },
  form: {
    width: '100%',
  },
  registerButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    fontSize: 14,
    color: '#00A86B',
    fontWeight: '600',
  },
  footerQuote: {
    marginTop: 24,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  quoteText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 8,
  },
  quoteReference: {
    fontSize: 12,
    color: '#0D9488',
    fontWeight: '600',
  },
});