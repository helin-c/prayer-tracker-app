# ============================================================================
# FILE: backend/app/services/prayer_times.py
# ============================================================================
import httpx
import logging
from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple
import hashlib

logger = logging.getLogger(__name__)

# Import location helper for smart method selection
try:
    from .location_helper import get_calculation_method, get_method_name, get_school_name
    LOCATION_HELPER_AVAILABLE = True
    logger.info("✅ Location helper loaded - Smart method selection enabled")
except ImportError as e:
    logger.warning(f"⚠️  Location helper not available: {e}")
    LOCATION_HELPER_AVAILABLE = False
    
    # Fallback implementations
    def get_calculation_method(lat, lon, method=None, school=None):
        return method or 2, school or 0, {'detected_by': 'default'}
    
    def get_method_name(method):
        return f"Method {method}"
    
    def get_school_name(school):
        return "Hanafi" if school == 1 else "Shafi"


class PrayerTimesService:
    """
    Unified Prayer Times Service with intelligent calculation method selection.
    
    Features:
    - 🌍 Auto-detects country and selects best calculation method
    - 🇹🇷 Turkey → Method 13 (Diyanet)
    - 🇸🇦 Saudi Arabia → Method 4 (Umm Al-Qura)
    - 🇪🇬 Egypt → Method 5 (Egyptian Authority)
    - 🇵🇰 Pakistan → Method 1 (Karachi University)
    - 🇺🇸 USA/Canada → Method 2 (ISNA)
    - 🇪🇺 Europe → Method 3 (Muslim World League)
    - ⚡ 24-hour intelligent caching
    - 📊 Cache statistics and management
    """
    
    BASE_URL = "https://api.aladhan.com/v1"
    CACHE_TTL_HOURS = 24
    
    # In-memory cache: {cache_key: (timestamp, data)}
    _cache: Dict[str, Tuple[datetime, Dict]] = {}
    
    @classmethod
    def _generate_cache_key(
        cls,
        latitude: float,
        longitude: float,
        date: str,
        method: int,
        school: int
    ) -> str:
        """
        Generate cache key from coordinates, date, and calculation settings.
        Rounds coordinates to 2 decimal places (≈1km precision).
        """
        lat_rounded = round(latitude, 2)
        lon_rounded = round(longitude, 2)
        key_data = f"{lat_rounded}:{lon_rounded}:{date}:{method}:{school}"
        return hashlib.md5(key_data.encode()).hexdigest()
    
    @classmethod
    def _get_from_cache(cls, cache_key: str) -> Optional[Dict]:
        """Get cached data if not expired (TTL: 24 hours)."""
        if cache_key in cls._cache:
            cached_time, cached_data = cls._cache[cache_key]
            
            if datetime.utcnow() - cached_time < timedelta(hours=cls.CACHE_TTL_HOURS):
                logger.info(f"📦 Cache HIT: {cache_key[:8]}...")
                return cached_data
            else:
                del cls._cache[cache_key]
                logger.info(f"⏰ Cache EXPIRED: {cache_key[:8]}...")
        
        return None
    
    @classmethod
    def _save_to_cache(cls, cache_key: str, data: Dict):
        """Save data to cache with current timestamp."""
        cls._cache[cache_key] = (datetime.utcnow(), data)
        logger.info(f"💾 Cache SAVED: {cache_key[:8]}...")
        
        # Automatic cleanup: keep max 1000 entries
        if len(cls._cache) > 1000:
            sorted_cache = sorted(cls._cache.items(), key=lambda x: x[1][0])
            cls._cache = dict(sorted_cache[-500:])
            logger.info("🧹 Cache cleanup: removed 500 oldest entries")
    
    @classmethod
    async def _fetch_from_aladhan(
        cls,
        latitude: float,
        longitude: float,
        date: str,
        method: int,
        school: int
    ) -> Optional[Dict]:
        """Fetch prayer times from Aladhan API."""
        try:
            # Convert date format: YYYY-MM-DD → DD-MM-YYYY
            date_obj = datetime.strptime(date, '%Y-%m-%d')
            formatted_date = date_obj.strftime('%d-%m-%Y')
            
            url = f"{cls.BASE_URL}/timings/{formatted_date}"
            params = {
                'latitude': latitude,
                'longitude': longitude,
                'method': method,
                'school': school,
            }
            
            logger.info(
                f"🌍 Aladhan API: method={method} ({get_method_name(method)}), "
                f"school={school} ({get_school_name(school)})"
            )
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                
                if data.get('code') != 200:
                    logger.error(f"Aladhan error code: {data.get('code')}")
                    return None
                
                timings = data['data']['timings']
                
                # Format times (remove timezone info)
                def format_time(time_str: str) -> Dict[str, str]:
                    time_24 = time_str.split(' ')[0]
                    return {'time': time_24, 'readable': time_24}
                
                result = {
                    'fajr': format_time(timings['Fajr']),
                    'sunrise': format_time(timings['Sunrise']),
                    'dhuhr': format_time(timings['Dhuhr']),
                    'asr': format_time(timings['Asr']),
                    'maghrib': format_time(timings['Maghrib']),
                    'isha': format_time(timings['Isha']),
                    'date': date,
                    'source': 'aladhan',
                    'calculation_method': method,
                    'asr_calculation': school
                }
                
                logger.info(f"✅ Aladhan SUCCESS: {latitude:.4f}, {longitude:.4f}")
                return result
                
        except httpx.TimeoutException:
            logger.error("⏱️  Aladhan API timeout")
            return None
        except httpx.HTTPError as e:
            logger.error(f"🌐 Aladhan HTTP error: {e}")
            return None
        except Exception as e:
            logger.error(f"❌ Aladhan error: {type(e).__name__}: {e}")
            return None
    
    @classmethod
    def _calculate_next_prayer(cls, prayer_times: Dict) -> str:
        """
        Calculate which prayer is next based on current time.
        
        Returns:
            Prayer name (capitalized): 'Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'
        """
        now = datetime.now()
        current_time = now.strftime('%H:%M')
        
        prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']
        
        for prayer in prayers:
            prayer_time = prayer_times.get(prayer, {}).get('time', '')
            if prayer_time and prayer_time > current_time:
                return prayer.capitalize()
        
        # All prayers passed → Next is Fajr (tomorrow)
        return 'Fajr'
    
    @classmethod
    async def get_prayer_times(
        cls,
        latitude: float,
        longitude: float,
        date: Optional[str] = None,
        method: Optional[int] = None,
        school: Optional[int] = None
    ) -> Dict:
        """
        Get prayer times with intelligent calculation method selection.
        
        **Smart Method Selection:**
        - If method/school provided → Use them
        - If not → Auto-detect country and use recommended method
        
        **Supported Countries (Auto-Detection):**
        - 🇹🇷 Turkey → Method 13 (Diyanet)
        - 🇸🇦 Saudi Arabia → Method 4 (Umm Al-Qura)
        - 🇦🇪 UAE → Method 4 (Umm Al-Qura)
        - 🇪🇬 Egypt → Method 5 (Egyptian Authority)
        - 🇵🇰 Pakistan → Method 1 (Karachi University)
        - 🇮🇩 Indonesia → Method 0 (Shia Ithna-Ansari)
        - 🇲🇾 Malaysia → Method 0
        - 🇮🇷 Iran → Method 7 (Tehran University)
        - 🌎 North America → Method 2 (ISNA)
        - 🇪🇺 Europe → Method 3 (Muslim World League)
        
        Args:
            latitude: Latitude coordinate (-90 to 90)
            longitude: Longitude coordinate (-180 to 180)
            date: Date in YYYY-MM-DD format (default: today)
            method: Calculation method (optional, will auto-detect if not provided)
            school: Asr calculation (optional, will auto-detect if not provided)
        
        Returns:
            Dictionary with prayer times and metadata
        
        Raises:
            Exception: If API call fails
        """
        # Default to today if no date provided
        if date is None:
            date = datetime.now().strftime('%Y-%m-%d')
        
        # Get optimal calculation method
        if LOCATION_HELPER_AVAILABLE:
            optimal_method, optimal_school, location_info = get_calculation_method(
                latitude, longitude, method, school
            )
        else:
            # Fallback to provided or default values
            optimal_method = method if method is not None else 2
            optimal_school = school if school is not None else 0
            location_info = {'detected_by': 'default', 'method': optimal_method, 'school': optimal_school}
        
        # Log location detection
        logger.info(f"📍 Location: {latitude:.4f}, {longitude:.4f}")
        
        if location_info.get('country_name'):
            logger.info(
                f"{location_info['flag']} {location_info['country_name']} detected → "
                f"Method {optimal_method} ({get_method_name(optimal_method)})"
            )
        elif location_info.get('region_name'):
            logger.info(
                f"{location_info['flag']} {location_info['region_name']} → "
                f"Method {optimal_method} ({get_method_name(optimal_method)})"
            )
        else:
            logger.info(f"Using method {optimal_method} ({get_method_name(optimal_method)})")
        
        # Check cache
        cache_key = cls._generate_cache_key(latitude, longitude, date, optimal_method, optimal_school)
        cached_data = cls._get_from_cache(cache_key)
        
        if cached_data:
            cached_data['from_cache'] = True
            return cached_data
        
        # Fetch from Aladhan
        prayer_data = await cls._fetch_from_aladhan(
            latitude, longitude, date, optimal_method, optimal_school
        )
        
        # Validation
        if not prayer_data:
            logger.error("❌ Aladhan API failed")
            raise Exception(
                "Failed to fetch prayer times. Please check your internet connection."
            )
        
        # Add metadata
        prayer_data['next_prayer'] = cls._calculate_next_prayer(prayer_data)
        prayer_data['cached_at'] = datetime.now().isoformat()
        prayer_data['from_cache'] = False
        prayer_data['location_info'] = location_info
        
        # Cache the result
        cls._save_to_cache(cache_key, prayer_data)
        
        logger.info(
            f"✅ Prayer times ready (next: {prayer_data['next_prayer']})"
        )
        
        return prayer_data
    
    @staticmethod
    def format_prayer_time(time_24: str) -> str:
        """
        Convert 24-hour time to readable 12-hour format.
        
        Examples:
            '05:30' → '5:30 AM'
            '13:45' → '1:45 PM'
        """
        try:
            hour, minute = map(int, time_24.split(":"))
            period = "AM" if hour < 12 else "PM"
            hour_12 = hour if hour <= 12 else hour - 12
            hour_12 = 12 if hour_12 == 0 else hour_12
            return f"{hour_12}:{minute:02d} {period}"
        except Exception:
            return time_24
    
    @classmethod
    def clear_cache(cls):
        """Clear all cached prayer times."""
        entries = len(cls._cache)
        cls._cache.clear()
        logger.info(f"🧹 Cache cleared: {entries} entries removed")
    
    @classmethod
    def get_cache_stats(cls) -> Dict:
        """Get cache statistics for monitoring."""
        if not cls._cache:
            return {
                "total_entries": 0,
                "oldest_entry": None,
                "newest_entry": None
            }
        
        timestamps = [t for t, _ in cls._cache.values()]
        
        return {
            "total_entries": len(cls._cache),
            "oldest_entry": min(timestamps).isoformat() if timestamps else None,
            "newest_entry": max(timestamps).isoformat() if timestamps else None
        }