# 🚀 Rate Limiting as a Service (RLSaaS)

A high-performance, production-ready **Rate Limiting Service** that developers can plug into their applications to protect APIs from abuse, bots, and DoS attacks.

## ✅ **Current Features & Implementation**

### **🔧 Backend (FastAPI with Database)**

- ✅ **Fixed Window Rate Limiting Algorithm** - Stored in database tables
- ✅ **Multi-API Key Support** - Database-backed API key management
- ✅ **Per-User & Per-Endpoint Limiting** - Persistent granular control
- ✅ **JWT Token Authentication** with database user storage
- ✅ **User Registration System** with database persistence
- ✅ **Real-time Usage Statistics** from database queries
- ✅ **Comprehensive Request Logging** in database tables
- ✅ **Health Check & System Stats** endpoints
- ✅ **CORS Support** for frontend integration
- ✅ **Persistent Storage** - All data survives server restarts

### 🎨 **Frontend (React Dashboard)**

- ✅ **Interactive React Dashboard** with real-time updates
- ✅ **Multi-API Key Statistics** visualization
- ✅ **Live API Testing Interface** with response display
- ✅ **Usage Analytics** with charts and metrics
- ✅ **System Monitoring** dashboard
- ✅ **Backend Wake-up Service** for Render deployments

### 📊 **Rate Limiting Algorithm**

- ✅ **Fixed Window Algorithm** - Exactly N requests per window, then reset
- ✅ **Per-User Rate Limiting** - Individual limits per user ID
- ✅ **Per-Endpoint Rate Limiting** - Different limits for different API endpoints
- ✅ **API Key-based Configuration** - Customizable limits per API key
- ✅ **Automatic Window Reset** - Clean slate every time window

---

## 🏃 **Quick Start**

### 1. **Start the Service (Database Version)**

```bash
cd "d:\Rompit Technologies\rate-limiting"
uvicorn app.main_db:app --reload --host 0.0.0.0 --port 8000
```

### 2. **Access the Dashboard**

🌐 **Dashboard:** http://localhost:8000/dashboard
📚 **API Docs:** http://localhost:8000/docs

### 3. **Production Links**

🚀 **Frontend (Vercel):** https://rate-limiting-service.vercel.app/
🔗 **Backend (Render):** https://rate-limiting.onrender.com/

### 4. **Test with Demo API Key**

Use the demo API key: `demo123` (100 requests per minute)

## 🔄 **Rate Limiting Workflow**

### **1. Request Processing Flow**
```
Client Request → API Key Validation → Rate Limit Check → Response
     ↓               ↓                    ↓              ↓
   Headers      Authentication      Fixed Window     Allow/Deny
  api_key       JWT Verification     Algorithm      + Statistics
```

### **2. Fixed Window Algorithm**
```python
# Every 60 seconds (configurable window):
# - Counter resets to 0
# - User gets fresh quota of N requests
# - Exact limit enforcement (no burst)

Window 1: [0-60s]  → 100 requests allowed
Window 2: [60-120s] → Counter resets, 100 new requests
```

### **3. Multi-Level Rate Limiting**
- **API Key Level**: Different limits per API key (e.g., demo123 = 100/min)
- **User Level**: Per user_id within each API key
- **Endpoint Level**: Different limits per API endpoint
- **Combined**: `api_key:user_id:endpoint` unique limiting

---

## 🛠️ **Current Project Structure**

