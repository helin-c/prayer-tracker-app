// ============================================================================
// FILE: src/screens/auth/LoginScreen.jsx (FIXED ERROR MESSAGES)
// ============================================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Button, Input } from '../../components/common';

import { useAuthStore, selectAuthIsLoading } from '../../store/authStore';

import { ScreenLayout } from '../../components/layout/ScreenLayout';

export const LoginScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});

  const isLoading = useAuthStore(selectAuthIsLoading);
  const login = useAuthStore((state) => state.login);

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: '' });
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
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ NEW: Translate backend error messages
  const translateError = (errorMessage) => {
    if (!errorMessage) return t('auth.errors.invalidCredentials');

    const errorLower = errorMessage.toLowerCase();

    // Map common backend errors to translation keys
    if (errorLower.includes('incorrect email') || 
        errorLower.includes('incorrect password') ||
        errorLower.includes('invalid credentials') ||
        errorLower.includes('email or password')) {
      return t('auth.errors.invalidCredentials');
    }

    if (errorLower.includes('user not found') || 
        errorLower.includes('account not found')) {
      return t('auth.errors.userNotFound');
    }

    if (errorLower.includes('account disabled') || 
        errorLower.includes('account suspended')) {
      return t('auth.errors.accountDisabled');
    }

    if (errorLower.includes('network') || 
        errorLower.includes('connection')) {
      return t('auth.errors.networkError');
    }

    if (errorLower.includes('server error') || 
        errorLower.includes('internal error')) {
      return t('auth.errors.serverError');
    }

    // If no match found, return the original message
    // (in case it's already translated or a specific error)
    return errorMessage;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    const cleanData = {
      email: formData.email.toLowerCase().trim(),
      password: formData.password,
    };

    const result = await login(cleanData);

    if (result.success) {
      // Navigation handled by authStore
    } else {
      // ✅ Translate the error message
      const translatedError = translateError(result.error);
      
      Alert.alert(
        t('auth.errors.loginFailed'),
        translatedError
      );
    }
  };

  return (
    <ScreenLayout>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={20}
        keyboardOpeningTime={0}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="moon" size={50} color="#00A86B" />
            </View>
            <Text style={styles.title}>{t('auth.welcomeBack')}</Text>
            <Text style={styles.subtitle}>{t('auth.signInToContinue')}</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label={t('auth.emailAddress')}
              value={formData.email}
              onChangeText={(text) => updateField('email', text)}
              placeholder={t('auth.emailPlaceholder')}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail-outline"
              error={errors.email}
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

            {/* Forgot Password Button */}
            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => navigation.navigate('ForgotPassword')}
              disabled={isLoading}
            >
              <Text style={styles.forgotPasswordText}>
                {t('auth.forgotPassword')}
              </Text>
            </TouchableOpacity>

            {/* Login Button */}
            <Button
              title={t('auth.signIn')}
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
              style={styles.loginButton}
            />

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>
                {t('auth.dontHaveAccount')}{' '}
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Register')}
                disabled={isLoading}
              >
                <Text style={styles.registerLink}>{t('auth.signUp')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer Quote */}
          <View style={styles.footerQuote}>
            <Text style={styles.quoteText}>{t('quotes.prayer2')}</Text>
            <Text style={styles.quoteReference}>
              {t('quotes.prayer2Ref')}
            </Text>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },

  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 24,
    padding: 24,
    paddingTop: 32,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },

  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0FFF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,

    shadowColor: '#00A86B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },

  form: {
    width: '100%',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -4,
    marginBottom: 24,
    padding: 4,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#00A86B',
    fontWeight: '600',
  },
  loginButton: {
    marginBottom: 24,
    height: 56,
    borderRadius: 16,
    shadowColor: '#00A86B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  registerText: {
    fontSize: 15,
    color: '#666',
  },
  registerLink: {
    fontSize: 15,
    color: '#00A86B',
    fontWeight: '700',
  },

  footerQuote: {
    marginTop: 40,
    alignItems: 'center',
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 20,
  },
  quoteText: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 18,
  },
  quoteReference: {
    fontSize: 12,
    color: '#00A86B',
    fontWeight: '600',
    opacity: 0.8,
  },
});