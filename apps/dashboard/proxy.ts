import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-secret-fallback-key-do-not-use-in-prod'
);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Paths that are always public (no auth check)
  const publicPaths = ['/login', '/setup', '/docs'];
  const isExactPublicPath = publicPaths.includes(pathname) || pathname === '/';
  const publicPrefixes = ['/share', '/api/share', '/api/users/autocomplete'];
  const isPrefixPublicPath = publicPrefixes.some(p => pathname.startsWith(p));
  const isPublicPath = isExactPublicPath || isPrefixPublicPath;

  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  // Verify session token helper
  const sessionToken = request.cookies.get('session')?.value;
  let isAuthenticated = false;
  let userRole = '';
  if (sessionToken) {
    try {
      const { payload } = await jwtVerify(sessionToken, SECRET_KEY);
      isAuthenticated = true;
      userRole = payload.role as string;
    } catch {
      isAuthenticated = false;
    }
  }

  // --- Public paths ---
  if (isPublicPath) {
    // If already authenticated (or in demo mode), redirect away from login/setup
    if ((isAuthenticated || isDemo) && (pathname === '/login' || pathname === '/setup')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // --- Protected paths ---

  // Not authenticated, not demo → redirect to login / block API
  if (!isAuthenticated && !isDemo) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // In demo mode (unauthenticated): block mutations except safe POSTs
  if (!isAuthenticated && isDemo) {
    const isSafePost =
      pathname.includes('/funnels/analyze') ||
      pathname.includes('/search-semantic') ||
      pathname.includes('/users/summarize');

    if (request.method !== 'GET' && !isSafePost) {
      return NextResponse.json(
        { error: 'Data mutation is disabled in Demo Mode.' },
        { status: 403 }
      );
    }
  }

  // Attach role header for downstream server components
  const requestHeaders = new Headers(request.headers);
  if (userRole) {
    requestHeaders.set('x-user-role', userRole);
  } else if (isDemo) {
    requestHeaders.set('x-user-role', 'demo-user');
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

// Next.js requires the middleware to be the default export from proxy.ts
export default proxy;

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
