import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TASBIH_STORAGE_KEY = "tasbih-count";
const DEFAULT_TARGET = 33;

export function TasbihScreen() {
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState<number>(DEFAULT_TARGET);
  const [loading, setLoading] = useState(true);

  // Load saved count from storage
  useEffect(() => {
    const loadCount = async () => {
      try {
        const saved = await AsyncStorage.getItem(TASBIH_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setCount(parsed.count ?? 0);
          setTarget(parsed.target ?? DEFAULT_TARGET);
        }
      } catch (error) {
        console.warn("Error loading tasbih count:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCount();
  }, []);

  // Save whenever count or target changes
  useEffect(() => {
    const save = async () => {
      try {
        await AsyncStorage.setItem(
          TASBIH_STORAGE_KEY,
          JSON.stringify({ count, target })
        );
      } catch (error) {
        console.warn("Error saving tasbih count:", error);
      }
    };

    if (!loading) {
      save();
    }
  }, [count, target, loading]);

  const increment = () => setCount((prev) => prev + 1);
  const reset = () => setCount(0);
  const setTargetValue = (value: number) => setTarget(value);

  const progress = target > 0 ? Math.min(100, Math.round((count / target) * 100)) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Tasbih Counter</Text>
      <Text style={styles.subtitle}>
        Tap the button to increase your count.
      </Text>

      <View style={styles.center}>
        <View style={styles.counterCircle}>
          <Text style={styles.counterText}>{count}</Text>
          <Text style={styles.counterSubText}>Current count</Text>
        </View>
        <Text style={styles.progressText}>
          Target: {target} • Progress: {progress}%
        </Text>
      </View>

      <View style={styles.targetRow}>
        <Text style={styles.targetLabel}>Quick targets:</Text>
        {[33, 99, 100].map((value) => (
          <TouchableOpacity
            key={value}
            style={[
              styles.targetChip,
              target === value && styles.targetChipActive,
            ]}
            onPress={() => setTargetValue(value)}
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
          <Text style={styles.buttonText}>Tap +1</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.resetButton]}
          onPress={reset}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Reset</Text>
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
  center: {
    alignItems: "center",
    marginTop: 32,
  },
  counterCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 4,
    borderColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#020617",
  },
  counterText: {
    fontSize: 40,
    fontWeight: "700",
    color: "#ffffff",
  },
  counterSubText: {
    marginTop: 4,
    color: "#9ca3af",
  },
  progressText: {
    marginTop: 16,
    color: "#a5b4fc",
    fontWeight: "500",
  },
  targetRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    flexWrap: "wrap",
  },
  targetLabel: {
    color: "#9ca3af",
    marginRight: 8,
  },
  targetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#4b5563",
    marginRight: 8,
    marginTop: 8,
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
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 32,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  incrementButton: {
    backgroundColor: "#22c55e",
    marginRight: 8,
  },
  resetButton: {
    backgroundColor: "#111827",
    marginLeft: 8,
  },
  buttonText: {
    color: "#f9fafb",
    fontWeight: "600",
    fontSize: 16,
  },
});
