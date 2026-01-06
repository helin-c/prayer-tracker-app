# ============================================================================
# FILE: backend/app/api/v1/endpoints/prayers.py (ASYNC + SAFE BACKGROUND TASKS)
# ============================================================================
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func, and_, or_, text, desc
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import logging
import json

from app.core.database import get_db, AsyncSessionLocal
from app.api.deps import get_current_user
from app.models.user import User
from app.models.prayer import PrayerLog, PrayerStreak
from app.models.friendship import Friendship, FriendshipStatus
from app.services.push_notification_service import push_service, get_translation
from app.core.rate_limiter import rate_limit
from app.schemas.prayer import (
    PrayerLogCreate,
    PrayerLogResponse,
    DayPrayerStatus,
    WeekPrayerStatus,
    PrayerStatsResponse,
    MessageResponse,
)
from app.schemas.prayer import StreakResponse

router = APIRouter()
logger = logging.getLogger(__name__)

MAX_RETRIES = 3
INITIAL_RETRY_DELAY = 2

# ============================================================================
# 1. OPTIMIZED STREAK CALCULATION (ASYNC)
# ============================================================================
async def calculate_prayer_streak_optimized(user_id: int, db: AsyncSession) -> int:
    """Calculate streak using SQL - FIXED for VARCHAR prayer_date"""
    try:
        query = text("""
        WITH daily_counts AS (
            SELECT 
                prayer_date,
                COUNT(*) FILTER (WHERE completed = true) as completed_count
            FROM prayer_logs
            WHERE user_id = :user_id
            GROUP BY prayer_date
            HAVING COUNT(*) FILTER (WHERE completed = true) = 5
            ORDER BY prayer_date DESC
        ),
        date_diffs AS (
            SELECT 
                prayer_date,
                LAG(prayer_date) OVER (ORDER BY prayer_date DESC) as prev_date,
                -- ✅ FIX: Cast to DATE for subtraction
                prayer_date::DATE - LAG(prayer_date::DATE) OVER (ORDER BY prayer_date DESC) as day_diff
            FROM daily_counts
        )
        SELECT COUNT(*) as streak
        FROM date_diffs
        WHERE day_diff IS NULL OR day_diff = -1
        AND prayer_date::DATE <= CURRENT_DATE;
        """)
        
        result = await db.execute(query, {"user_id": user_id})
        streak = result.scalar()
        return streak if streak else 0
    except Exception as e:
        logger.error(f"Error calculating streak: {e}", exc_info=True)
        return 0
    
# ============================================================================
# 2. BACKGROUND TASKS (FIXED: SELF-CONTAINED SESSIONS)
# ============================================================================

async def update_user_streak(user_id: int, db: AsyncSession):
    """
    Update streak record using PESSIMISTIC LOCKING to prevent race conditions.
    This runs within the request's transaction scope.
    """
    try:
        # Calculate streak first (read-only)
        current_streak = await calculate_prayer_streak_optimized(user_id, db)
        
        # LOCK ROW: Prevent concurrent updates from overwriting each other
        query = select(PrayerStreak).filter(PrayerStreak.user_id == user_id).with_for_update()
        result = await db.execute(query)
        streak_record = result.scalars().first()
        
        if not streak_record:
            streak_record = PrayerStreak(
                user_id=user_id,
                current_streak=current_streak,
                best_streak=current_streak,
                last_prayer_date=datetime.utcnow().strftime("%Y-%m-%d")
            )
            db.add(streak_record)
        else:
            streak_record.current_streak = current_streak
            if current_streak > streak_record.best_streak:
                streak_record.best_streak = current_streak
            streak_record.last_prayer_date = datetime.utcnow().strftime("%Y-%m-%d")
            
        logger.info(f"✅ Streak updated for user {user_id}: {current_streak}")
        
    except Exception as e:
        logger.error(f"Error updating streak: {e}", exc_info=True)


