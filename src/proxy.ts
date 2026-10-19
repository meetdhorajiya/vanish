import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'vanish_ephemeral_super_secret_key_2026';

/**
 * Verifies a JWT by checking BOTH the HMAC-SHA256 signature AND expiry.
 * Runs in Node.js runtime (default for Proxy in Next.js 16+).
 */
function isTokenValid(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const [headerB64, payloadB64, signature] = parts;
    const data = `${headerB64}.${payloadB64}`;

    // Verify HMAC-SHA256 signature
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(data)
      .digest('base64url');

    if (signature.length !== expectedSig.length) return false;
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return false;
    }

    // Verify expiry
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Redirect legacy /auth to homepage /
  if (pathname === '/auth') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 2. Redirect /architecture to homepage /
  if (pathname === '/architecture') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const authToken = request.cookies.get('auth_token')?.value;
  const hasValidAuth = !!authToken && isTokenValid(authToken);

  // 3. Homepage (/) is the Login/Registration portal.
  //    If user already has a valid session, send them straight to Dashboard.
  if (pathname === '/') {
    if (hasValidAuth) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // 4. Protect private page routes: /dashboard and /upload
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/upload');

  if (isProtectedRoute) {
    if (!hasValidAuth) {
      const redirectUrl = new URL('/', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      const response = NextResponse.redirect(redirectUrl);
      if (authToken) {
        response.cookies.delete('auth_token');
      }
      return response;
    }
  }

  // 5. Protect sensitive API routes
  if (pathname === '/api/files' || (pathname === '/api/upload' && request.method === 'POST')) {
    const authHeader = request.headers.get('authorization');
    const bearerToken = authHeader ? authHeader.replace(/^Bearer\s+/i, '') : undefined;
    const token = authToken || bearerToken;
    if (!token || !isTokenValid(token)) {
      return NextResponse.json(
        { error: 'Unauthorized: Valid session token required' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