```
rate-limiting/
├── 📱 app/                    # Core FastAPI application
│   ├── main_db.py            # FastAPI app with database storage (ACTIVE)
│   ├── main.py               # In-memory version (not used)
│   ├── db_auth.py            # Database authentication (ACTIVE)
│   ├── db_limiter.py         # Database rate limiting (ACTIVE)
│   ├── database.py           # Database configuration (ACTIVE)
│   ├── database_models.py    # SQLAlchemy ORM models (ACTIVE)
│   ├── models.py             # Pydantic data models
│   ├── auth.py               # In-memory auth (not used)
│   └── limiter.py            # In-memory limiter (not used)
├── ⚙️ config/
│   └── settings.py           # Environment configuration
├── 🎨 dashboard/             # React frontend
│   ├── src/
│   │   ├── App.js           # Main React app
│   │   ├── components/      # React components
│   │   └── utils/           # Frontend utilities
│   ├── package.json         # Node.js dependencies
│   └── vercel.json          # Vercel deployment config
├── 🔧 scripts/              # Database management tools
│   ├── init_database.py     # Database initialization
│   ├── setup_database.py    # Database setup
│   └── reset_database.py    # Database reset
├── 📋 requirements.txt       # Python dependencies
├── 🌍 .env.example          # Environment template
└── 🗃️ _archive_unused/      # Archived old files
```

---

## 🔗 **API Endpoints**

### **🛡️ Core Rate Limiting**
- `POST /check-limit` - Check if request is within rate limits
- `GET /health` - Health check and uptime
- `GET /system-stats` - System statistics and performance

### **👤 User Management** 
- `POST /register` - Register new user with hashed password
- `POST /token` - Login and get JWT access token
- `GET /protected` - Test protected endpoint (requires JWT)

### **🔑 API Key Management**
- `POST /api-keys` - Create new API key (requires JWT auth)
- `GET /api-keys` - List user's API keys
- `DELETE /api-keys/{api_key}` - Delete API key

### **📊 Monitoring & Analytics**
- `GET /stats/{api_key}` - Get detailed API key usage statistics
- `GET /logs` - View request logs with filtering
- `POST /admin/reset-limits` - Reset rate limits (admin only)
- `GET /dashboard` - React dashboard interface

---

## 🧪 **Testing & Usage**

### **Quick Test with Demo API Key**
```bash
# Test rate limiting
curl -X POST http://localhost:8000/check-limit \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "demo123",
    "user_id": "test_user",
    "endpoint": "/api/login"
  }'

# Response example:
{
  "allowed": true,
  "remaining_quota": 99,
  "retry_after": 0,
  "message": "Request allowed",
  "endpoint": "/api/login"
}
```

### **Frontend Dashboard Testing**
1. 🌐 **Dashboard**: http://localhost:8000/dashboard
2. 🔑 **Test with multiple API keys**: demo123, test456, premium789
3. 📊 **View real-time statistics** and charts
4. 🧪 **Interactive API testing** with live responses

---

## 📈 **Implementation Status**

| Feature | Status | Implementation |
|---------|--------|----------------|
| **Fixed Window Rate Limiting** | ✅ Complete | `app/db_limiter.py` - Database-stored buckets |
| **Multi-API Key Support** | ✅ Complete | Database table with different limits |
| **JWT Authentication** | ✅ Complete | `app/db_auth.py` - Database user system |
| **React Dashboard** | ✅ Complete | `dashboard/src/` - Interactive frontend |
| **Database Integration** | ✅ Complete | SQLite/PostgreSQL with SQLAlchemy ORM |
| **User Registration** | ✅ Complete | Database users table with bcrypt |
| **Usage Statistics** | ✅ Complete | Database logging and metrics |
| **CORS Support** | ✅ Complete | Frontend-backend integration |
| **Health Monitoring** | ✅ Complete | System stats and uptime tracking |
| **Production Ready** | ✅ Complete | Persistent database storage |

---

## 🔧 **Configuration**

### **Rate Limiting Settings (Database Stored)**
```python
# API Keys stored in database table with custom limits
# Example database records:
# api_key="demo123"     → max_requests=100, window_seconds=60
# api_key="test456"     → max_requests=50,  window_seconds=60  
# api_key="premium789"  → max_requests=1000, window_seconds=60

# Rate limit buckets stored in database with automatic cleanup
# Users, logs, and statistics all persist in database tables
```

### **Environment Variables** (`.env`)
```bash
DEBUG=true
HOST=0.0.0.0
PORT=8000
DATABASE_URL=postgresql://user:pass@host/db
SECRET_KEY=your-super-secret-jwt-key
DEFAULT_RATE_LIMIT=100
ALLOWED_ORIGINS=http://localhost:3000
```

