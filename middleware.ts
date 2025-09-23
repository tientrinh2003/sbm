import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const role = (token as any)?.role as string | undefined;

  const publicPaths = ['/login', '/register', '/api/auth', '/'];

  // Allow public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Redirect to login if not authenticated
  if (!token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // Handle dashboard routing based on role
  if (pathname === '/dashboard') {
    switch (role) {
      case 'ADMIN':
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      case 'DOCTOR':
        return NextResponse.redirect(new URL('/doctor/dashboard', request.url));
      case 'PATIENT':
        return NextResponse.redirect(new URL('/patient/dashboard', request.url));
      default:
        return NextResponse.redirect(new URL('/forbidden', request.url));
    }
  }

  // Role-based access control
  if (pathname.startsWith('/admin') && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/forbidden', request.url));
  }

  if (pathname.startsWith('/doctor') && role !== 'DOCTOR') {
    return NextResponse.redirect(new URL('/forbidden', request.url));
  }

  if (pathname.startsWith('/patient') && role !== 'PATIENT') {
    return NextResponse.redirect(new URL('/forbidden', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
