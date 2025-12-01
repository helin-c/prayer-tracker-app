export const STORAGE_KEYS = {
    ACCESS_TOKEN: '@prayer_tracker_access_token',
    REFRESH_TOKEN: '@prayer_tracker_refresh_token',
    USER_DATA: '@prayer_tracker_user',
    THEME: '@prayer_tracker_theme',
    LANGUAGE: '@prayer_tracker_language',
  };
  
  export const API_BASE_URL = __DEV__ 
    ? 'http://localhost:8000/api/v1' 
    : 'https://your-production-api.com/api/v1';
  
  export const PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  export const PRAYER_ICONS = {
    Fajr: 'cloudy-night-outline',
    Dhuhr: 'sunny',
    Asr: 'partly-sunny-outline',
    Maghrib: 'cloudy-night',
    Isha: 'moon',
  };
  export const API_TIMEOUT = 10000; // 10 seconds

  export const CALCULATION_METHODS = {
    JAFARI: { id: 0, name: 'Shia Ithna-Ansari' },
    KARACHI: { id: 1, name: 'University of Islamic Sciences, Karachi' },
    ISNA: { id: 2, name: 'Islamic Society of North America (ISNA)' },
    MWL: { id: 3, name: 'Muslim World League' },
    MAKKAH: { id: 4, name: 'Umm Al-Qura University, Makkah' },
    EGYPT: { id: 5, name: 'Egyptian General Authority of Survey' },
    TEHRAN: { id: 7, name: 'Institute of Geophysics, University of Tehran' },
    GULF: { id: 8, name: 'Gulf Region' },
    KUWAIT: { id: 9, name: 'Kuwait' },
    QATAR: { id: 10, name: 'Qatar' },
    SINGAPORE: { id: 11, name: 'Majlis Ugama Islam Singapura, Singapore' },
    FRANCE: { id: 12, name: 'Union Organization Islamic de France' },
    TURKEY: { id: 13, name: 'Diyanet İşleri Başkanlığı, Turkey' },
    RUSSIA: { id: 14, name: 'Spiritual Administration of Muslims of Russia' },
  };
  
  export const ASR_CALCULATION = {
    SHAFI: { id: 0, name: 'Shafi, Maliki, Jafari, Hanbali' },
    HANAFI: { id: 1, name: 'Hanafi' },
  };

  export const CACHE_DURATION = {
    PRAYER_TIMES: 24 * 60 * 60 * 1000, // 24 hours
    PRAYER_TRACKER: 5 * 60 * 1000, // 5 minutes
    STATISTICS: 5 * 60 * 1000, // 5 minutes
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

  export const STATS_PERIODS = {
    WEEK: 'week',
    MONTH: 'month',
    YEAR: 'year',
  };