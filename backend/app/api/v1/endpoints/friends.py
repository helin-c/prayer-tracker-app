# ============================================================================
# FILE: backend/app/api/v1/endpoints/friends.py 
# ============================================================================
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List
import logging

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.friendship import Friendship, FriendshipStatus
from app.models.prayer import PrayerLog
from app.schemas.friend import (
    FriendRequestCreate,
    FriendshipResponse,
    FriendWeekPrayersResponse,
    MessageResponse
)
from datetime import datetime, timedelta

router = APIRouter()
logger = logging.getLogger(__name__)

# Maximum friends limit
MAX_FRIENDS_LIMIT = 5


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================
def get_accepted_friends_count(db: Session, user_id: int) -> int:
    """Get count of accepted friends for a user"""
    count = db.query(func.count(Friendship.id)).filter(
        and_(
            or_(
                Friendship.user_id == user_id,
                Friendship.friend_id == user_id
            ),
            Friendship.status == FriendshipStatus.ACCEPTED
        )
    ).scalar()
    return count or 0


def check_friendship_exists(db: Session, user_id: int, friend_id: int) -> Friendship:
    """Check if friendship exists in either direction"""
    return db.query(Friendship).filter(
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
    ).first()


# ============================================================================
# GET ALL FRIENDS
# ============================================================================
@router.get("", response_model=List[FriendshipResponse])
async def get_friends(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all accepted friends for current user.
    
    Returns list of friends with their basic info and current streak.
    """
    try:
        # Get all accepted friendships (bidirectional)
        friendships = db.query(Friendship).filter(
            and_(
                or_(
                    Friendship.user_id == current_user.id,
                    Friendship.friend_id == current_user.id
                ),
                Friendship.status == FriendshipStatus.ACCEPTED
            )
        ).all()
        
        # Convert to response format
        friends = []
        for friendship in friendships:
            friend_dict = friendship.to_dict(current_user.id)
            
            # Get friend's prayer streak
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
# GET FRIENDS COUNT
# ============================================================================
@router.get("/count", response_model=dict)
async def get_friends_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current friends count and maximum limit.
    """
    try:
        count = get_accepted_friends_count(db, current_user.id)
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
# GET PENDING FRIEND REQUESTS (RECEIVED)
# ============================================================================
@router.get("/requests/pending", response_model=List[FriendshipResponse])
async def get_pending_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all pending friend requests received by current user.
    """
    try:
        # Get pending requests where current user is the friend (recipient)
        requests = db.query(Friendship).filter(
            and_(
                Friendship.friend_id == current_user.id,
                Friendship.status == FriendshipStatus.PENDING
            )
        ).all()
        
        # Format response with sender info (as friend fields for schema compatibility)
        pending = []
        for request in requests:
            req_dict = {
                "id": request.id,
                "friend_id": request.user_id,  # sender is the "friend"
                "friend_name": request.user.full_name or request.user.email.split('@')[0],
                "friend_email": request.user.email,
                "status": request.status.value,
                "is_requester": False,  # Current user is NOT the requester
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
# GET SENT FRIEND REQUESTS
# ============================================================================
@router.get("/requests/sent", response_model=List[FriendshipResponse])
async def get_sent_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all friend requests sent by current user.
    """
    try:
        # Get sent requests where current user is the requester
        requests = db.query(Friendship).filter(
            and_(
                Friendship.user_id == current_user.id,
                Friendship.status == FriendshipStatus.PENDING
            )
        ).all()
        
        return [req.to_dict(current_user.id) for req in requests]
        
    except Exception as e:
        logger.error(f"Error getting sent requests for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get sent requests"
        )


# ============================================================================
# SEND FRIEND REQUEST
# ============================================================================
@router.post("/request", response_model=MessageResponse)
async def send_friend_request(
    request_data: FriendRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send a friend request to another user by email.
    
    Enforces 5-friend limit - user cannot send request if they already have 5 accepted friends.
    """
    try:
        # Check if user has reached friend limit
        current_friends_count = get_accepted_friends_count(db, current_user.id)
        if current_friends_count >= MAX_FRIENDS_LIMIT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"You have reached the maximum limit of {MAX_FRIENDS_LIMIT} friends. Please remove a friend before adding a new one."
            )
        
        # Find friend by email
        friend = db.query(User).filter(User.email == request_data.friend_email.lower()).first()
        
        if not friend:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found with this email"
            )
        
        # Can't friend yourself
        if friend.id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot add yourself as a friend"
            )
        
        # Check if friend has reached their limit
        friend_count = get_accepted_friends_count(db, friend.id)
        if friend_count >= MAX_FRIENDS_LIMIT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"This user has reached their maximum limit of {MAX_FRIENDS_LIMIT} friends"
            )
        
        # Check if friendship already exists (either direction)
        existing = check_friendship_exists(db, current_user.id, friend.id)
        
        if existing:
            if existing.status == FriendshipStatus.ACCEPTED:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Already friends with this user"
                )
            elif existing.status == FriendshipStatus.PENDING:
                # Check who sent the request
                if existing.requester_id == current_user.id:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Friend request already sent to this user"
                    )
                else:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="This user has already sent you a friend request. Please check your pending requests."
                    )
        
        # Create new friendship request
        friendship = Friendship(
            user_id=current_user.id,
            friend_id=friend.id,
            requester_id=current_user.id,
            status=FriendshipStatus.PENDING
        )
        
        db.add(friendship)
        db.commit()
        
        logger.info(f"Friend request sent: {current_user.id} -> {friend.id}")
        return MessageResponse(message="Friend request sent successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error sending friend request from user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send friend request"
        )


# ============================================================================
# ACCEPT FRIEND REQUEST
# ============================================================================
@router.post("/request/{request_id}/accept", response_model=MessageResponse)
async def accept_friend_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Accept a pending friend request.
    
    Enforces 5-friend limit - user cannot accept if they have 5 friends already.
    """
    try:
        # Check if user has reached friend limit
        current_friends_count = get_accepted_friends_count(db, current_user.id)
        if current_friends_count >= MAX_FRIENDS_LIMIT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"You have reached the maximum limit of {MAX_FRIENDS_LIMIT} friends. Please remove a friend before accepting new requests."
            )
        
        # Get the request
        friendship = db.query(Friendship).filter(
            and_(
                Friendship.id == request_id,
                Friendship.friend_id == current_user.id,  # Current user must be the recipient
                Friendship.status == FriendshipStatus.PENDING
            )
        ).first()
        
        if not friendship:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Friend request not found or already processed"
            )
        
        # Check if requester has reached their limit
        requester_count = get_accepted_friends_count(db, friendship.user_id)
        if requester_count >= MAX_FRIENDS_LIMIT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"The requester has reached their maximum limit of {MAX_FRIENDS_LIMIT} friends"
            )
        
        # Accept the request
        friendship.status = FriendshipStatus.ACCEPTED
        db.commit()
        
        logger.info(f"Friend request accepted: {request_id} by user {current_user.id}")
        return MessageResponse(message="Friend request accepted")
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error accepting friend request {request_id} by user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to accept friend request"
        )


