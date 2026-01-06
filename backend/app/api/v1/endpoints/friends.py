# ============================================================================
# FILE: backend/app/api/v1/endpoints/friends.py (FIXED IMPORT)
# ============================================================================
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_, or_, func, delete
from typing import List
import logging
from datetime import datetime, timedelta

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.friendship import Friendship, FriendshipStatus
from app.models.prayer import PrayerLog, PrayerStreak
from app.schemas.friend import (
    FriendRequestCreate,
    FriendshipResponse,
    FriendWeekPrayersResponse,
    MessageResponse
)
from app.schemas.prayer import StreakResponse

from app.services.push_notification_service import push_service, get_translation
from app.core.rate_limiter import rate_limit

# ✅ CRITICAL FIX: Import the missing function from prayers.py
from app.api.v1.endpoints.prayers import calculate_prayer_streak_optimized

router = APIRouter()
logger = logging.getLogger(__name__)

# Maximum friends limit
MAX_FRIENDS_LIMIT = 5


# ============================================================================
# HELPER FUNCTIONS (ASYNC)
# ============================================================================
async def get_accepted_friends_count(db: AsyncSession, user_id: int) -> int:
    """Get count of accepted friends for a user (Async)."""
    query = select(func.count(Friendship.id)).filter(
        and_(
            or_(
                Friendship.user_id == user_id,
                Friendship.friend_id == user_id
            ),
            Friendship.status == FriendshipStatus.ACCEPTED
        )
    )
    result = await db.execute(query)
    return result.scalar() or 0


async def check_friendship_exists(db: AsyncSession, user_id: int, friend_id: int) -> Friendship:
    """Check if friendship exists in either direction (Async)."""
    query = select(Friendship).filter(
        or_(
            and_(
                Friendship.user_id == user_id,
                Friendship.friend_id == friend_id
            ),
            and_(
                Friendship.user_id == friend_id,
                Friendship.friend_id == user_id
            )
        )
    )
    result = await db.execute(query)
    return result.scalars().first()


