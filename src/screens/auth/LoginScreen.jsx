// @ts-nocheck
// ============================================================================
// FILE: src/screens/auth/LoginScreen.jsx (PRODUCTION READY)
// ============================================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView, // <-- Added
  Platform,             // <-- Added
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

export const LoginScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});

  // isLoading now controls the button spinner, not full screen loading
  const { login, isLoading } = useAuthStore();

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

  const handleLogin = async () => {
    if (!validateForm()) return;

    const cleanData = {
      email: formData.email.toLowerCase().trim(),
      password: formData.password,
    };

    const result = await login(cleanData);

    if (result.success) {
      // Success handled by auth store
    } else {
      Alert.alert(
        t('auth.errors.loginFailed'),
        result.error || t('auth.errors.invalidCredentials')
      );
    }
  };

  return (
    // WRAPPED IN SCREEN LAYOUT
    <ScreenLayout>
      {/* KEYBOARD AVOIDING VIEW WRAPPER */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled" // Allows pressing button while keyboard is open
          showsVerticalScrollIndicator={false}
        >
          {/* Header with semi-transparent card */}
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

              <TouchableOpacity
                style={styles.forgotPassword}
                disabled={isLoading}
              >
                <Text style={styles.forgotPasswordText}>
                  {t('auth.forgotPassword')}
                </Text>
              </TouchableOpacity>

              {/* Login Button with Spinner */}
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
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  // Removed container logic since Layout handles it
  
  keyboardView: {
    flex: 1,
  },

  // Scroll Content: Centers the card vertically
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center', 
  },

  // Login Card: Semi-transparent white to show background subtly
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)', 
    borderRadius: 24,
    padding: 24,
    paddingTop: 32,
    
    // Shadow Effects
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10, 
  },

  // Header Section
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

  // Form Section
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

  // Register Link
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

  // Footer Quote
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