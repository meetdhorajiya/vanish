# VANISH : Ephemeral Cloud File Sharing

> Secure, self-destructing file transfers with automated cryptographic deletion upon TTL expiry.

[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Private-red)](LICENSE)

---

## What is VANISH?

VANISH is a full-stack ephemeral file sharing platform. Upload any file, set a time-to-live (TTL), an optional password, and a download quota. When any of those limits are hit, the file binary is **physically unlinked from disk** and the metadata is marked expired. There is zero digital residue.

Key guarantees:
- **TTL-based expiry** - files auto-delete when the countdown reaches zero
- **Download quota** - file self-destructs after N downloads
- **Password protection** - PBKDF2-hashed passphrases with salted verification
- **Instant revocation** - owner can "Vanish Now" to immediately destroy the file
- **JWT authentication** - stateless HMAC-SHA256 signed tokens, no external auth library

---

## Project Structure

```
vanish/
├── src/
│   ├── app/                        # Next.js App Router pages
│   │   ├── page.tsx                # Homepage = Login / Registration portal
│   │   ├── layout.tsx              # Root layout with sticky Header
│   │   ├── dashboard/page.tsx      # Protected: file management dashboard
│   │   ├── upload/page.tsx         # Protected: upload studio
│   │   ├── f/[id]/page.tsx         # Public: recipient download page
│   │   ├── auth/page.tsx           # Redirects to / (login is homepage)
│   │   ├── architecture/page.tsx   # Redirects to / (removed)
│   │   └── api/
│   │       ├── auth/route.ts       # POST login/signup/logout, GET verify
│   │       ├── upload/route.ts     # POST multipart file upload
│   │       ├── files/route.ts      # GET list all files (auth-protected)
│   │       ├── file/[id]/
│   │       │   ├── route.ts        # GET metadata, DELETE instant revoke
│   │       │   ├── unlock/route.ts # POST password verification -> token
│   │       │   └── download/route.ts # GET stream binary (quota-aware)
│   │       └── reset/route.ts      # POST restore demo seed files
│   ├── components/
│   │   └── Header.tsx              # Sticky navbar with auth state
│   ├── server/
│   │   ├── db.ts                   # JSON database + disk file storage
│   │   ├── crypto.ts               # ID gen, PBKDF2, HMAC-SHA256 JWT
│   │   └── cleanup.ts              # Background daemon (5s TTL sweeper)
│   ├── services/
│   │   └── storage.ts              # Client-side API layer
│   ├── styles/
│   │   └── globals.css             # Whitish trust design system
│   ├── types/
│   │   └── index.ts                # TypeScript type definitions
│   └── proxy.ts                    # Next.js Edge proxy (auth guard + redirects)
├── data/
│   ├── db.json                     # Persistent JSON database (auto-created)
│   └── uploads/                    # Physical binary file storage (auto-created)
├── docs/                           # Project documentation for developers & AI agents
│   ├── OVERVIEW.md                 # High-level project overview
│   ├── API.md                      # Complete REST API reference
│   ├── AUTH.md                     # Authentication & JWT flow
│   ├── ARCHITECTURE.md             # System architecture & data flow
│   └── CONTRIBUTING.md             # Development guide
├── .env                            # Environment configuration (gitignored)
├── .env.example                    # Environment template (committed)
└── next.config.ts                  # Next.js configuration
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd vanish

# Install dependencies
npm install

# Copy the environment template
cp .env.example .env
# Edit .env and set a strong JWT_SECRET before production use
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app starts at the **login page**.

> Note: On Windows with this Next.js version, `--webpack` is used automatically (configured in `package.json`).

### First Run

The database and uploads directory are **auto-created** on first API call. Sample demo files are seeded automatically. You can:

1. Register a new account at `/` (homepage)
2. Upload a file at `/upload`
3. Share the link with recipients at `/f/<id>`
4. Manage your files at `/dashboard`

---

## Environment Configuration

Copy `.env.example` to `.env` and configure:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Public base URL |
| `JWT_SECRET` | _(required)_ | HMAC-SHA256 signing secret |
| `JWT_EXPIRES_IN` | `604800` | Token TTL in seconds (7 days) |
| `STORAGE_DIR` | `./data/uploads` | Physical file storage path |
| `DB_PATH` | `./data/db.json` | Database JSON file path |
| `MAX_FILE_SIZE_MB` | `50` | Maximum upload size |
| `CLEANUP_INTERVAL_MS` | `5000` | Background cleanup sweep interval |

> **Security**: Never commit `.env` to version control. The `.gitignore` already excludes it.

---

## API Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth` | No | Login, signup, or logout |
| `GET` | `/api/auth` | Bearer | Verify JWT token |
| `POST` | `/api/upload` | Cookie/Bearer | Upload a file with TTL options |
| `GET` | `/api/files` | Cookie/Bearer | List all files |
| `GET` | `/api/file/:id` | No | Get file metadata |
| `DELETE` | `/api/file/:id` | No | Instant revoke ("Vanish Now") |
| `POST` | `/api/file/:id/unlock` | No | Password verification -> access token |
| `GET` | `/api/file/:id/download` | Token | Stream binary download |
| `POST` | `/api/reset` | No | Restore demo seed data |

See [`docs/API.md`](docs/API.md) for full request/response schemas.

---

## Authentication Flow

1. User submits email + password to `POST /api/auth`
2. Server verifies PBKDF2 hash, signs a JWT with `HMAC-SHA256`
3. JWT is set as an `auth_token` cookie (7-day `Max-Age`)
4. `src/proxy.ts` (Next.js Edge) reads the cookie on every request:
   - Unauthenticated requests to `/dashboard` or `/upload` get redirected to `/`
   - Authenticated requests to `/` get redirected to `/dashboard`
5. Client-side `localStorage` mirrors the session for UI rendering

---

## Design Principles

- **Minimal whitish palette**: Pure white `#ffffff` cards on `#fcfcfd` canvas, blue `#2563eb` accents only
- **No dark mode**: Trust-first design for secure document handling
- **No external auth libraries**: All crypto done with Node.js built-ins (`node:crypto`)
- **No long dashes**: Clean minimal copy throughout

---

## Development Commands

```bash
npm run dev      # Start development server (webpack mode)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint check
```

---

## Demo Files

On first run (or after `POST /api/reset`), the following demo records are seeded:

| ID | Status | Notes |
|---|---|---|
| `demo-active` | Active | 6-hour TTL, 10 download limit |
| `demo-locked` | Active | Password-protected (use `password123`) |
| `demo-vanished` | Expired | Demonstrates the expired state UI |
| `demo-exhausted` | Exhausted | Demonstrates the download quota reached UI |
| `demo-fast` | Active | Short TTL demo file |

Visit `/f/<id>` to see each state directly.

---

## Security Notes

- Passwords hashed with PBKDF2-SHA512, 10,000 iterations, 64-byte output
- Download tokens are short-lived HMAC-SHA256 JWTs (file-scoped)
- Session tokens expire after 7 days
- Expired files are physically unlinked from disk by the background daemon
- Cookie is `SameSite=Lax` — update to `Secure; HttpOnly` in production HTTPS environments