# ============================================================================
# GET ALL FRIENDS (ASYNC)
# ============================================================================
@router.get("", response_model=List[FriendshipResponse])
async def get_friends(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all accepted friends for current user."""
    try:
        query = select(Friendship).filter(
            and_(
                or_(
                    Friendship.user_id == current_user.id,
                    Friendship.friend_id == current_user.id
                ),
                Friendship.status == FriendshipStatus.ACCEPTED
            )
        )
        from sqlalchemy.orm import selectinload
        query = query.options(
            selectinload(Friendship.user).selectinload(User.prayer_streak),
            selectinload(Friendship.friend).selectinload(User.prayer_streak)
        )
        
        result = await db.execute(query)
        friendships = result.scalars().all()
        
        friends = []
        for friendship in friendships:
            friend_dict = friendship.to_dict(current_user.id)
            
            if friend_dict is None:
                logger.warning(f"Skipping friendship {friendship.id} in get_friends - relationships not loaded")
                continue

            friend_user = friendship.friend if friendship.user_id == current_user.id else friendship.user
            
            if friend_user.prayer_streak:
                friend_dict['current_streak'] = friend_user.prayer_streak.current_streak
                friend_dict['best_streak'] = friend_user.prayer_streak.best_streak
            else:
                friend_dict['current_streak'] = 0
                friend_dict['best_streak'] = 0
            
            friends.append(friend_dict)
        
        return friends
        
    except Exception as e:
        logger.error(f"Error getting friends for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get friends"
        )


# ============================================================================
# GET FRIENDS COUNT (ASYNC)
# ============================================================================
@router.get("/count", response_model=dict)
async def get_friends_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current friends count and maximum limit."""
    try:
        count = await get_accepted_friends_count(db, current_user.id)
        return {
            "current_count": count,
            "max_limit": MAX_FRIENDS_LIMIT,
            "can_add_more": count < MAX_FRIENDS_LIMIT
        }
    except Exception as e:
        logger.error(f"Error getting friends count: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get friends count"
        )


# ============================================================================
# GET PENDING REQUESTS (ASYNC)
# ============================================================================
@router.get("/requests/pending", response_model=List[FriendshipResponse])
async def get_pending_requests(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all pending friend requests received by current user."""
    try:
        query = select(Friendship).filter(
            and_(
                Friendship.friend_id == current_user.id,
                Friendship.status == FriendshipStatus.PENDING
            )
        )
        from sqlalchemy.orm import selectinload
        query = query.options(selectinload(Friendship.user))
        
        result = await db.execute(query)
        requests = result.scalars().all()
        
        pending = []
        for request in requests:
            req_dict = {
                "id": request.id,
                "friend_id": request.user_id,
                "friend_name": request.user.full_name or request.user.email.split('@')[0],
                "friend_email": request.user.email,
                "status": request.status.value,
                "is_requester": False,
                "created_at": request.created_at.isoformat(),
            }
            pending.append(req_dict)
        
        return pending
        
    except Exception as e:
        logger.error(f"Error getting pending requests for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get pending requests"
        )


# ============================================================================
# GET SENT REQUESTS (ASYNC)
# ============================================================================
@router.get("/requests/sent", response_model=List[FriendshipResponse])
async def get_sent_requests(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all friend requests sent by current user."""
    try:
        query = select(Friendship).filter(
            and_(
                Friendship.user_id == current_user.id,
                Friendship.status == FriendshipStatus.PENDING
            )
        )
        from sqlalchemy.orm import selectinload
        query = query.options(selectinload(Friendship.friend))
        
        result = await db.execute(query)
        requests = result.scalars().all()
        
        valid_requests = []
        for req in requests:
            data = req.to_dict(current_user.id)
            if data:
                valid_requests.append(data)
        
        return valid_requests
        
    except Exception as e:
        logger.error(f"Error getting sent requests for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get sent requests"
        )


# ============================================================================
# SEND FRIEND REQUEST (ASYNC)
# ============================================================================
@router.post(
    "/request",
    response_model=MessageResponse,
    dependencies=[Depends(rate_limit(10, 86400, by_user=True))]
)
async def send_friend_request(
    request_data: FriendRequestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Send a friend request to another user by email."""
    try:
        current_friends_count = await get_accepted_friends_count(db, current_user.id)
        if current_friends_count >= MAX_FRIENDS_LIMIT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"You have reached the maximum limit of {MAX_FRIENDS_LIMIT} friends."
            )
        
        result = await db.execute(select(User).filter(User.email == request_data.friend_email.lower()))
        friend = result.scalars().first()
        
        if not friend:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found with this email"
            )
        
        if friend.id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot add yourself as a friend"
            )
        
        friend_count = await get_accepted_friends_count(db, friend.id)
        if friend_count >= MAX_FRIENDS_LIMIT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"This user has reached their maximum limit of {MAX_FRIENDS_LIMIT} friends"
            )
        
        existing = await check_friendship_exists(db, current_user.id, friend.id)
        
        if existing:
            if existing.status == FriendshipStatus.ACCEPTED:
                raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Already friends with this user")
            elif existing.status == FriendshipStatus.PENDING:
                if existing.requester_id == current_user.id:
                    raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Request already sent")
                else:
                    raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="This user already sent you a request")
        
        friendship = Friendship(
            user_id=current_user.id,
            friend_id=friend.id,
            requester_id=current_user.id,
            status=FriendshipStatus.PENDING
        )
        
        db.add(friendship)
        await db.commit()
        await db.refresh(friendship)
        
        logger.info(f"Friend request sent: {current_user.id} -> {friend.id}")

        try:
            if friend.push_token and friend.notification_preferences.get('friend_requests', True):
                lang = friend.preferred_language or 'en'
                
                content = get_translation(
                    'friend_request',
                    lang,
                    name=current_user.full_name or 'Someone'
                )
                
                await push_service.send_notification(
                    push_token=friend.push_token,
                    title=content['title'],
                    body=content['body'],
                    data={
                        'type': 'friend_request',
                        'friendship_id': friendship.id,
                        'sender_id': current_user.id,
                        'sender_name': current_user.full_name,
                    },
                    sound="default",
                )
        except Exception as notif_error:
            logger.error(f"Failed to send notification: {notif_error}")

        return MessageResponse(message="Friend request sent successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error sending friend request: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send friend request"
        )


# ============================================================================
# ACCEPT FRIEND REQUEST (ASYNC)
# ============================================================================
@router.post(
    "/request/{request_id}/accept",
    response_model=MessageResponse,
    dependencies=[Depends(rate_limit(20, 60, by_user=True))]
)
async def accept_friend_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Accept a pending friend request."""
    try:
        current_friends_count = await get_accepted_friends_count(db, current_user.id)
        if current_friends_count >= MAX_FRIENDS_LIMIT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"You have reached the maximum limit of {MAX_FRIENDS_LIMIT} friends."
            )
        
        from sqlalchemy.orm import selectinload
        query = select(Friendship).options(selectinload(Friendship.user)).filter(
            and_(
                Friendship.id == request_id,
                Friendship.friend_id == current_user.id,
                Friendship.status == FriendshipStatus.PENDING
            )
        )
        result = await db.execute(query)
        friendship = result.scalars().first()
        
        if not friendship:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Friend request not found")
        
        requester_count = await get_accepted_friends_count(db, friendship.user_id)
        if requester_count >= MAX_FRIENDS_LIMIT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The requester has reached their friend limit"
            )
        
        friendship.status = FriendshipStatus.ACCEPTED
        await db.commit()
        
        logger.info(f"Friend request accepted: {request_id} by user {current_user.id}")

        try:
            requester = friendship.user
            if requester.push_token and requester.notification_preferences.get('friend_requests', True):
                lang = requester.preferred_language or 'en'
                
                content = get_translation(
                    'friend_request_accepted',
                    lang,
                    name=current_user.full_name or 'Someone'
                )
                
                await push_service.send_notification(
                    push_token=requester.push_token,
                    title=content['title'],
                    body=content['body'],
                    data={
                        'type': 'friend_request_accepted',
                        'friendship_id': friendship.id,
                        'accepter_id': current_user.id,
                        'accepter_name': current_user.full_name,
                    },
                    sound="default",
                )
        except Exception as notif_error:
            logger.error(f"Failed to send acceptance notification: {notif_error}")

        return MessageResponse(message="Friend request accepted")
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error accepting friend request: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to accept friend request"
        )


