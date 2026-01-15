# 🚀 Deployment Guide - Plot Twists

This guide covers deploying Plot Twists to various hosting platforms.

## 📋 Prerequisites

Before deploying, ensure you have:

1. **Anthropic API Key**: Get one from [Anthropic Console](https://console.anthropic.com/)
2. **Environment Variables**: Set up based on `.env.example`
3. **Node.js 18+**: Required for building and running the app

## 🔧 Environment Setup

### Required Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Optional (with sensible defaults)
PORT=3000
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_WS_URL=wss://your-domain.com
```

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

## 🌐 Deployment Options

### Option 1: Vercel (Recommended for Next.js)

Plot Twists uses Next.js and works great on Vercel!

#### Steps:

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin your-repo-url
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com/)
   - Click "Import Project"
   - Select your GitHub repository
   - Configure project:
     - Framework Preset: Next.js
     - Build Command: `npm run build`
     - Output Directory: `.next`

3. **Add Environment Variables**
   In Vercel Dashboard → Settings → Environment Variables, add:
   ```
   ANTHROPIC_API_KEY=your_key_here
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   NEXT_PUBLIC_WS_URL=wss://your-app.vercel.app
   ```

4. **Deploy**
   - Vercel will automatically deploy
   - Every push to `main` triggers a new deployment

#### Important Notes:
- WebSocket connections work automatically on Vercel
- Make sure to update `NEXT_PUBLIC_WS_URL` with your Vercel domain
- SSL/TLS is handled automatically

### Option 2: Railway

Railway is great for full-stack apps with WebSockets.

#### Steps:

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and Initialize**
   ```bash
   railway login
   railway init
   ```

3. **Add Environment Variables**
   ```bash
   railway variables set ANTHROPIC_API_KEY=your_key_here
   railway variables set NODE_ENV=production
   ```

4. **Deploy**
   ```bash
   railway up
   ```

5. **Configure Domain**
   - Go to Railway Dashboard
   - Click "Settings" → "Generate Domain"
   - Update `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_WS_URL` with your domain

### Option 3: Docker + Any Cloud Provider

Deploy using Docker to AWS, Google Cloud, DigitalOcean, etc.

#### Create Dockerfile:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
ENV DOCKER 1

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/server.ts ./

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### Build and Deploy:

```bash
# Build Docker image
docker build -t plot-twists .

# Run locally to test
docker run -p 3000:3000 -e ANTHROPIC_API_KEY=your_key plot-twists

# Push to your registry and deploy
docker tag plot-twists your-registry/plot-twists:latest
docker push your-registry/plot-twists:latest
```

### Option 4: Traditional VPS (DigitalOcean, AWS EC2, etc.)

Deploy to any VPS with Node.js support.

#### Setup Steps:

1. **SSH into your server**
   ```bash
   ssh user@your-server-ip
   ```

2. **Install Node.js 18+**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Clone and Setup**
   ```bash
   git clone your-repo-url
   cd plot-twists
   npm install
   ```

4. **Create .env file**
   ```bash
   nano .env
   # Add your environment variables
   ```

5. **Build the app**
   ```bash
   npm run build
   ```

6. **Install PM2 (Process Manager)**
   ```bash
   npm install -g pm2
   ```

7. **Start with PM2**
   ```bash
   pm2 start npm --name "plot-twists" -- start
   pm2 save
   pm2 startup
   ```

8. **Setup Nginx (Reverse Proxy)**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       # WebSocket support
       location /socket.io/ {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
       }
   }
   ```

9. **Setup SSL with Let's Encrypt**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## 🔒 Security Checklist

Before going to production:

- [ ] Never commit `.env` file (add to `.gitignore`)
- [ ] Use HTTPS/WSS in production
- [ ] Set `NODE_ENV=production`
- [ ] Rotate API keys regularly
- [ ] Enable rate limiting
- [ ] Monitor API usage
- [ ] Set up error tracking
- [ ] Configure CORS properly
- [ ] Use security headers (already configured in `next.config.js`)

## 📊 Monitoring & Analytics

### Recommended Services:

1. **Error Tracking**
   - Sentry
   - Rollbar
   - LogRocket

2. **Analytics**
   - Vercel Analytics
   - Google Analytics
   - Plausible

3. **Performance**
   - Vercel Speed Insights
   - Lighthouse CI

## 🔄 CI/CD

### GitHub Actions Example:

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm test
```

## 🆘 Troubleshooting

### WebSocket Connection Issues

1. **Check WebSocket URL**: Ensure `NEXT_PUBLIC_WS_URL` uses `wss://` (not `ws://`) in production
2. **Proxy Configuration**: Make sure your reverse proxy supports WebSocket upgrades
3. **Firewall**: Check that WebSocket ports are open

### Build Failures

1. **Memory Issues**: Increase Node.js memory: `NODE_OPTIONS="--max-old-space-size=4096" npm run build`
2. **TypeScript Errors**: Run `npm run type-check` to see all errors
3. **Missing Dependencies**: Delete `node_modules` and `package-lock.json`, then `npm install`

### API Rate Limits

1. Monitor your Anthropic API usage in the [console](https://console.anthropic.com/)
2. Implement caching for scripts if needed
3. Consider rate limiting requests per IP

## 📝 Post-Deployment

After deployment:

1. **Test all game modes**: Solo, Head-to-Head, Ensemble
2. **Verify WebSocket connections**: Check room creation and joining
3. **Test on mobile devices**: Ensure responsive design works
4. **Monitor error logs**: Check for any runtime errors
5. **Set up alerts**: For downtime and errors

## 🎉 You're Live!

Your Plot Twists app should now be live and ready for players!

For support, check:
- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Socket.IO Deployment Guide](https://socket.io/docs/v4/deployment/)
- [Anthropic API Docs](https://docs.anthropic.com/)

---

Made with ❤️ for theater kids everywhere 🎭
