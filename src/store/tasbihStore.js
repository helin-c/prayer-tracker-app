// ============================================================================
// FILE: src/store/tasbihStore.js (OPTIMIZED WITH SELECTORS)
// ============================================================================
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'tasbih_sessions';

export const useTasbihStore = create((set, get) => ({
  // Current Session State
  currentCount: 0,
  targetCount: 0,
  zikrName: '',
  sessionId: null, // null = new session, otherwise = continuing existing session
  
  // History
  sessions: [],
  isLoading: false,

  // ============================================================================
  // COUNTER ACTIONS
  // ============================================================================
  
  increment: () => {
    set((state) => ({
      currentCount: state.currentCount + 1,
    }));
  },

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================
  
  // Start a new session
  startNewSession: (name = '', target = 0) => {
    set({
      currentCount: 0,
      targetCount: target,
      zikrName: name,
      sessionId: null, // This is a new session
    });
  },

  // Continue an existing session
  continueSession: (session) => {
    set({
      currentCount: session.count,
      targetCount: session.target || 0,
      zikrName: session.name,
      sessionId: session.id,
    });
  },

  // Save current session (create new or update existing)
  saveSession: async () => {
    const state = get();
    
    if (!state.zikrName.trim()) {
      throw new Error('Please provide a name for this zikr');
    }

    if (state.currentCount === 0) {
      throw new Error('Count must be greater than 0');
    }

    const now = new Date().toISOString();

    // Update existing session
    if (state.sessionId) {
      const updatedSessions = state.sessions.map((s) =>
        s.id === state.sessionId
          ? {
              ...s,
              count: state.currentCount,
              target: state.targetCount,
              lastUpdated: now,
            }
          : s
      );
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
      
      set({
        sessions: updatedSessions,
        currentCount: 0,
        targetCount: 0,
        zikrName: '',
        sessionId: null,
      });
    } 
    // Create new session
    else {
      const newSession = {
        id: Date.now().toString(),
        name: state.zikrName,
        count: state.currentCount,
        target: state.targetCount,
        createdAt: now,
        lastUpdated: now,
      };

      const newSessions = [newSession, ...state.sessions];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions));
      
      set({
        sessions: newSessions,
        currentCount: 0,
        targetCount: 0,
        zikrName: '',
        sessionId: null,
      });
    }
  },

  // Reset current session (but keep name and target if set)
  resetCounter: () => {
    set((state) => ({
      currentCount: 0,
      sessionId: null, // Reset means it's a fresh start
    }));
  },

  // Complete reset - clear everything
  completeReset: () => {
    set({
      currentCount: 0,
      targetCount: 0,
      zikrName: '',
      sessionId: null,
    });
  },

  // Update session settings (name/target) without resetting count
  updateSessionSettings: (name, target) => {
    set({
      zikrName: name,
      targetCount: target,
    });
  },

  // ============================================================================
  // HISTORY ACTIONS
  // ============================================================================
  
  deleteSession: async (id) => {
    const newSessions = get().sessions.filter((s) => s.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions));
    set({ sessions: newSessions });
  },

  clearAllSessions: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    set({ sessions: [] });
  },

  loadSessions: async () => {
    try {
      set({ isLoading: true });
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        set({ sessions: JSON.parse(data) });
      }
    } catch (error) {
      console.error('Error loading tasbih sessions:', error);
    } finally {
      set({ isLoading: false });
    }
  },
}));

// ============================================================================
// SELECTORS (Use these for performance optimization)
// Usage: const currentCount = useTasbihStore(selectCurrentCount);
// ============================================================================
export const selectCurrentCount = (state) => state.currentCount;
export const selectTargetCount = (state) => state.targetCount;
export const selectZikrName = (state) => state.zikrName;
export const selectSessionId = (state) => state.sessionId;
export const selectSessions = (state) => state.sessions;
export const selectTasbihIsLoading = (state) => state.isLoading;