import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/session';

export const config = {
  matcher: ['/((?!login|_next/static|_next/image|favicon.ico).*)'],
};

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifyAdminSessionToken(token);

  if (!session) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
