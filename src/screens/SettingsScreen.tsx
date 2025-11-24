import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SETTINGS_STORAGE_KEY = "app-settings";

type Language = "en" | "tr";
type ThemeMode = "dark" | "light";

interface AppSettings {
  language: Language;
  theme: ThemeMode;
}

export function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings>({
    language: "en",
    theme: "dark",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load settings from storage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as AppSettings;
          setSettings(parsed);
        }
      } catch (error) {
        console.warn("Error loading settings:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Save settings whenever they change (after initial load)
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

  const toggleTheme = () => {
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === "dark" ? "light" : "dark",
    }));
  };

  const isTR = settings.language === "tr";

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>
        {isTR ? "Ayarlar" : "Settings"}
      </Text>
      <Text style={styles.subtitle}>
        {isTR
          ? "Uygulama tercihlerini buradan düzenleyebilirsin."
          : "Manage your app preferences here."}
      </Text>

      {/* Language section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {isTR ? "Dil" : "Language"}
        </Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[
              styles.chip,
              settings.language === "en" && styles.chipActive,
            ]}
            onPress={() => setLanguage("en")}
          >
            <Text
              style={[
                styles.chipText,
                settings.language === "en" && styles.chipTextActive,
              ]}
            >
              English
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.chip,
              settings.language === "tr" && styles.chipActive,
            ]}
            onPress={() => setLanguage("tr")}
          >
            <Text
              style={[
                styles.chipText,
                settings.language === "tr" && styles.chipTextActive,
              ]}
            >
              Türkçe
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.helperText}>
          {isTR
            ? "Şimdilik sadece ayarlar ekranında dili değiştiriyoruz. Sonra tüm uygulamaya yayabiliriz."
            : "For now the language is applied here. Later we can apply it across the whole app."}
        </Text>
      </View>

      {/* Theme section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {isTR ? "Tema" : "Theme"}
        </Text>
        <TouchableOpacity
          style={styles.themeButton}
          onPress={toggleTheme}
          activeOpacity={0.8}
        >
          <Text style={styles.themeButtonText}>
            {isTR
              ? `Şu anki tema: ${settings.theme === "dark" ? "Koyu" : "Açık"} (dokunarak değiştir)`
              : `Current theme: ${settings.theme} (tap to toggle)`}
          </Text>
        </TouchableOpacity>
        <Text style={styles.helperText}>
          {isTR
            ? "Tema henüz ekranda görsel olarak değişmiyor, ama seçimin kaydediliyor. Sonra tasarımla entegre edebiliriz."
            : "Theme isn’t visually changing the app yet, but your preference is saved. We can connect it to the design later."}
        </Text>
      </View>

      {/* Status */}
      <View style={styles.footer}>
        {loading ? (
          <Text style={styles.footerText}>
            {isTR ? "Ayarlar yükleniyor..." : "Loading settings..."}
          </Text>
        ) : saving ? (
          <Text style={styles.footerText}>
            {isTR ? "Kaydediliyor..." : "Saving..."}
          </Text>
        ) : (
          <Text style={styles.footerText}>
            {isTR ? "Ayarlar kaydedildi ✅" : "Settings saved ✅"}
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050816",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
  },
  subtitle: {
    marginTop: 4,
    color: "#9ca3af",
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#e5e7eb",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#4b5563",
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: "#22c55e33",
    borderColor: "#22c55e",
  },
  chipText: {
    color: "#e5e7eb",
  },
  chipTextActive: {
    color: "#bbf7d0",
    fontWeight: "600",
  },
  helperText: {
    marginTop: 6,
    fontSize: 12,
    color: "#9ca3af",
  },
  themeButton: {
    backgroundColor: "#111827",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  themeButtonText: {
    color: "#e5e7eb",
  },
  footer: {
    marginTop: 32,
  },
  footerText: {
    color: "#9ca3af",
  },
});
