# VANISH : Development Guide

---

## Environment Setup

```bash
# 1. Clone and install
git clone <repo>
cd vanish
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env: set JWT_SECRET to a long random string

# 3. Start development server
npm run dev
```

The server starts at `http://localhost:3000`. The `data/` directory and demo seed files are auto-created on first request.

---

## Project Conventions

### TypeScript

- All server-only code lives in `src/server/` - never import these in client components
- Use `'use client'` directive for any component using React hooks or browser APIs
- Types are centralized in `src/types/index.ts`

### API Routes

- All routes are in `src/app/api/`
- Never add `export const dynamic = 'force-dynamic'` - it conflicts with `cacheComponents` in this Next.js version
- Use `NextRequest` and `NextResponse` throughout

### CSS

- All styling is Vanilla CSS in `src/styles/globals.css`
- Use CSS variables from the design system (e.g. `var(--blue-600)`, `var(--text-primary)`)
- No Tailwind, no CSS modules, no inline style objects for new components (prefer class names)
- Design constraint: **white and blue only** - no additional accent colors

### Client State

- User session is read from `localStorage` via `getCurrentUser()` in `src/services/storage.ts`
- Never hardcode user emails or names - always derive from `getCurrentUser()`
- The `auth_token` cookie is the source of truth for the Edge proxy

---

## Adding a New API Route

1. Create file at `src/app/api/<name>/route.ts`
2. Export named HTTP methods: `GET`, `POST`, `PUT`, `DELETE`
3. Use `NextRequest` / `NextResponse` from `next/server`
4. Do NOT add `export const dynamic = 'force-dynamic'`
5. For protected routes, check the `Authorization` header or cookie manually

Example:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { readDatabase } from '@/server/db';

export async function GET(req: NextRequest) {
  const authToken = req.cookies.get('auth_token')?.value;
  if (!authToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = readDatabase();
  return NextResponse.json({ success: true, data: db.files });
}
```

---

## Adding a New Page

1. Create `src/app/<route>/page.tsx`
2. Add `'use client'` at the top if using hooks
3. Add auth check using `getCurrentUser()` and redirect if needed
4. Update `Header.tsx` navigation if the route should appear in the nav
5. Update `src/proxy.ts` if the route needs middleware protection

---

## Modifying the Database Schema

1. Update the `StoredFile` or `StoredUser` interface in `src/server/db.ts`
2. Update the `initSeeds()` function to include the new field
3. Update `FileRecord` in `src/types/index.ts` if the field is client-facing
4. Delete `data/db.json` and restart the server to reinitialize the schema

---

## Useful Commands

```bash
# Start development server
npm run dev

# TypeScript type check
npx tsc --noEmit

# Lint
npm run lint

# Reset demo data (via API)
curl -X POST http://localhost:3000/api/reset

# View current database
cat data/db.json

# View uploaded files
ls data/uploads/
```

---

## Known Issues & Workarounds

### `@next/swc-win32-x64-msvc` warning on Windows

```
Attempted to load @next/swc-win32-x64-msvc, but an error occurred: ...not a valid Win32 application.
```

**Cause:** The SWC native binding doesn't work on this Windows environment.  
**Fix:** Already handled - `package.json` uses `next dev --webpack` which forces the Webpack bundler and falls back to WASM-based SWC.

### Middleware deprecation warning

```
The "middleware" file convention is deprecated. Please use "proxy" instead.
```

**Status:** Already migrated - file is at `src/proxy.ts`, not `src/middleware.ts`.

### Hydration mismatch in Header

If you see hydration mismatches from the Header component, clear the `.next` cache:

```bash
rm -rf .next
npm run dev
```

### `export const dynamic = 'force-dynamic'` error

Do NOT add this to any route file. It conflicts with the Next.js 16.4 configuration in this project.

---

## AI Agent Reference

This `docs/` folder is intended as a reference for AI coding agents working on this project. Key facts:

- **Homepage is the login page** (`src/app/page.tsx`) - it is not a marketing/landing page
- **`/auth` and `/architecture` routes redirect to `/`** - do not add content to them
- **Middleware is at `src/proxy.ts`** - Next.js 16.4 deprecated the `middleware.ts` convention
- **No `export const dynamic`** in any route file
- **No external auth libraries** - all crypto is via `node:crypto`
- **No dark mode** - design is strictly white/blue
- **No long dashes (-- or ---) in UI text** - use plain hyphens or no punctuation
- **No academic/institution names** in UI text or file content
- **Demo password** for locked files: `password123`
- **Demo user**: `user@vanish.dev` / `password123`
