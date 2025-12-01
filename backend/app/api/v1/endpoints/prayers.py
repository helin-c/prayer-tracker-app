# ============================================================================
# FILE: backend/app/api/v1/endpoints/prayers.py (FIXED)
# ============================================================================
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, case
from datetime import datetime, timedelta
from typing import List, Optional
import logging

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.prayer import PrayerLog
from app.schemas.prayer import (
    PrayerLogCreate,
    PrayerLogResponse,
    PrayerLogUpdate,
    DayPrayerStatus,
    WeekPrayerStatus,
    PrayerStatsResponse,
    MessageResponse,
)

router = APIRouter()
logger = logging.getLogger(__name__)

# ============================================================================
# TRACK PRAYER (CREATE/UPDATE)
# ============================================================================
@router.post("/track", response_model=PrayerLogResponse, status_code=status.HTTP_201_CREATED)
async def track_prayer(
    prayer_data: PrayerLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Track a prayer (mark as done, missed, or on-time).
    
    - Creates new log or updates existing
    - Prevents duplicates with unique constraint
    - Returns updated prayer log
    """
    try:
        # Check if log already exists
        existing_log = db.query(PrayerLog).filter(
            and_(
                PrayerLog.user_id == current_user.id,
                PrayerLog.prayer_name == prayer_data.prayer_name,
                PrayerLog.prayer_date == prayer_data.prayer_date
            )
        ).first()
        
        if existing_log:
            # Update existing log
            existing_log.completed = prayer_data.completed
            existing_log.on_time = prayer_data.on_time
            existing_log.prayer_time = prayer_data.prayer_time
            existing_log.completed_at = datetime.utcnow() if prayer_data.completed else None
            existing_log.updated_at = datetime.utcnow()
            
            db.commit()
            db.refresh(existing_log)
            
            logger.info(f"Updated prayer: {current_user.id} - {prayer_data.prayer_name} - {prayer_data.prayer_date}")
            return existing_log
        
        # Create new log
        prayer_log = PrayerLog(
            user_id=current_user.id,
            prayer_name=prayer_data.prayer_name,
            prayer_date=prayer_data.prayer_date,
            prayer_time=prayer_data.prayer_time,
            completed=prayer_data.completed,
            on_time=prayer_data.on_time,
            completed_at=datetime.utcnow() if prayer_data.completed else None
        )
        
        db.add(prayer_log)
        db.commit()
        db.refresh(prayer_log)
        
        logger.info(f"Created prayer log: {current_user.id} - {prayer_data.prayer_name}")
        return prayer_log
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error tracking prayer: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to track prayer: {str(e)}"
        )


# ============================================================================
# UPDATE PRAYER LOG
# ============================================================================
@router.put("/track/{log_id}", response_model=PrayerLogResponse)
async def update_prayer_log(
    log_id: int,
    update_data: PrayerLogUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update existing prayer log"""
    try:
        prayer_log = db.query(PrayerLog).filter(
            and_(
                PrayerLog.id == log_id,
                PrayerLog.user_id == current_user.id
            )
        ).first()
        
        if not prayer_log:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prayer log not found"
            )
        
        # Update fields
        if update_data.completed is not None:
            prayer_log.completed = update_data.completed
            prayer_log.completed_at = datetime.utcnow() if update_data.completed else None
        
        if update_data.on_time is not None:
            prayer_log.on_time = update_data.on_time
        
        prayer_log.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(prayer_log)
        
        return prayer_log
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating prayer log: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update prayer log"
        )


