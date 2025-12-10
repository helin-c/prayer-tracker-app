
import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  
  async setItem(key, value) {
    try {
      const stringValue = typeof value === 'string' 
        ? value 
        : JSON.stringify(value);
      
      await AsyncStorage.setItem(key, stringValue);
    } catch (error) {
      console.error(`Storage setItem error for key "${key}":`, error);
      throw error;
    }
  },

  async getItem(key) {
    try {
      const value = await AsyncStorage.getItem(key);
      
      if (value === null) {
        return null;
      }

      try {
        return JSON.parse(value);
      } catch (parseError) {

        return value;
      }
    } catch (error) {
      console.error(`Storage getItem error for key "${key}":`, error);
      return null;
    }
  },


  async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Storage removeItem error for key "${key}":`, error);
      throw error;
    }
  },


  async clear() {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Storage clear error:', error);
      throw error;
    }
  },


  async multiGet(keys) {
    try {
      const results = await AsyncStorage.multiGet(keys);
      
      return results.reduce((acc, [key, value]) => {
        if (value !== null) {
          try {
            acc[key] = JSON.parse(value);
          } catch {
            acc[key] = value;
          }
        } else {
          acc[key] = null;
        }
        return acc;
      }, {});
    } catch (error) {
      console.error('Storage multiGet error:', error);
      return {};
    }
  },

  async multiRemove(keys) {
    try {
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Storage multiRemove error:', error);
      throw error;
    }
  },

  async getAllKeys() {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Storage getAllKeys error:', error);
      return [];
    }
  },
};