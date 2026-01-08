# ============================================================================
# FILE: backend/app/api/v1/api.py (UPDATED)
# ============================================================================
from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, prayers, prayer_times, friends, password_reset

api_router = APIRouter()

# ============================================================================
# AUTHENTICATION ENDPOINTS
# ============================================================================
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["authentication"]
)

# ============================================================================
# PASSWORD RESET ENDPOINTS (NEW)
# ============================================================================
api_router.include_router(
    password_reset.router,
    prefix="/auth",
    tags=["password-reset"]
)

# ============================================================================
# USER MANAGEMENT ENDPOINTS
# ============================================================================
api_router.include_router(
    users.router,
    prefix="/users",
    tags=["users"]
)

# ============================================================================
# PRAYER TRACKING ENDPOINTS
# ============================================================================
api_router.include_router(
    prayers.router,
    prefix="/prayers",
    tags=["prayers"]
)

api_router.include_router(
    friends.router,
    prefix="/friends",
    tags=["friends"]
)

# ============================================================================
# PRAYER TIMES ENDPOINTS (NEW)
# ============================================================================
api_router.include_router(
    prayer_times.router,
    prefix="/prayers",
    tags=["prayer-times"]
)

# ============================================================================
# HEALTH CHECK
# ============================================================================
@api_router.get("/health", tags=["health"])
async def health_check():
    """
    Health check endpoint to verify API is running.
    
    Returns:
        dict: Service status, name, and version
    """
    return {
        "status": "healthy",
        "service": "Prayer Tracker API",
        "version": "1.0.0"
    }