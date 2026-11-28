import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, randomInt, scryptSync, timingSafeEqual, createHmac } from 'node:crypto';
import nodemailer from 'nodemailer';
import { getPrisma } from '@/lib/prisma';
import { ensureDbSchema } from '@/lib/db-init';
import {
  SESSION_COOKIE,
  SESSION_TTL_MS,
  getSessionSecret,
  isSessionSecretConfigured,
  signSession,
  verifySession,
  verifyAuthenticatedSession,
  isAdminEmail,
} from '@/lib/session';
import { sanitizeWorkspaceInstallments, sanitizeAllWorkspacesOnce } from '@/lib/state-sanitize';

const OTP_EXPIRATION_MS = 10 * 60 * 1000; // 10 minutos
const OTP_COOLDOWN_MS = 55 * 1000;       // 60s no cliente (55s de tolerância no servidor)
const OTP_MAX_ATTEMPTS = 3;
const LOGIN_MAX_FAILURES = 5;
const LOGIN_LOCK_MS = 5 * 60 * 1000;
const MAX_STATE_SEED_BYTES = 2 * 1024 * 1024;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(val: unknown): string {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeName(val: unknown, fallback: string): string {
  const cleaned = String(val ?? '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, 80);
  return cleaned || fallback.slice(0, 80);
}

function getSecret(): string {
  return getSessionSecret();
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

type OtpPurpose = 'register' | 'login' | 'reset_password';

function isEmailProviderConfigured(): boolean {
  const smtpUser = (process.env.SMTP_USER || '').trim();
  const smtpPass = (process.env.SMTP_PASS || '').trim();
  const resendKey = (process.env.RESEND_API_KEY || '').trim();
  return Boolean((smtpUser && smtpPass) || resendKey);
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
  purpose: OtpPurpose;
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
      : purpose === 'reset_password'
        ? `${code} é o seu código para redefinir sua senha — Farol Finanças`
        : `${code} é o seu código de acesso em 2 etapas — Farol Finanças`;

  const bodyLead =
    purpose === 'register'
      ? 'Use o código de 6 dígitos abaixo para confirmar seu e-mail e ativar sua conta no Farol Finanças:'
      : purpose === 'reset_password'
        ? 'Recebemos uma solicitação para redefinir a senha da sua conta no Farol Finanças. Use o código de 6 dígitos abaixo para criar uma nova senha:'
        : 'Use o código de verificação em duas etapas (2FA) abaixo para concluir seu login:';

  const footerNote =
    purpose === 'reset_password'
      ? 'Este código é de uso único e expira em <b>10 minutos</b> (máximo de 3 tentativas). Se você não solicitou a redefinição de senha, ignore este e-mail — sua senha atual permanece inalterada.'
      : 'Este código é de uso único e expira em <b>10 minutos</b> (máximo de 3 tentativas). Se você não solicitou este código, ignore este e-mail.';

  const safeName = escapeHtml(sanitizeName(userName, 'usuário'));

  const html = `
    <div style="font-family:'Plus Jakarta Sans',Arial,sans-serif;max-width:480px;margin:0 auto;background:#0d1822;color:#f3f6f8;padding:32px 28px;border-radius:16px;border:1px solid rgba(73,182,235,0.25);">
      <div style="font-size:13px;font-weight:700;color:#49b6eb;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:8px;">Farol Finanças · Segurança</div>
      <h2 style="margin:0 0 12px;font-size:20px;color:#ffffff;">Olá, ${safeName}!</h2>
      <p style="font-size:14px;line-height:1.55;color:#9bb0bd;margin:0 0 22px;">
        ${bodyLead}
      </p>
      <div style="background:#081017;border:1px solid rgba(73,182,235,0.4);border-radius:12px;padding:18px;text-align:center;font-size:32px;font-weight:800;letter-spacing:0.28em;color:#38b6ff;margin-bottom:20px;">
        ${code}
      </div>
      <p style="font-size:12px;color:#7c94a3;margin:0;">
        ${footerNote}
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
      console.error('[Farol Auth] SMTP send error:', err);
      return {
        deliveredByEmail: false,
        providerNote: 'Falha temporária ao enviar código via SMTP.',
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
      console.error('[Farol Auth] Resend error:', res.status, errBody.slice(0, 200));
      return {
        deliveredByEmail: false,
        providerNote: 'Falha temporária ao enviar código por e-mail.',
      };
    } catch (err) {
      console.error('[Farol Auth] Resend network error:', err);
      return {
        deliveredByEmail: false,
        providerNote: 'Falha de comunicação ao enviar e-mail de verificação.',
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
  purpose: OtpPurpose
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

async function checkOtpCooldown(
  prisma: NonNullable<ReturnType<typeof getPrisma>>,
  userId: string
): Promise<NextResponse | null> {
  const lastOtp = await prisma.otpVerification.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  if (!lastOtp) return null;
  const elapsedMs = Date.now() - new Date(lastOtp.createdAt).getTime();
  if (elapsedMs < OTP_COOLDOWN_MS) {
    const waitSec = Math.max(1, Math.ceil((60000 - elapsedMs) / 1000));
    return NextResponse.json(
      {
        ok: false,
        remainingCooldown: waitSec,
        error: `Aguarde ${waitSec}s antes de solicitar um novo código.`,
      },
      { status: 429 }
    );
  }
  return null;
}

export async function GET(req: NextRequest) {
  const prisma = getPrisma();
  const token = req.cookies.get(SESSION_COOKIE)?.value;

  if (!prisma) {
    return NextResponse.json({
      ok: true,
      dbConnected: false,
      authenticated: false,
      user: null,
    });
  }

  try {
    const auth = await verifyAuthenticatedSession(token);
    if (auth.status !== 'ok') {
      return NextResponse.json({
        ok: true,
        dbConnected: true,
        authenticated: false,
        user: null,
      });
    }

    await sanitizeAllWorkspacesOnce(prisma);
    const workspace = await prisma.userWorkspace.findUnique({ where: { id: auth.user.id } });
    let parsedState = workspace ? JSON.parse(workspace.stateJson) : null;
    if (parsedState && typeof parsedState === 'object') {
      const sanitized = sanitizeWorkspaceInstallments(parsedState);
      if (sanitized.changed) {
        parsedState = sanitized.state;
        await prisma.userWorkspace
          .update({
            where: { id: auth.user.id },
            data: { stateJson: JSON.stringify(parsedState) },
          })
          .catch(() => {});
      }
    }

    return NextResponse.json({
      ok: true,
      dbConnected: true,
      authenticated: true,
      user: {
        id: auth.user.id,
        email: auth.user.email,
        name: auth.user.name,
        isAdmin: isAdminEmail(auth.user.email),
      },
      state: parsedState,
    });
  } catch (err) {
    console.error('[Farol Auth GET] Error:', err);
    return NextResponse.json({
      ok: false,
      dbConnected: false,
      authenticated: false,
      error: 'Falha ao validar sessão.',
    });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || '');

  if (action === 'logout') {
    const prisma = getPrisma();
    const currentSession = verifySession(req.cookies.get(SESSION_COOKIE)?.value);
    if (prisma && currentSession?.id) {
      await prisma.userAccount.update({
        where: { id: currentSession.id },
        data: { sessionVersion: { increment: 1 } },
      }).catch(() => {});
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
    });
    return res;
  }

  if (!isSessionSecretConfigured()) {
    return NextResponse.json(
      { ok: false, error: 'AUTH_SECRET não configurada no servidor.' },
      { status: 503 }
    );
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
    const email = String(body.email || '').trim().toLowerCase().slice(0, 160);

    // ============================================================
    // 1. VERIFICAÇÃO DO CÓDIGO OTP DE 6 DÍGITOS (CADASTRO OU LOGIN 2FA)
    // ============================================================
    if (action === 'verify_otp') {
      const code = String(body.code || '').replace(/\D/g, '').trim();
      if (!EMAIL_REGEX.test(email) || code.length !== 6) {
        return NextResponse.json(
          { ok: false, error: 'Digite um e-mail válido e os 6 dígitos do código de verificação.' },
          { status: 400 }
        );
      }

      const account = await prisma.userAccount.findUnique({ where: { email } });
      if (!account) {
        return NextResponse.json({ ok: false, error: 'Código inválido ou expirado.' }, { status: 401 });
      }

      const activeOtp = await prisma.otpVerification.findFirst({
        where: { userId: account.id, used: false, purpose: { in: ['login', 'register'] } },
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

      if (parsedState && typeof parsedState === 'object') {
        const sanitized = sanitizeWorkspaceInstallments(parsedState);
        if (sanitized.changed) {
          parsedState = sanitized.state;
          if (workspace) {
            await prisma.userWorkspace
              .update({
                where: { id: account.id },
                data: { stateJson: JSON.stringify(parsedState) },
              })
              .catch(() => {});
          }
        }
      }

      if (
        !parsedState &&
        activeOtp.purpose !== 'register' &&
        body.state &&
        typeof body.state === 'object' &&
        !Array.isArray(body.state) &&
        hasCustomizedServerState(body.state)
      ) {
        const cleanedSeed = sanitizeWorkspaceInstallments(body.state).state;
        const seedJson = JSON.stringify(cleanedSeed);
        if (seedJson.length <= MAX_STATE_SEED_BYTES) {
          parsedState = cleanedSeed;
          parsedState.userEmail = account.email;
          if (parsedState.profile) parsedState.profile.name = account.name;
          const profile = parsedState.profile || {};
          workspace = await prisma.userWorkspace.upsert({
            where: { id: account.id },
            create: {
              id: account.id,
              email: account.email,
              name: account.name,
              plan: String(profile.plan || 'Plano pessoal').slice(0, 80),
              monthlySalaryCents: Math.round(Number(profile.monthlySalaryCents) || 0),
              salaryDay: Math.min(28, Math.max(1, Number(profile.salaryDay) || 5)),
              monthlyBudgetCents: Math.round(Number(profile.monthlyBudgetCents) || 0),
              emergencyGoalCents: Math.max(0, Math.round(Number(profile.emergencyGoalCents) || 0)),
              theme: parsedState.theme === 'dark' ? 'dark' : 'light',
              hideValues: Boolean(parsedState.privacyMode ?? parsedState.hideValues),
              lastUsedAccountId: typeof parsedState.lastUsedAccountId === 'string' ? parsedState.lastUsedAccountId.slice(0, 64) : null,
              stateJson: JSON.stringify(parsedState),
            },
            update: {
              email: account.email,
              name: account.name,
              stateJson: JSON.stringify(parsedState),
            },
          });
        }
      }

      const token = signSession({
        id: account.id,
        email: account.email,
        name: account.name,
        sv: account.sessionVersion,
      });
      const res = NextResponse.json({
        ok: true,
        step: 'authenticated',
        purpose: activeOtp.purpose,
        user: {
          id: account.id,
          email: account.email,
          name: account.name,
          isAdmin: isAdminEmail(account.email),
        },
        state: parsedState,
      });
      res.cookies.set(SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: Math.floor(SESSION_TTL_MS / 1000),
      });
      return res;
    }

    // ============================================================
    // 2. REENVIO DE CÓDIGO OTP COM COOLDOWN DE 60 SEGUNDOS
    // ============================================================
    if (action === 'resend_otp') {
      if (!EMAIL_REGEX.test(email)) {
        return NextResponse.json({ ok: false, error: 'Informe um e-mail válido.' }, { status: 400 });
      }
      const requestedPurpose = String(body.purpose || '');
      const isResetResend = requestedPurpose === 'reset_password';
      const account = await prisma.userAccount.findUnique({ where: { email } });
      if (!account) {
        if (isResetResend) {
          if (!isEmailProviderConfigured()) {
            return NextResponse.json(
              {
                ok: false,
                emailNotConfigured: true,
                error:
                  'Serviço de envio de e-mail ainda não configurado na Vercel (adicione SMTP_USER + SMTP_PASS ou RESEND_API_KEY em Environment Variables).',
              },
              { status: 503 }
            );
          }
          return NextResponse.json({
            ok: true,
            step: 'verify_otp',
            email,
            purpose: 'reset_password',
            expiresInSeconds: 600,
            cooldownSeconds: 60,
            deliveredByEmail: true,
          });
        }
        return NextResponse.json(
          { ok: false, error: 'Não foi possível reenviar o código para este e-mail.' },
          { status: 400 }
        );
      }

      const cooldownRes = await checkOtpCooldown(prisma, account.id);
      if (cooldownRes) return cooldownRes;

      const purpose: OtpPurpose = isResetResend
        ? 'reset_password'
        : account.verified
          ? 'login'
          : 'register';
      return issueAndDeliverOtp(prisma, account, purpose);
    }

    // ============================================================
    // 2B. ESQUECI MINHA SENHA (SOLICITA CÓDIGO OTP DE REDEFINIÇÃO)
    // ============================================================
    if (action === 'forgot_password') {
      if (!EMAIL_REGEX.test(email)) {
        return NextResponse.json({ ok: false, error: 'Informe um e-mail válido.' }, { status: 400 });
      }

      const account = await prisma.userAccount.findUnique({ where: { email } });
      if (!account) {
        if (!isEmailProviderConfigured()) {
          return NextResponse.json(
            {
              ok: false,
              emailNotConfigured: true,
              error:
                'Serviço de envio de e-mail ainda não configurado na Vercel (adicione SMTP_USER + SMTP_PASS ou RESEND_API_KEY em Environment Variables).',
            },
            { status: 503 }
          );
        }
        // Resposta uniforme para evitar enumeração de contas cadastradas
        return NextResponse.json({
          ok: true,
          step: 'verify_otp',
          email,
          purpose: 'reset_password',
          expiresInSeconds: 600,
          cooldownSeconds: 60,
          deliveredByEmail: true,
        });
      }

      const cooldownRes = await checkOtpCooldown(prisma, account.id);
      if (cooldownRes) return cooldownRes;

      return issueAndDeliverOtp(prisma, account, 'reset_password');
    }

    // ============================================================
    // 2C. REDEFINIR SENHA COM CÓDIGO OTP DE 6 DÍGITOS
    // ============================================================
    if (action === 'reset_password') {
      const code = String(body.code || '').replace(/\D/g, '').trim();
      const newPassword = String(body.newPassword ?? body.password ?? '');

      if (!EMAIL_REGEX.test(email) || code.length !== 6) {
        return NextResponse.json(
          { ok: false, error: 'Digite um e-mail válido e os 6 dígitos do código de recuperação.' },
          { status: 400 }
        );
      }

      if (newPassword.length < 8) {
        return NextResponse.json(
          { ok: false, error: 'A nova senha deve ter pelo menos 8 caracteres.' },
          { status: 400 }
        );
      }

      const account = await prisma.userAccount.findUnique({ where: { email } });
      if (!account) {
        return NextResponse.json({ ok: false, error: 'Código inválido ou expirado.' }, { status: 401 });
      }

      const activeOtp = await prisma.otpVerification.findFirst({
        where: { userId: account.id, used: false, purpose: 'reset_password' },
        orderBy: { createdAt: 'desc' },
      });

      if (!activeOtp) {
        return NextResponse.json(
          { ok: false, error: 'Nenhum código de recuperação ativo ou código já utilizado. Clique em Reenviar código.' },
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

      // Código válido! Consome todos os OTPs pendentes, atualiza senha, desbloqueia conta e revoga sessões antigas
      await prisma.otpVerification.updateMany({
        where: { userId: account.id, used: false },
        data: { used: true },
      });

      const updatedAccount = await prisma.userAccount.update({
        where: { id: account.id },
        data: {
          passwordHash: hashPassword(newPassword),
          verified: true,
          failedLoginAttempts: 0,
          lockedUntil: null,
          sessionVersion: { increment: 1 },
        },
      });

      let workspace = await prisma.userWorkspace.findUnique({ where: { id: updatedAccount.id } });
      let parsedState = workspace ? JSON.parse(workspace.stateJson) : null;

      if (parsedState && isUntouchedDemoServerState(parsedState)) {
        parsedState = null;
        if (workspace) {
          await prisma.userWorkspace.delete({ where: { id: updatedAccount.id } }).catch(() => {});
          workspace = null;
        }
      }

      if (parsedState && typeof parsedState === 'object') {
        const sanitized = sanitizeWorkspaceInstallments(parsedState);
        if (sanitized.changed) {
          parsedState = sanitized.state;
          if (workspace) {
            await prisma.userWorkspace
              .update({
                where: { id: updatedAccount.id },
                data: { stateJson: JSON.stringify(parsedState) },
              })
              .catch(() => {});
          }
        }
      }

      const token = signSession({
        id: updatedAccount.id,
        email: updatedAccount.email,
        name: updatedAccount.name,
        sv: updatedAccount.sessionVersion,
      });

      const res = NextResponse.json({
        ok: true,
        step: 'authenticated',
        purpose: 'reset_password',
        user: {
          id: updatedAccount.id,
          email: updatedAccount.email,
          name: updatedAccount.name,
          isAdmin: isAdminEmail(updatedAccount.email),
        },
        state: parsedState,
      });
      res.cookies.set(SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: Math.floor(SESSION_TTL_MS / 1000),
      });
      return res;
    }

    // ============================================================
    // 3. CADASTRO (CRIA CONTA COM STATUS NÃO VERIFICADA + GERA OTP)
    // ============================================================
    const password = String(body.password || '');
    const name = sanitizeName(body.name, email.split('@')[0] || 'Minha Conta');

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ ok: false, error: 'Informe um e-mail válido.' }, { status: 400 });
    }

    if (action === 'register') {
      if (password.length < 8) {
        return NextResponse.json({ ok: false, error: 'A senha deve ter pelo menos 8 caracteres.' }, { status: 400 });
      }
      const existing = await prisma.userAccount.findUnique({ where: { email } });
      if (existing && existing.verified) {
        return NextResponse.json(
          { ok: false, error: 'Já existe uma conta ativa com este e-mail. Use a opção Fazer Login.' },
          { status: 409 }
        );
      }

      if (existing) {
        const cooldownRes = await checkOtpCooldown(prisma, existing.id);
        if (cooldownRes) return cooldownRes;
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
      if (!password) {
        return NextResponse.json({ ok: false, error: 'E-mail ou senha incorretos.' }, { status: 401 });
      }
      const account = await prisma.userAccount.findUnique({ where: { email } });
      if (!account) {
        return NextResponse.json({ ok: false, error: 'E-mail ou senha incorretos.' }, { status: 401 });
      }

      if (account.lockedUntil && account.lockedUntil > new Date()) {
        return NextResponse.json(
          { ok: false, error: 'Muitas tentativas incorretas. Aguarde alguns minutos para tentar novamente.' },
          { status: 429 }
        );
      }

      if (!verifyPassword(password, account.passwordHash)) {
        const nextFailures = (account.failedLoginAttempts || 0) + 1;
        const lockUntil = nextFailures >= LOGIN_MAX_FAILURES ? new Date(Date.now() + LOGIN_LOCK_MS) : null;
        await prisma.userAccount.update({
          where: { id: account.id },
          data: {
            failedLoginAttempts: lockUntil ? 0 : nextFailures,
            lockedUntil: lockUntil,
          },
        }).catch(() => {});

        return NextResponse.json(
          { ok: false, error: 'E-mail ou senha incorretos.' },
          { status: 401 }
        );
      }

      if (account.failedLoginAttempts > 0 || account.lockedUntil) {
        await prisma.userAccount.update({
          where: { id: account.id },
          data: { failedLoginAttempts: 0, lockedUntil: null },
        }).catch(() => {});
      }

      const cooldownRes = await checkOtpCooldown(prisma, account.id);
      if (cooldownRes) return cooldownRes;

      const purpose: 'register' | 'login' = account.verified ? 'login' : 'register';
      return issueAndDeliverOtp(prisma, account, purpose);
    }

    return NextResponse.json({ ok: false, error: 'Ação inválida.' }, { status: 400 });
  } catch (err) {
    console.error('[Farol Auth POST] Error:', err);
    return NextResponse.json(
      { ok: false, error: 'Erro interno de autenticação.' },
      { status: 500 }
    );
  }
}
