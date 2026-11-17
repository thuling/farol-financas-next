import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { getPrisma } from '@/lib/prisma';
import { ensureDbSchema } from '@/lib/db-init';

export const SESSION_COOKIE = 'farol_session';
export const PRIMARY_ADMIN_EMAIL = 'thulioggomes@gmail.com';
export const SESSION_TTL_MS = 90 * 24 * 60 * 60 * 1000;

const globalForSecret = globalThis as unknown as { __farolEphemeralDevSecret?: string };

export interface FarolSessionPayload {
  id: string;
  email: string;
  name: string;
  sv?: number;
  exp?: number;
}

export function getSessionSecret(): string {
  const configured = process.env.AUTH_SECRET?.trim();
  if (configured) {
    return configured;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET environment variable must be configured in production.');
  }
  if (!globalForSecret.__farolEphemeralDevSecret) {
    globalForSecret.__farolEphemeralDevSecret = randomBytes(32).toString('hex');
  }
  return globalForSecret.__farolEphemeralDevSecret;
}

export function isSessionSecretConfigured(): boolean {
  if (process.env.AUTH_SECRET?.trim()) return true;
  return process.env.NODE_ENV !== 'production';
}

export function signSession(payload: FarolSessionPayload): string {
  const fullPayload: FarolSessionPayload = {
    id: payload.id,
    email: payload.email,
    name: payload.name,
    sv: typeof payload.sv === 'number' ? payload.sv : 1,
    exp: typeof payload.exp === 'number' ? payload.exp : Date.now() + SESSION_TTL_MS,
  };
  const data = Buffer.from(JSON.stringify(fullPayload), 'utf8').toString('base64url');
  const sig = createHmac('sha256', getSessionSecret()).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifySession(token?: string | null): FarolSessionPayload | null {
  if (!token || !token.includes('.')) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  if (!data || !sig) return null;

  let secret: string;
  try {
    secret = getSessionSecret();
  } catch {
    return null; // Fail closed when AUTH_SECRET is missing
  }

  const expected = createHmac('sha256', secret).update(data).digest('base64url');
  const sigBuf = Buffer.from(sig, 'utf8');
  const expectedBuf = Buffer.from(expected, 'utf8');
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as FarolSessionPayload;
    if (!parsed || typeof parsed.id !== 'string' || !parsed.id || typeof parsed.email !== 'string' || !parsed.email) {
      return null;
    }
    if (typeof parsed.exp !== 'number' || !Number.isFinite(parsed.exp) || parsed.exp <= Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function getAllowedAdminEmails(): string[] {
  const envList = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set([PRIMARY_ADMIN_EMAIL, ...envList]));
}

export function isAdminEmail(email?: string | null): boolean {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) return false;
  return getAllowedAdminEmails().includes(normalized);
}

export type SessionAuthResult =
  | { status: 'ok'; user: { id: string; email: string; name: string; sessionVersion: number } }
  | { status: 'unauthenticated' }
  | { status: 'no_database' };

export async function verifyAuthenticatedSession(token?: string | null): Promise<SessionAuthResult> {
  const session = verifySession(token);
  if (!session) {
    return { status: 'unauthenticated' };
  }

  const prisma = getPrisma();
  if (!prisma) {
    return { status: 'no_database' };
  }

  await ensureDbSchema(prisma);
  const account = await prisma.userAccount.findUnique({ where: { id: session.id } });
  if (!account || !account.verified) {
    return { status: 'unauthenticated' };
  }

  const tokenVersion = typeof session.sv === 'number' ? session.sv : 1;
  if (tokenVersion !== account.sessionVersion) {
    return { status: 'unauthenticated' };
  }

  return {
    status: 'ok',
    user: {
      id: account.id,
      email: account.email,
      name: account.name,
      sessionVersion: account.sessionVersion,
    },
  };
}

export type AdminAuthResult =
  | { status: 'ok'; user: FarolSessionPayload }
  | { status: 'unauthenticated' }
  | { status: 'forbidden'; currentEmail: string }
  | { status: 'no_database' };

export async function verifyAdminRequest(token?: string | null): Promise<AdminAuthResult> {
  const auth = await verifyAuthenticatedSession(token);
  if (auth.status === 'unauthenticated') {
    return { status: 'unauthenticated' };
  }
  if (auth.status === 'no_database') {
    const session = verifySession(token);
    if (session && isAdminEmail(session.email)) {
      return { status: 'no_database' };
    }
    return { status: 'forbidden', currentEmail: '' };
  }

  if (!isAdminEmail(auth.user.email)) {
    return { status: 'forbidden', currentEmail: auth.user.email };
  }

  return {
    status: 'ok',
    user: { id: auth.user.id, email: auth.user.email, name: auth.user.name },
  };
}
