# Rate Limiting Dashboard - Vercel Deployment

## 🚀 Quick Deploy to Vercel

### Method 1: Direct Deploy (Recommended)
1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "New Project"
3. Import from GitHub: `GNANESWARARAO-POLAKI/rate-limiting`
4. **Root Directory**: Set to `dashboard`
5. **Framework Preset**: React
6. **Build Command**: `npm run build`
7. **Output Directory**: `build`
8. Click "Deploy"

### Method 2: Using Vercel CLI
```bash
cd dashboard
npm install -g vercel
vercel --prod
```

## 🔧 Environment Variables
Set these in Vercel Dashboard:
- `REACT_APP_API_URL`: `https://rate-limiting.onrender.com`

## 📁 Project Structure
```
dashboard/
├── src/
│   ├── components/
│   ├── utils/
│   └── App.js
├── public/
├── package.json
├── vercel.json
└── README.md
```

## 🌐 Expected URL
Your dashboard will be available at:
`https://rate-limiting-dashboard-[random].vercel.app`
