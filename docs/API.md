# VANISH : REST API Reference

All API routes are under `/api/`. JSON is the default content type for request/response bodies.

---

## Authentication

### `POST /api/auth`

Login, register, or logout.

**Request body:**

```json
{
  "action": "login" | "signup" | "logout",
  "email": "user@example.com",
  "password": "••••••••",
  "name": "Alex Morgan"   // signup only, optional
}
```

**Success Response (login / signup):**

```json
{
  "success": true,
  "user": {
    "id": "user-1729000000000",
    "name": "Alex Morgan",
    "email": "user@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

A `Set-Cookie: auth_token=<jwt>; Path=/; Max-Age=604800; SameSite=Lax` header is also returned.

**Logout Response:**

```json
{ "success": true, "message": "Logged out successfully" }
```

Clears the `auth_token` cookie.

**Error Responses:**

| Status | Body |
|---|---|
| `400` | `{ "error": "Please enter both email and password" }` |
| `401` | `{ "error": "Incorrect password entered" }` |
| `500` | `{ "error": "Authentication service encountered an error" }` |

---

### `GET /api/auth`

Verify a JWT token.

**Request header:** `Authorization: Bearer <token>`

**Success:**

```json
{
  "authenticated": true,
  "user": { "sub": "user-id", "email": "...", "name": "..." }
}
```

**Failure:**

```json
{ "authenticated": false }
```

Status: `401`

---

## File Upload

### `POST /api/upload`

Upload a file with TTL and optional settings. Requires authentication (cookie or Authorization header).

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | File | Yes | The file binary |
| `duration` | string | Yes | `30s`, `1h`, `6h`, `24h`, `7d` |
| `password` | string | No | Lock file with this passphrase |
| `maxDownloads` | number | No | Self-destruct after N downloads |
| `ownerEmail` | string | No | Tag the uploader |

**Success Response (`201`):**

```json
{
  "success": true,
  "file": {
    "id": "x7Yq2P9",
    "name": "report.pdf",
    "size": 2457600,
    "mimeType": "application/pdf",
    "uploadedAt": 1729001234567,
    "expiresAt": 1729087634567,
    "durationLabel": "24 Hours",
    "hasPassword": false,
    "downloadCount": 0,
    "maxDownloads": null,
    "status": "active",
    "ownerEmail": "user@example.com"
  },
  "shareUrl": "http://localhost:3000/f/x7Yq2P9"
}
```

**Error Responses:**

| Status | Body |
|---|---|
| `400` | `{ "error": "No file uploaded" }` |
| `400` | `{ "error": "Executable files are prohibited for security" }` |
| `413` | `{ "error": "File too large (max 50MB)" }` |

---

## File Management

### `GET /api/files`

List all files. Requires authentication.

**Success Response (`200`):**

```json
{
  "success": true,
  "files": [ /* array of FileRecord */ ]
}
```

**Error:** `401` if no valid session token.

---

### `GET /api/file/:id`

Get metadata for a single file. Runs an expiry check.

**Path param:** `id` - file identifier

**Success Response (`200`):**

```json
{
  "success": true,
  "file": { /* FileRecord */ }
}
```

**Error Responses:**

| Status | Body |
|---|---|
| `404` | `{ "error": "File not found" }` |

---

### `DELETE /api/file/:id`

Instantly revoke a file ("Vanish Now"). Physically unlinks the binary from disk.

**Success Response (`200`):**

```json
{
  "success": true,
  "message": "File permanently revoked and binary expunged from storage"
}
```

---

## Password Unlock

### `POST /api/file/:id/unlock`

Verify the file password and receive a short-lived download access token.

**Request body:**

```json
{ "password": "secret123" }
```

**Success Response (`200`):**

```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

The `accessToken` is valid for **15 minutes** and is scoped to the specific file ID.

**Error Responses:**

| Status | Body |
|---|---|
| `400` | `{ "error": "Password is required" }` |
| `400` | `{ "error": "This file is not password protected" }` |
| `401` | `{ "error": "Incorrect password" }` |
| `410` | `{ "error": "File has expired or been revoked" }` |

---

## File Download

### `GET /api/file/:id/download`

Stream the file binary. For password-protected files, requires an `?token=<accessToken>` query parameter.

**Query params:**
- `token` - Access token from `/unlock` (required for password-protected files)

**Success Response (`200`):**

- `Content-Type`: file MIME type
- `Content-Disposition`: `attachment; filename="<original name>"`
- Body: raw binary stream

After download, `downloadCount` is incremented. If `maxDownloads` is reached, the file is immediately marked `exhausted` and physically unlinked.

**Error Responses:**

| Status | Body |
|---|---|
| `404` | `{ "error": "File not found or has expired" }` |
| `410` | `{ "error": "File has expired or been revoked" }` |
| `410` | `{ "error": "Download limit reached - file has self-destructed" }` |
| `401` | `{ "error": "Password required - obtain access token via /unlock" }` |
| `403` | `{ "error": "Invalid or expired download token" }` |

---

## Database Reset

### `POST /api/reset`

Restore the database to its initial demo seed state and recreate physical demo files.

**Success Response (`200`):**

```json
{
  "success": true,
  "message": "Demo database and binary files reset successfully",
  "fileCount": 5
}
```