# ============================================================================
# REJECT FRIEND REQUEST
# ============================================================================
@router.post("/request/{request_id}/reject", response_model=MessageResponse)
async def reject_friend_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Reject a pending friend request.
    """
    try:
        # Get the request
        friendship = db.query(Friendship).filter(
            and_(
                Friendship.id == request_id,
                Friendship.friend_id == current_user.id,
                Friendship.status == FriendshipStatus.PENDING
            )
        ).first()
        
        if not friendship:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Friend request not found or already processed"
            )
        
        # Delete the request
        db.delete(friendship)
        db.commit()
        
        logger.info(f"Friend request rejected: {request_id} by user {current_user.id}")
        return MessageResponse(message="Friend request rejected")
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error rejecting friend request {request_id} by user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reject friend request"
        )


# ============================================================================
# CANCEL SENT REQUEST
# ============================================================================
@router.delete("/request/{request_id}/cancel", response_model=MessageResponse)
async def cancel_sent_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cancel a friend request that you sent.
    """
    try:
        # Get the request (must be sender and pending)
        friendship = db.query(Friendship).filter(
            and_(
                Friendship.id == request_id,
                Friendship.user_id == current_user.id,
                Friendship.status == FriendshipStatus.PENDING
            )
        ).first()
        
        if not friendship:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Friend request not found or already processed"
            )
        
        # Delete the request
        db.delete(friendship)
        db.commit()
        
        logger.info(f"Friend request cancelled: {request_id} by user {current_user.id}")
        return MessageResponse(message="Friend request cancelled")
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error cancelling friend request {request_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel friend request"
        )


