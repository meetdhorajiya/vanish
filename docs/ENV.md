# VANISH : Environment Variables Reference

---

## File Locations

| File | Purpose | Committed? |
|---|---|---|
| `.env` | Active configuration | No (gitignored) |
| `.env.example` | Template for new developers | Yes |

---

## Variables

### Server

| Variable | Type | Default | Required | Description |
|---|---|---|---|---|
| `NODE_ENV` | string | `development` | No | `development` or `production` |
| `PORT` | number | `3000` | No | HTTP server port |
| `NEXT_PUBLIC_APP_URL` | string | `http://localhost:3000` | No | Public base URL (used in share links) |

### Security

| Variable | Type | Default | Required | Description |
|---|---|---|---|---|
| `JWT_SECRET` | string | _(hardcoded fallback)_ | **Yes in prod** | HMAC-SHA256 signing secret. Use 32+ random characters. |
| `JWT_EXPIRES_IN` | number | `604800` | No | Session token lifetime in seconds (default: 7 days) |

> The hardcoded fallback in `src/server/crypto.ts` is only for local development. Always set `JWT_SECRET` in production.

### Storage

| Variable | Type | Default | Required | Description |
|---|---|---|---|---|
| `STORAGE_DIR` | path | `./data/uploads` | No | Directory where uploaded file binaries are written |
| `DB_PATH` | path | `./data/db.json` | No | Path to the JSON database file |

### Ephemeral File Policies

| Variable | Type | Default | Required | Description |
|---|---|---|---|---|
| `MAX_FILE_SIZE_MB` | number | `50` | No | Maximum upload size in megabytes |
| `CLEANUP_INTERVAL_MS` | number | `5000` | No | How often the background TTL daemon scans for expired files |

---

## Example `.env`

```bash
PORT=3000
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

JWT_SECRET=your_strong_random_secret_here_minimum_32_chars
JWT_EXPIRES_IN=604800

STORAGE_DIR=./data/uploads
DB_PATH=./data/db.json

MAX_FILE_SIZE_MB=50
CLEANUP_INTERVAL_MS=5000
```

---

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Set `JWT_SECRET` to a securely generated random string
- [ ] Set `NEXT_PUBLIC_APP_URL` to your public domain
- [ ] Update cookie options in `src/app/api/auth/route.ts`: add `secure: true, httpOnly: true`
- [ ] Consider replacing `STORAGE_DIR` with a cloud storage bucket path
- [ ] Consider replacing `DB_PATH` with a proper database connection string
