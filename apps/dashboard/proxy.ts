import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-secret-fallback-key-do-not-use-in-prod'
);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // We only protect /dashboard and its sub-routes
  if (!pathname.startsWith('/dashboard')) {
    return NextResponse.next();
  }

  // The share links should be publicly accessible if they have a token
  // Oh wait, /share is NOT inside /dashboard, it's at /share/[token].
  // But let's check just in case it ever moves.
  if (pathname.startsWith('/share')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('session')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    
    // Optionally check roles here if needed for specific sub-routes
    // e.g., if (pathname.startsWith('/dashboard/settings') && payload.role !== 'owner') return 403;

    // Attach role to headers so downstream components know it quickly
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-role', payload.role as string);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (err) {
    // Token is invalid or expired
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
