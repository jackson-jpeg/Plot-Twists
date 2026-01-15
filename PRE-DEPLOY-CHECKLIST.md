# ✅ Pre-Deployment Checklist

Use this checklist before pushing to Git and deploying to Vercel.

## 🔒 Security

- [x] ✅ `.env` file is gitignored (verified)
- [x] ✅ No API keys in source code (verified)
- [x] ✅ Server.ts uses environment variables only (verified)
- [x] ✅ `.env.example` has placeholder values only (verified)

## 🎨 Branding

- [x] ✅ Custom favicon created (theater masks icon)
- [x] ✅ Apple touch icon created
- [x] ✅ No Next.js branding in UI
- [x] ✅ Metadata updated with proper title and description

## 📦 Code Quality

- [x] ✅ All features tested and working
- [x] ✅ Mobile responsive
- [x] ✅ Error handling in place
- [x] ✅ Toast notifications working
- [x] ✅ Confetti animations working
- [x] ✅ Script sharing working

## 🚀 Vercel-Specific

When deploying to Vercel, you'll need to:

### 1. Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

```
ANTHROPIC_API_KEY=your_actual_api_key_here
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_WS_URL=wss://your-app.vercel.app
```

### 2. Build Settings

Vercel will auto-detect Next.js. Default settings should work:
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Development Command**: `npm run dev`

### 3. After First Deploy

1. Get your Vercel URL (e.g., `your-app.vercel.app`)
2. Update environment variables with the actual URL:
   - `NEXT_PUBLIC_APP_URL=https://your-app.vercel.app`
   - `NEXT_PUBLIC_WS_URL=wss://your-app.vercel.app`
3. Redeploy (Vercel → Deployments → Redeploy)

### 4. Custom Domain (Optional)

If you want a custom domain:
1. Vercel Dashboard → Settings → Domains
2. Add your domain
3. Update DNS records as instructed
4. Update environment variables with your custom domain

## 🧪 Final Testing Checklist

After deployment, test these:

- [ ] Landing page loads
- [ ] Can create a room (host)
- [ ] Can join a room with code
- [ ] Solo mode works
- [ ] Head-to-Head mode works (2 players)
- [ ] Ensemble mode works (3-6 players)
- [ ] Green Room trivia appears
- [ ] Script generation works
- [ ] Performance/teleprompter works
- [ ] Mood indicators show
- [ ] Voting works
- [ ] Results display with confetti
- [ ] Can download/copy script
- [ ] Onboarding modal works
- [ ] Mobile responsive on phone
- [ ] WebSocket connections stable

## 📱 Device Testing

Test on:
- [ ] Desktop Chrome
- [ ] Desktop Safari
- [ ] Desktop Firefox
- [ ] iPhone Safari
- [ ] Android Chrome
- [ ] iPad

## 🎉 Ready to Push!

If all checks pass above, you're ready to:

1. **Initialize Git** (with your Mac app)
2. **Make initial commit**
3. **Push to GitHub**
4. **Deploy to Vercel**
5. **Add environment variables in Vercel**
6. **Test the deployed version**

---

**Current Status**: ✅ ALL SECURITY CHECKS PASSED - Ready to push!
