"""
Configuration settings for Rate Limiting Service
Supports both local development and production environments
"""
import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Application
    app_name: str = "Rate Limiting Service"
    debug: bool = True
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    
    # Database (PostgreSQL) - Local Setup
    database_url: str = "postgresql://postgres:password@localhost:5432/ratelimit_db"
    
    # Redis - Local Setup
    redis_url: str = "redis://localhost:6379/0"
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_db: int = 0
    
    # JWT Authentication
    secret_key: str = os.getenv("SECRET_KEY", "your-super-secret-key-change-this-in-production")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Rate Limiting Defaults
    default_rate_limit: int = 100  # requests per minute
    default_burst_size: int = 10   # burst capacity
    default_refill_rate: float = 1.67  # tokens per second (100/60)
    
    # CORS - Allow all origins
    allowed_origins: list[str] = ["*", "localhost:8000", "localhost:3000"]  # Allow all origins
    
    class Config:
        env_file = ".env"
        case_sensitive = False

# Global settings instance
settings = Settings()
