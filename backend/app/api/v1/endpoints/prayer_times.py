# ============================================================================
# FILE: backend/app/api/v1/endpoints/prayer_times.py
# ============================================================================
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
import logging

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.prayer import UserLocation
from app.schemas.prayer import (
    PrayerTimesResponse,
    PrayerTimeResponse,
    LocationUpdate,
    MessageResponse
)
from app.services.prayer_times import PrayerTimesService
from app.services.location_helper import detect_country, get_method_name

router = APIRouter()
logger = logging.getLogger(__name__)


# ============================================================================
# GET PRAYER TIMES
# ============================================================================
@router.get(
    "/times",
    response_model=PrayerTimesResponse,
    summary="Get prayer times",
    description="Get prayer times for a specific location with automatic source selection"
)
async def get_prayer_times(
    latitude: float = Query(..., ge=-90, le=90, description="Latitude coordinate"),
    longitude: float = Query(..., ge=-180, le=180, description="Longitude coordinate"),
    method: Optional[int] = Query(None, ge=0, le=15, description="Calculation method (optional, will auto-detect if not provided)"),
    school: Optional[int] = Query(None, ge=0, le=1, description="Asr calculation (optional, will auto-detect if not provided)"),
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format (default: today)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get prayer times with intelligent source selection.
    
    **Automatic Method Selection:**
    - If method/school NOT provided → Auto-detects based on location
    - If method/school provided → Uses user's preference
    
    **Auto-detected countries:**
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
    
    **Query Parameters:**
    - latitude: Location latitude (-90 to 90)
    - longitude: Location longitude (-180 to 180)
    - method: Override calculation method (optional)
    - school: Override Asr calculation (optional)
    - date: Date in YYYY-MM-DD format (optional, defaults to today)
    
    **Returns:**
    - Complete prayer times for the day
    - Next prayer information
    - Source API used
    - Cache status
    """
    try:
        # Get user's saved location settings (if any)
        user_location = db.query(UserLocation).filter(
            UserLocation.user_id == current_user.id
        ).first()
        
        # SMART METHOD SELECTION:
        # If method is default (2=ISNA) and school is default (0=Shafi)
        # → Assume these are defaults from frontend, use auto-detection
        # Otherwise → Use provided values
        
        is_default_params = (method == 2 or method is None) and (school == 0 or school is None)
        
        if user_location and user_location.calculation_method != 2:
            # User has saved custom preferences
            final_method = user_location.calculation_method
            final_school = user_location.asr_calculation
            logger.info(f"📋 Using saved preferences: method={final_method}, school={final_school}")
        elif is_default_params:
            # Default params → auto-detect
            final_method = None
            final_school = None
            logger.info(f"🎯 Auto-detecting method based on location...")
        else:
            # User explicitly chose these values
            final_method = method
            final_school = school
            logger.info(f"🔧 Using explicit parameters: method={final_method}, school={final_school}")
        
        # Fetch prayer times from unified service
        data = await PrayerTimesService.get_prayer_times(
            latitude=latitude,
            longitude=longitude,
            date=date,
            method=final_method,
            school=final_school
        )
        
        # Format response based on source
        source = data.get('source', 'unknown')
        
        if source == 'diyanet':
            # Diyanet format - already has our structure
            response = PrayerTimesResponse(
                date=data['date'],
                hijri_date=data.get('date', ''),  # Diyanet doesn't provide Hijri
                fajr=PrayerTimeResponse(
                    prayer_name="Fajr",
                    time=data['fajr']['time'],
                    readable=PrayerTimesService.format_prayer_time(data['fajr']['time'])
                ),
                sunrise=PrayerTimeResponse(
                    prayer_name="Sunrise",
                    time=data['sunrise']['time'],
                    readable=PrayerTimesService.format_prayer_time(data['sunrise']['time'])
                ),
                dhuhr=PrayerTimeResponse(
                    prayer_name="Dhuhr",
                    time=data['dhuhr']['time'],
                    readable=PrayerTimesService.format_prayer_time(data['dhuhr']['time'])
                ),
                asr=PrayerTimeResponse(
                    prayer_name="Asr",
                    time=data['asr']['time'],
                    readable=PrayerTimesService.format_prayer_time(data['asr']['time'])
                ),
                maghrib=PrayerTimeResponse(
                    prayer_name="Maghrib",
                    time=data['maghrib']['time'],
                    readable=PrayerTimesService.format_prayer_time(data['maghrib']['time'])
                ),
                isha=PrayerTimeResponse(
                    prayer_name="Isha",
                    time=data['isha']['time'],
                    readable=PrayerTimesService.format_prayer_time(data['isha']['time'])
                ),
                next_prayer=data['next_prayer'],
                time_until_next="Calculating...",
                seconds_until_next=0,
                from_cache=data.get('from_cache', False)
            )
            
            logger.info(
                f"🇹🇷 Diyanet prayer times for user {current_user.id} "
                f"at {data.get('city', 'Turkey')} "
                f"(cache: {data.get('from_cache', False)})"
            )
            
        else:  # aladhan
            # Aladhan format - already has our structure  
            response = PrayerTimesResponse(
                date=data['date'],
                hijri_date=data.get('date', ''),
                fajr=PrayerTimeResponse(
                    prayer_name="Fajr",
                    time=data['fajr']['time'],
                    readable=PrayerTimesService.format_prayer_time(data['fajr']['time'])
                ),
                sunrise=PrayerTimeResponse(
                    prayer_name="Sunrise",
                    time=data['sunrise']['time'],
                    readable=PrayerTimesService.format_prayer_time(data['sunrise']['time'])
                ),
                dhuhr=PrayerTimeResponse(
                    prayer_name="Dhuhr",
                    time=data['dhuhr']['time'],
                    readable=PrayerTimesService.format_prayer_time(data['dhuhr']['time'])
                ),
                asr=PrayerTimeResponse(
                    prayer_name="Asr",
                    time=data['asr']['time'],
                    readable=PrayerTimesService.format_prayer_time(data['asr']['time'])
                ),
                maghrib=PrayerTimeResponse(
                    prayer_name="Maghrib",
                    time=data['maghrib']['time'],
                    readable=PrayerTimesService.format_prayer_time(data['maghrib']['time'])
                ),
                isha=PrayerTimeResponse(
                    prayer_name="Isha",
                    time=data['isha']['time'],
                    readable=PrayerTimesService.format_prayer_time(data['isha']['time'])
                ),
                next_prayer=data['next_prayer'],
                time_until_next="Calculating...",
                seconds_until_next=0,
                from_cache=data.get('from_cache', False)
            )
            
            logger.info(
                f"🌍 Aladhan prayer times for user {current_user.id} "
                f"at ({latitude:.4f}, {longitude:.4f}) "
                f"(cache: {data.get('from_cache', False)})"
            )
        
        return response
        
    except Exception as e:
        logger.error(f"❌ Error fetching prayer times for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch prayer times: {str(e)}"
        )


# ============================================================================
# SAVE USER LOCATION
# ============================================================================
@router.post(
    "/location",
    response_model=MessageResponse,
    summary="Save user location",
    description="Save or update user's location for prayer time calculations"
)
async def save_location(
    location_data: LocationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Save or update user's location and prayer calculation preferences.
    
    **Request Body:**
    - latitude: Location latitude (required)
    - longitude: Location longitude (required)
    - city: City name (optional)
    - country: Country name (optional)
    - timezone: IANA timezone like 'Europe/Istanbul' (optional)
    - calculation_method: Prayer calculation method (default: 2)
    - asr_calculation: Asr calculation method (default: 0)
    
    **Returns:**
    - Success message
    
    **Notes:**
    - Timezone is auto-detected if not provided
    - For Turkey, Diyanet API is automatically used regardless of method
    """
    try:
        # Check if user already has a location
        user_location = db.query(UserLocation).filter(
            UserLocation.user_id == current_user.id
        ).first()
        
        if user_location:
            # Update existing location
            user_location.latitude = location_data.latitude
            user_location.longitude = location_data.longitude
            user_location.city = location_data.city
            user_location.country = location_data.country
            user_location.timezone = location_data.timezone
            user_location.calculation_method = location_data.calculation_method or 2
            user_location.asr_calculation = location_data.asr_calculation or 0
            
            logger.info(f"📍 Updated location for user {current_user.id}")
        else:
            # Create new location
            user_location = UserLocation(
                user_id=current_user.id,
                latitude=location_data.latitude,
                longitude=location_data.longitude,
                city=location_data.city,
                country=location_data.country,
                timezone=location_data.timezone,
                calculation_method=location_data.calculation_method or 2,
                asr_calculation=location_data.asr_calculation or 0
            )
            db.add(user_location)
            logger.info(f"✨ Created new location for user {current_user.id}")
        
        db.commit()
        db.refresh(user_location)
        
        # Log which API/method will be used
        country_info = detect_country(location_data.latitude, location_data.longitude)
        
        if country_info:
            api_info = f"{country_info['flag']} {country_info['country_name']} → Method {country_info['method']} ({get_method_name(country_info['method'])})"
        else:
            api_info = f"Method {location_data.calculation_method or 2}"
        
        logger.info(
            f"Location saved: {location_data.city or 'Unknown'}, "
            f"{location_data.country or 'Unknown'} - {api_info}"
        )
        
        return MessageResponse(message="Location saved successfully")
        
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error saving location for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save location"
        )


