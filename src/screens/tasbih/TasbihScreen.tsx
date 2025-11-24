import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSettings } from "../../context/SettingsContext";
import { getStrings } from "../../i18n/translations";
import { getPalette, Palette } from "../../theme/theme";

const STORAGE_KEY = "tasbih-state";

interface TasbihState {
  count: number;
  target: number;
}

export function TasbihScreen() {
  const { settings } = useSettings();
  const t = getStrings(settings.language);
  const palette = getPalette(settings.theme);
  const styles = React.useMemo(() => createStyles(palette), [palette]);

  const [state, setState] = useState<TasbihState>({ count: 0, target: 33 });
  const { count, target } = state;

  // load saved state
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          setState(JSON.parse(saved) as TasbihState);
        }
      } catch (e) {
        console.warn("Error loading tasbih state:", e);
      }
    })();
  }, []);

  // save on change
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.warn("Error saving tasbih state:", e);
      }
    })();
  }, [state]);

  const increment = () => {
    setState((prev) => ({ ...prev, count: prev.count + 1 }));
  };

  const reset = () => {
    setState((prev) => ({ ...prev, count: 0 }));
  };

  const setTarget = (value: number) => {
    setState((prev) => ({ ...prev, target: value }));
  };

  const percent =
    target > 0 ? Math.min(100, Math.round((count / target) * 100)) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{t.tasbih.title}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>{t.tasbih.currentCount}</Text>
        <Text style={styles.count}>{count}</Text>

        <Text style={styles.label}>
          {t.tasbih.target}: {target}
        </Text>
        <Text style={styles.progressText}>{percent}%</Text>
      </View>

      <View style={styles.targetRow}>
        <Text style={styles.targetLabel}>{t.tasbih.targetLabel}:</Text>
        {[33, 99, 100].map((value) => (
          <TouchableOpacity
            key={value}
            style={[
              styles.targetChip,
              target === value && styles.targetChipActive,
            ]}
            onPress={() => setTarget(value)}
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
          <Text style={styles.buttonText}>Tap +1</Text>
        </TouchableOpacity>

      <TouchableOpacity
          style={[styles.button, styles.resetButton]}
          onPress={reset}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>{t.tasbih.reset}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.hintText}>{t.tasbih.tapHint}</Text>
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
      alignItems: "center",
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: palette.textPrimary,
      marginBottom: 16,
      alignSelf: "flex-start",
    },
    card: {
      width: "100%",
      backgroundColor: palette.card,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: palette.border,
      alignItems: "center",
      marginBottom: 16,
    },
    label: {
      color: palette.textSecondary,
      marginBottom: 4,
    },
    count: {
      fontSize: 48,
      fontWeight: "800",
      color: palette.textPrimary,
      marginBottom: 8,
    },
    progressText: {
      marginTop: 4,
      color: palette.accent,
      fontWeight: "600",
    },
    targetRow: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      marginBottom: 16,
      flexWrap: "wrap",
    },
    targetLabel: {
      color: palette.textSecondary,
      marginRight: 8,
    },
    targetChip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: palette.chipBorder,
      marginRight: 8,
    },
    targetChipActive: {
      backgroundColor: palette.accentSoft,
    },
    targetChipText: {
      color: palette.textSecondary,
      fontWeight: "500",
    },
    targetChipTextActive: {
      color: palette.textPrimary,
    },
    actionsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
      marginBottom: 8,
    },
    button: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      marginHorizontal: 4,
    },
    incrementButton: {
      backgroundColor: palette.accent,
    },
    resetButton: {
      backgroundColor: palette.header,
    },
    buttonText: {
      color: "#ffffff",
      fontWeight: "600",
      fontSize: 16,
    },
    hintText: {
      marginTop: 4,
      color: palette.textMuted,
      textAlign: "center",
    },
  });
