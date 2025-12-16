// ============================================================================
// FILE: src/utils/timeUtils.js
// ============================================================================

/**
 * Format time based on language/locale preference
 * @param {string} time24 - Time in 24-hour format (e.g., "13:45")
 * @param {string} language - Language code ('en', 'tr', 'ar')
 * @returns {string} Formatted time
 */
export const formatTime = (time24, language = 'en') => {
  if (!time24) return '';

  const [hours, minutes] = time24.split(':').map(Number);

  // Turkish and Arabic use 24-hour format
  if (language === 'tr' || language === 'ar') {
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}`;
  }

  // English uses 12-hour format with AM/PM
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12; // Convert to 12-hour (0 becomes 12)

  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

/**
 * Format *Gregorian* date based on language
 * @param {Date} date - JavaScript Date object
 * @param {string} language - Language code ('en', 'tr', 'ar')
 * @returns {string} Formatted date
 */
export const formatGregorianDate = (date, language = 'en') => {
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  const localeMap = {
    en: 'en-US',
    tr: 'tr-TR',
    ar: 'ar-SA',
  };

  const locale = localeMap[language] || 'en-US';

  return date.toLocaleDateString(locale, options);
};

/**
 * Get time period (AM/PM) for 12-hour format
 * @param {string} time24 - Time in 24-hour format
 * @returns {string} AM or PM
 */
export const getTimePeriod = (time24) => {
  if (!time24) return '';
  const hours = parseInt(time24.split(':')[0], 10);
  return hours >= 12 ? 'PM' : 'AM';
};

/**
 * Formats Islamic (Hijri) date
 * @param {Date} date - JavaScript Date object
 * @param {string} language - Language code ('tr', 'en', 'ar')
 * @returns {string} - Formatted Islamic date
 */
export const formatIslamicDate = (date, language = 'tr') => {
  try {
    // Create Intl.DateTimeFormat for Islamic calendar
    const islamicFormatter = new Intl.DateTimeFormat(
      `${language}-u-ca-islamic`,
      {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }
    );

    return islamicFormatter.format(date);
  } catch (error) {
    console.error('Error formatting Islamic date:', error);

    // Fallback: Return a simple format (Turkish, Islamic calendar)
    const islamicFormatter = new Intl.DateTimeFormat('tr-u-ca-islamic', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    return islamicFormatter.format(date);
  }
};
