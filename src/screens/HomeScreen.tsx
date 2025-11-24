import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSettings } from "../context/SettingsContext";
import { getStrings } from "../i18n/translations";
import { getPalette, Palette } from "../theme/theme";

// --------- TYPES / DATA MODEL ---------

type PrayerName = "Fajr" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";

interface Prayer {
  id: PrayerName;
  label: string;
  time: string;
  completed: boolean;
}

type AladhanResponse = {
  data: {
    timings: {
      Fajr: string;
      Dhuhr: string;
      Asr: string;
      Maghrib: string;
      Isha: string;
      [key: string]: string;
    };
  };
};

const getTodayKey = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const STORAGE_KEY_PREFIX = "prayers-";

const createDefaultPrayers = (): Prayer[] => [
  { id: "Fajr", label: "Fajr", time: "05:30", completed: false },
  { id: "Dhuhr", label: "Dhuhr", time: "13:00", completed: false },
  { id: "Asr", label: "Asr", time: "16:30", completed: false },
  { id: "Maghrib", label: "Maghrib", time: "19:45", completed: false },
  { id: "Isha", label: "Isha", time: "21:00", completed: false },
];

const fetchPrayerTimes = async (city: string, country: string) => {
  const url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(
    city
  )}&country=${encodeURIComponent(country)}&method=2`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch prayer times: ${res.status}`);
  }

  const json: AladhanResponse = await res.json();
  const timings = json.data.timings;

  return {
    Fajr: timings.Fajr,
    Dhuhr: timings.Dhuhr,
    Asr: timings.Asr,
    Maghrib: timings.Maghrib,
    Isha: timings.Isha,
  };
};

