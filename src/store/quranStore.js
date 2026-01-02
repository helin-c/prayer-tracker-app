// ============================================================================
// FILE: src/store/quranStore.js (OPTIMIZED WITH SELECTORS)
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
  isInitialized: false,

  // ============================================================================
  // INITIALIZE
  // ============================================================================
  initialize: async () => {
    // Prevent multiple initializations
    if (get().isInitialized) {
      return;
    }

    try {
      set({ isLoading: true });

      const [bookmarksJson, lastReadJson, highlightsJson, settingsJson] = await Promise.all([
        storage.getItem(STORAGE_KEYS.BOOKMARKS),
        storage.getItem(STORAGE_KEYS.LAST_READ),
        storage.getItem(STORAGE_KEYS.HIGHLIGHTS),
        storage.getItem(STORAGE_KEYS.SETTINGS),
      ]);

      // Parse JSON strings if needed
      const bookmarks = bookmarksJson ? 
        (typeof bookmarksJson === 'string' ? JSON.parse(bookmarksJson) : bookmarksJson) : [];
      const lastRead = lastReadJson ? 
        (typeof lastReadJson === 'string' ? JSON.parse(lastReadJson) : lastReadJson) : null;
      const highlights = highlightsJson ? 
        (typeof highlightsJson === 'string' ? JSON.parse(highlightsJson) : highlightsJson) : [];
      const settings = settingsJson ? 
        (typeof settingsJson === 'string' ? JSON.parse(settingsJson) : settingsJson) : get().settings;

      console.log('Quran store initialized:', {
        bookmarks: bookmarks.length,
        lastRead: lastRead ? `${lastRead.surahNumber}:${lastRead.ayahNumber}` : 'none',
        highlights: highlights.length,
      });

      set({
        bookmarks,
        lastRead,
        highlights,
        settings,
        isLoading: false,
        isInitialized: true,
      });
    } catch (error) {
      console.error('Quran store initialization error:', error);
      set({ isLoading: false, isInitialized: true });
    }
  },

  // ============================================================================
  // BOOKMARKS
  // ============================================================================
  addBookmark: async (surahNumber, ayahNumber, note = '') => {
    try {
      const bookmarks = get().bookmarks;
      
      // Check if bookmark already exists
      const existingBookmark = bookmarks.find(
        b => b.surahNumber === surahNumber && b.ayahNumber === ayahNumber
      );

      if (existingBookmark) {
        // Update existing bookmark note
        return await get().updateBookmarkNote(existingBookmark.id, note);
      }

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

      console.log('Bookmark added:', newBookmark);
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

      console.log('Bookmark removed:', bookmarkId);
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
        b.id === bookmarkId ? { ...b, note, timestamp: new Date().toISOString() } : b
      );

      await storage.setItem(STORAGE_KEYS.BOOKMARKS, updatedBookmarks);
      set({ bookmarks: updatedBookmarks });

      console.log('Bookmark note updated:', bookmarkId);
      return { success: true };
    } catch (error) {
      console.error('Update bookmark note error:', error);
      return { success: false, error: error.message };
    }
  },

  clearAllBookmarks: async () => {
    try {
      await storage.removeItem(STORAGE_KEYS.BOOKMARKS);
      set({ bookmarks: [] });
      return { success: true };
    } catch (error) {
      console.error('Clear bookmarks error:', error);
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

  clearLastRead: async () => {
    try {
      await storage.removeItem(STORAGE_KEYS.LAST_READ);
      set({ lastRead: null });
      return { success: true };
    } catch (error) {
      console.error('Clear last read error:', error);
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

      console.log('Highlight added:', newHighlight);
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

      console.log('Highlight removed:', surahNumber, ayahNumber);
      return { success: true };
    } catch (error) {
      console.error('Remove highlight error:', error);
      return { success: false, error: error.message };
    }
  },

  clearAllHighlights: async () => {
    try {
      await storage.removeItem(STORAGE_KEYS.HIGHLIGHTS);
      set({ highlights: [] });
      return { success: true };
    } catch (error) {
      console.error('Clear highlights error:', error);
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

  resetSettings: async () => {
    try {
      const defaultSettings = {
        fontSize: 24,
        lineHeight: 2,
        fontFamily: 'Traditional',
        theme: 'light',
      };
      await storage.setItem(STORAGE_KEYS.SETTINGS, defaultSettings);
      set({ settings: defaultSettings });
      return { success: true };
    } catch (error) {
      console.error('Reset settings error:', error);
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

  getBookmarkBySurahAyah: (surahNumber, ayahNumber) => {
    return get().bookmarks.find(
      (b) => b.surahNumber === surahNumber && b.ayahNumber === ayahNumber
    );
  },

  // ============================================================================
  // RESET STORE
  // ============================================================================
  resetStore: async () => {
    try {
      await Promise.all([
        storage.removeItem(STORAGE_KEYS.BOOKMARKS),
        storage.removeItem(STORAGE_KEYS.LAST_READ),
        storage.removeItem(STORAGE_KEYS.HIGHLIGHTS),
        storage.removeItem(STORAGE_KEYS.SETTINGS),
      ]);

      set({
        bookmarks: [],
        lastRead: null,
        highlights: [],
        settings: {
          fontSize: 24,
          lineHeight: 2,
          fontFamily: 'Traditional',
          theme: 'light',
        },
        isInitialized: false,
      });

      return { success: true };
    } catch (error) {
      console.error('Reset store error:', error);
      return { success: false, error: error.message };
    }
  },
}));

// ============================================================================
// SELECTORS (Use these for performance optimization)
// Usage: const bookmarks = useQuranStore(selectBookmarks);
// ============================================================================
export const selectBookmarks = (state) => state.bookmarks;
export const selectLastRead = (state) => state.lastRead;
export const selectHighlights = (state) => state.highlights;
export const selectQuranSettings = (state) => state.settings;
export const selectQuranData = (state) => state.quranData;
export const selectQuranIsLoading = (state) => state.isLoading;
export const selectQuranIsInitialized = (state) => state.isInitialized;