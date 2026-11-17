import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, scryptSync, timingSafeEqual, createHmac } from 'node:crypto';
import { getPrisma } from '@/lib/prisma';
import { ensureDbSchema } from '@/lib/db-init';

const SESSION_COOKIE = 'farol_session';

function getSecret(): string {
  return process.env.AUTH_SECRET || process.env.DATABASE_URL || 'farol-financas-default-secret-key-2026';
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, keyHex] = (stored || '').split(':');
  if (!salt || !keyHex) return false;
  const keyBuf = Buffer.from(keyHex, 'hex');
  const derivedBuf = scryptSync(password, salt, 64);
  if (keyBuf.length !== derivedBuf.length) return false;
  return timingSafeEqual(keyBuf, derivedBuf);
}

function signSession(payload: { id: string; email: string; name: string }): string {
  const data = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = createHmac('sha256', getSecret()).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifySession(token?: string | null): { id: string; email: string; name: string } | null {
  if (!token || !token.includes('.')) return null;
  const [data, sig] = token.split('.');
  if (!data || !sig) return null;
  const expected = createHmac('sha256', getSecret()).update(data).digest('base64url');
  if (sig !== expected) return null;
  try {
    return JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const prisma = getPrisma();
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = verifySession(token);

  if (!prisma) {
    return NextResponse.json({
      ok: true,
      dbConnected: false,
      authenticated: false,
      user: null,
    });
  }

  try {
    await ensureDbSchema(prisma);
    if (!session) {
      return NextResponse.json({
        ok: true,
        dbConnected: true,
        authenticated: false,
        user: null,
      });
    }

    const account = await prisma.userAccount.findUnique({ where: { id: session.id } });
    if (!account) {
      return NextResponse.json({
        ok: true,
        dbConnected: true,
        authenticated: false,
        user: null,
      });
    }

    const workspace = await prisma.userWorkspace.findUnique({ where: { id: account.id } });
    const parsedState = workspace ? JSON.parse(workspace.stateJson) : null;

    return NextResponse.json({
      ok: true,
      dbConnected: true,
      authenticated: true,
      user: { id: account.id, email: account.email, name: account.name },
      state: parsedState,
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      dbConnected: false,
      authenticated: false,
      error: err instanceof Error ? err.message : 'Auth check error',
    });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || '');

  if (action === 'logout') {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
    return res;
  }

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Banco de dados PostgreSQL ainda não está conectado (DATABASE_URL ausente).',
      },
      { status: 503 }
    );
  }

  try {
    await ensureDbSchema(prisma);
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const name = String(body.name || '').trim() || email.split('@')[0] || 'Minha Conta';

    if (!email || !email.includes('@')) {
      return NextResponse.json({ ok: false, error: 'Informe um e-mail válido.' }, { status: 400 });
    }
    if (password.length < 4) {
      return NextResponse.json({ ok: false, error: 'A senha deve ter pelo menos 4 caracteres.' }, { status: 400 });
    }

    if (action === 'register') {
      const existing = await prisma.userAccount.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json(
          { ok: false, error: 'Já existe uma conta cadastrada com este e-mail. Use a aba Entrar.' },
          { status: 409 }
        );
      }

      const account = await prisma.userAccount.create({
        data: {
          email,
          name,
          passwordHash: hashPassword(password),
        },
      });

      const initialState = body.state && typeof body.state === 'object' ? body.state : null;
      if (initialState) {
        initialState.userEmail = email;
        if (initialState.profile) {
          initialState.profile.name = name;
        }
        const profile = initialState.profile || {};
        await prisma.userWorkspace.upsert({
          where: { id: account.id },
          create: {
            id: account.id,
            email,
            name,
            plan: String(profile.plan || 'Plano pessoal'),
            monthlySalaryCents: Math.round(Number(profile.monthlySalaryCents) || 0),
            salaryDay: Math.min(28, Math.max(1, Number(profile.salaryDay) || 5)),
            monthlyBudgetCents: Math.round(Number(profile.monthlyBudgetCents) || 0),
            emergencyGoalCents: Math.round(Number(profile.emergencyGoalCents) || 33000),
            theme: String(initialState.theme || 'dark'),
            hideValues: Boolean(initialState.privacyMode ?? initialState.hideValues),
            lastUsedAccountId: initialState.lastUsedAccountId || null,
            stateJson: JSON.stringify(initialState),
          },
          update: {
            email,
            name,
            stateJson: JSON.stringify(initialState),
          },
        });
      }

      const token = signSession({ id: account.id, email: account.email, name: account.name });
      const res = NextResponse.json({
        ok: true,
        user: { id: account.id, email: account.email, name: account.name },
        state: initialState,
      });
      res.cookies.set(SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 90,
      });
      return res;
    }

    if (action === 'login') {
      const account = await prisma.userAccount.findUnique({ where: { email } });
      if (!account || !verifyPassword(password, account.passwordHash)) {
        return NextResponse.json(
          { ok: false, error: 'E-mail ou senha incorretos.' },
          { status: 401 }
        );
      }

      let workspace = await prisma.userWorkspace.findUnique({ where: { id: account.id } });
      let parsedState = workspace ? JSON.parse(workspace.stateJson) : null;

      // Se o usuário ainda não tinha workspace salvo, migra o estado enviado pelo navegador
      if (!parsedState && body.state && typeof body.state === 'object') {
        parsedState = body.state;
        parsedState.userEmail = account.email;
        if (parsedState.profile) parsedState.profile.name = account.name;
        const profile = parsedState.profile || {};
        workspace = await prisma.userWorkspace.create({
          data: {
            id: account.id,
            email: account.email,
            name: account.name,
            plan: String(profile.plan || 'Plano pessoal'),
            monthlySalaryCents: Math.round(Number(profile.monthlySalaryCents) || 0),
            salaryDay: Math.min(28, Math.max(1, Number(profile.salaryDay) || 5)),
            monthlyBudgetCents: Math.round(Number(profile.monthlyBudgetCents) || 0),
            emergencyGoalCents: Math.round(Number(profile.emergencyGoalCents) || 33000),
            theme: String(parsedState.theme || 'dark'),
            hideValues: Boolean(parsedState.privacyMode ?? parsedState.hideValues),
            lastUsedAccountId: parsedState.lastUsedAccountId || null,
            stateJson: JSON.stringify(parsedState),
          },
        });
      }

      const token = signSession({ id: account.id, email: account.email, name: account.name });
      const res = NextResponse.json({
        ok: true,
        user: { id: account.id, email: account.email, name: account.name },
        state: parsedState,
      });
      res.cookies.set(SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 90,
      });
      return res;
    }

    return NextResponse.json({ ok: false, error: 'Ação inválida.' }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Erro interno de autenticação.' },
      { status: 500 }
    );
  }
}
