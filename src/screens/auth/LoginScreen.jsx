// ============================================================================
// FILE: src/screens/auth/LoginScreen.jsx (WITH BACKGROUND & LOADING)
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
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { Button, Input } from '../../components/common';
import { IslamicLoadingScreen } from '../../components/loading/IslamicLoadingScreen';

export const LoginScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});

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

  // Show loading screen when authenticating
  if (isLoading) {
    return (
      <IslamicLoadingScreen
        message={t('auth.signingIn')}
        submessage={t('auth.pleaseWait')}
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
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

                <TouchableOpacity style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>
                    {t('auth.forgotPassword')}
                  </Text>
                </TouchableOpacity>

                <Button
                  title={t('auth.signIn')}
                  onPress={handleLogin}
                  loading={isLoading}
                  style={styles.loginButton}
                />

                <View style={styles.registerContainer}>
                  <Text style={styles.registerText}>{t('auth.dontHaveAccount')} </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                    <Text style={styles.registerLink}>{t('auth.signUp')}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Footer Quote */}
              <View style={styles.footerQuote}>
                <Text style={styles.quoteText}>{t('quotes.prayer2')}</Text>
                <Text style={styles.quoteReference}>{t('quotes.prayer2Ref')}</Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
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
  form: {
    width: '100%',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#00A86B',
    fontWeight: '600',
  },
  loginButton: {
    marginBottom: 24,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
    color: '#666',
  },
  registerLink: {
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