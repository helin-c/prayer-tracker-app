import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SETTINGS_STORAGE_KEY = "app-settings";

export type Language = "en" | "tr";
export type ThemeMode = "dark" | "light";

export interface AppSettings {
  language: Language;
  theme: ThemeMode;
}

const defaultSettings: AppSettings = {
  language: "en",
  theme: "dark",
};

interface SettingsContextValue {
  settings: AppSettings;
  loading: boolean;
  saving: boolean;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined
);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load settings once
  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as AppSettings;
          setSettings({ ...defaultSettings, ...parsed });
        }
      } catch (error) {
        console.warn("Error loading settings:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // Save whenever settings change
  useEffect(() => {
    const save = async () => {
      try {
        setSaving(true);
        await AsyncStorage.setItem(
          SETTINGS_STORAGE_KEY,
          JSON.stringify(settings)
        );
      } catch (error) {
        console.warn("Error saving settings:", error);
      } finally {
        setSaving(false);
      }
    };

    if (!loading) {
      save();
    }
  }, [settings, loading]);

  const setLanguage = (lang: Language) => {
    setSettings((prev) => ({ ...prev, language: lang }));
  };

  const setTheme = (theme: ThemeMode) => {
    setSettings((prev) => ({ ...prev, theme }));
  };

  const toggleTheme = () => {
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === "dark" ? "light" : "dark",
    }));
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        saving,
        setLanguage,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return ctx;
}
