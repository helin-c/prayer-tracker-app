# ============================================================================
# FILE: backend/app/core/redis.py (FIXED - COMPLETE IMPLEMENTATION)
# ============================================================================
import redis
from app.core.config import settings
import logging
import time

logger = logging.getLogger(__name__)


class RedisClient:
    """Redis client with fallback"""
    
    def __init__(self):
        self._client = None
        self._is_connected = False
        self._connect()
    
    def _connect(self):
        """Connect to Redis"""
        try:
            if settings.REDIS_URL:
                self._client = redis.from_url(
                    settings.REDIS_URL,
                    decode_responses=True,
                    socket_connect_timeout=5,
                    socket_keepalive=True,
                    health_check_interval=30
                )
                # Test connection
                self._client.ping()
                self._is_connected = True
                logger.info("✅ Redis connected successfully")
            else:
                logger.warning("⚠️  REDIS_URL not set - using in-memory fallback")
                self._client = InMemoryRedis()
                self._is_connected = False
                
        except Exception as e:
            logger.error(f"❌ Redis connection failed: {e}")
            logger.warning("⚠️  Using in-memory fallback")
            self._client = InMemoryRedis()
            self._is_connected = False
    
    # Basic operations
    def setex(self, key: str, seconds: int, value: str):
        """Set key with expiration"""
        try:
            return self._client.setex(key, seconds, value)
        except Exception as e:
            logger.error(f"Redis setex error: {e}")
            return False
    
    def get(self, key: str):
        """Get key"""
        try:
            return self._client.get(key)
        except Exception as e:
            logger.error(f"Redis get error: {e}")
            return None
    
    def exists(self, key: str):
        """Check if key exists"""
        try:
            return self._client.exists(key)
        except Exception as e:
            logger.error(f"Redis exists error: {e}")
            return False
    
    def delete(self, key: str):
        """Delete key"""
        try:
            return self._client.delete(key)
        except Exception as e:
            logger.error(f"Redis delete error: {e}")
            return False
    
    # ✅ FIXED: Added sorted set operations for rate limiter
    def zremrangebyscore(self, key: str, min_score: float, max_score: float):
        """Remove members by score range"""
        try:
            return self._client.zremrangebyscore(key, min_score, max_score)
        except Exception as e:
            logger.error(f"Redis zremrangebyscore error: {e}")
            return 0
    
    def zcard(self, key: str):
        """Get sorted set cardinality"""
        try:
            return self._client.zcard(key)
        except Exception as e:
            logger.error(f"Redis zcard error: {e}")
            return 0
    
    def zadd(self, key: str, mapping: dict):
        """Add members to sorted set"""
        try:
            return self._client.zadd(key, mapping)
        except Exception as e:
            logger.error(f"Redis zadd error: {e}")
            return 0
    
    def zrange(self, key: str, start: int, end: int, withscores: bool = False):
        """Get range from sorted set"""
        try:
            return self._client.zrange(key, start, end, withscores=withscores)
        except Exception as e:
            logger.error(f"Redis zrange error: {e}")
            return []
    
    def expire(self, key: str, seconds: int):
        """Set key expiration"""
        try:
            return self._client.expire(key, seconds)
        except Exception as e:
            logger.error(f"Redis expire error: {e}")
            return False
    
    def is_connected(self):
        """Check if connected to real Redis"""
        return self._is_connected


class InMemoryRedis:
    """Fallback in-memory Redis for development"""
    
    def __init__(self):
        self._data = {}
        self._expiry = {}
        self._sorted_sets = {}  # ✅ ADDED: For rate limiter sorted sets
        logger.warning("⚠️  Using in-memory Redis - NOT for production!")
    
    def setex(self, key: str, seconds: int, value: str):
        self._data[key] = value
        self._expiry[key] = time.time() + seconds
        return True
    
    def get(self, key: str):
        if key not in self._data:
            return None
        
        # Check expiry
        if key in self._expiry and time.time() > self._expiry[key]:
            del self._data[key]
            del self._expiry[key]
            return None
        
        return self._data[key]
    
    def exists(self, key: str):
        return self.get(key) is not None or key in self._sorted_sets
    
    def delete(self, key: str):
        self._data.pop(key, None)
        self._expiry.pop(key, None)
        self._sorted_sets.pop(key, None)
        return True
    
    # ✅ FIXED: Implement sorted set operations
    def zremrangebyscore(self, key: str, min_score: float, max_score: float):
        """Remove members by score range"""
        if key not in self._sorted_sets:
            return 0
        
        # Filter out items in score range
        original_len = len(self._sorted_sets[key])
        self._sorted_sets[key] = {
            member: score 
            for member, score in self._sorted_sets[key].items()
            if not (min_score <= score <= max_score)
        }
        
        return original_len - len(self._sorted_sets[key])
    
    def zcard(self, key: str):
        """Get sorted set cardinality"""
        if key not in self._sorted_sets:
            return 0
        return len(self._sorted_sets[key])
    
    def zadd(self, key: str, mapping: dict):
        """Add members to sorted set"""
        if key not in self._sorted_sets:
            self._sorted_sets[key] = {}
        
        self._sorted_sets[key].update(mapping)
        return len(mapping)
    
    def zrange(self, key: str, start: int, end: int, withscores: bool = False):
        """Get range from sorted set"""
        if key not in self._sorted_sets:
            return []
        
        # Sort by score
        sorted_items = sorted(self._sorted_sets[key].items(), key=lambda x: x[1])
        
        # Handle negative indices
        if end == -1:
            end = len(sorted_items)
        else:
            end = end + 1
        
        sliced = sorted_items[start:end]
        
        if withscores:
            return sliced
        else:
            return [item[0] for item in sliced]
    
    def expire(self, key: str, seconds: int):
        """Set key expiration"""
        self._expiry[key] = time.time() + seconds
        return True
    
    def ping(self):
        return True


# Singleton instance
redis_client = RedisClient()