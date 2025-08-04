"""
API Key Authentication and JWT Token Management
Handles user registration, API key generation, and token validation
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
import secrets
import hashlib
from config.settings import settings

# Password hashing
try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
except Exception as e:
    # Fallback for bcrypt version issues
    print(f"Warning: bcrypt version issue: {e}")
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__default_rounds=12)

# JWT Security
security = HTTPBearer()

# In-memory storage (replace with database later)
users_db = {}
api_keys_db = {
    "demo123": {
        "user_id": "demo_user",
        "name": "Demo User",
        "email": "demo@example.com",
        "max_requests": 10,  # Only 10 requests
        "window_seconds": 60,  # per 60 seconds (10 per minute)
        "created_at": datetime.now(),
        "is_active": True
    },
    "demo_high": {
        "user_id": "demo_user_high",
        "name": "Demo User (High Limit)",
        "email": "demo_high@example.com", 
        "max_requests": 100,
        "window_seconds": 60,
        "created_at": datetime.now(),
        "is_active": True
    }
}

class User(BaseModel):
    user_id: str
    email: str
    name: str
    is_active: bool = True
    created_at: datetime

class APIKey(BaseModel):
    api_key: str
    user_id: str
    name: str
    max_requests: int = 100
    window_seconds: int = 60
    is_active: bool = True
    created_at: datetime

class UserRegistration(BaseModel):
    name: str
    email: str
    password: str

class APIKeyRequest(BaseModel):
    name: str
    max_requests: int = 100
    window_seconds: int = 60

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

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
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
    
    user = users_db.get(user_id)
    if user is None:
        raise credentials_exception
    return user

def verify_api_key(api_key: str) -> Dict[str, Any]:
    """Verify API key and return key info"""
    if api_key not in api_keys_db:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    
    key_info = api_keys_db[api_key]
    if not key_info["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key is inactive"
        )
    
    return key_info

def register_user(user_data: UserRegistration) -> Dict[str, Any]:
    """Register a new user"""
    user_id = f"user_{secrets.token_urlsafe(16)}"
    
    # Check if email already exists
    for existing_user in users_db.values():
        if existing_user["email"] == user_data.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    # Create user
    hashed_password = hash_password(user_data.password)
    user = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password": hashed_password,
        "is_active": True,
        "created_at": datetime.now()
    }
    
    users_db[user_id] = user
    
    # Create default API key for the user
    api_key = generate_api_key()
    key_data = {
        "user_id": user_id,
        "name": f"{user_data.name}'s API Key",
        "email": user_data.email,
        "max_requests": 10,  # Default 10 requests per minute
        "window_seconds": 60,
        "is_active": True,
        "created_at": datetime.now()
    }
    api_keys_db[api_key] = key_data
    
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

def login_user(email: str, password: str) -> Dict[str, Any]:
    """Authenticate user and return access token"""
    # Find user by email
    user = None
    user_id = None
    for uid, user_data in users_db.items():
        if user_data["email"] == email:
            user = user_data
            user_id = uid
            break
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not user["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is deactivated"
        )
    
    # Generate access token
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user_id}, expires_delta=access_token_expires
    )
    
    # Find user's API key (assuming they have one from registration)
    api_key = None
    for key, key_data in api_keys_db.items():
        if key_data["user_id"] == user_id:
            api_key = key
            break
    
    return {
        "user_id": user_id,
        "name": user["name"],
        "email": user["email"],
        "access_token": access_token,
        "token_type": "bearer",
        "api_key": api_key,
        "message": "Login successful"
    }

def create_api_key(user_id: str, key_request: APIKeyRequest) -> APIKey:
    """Create a new API key for user"""
    if user_id not in users_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    api_key = generate_api_key()
    key_data = {
        "user_id": user_id,
        "name": key_request.name,
        "max_requests": key_request.max_requests,
        "window_seconds": key_request.window_seconds,
        "is_active": True,
        "created_at": datetime.now()
    }
    
    api_keys_db[api_key] = key_data
    
    return APIKey(api_key=api_key, **key_data)

def get_user_api_keys(user_id: str) -> list:
    """Get all API keys for a user"""
    user_keys = []
    for api_key, key_data in api_keys_db.items():
        if key_data["user_id"] == user_id:
            user_keys.append({
                "api_key": api_key,
                **key_data
            })
    return user_keys

def initialize_demo_data():
    """Initialize demo users and data"""
    # Only initialize if users_db is empty
    if not users_db:
        print("🚀 Initializing demo users...")
        
        # Create demo users with hashed passwords
        demo_password_hash = hash_password("demo123")
        
        users_db["demo_user"] = {
            "user_id": "demo_user",
            "email": "demo@example.com",
            "name": "Demo User",
            "password": demo_password_hash,
            "is_active": True,
            "created_at": datetime.now()
        }
        
        users_db["demo_user_high"] = {
            "user_id": "demo_user_high",
            "email": "demo_high@example.com",
            "name": "Demo User (High Limit)",
            "password": demo_password_hash,
            "is_active": True,
            "created_at": datetime.now()
        }
        
        print("✅ Demo users initialized:")
        print("   📧 demo@example.com / demo123")
        print("   📧 demo_high@example.com / demo123")

# Initialize demo data when module is imported
initialize_demo_data()
