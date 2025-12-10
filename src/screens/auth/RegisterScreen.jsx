// ============================================================================
// FILE: src/screens/auth/RegisterScreen.jsx (WITH i18n)
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { Button, Input } from '../../components/common';

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

  const { register, isLoading } = useAuthStore();

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: '' });
  };

  const handleLanguageSelect = (langCode) => {
    updateField('preferred_language', langCode);
    // Optionally change app language immediately
    i18n.changeLanguage(langCode);
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = t('auth.errors.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('auth.errors.emailInvalid');
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = t('auth.errors.passwordRequired');
    } else if (formData.password.length < 8) {
      newErrors.password = t('auth.errors.passwordMinLength');
    }

    // Confirm password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.errors.passwordsNotMatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    const { confirmPassword, ...registerData } = formData;
    
    // Clean up data
    const cleanData = {
      ...registerData,
      email: registerData.email.toLowerCase().trim(),
    };

    const result = await register(cleanData);

    if (result.success) {
      Alert.alert(t('common.success'), t('auth.accountCreated'));
      // Auto-login after successful registration
      navigation.navigate('Login');
    } else {
      Alert.alert(t('auth.errors.registerFailed'), result.error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
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
            <Text style={styles.languageLabel}>{t('auth.selectLanguage')}</Text>
            <View style={styles.languageButtons}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageButton,
                    formData.preferred_language === lang.code && styles.languageButtonActive,
                  ]}
                  onPress={() => handleLanguageSelect(lang.code)}
                >
                  <Text style={styles.languageFlag}>{lang.flag}</Text>
                  <Text
                    style={[
                      styles.languageName,
                      formData.preferred_language === lang.code && styles.languageNameActive,
                    ]}
                  >
                    {lang.name}
                  </Text>
                  {formData.preferred_language === lang.code && (
                    <Ionicons name="checkmark-circle" size={20} color="#00A86B" />
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
            />

            <Input
              label={t('auth.fullNameOptional')}
              value={formData.full_name}
              onChangeText={(text) => updateField('full_name', text)}
              placeholder={t('auth.fullNamePlaceholder')}
              leftIcon="person-outline"
              autoCapitalize="words"
            />

            <Input
              label={t('auth.password')}
              value={formData.password}
              onChangeText={(text) => updateField('password', text)}
              placeholder={t('auth.passwordPlaceholder')}
              secureTextEntry
              leftIcon="lock-closed-outline"
              error={errors.password}
            />

            <Input
              label={t('auth.confirmPassword')}
              value={formData.confirmPassword}
              onChangeText={(text) => updateField('confirmPassword', text)}
              placeholder={t('auth.confirmPasswordPlaceholder')}
              secureTextEntry
              leftIcon="lock-closed-outline"
              error={errors.confirmPassword}
            />

            <Button
              title={t('auth.createAccount')}
              onPress={handleRegister}
              loading={isLoading}
              style={styles.registerButton}
            />

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>{t('auth.alreadyHaveAccount')} </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>{t('auth.signIn')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer Quote */}
          <View style={styles.footerQuote}>
            <Text style={styles.quoteText}>{t('quotes.prayer1')}</Text>
            <Text style={styles.quoteReference}>{t('quotes.prayer1Ref')}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
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
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageButtonActive: {
    backgroundColor: '#F0FFF4',
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
    marginTop: 32,
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