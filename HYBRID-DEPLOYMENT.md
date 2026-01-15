# 🚀 Hybrid Deployment Guide - Vercel + Railway

Your Plot Twists app uses a **hybrid architecture**:
- **Frontend**: Vercel (Next.js pages, static assets)
- **Backend**: Railway (WebSocket server, game logic, AI)

## 📋 Step 1: Deploy Backend to Railway

### 1.1 Create Railway Account
1. Go to [railway.app](https://railway.app/)
2. Sign up with GitHub (easiest)
3. Verify your email

### 1.2 Deploy Your Backend
1. **Click "New Project"** in Railway dashboard
2. **Select "Deploy from GitHub repo"**
3. **Choose your repo**: `jackson-jpeg/Plot-Twists`
4. Railway will automatically detect Node.js and start building

### 1.3 Add Environment Variables
In Railway dashboard → Your Project → Variables tab, add:

```
ANTHROPIC_API_KEY=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
NODE_ENV=production
PORT=3000
```

### 1.4 Get Your Railway URL
1. Go to **Settings** tab in Railway
2. Click **"Generate Domain"** (under Networking)
3. Copy your domain (e.g., `your-app.up.railway.app`)

**IMPORTANT:** Save this URL - you'll need it for Step 2!

---

## 📋 Step 2: Update Vercel Frontend

### 2.1 Add Environment Variables to Vercel
Go to Vercel Dashboard → Your Project → Settings → Environment Variables

**Add these variables:**

```
NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app
NEXT_PUBLIC_WS_URL=https://your-app.up.railway.app
```

⚠️ **Replace `your-app.up.railway.app` with your actual Railway domain from Step 1.4**

### 2.2 Redeploy Vercel
1. Go to **Deployments** tab
2. Click **Redeploy** on latest deployment
3. Make sure **"Use existing Build Cache"** is **UNCHECKED**

---

## ✅ Step 3: Test Your App

### 3.1 Test Backend
Visit your Railway URL: `https://your-app.up.railway.app`

You should see the Plot Twists home page. ✅

### 3.2 Test Frontend
Visit your Vercel URL: `https://your-vercel-app.vercel.app`

You should see the same home page. ✅

### 3.3 Test WebSocket Connection
1. Go to Vercel URL
2. Click **"Host a Game"**
3. If a room code appears → **WebSockets working!** 🎉
4. If you get connection errors → Check Step 2.1 again

---

## 🔧 Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    USER'S BROWSER                    │
│  (visits https://your-app.vercel.app)               │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ Static assets & pages
                   │
    ┌──────────────▼──────────────┐
    │         VERCEL               │
    │  (Frontend only)             │
    │  - Next.js pages             │
    │  - React components          │
    │  - Static files              │
    └──────────────┬──────────────┘
                   │
                   │ WebSocket connections
                   │ (wss://your-app.up.railway.app)
                   │
    ┌──────────────▼──────────────┐
    │         RAILWAY              │
    │  (Backend server)            │
    │  - server.ts                 │
    │  - Socket.io                 │
    │  - Game logic                │
    │  - Anthropic AI              │
    └──────────────────────────────┘
```

---

## 🐛 Troubleshooting

### Issue: "Connection Failed" errors
**Solution:**
1. Check Railway logs: Dashboard → Deployments → Logs
2. Verify `NEXT_PUBLIC_WS_URL` in Vercel matches your Railway domain
3. Make sure Railway domain uses `https://` (NOT `wss://`)

### Issue: Room creation fails
**Solution:**
1. Check Railway environment variables have `ANTHROPIC_API_KEY`
2. Check Railway logs for API errors
3. Verify your Anthropic API key is valid

### Issue: Frontend shows old version
**Solution:**
1. Clear Vercel build cache (redeploy without cache)
2. Hard refresh browser (Cmd+Shift+R on Mac)

### Issue: Railway build fails
**Solution:**
1. Check Railway logs for specific error
2. Make sure `package.json` has all dependencies
3. Verify `npm run start` works locally with `NODE_ENV=production`

---

## 💰 Cost Breakdown

### Railway (Backend)
- **Free tier**: $5 credit/month
- **Usage-based**: ~$0.000463/minute running
- **Estimated**: $10-20/month for moderate traffic

### Vercel (Frontend)
- **Hobby tier**: FREE
- Unlimited bandwidth
- 100GB bandwidth/month

**Total estimated monthly cost: $10-20** (mostly Railway backend)

---

## 🎉 You're Live!

Once both are deployed and connected, your Plot Twists app will:
- ✅ Serve pages fast via Vercel CDN
- ✅ Handle real-time gameplay via Railway WebSockets
- ✅ Generate AI scripts via Railway backend
- ✅ Scale automatically on both platforms

Questions? Check the logs:
- **Vercel**: Dashboard → Deployments → Build logs
- **Railway**: Dashboard → Deployments → Logs

---

Made with ❤️ for theater kids everywhere 🎭
