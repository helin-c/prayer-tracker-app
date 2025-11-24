import React from "react";
import { SafeAreaView, View, Text, StyleSheet, ScrollView } from "react-native";

const DHIKR_ITEMS = [
  {
    id: 1,
    title: "Subhanallah",
    description: "Glory be to Allah.",
    recommendedCount: 33,
  },
  {
    id: 2,
    title: "Alhamdulillah",
    description: "All praise is due to Allah.",
    recommendedCount: 33,
  },
  {
    id: 3,
    title: "Allahu Akbar",
    description: "Allah is the Greatest.",
    recommendedCount: 34,
  },
  {
    id: 4,
    title: "La ilaha illallah",
    description: "There is no deity except Allah.",
    recommendedCount: 100,
  },
];

export function DhikrScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Daily Dhikr</Text>
      <Text style={styles.subtitle}>
        Simple dhikr you can repeat throughout your day.
      </Text>

      <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 24 }}>
        {DHIKR_ITEMS.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDesc}>{item.description}</Text>
            <Text style={styles.cardCount}>
              Recommended: {item.recommendedCount} times
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
