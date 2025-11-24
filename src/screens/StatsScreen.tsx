import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSettings } from "../context/SettingsContext";
import { getStrings } from "../i18n/translations";
import { getPalette, Palette } from "../theme/theme";

type PrayerName = "Fajr" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";

interface Prayer {
  id: PrayerName;
  label: string;
  time: string;
  completed: boolean;
}

interface DayStat {
  key: string; // YYYY-MM-DD
  label: string; // Mon, Tue...
  percent: number;
  fullyCompleted: boolean;
}

const STORAGE_KEY_PREFIX = "prayers-";

function getDateKeyOffset(offset: number): { key: string; date: Date } {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return { key: `${year}-${month}-${day}`, date: d };
}

export function StatsScreen() {
  const { settings } = useSettings();
  const t = getStrings(settings.language);
  const palette = getPalette(settings.theme);
  const styles = React.useMemo(() => createStyles(palette), [palette]);

  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<DayStat[]>([]);
  const [todayPercent, setTodayPercent] = useState<number | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        // ---- Last 7 days (0 = today, 6 = 6 days ago) ----
        const offsets = Array.from({ length: 7 }, (_, i) => i);
        const keyInfo = offsets.map((off) => getDateKeyOffset(off));
        const keys = keyInfo.map((k) => STORAGE_KEY_PREFIX + k.key);

        const results = await AsyncStorage.multiGet(keys);

        const dayStatsInitial: DayStat[] = results.map(
          ([storageKey, value], idx) => {
            const { key, date } = keyInfo[idx];
            let percent = 0;
            let fullyCompleted = false;

            if (value) {
              try {
                const prayers = JSON.parse(value) as Prayer[];
                const total = prayers.length;
                const done = prayers.filter((p) => p.completed).length;
                percent = total > 0 ? Math.round((done / total) * 100) : 0;
                fullyCompleted = done === total && total > 0;
              } catch {
                // ignore parse error
              }
            }

            const dayNameIndex = date.getDay(); // 0..6
            const dayLabel = t.stats.dayNamesShort[dayNameIndex] ?? key;

            return {
              key,
              label: dayLabel,
              percent,
              fullyCompleted,
            };
          }
        );

        const todayDay = dayStatsInitial[0];
        setTodayPercent(todayDay ? todayDay.percent : null);

        // show chart oldest -> newest (6 days ago ... today)
        const dayStats = [...dayStatsInitial].reverse();
        setDays(dayStats);

        // ---- Streaks based on last 30 days ----
        const streakOffsets = Array.from({ length: 30 }, (_, i) => i);
        const streakKeyInfo = streakOffsets.map((off) =>
          getDateKeyOffset(off)
        );
        const streakKeys = streakKeyInfo.map(
          (k) => STORAGE_KEY_PREFIX + k.key
        );
        const streakResults = await AsyncStorage.multiGet(streakKeys);

        const fullyCompletedFlags: boolean[] = streakResults.map(
          ([storageKey, value]) => {
            if (!value) return false;
            try {
              const prayers = JSON.parse(value) as Prayer[];
              const total = prayers.length;
              const done = prayers.filter((p) => p.completed).length;
              return total > 0 && done === total;
            } catch {
              return false;
            }
          }
        );

        // current streak from today backwards
        let cur = 0;
        for (let i = 0; i < fullyCompletedFlags.length; i++) {
          if (fullyCompletedFlags[i]) cur++;
          else break;
        }

        // best streak within 30 days
        let best = 0;
        let running = 0;
        for (const flag of fullyCompletedFlags) {
          if (flag) {
            running++;
            if (running > best) best = running;
          } else {
            running = 0;
          }
        }

        setCurrentStreak(cur);
        setBestStreak(best);
      } catch (e) {
        console.warn("Error loading stats:", e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [settings.language]);

  const totalFullyCompleted = days.filter((d) => d.fullyCompleted).length;
  const hasData = days.some((d) => d.percent > 0);

  const streakLabel = (value: number) => {
    const suffix =
      value === 1 ? t.stats.daySuffix : t.stats.daysSuffix;
    return `${value} ${suffix}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>{t.common.saving}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{t.stats.title}</Text>
      <Text style={styles.subtitle}>{t.stats.subtitle}</Text>

      {!hasData && (
        <View style={styles.noDataCard}>
          <Text style={styles.noDataText}>{t.stats.noData}</Text>
        </View>
      )}

      {hasData && (
        <>
          {/* Today Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>{t.stats.todaySummary}</Text>
            <Text style={styles.summaryValue}>
              {todayPercent !== null ? `${todayPercent}%` : "--"}
            </Text>
            <Text style={styles.summaryLabel}>
              {t.stats.completionLabel}
            </Text>
          </View>

          {/* Streaks overview */}
          <View style={styles.streakRow}>
            <View style={styles.streakCard}>
              <Text style={styles.streakLabel}>
                {t.stats.currentStreakLabel}
              </Text>
              <Text style={styles.streakValue}>
                {streakLabel(currentStreak)}
              </Text>
            </View>

            <View style={styles.streakCard}>
              <Text style={styles.streakLabel}>
                {t.stats.bestStreakLabel}
              </Text>
              <Text style={styles.streakValue}>
                {streakLabel(bestStreak)}
              </Text>
            </View>
          </View>

          <View style={styles.fullDaysCard}>
            <Text style={styles.fullDaysLabel}>
              {t.stats.fullyCompletedDaysLabel}
            </Text>
            <Text style={styles.fullDaysValue}>{totalFullyCompleted}</Text>
          </View>

          {/* Last 7 days chart */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t.stats.last7Days}</Text>
          </View>

          <View style={styles.chartRow}>
            {days.map((d) => (
              <View key={d.key} style={styles.chartItem}>
                <View style={styles.chartBarOuter}>
                  <View
                    style={[
                      styles.chartBarInner,
                      { height: `${d.percent}%` },
                      d.fullyCompleted && styles.chartBarInnerFull,
                    ]}
                  />
                </View>
                <Text style={styles.chartLabel}>{d.label}</Text>
                <Text style={styles.chartPercent}>
                  {d.percent > 0 ? `${d.percent}%` : ""}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
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
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: palette.textPrimary,
    },
    subtitle: {
      marginTop: 4,
      color: palette.textSecondary,
      marginBottom: 12,
    },
    noDataCard: {
      backgroundColor: palette.card,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: palette.border,
      marginTop: 8,
    },
    noDataText: {
      color: palette.textSecondary,
    },
    summaryCard: {
      marginTop: 10,
      backgroundColor: palette.card,
      borderRadius: 16,
      padding: 16,
      alignItems: "center",
      borderWidth: 1,
      borderColor: palette.border,
    },
    summaryTitle: {
      fontSize: 14,
      color: palette.textSecondary,
    },
    summaryValue: {
      marginTop: 4,
      fontSize: 36,
      fontWeight: "700",
      color: palette.accent,
    },
    summaryLabel: {
      marginTop: 4,
      fontSize: 14,
      color: palette.textMuted,
    },
    streakRow: {
      flexDirection: "row",
      marginTop: 14,
    },
    streakCard: {
      flex: 1,
      backgroundColor: palette.card,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: palette.border,
      marginRight: 8,
    },
    streakLabel: {
      fontSize: 13,
      color: palette.textSecondary,
    },
    streakValue: {
      marginTop: 6,
      fontSize: 18,
      fontWeight: "600",
      color: palette.textPrimary,
    },
    fullDaysCard: {
      marginTop: 10,
      backgroundColor: palette.card,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: palette.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    fullDaysLabel: {
      fontSize: 14,
      color: palette.textSecondary,
    },
    fullDaysValue: {
      fontSize: 20,
      fontWeight: "700",
      color: palette.accent,
    },
    sectionHeader: {
      marginTop: 16,
      marginBottom: 4,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: palette.textPrimary,
    },
    chartRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      marginTop: 4,
      paddingVertical: 8,
    },
    chartItem: {
      alignItems: "center",
      flex: 1,
    },
    chartBarOuter: {
      width: 18,
      height: 80,
      borderRadius: 999,
      backgroundColor: palette.card,
      borderWidth: 1,
      borderColor: palette.border,
      justifyContent: "flex-end",
      overflow: "hidden",
      alignSelf: "center",
    },
    chartBarInner: {
      width: "100%",
      backgroundColor: palette.progress,
      borderRadius: 999,
    },
    chartBarInnerFull: {
      backgroundColor: palette.accent,
    },
    chartLabel: {
      marginTop: 4,
      fontSize: 11,
      color: palette.textSecondary,
    },
    chartPercent: {
      fontSize: 11,
      color: palette.textMuted,
    },
  });