async def check_and_notify_prayer_milestone(
    user_id: int,
    user_name: str,
    prayer_date: str
):
    """
    Background task to notify friends (✅ WITH i18n).
    """
    async with AsyncSessionLocal() as db:  # Independent session
        try:
            # 1. NEW CHECK: Prevent notifications for past dates
            today_str = datetime.utcnow().strftime("%Y-%m-%d")
            
            # If the user is logging a prayer for yesterday (or any other date), stop here.
            if prayer_date != today_str:
                logger.info(f"🔕 Skipping friend notification: Prayer date {prayer_date} is not today ({today_str})")
                return

            # 2. Logic Check (Count how many completed TODAY)
            count_query = select(func.count(PrayerLog.id)).filter(
                and_(
                    PrayerLog.user_id == user_id,
                    PrayerLog.prayer_date == prayer_date,
                    PrayerLog.completed == True
                )
            )
            result = await db.execute(count_query)
            completed_count = result.scalar() or 0
            
            # Only notify on specific milestones (3 prayers or 5 prayers)
            if completed_count not in [3, 5]:
                return
            
            # 3. Fetch Friends
            query = select(Friendship).options(
                selectinload(Friendship.user),
                selectinload(Friendship.friend)
            ).filter(
                and_(
                    or_(Friendship.user_id == user_id, Friendship.friend_id == user_id),
                    Friendship.status == FriendshipStatus.ACCEPTED
                )
            )
            result = await db.execute(query)
            friendships = result.scalars().all()
            
            if not friendships:
                return
            
            # 4. Prepare Notifications (✅ WITH i18n)
            notifications = []
            
            # Determine notification key
            notif_key = 'friend_prayer_5' if completed_count == 5 else 'friend_prayer_3'

            for friendship in friendships:
                friend_user = friendship.friend if friendship.user_id == user_id else friendship.user
                
                if not friend_user.push_token:
                    continue
                    
                prefs = friend_user.notification_preferences or {}
                if not prefs.get('friend_prayers', True):
                    continue
                
                # ✅ Get friend's language
                lang = friend_user.preferred_language or 'en'
                
                # ✅ Get translated content
                content = get_translation(
                    notif_key,
                    lang,
                    name=user_name or 'Your friend'
                )
                
                notifications.append({
                    'push_token': friend_user.push_token,
                    'title': content['title'],
                    'body': content['body'],
                    'data': {
                        'type': 'friend_prayer_milestone', 
                        'friend_id': user_id,
                        'completed_count': completed_count
                    },
                })
            
            # 5. Send (Sync but safe)
            if notifications:
                await push_service.send_batch_notifications(notifications)
                logger.info(f"📤 Sent {len(notifications)} milestone notifications for user {user_id} (Count: {completed_count})")

        except Exception as e:
            logger.error(f"Notification task error: {e}", exc_info=True)

async def check_streak_and_notify(user_id: int, user_name: str):
    """
    Background task to check streak milestones.
    """
    async with AsyncSessionLocal() as db:  # ✅ Independent session
        try:
            current_streak = await calculate_prayer_streak_optimized(user_id, db)
            
            # ✅ Import and call the streak notification service
            from app.services.streak_service import notify_streak_milestone
            
            if current_streak in [7, 30, 100, 365]:
                logger.info(f"🔥 Streak milestone reached: {current_streak} days for user {user_id}")
                await notify_streak_milestone(user_id, user_name, current_streak, db)

        except Exception as e:
            logger.error(f"Streak notify error: {e}", exc_info=True)


# ============================================================================
# 4. API ENDPOINTS
# ============================================================================