# ============================================================================
# GET USER LOCATION
# ============================================================================
@router.get(
    "/location",
    response_model=LocationUpdate,
    summary="Get user location",
    description="Get user's saved location and prayer calculation preferences"
)
async def get_location(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user's saved location.
    
    **Returns:**
    - User's location data including coordinates and preferences
    
    **Raises:**
    - 404: Location not found - user needs to save location first
    """
    try:
        user_location = db.query(UserLocation).filter(
            UserLocation.user_id == current_user.id
        ).first()
        
        if not user_location:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Location not found. Please save your location first."
            )
        
        logger.info(f"📍 Retrieved location for user {current_user.id}")
        
        return LocationUpdate(
            latitude=user_location.latitude,
            longitude=user_location.longitude,
            city=user_location.city,
            country=user_location.country,
            timezone=user_location.timezone,
            calculation_method=user_location.calculation_method,
            asr_calculation=user_location.asr_calculation
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting location for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get location"
        )


# ============================================================================
# DELETE USER LOCATION
# ============================================================================
@router.delete(
    "/location",
    response_model=MessageResponse,
    summary="Delete user location",
    description="Delete user's saved location"
)
async def delete_location(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete user's saved location.
    
    **Returns:**
    - Success message
    
    **Raises:**
    - 404: Location not found
    """
    try:
        user_location = db.query(UserLocation).filter(
            UserLocation.user_id == current_user.id
        ).first()
        
        if not user_location:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Location not found"
            )
        
        db.delete(user_location)
        db.commit()
        
        logger.info(f"🗑️  Deleted location for user {current_user.id}")
        return MessageResponse(message="Location deleted successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error deleting location for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete location"
        )


