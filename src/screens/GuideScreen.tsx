import React from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
} from "react-native";
import { useSettings } from "../context/SettingsContext";
import { getStrings } from "../i18n/translations";
import { getPalette, Palette } from "../theme/theme";

export function GuideScreen() {
  const { settings } = useSettings();
  const t = getStrings(settings.language);
  const palette = getPalette(settings.theme);
  const styles = React.useMemo(() => createStyles(palette), [palette]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{t.guide.title}</Text>
        <Text style={styles.subtitle}>{t.guide.subtitle}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.guide.wuduTitle}</Text>
          {t.guide.wuduSteps.map((step, index) => (
            <View key={index} style={styles.card}>
              <Text style={styles.cardIndex}>
                {t.guide.stepLabel(index + 1)}
              </Text>
              <Text style={styles.cardText}>{step}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.guide.prayerTitle}</Text>
          {t.guide.prayerSteps.map((step, index) => (
            <View key={index} style={styles.card}>
              <Text style={styles.cardIndex}>
                {t.guide.stepLabel(index + 1)}
              </Text>
              <Text style={styles.cardText}>{step}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (palette: Palette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: palette.background,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 24,
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
      marginTop: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: palette.textPrimary,
      marginBottom: 8,
    },
    card: {
      backgroundColor: palette.card,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: palette.border,
    },
    cardIndex: {
      fontSize: 12,
      color: palette.progress,
      marginBottom: 4,
    },
    cardText: {
      color: palette.textPrimary,
    },
  });
