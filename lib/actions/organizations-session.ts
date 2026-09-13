'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createAdminSessionToken, SESSION_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/session';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
};

/** Switches which organization you're acting as — instant, no secret involved. Any organization's
 * secret already proves you're the trusted admin; this just changes which org that admin operates on. */
export async function switchOrganization(organizationId: string): Promise<void> {
  const cookieStore = await cookies();
  const existing = await verifyAdminSessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (!existing) {
    return;
  }
  const token = await createAdminSessionToken(existing.secret, organizationId);
  cookieStore.set(SESSION_COOKIE_NAME, token, COOKIE_OPTIONS);
  revalidatePath('/', 'layout');
}
