 // ============================================================================
// FILE: src/utils/constants.js
// ============================================================================
import Constants from 'expo-constants';

// 💡 Dev ortamında hangi host kullanılacak?
const DEV_API_HOST = 'http://192.168.1.145:8000';

//const DEV_API_HOST = Constants.isDevice
//  ? 'http://10.0.3.92:8000'   // GERÇEK TELEFON
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
    ? DEV_API_HOST
    : (process.env.EXPO_PUBLIC_API_URL || 'https://your-production-api.com'),
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

// -------------------------------------
// CALCULATION METHODS (Aladhan API)
// -------------------------------------
export const CALCULATION_METHODS = {
  SHIA_ITHNA_ANSARI: 0,                              // Indonesia, Malaysia
  UNIVERSITY_OF_ISLAMIC_SCIENCES_KARACHI: 1,          // Pakistan
  ISLAMIC_SOCIETY_OF_NORTH_AMERICA: 2,                // USA, Canada (ISNA)
  MUSLIM_WORLD_LEAGUE: 3,                             // Europe, Middle East (MWL)
  UMM_AL_QURA: 4,                                     // Saudi Arabia, UAE
  EGYPTIAN: 5,                                        // Egypt
  INSTITUTE_OF_GEOPHYSICS_UNIVERSITY_OF_TEHRAN: 7,   // Iran
  GULF_REGION: 8,                                     // Gulf countries
  KUWAIT: 9,                                          // Kuwait
  QATAR: 10,                                          // Qatar
  MAJLIS_UGAMA_ISLAM_SINGAPURA: 11,                  // Singapore
  UNION_ORGANIZATION_ISLAMIC_DE_FRANCE: 12,          // France
  DIYANET_TURKEY: 13,                                 // Turkey
  SPIRITUAL_ADMINISTRATION_OF_MUSLIMS_OF_RUSSIA: 14, // Russia
  MOONSIGHTING_COMMITTEE_WORLDWIDE: 15,              // Moonsighting
};

export const CALCULATION_METHOD_DETAILS = {
  [CALCULATION_METHODS.SHIA_ITHNA_ANSARI]: {
    key: 'SHIA_ITHNA_ANSARI',
    name: 'Shia Ithna-Ansari',
    region: 'Indonesia, Malaysia',
    flag: '🇮🇩'
  },
  [CALCULATION_METHODS.UNIVERSITY_OF_ISLAMIC_SCIENCES_KARACHI]: {
    key: 'UNIVERSITY_OF_ISLAMIC_SCIENCES_KARACHI',
    name: 'University of Islamic Sciences, Karachi',
    region: 'Pakistan',
    flag: '🇵🇰'
  },
  [CALCULATION_METHODS.ISLAMIC_SOCIETY_OF_NORTH_AMERICA]: {
    key: 'ISLAMIC_SOCIETY_OF_NORTH_AMERICA',
    name: 'Islamic Society of North America (ISNA)',
    region: 'North America',
    flag: '🇺🇸'
  },
  [CALCULATION_METHODS.MUSLIM_WORLD_LEAGUE]: {
    key: 'MUSLIM_WORLD_LEAGUE',
    name: 'Muslim World League (MWL)',
    region: 'Europe, Middle East',
    flag: '🌍'
  },
  [CALCULATION_METHODS.UMM_AL_QURA]: {
    key: 'UMM_AL_QURA',
    name: 'Umm Al-Qura University, Makkah',
    region: 'Saudi Arabia, UAE',
    flag: '🇸🇦'
  },
  [CALCULATION_METHODS.EGYPTIAN]: {
    key: 'EGYPTIAN',
    name: 'Egyptian General Authority of Survey',
    region: 'Egypt',
    flag: '🇪🇬'
  },
  [CALCULATION_METHODS.INSTITUTE_OF_GEOPHYSICS_UNIVERSITY_OF_TEHRAN]: {
    key: 'INSTITUTE_OF_GEOPHYSICS_UNIVERSITY_OF_TEHRAN',
    name: 'Institute of Geophysics, University of Tehran',
    region: 'Iran',
    flag: '🇮🇷'
  },
  [CALCULATION_METHODS.GULF_REGION]: {
    key: 'GULF_REGION',
    name: 'Gulf Region',
    region: 'Gulf Countries',
    flag: '🇦🇪'
  },
  [CALCULATION_METHODS.KUWAIT]: {
    key: 'KUWAIT',
    name: 'Kuwait',
    region: 'Kuwait',
    flag: '🇰🇼'
  },
  [CALCULATION_METHODS.QATAR]: {
    key: 'QATAR',
    name: 'Qatar',
    region: 'Qatar',
    flag: '🇶🇦'
  },
  [CALCULATION_METHODS.MAJLIS_UGAMA_ISLAM_SINGAPURA]: {
    key: 'MAJLIS_UGAMA_ISLAM_SINGAPURA',
    name: 'Majlis Ugama Islam Singapura',
    region: 'Singapore',
    flag: '🇸🇬'
  },
  [CALCULATION_METHODS.UNION_ORGANIZATION_ISLAMIC_DE_FRANCE]: {
    key: 'UNION_ORGANIZATION_ISLAMIC_DE_FRANCE',
    name: 'Union Organization Islamic de France',
    region: 'France',
    flag: '🇫🇷'
  },
  [CALCULATION_METHODS.DIYANET_TURKEY]: {
    key: 'DIYANET_TURKEY',
    name: 'Diyanet İşleri Başkanlığı, Turkey',
    region: 'Turkey',
    flag: '🇹🇷'
  },
  [CALCULATION_METHODS.SPIRITUAL_ADMINISTRATION_OF_MUSLIMS_OF_RUSSIA]: {
    key: 'SPIRITUAL_ADMINISTRATION_OF_MUSLIMS_OF_RUSSIA',
    name: 'Spiritual Administration of Muslims of Russia',
    region: 'Russia',
    flag: '🇷🇺'
  },
  [CALCULATION_METHODS.MOONSIGHTING_COMMITTEE_WORLDWIDE]: {
    key: 'MOONSIGHTING_COMMITTEE_WORLDWIDE',
    name: 'Moonsighting Committee Worldwide',
    region: 'Worldwide',
    flag: '🌙'
  },
};

