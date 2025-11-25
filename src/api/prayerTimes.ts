// src/api/prayerTimes.ts
export type PrayerTimings = {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  [key: string]: string;
};

interface AladhanResponse {
  code: number;
  status?: string;
  data?: {
    timings: PrayerTimings;
  };
}

// Uses AlAdhan API to get prayer times by city
export async function getPrayerTimesByCity(
  city: string,
  country: string,
  method: number = 2 // 2 = Muslim World League (common default)
): Promise<PrayerTimings | null> {
  try {
    const url =
      "https://api.aladhan.com/v1/timingsByCity" +
      `?city=${encodeURIComponent(city)}` +
      `&country=${encodeURIComponent(country)}` +
      `&method=${method}`;

    const res = await fetch(url);
    if (!res.ok) {
      console.warn("Prayer API HTTP error:", res.status);
      return null;
    }

    const json: AladhanResponse = await res.json();
    if (json.code !== 200 || !json.data) {
      console.warn("Prayer API returned non-200 code:", json.code, json.status);
      return null;
    }

    return json.data.timings;
  } catch (err) {
    console.warn("Failed to fetch prayer times:", err);
    return null;
  }
}
