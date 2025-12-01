# ============================================================================
# FILE: backend/app/api/v1/endpoints/prayer_times.py (NEW)
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
    LocationUpdate,
    MessageResponse
)
from app.services.prayer_times import PrayerTimesService

router = APIRouter()
logger = logging.getLogger(__name__)


# ============================================================================
# GET PRAYER TIMES
# ============================================================================
@router.get(
    "/times",
    response_model=PrayerTimesResponse,
    summary="Get prayer times",
    description="Get prayer times for a specific location"
)
async def get_prayer_times(
    latitude: float = Query(..., ge=-90, le=90, description="Latitude"),
    longitude: float = Query(..., ge=-180, le=180, description="Longitude"),
    method: int = Query(2, ge=0, le=15, description="Calculation method (2=ISNA, 3=MWL, 4=Makkah, 13=Turkey)"),
    school: int = Query(0, ge=0, le=1, description="Asr calculation (0=Shafi, 1=Hanafi)"),
    current_user: User = Depends(get_current_user),
):
    """
    Get prayer times for a location.
    
    **Query Parameters:**
    - latitude: Location latitude (-90 to 90)
    - longitude: Location longitude (-180 to 180)
    - method: Calculation method (default: 2 = ISNA)
    - school: Asr calculation (default: 0 = Shafi)
    
    **Returns:**
    - Complete prayer times for the day
    - Next prayer information
    - Time until next prayer
    
    **Calculation Methods:**
    - 0: Shia Ithna-Ansari
    - 1: University of Islamic Sciences, Karachi
    - 2: Islamic Society of North America (ISNA)
    - 3: Muslim World League (MWL)
    - 4: Umm Al-Qura University, Makkah
    - 5: Egyptian General Authority of Survey
    - 13: Diyanet İşleri Başkanlığı, Turkey
    """
    try:
        # Get user's timezone if available
        user_timezone = None
        
        # Fetch prayer times from service
        data = await PrayerTimesService.get_prayer_times(
            latitude=latitude,
            longitude=longitude,
            method=method,
            school=school,
            user_timezone=user_timezone
        )
        
        # Check if API returned error
        if data.get('code') != 200:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch prayer times from external API"
            )
        
        # Extract relevant data
        api_data = data['data']
        timings = api_data['timings']
        date_info = api_data['date']
        
        # Calculate next prayer
        next_prayer, time_until, seconds_until = PrayerTimesService.calculate_next_prayer(
            timings=timings,
            user_timezone=user_timezone
        )
        
        # Format response
        response = {
            "date": date_info['readable'],
            "hijri_date": date_info['hijri']['date'],
            "fajr": {
                "prayer_name": "Fajr",
                "time": timings['Fajr'],
                "readable": PrayerTimesService.format_prayer_time(timings['Fajr'])
            },
            "sunrise": {
                "prayer_name": "Sunrise",
                "time": timings['Sunrise'],
                "readable": PrayerTimesService.format_prayer_time(timings['Sunrise'])
            },
            "dhuhr": {
                "prayer_name": "Dhuhr",
                "time": timings['Dhuhr'],
                "readable": PrayerTimesService.format_prayer_time(timings['Dhuhr'])
            },
            "asr": {
                "prayer_name": "Asr",
                "time": timings['Asr'],
                "readable": PrayerTimesService.format_prayer_time(timings['Asr'])
            },
            "maghrib": {
                "prayer_name": "Maghrib",
                "time": timings['Maghrib'],
                "readable": PrayerTimesService.format_prayer_time(timings['Maghrib'])
            },
            "isha": {
                "prayer_name": "Isha",
                "time": timings['Isha'],
                "readable": PrayerTimesService.format_prayer_time(timings['Isha'])
            },
            "next_prayer": next_prayer,
            "time_until_next": time_until,
            "seconds_until_next": seconds_until,
            "from_cache": data.get('_from_cache', False)
        }
        
        logger.info(f"Prayer times fetched for user {current_user.id} at ({latitude}, {longitude})")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching prayer times: {str(e)}")
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
    Save or update user's location.
    
    **Request Body:**
    - latitude: Location latitude
    - longitude: Location longitude
    - city: City name (optional)
    - country: Country name (optional)
    - timezone: IANA timezone (optional)
    - calculation_method: Prayer calculation method (default: 2)
    - asr_calculation: Asr calculation method (default: 0)
    
    **Returns:**
    - Success message
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
            
            logger.info(f"Updated location for user {current_user.id}")
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
            logger.info(f"Created new location for user {current_user.id}")
        
        db.commit()
        db.refresh(user_location)
        
        return MessageResponse(message="Location saved successfully")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error saving location for user {current_user.id}: {str(e)}")
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
    description="Get saved user location"
)
async def get_location(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user's saved location.
    
    **Returns:**
    - User's location data
    
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
        logger.error(f"Error getting location for user {current_user.id}: {str(e)}")
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
    description="Delete saved user location"
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
        
        logger.info(f"Deleted location for user {current_user.id}")
        return MessageResponse(message="Location deleted successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting location for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete location"
        )