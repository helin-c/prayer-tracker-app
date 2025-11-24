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

export function GuideScreen() {
  const { settings } = useSettings();
  const t = getStrings(settings.language);

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050816",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
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
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#e5e7eb",
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  cardIndex: {
    fontSize: 12,
    color: "#a5b4fc",
    marginBottom: 4,
  },
  cardText: {
    color: "#e5e7eb",
  },
});