# ============================================================================
# REJECT FRIEND REQUEST (ASYNC)
# ============================================================================
@router.post(
    "/request/{request_id}/reject",
    response_model=MessageResponse,
    dependencies=[Depends(rate_limit(20, 60, by_user=True))]
)
async def reject_friend_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Reject a pending friend request."""
    try:
        query = select(Friendship).filter(
            and_(
                Friendship.id == request_id,
                Friendship.friend_id == current_user.id,
                Friendship.status == FriendshipStatus.PENDING
            )
        )
        result = await db.execute(query)
        friendship = result.scalars().first()
        
        if not friendship:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Friend request not found")
        
        await db.delete(friendship)
        await db.commit()
        
        return MessageResponse(message="Friend request rejected")
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error rejecting request: {str(e)}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to reject")


# ============================================================================
# CANCEL SENT REQUEST (ASYNC)
# ============================================================================
@router.delete("/request/{request_id}/cancel", response_model=MessageResponse)
async def cancel_sent_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Cancel a friend request that you sent."""
    try:
        query = select(Friendship).filter(
            and_(
                Friendship.id == request_id,
                Friendship.user_id == current_user.id,
                Friendship.status == FriendshipStatus.PENDING
            )
        )
        result = await db.execute(query)
        friendship = result.scalars().first()
        
        if not friendship:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Request not found")
        
        await db.delete(friendship)
        await db.commit()
        
        return MessageResponse(message="Friend request cancelled")
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error cancelling request: {str(e)}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to cancel")


