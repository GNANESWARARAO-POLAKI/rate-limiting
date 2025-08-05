# Rate Limiting Dashboard - React Frontend

A React-based dashboard for monitoring and managing the rate limiting service.

## Features
- Real-time rate limit monitoring
- API key management
- User dashboard
- System statistics
- IP-based rate limiting demo

## API Endpoints
The frontend connects to your FastAPI backend deployed on Render:
- Production API: `https://rate-limiting-api.onrender.com`
- Health Check: `https://rate-limiting-api.onrender.com/health`
- API Docs: `https://rate-limiting-api.onrender.com/docs`

## Environment Variables
```env
REACT_APP_API_URL=https://rate-limiting-api.onrender.com
REACT_APP_API_KEY=your-demo-api-key
```

## Local Development
```bash
npm install
npm start
```

## Deployment
This project is optimized for Vercel deployment with automatic builds from GitHub.
