import { Language } from "../context/SettingsContext";

export const translations = {
  en: {
    common: {
      loading: "Loading...",
      saving: "Saving...",
      cancel: "Cancel",
      ok: "OK",
    },
    home: {
      title: "Prayer Tracker",
      today: "Today",
      completedSummary: "{done}/{total} prayers completed ({percent}%)",
      allDone: "All prayers for today have passed.",
      nextPrayer: "Next prayer",
    },
    settings: {
      title: "Settings",
      subtitle: "Manage your app preferences here.",
      languageSection: "Language",
      themeSection: "Theme",
      languageEnglish: "English",
      languageTurkish: "Turkish",
      themeDark: "Dark",
      themeLight: "Light",
    },
    dhikr: {
      title: "Dhikr & Duas",
    },
    tasbih: {
      title: "Tasbih Counter",
      targetLabel: "Quick targets",
      currentCount: "Current count",
      target: "Target",
      tapHint: "Tap +1 to increment.",
      reset: "Reset",
    },
    guide: {
      title: "Guide",
      subtitle: "Learn how to perform wudu and prayer, step by step.",
      wuduTitle: "How to perform wudu (ablution)",
      prayerTitle: "How to perform salah (prayer)",
      stepLabel: "Step {n}",
      wuduSteps: [
        "Make intention for wudu.",
        "Say Bismillah.",
        "Wash hands up to the wrists three times.",
        "Rinse mouth three times.",
        "Rinse nose three times.",
        "Wash face three times.",
        "Wash arms up to and including the elbows three times.",
        "Wipe the head once (masah).",
        "Wipe the ears once.",
        "Wash feet including the ankles three times.",
      ],
      prayerSteps: [
        "Stand facing the Qibla with intention.",
        "Say Takbir (Allahu Akbar) and raise hands.",
        "Recite Surah Al-Fatiha and another surah.",
        "Perform ruku (bowing) and glorify Allah.",
        "Return to standing position.",
        "Perform sujud (prostration) twice.",
        "Repeat for the required number of rak'ahs.",
        "In the final sitting, recite Tashahhud, salawat and supplication.",
        "End with taslim (saying Assalamu alaikum wa rahmatullah to both sides).",
      ],
    },
    stats: {
      title: "Prayer Stats",
      subtitle: "Your recent prayer completion and streaks.",
      last7Days: "Last 7 days",
      todaySummary: "Today",
      completionLabel: "Completion",
      currentStreakLabel: "Current streak",
      bestStreakLabel: "Best streak",
      fullyCompletedDaysLabel: "Days fully completed",
      noData:
        "Not enough data yet. Use the tracker for a few days to see stats.",
      dayNamesShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      daysSuffix: "days",
      daySuffix: "day",
    },
  },

  tr: {
    common: {
      loading: "Yükleniyor...",
      saving: "Kaydediliyor...",
      cancel: "İptal",
      ok: "Tamam",
    },
    home: {
      title: "Namaz Takip",
      today: "Bugün",
      completedSummary: "{done}/{total} namaz tamamlandı (%{percent})",
      allDone: "Bugünkü bütün namaz vakitleri geçti.",
      nextPrayer: "Sıradaki namaz",
    },
    settings: {
      title: "Ayarlar",
      subtitle: "Uygulama tercihlerini buradan düzenleyebilirsin.",
      languageSection: "Dil",
      themeSection: "Tema",
      languageEnglish: "İngilizce",
      languageTurkish: "Türkçe",
      themeDark: "Koyu",
      themeLight: "Açık",
    },
    dhikr: {
      title: "Zikir & Dualar",
    },
    tasbih: {
      title: "Tesbih Sayacı",
      targetLabel: "Hazır hedefler",
      currentCount: "Mevcut sayı",
      target: "Hedef",
      tapHint: "+1'e dokunarak artır.",
      reset: "Sıfırla",
    },
    guide: {
      title: "Rehber",
      subtitle: "Abdest ve namazı adım adım öğren.",
      wuduTitle: "Abdest nasıl alınır?",
      prayerTitle: "Namaz nasıl kılınır?",
      stepLabel: "{n}. adım",
      wuduSteps: [
        "Abdest için niyet et.",
        "Besmele çek.",
        "Ellerini bileklere kadar üç kez yıka.",
        "Ağzına su alıp çalkala, üç kez.",
        "Burna su verip temizle, üç kez.",
        "Yüzünü üç kez yıka.",
        "Kollarını dirseklere kadar üç kez yıka.",
        "Başın tamamını mesh et.",
        "Kulaklarını mesh et.",
        "Ayaklarını topuklarla birlikte üç kez yıka.",
      ],
      prayerSteps: [
        "Kıbleye yönel ve niyet et.",
        "Tekbir al (Allahu Ekber) ve ellerini kaldır.",
        "Fatiha Suresi ve bir sure/ayet oku.",
        "Rükuya eğil ve tesbih et.",
        "Doğrulup tekrar ayakta bekle.",
        "Secdeye git, iki kez secde yap.",
        "Gereken rekât sayısı kadar bunu tekrar et.",
        "Son oturuşta tahiyyat, salavat ve dua oku.",
        "Sağa ve sola selam vererek namazı bitir.",
      ],
    },
    stats: {
      title: "Namaz İstatistikleri",
      subtitle: "Son günlerdeki namaz tamamlama oranların ve serilerin.",
      last7Days: "Son 7 gün",
      todaySummary: "Bugün",
      completionLabel: "Tamamlama",
      currentStreakLabel: "Mevcut seri",
      bestStreakLabel: "En iyi seri",
      fullyCompletedDaysLabel: "Tam kılınan gün sayısı",
      noData:
        "Şimdilik yeterli veri yok. Birkaç gün boyunca takip ekranını kullanınca burada görünecek.",
      dayNamesShort: ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"],
      daysSuffix: "gün",
      daySuffix: "gün",
    },
  },
} as const;

// Looser type so TS stops complaining about literal differences between en/tr
export type Strings = {
  [key: string]: any;
};

export function getStrings(lang: Language): Strings {
  const value = translations[lang] ?? translations.en;
  return value as Strings;
}