# ============================================================================
# REMOVE FRIEND (ASYNC)
# ============================================================================
@router.delete("/{friendship_id}", response_model=MessageResponse)
async def remove_friend(
    friendship_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Remove a friend."""
    try:
        query = select(Friendship).filter(
            and_(
                Friendship.id == friendship_id,
                or_(
                    Friendship.user_id == current_user.id,
                    Friendship.friend_id == current_user.id
                ),
                Friendship.status == FriendshipStatus.ACCEPTED
            )
        )
        result = await db.execute(query)
        friendship = result.scalars().first()
        
        if not friendship:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Friendship not found")
        
        await db.delete(friendship)
        await db.commit()
        
        return MessageResponse(message="Friend removed successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Error removing friend: {str(e)}")
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to remove friend")


# ============================================================================
# GET FRIEND'S WEEK PRAYERS (ASYNC)
# ============================================================================
@router.get("/{friend_id}/prayers/week", response_model=FriendWeekPrayersResponse)
async def get_friend_week_prayers(
    friend_id: int,
    start_date: str = Query(..., description="YYYY-MM-DD"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a friend's prayer completion for a week."""
    try:
        friendship = await check_friendship_exists(db, current_user.id, friend_id)
        if not friendship or friendship.status != FriendshipStatus.ACCEPTED:
            raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Not accepted friends")
        
        from sqlalchemy.orm import selectinload
        query = select(User).options(selectinload(User.prayer_streak)).filter(User.id == friend_id)
        result = await db.execute(query)
        friend = result.scalars().first()
        
        if not friend:
            raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Friend not found")
        
        start = datetime.strptime(start_date, "%Y-%m-%d").date()
        end = start + timedelta(days=6)
        
        log_query = select(PrayerLog).filter(
            and_(
                PrayerLog.user_id == friend_id,
                PrayerLog.prayer_date >= start.strftime("%Y-%m-%d"),
                PrayerLog.prayer_date <= end.strftime("%Y-%m-%d")
            )
        )
        result = await db.execute(log_query)
        logs = result.scalars().all()
        
        days_data = {}
        for log in logs:
            if log.prayer_date not in days_data:
                days_data[log.prayer_date] = {"completed": 0}
            if log.completed:
                days_data[log.prayer_date]["completed"] += 1
        
        days = []
        current_date = start
        today_str = datetime.now().strftime("%Y-%m-%d")
        
        for _ in range(7):
            date_str = current_date.strftime("%Y-%m-%d")
            completed = days_data.get(date_str, {}).get("completed", 0)
            
            days.append({
                "date": date_str,
                "completion_percentage": round((completed / 5) * 100, 1),
                "is_today": date_str == today_str,
                "completed_count": completed
            })
            current_date += timedelta(days=1)
        
        return FriendWeekPrayersResponse(
            friend_id=friend_id,
            friend_name=friend.full_name or friend.email.split('@')[0],
            start_date=start_date,
            end_date=end.strftime("%Y-%m-%d"),
            days=days,
            current_streak=friend.prayer_streak.current_streak if friend.prayer_streak else 0
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting friend stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get friend's prayer data"
        )
    

# ============================================================================
# GET FRIEND STREAK (FIXED - NOW WORKS!)
# ============================================================================
@router.get(
    "/{friend_id}/streak",
    response_model=StreakResponse,
    summary="Get friend's streak"
)
async def get_friend_streak(
    friend_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a friend's current streak."""
    try:
        # 1. Verify friendship
        query = select(Friendship).filter(
            and_(
                or_(
                    and_(
                        Friendship.user_id == current_user.id,
                        Friendship.friend_id == friend_id
                    ),
                    and_(
                        Friendship.user_id == friend_id,
                        Friendship.friend_id == current_user.id
                    )
                ),
                Friendship.status == FriendshipStatus.ACCEPTED
            )
        )
        result = await db.execute(query)
        friendship = result.scalars().first()
        
        if not friendship:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Friendship not found"
            )
        
        # 2. ✅ Calculate friend's streak using imported function
        friend_streak = await calculate_prayer_streak_optimized(friend_id, db)
        
        # 3. Get or update streak record
        query = select(PrayerStreak).filter(
            PrayerStreak.user_id == friend_id
        )
        result = await db.execute(query)
        streak_record = result.scalars().first()
        
        if not streak_record:
            return StreakResponse(
                current_streak=friend_streak,
                best_streak=friend_streak,
                last_prayer_date=datetime.utcnow().strftime("%Y-%m-%d"),
                updated_at=datetime.utcnow()
            )
        
        # Update if needed
        if friend_streak != streak_record.current_streak:
            streak_record.current_streak = friend_streak
            if friend_streak > streak_record.best_streak:
                streak_record.best_streak = friend_streak
            db.add(streak_record)
            await db.commit()
            await db.refresh(streak_record)
        
        return StreakResponse(
            current_streak=streak_record.current_streak,
            best_streak=streak_record.best_streak,
            last_prayer_date=streak_record.last_prayer_date,
            updated_at=streak_record.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting friend streak: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get friend streak"
        )