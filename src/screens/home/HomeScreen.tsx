// src/screens/home/HomeScreen.tsx
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useSettings } from "../../context/SettingsContext";
import { getStrings } from "../../i18n/translations";
import { getPalette, Palette } from "../../theme/theme";
import { getPrayerTimesByCity, PrayerTimings } from "../..//api/prayerTimes";

type PrayerName = "Fajr" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";

interface Prayer {
  id: PrayerName;
  label: string;
  time: string;
  completed: boolean;
}

const STORAGE_KEY_PREFIX = "prayers-";

function getTodayKey(date: Date): string {
  // YYYY-MM-DD
  return date.toISOString().split("T")[0];
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":");
  const hh = parseInt(h, 10);
  const mm = parseInt(m, 10);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return 0;
  return hh * 60 + mm;
}

function findNextPrayer(prayers: Prayer[], now: Date): Prayer | null {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const upcoming = prayers
    .filter((p) => !p.completed)
    .filter((p) => timeToMinutes(p.time) >= currentMinutes)
    .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

  return upcoming[0] ?? null;
}

export default function HomeScreen() {
  const { settings } = useSettings();
  const t = getStrings(settings.language);
  const palette = getPalette(settings.theme);
  const styles = React.useMemo(() => createStyles(palette), [palette]);

  const [loading, setLoading] = useState(true);
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [todayKey, setTodayKey] = useState<string>("");
  const [nextPrayer, setNextPrayer] = useState<Prayer | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const today = new Date();
        const key = getTodayKey(today);
        setTodayKey(key);

        const storageKey = `${STORAGE_KEY_PREFIX}${key}`;
        const stored = await AsyncStorage.getItem(storageKey);

        let dayPrayers: Prayer[];

        if (stored) {
          // Use saved completion state
          dayPrayers = JSON.parse(stored) as Prayer[];
        } else {
          // Get prayer times (shape can be either {data:{timings}} or just timings)
          const raw = await getPrayerTimes(settings.city, settings.country);
          const timings = (raw as any).data?.timings ?? raw;

          dayPrayers = [
            {
              id: "Fajr",
              label: "Fajr",
              time: timings.Fajr,
              completed: false,
            },
            {
              id: "Dhuhr",
              label: "Dhuhr",
              time: timings.Dhuhr,
              completed: false,
            },
            {
              id: "Asr",
              label: "Asr",
              time: timings.Asr,
              completed: false,
            },
            {
              id: "Maghrib",
              label: "Maghrib",
              time: timings.Maghrib,
              completed: false,
            },
            {
              id: "Isha",
              label: "Isha",
              time: timings.Isha,
              completed: false,
            },
          ];

          await AsyncStorage.setItem(storageKey, JSON.stringify(dayPrayers));
        }

        setPrayers(dayPrayers);
        setNextPrayer(findNextPrayer(dayPrayers, new Date()));
      } catch (e) {
        console.warn("Error loading prayer times:", e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [settings.city, settings.country, settings.language]);

  const togglePrayer = async (id: PrayerName) => {
    setPrayers((prev) => {
      const updated = prev.map((p) =>
        p.id === id ? { ...p, completed: !p.completed } : p
      );

      if (todayKey) {
        const storageKey = `${STORAGE_KEY_PREFIX}${todayKey}`;
        AsyncStorage.setItem(storageKey, JSON.stringify(updated)).catch(
          (e) => {
            console.warn("Error saving prayers:", e);
          }
        );
      }

      setNextPrayer(findNextPrayer(updated, new Date()));
      return updated;
    });
  };

  const total = prayers.length;
  const done = prayers.filter((p) => p.completed).length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  const completedSummaryTemplate = t.home.completedSummary || "";
  const nextPrayerTemplate = t.home.nextPrayerText || "";

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
        <Text style={styles.dateText}>
          {t.home.prayerTimesForCity
            .replace("{city}", settings.city)
            .replace("{country}", settings.country)}
        </Text>
      </View>

      <View style={styles.progressCard}>
        <Text style={styles.progressText}>
          {completedSummaryTemplate
            .replace("{done}", String(done))
            .replace("{total}", String(total))
            .replace("{percent}", String(percent))}
        </Text>

        {nextPrayer ? (
          <Text style={styles.nextPrayerText}>
            {nextPrayerTemplate
              .replace("{name}", nextPrayer.label)
              .replace("{time}", nextPrayer.time)}
          </Text>
        ) : (
          <Text style={styles.nextPrayerText}>{t.home.allDone}</Text>
        )}
      </View>

      <ScrollView style={styles.list}>
        {prayers.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={[
              styles.prayerItem,
              p.completed && styles.prayerItemCompleted,
            ]}
            onPress={() => togglePrayer(p.id)}
          >
            <View>
              <Text style={styles.prayerLabel}>{p.label}</Text>
              <Text style={styles.prayerTime}>{p.time}</Text>
            </View>
            <Text style={styles.prayerStatus}>
              {p.completed ? "✓" : "•"}
            </Text>
          </TouchableOpacity>
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
      paddingTop: 16,
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: palette.background,
    },
    loadingText: {
      marginTop: 12,
      color: palette.textSecondary,
    },
    header: {
      marginBottom: 16,
    },
    appTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: palette.textPrimary,
      marginBottom: 4,
    },
    dateText: {
      fontSize: 14,
      color: palette.textSecondary,
    },
    progressCard: {
      padding: 12,
      borderRadius: 12,
      backgroundColor: palette.card,
      marginBottom: 16,
    },
    progressText: {
      fontSize: 14,
      color: palette.textPrimary,
      marginBottom: 4,
    },
    nextPrayerText: {
      fontSize: 14,
      color: palette.accent,
    },
    list: {
      flex: 1,
    },
    prayerItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: palette.border,
    },
    prayerItemCompleted: {
      opacity: 0.6,
    },
    prayerLabel: {
      fontSize: 16,
      color: palette.textPrimary,
    },
    prayerTime: {
      fontSize: 14,
      color: palette.textSecondary,
    },
    prayerStatus: {
      fontSize: 18,
      color: palette.accent,
    },
  });

export type HomeScreenStyles = ReturnType<typeof createStyles>;
function getPrayerTimes(city: string, country: string) {
  throw new Error("Function not implemented.");
}

