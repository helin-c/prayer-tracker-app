// ============================================================================
// FILE: src/api/prayers.js
// ============================================================================
import api from './backend';

export const prayersAPI = {
  /**
   * Get prayer times for a location
   * 
   * Backend automatically detects the best calculation method based on location:
   * - 🇹🇷 Turkey → Method 13 (Diyanet)
   * - 🇸🇦 Saudi Arabia → Method 4 (Umm Al-Qura)
   * - 🇦🇪 UAE → Method 4 (Umm Al-Qura)
   * - 🇪🇬 Egypt → Method 5 (Egyptian Authority)
   * - 🇵🇰 Pakistan → Method 1 (Karachi University)
   * - 🇮🇩 Indonesia → Method 0 (Shia Ithna-Ansari)
   * - 🇲🇾 Malaysia → Method 0
   * - 🇮🇷 Iran → Method 7 (Tehran University)
   * - 🇺🇸 USA/Canada → Method 2 (ISNA)
   * - 🇪🇺 Europe → Method 3 (Muslim World League)
   * 
   * @param {number} latitude - Location latitude
   * @param {number} longitude - Location longitude
   * @returns {Promise} Prayer times data with auto-detected method
   */
  getPrayerTimes: (latitude, longitude) => {
    // Let backend auto-detect the best method - no params needed!
    return api.get('/prayers/times', {
      params: { latitude, longitude }
    });
  },

  /**
   * Get prayer times with explicit method/school
   * Use this ONLY when user manually selects a calculation method in settings
   * 
   * @param {number} latitude - Location latitude
   * @param {number} longitude - Location longitude
   * @param {number} method - Calculation method (0-15)
   * @param {number} school - Asr calculation (0=Shafi, 1=Hanafi)
   */
  getPrayerTimesWithMethod: (latitude, longitude, method, school) =>
    api.get('/prayers/times', {
      params: { latitude, longitude, method, school }
    }),
  
  /**
   * Save user location and preferences
   * 
   * @param {Object} data - Location data
   * @param {number} data.latitude - Latitude
   * @param {number} data.longitude - Longitude
   * @param {string} data.city - City name
   * @param {string} data.country - Country name
   * @param {string} data.timezone - IANA timezone
   * @param {number} [data.calculation_method] - Optional method override
   * @param {number} [data.asr_calculation] - Optional school override
   */
  saveLocation: (data) => api.post('/prayers/location', data),
  
  /**
   * Get saved user location
   */
  getLocation: () => api.get('/prayers/location'),

  /**
   * Delete saved user location
   */
  deleteLocation: () => api.delete('/prayers/location'),

  /**
   * Clear prayer times cache (for testing/debugging)
   */
  clearCache: () => api.delete('/prayers/cache'),

  /**
   * Get cache statistics (for admin/debugging)
   */
  getCacheStats: () => api.get('/prayers/cache/stats'),
};