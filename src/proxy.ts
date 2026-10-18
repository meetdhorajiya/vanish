import { NextRequest, NextResponse } from 'next/server';

function isTokenValid(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    // Decode base64url payload in edge runtime (no node crypto available)
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    const jsonStr = atob(padded);
    const payload = JSON.parse(jsonStr);

    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
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
    const authHeader = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    const token = authToken || authHeader;
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
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
