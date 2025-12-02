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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';

export const EditProfileScreen = ({ navigation }) => {
  const { user, updateProfile, isLoading } = useAuthStore();
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    location: '',
    preferred_language: 'en',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        location: user.location || '',
        preferred_language: user.preferred_language || 'en',
      });
    }
  }, [user]);

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Full Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={formData.full_name}
            onChangeText={(text) => setFormData({ ...formData, full_name: text })}
            placeholder="Enter your full name"
            placeholderTextColor="#999"
          />
        </View>

        {/* Phone */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            placeholder="+1234567890"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
          />
        </View>

        {/* Location */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            value={formData.location}
            onChangeText={(text) => setFormData({ ...formData, location: text })}
            placeholder="City, Country"
            placeholderTextColor="#999"
          />
        </View>

        {/* Language */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Preferred Language</Text>
          <View style={styles.languageButtons}>
            <TouchableOpacity
              style={[
                styles.languageButton,
                formData.preferred_language === 'en' && styles.languageButtonActive,
              ]}
              onPress={() => setFormData({ ...formData, preferred_language: 'en' })}
            >
              <Text
                style={[
                  styles.languageButtonText,
                  formData.preferred_language === 'en' && styles.languageButtonTextActive,
                ]}
              >
                English
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.languageButton,
                formData.preferred_language === 'tr' && styles.languageButtonActive,
              ]}
              onPress={() => setFormData({ ...formData, preferred_language: 'tr' })}
            >
              <Text
                style={[
                  styles.languageButtonText,
                  formData.preferred_language === 'tr' && styles.languageButtonTextActive,
                ]}
              >
                Türkçe
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F8F9FA',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: '#FFF',
      borderBottomWidth: 1,
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
    
    // Edit Profile
    inputGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: '#666',
      marginBottom: 8,
    },
    input: {
      backgroundColor: '#FFF',
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: '#1A1A1A',
      borderWidth: 1,
      borderColor: '#E0E0E0',
    },
    languageButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    languageButton: {
      flex: 1,
      padding: 16,
      borderRadius: 12,
      backgroundColor: '#FFF',
      borderWidth: 2,
      borderColor: '#E0E0E0',
      alignItems: 'center',
    },
    languageButtonActive: {
      borderColor: '#00A86B',
      backgroundColor: '#F0FFF4',
    },
    languageButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#666',
    },
    languageButtonTextActive: {
      color: '#00A86B',
    },
    saveButton: {
      backgroundColor: '#00A86B',
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 20,
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonText: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
  });