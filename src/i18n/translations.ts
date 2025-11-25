// src/i18n/translations.ts

export const translations = {
  en: {
    common: {
      loading: "Loading...",
      saving: "Saving...",
      title: "Prayer Tracker",
      ok: "OK",
      cancel: "Cancel",
    },

    home: {
      title: "Home",
      appTitle: "Prayer Tracker",
      dateText: "Today",
      fetchingTimes:
        "Fetching prayer times for {city}, {country}...",
      prayerTimesForCity:
        "Prayer times for {city}, {country}",
      completedSummary:
        "{done}/{total} prayers completed ({percent}%)",
      nextPrayerText: "Next prayer",
      allDone: "All prayers completed. Well done!",
    },

    settings: {
      title: "Settings",
      subtitle: "Manage your app preferences here.",
      languageTitle: "Language",
      themeTitle: "Theme",
      locationTitle: "Location for prayer times",
      locationSubtitle: "Choose a default city",
      currentLocation: "Current: {city}, {country}",
    },

    tasbih: {
      title: "Tasbih Counter",
      currentCount: "Current count",
      target: "Target",
      progressText: "{percent}%",
      targetLabel: "Quick targets",
      reset: "Reset",
      tapHint: "Tap the big number to increase the count.",
    },

    stats: {
      title: "Prayer Statistics",
      subtitle: "Completion over the last days.",
      last7Days: "Last 7 days",
      todaySummary: "Today",
      completionLabel: "Completion",
      currentStreakLabel: "Current streak",
      bestStreakLabel: "Best streak",
      fullyCompletedDaysLabel: "Days fully completed",
      noData: "No data yet",
      noDataText:
        "Start tracking your prayers to see your statistics here.",
      daySuffix: "day",
      daysSuffix: "days",
      dayNamesShort: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    },

    guide: {
      title: "Prayer Guide",
      subtitle: "Step-by-step Wudu and Salah guide.",
      wuduTitle: "Steps of Wudu",
      prayerTitle: "Steps of Prayer",
      stepLabel: "Step {n}",
      wuduSteps: [
        "Make the intention for wudu.",
        "Say 'Bismillah'.",
        "Wash your hands three times.",
        "Rinse your mouth three times.",
        "Rinse your nose three times.",
        "Wash your face three times.",
        "Wash your right arm, then left arm, up to the elbows three times.",
        "Wipe your head once.",
        "Wipe your ears once.",
        "Wash your right foot, then left foot, up to the ankles three times.",
      ],
      prayerSteps: [
        "Stand and make the intention for the prayer.",
        "Say the opening takbir: 'Allahu Akbar'.",
        "Recite Surah Al-Fatiha and another surah.",
        "Go into ruku and say the tasbih.",
        "Stand up from ruku saying: 'Sami'Allahu liman hamidah'.",
        "Go into sujood and say the tasbih.",
        "Sit briefly, then go into second sujood.",
        "Complete the remaining rak'ahs as required.",
        "Sit for tashahhud and recite it.",
        "End the prayer with salam to the right and left.",
      ],
    },

    dhikr: {
      title: "Dhikr and Duas",
      recommended: "Recommended dhikr",
      subhanallahTitle: "Subhanallah",
      subhanallahDesc: "Glory be to Allah.",
      alhamdulillahTitle: "Alhamdulillah",
      alhamdulillahDesc:
        "All praise is due to Allah.",
      allahuAkbarTitle: "Allahu Akbar",
      allahuAkbarDesc: "Allah is the Greatest.",
      laIlahaIllallahTitle: "La ilaha illallah",
      laIlahaIllallahDesc:
        "There is no deity except Allah.",
    },

    auth: {
        title: "Welcome",
        loginSubtitle: "Log in to sync your prayers and tasbih across devices.",
        registerSubtitle: "Create an account to keep your progress safe.",
        login: "Login",
        register: "Register",
        email: "Email",
        password: "Password",
        loginButton: "Log in",
        registerButton: "Create account",
    },
  },

  tr: {
    common: {
      loading: "Yükleniyor...",
      saving: "Kaydediliyor...",
      title: "Namaz Takip",
      ok: "Tamam",
      cancel: "İptal",
    },

    home: {
      title: "Ana Sayfa",
      appTitle: "Namaz Takip",
      dateText: "Bugün",
      fetchingTimes:
        "{city}, {country} için namaz vakitleri alınıyor...",
      prayerTimesForCity:
        "{city}, {country} için namaz vakitleri",
      completedSummary:
        "{done}/{total} namaz tamamlandı (%{percent})",
      nextPrayerText: "Sıradaki namaz",
      allDone: "Tüm namazlar tamamlandı. Maşallah!",
    },

    settings: {
      title: "Ayarlar",
      subtitle: "Uygulama tercihlerini buradan düzenleyebilirsin.",
      languageTitle: "Dil",
      themeTitle: "Tema",
      locationTitle: "Namaz vakitleri için konum",
      locationSubtitle: "Varsayılan bir şehir seç",
      currentLocation: "Mevcut: {city}, {country}",
    },

    tasbih: {
      title: "Tesbih Sayacı",
      currentCount: "Mevcut sayı",
      target: "Hedef",
      progressText: "%{percent}",
      targetLabel: "Hazır hedefler",
      reset: "Sıfırla",
      tapHint: "Sayacı artırmak için büyük sayıya dokun.",
    },

    stats: {
      title: "Namaz İstatistikleri",
      subtitle:
        "Son günlerdeki namaz tamamlama oranların ve serilerin.",
      last7Days: "Son 7 gün",
      todaySummary: "Bugün",
      completionLabel: "Tamlama",
      currentStreakLabel: "Mevcut seri",
      bestStreakLabel: "En iyi seri",
      fullyCompletedDaysLabel: "Tamamlanan gün sayısı",
      noData: "Henüz veri yok",
      noDataText:
        "Namazlarını işaretlemeye başladığında istatistiklerin burada görünecek.",
      daySuffix: "gün",
      daysSuffix: "gün",
      dayNamesShort: ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"],
    },

    guide: {
      title: "Namaz Rehberi",
      subtitle: "Adım adım abdest ve namaz rehberi.",
      wuduTitle: "Abdestin adımları",
      prayerTitle: "Namazın adımları",
      stepLabel: "{n}. adım",
      wuduSteps: [
        "Abdest için niyet et.",
        "'Bismillah' de.",
        "Ellerini bileklere kadar üç kez yıka.",
        "Ağzına su alıp üç kez çalkala.",
        "Burnuna su verip üç kez temizle.",
        "Yüzünü üç kez yıka.",
        "Sağ kolunu, sonra sol kolunu dirseklere kadar üç kez yıka.",
        "Başını bir kez mesh et.",
        "Kulaklarını mesh et.",
        "Sağ ayağını, sonra sol ayağını topuklara kadar üç kez yıka.",
      ],
      prayerSteps: [
        "Kıbleye dön ve namaza niyet et.",
        "İftitah tekbiri al: 'Allahu Ekber'.",
        "Fatiha Suresi ve kısa bir sure oku.",
        "Rükûya git ve tesbihleri söyle.",
        "Rükûdan kalk ve 'Semiallahu limen hamideh' de.",
        "Secdeye git, secdede tesbih et.",
        "İki secde arasında kısa otur.",
        "Gerekli rekât sayısını tamamla.",
        "Teşehhüd için otur ve tahiyyatı oku.",
        "Sağa ve sola selam vererek namazı bitir.",
      ],
    },

    dhikr: {
      title: "Zikir ve Dualar",
      recommended: "Önerilen sayılar",
      subhanallahTitle: "Sübhanallah",
      subhanallahDesc:
        "Allah her türlü eksiklikten münezzehtir.",
      alhamdulillahTitle: "Elhamdülillah",
      alhamdulillahDesc:
        "Hamd yalnızca Allah'a mahsustur.",
      allahuAkbarTitle: "Allahu Ekber",
      allahuAkbarDesc: "Allah en büyüktür.",
      laIlahaIllallahTitle: "La ilahe illallah",
      laIlahaIllallahDesc:
        "Allah'tan başka ilah yoktur.",
    },

    auth: {
        title: "Hoş geldin",
        loginSubtitle: "Namaz ve tesbih ilerlemeni cihazlar arasında eşitle.",
        registerSubtitle: "İlerlemeni kaybetmemek için bir hesap oluştur.",
        login: "Giriş",
        register: "Kayıt ol",
        email: "E-posta",
        password: "Şifre",
        loginButton: "Giriş yap",
        registerButton: "Hesap oluştur",
    },
  },
} as const;

export type Language = keyof typeof translations;
export type Strings = (typeof translations)[Language];

export function getStrings(lang: Language): Strings {
  // always returns a valid bundle
  return translations[lang];
}
