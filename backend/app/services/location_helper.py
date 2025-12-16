# ============================================================================
# FILE: backend/app/services/location_helper.py
# ============================================================================
"""
Location detection and prayer calculation method selection.
Automatically selects the most accurate calculation method based on country.

Place this file in: backend/app/services/location_helper.py
"""
from typing import Optional, Dict, Tuple
import logging

logger = logging.getLogger(__name__)


# ============================================================================
# COUNTRY BOUNDING BOXES (Major Islamic Countries)
# ============================================================================
COUNTRY_BOUNDS = {
    'turkey': {
        'name': 'Turkey',
        'lat_range': (36.0, 42.0),
        'lon_range': (26.0, 45.0),
        'method': 13,  # Turkey Diyanet
        'school': 1,   # Hanafi
        'flag': '🇹🇷'
    },
    'saudi_arabia': {
        'name': 'Saudi Arabia',
        'lat_range': (16.0, 32.0),
        'lon_range': (34.5, 56.0),
        'method': 4,   # Umm Al-Qura, Makkah
        'school': 0,   # Shafi
        'flag': '🇸🇦'
    },
    'uae': {
        'name': 'United Arab Emirates',
        'lat_range': (22.5, 26.5),
        'lon_range': (51.0, 56.5),
        'method': 4,   # Umm Al-Qura
        'school': 0,   # Shafi
        'flag': '🇦🇪'
    },
    'egypt': {
        'name': 'Egypt',
        'lat_range': (22.0, 32.0),
        'lon_range': (25.0, 37.0),
        'method': 5,   # Egyptian General Authority of Survey
        'school': 0,   # Shafi
        'flag': '🇪🇬'
    },
    'pakistan': {
        'name': 'Pakistan',
        'lat_range': (23.5, 37.0),
        'lon_range': (60.5, 77.5),
        'method': 1,   # University of Islamic Sciences, Karachi
        'school': 1,   # Hanafi
        'flag': '🇵🇰'
    },
    'indonesia': {
        'name': 'Indonesia',
        'lat_range': (-11.0, 6.0),
        'lon_range': (95.0, 141.0),
        'method': 0,   # Shia Ithna-Ansari (commonly used in Indonesia)
        'school': 0,   # Shafi
        'flag': '🇮🇩'
    },
    'malaysia': {
        'name': 'Malaysia',
        'lat_range': (0.8, 7.5),
        'lon_range': (99.5, 119.5),
        'method': 0,   # Shia Ithna-Ansari
        'school': 0,   # Shafi
        'flag': '🇲🇾'
    },
    'iran': {
        'name': 'Iran',
        'lat_range': (25.0, 40.0),
        'lon_range': (44.0, 64.0),
        'method': 7,   # Institute of Geophysics, University of Tehran
        'school': 0,   # Jafari
        'flag': '🇮🇷'
    },
    'morocco': {
        'name': 'Morocco',
        'lat_range': (27.5, 36.0),
        'lon_range': (-13.5, -1.0),
        'method': 3,   # Muslim World League
        'school': 0,   # Maliki
        'flag': '🇲🇦'
    },
    'algeria': {
        'name': 'Algeria',
        'lat_range': (18.5, 37.5),
        'lon_range': (-8.5, 12.0),
        'method': 3,   # Muslim World League
        'school': 0,   # Maliki
        'flag': '🇩🇿'
    },
    'iraq': {
        'name': 'Iraq',
        'lat_range': (29.0, 37.5),
        'lon_range': (38.5, 49.0),
        'method': 3,   # Muslim World League
        'school': 1,   # Hanafi
        'flag': '🇮🇶'
    },
    'jordan': {
        'name': 'Jordan',
        'lat_range': (29.0, 33.5),
        'lon_range': (34.5, 39.5),
        'method': 3,   # Muslim World League
        'school': 1,   # Hanafi
        'flag': '🇯🇴'
    },
    'syria': {
        'name': 'Syria',
        'lat_range': (32.0, 37.5),
        'lon_range': (35.5, 42.5),
        'method': 3,   # Muslim World League
        'school': 1,   # Hanafi
        'flag': '🇸🇾'
    },
    'lebanon': {
        'name': 'Lebanon',
        'lat_range': (33.0, 34.7),
        'lon_range': (35.0, 36.7),
        'method': 3,   # Muslim World League
        'school': 0,   # Shafi
        'flag': '🇱🇧'
    },
    'qatar': {
        'name': 'Qatar',
        'lat_range': (24.5, 26.5),
        'lon_range': (50.5, 52.0),
        'method': 4,   # Umm Al-Qura
        'school': 1,   # Hanafi
        'flag': '🇶🇦'
    },
    'kuwait': {
        'name': 'Kuwait',
        'lat_range': (28.5, 30.5),
        'lon_range': (46.5, 49.0),
        'method': 3,   # Muslim World League
        'school': 1,   # Hanafi
        'flag': '🇰🇼'
    },
    'oman': {
        'name': 'Oman',
        'lat_range': (16.5, 26.5),
        'lon_range': (52.0, 60.0),
        'method': 4,   # Umm Al-Qura
        'school': 0,   # Shafi
        'flag': '🇴🇲'
    },
    'bahrain': {
        'name': 'Bahrain',
        'lat_range': (25.5, 26.5),
        'lon_range': (50.3, 50.9),
        'method': 4,   # Umm Al-Qura
        'school': 1,   # Hanafi
        'flag': '🇧🇭'
    },
    'tunisia': {
        'name': 'Tunisia',
        'lat_range': (30.0, 37.5),
        'lon_range': (7.5, 11.5),
        'method': 3,   # Muslim World League
        'school': 0,   # Maliki
        'flag': '🇹🇳'
    },
    'libya': {
        'name': 'Libya',
        'lat_range': (19.5, 33.5),
        'lon_range': (9.0, 25.5),
        'method': 3,   # Muslim World League
        'school': 0,   # Maliki
        'flag': '🇱🇾'
    },
}

