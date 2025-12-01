# ============================================================================
# FILE: backend/app/services/prayer_times.py
# ============================================================================
import httpx
from datetime import datetime, timedelta
from typing import Optional, Dict, Tuple
import hashlib
import logging

logger = logging.getLogger(__name__)


class PrayerTimesService:
    """
    Service for fetching prayer times from AlAdhan API.
    
    Features:
    - Coordinate rounding for cache efficiency
    - 24-hour cache TTL
    - Automatic cache cleanup
    - Next prayer calculation
    """
    
    BASE_URL = "https://api.aladhan.com/v1"
    CACHE_TTL_HOURS = 24
    COORDINATE_PRECISION = 2  # ~1km precision
    
    # In-memory cache (for production, use Redis)
    _cache: Dict[str, Tuple[datetime, Dict]] = {}
    
    @classmethod
    def _round_coordinates(cls, latitude: float, longitude: float) -> Tuple[float, float]:
        """
        Round coordinates to reduce cache keys for nearby users.
        2 decimal places ≈ 1km precision (good enough for prayer times)
        """
        return (
            round(latitude, cls.COORDINATE_PRECISION),
            round(longitude, cls.COORDINATE_PRECISION)
        )
    
    @classmethod
    def _generate_cache_key(
        cls,
        latitude: float,
        longitude: float,
        date: str,
        method: int,
        school: int
    ) -> str:
        """Generate cache key from rounded coordinates and parameters."""
        lat_rounded, lon_rounded = cls._round_coordinates(latitude, longitude)
        key_data = f"{lat_rounded}:{lon_rounded}:{date}:{method}:{school}"
        return hashlib.md5(key_data.encode()).hexdigest()
    
    @classmethod
    def _get_from_cache(cls, cache_key: str) -> Optional[Dict]:
        """Get cached data if not expired"""
        if cache_key in cls._cache:
            cached_time, cached_data = cls._cache[cache_key]
            
            # Check if cache is still valid (24 hours)
            if datetime.utcnow() - cached_time < timedelta(hours=cls.CACHE_TTL_HOURS):
                logger.info(f"Cache hit for key: {cache_key[:8]}...")
                return cached_data
            else:
                # Remove expired cache
                del cls._cache[cache_key]
                logger.info(f"Cache expired for key: {cache_key[:8]}...")
        
        return None
    
    @classmethod
    def _save_to_cache(cls, cache_key: str, data: Dict):
        """Save data to cache with current timestamp"""
        cls._cache[cache_key] = (datetime.utcnow(), data)
        logger.info(f"Cached data for key: {cache_key[:8]}...")
        
        # Optional: Clean old cache entries (keep max 1000 entries)
        if len(cls._cache) > 1000:
            sorted_cache = sorted(
                cls._cache.items(),
                key=lambda x: x[1][0]
            )
            cls._cache = dict(sorted_cache[-500:])
            logger.info("Cache cleanup performed")
    
    @classmethod
    async def get_prayer_times(
        cls,
        latitude: float,
        longitude: float,
        date: Optional[str] = None,
        method: int = 2,
        school: int = 0,
        user_timezone: Optional[str] = None
    ) -> Dict:
        """
        Fetch prayer times from AlAdhan API with caching.
        
        Args:
            latitude: Location latitude
            longitude: Location longitude
            date: Date in DD-MM-YYYY format (defaults to today)
            method: Calculation method (2 = ISNA)
            school: Asr calculation (0 = Shafi, 1 = Hanafi)
            user_timezone: User's timezone (optional)
        
        Returns:
            Dict with prayer times data
        """
        # If no date provided, use today
        if date is None:
            date = datetime.utcnow().strftime("%d-%m-%Y")
        
        # Generate cache key
        cache_key = cls._generate_cache_key(latitude, longitude, date, method, school)
        
        # Try to get from cache
        cached_data = cls._get_from_cache(cache_key)
        if cached_data:
            cached_data['_from_cache'] = True
            return cached_data
        
        # Cache miss - fetch from API
        url = f"{cls.BASE_URL}/timings/{date}"
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "method": method,
            "school": school
        }
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
            
            logger.info(f"Fetched prayer times from API for {latitude}, {longitude}")
            
            # Save to cache
            cls._save_to_cache(cache_key, data)
            data['_from_cache'] = False
            
            return data
            
        except httpx.HTTPError as e:
            logger.error(f"HTTP error fetching prayer times: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Error fetching prayer times: {str(e)}")
            raise
    
    @staticmethod
    def calculate_next_prayer(
        timings: Dict,
        current_datetime: Optional[datetime] = None,
        user_timezone: Optional[str] = None
    ) -> Tuple[str, str, int]:
        """
        Calculate which prayer is next and time until it.
        
        Args:
            timings: Prayer times dict from API
            current_datetime: Current datetime (for testing)
            user_timezone: User's timezone string
            
        Returns:
            Tuple: (prayer_name, time_until_str, seconds_remaining)
        """
        # Use current time
        now = current_datetime or datetime.now()
        
        prayer_order = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"]
        
        for prayer_name in prayer_order:
            prayer_time_str = timings.get(prayer_name, "")
            if not prayer_time_str:
                continue
            
            try:
                # Parse prayer time (HH:MM format)
                prayer_hour, prayer_minute = map(int, prayer_time_str.split(":"))
                
                # Create prayer datetime
                prayer_time = now.replace(
                    hour=prayer_hour,
                    minute=prayer_minute,
                    second=0,
                    microsecond=0
                )
                
                # If prayer time is in the future
                if prayer_time > now:
                    time_diff = prayer_time - now
                    seconds = int(time_diff.total_seconds())
                    hours = seconds // 3600
                    minutes = (seconds % 3600) // 60
                    
                    if hours > 0:
                        time_until = f"{hours}h {minutes}m"
                    else:
                        time_until = f"{minutes}m"
                    
                    return prayer_name, time_until, seconds
                    
            except (ValueError, AttributeError) as e:
                logger.error(f"Error parsing prayer time for {prayer_name}: {e}")
                continue
        
        # All prayers passed - next is Fajr tomorrow
        try:
            fajr_time_str = timings.get("Fajr", "")
            if fajr_time_str:
                fajr_hour, fajr_minute = map(int, fajr_time_str.split(":"))
                fajr_tomorrow = (now + timedelta(days=1)).replace(
                    hour=fajr_hour,
                    minute=fajr_minute,
                    second=0,
                    microsecond=0
                )
                
                time_diff = fajr_tomorrow - now
                seconds = int(time_diff.total_seconds())
                hours = seconds // 3600
                minutes = (seconds % 3600) // 60
                time_until = f"{hours}h {minutes}m"
                
                return "Fajr", time_until, seconds
        except (ValueError, AttributeError):
            pass
        
        return "Unknown", "N/A", 0
    
    @staticmethod
    def format_prayer_time(time_24: str) -> str:
        """Convert 24h time to readable 12h format"""
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
        """Clear all cached prayer times (useful for testing)"""
        cls._cache.clear()
        logger.info("Cache cleared")
    
    @classmethod
    def get_cache_stats(cls) -> Dict:
        """Get cache statistics"""
        return {
            "total_entries": len(cls._cache),
            "cache_keys": list(cls._cache.keys())[:10]
        }