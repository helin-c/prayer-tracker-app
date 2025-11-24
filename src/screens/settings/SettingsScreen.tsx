import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useSettings } from "../../context/SettingsContext";
import { getStrings } from "../../i18n/translations";
import { getPalette, Palette } from "../../theme/theme";

export function SettingsScreen() {
  const { settings, loading, saving, setLanguage, toggleTheme } = useSettings();
  const t = getStrings(settings.language);
  const palette = getPalette(settings.theme);
  const styles = React.useMemo(() => createStyles(palette), [palette]);

  const isTR = settings.language === "tr";

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{isTR ? "Ayarlar" : "Settings"}</Text>
      <Text style={styles.subtitle}>{t.settings.subtitle}</Text>

      {/* Language */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.settings.languageSection}</Text>
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
              {t.settings.languageEnglish}
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
              {t.settings.languageTurkish}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Theme */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.settings.themeSection}</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[
              styles.chip,
              settings.theme === "dark" && styles.chipActive,
            ]}
            onPress={toggleTheme}
          >
            <Text
              style={[
                styles.chipText,
                settings.theme === "dark" && styles.chipTextActive,
              ]}
            >
              {t.settings.themeDark}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.chip,
              settings.theme === "light" && styles.chipActive,
            ]}
            onPress={toggleTheme}
          >
            <Text
              style={[
                styles.chipText,
                settings.theme === "light" && styles.chipTextActive,
              ]}
            >
              {t.settings.themeLight}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {(loading || saving) && (
        <Text style={styles.statusText}>
          {loading ? t.common.loading : t.common.saving}
        </Text>
      )}
    </SafeAreaView>
  );
}

const createStyles = (palette: Palette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.background,
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: palette.textPrimary,
    },
    subtitle: {
      marginTop: 4,
      color: palette.textSecondary,
      marginBottom: 16,
    },
    section: {
      marginBottom: 18,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: palette.textPrimary,
      marginBottom: 8,
    },
    row: {
      flexDirection: "row",
      gap: 8,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: palette.chipBorder,
      backgroundColor: palette.card,
    },
    chipActive: {
      backgroundColor: palette.accentSoft,
      borderColor: palette.accent,
    },
    chipText: {
      color: palette.textSecondary,
      fontWeight: "500",
    },
    chipTextActive: {
      color: palette.accent,
    },
    statusText: {
      marginTop: 10,
      color: palette.textMuted,
    },
  });
