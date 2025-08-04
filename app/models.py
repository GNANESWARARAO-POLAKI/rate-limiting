"""
Pydantic models for API requests and responses
"""
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

# Request Models
class RateLimitRequest(BaseModel):
    api_key: str
    user_id: Optional[str] = None
    endpoint: Optional[str] = "/api"

class UserRegistration(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class APIKeyRequest(BaseModel):
    name: str
    max_requests: int = 100
    window_seconds: int = 60

# Response Models
class RateLimitResponse(BaseModel):
    allowed: bool
    remaining_quota: int
    retry_after: int
    message: str
    endpoint: str
    user_id: Optional[str] = None

class UserResponse(BaseModel):
    user_id: str
    name: str
    email: str
    is_active: bool
    created_at: datetime

class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class APIKeyResponse(BaseModel):
    api_key: str
    name: str
    max_requests: int
    window_seconds: int
    is_active: bool
    created_at: datetime

class APIKeyListResponse(BaseModel):
    api_keys: List[APIKeyResponse]
    total: int

class StatsResponse(BaseModel):
    api_key: str
    total_requests: int
    allowed_requests: int
    rejected_requests: int
    buckets: Dict[str, Any]
    last_hour_requests: int
    last_day_requests: int

class SystemStatsResponse(BaseModel):
    total_api_keys: int
    total_users: int
    total_requests_today: int
    active_rate_limits: int
    system_status: str

class LogEntry(BaseModel):
    timestamp: datetime
    api_key: str
    user_id: Optional[str]
    endpoint: str
    client_ip: Optional[str]
    allowed: bool
    remaining: int
    retry_after: int

class LogsResponse(BaseModel):
    logs: List[LogEntry]
    total: int
    page: int
    limit: int

class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    version: str
    uptime_seconds: float

class ErrorResponse(BaseModel):
    error: str
    message: str
    timestamp: datetime
