import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, randomInt, scryptSync, timingSafeEqual, createHmac } from 'node:crypto';
import nodemailer from 'nodemailer';
import { getPrisma } from '@/lib/prisma';
import { ensureDbSchema } from '@/lib/db-init';

const SESSION_COOKIE = 'farol_session';
const OTP_EXPIRATION_MS = 10 * 60 * 1000; // 10 minutos
const OTP_COOLDOWN_MS = 55 * 1000;       // 60s no cliente (55s de tolerância no servidor)
const OTP_MAX_ATTEMPTS = 3;

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

function hashOtpCode(code: string, userId: string): string {
  return createHmac('sha256', getSecret())
    .update(`${userId}:${code.trim()}`)
    .digest('hex');
}

function verifyOtpHash(code: string, userId: string, storedHash: string): boolean {
  const expected = Buffer.from(hashOtpCode(code, userId), 'hex');
  const actual = Buffer.from(storedHash || '', 'hex');
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hasCustomizedServerState(st: any): boolean {
  if (!st || typeof st !== 'object') return false;
  if (st.isExplicitDemo) return true;

  const txs = Array.isArray(st.transactions) ? st.transactions : [];
  if (txs.some((t: any) => !(t && t.id === 'tx-initial-1' && Number(t.amountCents) === 5500 && t.description === 'Pedido Delivery' && t.date === '2026-11-09'))) {
    return true;
  }

  const recs = Array.isArray(st.recurrences) ? st.recurrences : [];
  if (recs.some((r: any) => !(r && ((r.id === 'rec-1' && Number(r.amountCents) === 9990 && r.active === false) || (r.id === 'rec-2' && Number(r.amountCents) === 2190 && r.active === false))))) {
    return true;
  }

  const goals = Array.isArray(st.goals) ? st.goals : [];
  if (goals.some((g: any) => !(g && ((g.id === 'goal-1' && Number(g.currentCents) === 0 && Number(g.targetCents) === 33000) || (g.id === 'goal-2' && Number(g.currentCents) === 45000 && Number(g.targetCents) === 300000))))) {
    return true;
  }

  const assets = Array.isArray(st.assets) ? st.assets : [];
  if (assets.some((a: any) => !(a && a.id === 'ast-1' && Number(a.amountCents) === 0 && a.name === 'CDB Liquidez Diária'))) {
    return true;
  }

  const accounts = Array.isArray(st.accounts) ? st.accounts : [];
  if (accounts.some((a: any) => !(a && ((a.id === 'acc-nubank' && a.name === 'Conta Principal' && Number(a.initialBalanceCents || 0) === 0) || (a.id === 'acc-inter' && a.name === 'Cartão Black' && Number(a.initialBalanceCents || 0) === 0))))) {
    return true;
  }

  const cats = Array.isArray(st.categories) ? st.categories : [];
  if (cats.some((c: any) => !c || typeof c.id !== 'string' || !c.id.startsWith('cat-') || c.archived === true)) {
    return true;
  }

  if (st.invoiceMeta && typeof st.invoiceMeta === 'object' && Object.keys(st.invoiceMeta).length > 0) {
    return true;
  }

  if ((Number(st.profile?.monthlySalaryCents) || 0) > 0 || (Number(st.profile?.monthlyBudgetCents) || 0) > 0) {
    return true;
  }

  const emergencyGoalCents = Number(st.profile?.emergencyGoalCents) || 0;
  if (emergencyGoalCents > 0 && emergencyGoalCents !== 33000) {
    return true;
  }

  return false;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isUntouchedDemoServerState(st: any): boolean {
  if (!st || typeof st !== 'object' || st.isExplicitDemo) return false;
  if (hasCustomizedServerState(st)) return false;
  const txs = Array.isArray(st.transactions) ? st.transactions : [];
  const goals = Array.isArray(st.goals) ? st.goals : [];
  const recs = Array.isArray(st.recurrences) ? st.recurrences : [];
  return txs.some((t: any) => t && t.id === 'tx-initial-1')
    || goals.some((g: any) => g && g.id === 'goal-2')
    || recs.some((r: any) => r && r.id === 'rec-1');
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

async function sendOtpEmail({
  toEmail,
  userName,
  code,
  purpose,
}: {
  toEmail: string;
  userName: string;
  code: string;
  purpose: 'register' | 'login';
}): Promise<{ deliveredByEmail: boolean; providerNote?: string }> {
  const smtpUser = (process.env.SMTP_USER || '').trim();
  const smtpPass = (process.env.SMTP_PASS || '').trim();
  const smtpHost = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const smtpPort = Number(process.env.SMTP_PORT || 465);
  const resendKey = (process.env.RESEND_API_KEY || '').trim();
  const fromAddress =
    process.env.EMAIL_FROM ||
    (smtpUser ? `Farol Finanças <${smtpUser}>` : 'Farol Finanças <onboarding@resend.dev>');

  const subject =
    purpose === 'register'
      ? `${code} é o seu código para ativar sua conta no Farol Finanças`
      : `${code} é o seu código de acesso em 2 etapas — Farol Finanças`;

  const html = `
    <div style="font-family:'Plus Jakarta Sans',Arial,sans-serif;max-width:480px;margin:0 auto;background:#0d1822;color:#f3f6f8;padding:32px 28px;border-radius:16px;border:1px solid rgba(73,182,235,0.25);">
      <div style="font-size:13px;font-weight:700;color:#49b6eb;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:8px;">Farol Finanças · Segurança</div>
      <h2 style="margin:0 0 12px;font-size:20px;color:#ffffff;">Olá, ${userName}!</h2>
      <p style="font-size:14px;line-height:1.55;color:#9bb0bd;margin:0 0 22px;">
        ${
          purpose === 'register'
            ? 'Use o código de 6 dígitos abaixo para confirmar seu e-mail e ativar sua conta no Farol Finanças:'
            : 'Use o código de verificação em duas etapas (2FA) abaixo para concluir seu login:'
        }
      </p>
      <div style="background:#081017;border:1px solid rgba(73,182,235,0.4);border-radius:12px;padding:18px;text-align:center;font-size:32px;font-weight:800;letter-spacing:0.28em;color:#38b6ff;margin-bottom:20px;">
        ${code}
      </div>
      <p style="font-size:12px;color:#7c94a3;margin:0;">
        Este código é de uso único e expira em <b>10 minutos</b> (máximo de 3 tentativas). Se você não solicitou este código, ignore este e-mail.
      </p>
    </div>
  `;

  // 1. Prioridade: SMTP Real (Gmail / Outlook / Servidor SMTP próprio — envia para qualquer destinatário)
  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      await transporter.sendMail({
        from: fromAddress,
        to: toEmail,
        subject,
        html,
      });
      return { deliveredByEmail: true };
    } catch (err) {
      return {
        deliveredByEmail: false,
        providerNote: `Falha no envio via SMTP (${err instanceof Error ? err.message : 'erro desconhecido'}).`,
      };
    }
  }

  // 2. Alternativa: Resend API (RESEND_API_KEY)
  if (resendKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [toEmail],
          subject,
          html,
        }),
      });
      if (res.ok) {
        return { deliveredByEmail: true };
      }
      const errBody = await res.text();
      return {
        deliveredByEmail: false,
        providerNote: `Falha no envio via Resend (${res.status}): ${errBody.slice(0, 140)}`,
      };
    } catch (err) {
      return {
        deliveredByEmail: false,
        providerNote: err instanceof Error ? err.message : 'Falha de rede ao enviar e-mail via Resend.',
      };
    }
  }

  return {
    deliveredByEmail: false,
    providerNote:
      'Serviço de envio de e-mail ainda não configurado na Vercel (adicione SMTP_USER + SMTP_PASS ou RESEND_API_KEY em Environment Variables).',
  };
}