# ============================================================================
# REMOVE FRIEND
# ============================================================================
@router.delete("/{friendship_id}", response_model=MessageResponse)
async def remove_friend(
    friendship_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remove a friend (delete friendship).
    """
    try:
        # Get the friendship
        friendship = db.query(Friendship).filter(
            and_(
                Friendship.id == friendship_id,
                or_(
                    Friendship.user_id == current_user.id,
                    Friendship.friend_id == current_user.id
                ),
                Friendship.status == FriendshipStatus.ACCEPTED
            )
        ).first()
        
        if not friendship:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Friendship not found"
            )
        
        # Delete friendship
        db.delete(friendship)
        db.commit()
        
        logger.info(f"Friendship removed: {friendship_id} by user {current_user.id}")
        return MessageResponse(message="Friend removed successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error removing friend {friendship_id} by user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove friend"
        )


# ============================================================================
# GET FRIEND'S WEEK PRAYERS
# ============================================================================
@router.get("/{friend_id}/prayers/week", response_model=FriendWeekPrayersResponse)
async def get_friend_week_prayers(
    friend_id: int,
    start_date: str = Query(..., description="Week start date (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a friend's prayer completion for a week.
    
    Only works if users are friends (accepted friendship).
    """
    try:
        # Verify friendship exists and is accepted
        friendship = check_friendship_exists(db, current_user.id, friend_id)
        
        if not friendship or friendship.status != FriendshipStatus.ACCEPTED:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view prayers of accepted friends"
            )
        
        # Get friend user
        friend = db.query(User).filter(User.id == friend_id).first()
        if not friend:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Friend not found"
            )
        
        # Parse dates
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Use YYYY-MM-DD"
            )
        
        end = start + timedelta(days=6)
        
        # Get prayer logs for the week
        logs = db.query(PrayerLog).filter(
            and_(
                PrayerLog.user_id == friend_id,
                PrayerLog.prayer_date >= start.strftime("%Y-%m-%d"),
                PrayerLog.prayer_date <= end.strftime("%Y-%m-%d")
            )
        ).all()
        
        # Group by date
        days_data = {}
        for log in logs:
            if log.prayer_date not in days_data:
                days_data[log.prayer_date] = {"completed": 0}
            if log.completed:
                days_data[log.prayer_date]["completed"] += 1
        
        # Build response for all 7 days
        days = []
        current_date = start
        today_str = datetime.now().strftime("%Y-%m-%d")
        
        for _ in range(7):
            date_str = current_date.strftime("%Y-%m-%d")
            
            completed = days_data.get(date_str, {}).get("completed", 0)
            percentage = (completed / 5) * 100
            
            days.append({
                "date": date_str,
                "completion_percentage": round(percentage, 1),
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
        logger.error(f"Error getting friend week prayers for user {current_user.id}, friend {friend_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get friend's prayer data"
        )