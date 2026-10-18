# VANISH : Project Overview

**VANISH** is a full-stack ephemeral file sharing platform built with **Next.js 16.4** (App Router), **TypeScript**, and zero third-party authentication or ORM dependencies.

---

## Core Concept

Users upload files and receive a shareable link. Every upload carries:

- **TTL** - a time-to-live after which the file permanently disappears
- **Download quota** (optional) - file self-destructs after N downloads
- **Password lock** (optional) - PBKDF2 passphrase required to unlock
- **Instant revocation** - owner can destroy the file on demand

When any termination condition is met, the file binary is **physically unlinked from disk** by the background cleanup daemon. The database record is marked expired but retained for UI history. There is zero digital residue of the binary content.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.4 (App Router, webpack mode) |
| Language | TypeScript 5 |
| Styling | Vanilla CSS (whitish trust palette, blue accents) |
| Database | JSON file (`data/db.json`) via `node:fs` |
| File Storage | Local disk (`data/uploads/`) via `node:fs` |
| Cryptography | Node.js built-in `node:crypto` (PBKDF2, HMAC-SHA256) |
| Auth | Custom stateless JWT (no external library) |
| Edge Layer | Next.js proxy (`src/proxy.ts`) |

---

## Application Routes

### Page Routes

| Path | Auth Required | Description |
|---|---|---|
| `/` | No | Login / Registration portal (homepage) |
| `/dashboard` | Yes | File management dashboard |
| `/upload` | Yes | Upload studio |
| `/f/[id]` | No | Recipient file download page |
| `/auth` | No | Redirects to `/` |
| `/architecture` | No | Redirects to `/` |

### API Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth` | No | Login, signup, logout |
| `GET` | `/api/auth` | Bearer | Verify JWT |
| `POST` | `/api/upload` | Cookie/Bearer | Upload file |
| `GET` | `/api/files` | Cookie/Bearer | List files |
| `GET` | `/api/file/:id` | No | Get file metadata |
| `DELETE` | `/api/file/:id` | No | Instant revoke |
| `POST` | `/api/file/:id/unlock` | No | Unlock with password |
| `GET` | `/api/file/:id/download` | Token | Stream file binary |
| `POST` | `/api/reset` | No | Restore demo seeds |

---

## Data Model

### FileRecord

```typescript
interface StoredFile {
  id: string;             // 7-char alphanumeric (e.g. "x7Yq2P9")
  name: string;           // Original filename
  size: number;           // Bytes
  mimeType: string;       // MIME type
  diskFileName: string;   // Filename within data/uploads/
  uploadedAt: number;     // Unix timestamp (ms)
  expiresAt: number;      // Unix timestamp (ms)
  durationLabel: string;  // Human label (e.g. "6 Hours")
  hasPassword: boolean;
  passwordHash?: string;  // PBKDF2-SHA512 hex
  passwordSalt?: string;  // 16-byte hex
  downloadCount: number;
  maxDownloads: number | null;  // null = unlimited
  status: 'active' | 'expired' | 'exhausted';
  ownerEmail?: string;
}
```

### UserSession (client-side)

```typescript
interface UserSession {
  isLoggedIn: boolean;
  name: string;
  email: string;
  token?: string;  // JWT
}
```

---

## Key Design Decisions

1. **No external auth library** - JWT signing uses `crypto.createHmac('sha256', secret)` directly
2. **No ORM / SQL** - simple JSON file persistence avoids dependency bloat
3. **No dark mode** - whitish trust palette chosen for professional document handling
4. **Proxy as auth gate** - `src/proxy.ts` (Next.js Edge) handles redirects before any page render
5. **Cookie + localStorage dual sync** - cookie for server-side middleware, localStorage for client-side UI state
6. **Background daemon** - `src/server/cleanup.ts` runs a `setInterval` sweep every 5 seconds

---

## File Lifecycle

```
Upload -> Active (TTL ticking)
   |
   +-- TTL expires     -> status: 'expired'  + disk unlink
   +-- Quota reached   -> status: 'exhausted' + disk unlink
   +-- Owner revokes   -> status: 'expired'  + disk unlink
```

---

## Development Setup

```bash
cp .env.example .env    # Set JWT_SECRET
npm install
npm run dev             # http://localhost:3000
```

Default demo credentials: **email** `user@vanish.dev`, **password** `password123`
