# IP-Based Rate Limiting Test Website

This is a complete demonstration of IP-based rate limiting for anonymous users. The system protects your website from abuse by anonymous users while allowing authenticated users to have higher limits.

## 🚀 Quick Start

### Prerequisites

1. **Rate Limiting Service**: Make sure your FastAPI rate limiting service is running on `http://localhost:8000`
2. **Python**: Ensure Python 3.6+ is installed
3. **Requests Library**: Install with `pip install requests`

### Running the Test

1. **Start the Rate Limiting Service** (in the main directory):

   ```bash
   cd "d:\Rompit Technologies\rate-limiting"
   python -m app.main_db
   ```

2. **Start the Test Website**:

   ```bash
   cd "d:\Rompit Technologies\rate-limiting\test-website"
   start.bat
   ```

   Or manually:

   ```bash
   python server.py
   ```

3. **Open the Website**:
   Visit `http://localhost:3001` in your browser

## 🧪 Testing the Rate Limiting

### What to Try:

1. **Fill out the contact form** and submit it
2. **Submit it again quickly** multiple times
3. **Watch the rate limiting** kick in after a few requests
4. **Check the statistics** on the page
5. **Wait for the reset time** and try again

### Expected Behavior:

- ✅ First few requests should succeed
- ⛔ After the limit is reached, you'll get "429 Too Many Requests"
- 📊 Statistics will update showing successful vs rate-limited requests
- ⏰ Rate limits reset after the time window

## 🔧 How It Works

### IP-Based Rate Limiting Flow:

```
User's Browser → Test Website → Rate Limiting Service
                  (server.py)      (main_db.py)
                       ↓               ↓
                  1. Extract IP    2. Check /check-limit-ip
                  2. Forward to    3. Use IP as identifier
                     service       4. Apply rate limits
                       ↓               ↓
                  3. Handle        5. Return allowed/denied
                     response
```

### Key Components:

1. **HTML/JavaScript Frontend** (`index.html`):

   - Professional contact form
   - Real-time statistics tracking
   - Visual feedback for rate limiting
   - Automatic IP detection display

2. **Python Test Server** (`server.py`):

   - Simulates a real website
   - Extracts client IP from requests
   - Forwards rate limit checks to the service
   - Handles CORS for browser requests

3. **Rate Limiting Service** (`main_db.py`):
   - `/check-limit-ip` endpoint
   - Uses IP address as user identifier
   - Database-persistent rate limiting
   - Configurable limits per endpoint

## 📊 API Integration Examples

### Direct API Call (JavaScript):

```javascript
const response = await fetch("http://localhost:8000/check-limit-ip", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Real-IP": userIP, // Forward user's IP
  },
  body: JSON.stringify({
    api_key: "your_api_key",
    endpoint: "/contact",
  }),
});
```

### Server-Side Integration (Node.js):

```javascript
app.post("/contact", async (req, res) => {
  const clientIP = req.ip || req.connection.remoteAddress;

  // Check rate limit
  const rateCheck = await fetch("http://localhost:8000/check-limit-ip", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Real-IP": clientIP,
    },
    body: JSON.stringify({
      api_key: process.env.RATE_LIMIT_API_KEY,
      endpoint: "/contact",
    }),
  });

  if (rateCheck.status === 429) {
    return res.status(429).json({ error: "Rate limit exceeded" });
  }

  // Process the contact form...
});
```

### PHP Integration:

```php
<?php
function checkRateLimit($endpoint, $clientIP, $apiKey) {
    $data = json_encode([
        'api_key' => $apiKey,
        'endpoint' => $endpoint
    ]);

    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => [
                'Content-Type: application/json',
                'X-Real-IP: ' . $clientIP
            ],
            'content' => $data
        ]
    ]);

    $response = file_get_contents('http://localhost:8000/check-limit-ip', false, $context);
    return json_decode($response, true);
}

// Usage
$clientIP = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'];
$result = checkRateLimit('/contact', $clientIP, 'your_api_key');

if (!$result['allowed']) {
    http_response_code(429);
    echo json_encode(['error' => 'Rate limit exceeded']);
    exit;
}
?>
```

## ⚙️ Configuration

### Rate Limiting Service Configuration:

- **API Key**: `rl_sjTMNROLZd1YaMHvq1QL6k7374Lj0ow8xRCT19XcWss` (demo key)
- **Default Limits**: Check your rate limiting service configuration
- **Database**: Persistent SQLite/PostgreSQL storage

### Test Website Configuration:

Edit `server.py` to change:

- **Port**: Change `PORT = 3001`
- **Rate Limit Service URL**: Change `RATE_LIMIT_SERVICE`
- **API Key**: Change `API_KEY`

## 🛠️ Troubleshooting

### Common Issues:

1. **"Connection refused" errors**:

   - Make sure the rate limiting service is running on port 8000
   - Check if the service is accessible: `http://localhost:8000/health`

2. **CORS errors in browser**:

   - The test server handles CORS automatically
   - Make sure you're accessing via `http://localhost:3001`

3. **Rate limits not working**:

   - Check the API key is correct
   - Verify the rate limiting service has proper database access
   - Check server logs for errors

4. **IP detection issues**:
   - Behind a proxy? Check X-Forwarded-For headers
   - Using localhost? IP might show as 127.0.0.1

### Debug Mode:

The Python server shows detailed logs:

```
📩 Contact form submitted from IP 127.0.0.1:
   Name: John Doe
   Email: john@example.com
   Subject: Test Message
   Message: This is a test message...
```

## 🎯 Production Deployment

### For Real Websites:

1. **Replace the test server** with your actual web application
2. **Add IP-based rate limiting** to your existing endpoints
3. **Configure proper API keys** (not the demo key)
4. **Set appropriate rate limits** for your use case
5. **Handle proxy/CDN headers** correctly (X-Forwarded-For, etc.)

### Security Considerations:

- ✅ Always validate and sanitize the forwarded IP headers
- ✅ Use HTTPS in production
- ✅ Store API keys securely (environment variables)
- ✅ Monitor for abuse patterns
- ✅ Consider geographic rate limiting for global applications

## 📈 Monitoring

The test website shows real-time statistics:

- **Total Requests**: All attempts made
- **Successful Requests**: Requests that passed rate limiting
- **Rate Limited**: Requests that were blocked
- **Current IP**: Your detected IP address

For production, integrate with your monitoring tools to track:

- Rate limiting effectiveness
- Top blocked IPs
- Abuse patterns
- System performance

---

## 📞 Support

If you encounter issues:

1. Check the server logs for detailed error messages
2. Verify your rate limiting service is properly configured
3. Test the `/health` endpoint: `http://localhost:8000/health`
4. Ensure your database is accessible and initialized

Happy rate limiting! 🚀
