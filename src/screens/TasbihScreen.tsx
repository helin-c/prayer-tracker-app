import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSettings } from "../context/SettingsContext";
import { getStrings } from "../i18n/translations";

const STORAGE_KEY = "tasbih-state";

interface TasbihState {
  count: number;
  target: number;
}

export function TasbihScreen() {
  const { settings } = useSettings();
  const t = getStrings(settings.language);

  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(33);
  const [loading, setLoading] = useState(true);

  // Load saved state
  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as TasbihState;
          setCount(parsed.count ?? 0);
          setTarget(parsed.target ?? 33);
        }
      } catch (e) {
        console.warn("Error loading tasbih state:", e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // Save state
  useEffect(() => {
    if (loading) return;
    const save = async () => {
      try {
        const data: TasbihState = { count, target };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        console.warn("Error saving tasbih state:", e);
      }
    };
    save();
  }, [count, target, loading]);

  const increment = () => setCount((c) => c + 1);

  const reset = () => setCount(0);

  const setTargetValue = (value: number) => {
    setTarget(value);
    // optional: if count > new target, keep count, just change progress
  };

  const progress =
    target > 0 ? Math.min(100, Math.round((count / target) * 100)) : 0;

  const quickTargets = [33, 99, 100];

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{t.tasbih.title}</Text>
      <Text style={styles.subtitle}>{t.tasbih.subtitle}</Text>

      <View style={styles.counterCard}>
        <Text style={styles.counterLabel}>{t.tasbih.currentCount}</Text>
        <Text style={styles.counterValue}>{count}</Text>
        <Text style={styles.progressText}>
          {t.tasbih.targetProgress(target, progress)}
        </Text>
      </View>

      <View style={styles.targetRow}>
        <Text style={styles.targetLabel}>{t.tasbih.quickTargets}</Text>
        {quickTargets.map((value) => (
          <TouchableOpacity
            key={value}
            style={[
              styles.targetChip,
              target === value && styles.targetChipActive,
            ]}
            onPress={() => setTargetValue(value)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.targetChipText,
                target === value && styles.targetChipTextActive,
              ]}
            >
              {value}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.button, styles.incrementButton]}
          onPress={increment}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>{t.tasbih.buttonIncrement}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.resetButton]}
          onPress={reset}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>{t.tasbih.buttonReset}</Text>
        </TouchableOpacity>
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
  counterCard: {
    marginTop: 20,
    backgroundColor: "#111827",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  counterLabel: {
    fontSize: 14,
    color: "#9ca3af",
  },
  counterValue: {
    marginTop: 8,
    fontSize: 48,
    fontWeight: "700",
    color: "#22c55e",
  },
  progressText: {
    marginTop: 6,
    fontSize: 14,
    color: "#a5b4fc",
  },
  targetRow: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  targetLabel: {
    fontSize: 14,
    color: "#e5e7eb",
    marginRight: 8,
  },
  targetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#4b5563",
    marginRight: 8,
    marginTop: 4,
  },
  targetChipActive: {
    backgroundColor: "#22c55e33",
    borderColor: "#22c55e",
  },
  targetChipText: {
    color: "#e5e7eb",
  },
  targetChipTextActive: {
    color: "#bbf7d0",
    fontWeight: "600",
  },
  actionsRow: {
    marginTop: 28,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  incrementButton: {
    backgroundColor: "#22c55e",
    marginRight: 8,
  },
  resetButton: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#4b5563",
    marginLeft: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f9fafb",
  },
});
