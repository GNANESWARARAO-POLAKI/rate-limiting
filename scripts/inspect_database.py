"""
Database Inspection Script to check for issues with the rate limiting tables
"""
import sys
import os

# Add the parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import get_db_session
from app.database_models import DBRateLimitState, DBRateLimitLog, DBAPIKey, DBUser

def inspect_database():
    """Inspect database tables related to rate limiting"""
    with get_db_session() as db:
        # Check if DBRateLimitState table exists and has the expected columns
        try:
            rate_limit_states = db.query(DBRateLimitState).all()
            print(f"✅ Found {len(rate_limit_states)} rate limit state entries")
            
            if rate_limit_states:
                state = rate_limit_states[0]
                print("Sample rate limit state:")
                print(f"  ID: {state.id}")
                print(f"  API Key: {state.api_key}")
                print(f"  User ID: {state.user_id}")
                print(f"  Current Requests: {state.current_requests}")
                print(f"  Window Start: {state.window_start}")
                print(f"  Last Request: {state.last_request}")
        except Exception as e:
            print(f"❌ Error accessing rate limit states: {str(e)}")
        
        # Check if DBRateLimitLog table exists and has the expected columns
        try:
            rate_limit_logs = db.query(DBRateLimitLog).limit(5).all()
            print(f"✅ Found {len(rate_limit_logs)} rate limit log entries (showing max 5)")
            
            for i, log in enumerate(rate_limit_logs):
                print(f"Log entry {i+1}:")
                print(f"  ID: {log.id}")
                print(f"  API Key: {log.api_key}")
                print(f"  User ID: {log.user_id}")
                print(f"  Endpoint: {log.endpoint}")
                print(f"  Method: {log.method}")
                print(f"  Timestamp: {log.timestamp}")
        except Exception as e:
            print(f"❌ Error accessing rate limit logs: {str(e)}")
        
        # Check API keys
        try:
            api_keys = db.query(DBAPIKey).all()
            print(f"✅ Found {len(api_keys)} API keys")
        except Exception as e:
            print(f"❌ Error accessing API keys: {str(e)}")
        
        # Check users
        try:
            users = db.query(DBUser).all()
            print(f"✅ Found {len(users)} users")
        except Exception as e:
            print(f"❌ Error accessing users: {str(e)}")

if __name__ == "__main__":
    inspect_database()
