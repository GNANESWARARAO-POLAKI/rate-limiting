"""
SQLAlchemy database models for persistent storage
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class DBUser(Base):
    """User model for authentication"""
    __tablename__ = "users"
    
    user_id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    password = Column(String, nullable=False)  # Hashed password
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship to API keys
    api_keys = relationship("DBAPIKey", back_populates="user")

class DBAPIKey(Base):
    """API Key model for rate limiting"""
    __tablename__ = "api_keys"
    
    api_key = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False)
    name = Column(String, nullable=False)
    max_requests = Column(Integer, default=100)
    window_seconds = Column(Integer, default=60)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship to user
    user = relationship("DBUser", back_populates="api_keys")

class DBRateLimitLog(Base):
    """Log table for tracking API usage"""
    __tablename__ = "rate_limit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    api_key = Column(String, ForeignKey("api_keys.api_key"), nullable=False)
    user_id = Column(String, nullable=True, index=True)  # Add user_id to logs
    endpoint = Column(String, nullable=False)
    method = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    user_agent = Column(String)
    ip_address = Column(String)

class DBRateLimitState(Base):
    """Current rate limiting state for each API key + user + endpoint combination"""
    __tablename__ = "rate_limit_states"
    
    id = Column(Integer, primary_key=True, index=True)
    api_key = Column(String, ForeignKey("api_keys.api_key"), nullable=False, index=True)
    user_id = Column(String, nullable=True, index=True)  # Allow per-user rate limiting
    endpoint = Column(String, nullable=False, index=True, default="/api")  # Track rate limits per endpoint
    current_requests = Column(Integer, default=0)
    window_start = Column(DateTime, default=datetime.utcnow)
    last_request = Column(DateTime, default=datetime.utcnow)
    
    # Ensure unique combination of api_key + user_id + endpoint
    __table_args__ = (
        UniqueConstraint('api_key', 'user_id', 'endpoint', name='uix_rate_limit_api_user_endpoint'),
        {"extend_existing": True}
    )
