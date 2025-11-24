import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useSettings } from "../context/SettingsContext";
import { getStrings } from "../i18n/translations";

export function SettingsScreen() {
  const { settings, loading, saving, setLanguage, toggleTheme } = useSettings();
  const t = getStrings(settings.language);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{t.settings.title}</Text>
      <Text style={styles.subtitle}>{t.settings.subtitle}</Text>

      {/* Language section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.settings.languageTitle}</Text>
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
        <Text style={styles.helperText}>{t.settings.languageHelper}</Text>
      </View>

      {/* Theme section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.settings.themeTitle}</Text>
        <TouchableOpacity
          style={styles.themeButton}
          onPress={toggleTheme}
          activeOpacity={0.8}
        >
          <Text style={styles.themeButtonText}>
            {t.settings.themeButton(settings.theme)}
          </Text>
        </TouchableOpacity>
        <Text style={styles.helperText}>{t.settings.themeHelper}</Text>
      </View>

      {/* Status */}
      <View style={styles.footer}>
        {loading ? (
          <Text style={styles.footerText}>
            {t.common.loadingSettings}
          </Text>
        ) : saving ? (
          <Text style={styles.footerText}>{t.common.saving}</Text>
        ) : (
          <Text style={styles.footerText}>{t.common.settingsSaved}</Text>
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
