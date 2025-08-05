#!/usr/bin/env python3
"""
Simple HTTP server to serve the rate limiting test website
This simulates a real website that uses IP-based rate limiting
"""

import http.server
import socketserver
import json
import urllib.parse
from urllib.parse import urlparse, parse_qs
import requests
import os

# Configuration
PORT = 5000
RATE_LIMIT_SERVICE = "http://localhost:8000"
API_KEY = "rl_sjTMNROLZd1YaMHvq1QL6k7374Lj0ow8xRCT19XcWss"

class RateLimitedHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Set the directory to serve files from
        super().__init__(*args, directory=os.path.dirname(os.path.abspath(__file__)), **kwargs)
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        """Handle POST requests (contact form submission)"""
        if self.path == '/contact':
            self.handle_contact_form()
        else:
            self.send_error(404, "Not Found")

    def handle_contact_form(self):
        """Handle contact form submission with rate limiting"""
        try:
            # Get client IP
            client_ip = self.get_client_ip()
            
            # Check rate limit first
            rate_limit_result = self.check_rate_limit('/contact', client_ip)
            
            if not rate_limit_result.get('allowed', True):
                # Rate limit exceeded
                self.send_json_response({
                    'success': False,
                    'error': rate_limit_result.get('error', 'Rate limit exceeded'),
                    'retry_after': rate_limit_result.get('retry_after', 60)
                }, status_code=429)
                return
            
            # Read form data
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            # Parse form data (if it's form-encoded) or JSON
            try:
                # Try JSON first
                form_data = json.loads(post_data.decode('utf-8'))
            except json.JSONDecodeError:
                # Try form-encoded
                parsed_data = urllib.parse.parse_qs(post_data.decode('utf-8'))
                form_data = {k: v[0] if v else '' for k, v in parsed_data.items()}
            
            # Simulate processing the contact form
            print(f"📩 Contact form submitted from IP {client_ip}:")
            print(f"   Name: {form_data.get('name', 'N/A')}")
            print(f"   Email: {form_data.get('email', 'N/A')}")
            print(f"   Subject: {form_data.get('subject', 'N/A')}")
            print(f"   Message: {form_data.get('message', 'N/A')[:50]}...")
            
            # Send success response
            self.send_json_response({
                'success': True,
                'message': 'Contact form submitted successfully! We\'ll get back to you soon.',
                'submitted_at': self.get_current_timestamp()
            })
            
        except Exception as e:
            print(f"❌ Error handling contact form: {e}")
            self.send_json_response({
                'success': False,
                'error': f'Server error: {str(e)}'
            }, status_code=500)

    def check_rate_limit(self, endpoint, client_ip):
        """Check rate limit with the rate limiting service"""
        try:
            response = requests.post(
                f"{RATE_LIMIT_SERVICE}/check-limit-ip",
                json={
                    'api_key': API_KEY,
                    'endpoint': endpoint
                },
                headers={
                    'X-Real-IP': client_ip,
                    'X-Forwarded-For': client_ip
                },
                timeout=5
            )
            
            if response.status_code == 429:
                return {
                    'allowed': False,
                    'error': response.json().get('error', 'Rate limit exceeded'),
                    'retry_after': response.json().get('retry_after', 60)
                }
            
            return response.json()
            
        except requests.RequestException as e:
            print(f"⚠️ Rate limit service unavailable: {e}")
            # Fail-open: allow the request if rate limit service is down
            return {'allowed': True, 'error': 'Rate limit service unavailable'}

    def get_client_ip(self):
        """Get the client's IP address"""
        # Check various headers for the real IP (useful with proxies/load balancers)
        forwarded_for = self.headers.get('X-Forwarded-For')
        if forwarded_for:
            return forwarded_for.split(',')[0].strip()
        
        real_ip = self.headers.get('X-Real-IP')
        if real_ip:
            return real_ip
        
        # Fallback to direct connection IP
        return self.client_address[0]

    def send_json_response(self, data, status_code=200):
        """Send a JSON response with CORS headers"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        response_json = json.dumps(data, indent=2)
        self.wfile.write(response_json.encode('utf-8'))

    def get_current_timestamp(self):
        """Get current timestamp"""
        from datetime import datetime
        return datetime.now().isoformat()

    def log_message(self, format, *args):
        """Override to add timestamp to logs"""
        from datetime import datetime
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        print(f"[{timestamp}] {format % args}")

def main():
    """Start the test web server"""
    import socket
    
    # Get local IP address
    try:
        # Connect to a remote address to get local IP
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            local_ip = s.getsockname()[0]
    except Exception:
        local_ip = "Unable to detect"
    
    print("🌐 Starting Rate Limiting Test Website...")
    print(f"📍 Local Access: http://localhost:{PORT}")
    print(f"🌍 Network Access: http://{local_ip}:{PORT}")
    print(f"🔗 Rate Limit Service: {RATE_LIMIT_SERVICE}")
    print(f"🔑 API Key: {API_KEY[:20]}...")
    print("\n📝 Instructions:")
    print("1. Make sure your FastAPI rate limiting service is running on port 8000")
    print(f"2. Local access: Open http://localhost:{PORT} in your browser")
    print(f"3. Network access: Open http://{local_ip}:{PORT} from other devices")
    print("4. Try submitting the contact form multiple times quickly")
    print("5. Watch the rate limiting in action!")
    print("\n" + "="*60)

    try:
        # Bind to all interfaces (0.0.0.0) to allow network access
        with socketserver.TCPServer(("0.0.0.0", PORT), RateLimitedHandler) as httpd:
            print(f"✅ Server running on all interfaces:")
            print(f"   📱 Localhost: http://localhost:{PORT}")
            print(f"   🌐 Network: http://{local_ip}:{PORT}")
            print(f"   🔢 All IPs: http://0.0.0.0:{PORT}")
            print("\nPress Ctrl+C to stop the server")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")

if __name__ == "__main__":
    main()
