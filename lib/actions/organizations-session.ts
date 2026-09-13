'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { resolveOrganizationSecret } from '@/lib/auth-backend';
import { createOrgsSessionToken, SESSION_COOKIE_NAME, verifyOrgsSessionToken, type UnlockedOrg } from '@/lib/session';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
};

export interface UnlockOrganizationState {
  error?: string;
  success?: boolean;
}

/** Adds a newly-resolved organization to the current browser's already-unlocked set, without
 * disturbing any other org already unlocked here, and makes it the active one. */
export async function unlockOrganization(
  _prevState: UnlockOrganizationState,
  formData: FormData,
): Promise<UnlockOrganizationState> {
  const secret = String(formData.get('secret') ?? '');
  const resolved = await resolveOrganizationSecret(secret);
  if (!resolved) {
    return { error: 'Incorrect password' };
  }

  const cookieStore = await cookies();
  const existing = await verifyOrgsSessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  const nextOrg: UnlockedOrg = {
    organizationId: resolved.organizationId,
    name: resolved.name,
    slug: resolved.slug,
    secret,
  };
  const orgs = [...(existing?.orgs.filter((org) => org.organizationId !== nextOrg.organizationId) ?? []), nextOrg];

  const token = await createOrgsSessionToken(orgs, nextOrg.organizationId);
  cookieStore.set(SESSION_COOKIE_NAME, token, COOKIE_OPTIONS);
  revalidatePath('/', 'layout');
  return { success: true };
}

/** Switches the active organization among ones already unlocked in this browser — no secret
 * re-entry, no backend round-trip. */
export async function switchOrganization(organizationId: string): Promise<void> {
  const cookieStore = await cookies();
  const existing = await verifyOrgsSessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (!existing || !existing.orgs.some((org) => org.organizationId === organizationId)) {
    return;
  }
  const token = await createOrgsSessionToken(existing.orgs, organizationId);
  cookieStore.set(SESSION_COOKIE_NAME, token, COOKIE_OPTIONS);
  revalidatePath('/', 'layout');
}
