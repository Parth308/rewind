import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-secret-fallback-key-do-not-use-in-prod'
);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Exact path matches
  const publicPaths = ['/login', '/setup', '/docs'];
  const isExactPublicPath = publicPaths.includes(pathname) || pathname === '/';
  
  // Prefix path matches
  const publicPrefixes = ['/share', '/api/share', '/api/users/autocomplete']; // assuming some APIs might need to be public or share routes
  const isPrefixPublicPath = publicPrefixes.some(p => pathname.startsWith(p));
  
  const isPublicPath = isExactPublicPath || isPrefixPublicPath;

  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  if (!isPublicPath) {
    const sessionToken = request.cookies.get('session')?.value;
    let isAuthenticated = false;
    let userRole = '';

    if (sessionToken) {
      try {
        const { payload } = await jwtVerify(sessionToken, SECRET_KEY);
        isAuthenticated = true;
        userRole = payload.role as string;
      } catch (e) {
        isAuthenticated = false;
      }
    }

    if (!isAuthenticated && !isDemo) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // In Demo Mode, prevent unauthenticated users from mutating data
    if (!isAuthenticated && isDemo) {
      const isSafePost = pathname.includes('/funnels/analyze') || 
                         pathname.includes('/search-semantic') || 
                         pathname.includes('/users/summarize');

      if (request.method !== 'GET' && !isSafePost) {
        return NextResponse.json({ error: 'Data mutation is disabled in Demo Mode.' }, { status: 403 });
      }
    }

    // Attach role to headers so downstream components know it quickly
    const requestHeaders = new Headers(request.headers);
    if (userRole) {
      requestHeaders.set('x-user-role', userRole);
    } else if (isDemo) {
      requestHeaders.set('x-user-role', 'demo-user');
    }

    // If user is authenticated or demo mode, don't let them go to /login or /setup 
    if (pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard/projects', request.url));
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
