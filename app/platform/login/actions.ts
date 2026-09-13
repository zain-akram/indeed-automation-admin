'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createPlatformSessionToken, PLATFORM_SESSION_COOKIE_NAME } from '@/lib/platform-session';

export interface PlatformLoginState {
  error?: string;
}

export async function platformLogin(_prevState: PlatformLoginState, formData: FormData): Promise<PlatformLoginState> {
  const secret = String(formData.get('password') ?? '');

  if (!process.env.PLATFORM_OWNER_SECRET || secret !== process.env.PLATFORM_OWNER_SECRET) {
    return { error: 'Incorrect password' };
  }

  const token = await createPlatformSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(PLATFORM_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect('/platform/organizations');
}

export async function platformLogout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(PLATFORM_SESSION_COOKIE_NAME);
  redirect('/platform/login');
}
