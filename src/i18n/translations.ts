import { Language } from "../context/SettingsContext";

export const translations = {
  en: {
    common: {
      saving: "Saving...",
      settingsSaved: "Settings saved ✅",
      loadingSettings: "Loading settings...",
    },
    home: {
      title: "Prayer Tracker",
      featuresTitle: "Features",
      todaysPrayersTitle: "Today’s Prayers",
      progress: (done: number, total: number, percent: number) =>
        `${done}/${total} prayers completed (${percent}%)`,
      nextPrayer: (label: string, time: string) =>
        `Next prayer: ${label} at ${time}`,
      allPassed: "All prayers for today have passed.",
      timeLabel: (time: string) => `Time: ${time}`,
      statusDone: "✅ Done",
      statusNotDone: "⭕ Not done",
      footer: "Tap a prayer card to toggle it.",
      loading: "Loading today's prayers...",
      featureDhikrTitle: "Dhikr",
      featureDhikrDesc: "Daily dhikr suggestions and recommended counts.",
      featureTasbihTitle: "Tasbih Counter",
      featureTasbihDesc: "Track your tasbih count with saved targets.",
      featureGuideTitle: "Wudu & Prayer Guide",
      featureGuideDesc: "Step-by-step guide for wudu and prayer.",
    },
    settings: {
      title: "Settings",
      subtitle: "Manage your app preferences here.",
      languageTitle: "Language",
      languageHelper: "This language preference is used across the app.",
      themeTitle: "Theme",
      themeButton: (theme: string) =>
        `Current theme: ${theme} (tap to toggle)`,
      themeHelper:
        "Theme doesn’t change all styling yet, but your preference is saved.",
    },
    dhikr: {
      title: "Daily Dhikr",
      subtitle: "Simple dhikr you can repeat throughout your day.",
      recommended: (count: number) => `Recommended: ${count} times`,
    },
    tasbih: {
      title: "Tasbih Counter",
      subtitle: "Tap the button to increase your count.",
      currentCount: "Current count",
      targetProgress: (target: number, progress: number) =>
        `Target: ${target} • Progress: ${progress}%`,
      quickTargets: "Quick targets:",
      buttonIncrement: "Tap +1",
      buttonReset: "Reset",
    },
    guide: {
      title: "Wudu & Prayer Guide",
      subtitle:
        "A short guide summarising the steps of wudu (ablution) and salah.",
      wuduTitle: "Wudu Steps",
      prayerTitle: "Prayer Steps",
      stepLabel: (index: number) => `Step ${index}`,
      wuduSteps: [
        "Intend to perform wudu for the sake of Allah.",
        "Begin by saying 'Bismillah'.",
        "Wash both hands up to the wrists three times.",
        "Rinse the mouth three times.",
        "Clean the nose by sniffing water and blowing it out three times.",
        "Wash the face from hairline to chin three times.",
        "Wash the arms including the elbows three times – right then left.",
        "Wipe the head with wet hands (masah).",
        "Wipe the ears (inside and outside).",
        "Wash the feet including the ankles three times – right then left.",
      ],
      prayerSteps: [
        "Stand facing the Qibla and make intention for the specific prayer.",
        "Raise hands and say 'Allahu Akbar' (opening takbir).",
        "While standing, recite Surah Al-Fatiha and another surah.",
        "Bow in ruku, saying 'Subhana Rabbiyal Azim' three times.",
        "Return to standing, saying 'Sami'allahu liman hamidah'.",
        "Go into sujud (prostration) with forehead, nose, hands, knees and toes on the ground.",
        "Sit briefly between the two sujuds.",
        "Perform the second sujud.",
        "Sit and recite tashahhud, salawat, and supplications.",
        "End the prayer with salam to the right and left.",
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
      saving: "Kaydediliyor...",
      settingsSaved: "Ayarlar kaydedildi ✅",
      loadingSettings: "Ayarlar yükleniyor...",
    },
    home: {
      title: "Namaz Takibi",
      featuresTitle: "Özellikler",
      todaysPrayersTitle: "Bugünün Namazları",
      progress: (done: number, total: number, percent: number) =>
        `${done}/${total} namaz kılındı (${percent}%)`,
      nextPrayer: (label: string, time: string) =>
        `Sıradaki namaz: ${label} • ${time}`,
      allPassed: "Bugünkü tüm namaz vakitleri geçti.",
      timeLabel: (time: string) => `Saat: ${time}`,
      statusDone: "✅ Kılındı",
      statusNotDone: "⭕ Henüz kılınmadı",
      footer: "Bir namazı işaretlemek için karta dokun.",
      loading: "Bugünün namaz saatleri yükleniyor...",
      featureDhikrTitle: "Zikir",
      featureDhikrDesc: "Günlük zikir önerileri ve sayı tavsiyeleri.",
      featureTasbihTitle: "Tesbih Sayacı",
      featureTasbihDesc: "Hedefli tesbih sayacı ile sayımını takip et.",
      featureGuideTitle: "Abdest & Namaz",
      featureGuideDesc: "Adım adım abdest ve namaz rehberi.",
    },
    settings: {
      title: "Ayarlar",
      subtitle: "Uygulama tercihlerini buradan düzenleyebilirsin.",
      languageTitle: "Dil",
      languageHelper:
        "Buradan seçtiğin dil, uygulamanın genelinde kullanılacaktır.",
      themeTitle: "Tema",
      themeButton: (theme: string) =>
        `Şu anki tema: ${theme === "dark" ? "Koyu" : "Açık"} (dokunarak değiştir)`,
      themeHelper:
        "Tema henüz tüm tasarımı değiştirmiyor ama seçimin kaydediliyor.",
    },
    dhikr: {
      title: "Günlük Zikir",
      subtitle: "Gün içinde tekrar edebileceğin basit zikirler.",
      recommended: (count: number) => `Önerilen: ${count} defa`,
    },
    tasbih: {
      title: "Tesbih Sayacı",
      subtitle: "Sayacı arttırmak için butona dokun.",
      currentCount: "Güncel sayı",
      targetProgress: (target: number, progress: number) =>
        `Hedef: ${target} • İlerleme: ${progress}%`,
      quickTargets: "Hızlı hedefler:",
      buttonIncrement: "+1 Ekle",
      buttonReset: "Sıfırla",
    },
    guide: {
      title: "Abdest ve Namaz Rehberi",
      subtitle:
        "Abdest (wudu) ve namaz adımlarını özetleyen kısa bir rehber.",
      wuduTitle: "Abdest Adımları",
      prayerTitle: "Namaz Kılma Adımları",
      stepLabel: (index: number) => `Adım ${index}`,
      wuduSteps: [
        "Allah rızası için abdest almaya niyet edilir.",
        "“Bismillah” diyerek başla.",
        "Eller bileklere kadar üç kez yıkanır.",
        "Ağıza üç kez su verilip çalkalanır.",
        "Buruna üç kez su çekilip temizlenir.",
        "Yüz, saç diplerinden çene altına kadar üç kez yıkanır.",
        "Kollar dirseklerle birlikte üç kez yıkanır – önce sağ, sonra sol.",
        "Başın mesh edilmesi – başın üstü ıslak elle meshedilir.",
        "Kulaklar iç ve dış kısımlarıyla mesh edilir.",
        "Ayaklar topuklarla birlikte üç kez yıkanır – önce sağ, sonra sol.",
      ],
      prayerSteps: [
        "Kıbleye dönülür ve kılınacak namaza niyet edilir.",
        "Eller kaldırılır ve “Allahu Ekber” diyerek tekbir alınır.",
        "Kıyamda Fatiha ve bir sure okunur.",
        "Rükûya gidilir, “Sübhane Rabbiyel Azîm” üç kez denir.",
        "Tekrar kıyama dönülür, “Semi'allahu limen hamideh” denir.",
        "Secdeye gidilir ve alın secdeye konur.",
        "İki secde arasında kısa bir oturuş yapılır.",
        "İkinci secde yapılır.",
        "Teşehhüdde oturulur, ettehiyyat, salavat ve dualar okunur.",
        "Sağa ve sola selam verilerek namaz bitirilir.",
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

export function getStrings(language: Language) {
  return translations[language] ?? translations.en;
}
