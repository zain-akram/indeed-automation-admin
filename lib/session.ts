export const SESSION_COOKIE_NAME = 'admin_orgs';

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export interface UnlockedOrg {
  organizationId: string;
  name: string;
  slug: string;
  secret: string;
}

export interface OrgsSession {
  orgs: UnlockedOrg[];
  activeOrganizationId: string;
  expiry: number;
}

function bytesToHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function sign(message: string): Promise<string> {
  const secret = process.env.SESSION_SIGNING_SECRET;
  if (!secret) {
    throw new Error('SESSION_SIGNING_SECRET is not set');
  }
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return bytesToHex(signature);
}

export async function createOrgsSessionToken(orgs: UnlockedOrg[], activeOrganizationId: string): Promise<string> {
  const session: OrgsSession = { orgs, activeOrganizationId, expiry: Date.now() + SESSION_DURATION_MS };
  const payload = Buffer.from(JSON.stringify(session), 'utf8').toString('base64url');
  const signature = await sign(payload);
  return `${payload}.${signature}`;
}

export async function verifyOrgsSessionToken(token: string | undefined): Promise<OrgsSession | null> {
  if (!token) {
    return null;
  }
  const [payload, signature] = token.split('.');
  if (!payload || !signature) {
    return null;
  }
  const expected = await sign(payload);
  if (expected !== signature) {
    return null;
  }
  let session: OrgsSession;
  try {
    session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as OrgsSession;
  } catch {
    return null;
  }
  if (!Number.isFinite(session.expiry) || session.expiry < Date.now()) {
    return null;
  }
  return session;
}
