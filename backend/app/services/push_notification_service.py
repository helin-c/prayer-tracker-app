# ============================================================================
# FILE: backend/app/services/push_notification_service.py (ASYNC + i18n)
# ============================================================================
"""
Expo Push Notification Service
Sends push notifications to mobile devices via Expo.
Includes i18n support for localized notifications.
"""
from exponent_server_sdk import (
    DeviceNotRegisteredError,
    PushClient,
    PushMessage,
    PushServerError,
    PushTicketError,
)
from requests.exceptions import ConnectionError, HTTPError
import logging
from typing import List, Dict, Optional
from sqlalchemy.future import select
from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.models.user import User

logger = logging.getLogger(__name__)

# ============================================================================
# ✅ ADDED: TRANSLATION DICTIONARIES
# ============================================================================
TRANSLATIONS = {
    'en': {
        'friend_request': {
            'title': '👥 New Friend Request',
            'body': '{name} sent you a friend request'
        },
        'friend_request_accepted': {
            'title': '✅ Friend Request Accepted',
            'body': '{name} accepted your friend request'
        },
        'friend_prayer_3': {
            'title': '🕌 Friend Prayer Update',
            'body': '{name} completed 3 prayers today!'
        },
        'friend_prayer_5': {
            'title': '🌟 Friend Prayer Update',
            'body': '{name} completed all 5 prayers today!'
        },
        'friend_streak_7': {
            'title': '🔥 Streak Milestone',
            'body': '{name} reached a 7-day prayer streak!'
        },
        'friend_streak_30': {
            'title': '⭐ Streak Milestone',
            'body': '{name} reached a 30-day prayer streak!'
        },
        'friend_streak_100': {
            'title': '💎 Streak Milestone',
            'body': '{name} reached a 100-day prayer streak!'
        },
        'friend_streak_365': {
            'title': '🏆 Streak Milestone',
            'body': '{name} reached a 365-day prayer streak!'
        },
    },
    'ar': {
        'friend_request': {
            'title': '👥 طلب صداقة جديد',
            'body': 'أرسل {name} طلب صداقة إليك'
        },
        'friend_request_accepted': {
            'title': '✅ تم قبول طلب الصداقة',
            'body': 'قبل {name} طلب صداقتك'
        },
        'friend_prayer_3': {
            'title': '🕌 تحديث صلاة الصديق',
            'body': 'أتم {name} ٣ صلوات اليوم!'
        },
        'friend_prayer_5': {
            'title': '🌟 تحديث صلاة الصديق',
            'body': 'أتم {name} الصلوات الخمس كلها اليوم!'
        },
        'friend_streak_7': {
            'title': '🔥 إنجاز السلسلة',
            'body': 'وصل {name} إلى سلسلة صلاة لمدة ٧ أيام!'
        },
        'friend_streak_30': {
            'title': '⭐ إنجاز السلسلة',
            'body': 'وصل {name} إلى سلسلة صلاة لمدة ٣٠ يومًا!'
        },
        'friend_streak_100': {
            'title': '💎 إنجاز السلسلة',
            'body': 'وصل {name} إلى سلسلة صلاة لمدة ١٠٠ يوم!'
        },
        'friend_streak_365': {
            'title': '🏆 إنجاز السلسلة',
            'body': 'وصل {name} إلى سلسلة صلاة لمدة ٣٦٥ يومًا!'
        },
    },
    'tr': {
        'friend_request': {
            'title': '👥 Yeni Arkadaşlık İsteği',
            'body': '{name} sana arkadaşlık isteği gönderdi'
        },
        'friend_request_accepted': {
            'title': '✅ Arkadaşlık İsteği Kabul Edildi',
            'body': '{name} arkadaşlık isteğini kabul etti'
        },
        'friend_prayer_3': {
            'title': '🕌 Arkadaş Namaz Güncellemesi',
            'body': '{name} bugün 3 namaz kıldı!'
        },
        'friend_prayer_5': {
            'title': '🌟 Arkadaş Namaz Güncellemesi',
            'body': '{name} bugün 5 namazı da kıldı!'
        },
        'friend_streak_7': {
            'title': '🔥 Seri Başarısı',
            'body': '{name} 7 günlük namaz serisine ulaştı!'
        },
        'friend_streak_30': {
            'title': '⭐ Seri Başarısı',
            'body': '{name} 30 günlük namaz serisine ulaştı!'
        },
        'friend_streak_100': {
            'title': '💎 Seri Başarısı',
            'body': '{name} 100 günlük namaz serisine ulaştı!'
        },
        'friend_streak_365': {
            'title': '🏆 Seri Başarısı',
            'body': '{name} 365 günlük namaz serisine ulaştı!'
        },
    }
}

