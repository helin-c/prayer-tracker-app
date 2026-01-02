# ============================================================================
# FILE: backend/app/services/streak_service.py (ASYNC + i18n)
# ============================================================================
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import and_, or_

# ✅ FIXED: Missing User import added
from app.models.user import User
from app.models.friendship import Friendship, FriendshipStatus
# ✅ FIXED: Import get_translation for i18n
from app.services.push_notification_service import push_service, get_translation

logger = logging.getLogger(__name__)

async def notify_streak_milestone(
    user_id: int,
    user_name: str,
    streak_days: int,
    db: AsyncSession
):
    """
    Notify friends when user reaches a streak milestone (Async + i18n).
    
    Milestones: 7, 30, 100, 365 days
    """
    # Only notify at specific milestones
    milestones = [7, 30, 100, 365]
    if streak_days not in milestones:
        return
    
    try:
        # Get user's accepted friends
        query = select(Friendship).options(
            selectinload(Friendship.user),
            selectinload(Friendship.friend)
        ).filter(
            and_(
                or_(
                    Friendship.user_id == user_id,
                    Friendship.friend_id == user_id
                ),
                Friendship.status == FriendshipStatus.ACCEPTED
            )
        )
        result = await db.execute(query)
        friendships = result.scalars().all()
        
        if not friendships:
            return
        
        # Prepare notifications
        notifications = []
        
        # Determine notification key for translation lookup
        notif_key = f'friend_streak_{streak_days}'
        
        for friendship in friendships:
            # Determine who is the friend in this relationship
            friend_user = friendship.friend if friendship.user_id == user_id else friendship.user
            
            # Check if friend has a push token
            if not friend_user.push_token:
                continue
            
            # Safe access for notification_preferences
            prefs = friend_user.notification_preferences or {}
            
            # Default to True if 'friend_streaks' key is missing
            if not prefs.get('friend_streaks', True):
                continue
            
            # ✅ Get friend's preferred language
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
                    'type': 'friend_streak_milestone',
                    'friend_id': user_id,
                    'friend_name': user_name,
                    'streak_days': streak_days,
                },
                'sound': 'default',
            })
        
        # Send batch notifications
        if notifications:
            result = await push_service.send_batch_notifications(notifications)
            logger.info(
                f"📤 Streak milestone notifications sent for user {user_id}: "
                f"{result['success']} success, {result['failed']} failed"
            )
    
    except Exception as e:
        logger.error(f"Error notifying streak milestone: {e}", exc_info=True)