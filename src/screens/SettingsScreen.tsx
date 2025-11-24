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
import { getPalette, Palette } from "../theme/theme";

export function SettingsScreen() {
  const { settings, loading, saving, setLanguage, toggleTheme } = useSettings();
  const t = getStrings(settings.language);
  const palette = getPalette(settings.theme);
  const styles = React.useMemo(() => createStyles(palette), [palette]);

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
          <Text style={styles.footerText}>{t.common.loadingSettings}</Text>
        ) : saving ? (
          <Text style={styles.footerText}>{t.common.saving}</Text>
        ) : (
          <Text style={styles.footerText}>{t.common.settingsSaved}</Text>
        )}
      </View>
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
    },
    section: {
      marginTop: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: palette.textPrimary,
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
      borderColor: palette.chipBorder,
      marginRight: 8,
    },
    chipActive: {
      backgroundColor: palette.accentSoft,
      borderColor: palette.accent,
    },
    chipText: {
      color: palette.textPrimary,
    },
    chipTextActive: {
      color: palette.accent,
      fontWeight: "600",
    },
    helperText: {
      marginTop: 6,
      fontSize: 12,
      color: palette.textMuted,
    },
    themeButton: {
      backgroundColor: palette.card,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: palette.border,
      marginTop: 4,
    },
    themeButtonText: {
      color: palette.textPrimary,
    },
    footer: {
      marginTop: 32,
    },
    footerText: {
      color: palette.textMuted,
    },
  });
