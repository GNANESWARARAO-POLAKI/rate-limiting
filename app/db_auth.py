"""
Database-based authentication and user management
Replaces in-memory storage with persistent database storage
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
import secrets

from config.settings import settings
from .database import get_db
from .database_models import DBUser, DBAPIKey, DBRateLimitLog
from .models import UserRegistration, APIKeyRequest

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Security
security = HTTPBearer()

def hash_password(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password"""
    return pwd_context.verify(plain_password, hashed_password)

def generate_api_key() -> str:
    """Generate a secure API key"""
    return f"rl_{secrets.token_urlsafe(32)}"

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt

def get_user_by_email(db: Session, email: str) -> Optional[DBUser]:
    """Get user by email"""
    return db.query(DBUser).filter(DBUser.email == email).first()

def get_user_by_id(db: Session, user_id: str) -> Optional[DBUser]:
    """Get user by ID"""
    return db.query(DBUser).filter(DBUser.user_id == user_id).first()

def get_api_key_info(db: Session, api_key: str) -> Optional[DBAPIKey]:
    """Get API key information"""
    return db.query(DBAPIKey).filter(DBAPIKey.api_key == api_key).first()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    """Verify JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(credentials.credentials, settings.secret_key, algorithms=[settings.algorithm])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = get_user_by_id(db, user_id)
    if user is None:
        raise credentials_exception
    return user

def verify_api_key(api_key: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Verify API key and return key info"""
    key_info = get_api_key_info(db, api_key)
    
    if not key_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    
    if not key_info.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key is inactive"
        )
    
    return {
        "api_key": key_info.api_key,
        "user_id": key_info.user_id,
        "name": key_info.name,
        "max_requests": key_info.max_requests,
        "window_seconds": key_info.window_seconds,
        "is_active": key_info.is_active,
        "created_at": key_info.created_at
    }

def register_user(user_data: UserRegistration, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Register a new user"""
    user_id = f"user_{secrets.token_urlsafe(16)}"
    
    # Check if email already exists
    existing_user = get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    hashed_password = hash_password(user_data.password)
    db_user = DBUser(
        user_id=user_id,
        email=user_data.email,
        name=user_data.name,
        password=hashed_password,
        is_active=True,
        created_at=datetime.utcnow()
    )
    
    db.add(db_user)
    db.flush()  # Flush to get the user_id
    
    # Create default API key for the user
    api_key = generate_api_key()
    db_api_key = DBAPIKey(
        api_key=api_key,
        user_id=user_id,
        name=f"{user_data.name}'s API Key",
        max_requests=10,  # Default 10 requests per minute
        window_seconds=60,
        is_active=True,
        created_at=datetime.utcnow()
    )
    
    db.add(db_api_key)
    db.commit()
    
    # Generate access token
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user_id}, expires_delta=access_token_expires
    )
    
    return {
        "user_id": user_id,
        "access_token": access_token,
        "token_type": "bearer",
        "api_key": api_key,
        "message": "User registered successfully"
    }

def login_user(email: str, password: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Authenticate user and return access token"""
    # Find user by email
    user = get_user_by_email(db, email)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is deactivated"
        )
    
    # Generate access token
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.user_id}, expires_delta=access_token_expires
    )
    
    # Find user's API key
    api_key_record = db.query(DBAPIKey).filter(DBAPIKey.user_id == user.user_id).first()
    api_key = api_key_record.api_key if api_key_record else None
    
    return {
        "user_id": user.user_id,
        "name": user.name,
        "email": user.email,
        "access_token": access_token,
        "token_type": "bearer",
        "api_key": api_key,
        "message": "Login successful"
    }

def create_api_key(user_id: str, key_request: APIKeyRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Create a new API key for user"""
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    api_key = generate_api_key()
    db_api_key = DBAPIKey(
        api_key=api_key,
        user_id=user_id,
        name=key_request.name,
        max_requests=key_request.max_requests,
        window_seconds=key_request.window_seconds,
        is_active=True,
        created_at=datetime.utcnow()
    )
    
    db.add(db_api_key)
    db.commit()
    
    return {
        "api_key": api_key,
        "user_id": user_id,
        "name": key_request.name,
        "max_requests": key_request.max_requests,
        "window_seconds": key_request.window_seconds,
        "is_active": True,
        "created_at": db_api_key.created_at
    }

def get_user_api_keys(user_id: str, db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """Get all API keys for a user"""
    api_keys = db.query(DBAPIKey).filter(DBAPIKey.user_id == user_id).all()
    
    return [
        {
            "api_key": key.api_key,
            "user_id": key.user_id,
            "name": key.name,
            "max_requests": key.max_requests,
            "window_seconds": key.window_seconds,
            "is_active": key.is_active,
            "created_at": key.created_at
        }
        for key in api_keys
    ]

def log_api_usage(api_key: str, endpoint: str, method: str, user_agent: str = None, ip_address: str = None, db: Session = Depends(get_db)):
    """Log API usage for analytics"""
    log_entry = DBRateLimitLog(
        api_key=api_key,
        endpoint=endpoint,
        method=method,
        timestamp=datetime.utcnow(),
        user_agent=user_agent,
        ip_address=ip_address
    )
    
    db.add(log_entry)
    db.commit()

def initialize_demo_data(db: Session):
    """Initialize demo users and API keys"""
    # Check if demo data already exists
    if db.query(DBAPIKey).filter(DBAPIKey.api_key == "demo123").first():
        return
    
    # Create demo user
    demo_user = DBUser(
        user_id="demo_user",
        email="demo@example.com",
        name="Demo User",
        password=hash_password("demo123"),
        is_active=True,
        created_at=datetime.utcnow()
    )
    db.add(demo_user)
    
    # Create demo API keys
    demo_key1 = DBAPIKey(
        api_key="demo123",
        user_id="demo_user",
        name="Demo API Key",
        max_requests=10,
        window_seconds=60,
        is_active=True,
        created_at=datetime.utcnow()
    )
    
    demo_key2 = DBAPIKey(
        api_key="demo_high",
        user_id="demo_user",
        name="Demo High Limit Key",
        max_requests=100,
        window_seconds=60,
        is_active=True,
        created_at=datetime.utcnow()
    )
    
    db.add(demo_key1)
    db.add(demo_key2)
    db.commit()
    
    print("✅ Demo data initialized successfully!")
