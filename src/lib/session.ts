import { createHmac, timingSafeEqual } from 'node:crypto';
import { getPrisma } from '@/lib/prisma';
import { ensureDbSchema } from '@/lib/db-init';

export const SESSION_COOKIE = 'farol_session';
export const PRIMARY_ADMIN_EMAIL = 'thulioggomes@gmail.com';

export interface FarolSessionPayload {
  id: string;
  email: string;
  name: string;
}

export function getSessionSecret(): string {
  return process.env.AUTH_SECRET || process.env.DATABASE_URL || 'farol-financas-default-secret-key-2026';
}

export function signSession(payload: FarolSessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = createHmac('sha256', getSessionSecret()).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifySession(token?: string | null): FarolSessionPayload | null {
  if (!token || !token.includes('.')) return null;
  const [data, sig] = token.split('.');
  if (!data || !sig) return null;
  const expected = createHmac('sha256', getSessionSecret()).update(data).digest('base64url');
  const sigBuf = Buffer.from(sig, 'utf8');
  const expectedBuf = Buffer.from(expected, 'utf8');
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
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

export type AdminAuthResult =
  | { status: 'ok'; user: FarolSessionPayload }
  | { status: 'unauthenticated' }
  | { status: 'forbidden'; currentEmail: string }
  | { status: 'no_database' };

export async function verifyAdminRequest(token?: string | null): Promise<AdminAuthResult> {
  const session = verifySession(token);
  if (!session || !session.id) {
    return { status: 'unauthenticated' };
  }

  const prisma = getPrisma();
  if (!prisma) {
    if (isAdminEmail(session.email)) {
      return { status: 'no_database' };
    }
    return { status: 'forbidden', currentEmail: session.email || '' };
  }

  await ensureDbSchema(prisma);
  const account = await prisma.userAccount.findUnique({ where: { id: session.id } });
  if (!account || !account.verified) {
    return { status: 'unauthenticated' };
  }

  if (!isAdminEmail(account.email)) {
    return { status: 'forbidden', currentEmail: account.email };
  }

  return {
    status: 'ok',
    user: { id: account.id, email: account.email, name: account.name },
  };
}
