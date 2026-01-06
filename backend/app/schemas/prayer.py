# ============================================================================
# FILE: backend/app/schemas/prayer.py (COMPLETE FIXED VERSION)
# ============================================================================
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict
from datetime import datetime
import re


# ============================================================================
# PRAYER TIME SCHEMAS (from old schema - essential for prayer times API)
# ============================================================================

class PrayerTimeResponse(BaseModel):
    """Individual prayer time response"""
    prayer_name: str
    time: str
    readable: str


class PrayerTimesResponse(BaseModel):
    """Complete prayer times for a day"""
    date: str
    hijri_date: str
    fajr: PrayerTimeResponse
    sunrise: PrayerTimeResponse
    dhuhr: PrayerTimeResponse
    asr: PrayerTimeResponse
    maghrib: PrayerTimeResponse
    isha: PrayerTimeResponse
    next_prayer: str
    time_until_next: str
    seconds_until_next: int = Field(default=0, description="Seconds until next prayer")
    from_cache: bool = Field(default=False, description="Whether data came from cache")


# ============================================================================
# LOCATION SCHEMAS
# ============================================================================

class LocationUpdate(BaseModel):
    """Update user location and prayer calculation settings"""
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    city: Optional[str] = None
    country: Optional[str] = None
    timezone: Optional[str] = Field(None, description="IANA timezone (e.g., 'Europe/Istanbul')")
    calculation_method: Optional[int] = Field(default=2, ge=0, le=15)
    asr_calculation: Optional[int] = Field(default=0, ge=0, le=1)


# ============================================================================
# PRAYER LOG SCHEMAS
# ============================================================================

class PrayerLogCreate(BaseModel):
    """Schema for creating a new prayer log"""
    prayer_name: str = Field(..., description="Prayer name: Fajr, Dhuhr, Asr, Maghrib, or Isha")
    prayer_date: str = Field(..., description="Date in YYYY-MM-DD format")
    prayer_time: str = Field(..., description="Prayer time in HH:MM format")
    completed: bool = Field(default=True, description="Whether prayer was completed")
    on_time: bool = Field(default=False, description="Whether prayer was on time")
    
    @validator('prayer_name')
    def validate_prayer_name(cls, v):
        """Validate prayer name is one of the 5 daily prayers"""
        valid_prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']
        if v not in valid_prayers:
            raise ValueError(f'Prayer name must be one of: {", ".join(valid_prayers)}')
        return v
    
    @validator('prayer_date')
    def validate_date_format(cls, v):
        """Validate date format is YYYY-MM-DD"""
        if not re.match(r'^\d{4}-\d{2}-\d{2}$', v):
            raise ValueError('Date must be in YYYY-MM-DD format')
        try:
            datetime.strptime(v, '%Y-%m-%d')
        except ValueError:
            raise ValueError('Invalid date')
        return v
    
    @validator('prayer_time')
    def validate_time_format(cls, v):
        """Validate time format is HH:MM"""
        if not re.match(r'^\d{2}:\d{2}$', v):
            raise ValueError('Time must be in HH:MM format')
        try:
            datetime.strptime(v, '%H:%M')
        except ValueError:
            raise ValueError('Invalid time')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "prayer_name": "Fajr",
                "prayer_date": "2024-01-15",
                "prayer_time": "05:30",
                "completed": True,
                "on_time": True
            }
        }


class PrayerLogUpdate(BaseModel):
    """Schema for updating an existing prayer log"""
    completed: Optional[bool] = Field(None, description="Update completion status")
    on_time: Optional[bool] = Field(None, description="Update on-time status")
    
    class Config:
        json_schema_extra = {
            "example": {
                "completed": True,
                "on_time": False
            }
        }


class PrayerLogResponse(BaseModel):
    """Response schema for prayer log"""
    id: int
    user_id: int
    prayer_name: str
    prayer_date: str
    prayer_time: str
    completed: bool
    on_time: bool
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# PRAYER STATUS SCHEMAS (for calendar/dashboard views)
# ============================================================================

class PrayerItem(BaseModel):
    """Individual prayer item in a day"""
    id: Optional[int] = None
    prayer_name: str
    prayer_time: str
    completed: bool = False
    on_time: bool = False
    completed_at: Optional[datetime] = None


class DayPrayerStatus(BaseModel):
    """Prayer status for a single day with all 5 prayers"""
    date: str
    prayers: List[PrayerItem]
    completed_count: int = Field(..., description="Number of completed prayers")
    total_prayers: int = Field(default=5, description="Total prayers in a day")
    completion_percentage: float = Field(..., description="Percentage of completed prayers")
    on_time_count: int = Field(..., description="Number of on-time prayers")
    
    class Config:
        json_schema_extra = {
            "example": {
                "date": "2024-01-15",
                "prayers": [
                    {
                        "id": 1,
                        "prayer_name": "Fajr",
                        "prayer_time": "05:30",
                        "completed": True,
                        "on_time": True,
                        "completed_at": "2024-01-15T05:35:00"
                    }
                ],
                "completed_count": 3,
                "total_prayers": 5,
                "completion_percentage": 60.0,
                "on_time_count": 2
            }
        }