async function issueAndDeliverOtp(
  prisma: NonNullable<ReturnType<typeof getPrisma>>,
  account: { id: string; email: string; name: string },
  purpose: 'register' | 'login'
) {
  await prisma.otpVerification.updateMany({
    where: { userId: account.id, used: false },
    data: { used: true },
  });

  const code = String(randomInt(100000, 1000000));
  const otpRecord = await prisma.otpVerification.create({
    data: {
      userId: account.id,
      email: account.email,
      purpose,
      codeHash: hashOtpCode(code, account.id),
      attempts: 0,
      used: false,
      expiresAt: new Date(Date.now() + OTP_EXPIRATION_MS),
    },
  });

  const delivery = await sendOtpEmail({
    toEmail: account.email,
    userName: account.name,
    code,
    purpose,
  });

  if (!delivery.deliveredByEmail) {
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });
    return NextResponse.json(
      {
        ok: false,
        emailNotConfigured: true,
        error: delivery.providerNote || 'Não foi possível enviar o código para o seu e-mail.',
      },
      { status: 503 }
    );
  }

  return NextResponse.json({
    ok: true,
    step: 'verify_otp',
    email: account.email,
    purpose,
    expiresInSeconds: 600,
    cooldownSeconds: 60,
    deliveredByEmail: true,
  });
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
    if (!account || !account.verified) {
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

    // ============================================================
    // 1. VERIFICAÇÃO DO CÓDIGO OTP DE 6 DÍGITOS (CADASTRO OU LOGIN 2FA)
    // ============================================================
    if (action === 'verify_otp') {
      const code = String(body.code || '').replace(/\D/g, '').trim();
      if (!email || code.length !== 6) {
        return NextResponse.json(
          { ok: false, error: 'Digite os 6 dígitos do código de verificação.' },
          { status: 400 }
        );
      }

      const account = await prisma.userAccount.findUnique({ where: { email } });
      if (!account) {
        return NextResponse.json({ ok: false, error: 'Conta não encontrada.' }, { status: 404 });
      }

      const activeOtp = await prisma.otpVerification.findFirst({
        where: { userId: account.id, used: false },
        orderBy: { createdAt: 'desc' },
      });

      if (!activeOtp) {
        return NextResponse.json(
          { ok: false, error: 'Nenhum código pendente ou código já utilizado. Clique em Reenviar código.' },
          { status: 400 }
        );
      }

      if (new Date() > activeOtp.expiresAt) {
        await prisma.otpVerification.update({
          where: { id: activeOtp.id },
          data: { used: true },
        });
        return NextResponse.json(
          { ok: false, expired: true, error: 'Este código expirou (prazo de 10 minutos). Clique em Reenviar código.' },
          { status: 400 }
        );
      }

      if (activeOtp.attempts >= OTP_MAX_ATTEMPTS) {
        await prisma.otpVerification.update({
          where: { id: activeOtp.id },
          data: { used: true },
        });
        return NextResponse.json(
          { ok: false, locked: true, error: 'Código bloqueado após 3 tentativas incorretas. Clique em Reenviar código.' },
          { status: 429 }
        );
      }

      const isValid = verifyOtpHash(code, account.id, activeOtp.codeHash);
      if (!isValid) {
        const nextAttempts = activeOtp.attempts + 1;
        const exhausted = nextAttempts >= OTP_MAX_ATTEMPTS;
        await prisma.otpVerification.update({
          where: { id: activeOtp.id },
          data: {
            attempts: nextAttempts,
            used: exhausted,
          },
        });
        const remaining = Math.max(0, OTP_MAX_ATTEMPTS - nextAttempts);
        return NextResponse.json(
          {
            ok: false,
            locked: exhausted,
            error: exhausted
              ? 'Código invalidado após 3 tentativas incorretas. Solicite um novo código.'
              : `Código incorreto. Você ainda tem ${remaining} tentativa(s).`,
          },
          { status: 401 }
        );
      }

      // Código válido! Invalida imediatamente o OTP (uso único) e ativa a conta se for cadastro
      await prisma.otpVerification.updateMany({
        where: { userId: account.id, used: false },
        data: { used: true },
      });

      if (!account.verified) {
        await prisma.userAccount.update({
          where: { id: account.id },
          data: { verified: true },
        });
      }

      let workspace = await prisma.userWorkspace.findUnique({ where: { id: account.id } });
      let parsedState = workspace ? JSON.parse(workspace.stateJson) : null;

      if (parsedState && isUntouchedDemoServerState(parsedState)) {
        parsedState = null;
        if (workspace) {
          await prisma.userWorkspace.delete({ where: { id: account.id } }).catch(() => {});
          workspace = null;
        }
      }

      if (!parsedState && activeOtp.purpose !== 'register' && body.state && typeof body.state === 'object' && hasCustomizedServerState(body.state)) {
        parsedState = body.state;
        parsedState.userEmail = account.email;
        if (parsedState.profile) parsedState.profile.name = account.name;
        const profile = parsedState.profile || {};
        workspace = await prisma.userWorkspace.upsert({
          where: { id: account.id },
          create: {
            id: account.id,
            email: account.email,
            name: account.name,
            plan: String(profile.plan || 'Plano pessoal'),
            monthlySalaryCents: Math.round(Number(profile.monthlySalaryCents) || 0),
            salaryDay: Math.min(28, Math.max(1, Number(profile.salaryDay) || 5)),
            monthlyBudgetCents: Math.round(Number(profile.monthlyBudgetCents) || 0),
            emergencyGoalCents: Math.max(0, Math.round(Number(profile.emergencyGoalCents) || 0)),
            theme: String(parsedState.theme || 'dark'),
            hideValues: Boolean(parsedState.privacyMode ?? parsedState.hideValues),
            lastUsedAccountId: parsedState.lastUsedAccountId || null,
            stateJson: JSON.stringify(parsedState),
          },
          update: {
            email: account.email,
            name: account.name,
            stateJson: JSON.stringify(parsedState),
          },
        });
      }

      const token = signSession({ id: account.id, email: account.email, name: account.name });
      const res = NextResponse.json({
        ok: true,
        step: 'authenticated',
        purpose: activeOtp.purpose,
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

    // ============================================================
    // 2. REENVIO DE CÓDIGO OTP COM COOLDOWN DE 60 SEGUNDOS
    // ============================================================
    if (action === 'resend_otp') {
      if (!email) {
        return NextResponse.json({ ok: false, error: 'Informe o e-mail.' }, { status: 400 });
      }
      const account = await prisma.userAccount.findUnique({ where: { email } });
      if (!account) {
        return NextResponse.json({ ok: false, error: 'Conta não encontrada.' }, { status: 404 });
      }

      const lastOtp = await prisma.otpVerification.findFirst({
        where: { userId: account.id },
        orderBy: { createdAt: 'desc' },
      });

      if (lastOtp) {
        const elapsedMs = Date.now() - new Date(lastOtp.createdAt).getTime();
        if (elapsedMs < OTP_COOLDOWN_MS) {
          const waitSec = Math.ceil((60000 - elapsedMs) / 1000);
          return NextResponse.json(
            {
              ok: false,
              remainingCooldown: waitSec,
              error: `Aguarde ${waitSec}s antes de solicitar um novo código.`,
            },
            { status: 429 }
          );
        }
      }

      const purpose: 'register' | 'login' = account.verified ? 'login' : 'register';
      return issueAndDeliverOtp(prisma, account, purpose);
    }

    // ============================================================
    // 3. CADASTRO (CRIA CONTA COM STATUS NÃO VERIFICADA + GERA OTP)
    // ============================================================
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
      if (existing && existing.verified) {
        return NextResponse.json(
          { ok: false, error: 'Já existe uma conta ativa com este e-mail. Use a opção Fazer Login.' },
          { status: 409 }
        );
      }

      const account = existing
        ? await prisma.userAccount.update({
            where: { id: existing.id },
            data: { name, passwordHash: hashPassword(password), verified: false },
          })
        : await prisma.userAccount.create({
            data: {
              email,
              name,
              passwordHash: hashPassword(password),
              verified: false,
            },
          });

      return issueAndDeliverOtp(prisma, account, 'register');
    }

    // ============================================================
    // 4. LOGIN EM DUAS ETAPAS (VALIDA CREDENCIAIS + ENVIA OTP 2FA)
    // ============================================================
    if (action === 'login') {
      const account = await prisma.userAccount.findUnique({ where: { email } });
      if (!account || !verifyPassword(password, account.passwordHash)) {
        return NextResponse.json(
          { ok: false, error: 'E-mail ou senha incorretos.' },
          { status: 401 }
        );
      }

      const purpose: 'register' | 'login' = account.verified ? 'login' : 'register';
      return issueAndDeliverOtp(prisma, account, purpose);
    }

    return NextResponse.json({ ok: false, error: 'Ação inválida.' }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Erro interno de autenticação.' },
      { status: 500 }
    );
  }
}
