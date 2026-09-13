import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/session';

function baseUrl(): string {
  const url = process.env.BACKEND_API_URL;
  if (!url) {
    throw new Error('BACKEND_API_URL is not set');
  }
  return url;
}

export class BackendError extends Error {}

async function activeSession() {
  const cookieStore = await cookies();
  const session = await verifyAdminSessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (!session) {
    throw new BackendError('Not signed in');
  }
  return session;
}

export async function backendFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const session = await activeSession();
  const isFormData = init?.body instanceof FormData;
  const response = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      // Let fetch set its own multipart Content-Type (with boundary) for FormData bodies.
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      'x-admin-secret': session.secret,
      'x-organization-id': session.activeOrganizationId,
      ...init?.headers,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => undefined)) as { message?: string | string[] } | undefined;
    const message = Array.isArray(body?.message)
      ? body.message.join(', ')
      : (body?.message ?? `Request failed (${response.status})`);
    throw new BackendError(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}
