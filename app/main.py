"""
Rate Limiting as a Service (RLSaaS)
Production-ready FastAPI backend with authentication and rate limiting
"""
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import time
from datetime import datetime, timedelta
from typing import Optional

# Import our modules
from app.models import *
from app.auth import *
from app.limiter import check_rate_limit, get_rate_limit_stats, get_all_usage_logs, reset_rate_limits, rate_limits_store
from config.settings import settings

# App initialization
app = FastAPI(
    title="Rate Limiting as a Service (RLSaaS)",
    description="High-performance rate limiting service for API protection",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Track app start time for uptime
app_start_time = time.time()

# ==================== ENDPOINTS ====================

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard():
    """Serve the dashboard HTML file"""
    try:
        with open("dashboard.html", "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    except FileNotFoundError:
        return HTMLResponse(content="<h1>Dashboard not found</h1><p>Please create dashboard.html</p>")

@app.get("/", response_class=HTMLResponse)
async def root():
    """Root endpoint with service information"""
    uptime = time.time() - app_start_time
    return f"""
    <html>
        <head><title>Rate Limiting as a Service</title></head>
        <body style="font-family: Arial, sans-serif; margin: 40px;">
            <h1>🚀 Rate Limiting as a Service (RLSaaS)</h1>
            <p><strong>Status:</strong> <span style="color: green;">Running</span></p>
            <p><strong>Version:</strong> 1.0.0</p>
            <p><strong>Uptime:</strong> {uptime:.2f} seconds</p>
            
            <h2>📚 API Documentation</h2>
            <ul>
                <li><a href="/docs">Swagger UI</a></li>
                <li><a href="/redoc">ReDoc</a></li>
            </ul>
            
            <h2>🔗 Key Endpoints</h2>
            <ul>
                <li><strong>POST /check-limit</strong> - Check rate limits</li>
                <li><strong>POST /register</strong> - Register new user</li>
                <li><strong>POST /api-keys</strong> - Create API key</li>
                <li><strong>GET /stats/{{api_key}}</strong> - Get usage stats</li>
                <li><strong>GET /logs</strong> - View usage logs</li>
            </ul>
            
            <h2>🧪 Test API Key</h2>
            <p>Demo API Key: <code>demo123</code></p>
            <p>Max Requests: 100 per minute</p>
        </body>
    </html>
    """

@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint"""
    uptime = time.time() - app_start_time
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(),
        version="1.0.0",
        uptime_seconds=uptime
    )

# ==================== RATE LIMITING ====================

@app.post("/check-limit", response_model=RateLimitResponse)
async def check_limit(request: RateLimitRequest, client_request: Request):
    """
    Check if request is within rate limit
    Main endpoint for rate limiting service
    """
    try:
        # Verify API key
        api_key_config = verify_api_key(request.api_key)
        
        # Get client IP
        client_ip = client_request.client.host if client_request.client else None
        
        # Check rate limit
        result = check_rate_limit(
            api_key=request.api_key,
            api_key_config=api_key_config,
            user_id=request.user_id,
            endpoint=request.endpoint,
            client_ip=client_ip
        )
        
        return RateLimitResponse(
            allowed=result.allowed,
            remaining_quota=result.remaining_quota,
            retry_after=result.retry_after,
            message=result.message,
            endpoint=result.endpoint,
            user_id=result.user_id
        )
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# ==================== USER MANAGEMENT ====================

@app.post("/register")
async def register_user_endpoint(user_data: UserRegistration):
    """Register a new user"""
    try:
        result = register_user(user_data)
        user_info = users_db[result["user_id"]]
        
        return {
            "user_id": result["user_id"],
            "name": user_info["name"],
            "email": user_info["email"],
            "access_token": result["access_token"],
            "token_type": result["token_type"],
            "api_key": result["api_key"],
            "message": result["message"]
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@app.post("/login")
async def login_user_endpoint(user_credentials: UserLogin):
    """Login user and return access token"""
    try:
        result = login_user(user_credentials.email, user_credentials.password)
        
        return {
            "user_id": result["user_id"],
            "name": result["name"],
            "email": result["email"],
            "access_token": result["access_token"],
            "token_type": result["token_type"],
            "api_key": result["api_key"],
            "message": result["message"]
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@app.post("/api-keys", response_model=APIKeyResponse)
async def create_new_api_key(
    key_request: APIKeyRequest,
    current_user: dict = Depends(verify_token)
):
    """Create a new API key for authenticated user"""
    try:
        api_key_obj = create_api_key(current_user["user_id"], key_request)
        return APIKeyResponse(
            api_key=api_key_obj.api_key,
            name=api_key_obj.name,
            max_requests=api_key_obj.max_requests,
            window_seconds=api_key_obj.window_seconds,
            is_active=api_key_obj.is_active,
            created_at=api_key_obj.created_at
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create API key: {str(e)}")

@app.get("/api-keys", response_model=APIKeyListResponse)
async def list_api_keys(current_user: dict = Depends(verify_token)):
    """List all API keys for authenticated user"""
    try:
        keys = get_user_api_keys(current_user["user_id"])
        api_key_responses = [
            APIKeyResponse(
                api_key=key["api_key"],
                name=key["name"],
                max_requests=key["max_requests"],
                window_seconds=key["window_seconds"],
                is_active=key["is_active"],
                created_at=key["created_at"]
            )
            for key in keys
        ]
        
        return APIKeyListResponse(
            api_keys=api_key_responses,
            total=len(api_key_responses)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list API keys: {str(e)}")

# ==================== STATISTICS & MONITORING ====================

@app.get("/stats/{api_key}", response_model=StatsResponse)
async def get_api_key_stats(api_key: str):
    """Get usage statistics for an API key"""
    try:
        # Verify API key exists
        verify_api_key(api_key)
        
        stats = get_rate_limit_stats(api_key)
        return StatsResponse(**stats)
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")

@app.get("/logs", response_model=LogsResponse)
async def get_usage_logs(
    limit: int = 100,
    page: int = 1,
    api_key: Optional[str] = None
):
    """Get usage logs (admin endpoint)"""
    try:
        all_logs = get_all_usage_logs(limit * page)
        
        # Filter by API key if specified
        if api_key:
            all_logs = [log for log in all_logs if log["api_key"] == api_key]
        
        # Pagination
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paginated_logs = all_logs[start_idx:end_idx]
        
        log_entries = [
            LogEntry(
                timestamp=log["timestamp"],
                api_key=log["api_key"],
                user_id=log["user_id"],
                endpoint=log["endpoint"],
                client_ip=log["client_ip"],
                allowed=log["allowed"],
                remaining=log["remaining"],
                retry_after=log["retry_after"]
            )
            for log in paginated_logs
        ]
        
        return LogsResponse(
            logs=log_entries,
            total=len(all_logs),
            page=page,
            limit=limit
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get logs: {str(e)}")

@app.get("/system-stats", response_model=SystemStatsResponse)
async def get_system_stats():
    """Get overall system statistics"""
    try:
        # Count requests today
        today = datetime.now().date()
        today_requests = sum(
            1 for log in get_all_usage_logs(10000)
            if log["timestamp"].date() == today
        )
        
        return SystemStatsResponse(
            total_api_keys=len(api_keys_db),
            total_users=len(users_db),
            total_requests_today=today_requests,
            active_rate_limits=len(rate_limits_store),
            system_status="healthy"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get system stats: {str(e)}")

# ==================== ADMIN ENDPOINTS ====================

@app.post("/test-endpoint")
async def test_endpoint(request: Request):
    """Test endpoint for rate limiting demonstration"""
    # Get API key from header
    api_key = request.headers.get("X-API-Key")
    if not api_key:
        raise HTTPException(status_code=401, detail="API key required in X-API-Key header")
    
    # Create a test rate limit request
    rate_limit_request = RateLimitRequest(
        api_key=api_key,
        user_id="test_user",
        endpoint="/test-endpoint"
    )
    
    # Check rate limit
    try:
        api_key_config = verify_api_key(api_key)
        client_ip = request.client.host if request.client else None
        
        result = check_rate_limit(
            api_key=api_key,
            api_key_config=api_key_config,
            user_id="test_user",
            endpoint="/test-endpoint",
            client_ip=client_ip
        )
        
        if not result.allowed:
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. Try again in {result.retry_after} seconds."
            )
        
        return {
            "message": "Test request successful!",
            "timestamp": datetime.now().isoformat(),
            "remaining_quota": result.remaining_quota,
            "endpoint": "/test-endpoint",
            "status": "success"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/admin/reset-limits")
async def admin_reset_limits(api_key: Optional[str] = None):
    """Reset rate limits (admin only)"""
    try:
        result = reset_rate_limits(api_key)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reset limits: {str(e)}")

# ==================== ERROR HANDLERS ====================

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": f"HTTP {exc.status_code}",
            "message": exc.detail,
            "timestamp": datetime.now().isoformat()
        }
    )

# ==================== MAIN FUNCTION ====================

def main():
    """Main function to run the application"""
    import uvicorn
    
    print("🚀 Starting Rate Limiting Service...")
    print(f"📊 Dashboard will be available at: http://localhost:{settings.port}")
    print(f"📚 API Documentation: http://localhost:{settings.port}/docs")
    print(f"🔑 Demo API Key: demo123")
    
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info"
    )

if __name__ == "__main__":
    main()
