// ============================================================================
// FILE: src/utils/storageCleanup.js
// ============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './constants';

/**
 * Clean up corrupted storage data
 * Run this once if users are experiencing storage issues
 */
export const cleanupCorruptedStorage = async () => {
  console.log('Starting storage cleanup...');
  
  try {
    // Get all keys
    const allKeys = await AsyncStorage.getAllKeys();
    
    // Check each key for corruption
    for (const key of allKeys) {
      try {
        const value = await AsyncStorage.getItem(key);
        
        if (value === null) continue;
        
        // Try to parse if it's supposed to be JSON
        if (key === STORAGE_KEYS.USER_DATA) {
          // This should be JSON
          try {
            JSON.parse(value);
            console.log(`✓ ${key} is valid`);
          } catch (error) {
            console.log(`✗ ${key} is corrupted, removing...`);
            await AsyncStorage.removeItem(key);
          }
        } else if (
          key === STORAGE_KEYS.ACCESS_TOKEN ||
          key === STORAGE_KEYS.REFRESH_TOKEN ||
          key === STORAGE_KEYS.LANGUAGE
        ) {
          // These should be plain strings
          if (typeof value === 'string' && value.length > 0) {
            console.log(`✓ ${key} is valid`);
          } else {
            console.log(`✗ ${key} is invalid, removing...`);
            await AsyncStorage.removeItem(key);
          }
        }
      } catch (error) {
        console.error(`Error checking ${key}:`, error);
        // If we can't even check it, remove it
        await AsyncStorage.removeItem(key);
      }
    }
    
    console.log('Storage cleanup completed!');
    return { success: true };
  } catch (error) {
    console.error('Storage cleanup error:', error);
    return { success: false, error };
  }
};

/**
 * Verify storage integrity
 * Returns status of each storage key
 */
export const verifyStorage = async () => {
  const status = {
    accessToken: 'missing',
    refreshToken: 'missing',
    userData: 'missing',
    language: 'missing',
  };

  try {
    // Check access token
    const accessToken = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (accessToken) {
      status.accessToken = typeof accessToken === 'string' ? 'valid' : 'corrupted';
    }

    // Check refresh token
    const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (refreshToken) {
      status.refreshToken = typeof refreshToken === 'string' ? 'valid' : 'corrupted';
    }

    // Check user data
    const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    if (userData) {
      try {
        JSON.parse(userData);
        status.userData = 'valid';
      } catch {
        status.userData = 'corrupted';
      }
    }

    // Check language
    const language = await AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE);
    if (language) {
      status.language = typeof language === 'string' ? 'valid' : 'corrupted';
    }

    return status;
  } catch (error) {
    console.error('Verify storage error:', error);
    return status;
  }
};

/**
 * Clear all app data (useful for logout/reset)
 */
export const clearAllAppData = async () => {
  try {
    const appKeys = [
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER_DATA,
      STORAGE_KEYS.LANGUAGE,
      STORAGE_KEYS.TASBIH_SESSIONS,
    ];
    
    await AsyncStorage.multiRemove(appKeys);
    console.log('All app data cleared');
    return { success: true };
  } catch (error) {
    console.error('Clear app data error:', error);
    return { success: false, error };
  }
};