# Development Reverse Proxy Setup

This document explains how to use the Caddy reverse proxy for local development to enable proper cookie sharing across all apps.

## Why Use a Proxy?

Modern browsers don't allow httpOnly cookies to be shared across different ports (e.g., `localhost:3000`, `localhost:3001`, `localhost:5000`) for security reasons. By using a reverse proxy, all apps are served on the same origin (`localhost:8080`), allowing cookies to work properly.

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Browser: http://localhost:8080                 │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Caddy Reverse Proxy (Port 8080)                │
├─────────────────────────────────────────────────┤
│  /           → Website    (localhost:3000)      │
│  /admin/*    → Admin      (localhost:3001)      │
│  /api/*      → API        (localhost:5000)      │
│  /health     → Health Check                     │
└─────────────────────────────────────────────────┘
```

## URL Mapping

| Access URL | Proxied To | Purpose |
|------------|------------|---------|
| `http://localhost:8080/` | `localhost:3000` | Customer website |
| `http://localhost:8080/login` | `localhost:3000/login` | Customer login |
| `http://localhost:8080/admin` | `localhost:3001` | Admin dashboard |
| `http://localhost:8080/admin/dev-login` | `localhost:3001/dev-login` | Dev login |
| `http://localhost:8080/api/v1/*` | `localhost:5000/api/v1/*` | API endpoints |
| `http://localhost:8080/health` | Proxy health check | Health status |

## Quick Start

### Option 1: Automatic Startup (Recommended)

```bash
cd /Users/nuuk/Documents/apps/bakewind
./dev-proxy-start.sh
```

This will:
1. Start the API server on port 5000
2. Start the website on port 3000
3. Start the admin dashboard on port 3001
4. Start Caddy proxy on port 8080
5. Show you the URLs and PIDs

To stop all services:
```bash
./dev-proxy-stop.sh
```

### Option 2: Manual Startup

**Terminal 1 - API:**
```bash
cd api
npm run start:dev
```

**Terminal 2 - Website:**
```bash
cd website
cp .env.proxy .env
npm run dev
```

**Terminal 3 - Admin:**
```bash
cd admin
cp .env.proxy .env
npm run dev
```

**Terminal 4 - Caddy:**
```bash
cd /Users/nuuk/Documents/apps/bakewind
caddy run --config Caddyfile
```

## Environment Configuration

### With Proxy (.env.proxy)

**Admin (.env.proxy):**
```env
VITE_API_URL=http://localhost:8080/api/v1
VITE_CUSTOMER_APP_URL=http://localhost:8080
VITE_BASE_PATH=/admin
```

**Website (.env.proxy):**
```env
VITE_API_URL=http://localhost:8080/api/v1
VITE_ADMIN_APP_URL=http://localhost:8080/admin
```

### Without Proxy (.env)

Keep your existing `.env` files for direct access:

**Admin (.env):**
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_CUSTOMER_APP_URL=http://localhost:3000
```

**Website (.env):**
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_ADMIN_APP_URL=http://localhost:3001
```

## Testing

### 1. Health Check
```bash
curl http://localhost:8080/health
# Should return: Proxy OK - BakeWind Development
```

### 2. API Test
```bash
curl http://localhost:8080/api/v1/health
# Should return API health status
```

### 3. Login Flow Test

1. **Open browser**: `http://localhost:8080/login`
2. **Login** with credentials (e.g., `admin@bakewind.com` / `password123`)
3. **Should redirect** to `http://localhost:8080/admin` with cookies set
4. **Verify cookies** in DevTools → Application → Cookies → `http://localhost:8080`
   - Should see `accessToken` and `refreshToken` cookies

### 4. Cookie Verification

Open DevTools and check cookies:
```javascript
// In browser console
document.cookie
// Should show accessToken and refreshToken
```

## Troubleshooting

### Port Already in Use

```bash
# Check what's using the ports
lsof -i :3000
lsof -i :3001
lsof -i :5000
lsof -i :8080

# Kill processes
lsof -ti:8080 | xargs kill -9
```

Or use the stop script:
```bash
./dev-proxy-stop.sh
```

### Cookies Not Working

1. **Clear browser cookies** for `localhost:8080`
2. **Verify proxy is running**: `curl http://localhost:8080/health`
3. **Check Caddy logs**: `tail -f logs/caddy.log`
4. **Verify apps are using proxy URLs**: Check `.env` files

### Admin Shows "Authentication Required"

1. **Use the full login flow** via website: `http://localhost:8080/login`
2. **Or use dev login**: `http://localhost:8080/admin/dev-login`

### API Not Responding

Check if API is running:
```bash
curl http://localhost:5000/api/v1/health
```

If not, start it manually:
```bash
cd api
npm run start:dev
```

## Logs

Logs are stored in the `logs/` directory:
- `logs/api.log` - API server logs
- `logs/website.log` - Website logs
- `logs/admin.log` - Admin dashboard logs
- `logs/caddy.log` - Caddy proxy logs

View logs:
```bash
tail -f logs/caddy.log
tail -f logs/api.log
```

## Development Workflow

### Standard Development (With Proxy)

```bash
# Start everything
./dev-proxy-start.sh

# Access at http://localhost:8080
# Cookies will work properly ✅

# Stop everything
./dev-proxy-stop.sh
```

### Direct Access (Without Proxy)

If you need to access apps directly (e.g., for debugging):

- Website: `http://localhost:3000`
- Admin: `http://localhost:3001/dev-login` (use dev login)
- API: `http://localhost:5000/api/v1`

**Note**: Cookies won't work across different ports, so use dev login for admin.

## Production Deployment

In production, use proper subdomains instead of paths:

```
https://bakewind.com          → Customer website
https://admin.bakewind.com    → Admin dashboard
https://api.bakewind.com      → API server
```

With cookies configured:
```typescript
domain: '.bakewind.com',  // Shared across subdomains
secure: true,              // HTTPS only
sameSite: 'lax',
httpOnly: true,
```

## Benefits of Proxy Setup

✅ **Cookies work properly** - Same origin = shared cookies
✅ **Production-like environment** - Mimics real deployment
✅ **No CORS issues** - All same origin
✅ **Cleaner URLs** - `/admin` instead of `:3001`
✅ **Easy testing** - Full authentication flow works

## Additional Resources

- [Caddy Documentation](https://caddyserver.com/docs/)
- [Cookie Security Guide](../docs/stage1_complete_implementation.md)
- [Authentication Flow](../docs/authorisation_flow_audit.md)
