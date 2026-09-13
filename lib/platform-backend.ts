function baseUrl(): string {
  const url = process.env.BACKEND_API_URL;
  if (!url) {
    throw new Error('BACKEND_API_URL is not set');
  }
  return url;
}

function platformSecret(): string {
  const secret = process.env.PLATFORM_OWNER_SECRET;
  if (!secret) {
    throw new Error('PLATFORM_OWNER_SECRET is not set');
  }
  return secret;
}

export class PlatformBackendError extends Error {}

/** Talks to the backend's /organizations endpoints — a separate credential from any org's own
 * admin secret, so no org can ever reach organization management through this. */
export async function platformFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-platform-secret': platformSecret(),
      ...init?.headers,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => undefined)) as { message?: string | string[] } | undefined;
    const message = Array.isArray(body?.message)
      ? body.message.join(', ')
      : (body?.message ?? `Request failed (${response.status})`);
    throw new PlatformBackendError(message);
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
