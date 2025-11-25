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
  const { settings, loading, saving, setLanguage, toggleTheme, setLocation } =
    useSettings();

  const t = getStrings(settings.language);
  const palette = getPalette(settings.theme);
  const styles = React.useMemo(() => createStyles(palette), [palette]);

  const isTR = settings.language === "tr";

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{t.settings.title}</Text>
      <Text style={styles.subtitle}>{t.settings.subtitle}</Text>

      {loading && <Text style={styles.badge}>{t.common.loading}</Text>}
      {saving && <Text style={styles.badge}>{t.common.saving}</Text>}

      {/* Language */}
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
      </View>

      {/* Theme */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.settings.themeTitle}</Text>
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
              {isTR ? "Koyu" : "Dark"}
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
              {isTR ? "Açık" : "Light"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Location for prayer times */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.settings.locationTitle}</Text>
        <Text style={styles.sectionSubtitle}>
          {t.settings.locationSubtitle}
        </Text>

        <View style={styles.row}>
          <TouchableOpacity
            style={[
              styles.chip,
              settings.city === "London" && styles.chipActive,
            ]}
            onPress={() => setLocation("London", "United Kingdom")}
          >
            <Text
              style={[
                styles.chipText,
                settings.city === "London" && styles.chipTextActive,
              ]}
            >
              London
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.chip,
              settings.city === "Istanbul" && styles.chipActive,
            ]}
            onPress={() => setLocation("Istanbul", "Turkey")}
          >
            <Text
              style={[
                styles.chipText,
                settings.city === "Istanbul" && styles.chipTextActive,
              ]}
            >
              İstanbul
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.currentLocation}>
          {t.settings.currentLocation
            .replace("{city}", settings.city)
            .replace("{country}", settings.country)}
        </Text>
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
      marginBottom: 4,
    },
    subtitle: {
      color: palette.textSecondary,
      marginBottom: 12,
    },
    badge: {
      alignSelf: "flex-start",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: palette.accentSoft,
      color: palette.textPrimary,
      marginBottom: 10,
      fontSize: 12,
    },
    section: {
      marginBottom: 18,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: palette.textPrimary,
      marginBottom: 6,
    },
    sectionSubtitle: {
      color: palette.textMuted,
      marginBottom: 8,
    },
    row: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: palette.chipBorder,
      marginRight: 8,
      marginBottom: 8,
    },
    chipActive: {
      backgroundColor: palette.accentSoft,
    },
    chipText: {
      color: palette.textSecondary,
      fontWeight: "500",
    },
    chipTextActive: {
      color: palette.textPrimary,
    },
    currentLocation: {
      marginTop: 8,
      color: palette.textSecondary,
    },
  });
