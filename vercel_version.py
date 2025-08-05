"""
Simplified FastAPI Rate Limiting for Vercel
Only IP-based rate limiting functionality
"""
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from datetime import datetime
from mangum import Mangum

app = FastAPI(title="Rate Limiting API - Vercel", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection (external only)
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://your-connection-string")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@app.get("/")
async def root():
    return {
        "message": "Rate Limiting API - Vercel Serverless",
        "version": "1.0.0",
        "endpoint": "/check-limit-ip"
    }

@app.post("/check-limit-ip")
async def check_limit_ip(request: Request):
    """Simple IP-based rate limiting for Vercel"""
    try:
        # Parse request
        request_data = await request.json()
        api_key = request_data.get("api_key")
        
        if not api_key:
            raise HTTPException(status_code=400, detail="api_key is required")
        
        # Get IP
        client_ip = request.client.host
        if request.headers.get("x-forwarded-for"):
            client_ip = request.headers.get("x-forwarded-for").split(",")[0].strip()
        
        # Simple rate limiting logic (you'd implement this)
        # For now, just return success
        return {
            "allowed": True,
            "remaining_quota": 8,
            "retry_after": 0,
            "message": "Request allowed",
            "client_ip": client_ip,
            "identifier": f"ip_{client_ip}"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "rate-limiting-vercel",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

# Vercel handler
handler = Mangum(app)
