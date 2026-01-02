# ============================================================================
# FILE: backend/app/api/v1/endpoints/prayer_times.py (ASYNC PRODUCTION READY)
# ============================================================================
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession  # ✅ CHANGED
from sqlalchemy.future import select             # ✅ CHANGED
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
from app.core.rate_limiter import rate_limit

router = APIRouter()
logger = logging.getLogger(__name__)


# ============================================================================
# GET PRAYER TIMES (ASYNC)
# ============================================================================
@router.get(
    "/times",
    response_model=PrayerTimesResponse,
    summary="Get prayer times",
    description="Get prayer times for a specific location with automatic source selection",
    dependencies=[Depends(rate_limit(60, 3600, by_user=True))]
)
async def get_prayer_times(
    latitude: float = Query(..., ge=-90, le=90, description="Latitude coordinate"),
    longitude: float = Query(..., ge=-180, le=180, description="Longitude coordinate"),
    method: Optional[int] = Query(None, ge=0, le=15, description="Calculation method"),
    school: Optional[int] = Query(None, ge=0, le=1, description="Asr calculation"),
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)  # ✅ CHANGED
):
    """
    Get prayer times with intelligent source selection.
    """
    try:
        # Get user's saved location settings (Async)
        result = await db.execute(select(UserLocation).filter(UserLocation.user_id == current_user.id))
        user_location = result.scalars().first()
        
        # SMART METHOD SELECTION
        is_default_params = (method == 2 or method is None) and (school == 0 or school is None)
        
        if user_location and user_location.calculation_method != 2:
            final_method = user_location.calculation_method
            final_school = user_location.asr_calculation
            logger.info(f"📋 Using saved preferences: method={final_method}, school={final_school}")
        elif is_default_params:
            final_method = None
            final_school = None
            logger.info(f"🎯 Auto-detecting method based on location...")
        else:
            final_method = method
            final_school = school
            logger.info(f"🔧 Using explicit parameters: method={final_method}, school={final_school}")
        
        # Fetch prayer times (Service handles external API calls asynchronously)
        data = await PrayerTimesService.get_prayer_times(
            latitude=latitude,
            longitude=longitude,
            date=date,
            method=final_method,
            school=final_school
        )
        
        # Format response based on source
        source = data.get('source', 'unknown')
        
        # Helper to format time
        def fmt_time(t): return PrayerTimesService.format_prayer_time(t)
        
        # Common structure for response mapping
        response = PrayerTimesResponse(
            date=data['date'],
            hijri_date=data.get('date', '') if source != 'diyanet' else '',
            fajr=PrayerTimeResponse(prayer_name="Fajr", time=data['fajr']['time'], readable=fmt_time(data['fajr']['time'])),
            sunrise=PrayerTimeResponse(prayer_name="Sunrise", time=data['sunrise']['time'], readable=fmt_time(data['sunrise']['time'])),
            dhuhr=PrayerTimeResponse(prayer_name="Dhuhr", time=data['dhuhr']['time'], readable=fmt_time(data['dhuhr']['time'])),
            asr=PrayerTimeResponse(prayer_name="Asr", time=data['asr']['time'], readable=fmt_time(data['asr']['time'])),
            maghrib=PrayerTimeResponse(prayer_name="Maghrib", time=data['maghrib']['time'], readable=fmt_time(data['maghrib']['time'])),
            isha=PrayerTimeResponse(prayer_name="Isha", time=data['isha']['time'], readable=fmt_time(data['isha']['time'])),
            next_prayer=data['next_prayer'],
            time_until_next="Calculating...",
            seconds_until_next=0,
            from_cache=data.get('from_cache', False)
        )
        
        logger.info(
            f"Prayer times fetched ({source}) for user {current_user.id} "
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
# SAVE USER LOCATION (ASYNC)
# ============================================================================
@router.post(
    "/location",
    response_model=MessageResponse,
    summary="Save user location"
)
async def save_location(
    location_data: LocationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)  # ✅ CHANGED
):
    """Save or update user's location and preferences."""
    try:
        # Check existing location
        result = await db.execute(select(UserLocation).filter(UserLocation.user_id == current_user.id))
        user_location = result.scalars().first()
        
        if user_location:
            # Update existing
            user_location.latitude = location_data.latitude
            user_location.longitude = location_data.longitude
            user_location.city = location_data.city
            user_location.country = location_data.country
            user_location.timezone = location_data.timezone
            user_location.calculation_method = location_data.calculation_method or 2
            user_location.asr_calculation = location_data.asr_calculation or 0
            logger.info(f"📍 Updated location for user {current_user.id}")
        else:
            # Create new
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
        
        await db.commit()  # ✅ Async Commit
        await db.refresh(user_location)  # ✅ Async Refresh
        
        # Log metadata (country detection is synchronous/CPU-bound, safe to run)
        country_info = detect_country(location_data.latitude, location_data.longitude)
        if country_info:
            api_info = f"{country_info['flag']} {country_info['country_name']} -> Method {country_info['method']}"
        else:
            api_info = f"Method {location_data.calculation_method or 2}"
            
        logger.info(f"Location saved: {location_data.city}, {location_data.country} - {api_info}")
        
        return MessageResponse(message="Location saved successfully")
        
    except Exception as e:
        await db.rollback()
        logger.error(f"❌ Error saving location: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save location"
        )


# ============================================================================
# GET USER LOCATION (ASYNC)
# ============================================================================
@router.get(
    "/location",
    response_model=LocationUpdate,
    summary="Get user location"
)
async def get_location(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's saved location."""
    try:
        result = await db.execute(select(UserLocation).filter(UserLocation.user_id == current_user.id))
        user_location = result.scalars().first()
        
        if not user_location:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Location not found. Please save your location first."
            )
        
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
        logger.error(f"❌ Error getting location: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get location"
        )


# ============================================================================
# DELETE USER LOCATION (ASYNC)
# ============================================================================
@router.delete(
    "/location",
    response_model=MessageResponse,
    summary="Delete user location"
)
async def delete_location(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete user's saved location."""
    try:
        result = await db.execute(select(UserLocation).filter(UserLocation.user_id == current_user.id))
        user_location = result.scalars().first()
        
        if not user_location:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Location not found"
            )
        
        await db.delete(user_location)
        await db.commit()
        
        logger.info(f"🗑️ Deleted location for user {current_user.id}")
        return MessageResponse(message="Location deleted successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"❌ Error deleting location: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete location"
        )


# ============================================================================
# ADMIN/DEBUG ENDPOINTS (Using Service Layer)
# ============================================================================

@router.delete(
    "/cache",
    response_model=MessageResponse,
    summary="Clear prayer times cache"
)
async def clear_cache(current_user: User = Depends(get_current_user)):
    """Clear prayer times cache."""
    try:
        stats_before = PrayerTimesService.get_cache_stats()
        entries_cleared = stats_before['total_entries']
        
        PrayerTimesService.clear_cache()
        logger.info(f"🧹 Cache cleared by user {current_user.id}")
        
        return MessageResponse(message=f"Cache cleared successfully ({entries_cleared} entries removed)")
        
    except Exception as e:
        logger.error(f"❌ Error clearing cache: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear cache: {str(e)}"
        )


@router.get(
    "/cache/stats",
    summary="Get cache statistics"
)
async def get_cache_stats(current_user: User = Depends(get_current_user)):
    """Get cache statistics."""
    try:
        stats = PrayerTimesService.get_cache_stats()
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