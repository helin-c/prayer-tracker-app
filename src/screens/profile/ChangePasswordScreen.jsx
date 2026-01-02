// @ts-nocheck
// ============================================================================
// FILE: src/screens/profile/ChangePasswordScreen.jsx
// ============================================================================
import React, { useState } from 'react';
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
import { userAPI } from '../../api/backend';

// IMPORT THE LAYOUT
import { ScreenLayout } from '../../components/layout/ScreenLayout';

export const ChangePasswordScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const validateForm = () => {
    const newErrors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };
    let isValid = true;

    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = t('profile.currentPasswordRequired');
      isValid = false;
    }

    if (!formData.newPassword.trim()) {
      newErrors.newPassword = t('profile.newPasswordRequired');
      isValid = false;
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = t('profile.passwordMinLength');
      isValid = false;
    } else if (formData.newPassword === formData.currentPassword) {
      newErrors.newPassword = t('profile.passwordMustBeDifferent');
      isValid = false;
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = t('profile.confirmPasswordRequired');
      isValid = false;
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = t('profile.passwordsDoNotMatch');
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await userAPI.changePassword({
        current_password: formData.currentPassword,
        new_password: formData.newPassword,
      });

      Alert.alert(
        t('common.success'),
        t('profile.passwordChangedSuccess'),
        [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      let errorMessage = t('profile.passwordChangeFailed');
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (detail.includes('incorrect')) {
          errorMessage = t('profile.currentPasswordIncorrect');
        } else if (detail.includes('different')) {
          errorMessage = t('profile.passwordMustBeDifferent');
        } else {
          errorMessage = detail;
        }
      }
      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return null;
    if (password.length < 8) return { label: t('profile.weak'), color: '#DC2626', width: '33%' };
    if (password.length < 12) return { label: t('profile.medium'), color: '#F59E0B', width: '66%' };
    return { label: t('profile.strong'), color: '#10B981', width: '100%' };
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  return (
    <ScreenLayout noPaddingBottom={true}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButtonWrapper}
            onPress={() => navigation.goBack()}
            disabled={isLoading}
          >
            <LinearGradient
              colors={[]}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('profile.changePassword')}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Info Card */}
        <View style={styles.infoCardWrapper}>
          <LinearGradient
            colors={['rgba(240, 255, 244, 0.7)', 'rgba(240, 255, 244, 0.6)']}
            style={styles.infoCard}
          >
            <View style={styles.infoIconWrapper}>
              <LinearGradient
                colors={['#5BA895', '#4A9B87']}
                style={styles.infoIconGradient}
              >
                <Ionicons name="shield-checkmark" size={32} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.infoTitle}>{t('profile.secureYourAccount')}</Text>
            <Text style={styles.infoText}>
              {t('profile.changePasswordDescription')}
            </Text>
          </LinearGradient>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Current Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('profile.currentPassword')}</Text>
            <View style={styles.inputCardWrapper}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.95)']}
                style={[styles.inputWrapper, errors.currentPassword && styles.inputError]}
              >
                <Ionicons name="lock-closed-outline" size={20} color="#5BA895" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('profile.enterCurrentPassword')}
                  placeholderTextColor="#999"
                  value={formData.currentPassword}
                  onChangeText={(text) => {
                    setFormData({ ...formData, currentPassword: text });
                    setErrors({ ...errors, currentPassword: '' });
                  }}
                  secureTextEntry={!showCurrentPassword}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  style={styles.eyeIcon}
                  disabled={isLoading}
                >
                  <Ionicons
                    name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#5BA895"
                  />
                </TouchableOpacity>
              </LinearGradient>
            </View>
            {errors.currentPassword ? (
              <Text style={styles.errorText}>{errors.currentPassword}</Text>
            ) : null}
          </View>

          {/* New Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('profile.newPassword')}</Text>
            <View style={styles.inputCardWrapper}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.95)']}
                style={[styles.inputWrapper, errors.newPassword && styles.inputError]}
              >
                <Ionicons name="lock-closed-outline" size={20} color="#5BA895" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('profile.enterNewPassword')}
                  placeholderTextColor="#999"
                  value={formData.newPassword}
                  onChangeText={(text) => {
                    setFormData({ ...formData, newPassword: text });
                    setErrors({ ...errors, newPassword: '' });
                  }}
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  style={styles.eyeIcon}
                  disabled={isLoading}
                >
                  <Ionicons
                    name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#5BA895"
                  />
                </TouchableOpacity>
              </LinearGradient>
            </View>
            {errors.newPassword ? (
              <Text style={styles.errorText}>{errors.newPassword}</Text>
            ) : null}
            
            {/* Strength Indicator */}
            {passwordStrength && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBar}>
                  <View style={[styles.strengthFill, { 
                    width: passwordStrength.width, 
                    backgroundColor: passwordStrength.color 
                  }]} />
                </View>
                <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                  {passwordStrength.label}
                </Text>
              </View>
            )}
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('profile.confirmNewPassword')}</Text>
            <View style={styles.inputCardWrapper}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.95)']}
                style={[styles.inputWrapper, errors.confirmPassword && styles.inputError]}
              >
                <Ionicons name="lock-closed-outline" size={20} color="#5BA895" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('profile.confirmNewPassword')}
                  placeholderTextColor="#999"
                  value={formData.confirmPassword}
                  onChangeText={(text) => {
                    setFormData({ ...formData, confirmPassword: text });
                    setErrors({ ...errors, confirmPassword: '' });
                  }}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                  disabled={isLoading}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#5BA895"
                  />
                </TouchableOpacity>
              </LinearGradient>
            </View>
            {errors.confirmPassword ? (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            ) : null}
          </View>

          {/* Requirements */}
          <View style={styles.requirementsCardWrapper}>
            <LinearGradient
              colors={['rgba(240, 255, 244, 0.7)', 'rgba(240, 255, 244, 0.6)']}
              style={styles.requirementsCard}
            >
              <Text style={styles.requirementsTitle}>{t('profile.passwordRequirements')}</Text>
              <View style={styles.requirementsList}>
                <View style={styles.requirementItem}>
                  <Ionicons 
                    name={formData.newPassword.length >= 8 ? 'checkmark-circle' : 'ellipse-outline'} 
                    size={18} 
                    color={formData.newPassword.length >= 8 ? '#5BA895' : '#999'} 
                  />
                  <Text style={styles.requirementText}>{t('profile.atLeast8Characters')}</Text>
                </View>
                <View style={styles.requirementItem}>
                  <Ionicons 
                    name={formData.newPassword !== formData.currentPassword && formData.newPassword ? 'checkmark-circle' : 'ellipse-outline'} 
                    size={18} 
                    color={formData.newPassword !== formData.currentPassword && formData.newPassword ? '#5BA895' : '#999'} 
                  />
                  <Text style={styles.requirementText}>{t('profile.differentFromCurrent')}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitButtonWrapper}
          onPress={handleChangePassword}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isLoading ? ['#999', '#777'] : ['#5BA895', '#4A9B87']}
            style={styles.submitButton}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />
                <Text style={styles.submitText}>{t('profile.changePassword')}</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButtonWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    flex: 1,
    textAlign: 'center',
  },
  
  // Info Card
  infoCardWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  infoCard: {
    padding: 24,
    alignItems: 'center',
  },
  infoIconWrapper: {
    borderRadius: 35,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  infoIconGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1A1A1A',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '600',
  },
  
  // Form
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  inputCardWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
  },
  inputError: {
    borderWidth: 2,
    borderColor: '#DC2626',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '600',
  },
  
  // Strength Indicator
  strengthContainer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  strengthBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 3,
  },
  strengthLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  
  // Requirements Card
  requirementsCardWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  requirementsCard: {
    padding: 16,
  },
  requirementsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  requirementsList: {
    gap: 10,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  requirementText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  
  // Submit Button
  submitButtonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#2D6856',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    height: 56,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});