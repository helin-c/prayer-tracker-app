import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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

  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(33);
  const [loading, setLoading] = useState(true);

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
    counterCard: {
      marginTop: 20,
      backgroundColor: palette.card,
      borderRadius: 16,
      paddingVertical: 20,
      paddingHorizontal: 16,
      alignItems: "center",
      borderWidth: 1,
      borderColor: palette.border,
    },
    counterLabel: {
      fontSize: 14,
      color: palette.textSecondary,
    },
    counterValue: {
      marginTop: 8,
      fontSize: 48,
      fontWeight: "700",
      color: palette.accent,
    },
    progressText: {
      marginTop: 6,
      fontSize: 14,
      color: palette.progress,
    },
    targetRow: {
      marginTop: 20,
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
    },
    targetLabel: {
      fontSize: 14,
      color: palette.textPrimary,
      marginRight: 8,
    },
    targetChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: palette.chipBorder,
      marginRight: 8,
      marginTop: 4,
    },
    targetChipActive: {
      backgroundColor: palette.accentSoft,
      borderColor: palette.accent,
    },
    targetChipText: {
      color: palette.textPrimary,
    },
    targetChipTextActive: {
      color: palette.accent,
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
      backgroundColor: palette.accent,
      marginRight: 8,
    },
    resetButton: {
      backgroundColor: palette.card,
      borderWidth: 1,
      borderColor: palette.border,
      marginLeft: 8,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: "600",
      color: palette.textPrimary,
    },
  });
