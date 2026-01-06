// ============================================================================
// FILE: src/services/languageManager.js (IMPROVED WITH BETTER SYNC)
// ============================================================================
import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';

const { WidgetDataManager } = NativeModules;

class LanguageManager {
  LANGUAGE_KEY = '@app:language';
  isInitialized = false;

  /**
   * Initialize language and sync with widgets
   */
  async initialize() {
    try {
      console.log('🌐 Language Manager: Starting initialization...');
      
      // Read from AsyncStorage
      const savedLanguage = await AsyncStorage.getItem(this.LANGUAGE_KEY);
      console.log('📖 Saved language from AsyncStorage:', savedLanguage);
      
      if (savedLanguage) {
        // Change i18n language
        await i18n.changeLanguage(savedLanguage);
        console.log('✓ i18n language set to:', savedLanguage);
        
        // Sync to widgets
        await this.syncLanguageToWidgets(savedLanguage);
      } else {
        // No saved language, use default 'en'
        console.log('⚠️  No saved language, using default: en');
        await this.changeLanguage('en');
      }
      
      this.isInitialized = true;
      console.log('✅ Language Manager Initialized:', i18n.language);
    } catch (error) {
      console.error('❌ Language Manager initialization error:', error);
      // Fallback to English on error
      try {
        await i18n.changeLanguage('en');
        await this.syncLanguageToWidgets('en');
      } catch (fallbackError) {
        console.error('❌ Fallback language initialization failed:', fallbackError);
      }
    }
  }

  /**
   * Change app language and sync to widgets
   */
  async changeLanguage(language) {
    try {
      console.log('🌐 Language Manager: Changing language to:', language);

      // 1. Change i18n language
      await i18n.changeLanguage(language);
      console.log('  ✓ i18n language changed to:', i18n.language);

      // 2. Save to AsyncStorage (as plain string, not JSON)
      await AsyncStorage.setItem(this.LANGUAGE_KEY, language);
      console.log('  ✓ Language saved to AsyncStorage');

      // 3. Sync to widgets
      await this.syncLanguageToWidgets(language);
      console.log('  ✓ Language synced to widgets');

      console.log('✅ Language fully changed to:', language);
      return { success: true };
    } catch (error) {
      console.error('❌ Error changing language:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync current language to widgets via UserDefaults
   */
  async syncLanguageToWidgets(language) {
    if (Platform.OS !== 'ios') {
      console.log('⚠️  Widget language sync only available on iOS');
      return;
    }

    if (!WidgetDataManager) {
      console.error('❌ WidgetDataManager not available');
      return;
    }

    try {
      console.log('📱 Syncing language to widgets:', language);
      
      // Save language to shared UserDefaults
      WidgetDataManager.saveLanguage(language);
      console.log('  ✓ Language saved to UserDefaults');

      // Add a small delay to ensure UserDefaults write is complete
      await new Promise(resolve => setTimeout(resolve, 150));

      // Reload all widgets to apply new language
      WidgetDataManager.reloadAllWidgets();
      console.log('  ✓ All widgets reloaded');

      console.log('✅ Language synced to widgets successfully');
    } catch (error) {
      console.error('❌ Error syncing language to widgets:', error);
    }
  }

  /**
   * Get current language
   */
  getCurrentLanguage() {
    return i18n.language || 'en';
  }

  /**
   * Get available languages
   */
  getAvailableLanguages() {
    return [
      { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
      { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
      { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
    ];
  }


  async forceSyncWidgets() {
    const currentLanguage = this.getCurrentLanguage();
    console.log('🔄 Force syncing widgets with language:', currentLanguage);
    await this.syncLanguageToWidgets(currentLanguage);
  }
}

export default new LanguageManager();