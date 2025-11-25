// src/context/SettingsContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeMode = "dark" | "light";
export type LanguageCode = "en" | "tr";

export interface Settings {
  language: LanguageCode;
  theme: ThemeMode;
  city: string;
  country: string;
}

interface SettingsContextValue {
  settings: Settings;
  loading: boolean;
  saving: boolean;
  setLanguage: (lang: LanguageCode) => void;
  toggleTheme: () => void;
  setLocation: (city: string, country: string) => void;
}

const STORAGE_KEY = "app-settings";

const defaultSettings: Settings = {
  language: "en",
  theme: "dark",
  city: "London",
  country: "United Kingdom",
};

const SettingsContext = createContext<SettingsContextValue>({
  settings: defaultSettings,
  loading: true,
  saving: false,
  setLanguage: () => {},
  toggleTheme: () => {},
  setLocation: () => {},
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // load from AsyncStorage once
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as Partial<Settings>;
          setSettings({ ...defaultSettings, ...parsed });
        }
      } catch (e) {
        console.warn("Error loading settings:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = async (next: Settings) => {
    setSaving(true);
    setSettings(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn("Error saving settings:", e);
    } finally {
      setSaving(false);
    }
  };

  const setLanguage = (language: LanguageCode) => {
    persist({ ...settings, language });
  };

  const toggleTheme = () => {
    const theme: ThemeMode = settings.theme === "dark" ? "light" : "dark";
    persist({ ...settings, theme });
  };

  const setLocation = (city: string, country: string) => {
    persist({ ...settings, city, country });
  };

  return (
    <SettingsContext.Provider
      value={{ settings, loading, saving, setLanguage, toggleTheme, setLocation }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
