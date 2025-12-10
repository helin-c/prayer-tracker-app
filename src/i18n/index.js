// ============================================================================
// FILE: src/i18n/index.js
// ============================================================================
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translations
import en from './locales/en.json';
import tr from './locales/tr.json';
import ar from './locales/ar.json';

const LANGUAGE_KEY = '@app:language';

// Language detector
const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (callback) => {
    try {
      const language = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (language) {
        // Language is stored as plain string, no need to parse
        return callback(language);
      }
      // Default to English if no language is stored
      return callback('en');
    } catch (error) {
      console.error('Error reading language', error);
      return callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (language) => {
    try {
      // Store as plain string, not JSON
      await AsyncStorage.setItem(LANGUAGE_KEY, language);
    } catch (error) {
      console.error('Error saving language', error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      tr: { translation: tr },
      ar: { translation: ar },
    },
    fallbackLng: 'en',
    debug: false, // Set to false to reduce logs
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;