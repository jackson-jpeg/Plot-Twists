# Deployment Guide — Plot Twists

## Platform: Railway

Plot Twists runs as a **single process** (Express + Socket.IO + Next.js) and requires persistent WebSocket connections. Railway is the current production host.

**Important**: Vercel/Netlify serverless platforms **cannot** run this app — they don't support persistent WebSocket connections.

## Prerequisites

1. [Railway account](https://railway.app/) with CLI installed (`npm i -g @railway/cli`)
2. Anthropic API key from [console.anthropic.com](https://console.anthropic.com/)
3. Firebase project (for auth + Firestore)
4. Environment variables configured (see below)

## Environment Variables

### Required

```env
ANTHROPIC_API_KEY=sk-ant-...        # Claude API for script generation
NEXT_PUBLIC_WS_URL=plot-twists.com  # Your domain (no protocol prefix)
NEXT_PUBLIC_APP_URL=https://plot-twists.com
NODE_ENV=production
```

### Firebase (Required for auth + database)

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
FIREBASE_STORAGE_BUCKET=...
GOOGLE_APPLICATION_CREDENTIALS_JSON=...  # Service account JSON (base64 or raw)
```

### Payments (Optional)

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
APPLE_SHARED_SECRET=...                  # App Store IAP verification
```

### Other

```env
GEMINI_API_KEY=...                  # Movie poster generation (Google Gemini)
ALLOWED_ORIGINS=https://plot-twists.com  # CORS whitelist
```

**Important**: `NEXT_PUBLIC_*` variables are inlined at build time by Next.js. Changing them requires a rebuild, not just a restart.

## Deploy to Railway

### Option 1: CLI Deploy

```bash
railway login
railway link          # Link to existing project
railway up            # Upload and deploy
```

### Option 2: Git Push (Auto-Deploy)

Railway auto-deploys when you push to the linked branch:

```bash
git push origin v2    # Triggers Railway build + deploy
```

### Build Configuration

Railway uses Nixpacks and auto-detects Node.js:

- **Build command**: `npm run build` (runs `next build`)
- **Start command**: `npm run start` (runs `NODE_ENV=production tsx server.ts`)
- **Node version**: 22.x (via Nixpacks)

## Custom Domain

1. Railway Dashboard → Service → Settings → Networking → Custom Domain
2. Add your domain (e.g., `plot-twists.com`)
3. Configure DNS: CNAME record pointing to Railway's domain
4. SSL is automatic via Let's Encrypt

## Architecture in Production

```
User's Browser
     │
     ├── HTTPS (pages, assets) ──→ Railway (Next.js SSR)
     │
     └── WSS (game events) ──────→ Railway (Socket.IO)
                                        │
                                        ├── Firestore (persistent storage)
                                        ├── Claude API (script generation)
                                        ├── Gemini API (poster generation)
                                        ├── Stripe API (payments)
                                        └── Firebase Auth (token verification)
```

Everything runs in a single Railway service. The custom server (`server.ts`) handles both HTTP requests (via Next.js request handler) and WebSocket connections (via Socket.IO).

### Room State

- **In-memory Map** is authoritative for active room state
- **Firestore** persistence is async and debounced (5s for high-frequency updates)
- On server restart, rooms are **recovered from Firestore** automatically
- Failed Firestore writes are queued for retry every 10s

## Post-Deployment Checklist

- [ ] Site loads at your domain (HTTP 200)
- [ ] Can create a room (host view shows QR + room code)
- [ ] Can join a room (player view connects via WebSocket)
- [ ] Script generation works (Claude API key valid)
- [ ] Auth works (Firebase config correct)
- [ ] Payments work if applicable (Stripe webhook configured)

## Monitoring

Check Railway logs for:
- `[INFO] > Ready on http://0.0.0.0:3000` — server started
- `[RoomService] Recovered N room(s)` — room recovery on restart
- `[INFO] Socket.IO configured for production mode` — WebSocket ready

### Health Check

```bash
curl -s -o /dev/null -w "%{http_code}" -L https://plot-twists.com/
# Should return 200
```

## Troubleshooting

### WebSocket Connection Fails
- Verify `NEXT_PUBLIC_WS_URL` matches your domain (no `wss://` prefix — the client adds it)
- Check Railway logs for CORS errors
- Ensure `ALLOWED_ORIGINS` includes your domain

### Build Fails
- Check that all `NEXT_PUBLIC_*` env vars are set (they're needed at build time)
- Run `npm run build` locally to reproduce
- Memory issues: Railway provides 8GB by default, usually sufficient

### Room Creation Fails
- Verify `ANTHROPIC_API_KEY` is valid
- Check rate limits haven't been hit
- Look for credit system errors in logs

### Rooms Lost on Deploy
- Rooms are recovered from Firestore on restart
- Brief interruption (~30s) during deploy as the new instance starts
- Active WebSocket connections will reconnect automatically (client has reconnection logic)

## Cost

- **Railway**: ~$5-20/month depending on traffic (usage-based pricing)
- **Anthropic API**: ~$0.01-0.03 per script generation
- **Firebase**: Free tier covers most usage (Firestore reads/writes, Auth)
- **Gemini API**: Free tier for poster generation
