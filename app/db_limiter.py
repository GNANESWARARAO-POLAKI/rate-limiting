"""
Database-based rate limiting system
Replaces in-memory storage with persistent database storage
"""
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_

from .database import get_db_session
from .database_models import DBRateLimitState, DBAPIKey, DBRateLimitLog
from .db_auth import verify_api_key

class DatabaseRateLimiter:
    """Database-backed rate limiter with persistent state"""
    
    def __init__(self):
        pass
    
    def check_rate_limit(self, api_key: str, user_id: str = None, endpoint: str = "/api", method: str = "GET") -> Dict[str, Any]:
        """Check if request is allowed based on rate limit"""
        with get_db_session() as db:
            # First verify the API key
            key_info = verify_api_key(api_key, db)
            
            # Get or create rate limit state
            query = db.query(DBRateLimitState).filter(
                DBRateLimitState.api_key == api_key
            )
            
            # Add user_id filter if provided
            if user_id:
                query = query.filter(DBRateLimitState.user_id == user_id)
            else:
                # If no user_id provided, filter for rows with NULL user_id for backwards compatibility
                query = query.filter(DBRateLimitState.user_id.is_(None))
            
            # Filter by endpoint
            query = query.filter(DBRateLimitState.endpoint == endpoint)
                
            rate_state = query.first()
            
            current_time = datetime.utcnow()
            max_requests = key_info["max_requests"]
            window_seconds = key_info["window_seconds"]
            
            if not rate_state:
                # Create new rate limit state
                rate_state = DBRateLimitState(
                    api_key=api_key,
                    user_id=user_id,
                    endpoint=endpoint,
                    current_requests=1,
                    window_start=current_time,
                    last_request=current_time
                )
                db.add(rate_state)
                db.commit()
                
                # Log the usage
                self._log_usage(db, api_key, user_id, endpoint, method)
                
                return {
                    "allowed": True,
                    "remaining": max_requests - 1,
                    "limit": max_requests,
                    "reset_time": current_time + timedelta(seconds=window_seconds),
                    "window_seconds": window_seconds,
                    "user_id": user_id,
                    "endpoint": endpoint
                }
            
            # Check if window has expired
            window_elapsed = (current_time - rate_state.window_start).total_seconds()
            
            if window_elapsed >= window_seconds:
                # Reset the window
                rate_state.current_requests = 1
                rate_state.window_start = current_time
                rate_state.last_request = current_time
                db.commit()
                
                # Log the usage
                self._log_usage(db, api_key, user_id, endpoint, method)
                
                return {
                    "allowed": True,
                    "remaining": max_requests - 1,
                    "limit": max_requests,
                    "reset_time": current_time + timedelta(seconds=window_seconds),
                    "window_seconds": window_seconds,
                    "user_id": user_id,
                    "endpoint": endpoint
                }
            
            # Check if within rate limit
            if rate_state.current_requests < max_requests:
                rate_state.current_requests += 1
                rate_state.last_request = current_time
                db.commit()
                
                # Log the usage
                self._log_usage(db, api_key, user_id, endpoint, method)
                
                return {
                    "allowed": True,
                    "remaining": max_requests - rate_state.current_requests,
                    "limit": max_requests,
                    "reset_time": rate_state.window_start + timedelta(seconds=window_seconds),
                    "window_seconds": window_seconds,
                    "user_id": user_id,
                    "endpoint": endpoint
                }
            
            # Rate limit exceeded
            reset_time = rate_state.window_start + timedelta(seconds=window_seconds)
            retry_after = (reset_time - current_time).total_seconds()
            
            return {
                "allowed": False,
                "remaining": 0,
                "limit": max_requests,
                "reset_time": reset_time,
                "retry_after": max(0, int(retry_after)),
                "window_seconds": window_seconds,
                "user_id": user_id,
                "endpoint": endpoint
            }
    
    def _log_usage(self, db: Session, api_key: str, user_id: str = None, endpoint: str = None, method: str = None):
        """Log API usage"""
        log_entry = DBRateLimitLog(
            api_key=api_key,
            user_id=user_id,
            endpoint=endpoint,
            method=method,
            timestamp=datetime.utcnow()
        )
        db.add(log_entry)
    
    def get_usage_stats(self, api_key: str, user_id: str = None, endpoint: str = None, hours: int = 24) -> Dict[str, Any]:
        """Get usage statistics for an API key"""
        with get_db_session() as db:
            # Verify API key exists
            key_info = verify_api_key(api_key, db)
            
            # Get usage logs from the last N hours
            since_time = datetime.utcnow() - timedelta(hours=hours)
            query = db.query(DBRateLimitLog).filter(
                and_(
                    DBRateLimitLog.api_key == api_key,
                    DBRateLimitLog.timestamp >= since_time
                )
            )
            
            # Filter by user_id if provided
            if user_id:
                query = query.filter(DBRateLimitLog.user_id == user_id)
                
            # Filter by endpoint if provided
            if endpoint:
                query = query.filter(DBRateLimitLog.endpoint == endpoint)
                
            logs = query.all()
            
            # Get current rate limit state
            query = db.query(DBRateLimitState).filter(
                DBRateLimitState.api_key == api_key
            )
            
            # Add user_id filter if provided
            if user_id:
                query = query.filter(DBRateLimitState.user_id == user_id)
            else:
                # If no user_id provided, filter for rows with NULL user_id
                query = query.filter(DBRateLimitState.user_id.is_(None))
                
            # Add endpoint filter if provided
            if endpoint:
                query = query.filter(DBRateLimitState.endpoint == endpoint)
                
            rate_state = query.first()
            
            # Calculate statistics
            total_requests = len(logs)
            
            # Group by endpoint
            endpoint_stats = {}
            for log in logs:
                endpoint = log.endpoint
                if endpoint not in endpoint_stats:
                    endpoint_stats[endpoint] = 0
                endpoint_stats[endpoint] += 1
            
            # Current window info
            current_requests = rate_state.current_requests if rate_state else 0
            window_start = rate_state.window_start if rate_state else None
            
            return {
                "api_key": api_key,
                "total_requests_24h": total_requests,
                "current_window_requests": current_requests,
                "window_start": window_start,
                "endpoint_breakdown": endpoint_stats,
                "rate_limit": {
                    "max_requests": key_info["max_requests"],
                    "window_seconds": key_info["window_seconds"]
                },
                "last_request": rate_state.last_request if rate_state else None
            }
    
    def get_system_stats(self) -> Dict[str, Any]:
        """Get system-wide statistics"""
        with get_db_session() as db:
            # Total users
            total_users = db.query(DBAPIKey).distinct(DBAPIKey.user_id).count()
            
            # Total API keys
            total_keys = db.query(DBAPIKey).filter(DBAPIKey.is_active == True).count()
            
            # Total requests in last 24 hours
            since_time = datetime.utcnow() - timedelta(hours=24)
            total_requests_24h = db.query(DBRateLimitLog).filter(
                DBRateLimitLog.timestamp >= since_time
            ).count()
            
            # Active API keys (those with recent activity)
            active_keys = db.query(DBRateLimitState).filter(
                DBRateLimitState.last_request >= since_time
            ).count()
            
            return {
                "total_users": total_users,
                "total_api_keys": total_keys,
                "active_api_keys_24h": active_keys,
                "total_requests_24h": total_requests_24h,
                "timestamp": datetime.utcnow()
            }
    
    def cleanup_old_logs(self, days: int = 30):
        """Clean up old usage logs"""
        with get_db_session() as db:
            cutoff_time = datetime.utcnow() - timedelta(days=days)
            
            deleted = db.query(DBRateLimitLog).filter(
                DBRateLimitLog.timestamp < cutoff_time
            ).delete()
            
            print(f"🧹 Cleaned up {deleted} old log entries")
            return deleted

# Global rate limiter instance
db_rate_limiter = DatabaseRateLimiter()

# Convenience functions for backward compatibility
def check_rate_limit(api_key: str, user_id: str = None, endpoint: str = "/api", method: str = "GET") -> Dict[str, Any]:
    """Check rate limit using database storage"""
    return db_rate_limiter.check_rate_limit(api_key, user_id, endpoint, method)

def log_usage(api_key: str, user_id: str = None, endpoint: str = None, method: str = None):
    """Log API usage"""
    # This is handled automatically in check_rate_limit
    pass
