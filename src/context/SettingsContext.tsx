import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Language = "en" | "tr";
export type ThemeMode = "dark" | "light";

export interface SettingsState {
  language: Language;
  theme: ThemeMode;
}

interface SettingsContextValue {
  settings: SettingsState;
  loading: boolean;
  saving: boolean;
  setLanguage: (lang: Language) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const DEFAULT_SETTINGS: SettingsState = {
  language: "en",
  theme: "dark",
};

const STORAGE_KEY = "app-settings-v1";

const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined
);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load on mount
  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as SettingsState;
          setSettings({
            language: parsed.language ?? "en",
            theme: parsed.theme ?? "dark",
          });
        }
      } catch (e) {
        console.warn("Error loading settings:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const persist = async (next: SettingsState) => {
    setSaving(true);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSettings(next);
    } catch (e) {
      console.warn("Error saving settings:", e);
    } finally {
      setSaving(false);
    }
  };

  const setLanguage = async (lang: Language) => {
    await persist({ ...settings, language: lang });
  };

  const toggleTheme = async () => {
    const nextTheme: ThemeMode = settings.theme === "dark" ? "light" : "dark";
    await persist({ ...settings, theme: nextTheme });
  };

  return (
    <SettingsContext.Provider
      value={{ settings, loading, saving, setLanguage, toggleTheme }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used inside SettingsProvider");
  }
  return ctx;
}
