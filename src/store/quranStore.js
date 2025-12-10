// ============================================================================
// FILE: src/store/quranStore.js
// ============================================================================
import { create } from 'zustand';
import { storage } from '../services/storage';
import quranData from '../data/quran_uthmani.json';

const STORAGE_KEYS = {
  BOOKMARKS: '@quran:bookmarks',
  LAST_READ: '@quran:last_read',
  HIGHLIGHTS: '@quran:highlights',
  SETTINGS: '@quran:settings',
};

export const useQuranStore = create((set, get) => ({
  // State
  quranData: quranData,
  bookmarks: [],
  lastRead: null,
  highlights: [],
  settings: {
    fontSize: 24,
    lineHeight: 2,
    fontFamily: 'Traditional', // Traditional, Simple, Uthmani
    theme: 'light', // light, dark, sepia
  },
  isLoading: false,

  // ============================================================================
  // INITIALIZE
  // ============================================================================
  initialize: async () => {
    try {
      set({ isLoading: true });

      const [bookmarks, lastRead, highlights, settings] = await Promise.all([
        storage.getItem(STORAGE_KEYS.BOOKMARKS),
        storage.getItem(STORAGE_KEYS.LAST_READ),
        storage.getItem(STORAGE_KEYS.HIGHLIGHTS),
        storage.getItem(STORAGE_KEYS.SETTINGS),
      ]);

      set({
        bookmarks: bookmarks || [],
        lastRead: lastRead || null,
        highlights: highlights || [],
        settings: settings || get().settings,
        isLoading: false,
      });
    } catch (error) {
      console.error('Quran store initialization error:', error);
      set({ isLoading: false });
    }
  },

  // ============================================================================
  // BOOKMARKS
  // ============================================================================
  addBookmark: async (surahNumber, ayahNumber, note = '') => {
    try {
      const bookmarks = get().bookmarks;
      const newBookmark = {
        id: Date.now().toString(),
        surahNumber,
        ayahNumber,
        note,
        timestamp: new Date().toISOString(),
      };

      const updatedBookmarks = [...bookmarks, newBookmark];
      await storage.setItem(STORAGE_KEYS.BOOKMARKS, updatedBookmarks);
      set({ bookmarks: updatedBookmarks });

      return { success: true, bookmark: newBookmark };
    } catch (error) {
      console.error('Add bookmark error:', error);
      return { success: false, error: error.message };
    }
  },

  removeBookmark: async (bookmarkId) => {
    try {
      const bookmarks = get().bookmarks;
      const updatedBookmarks = bookmarks.filter((b) => b.id !== bookmarkId);

      await storage.setItem(STORAGE_KEYS.BOOKMARKS, updatedBookmarks);
      set({ bookmarks: updatedBookmarks });

      return { success: true };
    } catch (error) {
      console.error('Remove bookmark error:', error);
      return { success: false, error: error.message };
    }
  },

  updateBookmarkNote: async (bookmarkId, note) => {
    try {
      const bookmarks = get().bookmarks;
      const updatedBookmarks = bookmarks.map((b) =>
        b.id === bookmarkId ? { ...b, note } : b
      );

      await storage.setItem(STORAGE_KEYS.BOOKMARKS, updatedBookmarks);
      set({ bookmarks: updatedBookmarks });

      return { success: true };
    } catch (error) {
      console.error('Update bookmark note error:', error);
      return { success: false, error: error.message };
    }
  },

  // ============================================================================
  // LAST READ
  // ============================================================================
  updateLastRead: async (surahNumber, ayahNumber) => {
    try {
      const lastRead = {
        surahNumber,
        ayahNumber,
        timestamp: new Date().toISOString(),
      };

      await storage.setItem(STORAGE_KEYS.LAST_READ, lastRead);
      set({ lastRead });

      return { success: true };
    } catch (error) {
      console.error('Update last read error:', error);
      return { success: false, error: error.message };
    }
  },

  // ============================================================================
  // HIGHLIGHTS
  // ============================================================================
  addHighlight: async (surahNumber, ayahNumber, color = '#FFD54F') => {
    try {
      const highlights = get().highlights;
      
      // Remove existing highlight for this ayah
      const filteredHighlights = highlights.filter(
        (h) => !(h.surahNumber === surahNumber && h.ayahNumber === ayahNumber)
      );

      const newHighlight = {
        id: Date.now().toString(),
        surahNumber,
        ayahNumber,
        color,
        timestamp: new Date().toISOString(),
      };

      const updatedHighlights = [...filteredHighlights, newHighlight];
      await storage.setItem(STORAGE_KEYS.HIGHLIGHTS, updatedHighlights);
      set({ highlights: updatedHighlights });

      return { success: true };
    } catch (error) {
      console.error('Add highlight error:', error);
      return { success: false, error: error.message };
    }
  },

  removeHighlight: async (surahNumber, ayahNumber) => {
    try {
      const highlights = get().highlights;
      const updatedHighlights = highlights.filter(
        (h) => !(h.surahNumber === surahNumber && h.ayahNumber === ayahNumber)
      );

      await storage.setItem(STORAGE_KEYS.HIGHLIGHTS, updatedHighlights);
      set({ highlights: updatedHighlights });

      return { success: true };
    } catch (error) {
      console.error('Remove highlight error:', error);
      return { success: false, error: error.message };
    }
  },

  // ============================================================================
  // SETTINGS
  // ============================================================================
  updateSettings: async (newSettings) => {
    try {
      const settings = { ...get().settings, ...newSettings };
      await storage.setItem(STORAGE_KEYS.SETTINGS, settings);
      set({ settings });

      return { success: true };
    } catch (error) {
      console.error('Update settings error:', error);
      return { success: false, error: error.message };
    }
  },

  // ============================================================================
  // HELPERS
  // ============================================================================
  getSurah: (surahNumber) => {
    return get().quranData.surahs.find((s) => s.number === surahNumber);
  },

  getAyah: (surahNumber, ayahNumber) => {
    const surah = get().getSurah(surahNumber);
    return surah?.ayahs.find((a) => a.number_in_surah === ayahNumber);
  },

  isBookmarked: (surahNumber, ayahNumber) => {
    return get().bookmarks.some(
      (b) => b.surahNumber === surahNumber && b.ayahNumber === ayahNumber
    );
  },

  getHighlight: (surahNumber, ayahNumber) => {
    return get().highlights.find(
      (h) => h.surahNumber === surahNumber && h.ayahNumber === ayahNumber
    );
  },
}));