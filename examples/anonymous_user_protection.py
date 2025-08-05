"""
Example: How to protect your website from anonymous users using IP-based rate limiting

This shows how a website developer would integrate rate limiting for visitors
who are NOT logged in to their website.
"""

import requests
import time

# Your rate limiting service
RATE_LIMIT_SERVICE = "http://localhost:8000"
YOUR_API_KEY = "demo123"  # Replace with your actual API key

def check_anonymous_user_rate_limit(endpoint_name="/api/public-data"):
    """
    Check if an anonymous user (identified by IP) can make a request
    
    Args:
        endpoint_name: The endpoint the user is trying to access
    
    Returns:
        dict: Rate limit result
    """
    try:
        response = requests.post(
            f"{RATE_LIMIT_SERVICE}/check-limit-ip",
            json={
                "api_key": YOUR_API_KEY,
                "endpoint": endpoint_name
            },
            timeout=5
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Rate limit check failed: {response.status_code} - {response.text}")
            return {"allowed": True}  # Fail open - allow request if service is down
            
    except Exception as e:
        print(f"Error checking rate limit: {e}")
        return {"allowed": True}  # Fail open

def simulate_website_requests():
    """
    Simulate how your website would handle anonymous user requests
    """
    print("🌐 Simulating Anonymous User Protection")
    print("=" * 50)
    
    for i in range(15):  # Try 15 requests (demo limit is 10 per minute)
        print(f"\n📝 Request #{i+1}")
        
        # Check rate limit before processing the request
        rate_check = check_anonymous_user_rate_limit("/api/public-data")
        
        if rate_check["allowed"]:
            print(f"✅ Request allowed - Remaining: {rate_check.get('remaining_quota', 'unknown')}")
            print(f"   Client IP: {rate_check.get('client_ip', 'unknown')}")
            
            # Your actual website logic would go here
            print("   Processing user request...")
            
        else:
            print(f"❌ Request blocked - Rate limit exceeded!")
            print(f"   Client IP: {rate_check.get('client_ip', 'unknown')}")
            print(f"   Retry after: {rate_check.get('retry_after', 0)} seconds")
            
            # Return rate limit error to the user
            print("   Showing 'Too Many Requests' page to user")
            
        time.sleep(1)  # Small delay between requests

if __name__ == "__main__":
    print("🔒 Anonymous User Rate Limiting Demo")
    print("This simulates protecting your website from anonymous users")
    print("Each request is identified by the client's IP address")
    print("\nStarting simulation...")
    
    simulate_website_requests()
    
    print("\n" + "=" * 50)
    print("💡 Integration Tips:")
    print("1. Call /check-limit-ip before processing anonymous user requests")
    print("2. Use different endpoint names for different parts of your site")
    print("3. Show friendly rate limit messages to users")
    print("4. Consider implementing different limits for different IP ranges")
