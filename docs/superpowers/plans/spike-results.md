# Socket.IO Spike Results

**Date:** 2026-03-18
**Library:** `socket.io-client-swift` v16.1.1 (Starscream v4.0.8)

## Results

| Test | Result | Notes |
|------|--------|-------|
| Connection | PASS | Connects via polling, upgrades available to websocket |
| Events | PASS | `connect`, `disconnect`, `statusChange` all fire correctly |
| Acks (get_room_preview) | PASS | Server received event, processed it, returned `{ success: false, error: "Room not found" }` via ack callback |
| Acks (get_credit_balance) | PASS | Server returned `{ success: false, error: "Not authenticated" }` — correct behavior for unauthenticated socket |
| Auto-reconnection | NOT TESTED | Would need to kill network mid-connection; library supports it via config |

## Key Findings

### Server URL
- `plot-twists.com` points to Vercel (serves Next.js frontend), NOT the Socket.IO server
- Socket.IO server runs on Railway at `https://web-production-c7981.up.railway.app`
- Native app must connect to the Railway URL directly
- CORS allows `!origin` (no Origin header) — native connections work without issues

### Connection Config
- Do NOT use `forceWebsockets(true)` — server expects polling handshake first, then upgrades to WebSocket
- Working config: `[.log(false), .secure(true)]` (defaults handle polling → websocket upgrade)
- EIO=4 is sent automatically by the library

### Ack Format
- Server returns ack data as `[{...dictionary...}]` — first element is always a dictionary
- `success` comes through as `0` (NSNumber) not `false` (Bool) — use `as? Bool` which handles both
- Error messages are plain strings in the `error` key

## Decision

**Proceed with `socket.io-client-swift` v16.1.1.** No need for fallback Option B (raw WebSocket + EIO parser).

## Environment Variable Needed

The native app needs `SOCKET_URL` or similar config pointing to `https://web-production-c7981.up.railway.app`. This should NOT be hardcoded — use a config file or build setting so it can be changed for dev/staging/production.
