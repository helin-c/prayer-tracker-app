# ============================================================================
# FILE: backend/app/core/rate_limiter.py
# ============================================================================
import time
from typing import Optional, Tuple
from fastapi import HTTPException, status, Request
from app.core.redis import redis_client
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class RateLimiter:
    """
    Redis-based rate limiter with sliding window algorithm.
    
    Features:
    - Per-user rate limiting
    - Per-IP rate limiting
    - Sliding window (more accurate than fixed window)
    - Automatic cleanup
    - Fallback support for InMemoryRedis (no pipeline)
    """
    
    def __init__(self):
        self.enabled = settings.RATE_LIMIT_ENABLED
        self.redis = redis_client
    
    def _get_user_key(self, user_id: int, endpoint: str) -> str:
        """Generate Redis key for user rate limit"""
        return f"rate_limit:user:{user_id}:{endpoint}"
    
    def _get_ip_key(self, ip: str, endpoint: str) -> str:
        """Generate Redis key for IP rate limit"""
        return f"rate_limit:ip:{ip}:{endpoint}"
    
    def check_rate_limit(
        self,
        identifier: str,
        limit: int,
        window: int,
        key_prefix: str = "rate_limit"
    ) -> Tuple[bool, int, int]:
        """
        Check if request is within rate limit using sliding window.
        
        Args:
            identifier: User ID or IP address
            limit: Maximum requests allowed
            window: Time window in seconds
            key_prefix: Redis key prefix
            
        Returns:
            Tuple of (allowed, remaining, reset_time)
        """
        if not self.enabled:
            return True, limit, 0
        
        try:
            key = f"{key_prefix}:{identifier}"
            current_time = int(time.time())
            window_start = current_time - window
            
            # ✅ FIXED: Check if real Redis with pipeline support
            if self.redis.is_connected():
                # Use Redis pipeline for atomic operations
                pipe = self.redis._client.pipeline()
                
                # Remove old entries (outside window)
                pipe.zremrangebyscore(key, 0, window_start)
                
                # Count requests in current window
                pipe.zcard(key)
                
                # Add current request timestamp
                pipe.zadd(key, {str(current_time): current_time})
                
                # Set expiry (cleanup)
                pipe.expire(key, window + 10)
                
                # Execute pipeline
                results = pipe.execute()
                
                # Get request count (before adding current)
                # results[0] = removed count
                # results[1] = cardinality (count)
                request_count = results[1]
                
            else:
                # ✅ FIXED: Fallback for InMemoryRedis (no pipeline support)
                # We execute commands sequentially. Not atomic, but fine for dev/testing.
                self.redis.zremrangebyscore(key, 0, window_start)
                request_count = self.redis.zcard(key) or 0
                self.redis.zadd(key, {str(current_time): current_time})
                self.redis.expire(key, window + 10)
            
            # Check if limit exceeded
            if request_count >= limit:
                # Calculate when limit resets by getting the oldest timestamp in window
                oldest_entries = self.redis.zrange(key, 0, 0, withscores=True)
                if oldest_entries:
                    reset_time = int(oldest_entries[0][1]) + window
                else:
                    reset_time = current_time + window
                
                remaining = 0
                return False, remaining, reset_time
            
            # Request allowed
            remaining = max(0, limit - request_count - 1)
            reset_time = current_time + window
            
            return True, remaining, reset_time
            
        except Exception as e:
            logger.error(f"Rate limit check error: {e}")
            # On Redis failure, allow request (fail open) to prevent blocking users
            return True, limit, 0
    
    def check_user_limit(
        self,
        user_id: int,
        endpoint: str,
        limit: int,
        window: int
    ) -> Tuple[bool, int, int]:
        """Check rate limit for authenticated user"""
        key = self._get_user_key(user_id, endpoint)
        return self.check_rate_limit(key, limit, window)
    
    def check_ip_limit(
        self,
        ip: str,
        endpoint: str,
        limit: int,
        window: int
    ) -> Tuple[bool, int, int]:
        """Check rate limit for IP address"""
        key = self._get_ip_key(ip, endpoint)
        return self.check_rate_limit(key, limit, window)


# Singleton instance
rate_limiter = RateLimiter()


# ============================================================================
# DEPENDENCY FOR FASTAPI ENDPOINTS
# ============================================================================

def rate_limit(
    limit: int,
    window: int = 60,
    by_user: bool = True,
    by_ip: bool = False
):
    """
    Rate limiting dependency for FastAPI endpoints.
    
    Usage:
        @router.post("/login", dependencies=[Depends(rate_limit(5, 60))])
        async def login(...):
            ...
    """
    async def dependency(request: Request):
        endpoint = request.url.path
        
        # Get client IP
        client_ip = request.client.host if request.client else "unknown"
        
        # Check IP rate limit first (if enabled)
        if by_ip:
            allowed, remaining, reset_time = rate_limiter.check_ip_limit(
                client_ip,
                endpoint,
                limit,
                window
            )
            
            if not allowed:
                retry_after = reset_time - int(time.time())
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Too many requests. Try again in {retry_after} seconds.",
                    headers={"Retry-After": str(retry_after)}
                )
        
        # Check user rate limit (if authenticated and enabled)
        if by_user:
            # Try to get user from request state (set by auth dependency)
            user = getattr(request.state, "user", None)
            
            if user:
                allowed, remaining, reset_time = rate_limiter.check_user_limit(
                    user.id,
                    endpoint,
                    limit,
                    window
                )
                
                if not allowed:
                    retry_after = reset_time - int(time.time())
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail=f"Too many requests. Try again in {retry_after} seconds.",
                        headers={"Retry-After": str(retry_after)}
                    )
                
                # Add rate limit headers to response
                request.state.rate_limit_remaining = remaining
                request.state.rate_limit_reset = reset_time
    
    return dependency