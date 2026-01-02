# ============================================================================
# FILE: backend/app/main.py (PRODUCTION-READY & SECURE)
# ============================================================================
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
import logging
import time
import sys

from app.core.config import settings
from app.api.v1.api import api_router

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Prayer Tracker API - Track your daily prayers and build consistency",
    docs_url="/docs" if settings.DEBUG else None, # Hide docs in production
    redoc_url="/redoc" if settings.DEBUG else None,
    debug=settings.DEBUG,
)

# ============================================================================
# MIDDLEWARE CONFIGURATION
# ============================================================================

# ✅ CORS Middleware (SECURE CONFIGURATION)
# Explicitly defines allowed methods instead of allowing "*" for everything.
# Uses strict origin validation from settings.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],  # ✅ Explicit methods
    allow_headers=["*"],  # Headers can usually remain broad, but origin/methods must be strict
    expose_headers=["X-RateLimit-Remaining", "X-RateLimit-Reset"],  # ✅ Expose rate limit headers
)

# ✅ NEW: Rate Limit Headers Middleware
# Adds X-RateLimit-Remaining and X-RateLimit-Reset headers to responses
# if the rate limiter dependency has set them on request.state.
@app.middleware("http")
async def add_rate_limit_headers(request: Request, call_next):
    """Add rate limit information to response headers."""
    response = await call_next(request)
    
    # Check if rate limit info was set by rate_limiter dependency
    if hasattr(request.state, "rate_limit_remaining"):
        response.headers["X-RateLimit-Remaining"] = str(request.state.rate_limit_remaining)
    
    if hasattr(request.state, "rate_limit_reset"):
        response.headers["X-RateLimit-Reset"] = str(request.state.rate_limit_reset)
        
    return response

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests with timing"""
    start_time = time.time()
    
    # Log request start (Debug only to reduce noise)
    if settings.DEBUG:
        logger.debug(f"→ {request.method} {request.url.path}")
    
    try:
        # Process request
        response = await call_next(request)
        
        # Calculate duration
        duration = time.time() - start_time
        
        # Log response
        log_msg = f"← {request.method} {request.url.path} [{response.status_code}] {duration:.3f}s"
        
        if response.status_code >= 500:
            logger.error(log_msg)
        elif response.status_code >= 400:
            logger.warning(log_msg)
        else:
            logger.info(log_msg)
        
        return response
    
    except Exception as e:
        duration = time.time() - start_time
        logger.error(
            f"✗ {request.method} {request.url.path} "
            f"[ERROR] {duration:.3f}s - {str(e)}"
        )
        raise

# ============================================================================
# EXCEPTION HANDLERS
# ============================================================================

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors with detailed messages"""
    errors = []
    for error in exc.errors():
        # Clean up error path
        path = " -> ".join(str(x) for x in error["loc"])
        errors.append({
            "field": path,
            "message": error["msg"]
        })
    
    logger.warning(f"Validation error on {request.url.path}: {errors}")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Validation error",
            "errors": errors
        }
    )

@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    """Handle database errors"""
    logger.error(f"Database error on {request.url.path}: {str(exc)}")
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "A database error occurred. Please try again later."
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle all other exceptions"""
    logger.error(f"Unexpected error on {request.url.path}: {str(exc)}", exc_info=True)
    
    # Return detailed error ONLY in debug mode
    message = f"An unexpected error occurred: {str(exc)}" if settings.DEBUG else "An unexpected error occurred. Please try again later."
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": message}
    )

# ============================================================================
# ROUTES
# ============================================================================

# Include API router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)

# Root endpoint
@app.get("/", tags=["root"])
async def root():
    """Root endpoint - API information"""
    return {
        "name": settings.APP_NAME,
        "version": settings.VERSION,
        "status": "running",
        "environment": "development" if settings.DEBUG else "production"
    }

# Health check
@app.get("/health", tags=["health"])
async def health_check():
    """Health check endpoint for monitoring"""
    from app.core.database import check_db_connection
    
    # ✅ FIX: Unpack the tuple (is_healthy, error_message)
    # This prevents the boolean logic error where a tuple (False, "Error") was evaluated as True
    db_healthy, error_msg = await check_db_connection() # ✅ Added await for Async
    
    status_code = 200 if db_healthy else 503
    
    response_content = {
        "status": "healthy" if db_healthy else "degraded",
        "service": settings.APP_NAME,
        "database": "connected" if db_healthy else "disconnected"
    }
    
    # Include error detail if unhealthy
    if not db_healthy and error_msg:
        response_content["database_error"] = error_msg
        
    return JSONResponse(
        status_code=status_code,
        content=response_content
    )

# ============================================================================
# STARTUP & SHUTDOWN EVENTS
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Run on application startup"""
    logger.info("=" * 60)
    logger.info(f"🚀 Starting {settings.APP_NAME} v{settings.VERSION}")
    
    # ✅ SECURITY CHECK: Validate Production Settings
    if not settings.DEBUG:
        logger.info("🔒 Running security validation for production...")
        try:
            # We explicitly check allow_origins logic here as well
            settings.get_cors_origins()
            
            is_valid = settings.validate_production_settings()
            if not is_valid:
                logger.critical("⛔ SECURITY CHECK FAILED. Aborting startup to protect data.")
                sys.exit(1)
            else:
                logger.info("✅ Security configuration passed.")
        except ValueError as e:
            # Catches the CORS error raised by get_cors_origins
            logger.critical(f"⛔ CONFIGURATION ERROR: {e}")
            sys.exit(1)
    
    logger.info(f"🔧 Environment: {'Development' if settings.DEBUG else 'Production'}")
    logger.info(f"🌐 CORS Origins: {settings.get_cors_origins()}")
    logger.info("=" * 60)

@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown"""
    logger.info(f"👋 Shutting down {settings.APP_NAME}")

# ============================================================================
# RUN APPLICATION
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )