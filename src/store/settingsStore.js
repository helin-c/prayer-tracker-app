import { create } from 'zustand';
import { storage } from '../services/storage';
import { STORAGE_KEYS } from '../utils/constants';

export const useSettingsStore = create((set) => ({
  isDarkMode: false,
  language: 'en',

  initialize: async () => {
    const theme = await storage.getItem(STORAGE_KEYS.THEME);
    const language = await storage.getItem(STORAGE_KEYS.LANGUAGE);

    set({
      isDarkMode: theme === 'dark',
      language: language || 'en',
    });
  },

  toggleTheme: async () => {
    set((state) => {
      const newMode = !state.isDarkMode;
      storage.setItem(STORAGE_KEYS.THEME, newMode ? 'dark' : 'light');
      return { isDarkMode: newMode };
    });
  },

  setLanguage: async (language) => {
    await storage.setItem(STORAGE_KEYS.LANGUAGE, language);
    set({ language });
  },
}));