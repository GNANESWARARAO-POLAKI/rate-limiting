"""
Rate Limiting Logic with Token Bucket Algorithm
Handles rate limiting calculations and storage
"""
import time
import json
from typing import Dict, Tuple, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

# In-memory storage for rate limits (replace with Redis later)
rate_limits_store = {}
usage_logs = []

class RateLimitBucket:
    """Fixed window rate limiter - exactly N requests per window"""
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests_count = 0
        self.window_start = time.time()
    
    def reset_if_new_window(self):
        """Reset counter if we're in a new time window"""
        current_time = time.time()
        time_since_start = current_time - self.window_start
        
        if time_since_start >= self.window_seconds:
            # New window started - reset everything
            self.requests_count = 0
            self.window_start = current_time
    
    def consume(self, tokens: int = 1) -> bool:
        """Try to consume tokens from bucket"""
        self.reset_if_new_window()
        
        # Check if adding this request would exceed the limit
        if self.requests_count + tokens <= self.max_requests:
            self.requests_count += tokens
            return True
        return False
    
    def get_remaining(self) -> int:
        """Get remaining requests in current window"""
        self.reset_if_new_window()
        return max(0, self.max_requests - self.requests_count)
    
    def get_retry_after(self) -> int:
        """Calculate seconds until next window starts"""
        if self.requests_count < self.max_requests:
            return 0
        
        current_time = time.time()
        time_since_start = current_time - self.window_start
        time_remaining = self.window_seconds - time_since_start
        
        return max(1, int(time_remaining))

class RateLimitResult(BaseModel):
    allowed: bool
    remaining_quota: int
    retry_after: int
    message: str
    endpoint: str
    user_id: Optional[str] = None

class RateLimitConfig(BaseModel):
    max_requests: int
    window_seconds: int
    burst_size: Optional[int] = None

def get_rate_limit_key(api_key: str, user_id: Optional[str], endpoint: str, limit_type: str = "user") -> str:
    """Generate unique key for rate limiting"""
    if limit_type == "global":
        return f"global:{endpoint}"
    elif limit_type == "ip":
        return f"ip:{user_id}:{endpoint}"  # user_id would be IP in this case
    else:  # user-specific
        return f"user:{api_key}:{user_id or 'anonymous'}:{endpoint}"

def check_rate_limit(
    api_key: str,
    api_key_config: Dict,
    user_id: Optional[str] = None,
    endpoint: str = "/api",
    client_ip: Optional[str] = None
) -> RateLimitResult:
    """
    Check rate limit using fixed window algorithm
    Exactly N requests per time window, then reset
    """
    max_requests = api_key_config.get("max_requests", 10)
    window_seconds = api_key_config.get("window_seconds", 60)
    
    # Generate rate limit key
    rate_limit_key = get_rate_limit_key(api_key, user_id, endpoint)
    
    # Get or create bucket
    if rate_limit_key not in rate_limits_store:
        rate_limits_store[rate_limit_key] = RateLimitBucket(max_requests, window_seconds)
    
    bucket = rate_limits_store[rate_limit_key]
    
    # Try to consume a request
    allowed = bucket.consume(1)
    remaining = bucket.get_remaining()
    retry_after = bucket.get_retry_after() if not allowed else 0
    
    # Log the request
    log_entry = {
        "timestamp": datetime.now(),
        "api_key": api_key,
        "user_id": user_id,
        "endpoint": endpoint,
        "client_ip": client_ip,
        "allowed": allowed,
        "remaining": remaining,
        "retry_after": retry_after,
        "window_start": bucket.window_start,
        "requests_in_window": bucket.requests_count
    }
    usage_logs.append(log_entry)
    
    # Keep only last 1000 log entries
    if len(usage_logs) > 1000:
        usage_logs.pop(0)
    
    message = "Request allowed" if allowed else f"Rate limit exceeded. Max {max_requests} requests per {window_seconds} seconds."
    
    return RateLimitResult(
        allowed=allowed,
        remaining_quota=remaining,
        retry_after=retry_after,
        message=message,
        endpoint=endpoint,
        user_id=user_id
    )

def check_global_rate_limit(endpoint: str, global_limit: int = 1000) -> bool:
    """Check global rate limit for an endpoint"""
    global_key = f"global:{endpoint}"
    
    if global_key not in rate_limits_store:
        # Global limit: 1000 requests per minute
        rate_limits_store[global_key] = RateLimitBucket(global_limit, global_limit / 60)
    
    bucket = rate_limits_store[global_key]
    return bucket.consume(1)

def get_rate_limit_stats(api_key: str) -> Dict:
    """Get rate limiting statistics for an API key"""
    user_buckets = {}
    total_requests = 0
    allowed_requests = 0
    
    # Find all buckets for this API key
    for key, bucket in rate_limits_store.items():
        if api_key in key:
            parts = key.split(':')
            if len(parts) >= 3:
                endpoint = parts[-1]
                # Reset bucket if needed to get current state
                bucket.reset_if_new_window()
                user_buckets[endpoint] = {
                    "remaining_tokens": bucket.get_remaining(),
                    "max_tokens": bucket.max_requests,
                    "requests_in_window": bucket.requests_count,
                    "window_seconds": bucket.window_seconds,
                    "window_start": bucket.window_start
                }
    
    # Count requests from logs
    for log in usage_logs:
        if log["api_key"] == api_key:
            total_requests += 1
            if log["allowed"]:
                allowed_requests += 1
    
    return {
        "api_key": api_key,
        "total_requests": total_requests,
        "allowed_requests": allowed_requests,
        "rejected_requests": total_requests - allowed_requests,
        "buckets": user_buckets,
        "last_hour_requests": get_recent_request_count(api_key, hours=1),
        "last_day_requests": get_recent_request_count(api_key, hours=24)
    }

def get_recent_request_count(api_key: str, hours: int = 1) -> int:
    """Count requests for API key in recent hours"""
    cutoff_time = datetime.now() - timedelta(hours=hours)
    count = 0
    
    for log in usage_logs:
        if log["api_key"] == api_key and log["timestamp"] > cutoff_time:
            count += 1
    
    return count

def get_all_usage_logs(limit: int = 100) -> list:
    """Get recent usage logs"""
    return usage_logs[-limit:] if len(usage_logs) > limit else usage_logs

def reset_rate_limits(api_key: str = None):
    """Reset rate limits (for testing or admin purposes)"""
    if api_key:
        # Reset specific API key
        keys_to_remove = [key for key in rate_limits_store.keys() if api_key in key]
        for key in keys_to_remove:
            del rate_limits_store[key]
    else:
        # Reset all
        rate_limits_store.clear()
    
    return {"message": f"Rate limits reset for {'all keys' if not api_key else api_key}"}