// Auto-detected countries with recommended methods
export const COUNTRY_METHODS = {
  'Turkey': CALCULATION_METHODS.DIYANET_TURKEY,
  'Saudi Arabia': CALCULATION_METHODS.UMM_AL_QURA,
  'UAE': CALCULATION_METHODS.UMM_AL_QURA,
  'Egypt': CALCULATION_METHODS.EGYPTIAN,
  'Pakistan': CALCULATION_METHODS.UNIVERSITY_OF_ISLAMIC_SCIENCES_KARACHI,
  'Indonesia': CALCULATION_METHODS.SHIA_ITHNA_ANSARI,
  'Malaysia': CALCULATION_METHODS.SHIA_ITHNA_ANSARI,
  'Iran': CALCULATION_METHODS.INSTITUTE_OF_GEOPHYSICS_UNIVERSITY_OF_TEHRAN,
  'Kuwait': CALCULATION_METHODS.KUWAIT,
  'Qatar': CALCULATION_METHODS.QATAR,
  'Singapore': CALCULATION_METHODS.MAJLIS_UGAMA_ISLAM_SINGAPURA,
  'France': CALCULATION_METHODS.UNION_ORGANIZATION_ISLAMIC_DE_FRANCE,
  'Russia': CALCULATION_METHODS.SPIRITUAL_ADMINISTRATION_OF_MUSLIMS_OF_RUSSIA,
};

export const ASR_CALCULATION = {
  SHAFI: { id: 0, name: 'Shafi, Maliki, Jafari, Hanbali' },
  HANAFI: { id: 1, name: 'Hanafi' },
};

// Countries that commonly use Hanafi school
export const HANAFI_COUNTRIES = [
  'Turkey',
  'Pakistan',
  'Afghanistan',
  'Bangladesh',
  'Iraq',
  'Jordan',
  'Syria',
  'Lebanon',
  'Central Asia',
];

export const CACHE_DURATION = {
  PRAYER_TIMES: 24 * 60 * 60 * 1000,  // 24 hours
  PRAYER_TRACKER: 5 * 60 * 1000,       // 5 minutes
  STATISTICS: 5 * 60 * 1000,           // 5 minutes
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

// Helper function to get calculation method for a country
export const getMethodForCountry = (countryName) => {
  return COUNTRY_METHODS[countryName] || CALCULATION_METHODS.ISLAMIC_SOCIETY_OF_NORTH_AMERICA;
};

// Helper function to check if country uses Hanafi
export const isHanafiCountry = (countryName) => {
  return HANAFI_COUNTRIES.includes(countryName);
};