# ============================================================================
# ADMIN/DEBUG ENDPOINTS
# ============================================================================

@router.delete(
    "/cache",
    response_model=MessageResponse,
    summary="Clear prayer times cache",
    description="Clear all cached prayer times (useful for testing)"
)
async def clear_cache(
    current_user: User = Depends(get_current_user)
):
    """
    Clear prayer times cache.
    
    Useful for:
    - Testing new prayer time calculations
    - Forcing fresh API calls
    - Debugging cache issues
    
    **Returns:**
    - Success message with cache stats
    """
    try:
        stats_before = PrayerTimesService.get_cache_stats()
        entries_cleared = stats_before['total_entries']
        
        PrayerTimesService.clear_cache()
        
        logger.info(f"🧹 Cache cleared by user {current_user.id} ({entries_cleared} entries)")
        
        return MessageResponse(
            message=f"Cache cleared successfully ({entries_cleared} entries removed)"
        )
        
    except Exception as e:
        logger.error(f"❌ Error clearing cache: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear cache: {str(e)}"
        )


@router.get(
    "/cache/stats",
    summary="Get cache statistics",
    description="Get cache statistics for monitoring"
)
async def get_cache_stats(
    current_user: User = Depends(get_current_user)
):
    """
    Get cache statistics.
    
    **Returns:**
    - total_entries: Number of cached items
    - oldest_entry: Timestamp of oldest cache entry
    - newest_entry: Timestamp of newest cache entry
    
    Useful for:
    - Monitoring cache performance
    - Debugging cache issues
    - Understanding cache behavior
    """
    try:
        stats = PrayerTimesService.get_cache_stats()
        
        logger.info(f"📊 Cache stats requested by user {current_user.id}")
        
        return {
            "cache_stats": stats,
            "cache_ttl_hours": PrayerTimesService.CACHE_TTL_HOURS,
            "max_cache_entries": 1000
        }
        
    except Exception as e:
        logger.error(f"❌ Error getting cache stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get cache stats: {str(e)}"
        )