# Regions with common calculation methods
REGIONAL_METHODS = {
    'north_america': {
        'name': 'North America',
        'method': 2,   # ISNA (Islamic Society of North America)
        'school': 0,   # Shafi (most common)
        'flag': '🌎'
    },
    'europe': {
        'name': 'Europe',
        'method': 3,   # Muslim World League
        'school': 1,   # Hanafi (most common in Europe)
        'flag': '🇪🇺'
    },
    'default': {
        'name': 'Default',
        'method': 2,   # ISNA (widely accepted)
        'school': 0,   # Shafi
        'flag': '🌍'
    }
}


# ============================================================================
# DETECTION FUNCTIONS
# ============================================================================

def detect_country(latitude: float, longitude: float) -> Optional[Dict]:
    """
    Detect country based on coordinates.
    
    Returns:
        Dictionary with country info and recommended calculation method,
        or None if no match found.
    """
    for country_key, country_data in COUNTRY_BOUNDS.items():
        lat_min, lat_max = country_data['lat_range']
        lon_min, lon_max = country_data['lon_range']
        
        if lat_min <= latitude <= lat_max and lon_min <= longitude <= lon_max:
            return {
                'country_key': country_key,
                'country_name': country_data['name'],
                'method': country_data['method'],
                'school': country_data['school'],
                'flag': country_data['flag'],
                'detected_by': 'coordinates'
            }
    
    return None


def detect_region(latitude: float, longitude: float) -> Dict:
    """
    Detect region when specific country is not found.
    
    Returns:
        Dictionary with regional calculation method.
    """
    # North America (US, Canada, Mexico)
    if 15.0 <= latitude <= 72.0 and -170.0 <= longitude <= -50.0:
        return {
            'region': 'north_america',
            'region_name': REGIONAL_METHODS['north_america']['name'],
            'method': REGIONAL_METHODS['north_america']['method'],
            'school': REGIONAL_METHODS['north_america']['school'],
            'flag': REGIONAL_METHODS['north_america']['flag'],
            'detected_by': 'region'
        }
    
    # Europe
    if 35.0 <= latitude <= 71.0 and -10.0 <= longitude <= 40.0:
        return {
            'region': 'europe',
            'region_name': REGIONAL_METHODS['europe']['name'],
            'method': REGIONAL_METHODS['europe']['method'],
            'school': REGIONAL_METHODS['europe']['school'],
            'flag': REGIONAL_METHODS['europe']['flag'],
            'detected_by': 'region'
        }
    
    # Default
    return {
        'region': 'default',
        'region_name': REGIONAL_METHODS['default']['name'],
        'method': REGIONAL_METHODS['default']['method'],
        'school': REGIONAL_METHODS['default']['school'],
        'flag': REGIONAL_METHODS['default']['flag'],
        'detected_by': 'default'
    }


def get_calculation_method(
    latitude: float,
    longitude: float,
    user_method: Optional[int] = None,
    user_school: Optional[int] = None
) -> Tuple[int, int, Dict]:
    """
    Get the best calculation method for given coordinates.
    
    Args:
        latitude: Latitude coordinate
        longitude: Longitude coordinate
        user_method: User's preferred method (overrides detection)
        user_school: User's preferred school (overrides detection)
    
    Returns:
        Tuple of (method, school, location_info)
    """
    # If user has explicit preferences, use them
    if user_method is not None and user_school is not None:
        return user_method, user_school, {
            'detected_by': 'user_preference',
            'method': user_method,
            'school': user_school
        }
    
    # Try to detect specific country first
    country_info = detect_country(latitude, longitude)
    if country_info:
        method = user_method if user_method is not None else country_info['method']
        school = user_school if user_school is not None else country_info['school']
        return method, school, country_info
    
    # Fall back to regional detection
    region_info = detect_region(latitude, longitude)
    method = user_method if user_method is not None else region_info['method']
    school = user_school if user_school is not None else region_info['school']
    return method, school, region_info


def get_method_name(method: int) -> str:
    """Get human-readable name for calculation method."""
    method_names = {
        0: "Shia Ithna-Ansari",
        1: "University of Islamic Sciences, Karachi",
        2: "Islamic Society of North America (ISNA)",
        3: "Muslim World League (MWL)",
        4: "Umm Al-Qura University, Makkah",
        5: "Egyptian General Authority of Survey",
        7: "Institute of Geophysics, University of Tehran",
        13: "Diyanet İşleri Başkanlığı, Turkey"
    }
    return method_names.get(method, f"Method {method}")


def get_school_name(school: int) -> str:
    """Get human-readable name for Asr calculation school."""
    return "Hanafi" if school == 1 else "Shafi/Maliki/Hanbali"