## � **Deployment & Production**

### **Frontend (Vercel)**
```bash
# Deploy React dashboard to Vercel
cd dashboard
npm run build
vercel --prod
```

### **Backend (Render)**
- ✅ **Automatic deployment** from GitHub
- ✅ **Environment variables** configured
- ✅ **Database connection** ready
- ✅ **CORS** configured for frontend

### **Database**
- 🔧 **Development**: SQLite (`rate_limiting.db`)
- 🌐 **Production**: PostgreSQL (Neon/Render)

---

## 🏗️ **Architecture & Algorithm Details**

### **Fixed Window Rate Limiting Algorithm**
```python
class RateLimitBucket:
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests      # e.g., 100
        self.window_seconds = window_seconds  # e.g., 60
        self.requests_count = 0
        self.window_start = time.time()
    
    def consume(self, tokens: int = 1) -> bool:
        self.reset_if_new_window()  # Reset if new window
        if self.requests_count + tokens <= self.max_requests:
            self.requests_count += tokens
            return True  # Allow request
        return False     # Deny request
```

### **System Architecture**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │───▶│   FastAPI       │───▶│   Database      │
│  (Dashboard)    │    │  Rate Limiter   │    │  (PostgreSQL)   │
│                 │    │                 │    │                 │
│ Multi-API Keys  │    │ Fixed Window    │    │ Users & Logs    │
│ Real-time UI    │    │ JWT Auth        │    │ Statistics      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        ▲                       ▲                       ▲
        │                       │                       │
    Vercel Deploy          Render Deploy           Neon Database
```

---

## 🎯 **How to Use**

### **1. Start Development Server (Database Version)**
```bash
# Backend (Database Version)
uvicorn app.main_db:app --reload --host 0.0.0.0 --port 8000

# Frontend (separate terminal)
cd dashboard && npm start
```

### **2. Access Services**
- 🎨 **Dashboard**: http://localhost:3000 (React dev)
- 📚 **API Docs**: http://localhost:8000/docs
- 🛡️ **Rate Limiter**: http://localhost:8000/check-limit

### **3. Production URLs**
- 🚀 **Live Frontend**: https://rate-limiting-service.vercel.app/
- 🔗 **Live Backend**: https://rate-limiting.onrender.com/
- 📚 **Live API Docs**: https://rate-limiting.onrender.com/docs

### **4. Integration Example**
```python
import requests

def check_rate_limit(api_key, user_id, endpoint):
    response = requests.post("http://localhost:8000/check-limit", json={
        "api_key": api_key,
        "user_id": user_id, 
        "endpoint": endpoint
    })
    
    data = response.json()
    if data["allowed"]:
        print(f"✅ Request allowed. {data['remaining_quota']} requests left")
        return True
    else:
        print(f"❌ Rate limit exceeded. Retry after {data['retry_after']} seconds")
        return False

# Usage
if check_rate_limit("demo123", "user_123", "/api/data"):
    # Proceed with your API call
    make_api_call()
```

---

## 📞 **Support & Documentation**

### **🌐 Production URLs:**
- **🚀 Live Frontend Dashboard**: https://rate-limiting-service.vercel.app/
- **🔗 Live Backend API**: https://rate-limiting.onrender.com/
- **📚 Live API Documentation**: https://rate-limiting.onrender.com/docs

### **🛠️ Development URLs:**
- **🎨 React Dashboard**: http://localhost:3000 (development)
- **📚 API Documentation**: http://localhost:8000/docs
- **🛡️ Rate Limiting Endpoint**: http://localhost:8000/check-limit

### **⚙️ Configuration:**
- **Configuration**: `config/settings.py` & `.env`
- **🗃️ Database Scripts**: `scripts/` folder

---

**🎉 Your Rate Limiting as a Service is live and production-ready!**  
**🚀 Frontend:** https://rate-limiting-service.vercel.app/  
**🔗 Backend:** https://rate-limiting.onrender.com/
