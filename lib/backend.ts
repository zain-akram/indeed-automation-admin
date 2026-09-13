import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME, verifyOrgsSessionToken } from '@/lib/session';

function baseUrl(): string {
  const url = process.env.BACKEND_API_URL;
  if (!url) {
    throw new Error('BACKEND_API_URL is not set');
  }
  return url;
}

async function activeOrgSecret(): Promise<string> {
  const cookieStore = await cookies();
  const session = await verifyOrgsSessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  const active = session?.orgs.find((org) => org.organizationId === session.activeOrganizationId);
  if (!active) {
    throw new BackendError('No active organization');
  }
  return active.secret;
}

export class BackendError extends Error {}

export async function backendFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const isFormData = init?.body instanceof FormData;
  const response = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      // Let fetch set its own multipart Content-Type (with boundary) for FormData bodies.
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      'x-admin-secret': await activeOrgSecret(),
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
