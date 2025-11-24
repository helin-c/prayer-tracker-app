import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useSettings } from "../context/SettingsContext";
import { getStrings } from "../i18n/translations";

const DHIKR_ITEMS = [
  { id: 1, key: "Subhanallah", descKey: "Glory be to Allah." },
  { id: 2, key: "Alhamdulillah", descKey: "All praise is due to Allah." },
  { id: 3, key: "Allahu Akbar", descKey: "Allah is the Greatest." },
  {
    id: 4,
    key: "La ilaha illallah",
    descKey: "There is no deity except Allah.",
  },
];

export function DhikrScreen() {
  const { settings } = useSettings();
  const t = getStrings(settings.language);

  const counts = [33, 33, 34, 100];

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{t.dhikr.title}</Text>
      <Text style={styles.subtitle}>{t.dhikr.subtitle}</Text>

      <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 24 }}>
        {DHIKR_ITEMS.map((item, idx) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.cardTitle}>{item.key}</Text>
            <Text style={styles.cardDesc}>{item.descKey}</Text>
            <Text style={styles.cardCount}>
              {t.dhikr.recommended(counts[idx])}
            </Text>
          </View>
        ))}
      </ScrollView>
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
  list: {
    marginTop: 16,
  },
  card: {
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
  },
  cardDesc: {
    marginTop: 4,
    color: "#9ca3af",
  },
  cardCount: {
    marginTop: 8,
    fontWeight: "500",
    color: "#22c55e",
  },
});
