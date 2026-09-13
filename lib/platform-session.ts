export const PLATFORM_SESSION_COOKIE_NAME = 'platform_session';

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

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

export async function createPlatformSessionToken(): Promise<string> {
  const expiry = Date.now() + SESSION_DURATION_MS;
  const signature = await sign(String(expiry));
  return `${expiry}.${signature}`;
}

export async function verifyPlatformSessionToken(token: string | undefined): Promise<boolean> {
  if (!token) {
    return false;
  }
  const [expiryPart, signature] = token.split('.');
  if (!expiryPart || !signature) {
    return false;
  }
  const expiry = Number(expiryPart);
  if (!Number.isFinite(expiry) || expiry < Date.now()) {
    return false;
  }
  const expected = await sign(expiryPart);
  return expected === signature;
}
