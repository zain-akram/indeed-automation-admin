'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { resolveOrganizationSecret } from '@/lib/auth-backend';
import { createAdminSessionToken, SESSION_COOKIE_NAME } from '@/lib/session';

export interface LoginState {
  error?: string;
}

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const secret = String(formData.get('password') ?? '');

  const resolved = await resolveOrganizationSecret(secret);
  if (!resolved) {
    return { error: 'Incorrect password' };
  }

  const token = await createAdminSessionToken(secret, resolved.organizationId);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect('/');
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect('/login');
}
