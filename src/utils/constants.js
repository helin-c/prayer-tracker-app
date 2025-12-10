// ============================================================================
// FILE: src/utils/constants.js (FINAL MERGED VERSION WITH DEVICE AWARE BASE_URL)
// ============================================================================
import Constants from 'expo-constants';

// 💡 Dev ortamında hangi host kullanılacak?
// - Gerçek cihaz (Expo Go, QR)  → Mac IP (ör: 192.168.1.129)
// - iOS/Android simülatör       → localhost

const DEV_API_HOST = 'http://192.168.1.128:8000';  


//const DEV_API_HOST = Constants.isDevice
//  ? 'http://192.168.1.129:8000'   // GERÇEK TELEFON
//  : 'http://localhost:8000';      // SİMÜLATÖR

// -------------------------------------
// STORAGE KEYS
// -------------------------------------
export const STORAGE_KEYS = {
  ACCESS_TOKEN: '@app:access_token',
  REFRESH_TOKEN: '@app:refresh_token',
  USER_DATA: '@app:user_data',
  LANGUAGE: '@app:language',
  THEME: '@app:theme',
  NOTIFICATIONS_ENABLED: '@app:notifications_enabled',
  TASBIH_SESSIONS: 'tasbih_sessions',
  PRAYER_SETTINGS: '@app:prayer_settings',
  LOCATION_CACHE: '@app:location_cache',
};

// -------------------------------------
// API CONFIG & ENDPOINTS
// -------------------------------------
export const API_CONFIG = {
  BASE_URL: __DEV__
    ? DEV_API_HOST                       // 👈 burada artık cihaz tipine göre
    : (process.env.EXPO_PUBLIC_API_URL   // prod
        || 'https://your-production-api.com'),
  TIMEOUT: 10000,
};

export const API_TIMEOUT = API_CONFIG.TIMEOUT;

export const API_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  ME: '/auth/me',
  UPDATE_PROFILE: '/users/me',
  CHANGE_PASSWORD: '/users/me/password',
  PRAYER_TIMES: '/prayer/times',
  TRACK_PRAYER: '/prayer/track',
  PRAYER_STATS: '/prayer/stats',
  QIBLA: '/location/qibla',
};

// -------------------------------------
// INTERNATIONALIZATION
// -------------------------------------
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
];

export const DEFAULT_LANGUAGE = 'en';

// -------------------------------------
// PRAYER CONSTANTS
// -------------------------------------
export const PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

export const PRAYER_ICONS = {
  Fajr: 'cloudy-night-outline',
  Dhuhr: 'sunny',
  Asr: 'partly-sunny-outline',
  Maghrib: 'cloudy-night',
  Isha: 'moon',
};

export const CALCULATION_METHODS = {
  MUSLIM_WORLD_LEAGUE: 3,
  ISLAMIC_SOCIETY_OF_NORTH_AMERICA: 2,
  EGYPTIAN: 5,
  UMM_AL_QURA: 4,
  UNIVERSITY_OF_ISLAMIC_SCIENCES_KARACHI: 1,
  INSTITUTE_OF_GEOPHYSICS_UNIVERSITY_OF_TEHRAN: 7,
  TURKISH: 13,
};

export const CALCULATION_METHOD_DETAILS = {
  [CALCULATION_METHODS.UNIVERSITY_OF_ISLAMIC_SCIENCES_KARACHI]: {
    key: 'UNIVERSITY_OF_ISLAMIC_SCIENCES_KARACHI',
    name: 'University of Islamic Sciences, Karachi',
  },
  [CALCULATION_METHODS.ISLAMIC_SOCIETY_OF_NORTH_AMERICA]: {
    key: 'ISLAMIC_SOCIETY_OF_NORTH_AMERICA',
    name: 'Islamic Society of North America (ISNA)',
  },
  [CALCULATION_METHODS.MUSLIM_WORLD_LEAGUE]: {
    key: 'MUSLIM_WORLD_LEAGUE',
    name: 'Muslim World League',
  },
  [CALCULATION_METHODS.UMM_AL_QURA]: {
    key: 'UMM_AL_QURA',
    name: 'Umm Al-Qura University, Makkah',
  },
  [CALCULATION_METHODS.EGYPTIAN]: {
    key: 'EGYPTIAN',
    name: 'Egyptian General Authority of Survey',
  },
  [CALCULATION_METHODS.INSTITUTE_OF_GEOPHYSICS_UNIVERSITY_OF_TEHRAN]: {
    key: 'INSTITUTE_OF_GEOPHYSICS_UNIVERSITY_OF_TEHRAN',
    name: 'Institute of Geophysics, University of Tehran',
  },
  [CALCULATION_METHODS.TURKISH]: {
    key: 'TURKISH',
    name: 'Diyanet İşleri Başkanlığı, Turkey',
  },
};

export const ASR_CALCULATION = {
  SHAFI: { id: 0, name: 'Shafi, Maliki, Jafari, Hanbali' },
  HANAFI: { id: 1, name: 'Hanafi' },
};

export const CACHE_DURATION = {
  PRAYER_TIMES: 24 * 60 * 60 * 1000,
  PRAYER_TRACKER: 5 * 60 * 1000,
  STATISTICS: 5 * 60 * 1000,
};

export const STATS_PERIODS = {
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year',
};

export const APP_CONFIG = {
  NAME: 'Prayer Tracker',
  VERSION: '1.0.0',
  THEME: {
    PRIMARY: '#00A86B',
    SECONDARY: '#3498DB',
    SUCCESS: '#00A86B',
    WARNING: '#F39C12',
    DANGER: '#DC3545',
    INFO: '#3498DB',
    LIGHT: '#F8F9FA',
    DARK: '#1A1A1A',
    GRAY: '#666666',
  },
};

export const KAABA_LOCATION = {
  latitude: 21.4225,
  longitude: 39.8262,
};
