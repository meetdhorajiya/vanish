# VANISH : System Architecture

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Client)                        │
│  React components   localStorage session   Cookie           │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP
┌────────────────────────────▼────────────────────────────────┐
│              Next.js 16.4 (App Router + webpack)            │
│                                                             │
│  ┌──────────────┐   ┌─────────────────────────────────┐    │
│  │  src/proxy.ts│   │     Page Components (RSC + CC)  │    │
│  │  (Edge layer)│   │  / dashboard upload f/[id]      │    │
│  └──────┬───────┘   └─────────────────────────────────┘    │
│         │ auth guard                                        │
│  ┌──────▼───────────────────────────────────────────────┐  │
│  │                    API Routes                        │  │
│  │  /api/auth  /api/upload  /api/files                 │  │
│  │  /api/file/[id]  /api/file/[id]/unlock              │  │
│  │  /api/file/[id]/download  /api/reset                │  │
│  └────────────────────┬─────────────────────────────────┘  │
└───────────────────────┼─────────────────────────────────────┘
                        │ Node.js APIs
┌───────────────────────▼─────────────────────────────────────┐
│                   Server Layer                               │
│                                                             │
│  ┌──────────────┐  ┌────────────────┐  ┌────────────────┐  │
│  │  crypto.ts   │  │    db.ts       │  │  cleanup.ts    │  │
│  │  JWT, PBKDF2 │  │  JSON + fs     │  │  TTL daemon    │  │
│  └──────────────┘  └───────┬────────┘  └────────────────┘  │
│                            │ node:fs                        │
│  ┌─────────────────────────▼──────────────────────────────┐ │
│  │                   data/                                │ │
│  │   db.json (metadata)   uploads/ (binary files)        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Request Lifecycle

### Upload Flow

```
1. Browser submits FormData to POST /api/upload
2. proxy.ts verifies auth_token cookie
3. upload/route.ts receives multipart stream
4. crypto.ts generates 7-char alphanumeric ID
5. Binary written to data/uploads/<diskFileName>
6. Metadata written to data/db.json
7. Response: { file: FileRecord, shareUrl }
```

### Download Flow (password-protected)

```
1. Recipient visits /f/<id>
2. page.tsx calls GET /api/file/<id> for metadata
3. UI shows password form
4. Recipient submits password
5. POST /api/file/<id>/unlock verifies PBKDF2 hash
6. Server issues scoped download JWT (15 min)
7. Recipient calls GET /api/file/<id>/download?token=<jwt>
8. download/route.ts verifies token.fileId === id
9. Streams binary from data/uploads/<diskFileName>
10. downloadCount++ / quota check -> possible auto-destruct
```

### TTL Expiry Flow

```
1. cleanup.ts runs setInterval every 5 seconds
2. Calls purgeExpiredFiles() from db.ts
3. Scans db.files for active records with expiresAt < Date.now()
4. For each expired file:
   a. Sets status: 'expired'
   b. fs.unlinkSync(data/uploads/<diskFileName>)
5. Writes updated db.json
```

---

## Component Responsibilities

### `src/proxy.ts` (Edge Runtime)

- Route-level auth guard (runs before any page/API renders)
- Redirects unauthenticated users from protected routes to `/`
- Redirects authenticated users from `/` to `/dashboard`
- Sends `401` for protected API calls without valid token

### `src/server/db.ts` (Node.js, Server-only)

- `readDatabase()` - reads `data/db.json` (auto-seeds if missing)
- `writeDatabase(data)` - writes updated state
- `purgeExpiredFiles()` - expires TTL-exceeded records + disk unlink
- `resetDatabase()` - reinitializes seed data and physical files
- `getUploadsDirectory()` - returns resolved path to `data/uploads/`

### `src/server/crypto.ts` (Node.js, Server-only)

- `generateSecureId(length)` - cryptographically random alphanumeric
- `hashPassword(password)` - PBKDF2-SHA512 with random salt
- `verifyPassword(password, salt, hash)` - timing-safe verification
- `signJwt(payload, expiresInSeconds)` - HMAC-SHA256 JWT signing
- `verifyJwt(token)` - signature + expiry verification

### `src/server/cleanup.ts` (Node.js, Server-only)

- Singleton background worker
- `startBackgroundCleanupWorker(intervalMs)` - idempotent start
- Auto-started on module import
- `setInterval` unreffed so it doesn't block graceful shutdown

### `src/services/storage.ts` (Client-side)

- `fetchFiles()` - GET /api/files with auth headers
- `fetchFileById(id)` - GET /api/file/:id
- `uploadRealFile(file, options)` - POST /api/upload with credentials
- `unlockFilePassword(id, password)` - POST /api/file/:id/unlock
- `deleteFileApi(id)` - DELETE /api/file/:id
- `getCurrentUser()` - reads from localStorage
- `setMockUser(session)` - writes localStorage + sets auth cookie
- `logoutUser()` - calls logout API + clears localStorage + expires cookie

---

## Security Boundaries

| Boundary | Mechanism |
|---|---|
| Route access | Edge proxy cookie check before render |
| API access | Authorization header / cookie verified per-request |
| Password verification | PBKDF2 + timing-safe compare |
| Download authorization | File-scoped JWT with 15-min TTL |
| Token verification | HMAC-SHA256 + expiry check + timing-safe compare |
| File quarantine | Forbidden extension list (.exe, .bat, .cmd, .sh, etc.) |
| Physical deletion | `fs.unlinkSync` on expiry/quota/revocation |

---

## Data Flow: Sequence Diagram (Login)

```
User -> /          -> proxy.ts: no cookie  -> serve login page
User -> POST /api/auth            -> db: find user -> crypto: verify pw
                                  -> crypto: sign JWT
                                  <- Set-Cookie: auth_token
User -> /dashboard -> proxy.ts: valid cookie -> serve dashboard
```

---

## Scalability Notes (Current Limitations)

The current implementation is designed for single-server prototype use:

- **JSON database** is not concurrency-safe (no locking)
- **Local disk storage** is not suitable for multi-server deployment
- **Background daemon** binds to a single Node.js process

For production scale, these would be replaced with:
- PostgreSQL / MongoDB for the database
- S3 / GCS / Azure Blob for file storage
- Redis TTL keys or a proper job queue (BullMQ) for cleanup