# ============================================================================
# GET DAY PRAYERS
# ============================================================================
@router.get("/day/{date}", response_model=DayPrayerStatus)
async def get_day_prayers(
    date: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all prayers for a specific day.
    
    Returns status of all 5 prayers with completion percentage.
    """
    try:
        # Validate date format
        try:
            date_obj = datetime.strptime(date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Use YYYY-MM-DD"
            )
        
        # Get all prayer logs for this day
        prayer_logs = db.query(PrayerLog).filter(
            and_(
                PrayerLog.user_id == current_user.id,
                PrayerLog.prayer_date == date
            )
        ).all()
        
        # Create prayer status map
        prayers_map = {log.prayer_name: log for log in prayer_logs}
        
        # All 5 prayers
        prayer_names = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"]
        
        prayers = []
        completed_count = 0
        on_time_count = 0
        
        for prayer_name in prayer_names:
            if prayer_name in prayers_map:
                log = prayers_map[prayer_name]
                prayers.append({
                    "id": log.id,
                    "prayer_name": log.prayer_name,
                    "prayer_time": log.prayer_time,
                    "completed": log.completed,
                    "on_time": log.on_time,
                    "completed_at": log.completed_at
                })
                if log.completed:
                    completed_count += 1
                if log.on_time:
                    on_time_count += 1
            else:
                # Prayer not logged yet
                prayers.append({
                    "id": None,
                    "prayer_name": prayer_name,
                    "prayer_time": "00:00",  # Default time
                    "completed": False,
                    "on_time": False,
                    "completed_at": None
                })
        
        # Calculate percentage
        completion_percentage = (completed_count / 5) * 100
        
        return DayPrayerStatus(
            date=date,
            prayers=prayers,
            completed_count=completed_count,
            total_prayers=5,
            completion_percentage=round(completion_percentage, 1),
            on_time_count=on_time_count
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting day prayers: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get prayer data"
        )


# ============================================================================
# GET WEEK PRAYERS
# ============================================================================
@router.get("/week", response_model=WeekPrayerStatus)
async def get_week_prayers(
    start_date: str = Query(..., description="Week start date (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get prayer completion for a week (7 days).
    
    Returns daily completion percentages for calendar view.
    """
    try:
        # Parse start date
        start = datetime.strptime(start_date, "%Y-%m-%d").date()
        end = start + timedelta(days=6)
        
        # Get all prayer logs for the week
        logs = db.query(PrayerLog).filter(
            and_(
                PrayerLog.user_id == current_user.id,
                PrayerLog.prayer_date >= start.strftime("%Y-%m-%d"),
                PrayerLog.prayer_date <= end.strftime("%Y-%m-%d")
            )
        ).all()
        
        # Group by date
        days_data = {}
        for log in logs:
            if log.prayer_date not in days_data:
                days_data[log.prayer_date] = {"completed": 0, "total": 0}
            days_data[log.prayer_date]["total"] += 1
            if log.completed:
                days_data[log.prayer_date]["completed"] += 1
        
        # Build response for all 7 days
        days = []
        current_date = start
        today_str = datetime.now().strftime("%Y-%m-%d")
        
        for _ in range(7):
            date_str = current_date.strftime("%Y-%m-%d")
            
            if date_str in days_data:
                data = days_data[date_str]
                percentage = (data["completed"] / 5) * 100  # Always 5 prayers per day
            else:
                percentage = 0
            
            days.append({
                "date": date_str,
                "completion_percentage": round(percentage, 1),
                "is_today": date_str == today_str
            })
            
            current_date += timedelta(days=1)
        
        return WeekPrayerStatus(
            start_date=start_date,
            end_date=end.strftime("%Y-%m-%d"),
            days=days
        )
        
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    except Exception as e:
        logger.error(f"Error getting week prayers: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get week data"
        )


# ============================================================================
# GET PERIOD STATISTICS
# ============================================================================
@router.get("/stats/period", response_model=PrayerStatsResponse)
async def get_period_stats(
    period: str = Query("month", regex="^(week|month|year)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get prayer statistics for a time period.
    
    - week: Last 7 days
    - month: Last 30 days
    - year: Last 365 days
    """
    try:
        # Calculate date range
        end_date = datetime.utcnow().date()
        
        if period == "week":
            start_date = end_date - timedelta(days=6)
            days = 7
        elif period == "month":
            start_date = end_date - timedelta(days=29)
            days = 30
        else:  # year
            start_date = end_date - timedelta(days=364)
            days = 365
        
        # Total prayers in period
        total_prayers = days * 5
        
        # Completed prayers (indexed query)
        completed_count = db.query(func.count(PrayerLog.id)).filter(
            and_(
                PrayerLog.user_id == current_user.id,
                PrayerLog.completed == True,
                PrayerLog.prayer_date >= start_date.strftime("%Y-%m-%d"),
                PrayerLog.prayer_date <= end_date.strftime("%Y-%m-%d")
            )
        ).scalar() or 0
        
        # On-time prayers
        on_time_count = db.query(func.count(PrayerLog.id)).filter(
            and_(
                PrayerLog.user_id == current_user.id,
                PrayerLog.completed == True,
                PrayerLog.on_time == True,
                PrayerLog.prayer_date >= start_date.strftime("%Y-%m-%d"),
                PrayerLog.prayer_date <= end_date.strftime("%Y-%m-%d")
            )
        ).scalar() or 0
        
        # Calculate streak
        current_streak = calculate_prayer_streak(current_user.id, db)
        
        # Best streak (simplified - could be enhanced)
        best_streak = current_streak  # For now, same as current
        
        # Completion rate
        completion_rate = (completed_count / total_prayers * 100) if total_prayers > 0 else 0
        
        # Most consistent prayer (prayer with highest completion rate)
        # FIXED: Use case() instead of func.cast() for boolean to int conversion
        prayer_stats = db.query(
            PrayerLog.prayer_name,
            func.count(PrayerLog.id).label('total'),
            func.sum(
                case(
                    (PrayerLog.completed == True, 1),
                    else_=0
                )
            ).label('completed')
        ).filter(
            and_(
                PrayerLog.user_id == current_user.id,
                PrayerLog.prayer_date >= start_date.strftime("%Y-%m-%d"),
                PrayerLog.prayer_date <= end_date.strftime("%Y-%m-%d")
            )
        ).group_by(PrayerLog.prayer_name).all()
        
        most_consistent = None
        highest_rate = 0
        
        for prayer_name, total, completed in prayer_stats:
            if total > 0 and completed is not None:
                rate = (completed / total) * 100
                if rate > highest_rate:
                    highest_rate = rate
                    most_consistent = prayer_name
        
        return PrayerStatsResponse(
            period=period,
            start_date=start_date.strftime("%Y-%m-%d"),
            end_date=end_date.strftime("%Y-%m-%d"),
            total_prayers=total_prayers,
            completed_prayers=completed_count,
            on_time_prayers=on_time_count,
            missed_prayers=total_prayers - completed_count,
            completion_rate=round(completion_rate, 1),
            current_streak=current_streak,
            best_streak=best_streak,
            most_consistent_prayer=most_consistent
        )
        
    except Exception as e:
        logger.error(f"Error getting period stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to calculate statistics"
        )


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================
def calculate_prayer_streak(user_id: int, db: Session) -> int:
    """
    Calculate consecutive days of completing all 5 prayers.
    Optimized with date arithmetic.
    """
    try:
        today = datetime.utcnow().date()
        streak = 0
        check_date = today
        
        # Check last 100 days max
        for _ in range(100):
            date_str = check_date.strftime("%Y-%m-%d")
            
            # Count completed prayers for this date (indexed)
            completed = db.query(func.count(PrayerLog.id)).filter(
                and_(
                    PrayerLog.user_id == user_id,
                    PrayerLog.prayer_date == date_str,
                    PrayerLog.completed == True
                )
            ).scalar() or 0
            
            # If all 5 prayers completed, continue streak
            if completed == 5:
                streak += 1
                check_date -= timedelta(days=1)
            else:
                break
        
        return streak
        
    except Exception as e:
        logger.error(f"Error calculating streak: {str(e)}")
        return 0


# ============================================================================
# DELETE PRAYER LOG
# ============================================================================
@router.delete("/track/{log_id}", response_model=MessageResponse)
async def delete_prayer_log(
    log_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a prayer log"""
    try:
        prayer_log = db.query(PrayerLog).filter(
            and_(
                PrayerLog.id == log_id,
                PrayerLog.user_id == current_user.id
            )
        ).first()
        
        if not prayer_log:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prayer log not found"
            )
        
        db.delete(prayer_log)
        db.commit()
        
        return MessageResponse(message="Prayer log deleted successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting prayer log: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete prayer log"
        )