# ============================================================================
# PRAYER DETAIL FOR CALENDAR (NEW - FOR WEEK VIEW)
# ============================================================================

class PrayerDetail(BaseModel):
    """Individual prayer detail for calendar view"""
    completed: bool
    on_time: bool
    time: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "completed": True,
                "on_time": True,
                "time": "05:30"
            }
        }


# ============================================================================
# WEEK VIEW SCHEMAS (FIXED - WITH PRAYER DETAILS)
# ============================================================================

class DayStatus(BaseModel):
    """Day status for calendar/week view WITH detailed prayer information"""
    date: str
    completion_percentage: float
    on_time_count: int = Field(default=0, description="Number of on-time prayers")
    prayers: Dict[str, PrayerDetail] = Field(..., description="Prayer details keyed by prayer name (lowercase)")
    is_today: bool = False
    
    class Config:
        json_schema_extra = {
            "example": {
                "date": "2024-01-15",
                "completion_percentage": 80.0,
                "on_time_count": 3,
                "prayers": {
                    "fajr": {"completed": True, "on_time": True, "time": "05:30"},
                    "dhuhr": {"completed": True, "on_time": False, "time": "12:15"},
                    "asr": {"completed": True, "on_time": True, "time": "15:00"},
                    "maghrib": {"completed": True, "on_time": True, "time": "17:45"},
                    "isha": {"completed": False, "on_time": False, "time": None}
                },
                "is_today": True
            }
        }


class WeekPrayerStatus(BaseModel):
    """Prayer status for a week (7 days) with full prayer details"""
    start_date: str
    end_date: str
    days: List[DayStatus]
    
    class Config:
        json_schema_extra = {
            "example": {
                "start_date": "2024-01-15",
                "end_date": "2024-01-21",
                "days": [
                    {
                        "date": "2024-01-15",
                        "completion_percentage": 100.0,
                        "on_time_count": 5,
                        "prayers": {
                            "fajr": {"completed": True, "on_time": True, "time": "05:30"},
                            "dhuhr": {"completed": True, "on_time": True, "time": "12:15"},
                            "asr": {"completed": True, "on_time": True, "time": "15:00"},
                            "maghrib": {"completed": True, "on_time": True, "time": "17:45"},
                            "isha": {"completed": True, "on_time": True, "time": "20:00"}
                        },
                        "is_today": False
                    },
                    {
                        "date": "2024-01-16",
                        "completion_percentage": 80.0,
                        "on_time_count": 3,
                        "prayers": {
                            "fajr": {"completed": True, "on_time": True, "time": "05:30"},
                            "dhuhr": {"completed": True, "on_time": False, "time": "12:30"},
                            "asr": {"completed": True, "on_time": True, "time": "15:00"},
                            "maghrib": {"completed": True, "on_time": True, "time": "17:45"},
                            "isha": {"completed": False, "on_time": False, "time": None}
                        },
                        "is_today": True
                    }
                ]
            }
        }


# ============================================================================
# STATISTICS SCHEMAS
# ============================================================================

class PrayerStatsResponse(BaseModel):
    """Comprehensive prayer statistics for a period"""
    period: str = Field(..., description="Time period: week, month, or year")
    start_date: str
    end_date: str
    total_prayers: int = Field(..., description="Total possible prayers in period")
    completed_prayers: int = Field(..., description="Number of completed prayers")
    on_time_prayers: int = Field(..., description="Number of on-time prayers")
    missed_prayers: int = Field(..., description="Number of missed prayers")
    completion_rate: float = Field(..., description="Percentage of completed prayers")
    current_streak: int = Field(..., description="Current consecutive days with all prayers")
    best_streak: int = Field(..., description="Best streak achieved")
    most_consistent_prayer: Optional[str] = Field(None, description="Prayer with highest completion rate")
    
    class Config:
        json_schema_extra = {
            "example": {
                "period": "month",
                "start_date": "2024-01-01",
                "end_date": "2024-01-30",
                "total_prayers": 150,
                "completed_prayers": 120,
                "on_time_prayers": 100,
                "missed_prayers": 30,
                "completion_rate": 80.0,
                "current_streak": 5,
                "best_streak": 12,
                "most_consistent_prayer": "Fajr"
            }
        }


# ============================================================================
# UTILITY SCHEMAS
# ============================================================================

class MessageResponse(BaseModel):
    """Generic message response"""
    message: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "Operation completed successfully"
            }
        }

class StreakResponse(BaseModel):
    """Response schema for streak data"""
    current_streak: int = Field(..., description="Current consecutive days streak")
    best_streak: int = Field(..., description="Best streak ever achieved")
    last_prayer_date: Optional[str] = Field(None, description="Last prayer date in YYYY-MM-DD")
    updated_at: datetime = Field(..., description="When streak was last updated")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "current_streak": 7,
                "best_streak": 30,
                "last_prayer_date": "2025-01-04",
                "updated_at": "2025-01-04T12:00:00Z"
            }
        }