import { NextRequest, NextResponse } from 'next/server';
import { PLATFORM_SESSION_COOKIE_NAME, verifyPlatformSessionToken } from '@/lib/platform-session';
import { SESSION_COOKIE_NAME, verifyOrgsSessionToken } from '@/lib/session';

export const config = {
  matcher: ['/((?!login|platform/login|_next/static|_next/image|favicon.ico).*)'],
};

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/platform')) {
    const token = request.cookies.get(PLATFORM_SESSION_COOKIE_NAME)?.value;
    const valid = await verifyPlatformSessionToken(token);
    if (!valid) {
      return NextResponse.redirect(new URL('/platform/login', request.url));
    }
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifyOrgsSessionToken(token);

  if (!session || session.orgs.length === 0) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
