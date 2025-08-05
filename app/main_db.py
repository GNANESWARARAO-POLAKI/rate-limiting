"""
FastAPI Rate Limiting Service with Database Storage
Main application file with persistent database storage
"""
from fastapi import FastAPI, HTTPException, Depends, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Dict, Any
import uvicorn
import logging

# Configure logging to reduce SQLAlchemy verbosity
logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)
logging.getLogger('sqlalchemy.pool').setLevel(logging.WARNING)
logging.getLogger('sqlalchemy.dialects').setLevel(logging.WARNING)

from config.settings import settings
from app.database import get_db
from app.db_auth import (
    register_user, login_user, create_api_key, get_user_api_keys,
    verify_token, initialize_demo_data
)
from app.db_limiter import db_rate_limiter
from app.models import UserRegistration, APIKeyRequest, RateLimitRequest

# Create FastAPI app
app = FastAPI(
    title="Rate Limiting API with Database",
    description="A FastAPI-based rate limiting service with persistent database storage",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Initialize database with demo data on startup"""
    print("🚀 Starting Rate Limiting API with Database Storage...")
    try:
        from app.database import get_db_session
        with get_db_session() as db:
            initialize_demo_data(db)
        print("✅ Database initialized successfully!")
    except Exception as e:
        print(f"⚠️  Warning: Could not initialize demo data: {e}")

@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "message": "Rate Limiting API with Database Storage",
        "version": "2.0.0",
        "storage": "Database (Persistent)",
        "docs": "/docs",
        "redoc": "/redoc",
        "essential_endpoints": {
            "check_rate_limit": {
                "method": "POST",
                "url": "/check-limit",
                "description": "Check if request is within rate limit - Main functionality"
            },
            "register": {
                "method": "POST", 
                "url": "/register",
                "description": "Register a new user"
            },
            "login": {
                "method": "POST",
                "url": "/login", 
                "description": "Login and get access token"
            },
            "create_api_key": {
                "method": "POST",
                "url": "/api-keys",
                "description": "Create API key (requires authentication)"
            }
        },
        "demo_info": {
            "api_key": "demo123",
            "description": "Use this demo API key for testing rate limiting"
        }
    }
    
@app.post("/register")
async def register_endpoint(user_data: UserRegistration, db: Session = Depends(get_db)):
    """Register a new user"""
    try:
        result = register_user(user_data, db)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@app.post("/login")
async def login_endpoint(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login user and return access token"""
    try:
        result = login_user(form_data.username, form_data.password, db)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@app.get("/api/protected")
async def protected_endpoint(request: Request, api_key: str, user_id: str = None):
    """Protected endpoint with rate limiting"""
    try:
        # Check rate limit
        rate_limit_result = db_rate_limiter.check_rate_limit(
            api_key=api_key,
            user_id=user_id,
            endpoint="/api/protected",
            method=request.method
        )
        
        if not rate_limit_result["allowed"]:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "error": "Rate limit exceeded",
                    "retry_after": rate_limit_result.get("retry_after", 60),
                    "limit": rate_limit_result["limit"],
                    "reset_time": rate_limit_result["reset_time"].isoformat()
                }
            )
        
        return {
            "message": "Access granted! This is a protected endpoint.",
            "timestamp": rate_limit_result.get("reset_time"),
            "rate_limit": {
                "remaining": rate_limit_result["remaining"],
                "limit": rate_limit_result["limit"],
                "reset_time": rate_limit_result["reset_time"].isoformat()
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.post("/test-endpoint")
async def test_endpoint(request: Request):
    """Test endpoint for rate limiting (uses API key from headers)"""
    try:
        # Get API key from headers
        api_key = request.headers.get("X-API-Key")
        if not api_key:
            raise HTTPException(status_code=400, detail="X-API-Key header required")
        
        # Check rate limit
        rate_limit_result = db_rate_limiter.check_rate_limit(
            api_key=api_key,
            endpoint="/test-endpoint",
            method=request.method
        )
        
        if not rate_limit_result["allowed"]:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "error": "Rate limit exceeded",
                    "retry_after": rate_limit_result.get("retry_after", 60),
                    "limit": rate_limit_result["limit"],
                    "reset_time": rate_limit_result["reset_time"].isoformat()
                }
            )
        
        return {
            "message": "Test request successful!",
            "timestamp": rate_limit_result.get("reset_time"),
            "rate_limit": {
                "remaining": rate_limit_result["remaining"],
                "limit": rate_limit_result["limit"],
                "reset_time": rate_limit_result["reset_time"].isoformat()
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.post("/check-limit")
async def check_limit(request: RateLimitRequest, client_request: Request):
    """
    Check if request is within rate limit
    Main endpoint for rate limiting service
    """
    try:
        # Check rate limit
        rate_limit_result = db_rate_limiter.check_rate_limit(
            api_key=request.api_key,
            user_id=request.user_id,
            endpoint=request.endpoint or "/check-limit",
            method=client_request.method
        )
        
        return {
            "allowed": rate_limit_result["allowed"],
            "remaining_quota": rate_limit_result.get("remaining", 0),
            "retry_after": rate_limit_result.get("retry_after", 0),
            "message": "Request allowed" if rate_limit_result["allowed"] else "Rate limit exceeded",
            "endpoint": request.endpoint or "/check-limit",
            "user_id": request.user_id or "unknown"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/check-limit-ip")
async def check_limit_ip(request: Request):
    """
    Check rate limit for anonymous users using IP address
    For websites that need to protect against anonymous user abuse
    
    Expected JSON body:
    {
        "api_key": "your_api_key",
        "endpoint": "/api/some-endpoint" (optional, defaults to "/anonymous")
    }
    """
    try:
        # Parse request body
        request_data = await request.json()
        api_key = request_data.get("api_key")
        endpoint = request_data.get("endpoint", "/anonymous")
        
        if not api_key:
            raise HTTPException(status_code=400, detail="api_key is required")
        
        # Get client IP address
        client_ip = request.client.host
        if request.headers.get("x-forwarded-for"):
            # Handle proxy/load balancer forwarded IPs
            client_ip = request.headers.get("x-forwarded-for").split(",")[0].strip()
        elif request.headers.get("x-real-ip"):
            client_ip = request.headers.get("x-real-ip")
        
        # Use IP address as user_id for anonymous rate limiting
        rate_limit_result = db_rate_limiter.check_rate_limit(
            api_key=api_key,
            user_id=f"ip_{client_ip}",  # Prefix with 'ip_' to distinguish from real user IDs
            endpoint=endpoint,
            method=request.method
        )
        
        return {
            "allowed": rate_limit_result["allowed"],
            "remaining_quota": rate_limit_result.get("remaining", 0),
            "retry_after": rate_limit_result.get("retry_after", 0),
            "message": "Request allowed" if rate_limit_result["allowed"] else f"Rate limit exceeded for IP {client_ip}",
            "endpoint": endpoint,
            "client_ip": client_ip,
            "identifier": f"ip_{client_ip}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/api-keys")
async def create_api_key_endpoint(
    key_request: APIKeyRequest, 
    current_user=Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Create a new API key for the authenticated user"""
    try:
        result = create_api_key(current_user.user_id, key_request, db)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create API key: {str(e)}")

@app.get("/api-keys")
async def get_api_keys_endpoint(
    current_user=Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Get all API keys for the authenticated user"""
    try:
        keys = get_user_api_keys(current_user.user_id, db)
        return {"api_keys": keys}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get API keys: {str(e)}")

@app.get("/stats/{api_key}")
async def get_stats(api_key: str):
    """Get usage statistics for an API key"""
    try:
        stats = db_rate_limiter.get_usage_stats(api_key)
        return stats
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")

@app.get("/system-stats")
async def get_system_stats():
    """Get system-wide statistics"""
    try:
        stats = db_rate_limiter.get_system_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get system stats: {str(e)}")

@app.post("/admin/cleanup")
async def cleanup_logs(days: int = 30):
    """Clean up old logs (admin endpoint)"""
    try:
        deleted = db_rate_limiter.cleanup_old_logs(days)
        return {"message": f"Cleaned up {deleted} old log entries"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cleanup failed: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint - Returns service and database status"""
    from datetime import datetime
    from sqlalchemy import text
    
    try:
        from app.database import get_db_session
        with get_db_session() as db:
            # Simple database query to check connectivity - properly wrapped with text()
            result = db.execute(text("SELECT 1")).fetchone()
            if result:
                db_status = "connected"
            else:
                db_status = "error"
        
        return {
            "status": "healthy",
            "database": db_status,
            "version": "2.0.0",
            "service": "rate-limiting-api",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e),
            "service": "rate-limiting-api",
            "version": "2.0.0",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }

if __name__ == "__main__":
    import socket
    
    # Get local IP address
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            local_ip = s.getsockname()[0]
    except Exception:
        local_ip = "Unable to detect"
    
    print("🚀 Starting Rate Limiting API with Database Storage...")
    print(f"📍 Local Access: http://localhost:8000")
    print(f"🌍 Network Access: http://{local_ip}:8000")
    print(f"📖 API Docs: http://localhost:8000/docs")
    print(f"🌐 Network Docs: http://{local_ip}:8000/docs")
    print("=" * 60)
    
    uvicorn.run(
        "app.main_db:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
