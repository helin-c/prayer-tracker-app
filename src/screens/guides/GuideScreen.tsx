// src/screens/guides/GuideScreen.tsx
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
} from "react-native";
import { useSettings } from "../../context/SettingsContext";
import { getStrings } from "../../i18n/translations";
import { getPalette, Palette } from "../../theme/theme";

export function GuideScreen() {
  const { settings } = useSettings();
  const t = getStrings(settings.language);
  const palette = getPalette(settings.theme);
  const styles = React.useMemo(() => createStyles(palette), [palette]);

  // Make sure these are always arrays so .map never errors
  const wuduSteps = t.guide.wuduSteps ?? [];
  const prayerSteps = t.guide.prayerSteps ?? [];

  const formatStepLabel = (n: number) => {
    const template: string = t.guide.stepLabel ?? "Step {n}";
    return template.replace("{n}", String(n));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{t.guide.title}</Text>
        <Text style={styles.subtitle}>{t.guide.subtitle}</Text>

        {/* Wudu section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.guide.wuduTitle}</Text>
          {wuduSteps.map((step, index) => (
            <View key={`wudu-${index}`} style={styles.card}>
              <Text style={styles.cardIndex}>{formatStepLabel(index + 1)}</Text>
              <Text style={styles.cardText}>{step}</Text>
            </View>
          ))}
        </View>

        {/* Prayer section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.guide.prayerTitle}</Text>
          {prayerSteps.map((step, index) => (
            <View key={`prayer-${index}`} style={styles.card}>
              <Text style={styles.cardIndex}>{formatStepLabel(index + 1)}</Text>
              <Text style={styles.cardText}>{step}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(palette: Palette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.background,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingVertical: 20,
    },
    title: {
      fontSize: 26,
      fontWeight: "700",
      color: palette.textPrimary,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: palette.textSecondary,
      marginBottom: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: palette.textPrimary,
      marginBottom: 12,
    },
    card: {
      backgroundColor: palette.card,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: palette.border,
    },
    cardIndex: {
      fontSize: 12,
      fontWeight: "600",
      color: palette.accent,
      marginBottom: 4,
    },
    cardText: {
      fontSize: 14,
      color: palette.textPrimary,
    },
  });
}
