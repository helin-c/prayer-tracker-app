// ============================================================================
// FILE: src/screens/auth/ForgotPasswordScreen.jsx
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
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '../../components/common';
import { ScreenLayout } from '../../components/layout/ScreenLayout';
import api from '../../api/backend';

export const ForgotPasswordScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1); // 1: Email, 2: Token, 3: New Password
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    token: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState({});

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: '' });
  };

  // ============================================================================
  // STEP 1: Request Reset Token
  // ============================================================================
  const handleRequestReset = async () => {
    if (!formData.email.trim()) {
      setErrors({ email: t('auth.errors.emailRequired') });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setErrors({ email: t('auth.errors.emailInvalid') });
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/auth/forgot-password', {
        email: formData.email.toLowerCase().trim(),
      });

      Alert.alert(
        t('auth.resetPassword.emailSent'),
        t('auth.resetPassword.checkEmail'),
        [{ text: 'OK', onPress: () => setStep(2) }]
      );
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error.response?.data?.detail || t('auth.errors.resetFailed')
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // STEP 2: Verify Token
  // ============================================================================
  const handleVerifyToken = async () => {
    if (!formData.token.trim()) {
      setErrors({ token: t('auth.resetPassword.tokenRequired') });
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/auth/verify-reset-token', {
        email: formData.email.toLowerCase().trim(),
        token: formData.token.trim(),
      });

      setStep(3);
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error.response?.data?.detail || t('auth.resetPassword.invalidToken')
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // STEP 3: Reset Password
  // ============================================================================
  const handleResetPassword = async () => {
    const newErrors = {};

    if (!formData.newPassword) {
      newErrors.newPassword = t('auth.errors.passwordRequired');
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = t('auth.errors.passwordTooShort');
    }

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.errors.passwordMismatch');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/auth/reset-password', {
        email: formData.email.toLowerCase().trim(),
        token: formData.token.trim(),
        new_password: formData.newPassword,
      });

      Alert.alert(
        t('common.success'),
        t('auth.resetPassword.passwordResetSuccess'),
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error.response?.data?.detail || t('auth.errors.resetFailed')
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
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
          <View style={styles.card}>
            {/* Header */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                if (step > 1) {
                  setStep(step - 1);
                } else {
                  navigation.goBack();
                }
              }}
              disabled={isLoading}
            >
              <Ionicons name="arrow-back" size={24} color="#00A86B" />
            </TouchableOpacity>

            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name="lock-closed" size={40} color="#00A86B" />
              </View>
              <Text style={styles.title}>
                {t('auth.resetPassword.title')}
              </Text>
              <Text style={styles.subtitle}>
                {step === 1 && t('auth.resetPassword.step1Subtitle')}
                {step === 2 && t('auth.resetPassword.step2Subtitle')}
                {step === 3 && t('auth.resetPassword.step3Subtitle')}
              </Text>
            </View>

            {/* Step Indicator */}
            <View style={styles.stepIndicator}>
              {[1, 2, 3].map((s) => (
                <View
                  key={s}
                  style={[
                    styles.stepDot,
                    s === step && styles.stepDotActive,
                    s < step && styles.stepDotCompleted,
                  ]}
                />
              ))}
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* STEP 1: Email */}
              {step === 1 && (
                <>
                  <Input
                    label={t('auth.emailAddress')}
                    value={formData.email}
                    onChangeText={(text) => updateField('email', text)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    leftIcon="mail-outline"
                    error={errors.email}
                    editable={!isLoading}
                  />

                  <Button
                    title={t('auth.resetPassword.sendCode')}
                    onPress={handleRequestReset}
                    loading={isLoading}
                    disabled={isLoading}
                    style={styles.button}
                  />
                </>
              )}

              {/* STEP 2: Token */}
              {step === 2 && (
                <>
                  <Text style={styles.emailDisplay}>
                    {formData.email}
                  </Text>

                  <Input
                    label={t('auth.resetPassword.resetCode')}
                    value={formData.token}
                    onChangeText={(text) => updateField('token', text)}
                    placeholder={t('auth.resetPassword.enterCode')}
                    autoCapitalize="none"
                    leftIcon="key-outline"
                    error={errors.token}
                    editable={!isLoading}
                  />

                  <TouchableOpacity
                    style={styles.resendButton}
                    onPress={handleRequestReset}
                    disabled={isLoading}
                  >
                    <Text style={styles.resendText}>
                      {t('auth.resetPassword.resendCode')}
                    </Text>
                  </TouchableOpacity>

                  <Button
                    title={t('common.continue')}
                    onPress={handleVerifyToken}
                    loading={isLoading}
                    disabled={isLoading}
                    style={styles.button}
                  />
                </>
              )}

              {/* STEP 3: New Password */}
              {step === 3 && (
                <>
                  <Input
                    label={t('auth.newPassword')}
                    value={formData.newPassword}
                    onChangeText={(text) => updateField('newPassword', text)}
                    placeholder={t('auth.passwordPlaceholder')}
                    secureTextEntry
                    leftIcon="lock-closed-outline"
                    error={errors.newPassword}
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

                  <Button
                    title={t('auth.resetPassword.resetPassword')}
                    onPress={handleResetPassword}
                    loading={isLoading}
                    disabled={isLoading}
                    style={styles.button}
                  />
                </>
              )}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                {t('auth.rememberPassword')}{' '}
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                disabled={isLoading}
              >
                <Text style={styles.footerLink}>
                  {t('auth.signIn')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
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
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    padding: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0FFF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    gap: 8,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E0E0E0',
  },
  stepDotActive: {
    backgroundColor: '#00A86B',
    width: 30,
  },
  stepDotCompleted: {
    backgroundColor: '#00A86B',
  },
  form: {
    width: '100%',
  },
  emailDisplay: {
    fontSize: 14,
    color: '#00A86B',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#F0FFF4',
    borderRadius: 8,
  },
  button: {
    marginTop: 16,
    height: 56,
    borderRadius: 16,
  },
  resendButton: {
    alignSelf: 'center',
    marginTop: 12,
    padding: 8,
  },
  resendText: {
    fontSize: 14,
    color: '#00A86B',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  footerLink: {
    fontSize: 14,
    color: '#00A86B',
    fontWeight: '700',
  },
});