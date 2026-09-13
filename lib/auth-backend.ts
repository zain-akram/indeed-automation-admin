/** Called before any organization is unlocked in this browser's session, so it can't go through
 * backendFetch() (which requires one to already be active) — it hits the public resolve endpoint directly. */
export interface ResolvedOrganization {
  organizationId: string;
  name: string;
  slug: string;
}

export async function resolveOrganizationSecret(secret: string): Promise<ResolvedOrganization | null> {
  const url = process.env.BACKEND_API_URL;
  if (!url) {
    throw new Error('BACKEND_API_URL is not set');
  }
  const response = await fetch(`${url}/auth/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret }),
    cache: 'no-store',
  });
  if (!response.ok) {
    return null;
  }
  return response.json() as Promise<ResolvedOrganization>;
}