@router.post(
    "/track", 
    response_model=PrayerLogResponse, 
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(rate_limit(100, 3600, by_user=True))]
)
async def track_prayer(
    prayer_data: PrayerLogCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Track a prayer status.
    Streak update runs immediately (for UI consistency).
    Notifications run in background (for performance).
    """
    try:
        # Validation
        prayer_date = datetime.strptime(prayer_data.prayer_date, "%Y-%m-%d").date()
        today = datetime.utcnow().date()
        if prayer_date > today:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot track future prayers")
        
        # Check / Update / Create Log
        query = select(PrayerLog).filter(
            and_(
                PrayerLog.user_id == current_user.id,
                PrayerLog.prayer_name == prayer_data.prayer_name,
                PrayerLog.prayer_date == prayer_data.prayer_date
            )
        )
        result = await db.execute(query)
        existing_log = result.scalars().first()
        
        if existing_log:
            existing_log.completed = prayer_data.completed
            existing_log.on_time = prayer_data.on_time
            existing_log.prayer_time = prayer_data.prayer_time
            existing_log.completed_at = datetime.utcnow() if prayer_data.completed else None
            
            # Flush changes so streak calculation sees the update
            await db.flush()
            
            if existing_log.completed:
                # 1. Update Streak IMMEDIATELY (in current transaction)
                await update_user_streak(current_user.id, db)
                
                # 2. Send Notifications in BACKGROUND
                # ✅ Pass only simple data, NOT the db session
                background_tasks.add_task(
                    check_and_notify_prayer_milestone,
                    current_user.id,
                    current_user.full_name,
                    prayer_data.prayer_date
                )
                
                background_tasks.add_task(
                    check_streak_and_notify,
                    current_user.id,
                    current_user.full_name
                )
            
            await db.commit()
            await db.refresh(existing_log)
            return existing_log
        
        # Create New
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
        await db.flush()
        
        if prayer_log.completed:
            await update_user_streak(current_user.id, db)
            
            background_tasks.add_task(
                check_and_notify_prayer_milestone,
                current_user.id,
                current_user.full_name,
                prayer_data.prayer_date
            )
            
            background_tasks.add_task(
                check_streak_and_notify,
                current_user.id,
                current_user.full_name
            )
        
        await db.commit()
        await db.refresh(prayer_log)
        return prayer_log
        
    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error tracking prayer: {str(e)}", exc_info=True)
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to track prayer")


@router.get(
    "/week", 
    response_model=WeekPrayerStatus,
    dependencies=[Depends(rate_limit(60, 60, by_user=True))]
)
async def get_week_prayers(
    start_date: str = Query(..., description="YYYY-MM-DD"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        start = datetime.strptime(start_date, "%Y-%m-%d").date()
        end = start + timedelta(days=6)
        query = select(PrayerLog).filter(
            and_(
                PrayerLog.user_id == current_user.id,
                PrayerLog.prayer_date >= start.strftime("%Y-%m-%d"),
                PrayerLog.prayer_date <= end.strftime("%Y-%m-%d")
            )
        )
        result = await db.execute(query)
        logs = result.scalars().all()
        
        days_data = {}
        for log in logs:
            if log.prayer_date not in days_data:
                days_data[log.prayer_date] = {"logs": []}
            days_data[log.prayer_date]["logs"].append(log)
            
        days = []
        current_date = start
        today_str = datetime.now().strftime("%Y-%m-%d")
        prayer_names = ["fajr", "dhuhr", "asr", "maghrib", "isha"]
        
        for _ in range(7):
            date_str = current_date.strftime("%Y-%m-%d")
            prayers_obj = {}
            completed_count = 0
            on_time_count = 0
            
            day_logs = days_data.get(date_str, {}).get("logs", [])
            logs_map = {l.prayer_name.lower(): l for l in day_logs}
            
            for prayer in prayer_names:
                log = logs_map.get(prayer)
                is_completed = log.completed if log else False
                is_on_time = log.on_time if log else False
                prayers_obj[prayer] = {
                    "completed": is_completed,
                    "on_time": is_on_time,
                    "time": log.prayer_time if log else None
                }
                if is_completed: completed_count += 1
                if is_on_time: on_time_count += 1
            
            days.append({
                "date": date_str,
                "completion_percentage": round((completed_count / 5) * 100, 1),
                "on_time_count": on_time_count,
                "prayers": prayers_obj,
                "is_today": date_str == today_str
            })
            current_date += timedelta(days=1)
            
        return WeekPrayerStatus(start_date=start_date, end_date=end.strftime("%Y-%m-%d"), days=days)
    except Exception as e:
        logger.error(f"Error getting week data: {e}", exc_info=True)
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to get week data")


@router.get(
    "/stats/period", 
    response_model=PrayerStatsResponse,
    dependencies=[Depends(rate_limit(60, 60, by_user=True))]
)
async def get_period_stats(
    period: str = Query("month", regex="^(week|month|year)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        end_date = datetime.utcnow().date()
        if period == "week":
            start_date = end_date - timedelta(days=6)
            days_count = 7
        elif period == "month":
            start_date = end_date - timedelta(days=29)
            days_count = 30
        else:
            start_date = end_date - timedelta(days=364)
            days_count = 365
            
        total_prayers = days_count * 5
        
        query = select(
            func.count(PrayerLog.id).filter(PrayerLog.completed == True).label('completed'),
            func.count(PrayerLog.id).filter(and_(PrayerLog.completed == True, PrayerLog.on_time == True)).label('on_time')
        ).filter(
            and_(
                PrayerLog.user_id == current_user.id,
                PrayerLog.prayer_date >= start_date.strftime("%Y-%m-%d"),
                PrayerLog.prayer_date <= end_date.strftime("%Y-%m-%d")
            )
        )
        result = await db.execute(query)
        stats = result.first()
        
        completed_count = stats.completed or 0
        on_time_count = stats.on_time or 0
        current_streak = await calculate_prayer_streak_optimized(current_user.id, db)
        
        result = await db.execute(select(PrayerStreak).filter(PrayerStreak.user_id == current_user.id))
        streak_record = result.scalars().first()
        best_streak = streak_record.best_streak if streak_record else current_streak
        if current_streak > best_streak: best_streak = current_streak
            
        consistent_query = select(
            PrayerLog.prayer_name,
            func.count(PrayerLog.id).label('count')
        ).filter(
            and_(
                PrayerLog.user_id == current_user.id,
                PrayerLog.completed == True,
                PrayerLog.prayer_date >= start_date.strftime("%Y-%m-%d")
            )
        ).group_by(PrayerLog.prayer_name).order_by(desc('count'))
        
        result = await db.execute(consistent_query)
        most_consistent = result.first()
        
        return PrayerStatsResponse(
            period=period,
            start_date=start_date.strftime("%Y-%m-%d"),
            end_date=end_date.strftime("%Y-%m-%d"),
            total_prayers=total_prayers,
            completed_prayers=completed_count,
            on_time_prayers=on_time_count,
            missed_prayers=total_prayers - completed_count,
            completion_rate=round((completed_count / total_prayers * 100), 1) if total_prayers > 0 else 0,
            current_streak=current_streak,
            best_streak=best_streak,
            most_consistent_prayer=most_consistent.prayer_name if most_consistent else None
        )
    except Exception as e:
        logger.error(f"Error getting stats: {e}", exc_info=True)
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to get stats")


@router.get("/day/{date}", response_model=DayPrayerStatus)
async def get_day_prayers(
    date: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        query = select(PrayerLog).filter(
            and_(PrayerLog.user_id == current_user.id, PrayerLog.prayer_date == date)
        )
        result = await db.execute(query)
        logs = result.scalars().all()
        
        logs_map = {l.prayer_name: l for l in logs}
        prayer_names = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"]
        prayers = []
        completed_cnt = 0
        on_time_cnt = 0
        
        for name in prayer_names:
            log = logs_map.get(name)
            is_comp = log.completed if log else False
            is_ontime = log.on_time if log else False
            
            prayers.append({
                "id": log.id if log else None,
                "prayer_name": name,
                "prayer_time": log.prayer_time if log else "00:00",
                "completed": is_comp,
                "on_time": is_ontime,
                "completed_at": log.completed_at if log else None
            })
            if is_comp: completed_cnt += 1
            if is_ontime: on_time_cnt += 1
            
        return DayPrayerStatus(
            date=date,
            prayers=prayers,
            completed_count=completed_cnt,
            total_prayers=5,
            completion_percentage=round((completed_cnt / 5) * 100, 1),
            on_time_count=on_time_cnt
        )
    except Exception as e:
        logger.error(f"Error getting day prayers: {e}", exc_info=True)
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to get data")


@router.delete("/track/{log_id}", response_model=MessageResponse)
async def delete_prayer_log(
    log_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        query = select(PrayerLog).filter(
            and_(PrayerLog.id == log_id, PrayerLog.user_id == current_user.id)
        )
        result = await db.execute(query)
        log = result.scalars().first()
        
        if not log:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Log not found")
            
        await db.delete(log)
        await db.commit()
        return MessageResponse(message="Deleted successfully")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error deleting: {e}", exc_info=True)
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to delete")
    

# ============================================================================
# NEW: GET CURRENT USER STREAK (Real-time)
# ============================================================================
@router.get(
    "/streak/current",
    response_model=StreakResponse,
    summary="Get current user's streak (real-time calculation)",
    dependencies=[Depends(rate_limit(60, 60, by_user=True))]
)
async def get_current_streak(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get user's current streak with real-time calculation.
    This is the SOURCE OF TRUTH for streak data.
    """
    try:
        # 1. Calculate current streak from prayer logs
        current_streak = await calculate_prayer_streak_optimized(
            current_user.id, 
            db
        )
        
        # 2. Get or create streak record
        query = select(PrayerStreak).filter(
            PrayerStreak.user_id == current_user.id
        )
        result = await db.execute(query)
        streak_record = result.scalars().first()
        
        if not streak_record:
            # Create new record
            streak_record = PrayerStreak(
                user_id=current_user.id,
                current_streak=current_streak,
                best_streak=current_streak,
                last_prayer_date=datetime.utcnow().strftime("%Y-%m-%d")
            )
            db.add(streak_record)
            await db.commit()
            await db.refresh(streak_record)
        else:
            # Update if calculation differs from stored value
            if current_streak != streak_record.current_streak:
                streak_record.current_streak = current_streak
                
                # Update best streak if current is higher
                if current_streak > streak_record.best_streak:
                    streak_record.best_streak = current_streak
                
                streak_record.last_prayer_date = datetime.utcnow().strftime("%Y-%m-%d")
                
                db.add(streak_record)
                await db.commit()
                await db.refresh(streak_record)
        
        return StreakResponse(
            current_streak=streak_record.current_streak,
            best_streak=streak_record.best_streak,
            last_prayer_date=streak_record.last_prayer_date,
            updated_at=streak_record.updated_at
        )
        
    except Exception as e:
        logger.error(f"Error getting current streak: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get streak"
        )


# ============================================================================
# NEW: GET STREAK HISTORY (for calendar visualization)
# ============================================================================
@router.get(
    "/streak/history",
    summary="Get streak history for date range",
    dependencies=[Depends(rate_limit(60, 60, by_user=True))]
)
async def get_streak_history(
    start_date: str = Query(..., description="YYYY-MM-DD"),
    end_date: str = Query(..., description="YYYY-MM-DD"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed streak information for a date range.
    Shows which days contributed to streaks.
    """
    try:
        # Query all days with 5 completed prayers in range
        query = select(
            PrayerLog.prayer_date,
            func.count(PrayerLog.id).label('completed_count')
        ).filter(
            and_(
                PrayerLog.user_id == current_user.id,
                PrayerLog.prayer_date >= start_date,
                PrayerLog.prayer_date <= end_date,
                PrayerLog.completed == True
            )
        ).group_by(
            PrayerLog.prayer_date
        ).having(
            func.count(PrayerLog.id) == 5  # All 5 prayers completed
        ).order_by(
            PrayerLog.prayer_date
        )
        
        result = await db.execute(query)
        perfect_days = [row.prayer_date for row in result.all()]
        
        # Calculate streaks within this range
        streaks = []
        current_streak_days = []
        
        for i, date_str in enumerate(perfect_days):
            current_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            
            if i == 0:
                # First day starts a streak
                current_streak_days.append(date_str)
            else:
                # Check if consecutive
                prev_date = datetime.strptime(perfect_days[i-1], "%Y-%m-%d").date()
                diff = (current_date - prev_date).days
                
                if diff == 1:
                    # Continues streak
                    current_streak_days.append(date_str)
                else:
                    # Streak broken, save previous streak
                    if current_streak_days:
                        streaks.append({
                            "start_date": current_streak_days[0],
                            "end_date": current_streak_days[-1],
                            "length": len(current_streak_days),
                            "dates": current_streak_days
                        })
                    # Start new streak
                    current_streak_days = [date_str]
        
        # Don't forget the last streak
        if current_streak_days:
            streaks.append({
                "start_date": current_streak_days[0],
                "end_date": current_streak_days[-1],
                "length": len(current_streak_days),
                "dates": current_streak_days
            })
        
        return {
            "start_date": start_date,
            "end_date": end_date,
            "perfect_days": perfect_days,
            "streaks": streaks,
            "total_perfect_days": len(perfect_days)
        }
        
    except Exception as e:
        logger.error(f"Error getting streak history: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get streak history"
        )

