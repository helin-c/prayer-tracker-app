// @ts-nocheck
// ============================================================================
// FILE: src/screens/auth/LoginScreen.jsx (PRODUCTION READY)
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
      // Success handled by auth store (navigation usually happens in AppNavigator based on user state)
    } else {
      Alert.alert(
        t('auth.errors.loginFailed'),
        result.error || t('auth.errors.invalidCredentials')
      );
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
                editable={!isLoading} // Disable input while loading
              />

              <Input
                label={t('auth.password')}
                value={formData.password}
                onChangeText={(text) => updateField('password', text)}
                placeholder={t('auth.passwordPlaceholder')}
                secureTextEntry
                leftIcon="lock-closed-outline"
                error={errors.password}
                editable={!isLoading} // Disable input while loading
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
                loading={isLoading} // Uses internal ActivityIndicator
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', 
  },
  
  keyboardView: {
    flex: 1,
  },

  // 2. Scroll İçeriği: Kartı ekranın ortasına hizalar
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center', // Dikeyde ortala
  },

  // 3. Login Kartı: Formun olduğu beyaz alan
  card: {
    // Hafif saydam beyaz arka plan (Arkadaki resim çok hafif hissedilir)
    backgroundColor: 'rgba(255, 255, 255, 0.92)', 
    borderRadius: 24,
    padding: 24,
    paddingTop: 32,
    
    // Gölge Efektleri (Kartın havada durması için)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10, // Android için
  },

  // 4. Header Bölümü (Logo + Başlıklar)
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0FFF4', // Mint yeşilinin çok açığı
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    
    // Logo içine hafif gölge
    shadowColor: '#00A86B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800', // Extra Bold
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

  // 5. Form Alanı
  form: {
    width: '100%',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -4, // Input'un altına biraz yaklaştır
    marginBottom: 24,
    padding: 4, // Tıklama alanını genişlet
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#00A86B',
    fontWeight: '600',
  },
  loginButton: {
    marginBottom: 24,
    height: 56, // Sabit yükseklik (spinner dönünce zıplamasın diye)
    borderRadius: 16,
    shadowColor: '#00A86B', // Buton gölgesi (renkli)
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  // 6. Kayıt Ol Linki
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

  // 7. Alt Kısımdaki Söz (Footer Quote)
  footerQuote: {
    marginTop: 40,
    alignItems: 'center',
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)', // Çok hafif ayırıcı çizgi
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