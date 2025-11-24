import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSettings } from "../../context/SettingsContext";
import { getStrings } from "../../i18n/translations";
import { getPalette, Palette } from "../../theme/theme";

type PrayerName = "Fajr" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";

interface Prayer {
  id: PrayerName;
  label: string;
  time: string;
  completed: boolean;
}

const STORAGE_KEY_PREFIX = "prayers-";

export function HomeScreen() {
  const { settings } = useSettings();
  const t = getStrings(settings.language);
  const palette = getPalette(settings.theme);
  const styles = React.useMemo(() => createStyles(palette), [palette]);

  const [loading, setLoading] = useState(true);
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [todayKey, setTodayKey] = useState<string>("");

  // Create date key like 2025-11-24
  useEffect(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    setTodayKey(`${y}-${m}-${day}`);
  }, []);

  useEffect(() => {
    if (!todayKey) return;

    const load = async () => {
      setLoading(true);
      const key = STORAGE_KEY_PREFIX + todayKey;

      try {
        const saved = await AsyncStorage.getItem(key);
        if (saved) {
          setPrayers(JSON.parse(saved) as Prayer[]);
          setLoading(false);
          return;
        }

        // Default times for now (you can replace with real API later)
        const defaultTimes: Record<PrayerName, string> = {
          Fajr: "05:30",
          Dhuhr: "12:30",
          Asr: "15:45",
          Maghrib: "16:30",
          Isha: "18:00",
        };

        const initial: Prayer[] = (Object.keys(defaultTimes) as PrayerName[]).map(
          (name) => ({
            id: name,
            label: name,
            time: defaultTimes[name],
            completed: false,
          })
        );

        setPrayers(initial);
        await AsyncStorage.setItem(key, JSON.stringify(initial));
      } catch (e) {
        console.warn("Error loading prayers:", e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [todayKey]);

  const togglePrayer = async (id: PrayerName) => {
    const updated = prayers.map((p) =>
      p.id === id ? { ...p, completed: !p.completed } : p
    );
    setPrayers(updated);

    if (!todayKey) return;
    const key = STORAGE_KEY_PREFIX + todayKey;
    try {
      await AsyncStorage.setItem(key, JSON.stringify(updated));
    } catch (e) {
      console.warn("Error saving prayers:", e);
    }
  };

  const total = prayers.length;
  const done = prayers.filter((p) => p.completed).length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  const nextPrayer = prayers.find((p) => !p.completed) ?? null;

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>{t.common.loading}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appTitle}>{t.home.title}</Text>
        <Text style={styles.dateText}>{todayKey}</Text>

        {/* uses the string template, NOT a function */}
        <Text style={styles.progressText}>
          {t.home.completedSummary
            .replace("{done}", String(done))
            .replace("{total}", String(total))
            .replace("{percent}", String(percent))}
        </Text>

        {nextPrayer ? (
          <Text style={styles.nextPrayerText}>
            {t.home.nextPrayer}: {nextPrayer.label} at {nextPrayer.time}
          </Text>
        ) : (
          <Text style={styles.nextPrayerText}>{t.home.allDone}</Text>
        )}
      </View>

      <ScrollView style={styles.list}>
        {prayers.map((p) => (
          <View
            key={p.id}
            style={[
              styles.prayerCard,
              p.completed && styles.prayerCardCompleted,
            ]}
          >
            <View>
              <Text style={styles.prayerLabel}>{p.label}</Text>
              <Text style={styles.prayerTime}>Time: {p.time}</Text>
            </View>
            <Text
              style={styles.statusText}
              onPress={() => togglePrayer(p.id)}
            >
              {p.completed ? "Done" : "Not done"}
            </Text>
          </View>
        ))}
      </ScrollView>
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
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: palette.background,
    },
    loadingText: {
      marginTop: 8,
      color: palette.textPrimary,
    },
    header: {
      marginBottom: 12,
    },
    appTitle: {
      fontSize: 26,
      fontWeight: "700",
      color: palette.textPrimary,
    },
    dateText: {
      marginTop: 4,
      color: palette.textSecondary,
    },
    progressText: {
      marginTop: 4,
      color: palette.textSecondary,
    },
    nextPrayerText: {
      marginTop: 6,
      color: palette.nextPrayer,
      fontWeight: "500",
    },
    list: {
      flex: 1,
    },
    prayerCard: {
      backgroundColor: palette.card,
      borderRadius: 16,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: palette.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    prayerCardCompleted: {
      backgroundColor: palette.completedCardBackground,
    },
    prayerLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: palette.textPrimary,
    },
    prayerTime: {
      marginTop: 2,
      color: palette.textMuted,
    },
    statusText: {
      color: palette.accent,
      fontWeight: "600",
    },
  });