def get_translation(key: str, lang: str, **kwargs) -> Dict[str, str]:
    """
    Get translated notification content.
    
    Args:
        key: Notification type key (e.g., 'friend_request')
        lang: Language code ('en' or 'tr')
        **kwargs: Format parameters (e.g., name='John')
        
    Returns:
        Dict with 'title' and 'body' keys
    """
    # Default to English if language not supported
    translations = TRANSLATIONS.get(lang, TRANSLATIONS['en'])
    
    # Get notification template (Default to generic English if key missing)
    template = translations.get(key, TRANSLATIONS['en'].get(key, {
        'title': 'Notification',
        'body': 'You have a new notification'
    }))
    
    # Format with provided arguments
    return {
        'title': template['title'].format(**kwargs),
        'body': template['body'].format(**kwargs)
    }


class PushNotificationService:
    """Service for sending push notifications via Expo"""
    
    def __init__(self):
        self.client = PushClient()
    
    async def _remove_invalid_token(self, push_token: str):
        """
        Remove invalid push token from database to prevent future errors.
        ✅ FIXED: Uses AsyncSessionLocal for compatibility with async engine.
        ✅ SAFETY: Handles case where multiple users might have the same token.
        """
        try:
            async with AsyncSessionLocal() as db:
                # ✅ Async Query to find all users with this token
                result = await db.execute(select(User).filter(User.push_token == push_token))
                users = result.scalars().all()
                
                # Iterate and clear token for ALL matching users
                for user in users:
                    user.push_token = None
                    logger.info(f"🗑️ Removed invalid push token for user {user.id}")
                    # Need to add to session to track changes
                    db.add(user)
                
                if users:
                    await db.commit()
                    
        except Exception as e:
            logger.error(f"Error removing invalid token: {e}")

    async def send_notification(
        self,
        push_token: str,
        title: str,
        body: str,
        data: Optional[Dict] = None,
        sound: str = "default",
        badge: Optional[int] = None,
    ) -> bool:
        """
        Send a single push notification (Async).
        """
        try:
            # Validate token format
            if not push_token.startswith('ExponentPushToken['):
                logger.warning(f"Invalid push token format: {push_token}")
                return False
            
            # Create message
            message = PushMessage(
                to=push_token,
                title=title,
                body=body,
                data=data or {},
                sound=sound,
                badge=badge,
                channel_id="social", # Default to social channel for backend pushes
            )
            
            # Send notification (Exponent SDK is sync, but we wrap logic in async def)
            # In high-scale apps, consider running this in a thread pool:
            # response = await loop.run_in_executor(None, self.client.publish, message)
            response = self.client.publish(message)
            
            # Check response
            if response.status == 'ok':
                logger.info(f"✅ Notification sent: {title}")
                return True
            else:
                logger.warning(f"⚠️  Notification error: {response.message}")
                
                if response.details and response.details.get('error') == 'DeviceNotRegistered':
                    await self._remove_invalid_token(push_token)
                    
                return False
                
        except DeviceNotRegisteredError:
            logger.warning(f"Device not registered: {push_token}")
            await self._remove_invalid_token(push_token)
            return False
            
        except PushServerError as e:
            logger.error(f"Push server error: {e}")
            return False
            
        except (ConnectionError, HTTPError) as e:
            logger.error(f"Network error: {e}")
            return False
            
        except Exception as e:
            logger.error(f"Unexpected error sending notification: {e}")
            return False
    
    async def send_batch_notifications(
        self,
        notifications: List[Dict]
    ) -> Dict[str, int]:
        """
        Send multiple notifications in batch (Async).
        """
        messages = []
        
        for notif in notifications:
            try:
                push_token = notif.get('push_token')
                
                if not push_token or not push_token.startswith('ExponentPushToken['):
                    continue
                
                message = PushMessage(
                    to=push_token,
                    title=notif.get('title'),
                    body=notif.get('body'),
                    data=notif.get('data', {}),
                    sound=notif.get('sound', 'default'),
                    channel_id="social", # Default to social channel
                )
                messages.append(message)
                
            except Exception as e:
                logger.error(f"Error creating message: {e}")
                continue
        
        if not messages:
            return {'success': 0, 'failed': 0}
        
        # Send batch
        try:
            # Publish multiple is sync, but wrapped in async def
            responses = self.client.publish_multiple(messages)
            
            success_count = 0
            failed_count = 0
            
            for j, response in enumerate(responses):
                if response.status == 'ok':
                    success_count += 1
                else:
                    failed_count += 1
                    if response.details and response.details.get('error') == 'DeviceNotRegistered':
                        invalid_token = messages[j].to
                        await self._remove_invalid_token(invalid_token)
            
            logger.info(
                f"📤 Batch sent: {success_count} success, {failed_count} failed"
            )
            
            return {'success': success_count, 'failed': failed_count}
            
        except Exception as e:
            logger.error(f"Batch send error: {e}")
            return {'success': 0, 'failed': len(messages)}


# Singleton instance
push_service = PushNotificationService()