# VANISH : Authentication & Session Guide

---

## Overview

VANISH uses **stateless JWT authentication** implemented from scratch using Node.js built-in `node:crypto`. No third-party auth library (e.g. NextAuth, Auth.js, Passport) is used.

Two storage mechanisms work together:
- **HTTP cookie** (`auth_token`) - read by the Edge proxy for server-side route protection
- **localStorage** (`vanish_user_session_v1`) - read by client components for UI rendering

---

## JWT Implementation

**File:** `src/server/crypto.ts`

### Token Structure

Standard `HS256` JWT:

```
base64url(header) . base64url(payload) . HMAC-SHA256-signature
```

**Header:**
```json
{ "alg": "HS256", "typ": "JWT" }
```

**Payload:**
```json
{
  "sub": "user-1729000000000",
  "email": "user@vanish.dev",
  "name": "Alex Morgan",
  "exp": 1729601234,
  "iat": 1728996834
}
```

### Signing

```typescript
crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url')
```

`JWT_SECRET` is read from `process.env.JWT_SECRET`. Set this in `.env`.

### Verification

Token length, signature comparison (timing-safe via `crypto.timingSafeEqual`), and expiry checked on every API call and in the Edge proxy.

---

## Password Hashing

**Algorithm:** PBKDF2-SHA512, 10,000 iterations, 64-byte output

```typescript
const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
```

Stored separately as `passwordSalt` and `passwordHash` in the database.

Verified using `crypto.timingSafeEqual` to prevent timing attacks.

---

## Authentication Flow

### Login / Register

```
Browser                    Next.js Server              Database
   |                            |                          |
   |-- POST /api/auth ---------->|                          |
   |   { action, email, pw }    |-- readDatabase() ------->|
   |                            |<-- users[] --------------|
   |                            |-- verifyPassword()       |
   |                            |-- signJwt()              |
   |<-- 200 { token, user } ----|                          |
   |    Set-Cookie: auth_token  |                          |
```

### Subsequent Requests

```
Browser                  Edge (proxy.ts)         Page / API
   |                          |                      |
   |-- GET /dashboard -------->|                      |
   |   Cookie: auth_token     |-- isTokenValid() --->|
   |                          |   (decode, check exp)|
   |                 [valid] --|-- NextResponse.next()|
   |<-------- 200 page --------|                      |
   |                          |                      |
   |-- GET /dashboard -------->|                      |
   |   (no cookie)            |-- redirect to / ---->|
   |<-- 307 / ---------------- |                      |
```

### Logout

1. `POST /api/auth` with `{ action: "logout" }` - server clears the cookie
2. `logoutUser()` in `src/services/storage.ts` - clears localStorage and manually expires the cookie

---

## Cookie Configuration

```typescript
response.cookies.set('auth_token', token, {
  path: '/',
  maxAge: 60 * 60 * 24 * 7,  // 7 days
  sameSite: 'lax',
  httpOnly: false,             // false allows JS to read for localStorage sync
});
```

> **Production note:** Switch `httpOnly: true` and add `secure: true` when deploying over HTTPS. The current `httpOnly: false` is needed for the localStorage sync strategy used in client components.

---

## Edge Proxy Logic

**File:** `src/proxy.ts`

The proxy runs in Next.js Edge runtime (no Node.js APIs - uses `atob()` for base64 decode).

Route rules in order:

1. `/auth` -> redirect to `/`
2. `/architecture` -> redirect to `/`
3. `/` + valid auth cookie -> redirect to `/dashboard`
4. `/dashboard` or `/upload` + no valid cookie -> redirect to `/?redirect=<path>`
5. `/api/files` or `POST /api/upload` + no valid token -> `401 Unauthorized`
6. Everything else -> pass through

---

## Download Tokens

Password-protected file downloads require a short-lived download token:

1. Recipient calls `POST /api/file/:id/unlock` with the file password
2. Server verifies PBKDF2 hash
3. Server issues a **file-scoped JWT** with 15-minute expiry:
   ```json
   { "fileId": "x7Yq2P9", "purpose": "download", "exp": ... }
   ```
4. Recipient uses this token as `?token=<...>` on the download URL
5. Download route verifies token's `fileId` matches the requested file

---

## Demo Credentials

| Email | Password | Notes |
|---|---|---|
| `user@vanish.dev` | `password123` | Default seeded user |
| Any new email | Any password | Auto-registers on first login |

For locked demo file: visit `/f/demo-locked` and enter password `password123`.
