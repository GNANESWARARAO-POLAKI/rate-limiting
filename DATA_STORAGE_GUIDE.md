# 📊 **Data Storage Locations in Rate Limiting System**

## 🔧 **Backend Data Storage (FastAPI)**

### 1. **In-Memory Python Dictionaries** (Current Implementation)
**Location**: `app/auth.py` and `app/limiter.py`

#### **User Data Storage:**
```python
# File: app/auth.py, Line ~23
users_db = {}  # Stores all registered users
```
**Stores:**
- User ID, Name, Email, Hashed Password
- Registration timestamp, Active status
- **Example**: `users_db["user_abc123"] = {...}`

#### **API Keys Storage:**
```python
# File: app/auth.py, Line ~24  
api_keys_db = {
    "demo123": {...},
    "demo_high": {...}
}
```
**Stores:**
- API Key → User mapping
- Rate limit settings (max_requests, window_seconds)
- Creation timestamp, Active status

#### **Rate Limiting Data:**
```python
# File: app/limiter.py, Line ~12
rate_limits_store = {}  # Current rate limit states
usage_logs = []        # Request history logs
```
**Stores:**
- Current request counts per API key
- Time windows and reset timestamps
- Request usage statistics

---

## 🌐 **Frontend Data Storage (React)**

### 1. **Browser localStorage** (Persistent)
**Location**: Browser's localStorage (survives page refresh)

#### **Session Data:**
```javascript
// Key: 'rateLimit_session'
// File: src/utils/sessionManager.js
{
  "user": {
    "user_id": "user_abc123",
    "name": "John Doe", 
    "email": "john@example.com",
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "api_key": "rl_GLzV1yXfR1Yp-80--i8vV..."
  },
  "timestamp": 1691155200000,
  "expiresAt": 1691241600000
}
```

### 2. **React State** (Temporary - lost on refresh)
**Location**: Component memory (useState, useEffect)

#### **App State:**
```javascript
// File: src/App.js
const [user, setUser] = useState(null);
const [isLoggedIn, setIsLoggedIn] = useState(false);
```

#### **Component States:**
- Form data (login/register forms)
- Loading states, Error messages
- API response data, Statistics

---

## 🔍 **Data Storage Breakdown by Type**

### **👤 User Authentication Data**
| Data Type | Backend Location | Frontend Location | Persistence |
|-----------|-----------------|-------------------|-------------|
| User Profile | `users_db{}` (RAM) | localStorage | Until server restart |
| Session Token | Generated in memory | localStorage | 24 hours |
| Login State | - | React state | Until page refresh |

### **🔑 API Key Data**  
| Data Type | Backend Location | Frontend Location | Persistence |
|-----------|-----------------|-------------------|-------------|
| API Keys | `api_keys_db{}` (RAM) | localStorage (user's key only) | Until server restart |
| Key Settings | `api_keys_db{}` (RAM) | - | Until server restart |

### **📊 Rate Limiting Data**
| Data Type | Backend Location | Frontend Location | Persistence |
|-----------|-----------------|-------------------|-------------|
| Request Counts | `rate_limits_store{}` (RAM) | - | Until server restart |
| Usage Stats | `usage_logs[]` (RAM) | Dashboard display | Until server restart |
| Time Windows | `rate_limits_store{}` (RAM) | - | Until server restart |

---

## ⚠️ **Current Limitations**

### **🔥 Data Loss Scenarios:**
1. **Server Restart** → All users, API keys, and rate limits are lost
2. **Browser Clear** → User sessions are lost  
3. **Page Refresh** → Temporary React state is lost (but session persists)

### **📈 Production Considerations:**
Currently using **in-memory storage** which means:
- ❌ Data doesn't survive server restarts
- ❌ No data backup/recovery  
- ❌ Not scalable across multiple servers
- ❌ No data persistence between deployments

---

## 🎯 **Recommended Upgrades for Production**

### **Backend Storage:**
```python
# Replace in-memory dictionaries with:
DATABASE_URL = "postgresql://user:pass@localhost/ratelimit_db"
# or
REDIS_URL = "redis://localhost:6379"
```

### **Suggested Architecture:**
1. **PostgreSQL** → Users, API keys, settings
2. **Redis** → Rate limiting counters, sessions  
3. **JWT tokens** → Stateless authentication

---

## 🔍 **How to View Current Data**

### **Backend Data (Terminal):**
```bash
# View users
curl http://localhost:8000/users  # If endpoint exists

# View API keys  
curl http://localhost:8000/api-keys
```

### **Frontend Data (Browser DevTools):**
```javascript
// Open browser console (F12)
localStorage.getItem('rateLimit_session')
```

### **Rate Limiting Data:**
```bash
# View statistics
curl http://localhost:8000/stats/YOUR_API_KEY
curl http://localhost:8000/system-stats
```

---

## 📝 **Summary**

**Current State**: All data is stored in **memory** (RAM) and **browser localStorage**
**Durability**: Data survives page refresh but NOT server restart
**Scalability**: Single server only, not production-ready for scale
**Security**: Basic - suitable for development/testing

Your system is perfect for **development and testing** but would need database integration for **production use**!
