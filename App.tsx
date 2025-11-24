import React, { useEffect, useState } from "react";
import { 
  SafeAreaView, 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet 
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// --------- TYPES / DATA MODEL (backend-ish) ---------

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


type PrayerName = "Fajr" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";

interface Prayer {
  id: PrayerName;
  label: string;
  time: string;       // later we’ll replace with real data from API
  completed: boolean; // whether user prayed it today
}

// Helper: get today's date key (e.g. 2025-11-24)
const getTodayKey = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// AsyncStorage key prefix
const STORAGE_KEY_PREFIX = "prayers-";

// Fetch prayer times from AlAdhan API for a given city/country
const fetchPrayerTimes = async (
  city: string,
  country: string
): Promise<Partial<Record<PrayerName, string>>> => {
  const url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(
    city
  )}&country=${encodeURIComponent(country)}&method=2`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch prayer times: ${res.status}`);
  }

  const json: AladhanResponse = await res.json();
  const timings = json.data.timings;

  // Map API timings to our PrayerName keys
  return {
    Fajr: timings.Fajr,
    Dhuhr: timings.Dhuhr,
    Asr: timings.Asr,
    Maghrib: timings.Maghrib,
    Isha: timings.Isha,
  };
};


const createDefaultPrayers = (): Prayer[] => [
  { id: "Fajr",    label: "Fajr",    time: "05:30", completed: false },
  { id: "Dhuhr",   label: "Dhuhr",   time: "13:00", completed: false },
  { id: "Asr",     label: "Asr",     time: "16:30", completed: false },
  { id: "Maghrib", label: "Maghrib", time: "19:45", completed: false },
  { id: "Isha",    label: "Isha",    time: "21:00", completed: false },
];

// --------- MAIN APP (screen + logic + UI) ---------

export default function App() {
  const [prayers, setPrayers] = useState<Prayer[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const todayKey = getTodayKey();
  const storageKey = `${STORAGE_KEY_PREFIX}${todayKey}`;

  // Load today’s prayer status from storage
  useEffect(() => {
    const loadPrayers = async () => {
      try {
        const stored = await AsyncStorage.getItem(storageKey);
        if (stored) {
          const parsed: Prayer[] = JSON.parse(stored);
          setPrayers(parsed);
        } else {
          setPrayers(createDefaultPrayers());
        }
      } catch (error) {
        console.warn("Error loading prayers:", error);
        setPrayers(createDefaultPrayers());
      } finally {
        setLoading(false);
      }
    };

    loadPrayers();
  }, [storageKey]);

  useEffect(() => {
    const loadPrayers = async () => {
      try {
       // 1) Try to load today's data from storage
        const stored = await AsyncStorage.getItem(storageKey);
        let basePrayers: Prayer[];

        if (stored) {
          basePrayers = JSON.parse(stored) as Prayer[];
        } else {
          basePrayers = createDefaultPrayers();
        }

        // 2) Fetch real prayer times from API (for now: London, UK)
        try {
          const apiTimes = await fetchPrayerTimes("London", "United Kingdom");

          const withRealTimes = basePrayers.map((p) => {
            const apiTime = apiTimes[p.id];
            // Use API time if we have it, otherwise keep existing time
            return apiTime ? { ...p, time: apiTime } : p;
          });

          basePrayers = withRealTimes;

          // Save with updated times so we don't depend on API every open
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
  

  // Toggle a prayer as done / not done
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

  // Compute progress
  const total = prayers?.length ?? 0;
  const done = prayers?.filter((p) => p.completed).length ?? 0;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  const getNextPrayer = () => {
  if (!prayers) return null;

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  let next: Prayer | null = null;

  prayers.forEach((p) => {
    // time format "HH:MM"
    const [h, m] = p.time.split(":").map((x) => parseInt(x, 10));
    if (Number.isNaN(h) || Number.isNaN(m)) {
      return;
    }
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


  // --------- SIMPLE UI (we’ll beautify later) ---------

  if (loading || !prayers) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading today&apos;s prayers...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header / summary */}
    
      <View style={styles.header}>
        <Text style={styles.appTitle}>Prayer Tracker</Text>
        <Text style={styles.dateText}>{todayKey}</Text>
        <Text style={styles.progressText}>
          {done}/{total} prayers completed ({percent}%)
        </Text>
        {nextPrayer ? (
          <Text style={styles.nextPrayerText}>
            Next prayer: {nextPrayer.label} at {nextPrayer.time}
          </Text>
        ) : (
          <Text style={styles.nextPrayerText}>
            All prayers for today have passed.
          </Text>
        )}
      </View>


      {/* List of prayers */}
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
              <Text style={styles.prayerTime}>Time: {prayer.time}</Text>
            </View>
            <View>
              <Text style={styles.prayerStatus}>
                {prayer.completed ? "✅ Done" : "⭕ Not done"}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Footer status */}
      <View style={styles.footer}>
        {saving ? (
          <Text style={styles.footerText}>Saving...</Text>
        ) : (
          <Text style={styles.footerText}>Tap a prayer to toggle it</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

// --------- STYLES (basic for now) ---------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050816",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#050816",
  },
  loadingText: {
    marginTop: 8,
    color: "#ffffff",
  },
  header: {
    marginBottom: 16,
    marginTop: 8,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
  },
  dateText: {
    marginTop: 4,
    color: "#9ca3af",
  },
  progressText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "500",
    color: "#a5b4fc",
  },
  nextPrayerText: {
    marginTop: 6,
    fontSize: 14,
    color: "#6ee7b7",
  },
  list: {
    flex: 1,
    marginTop: 8,
  },
  prayerCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#111827",
    marginBottom: 10,
  },
  prayerCardCompleted: {
    backgroundColor: "#064e3b",
  },
  prayerName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
  },
  prayerTime: {
    marginTop: 4,
    color: "#9ca3af",
  },
  prayerStatus: {
    fontSize: 14,
    fontWeight: "500",
    color: "#f9fafb",
  },
  footer: {
    paddingVertical: 8,
    alignItems: "center",
  },
  footerText: {
    color: "#9ca3af",
  },
});
