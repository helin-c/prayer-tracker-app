# ============================================================================
# FILE: backend/app/api/v1/api.py (UPDATED)
# ============================================================================
from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, prayers, prayer_times

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