export function HomeScreen({ navigation }: { navigation: any }) {
  const { settings } = useSettings();
  const palette = getPalette(settings.theme);
  const t = getStrings(settings.language);

  const [prayers, setPrayers] = useState<Prayer[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const todayKey = getTodayKey();
  const storageKey = `${STORAGE_KEY_PREFIX}${todayKey}`;

  const styles = React.useMemo(() => createStyles(palette), [palette]);

  useEffect(() => {
    const loadPrayers = async () => {
      try {
        const stored = await AsyncStorage.getItem(storageKey);
        let basePrayers: Prayer[];

        if (stored) {
          basePrayers = JSON.parse(stored) as Prayer[];
        } else {
          basePrayers = createDefaultPrayers();
        }

        try {
          const apiTimes = await fetchPrayerTimes("London", "United Kingdom");
          const withRealTimes = basePrayers.map((p) => {
            const apiTime = (apiTimes as any)[p.id];
            return apiTime ? { ...p, time: apiTime } : p;
          });

          basePrayers = withRealTimes;
          await AsyncStorage.setItem(storageKey, JSON.stringify(withRealTimes));
        } catch (apiError) {
          console.warn("Error fetching prayer times, using fallback:", apiError);
        }

        setPrayers(basePrayers);
      } catch (error) {
        console.warn("Error loading prayers:", error);
        setPrayers(createDefaultPrayers());
      } finally {
        setLoading(false);
      }
    };

    loadPrayers();
  }, [storageKey]);

  const togglePrayer = async (id: PrayerName) => {
    if (!prayers) return;

    const updated = prayers.map((p) =>
      p.id === id ? { ...p, completed: !p.completed } : p
    );

    setPrayers(updated);
    setSaving(true);
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (error) {
      console.warn("Error saving prayers:", error);
    } finally {
      setSaving(false);
    }
  };

  const total = prayers?.length ?? 0;
  const done = prayers?.filter((p) => p.completed).length ?? 0;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  const getNextPrayer = (): Prayer | null => {
    if (!prayers) return null;

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    let next: Prayer | null = null;

    prayers.forEach((p) => {
      const [h, m] = p.time.split(":").map((x) => parseInt(x, 10));
      if (Number.isNaN(h) || Number.isNaN(m)) return;

      const prayerMinutes = h * 60 + m;

      if (prayerMinutes > nowMinutes) {
        if (!next) {
          next = p;
        } else {
          const [nh, nm] = next.time.split(":").map((x) => parseInt(x, 10));
          const nextMinutes = nh * 60 + nm;
          if (prayerMinutes < nextMinutes) {
            next = p;
          }
        }
      }
    });

    return next;
  };

  const nextPrayer = getNextPrayer();

  if (loading || !prayers) {
    const loadingStyles = createStyles(palette);
    return (
      <SafeAreaView style={loadingStyles.centered}>
        <ActivityIndicator size="large" />
        <Text style={loadingStyles.loadingText}>{t.home.loading}</Text>
      </SafeAreaView>
    );
  }

  const nextPrayerText = nextPrayer
    ? t.home.nextPrayer(nextPrayer.label, nextPrayer.time)
    : t.home.allPassed;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appTitle}>{t.home.title}</Text>
          <Text style={styles.dateText}>{todayKey}</Text>
          <Text style={styles.progressText}>
            {t.home.progress(done, total, percent)}
          </Text>
          <Text style={styles.nextPrayerText}>{nextPrayerText}</Text>
        </View>

        {/* Feature cards */}
        <View style={styles.featureSection}>
          <Text style={styles.sectionTitle}>{t.home.featuresTitle}</Text>
          <View style={styles.featureRow}>
            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => navigation.navigate("Dhikr")}
              activeOpacity={0.8}
            >
              <Text style={styles.featureTitle}>
                {t.home.featureDhikrTitle}
              </Text>
              <Text style={styles.featureDesc}>
                {t.home.featureDhikrDesc}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => navigation.navigate("Tasbih")}
              activeOpacity={0.8}
            >
              <Text style={styles.featureTitle}>
                {t.home.featureTasbihTitle}
              </Text>
              <Text style={styles.featureDesc}>
                {t.home.featureTasbihDesc}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.featureRow}>
            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => navigation.navigate("Guide")}
              activeOpacity={0.8}
            >
              <Text style={styles.featureTitle}>
                {t.home.featureGuideTitle}
              </Text>
              <Text style={styles.featureDesc}>
                {t.home.featureGuideDesc}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's prayers */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {t.home.todaysPrayersTitle}
          </Text>
        </View>

        <View style={styles.list}>
          {prayers.map((prayer) => (
            <TouchableOpacity
              key={prayer.id}
              style={[
                styles.prayerCard,
                prayer.completed && styles.prayerCardCompleted,
              ]}
              onPress={() => togglePrayer(prayer.id)}
              activeOpacity={0.8}
            >
              <View>
                <Text style={styles.prayerName}>{prayer.label}</Text>
                <Text style={styles.prayerTime}>
                  {t.home.timeLabel(prayer.time)}
                </Text>
              </View>
              <View>
                <Text style={styles.prayerStatus}>
                  {prayer.completed
                    ? t.home.statusDone
                    : t.home.statusNotDone}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t.home.footer}</Text>
          {saving && (
            <Text style={styles.footerText}>{t.common.saving}</Text>
          )}
        </View>
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
      paddingVertical: 12,
      paddingBottom: 32,
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
      marginBottom: 16,
      marginTop: 8,
    },
    appTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: palette.textPrimary,
    },
    dateText: {
      marginTop: 4,
      color: palette.textSecondary,
    },
    progressText: {
      marginTop: 8,
      fontSize: 16,
      fontWeight: "500",
      color: palette.progress,
    },
    nextPrayerText: {
      marginTop: 6,
      fontSize: 14,
      color: palette.nextPrayer,
    },
    featureSection: {
      marginTop: 12,
      marginBottom: 16,
    },
    sectionHeader: {
      marginTop: 8,
      marginBottom: 4,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: palette.textPrimary,
    },
    featureRow: {
      flexDirection: "row",
      marginTop: 8,
    },
    featureCard: {
      flex: 1,
      backgroundColor: palette.card,
      borderRadius: 12,
      padding: 12,
      marginRight: 8,
      borderWidth: 1,
      borderColor: palette.border,
    },
    featureTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: palette.textPrimary,
    },
    featureDesc: {
      marginTop: 4,
      fontSize: 12,
      color: palette.textSecondary,
    },
    list: {
      marginTop: 8,
    },
    prayerCard: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 14,
      borderRadius: 12,
      backgroundColor: palette.card,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: palette.border,
    },
    prayerCardCompleted: {
      backgroundColor: palette.completedCardBackground,
    },
    prayerName: {
      fontSize: 18,
      fontWeight: "600",
      color: palette.textPrimary,
    },
    prayerTime: {
      marginTop: 4,
      color: palette.textSecondary,
    },
    prayerStatus: {
      fontSize: 14,
      fontWeight: "500",
      color: palette.textPrimary,
    },
    footer: {
      paddingVertical: 8,
      alignItems: "center",
    },
    footerText: {
      color: palette.textMuted,
    },
  });
