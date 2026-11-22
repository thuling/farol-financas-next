import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { ensureDbSchema } from '@/lib/db-init';
import { SESSION_COOKIE, verifyAuthenticatedSession } from '@/lib/session';
import { sanitizeWorkspaceInstallments, sanitizeAllWorkspacesOnce } from '@/lib/state-sanitize';

const MAX_STATE_BYTES = 2 * 1024 * 1024; // 2 MB cap per workspace snapshot

export async function GET(req: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ ok: false, mode: 'local-fallback', state: null }, { status: 503 });
  }

  const auth = await verifyAuthenticatedSession(req.cookies.get(SESSION_COOKIE)?.value);
  if (auth.status !== 'ok') {
    return NextResponse.json({ ok: false, error: 'Não autenticado.' }, { status: 401 });
  }

  const userId = auth.user.id;

  try {
    await ensureDbSchema(prisma);
    await sanitizeAllWorkspacesOnce(prisma);
    const workspace = await prisma.userWorkspace.findUnique({
      where: { id: userId },
      include: { bankAccounts: true },
    });
    if (!workspace) {
      return NextResponse.json({ ok: true, mode: 'postgres', state: null });
    }

    let parsedState = JSON.parse(workspace.stateJson);
    if (parsedState && typeof parsedState === 'object') {
      parsedState.privacyMode = Boolean(parsedState.privacyMode ?? workspace.hideValues);
      if (
        Array.isArray(workspace.bankAccounts) &&
        workspace.bankAccounts.length > 0 &&
        (!Array.isArray(parsedState.accounts) || parsedState.accounts.length === 0)
      ) {
        parsedState.accounts = workspace.bankAccounts.map((b) => ({
          id: b.accountKey,
          name: b.name,
          type: b.type,
          initialBalanceCents: b.initialBalanceCents,
          limitCents: b.limitCents,
          closingDay: b.closingDay,
          dueDay: b.dueDay,
        }));
      }

      const sanitized = sanitizeWorkspaceInstallments(parsedState);
      if (sanitized.changed) {
        parsedState = sanitized.state;
        await prisma.userWorkspace
          .update({
            where: { id: userId },
            data: { stateJson: JSON.stringify(parsedState) },
          })
          .catch(() => {});
      }
    }

    return NextResponse.json({
      ok: true,
      mode: 'postgres',
      state: parsedState,
    });
  } catch (err) {
    console.error('[Farol State GET] Error:', err);
    return NextResponse.json(
      { ok: false, mode: 'error', error: 'Erro interno ao carregar workspace.' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ ok: false, mode: 'local-fallback' }, { status: 503 });
  }

  const auth = await verifyAuthenticatedSession(req.cookies.get(SESSION_COOKIE)?.value);
  if (auth.status !== 'ok') {
    return NextResponse.json({ ok: false, error: 'Não autenticado.' }, { status: 401 });
  }

  const userId = auth.user.id;

  try {
    await ensureDbSchema(prisma);
    const body = await req.json().catch(() => null);
    const state = body && typeof body === 'object' ? (body as { state?: unknown }).state : null;
    if (!state || typeof state !== 'object' || Array.isArray(state)) {
      return NextResponse.json({ ok: false, error: 'Payload de estado inválido.' }, { status: 400 });
    }

    const sanitizedPut = sanitizeWorkspaceInstallments(state as Record<string, unknown>);
    const st = sanitizedPut.state as Record<string, unknown>;
    const serialized = JSON.stringify(st);
    if (serialized.length > MAX_STATE_BYTES) {
      return NextResponse.json({ ok: false, error: 'Tamanho do estado excede o limite permitido.' }, { status: 413 });
    }

    const profile = (st.profile && typeof st.profile === 'object' ? st.profile : {}) as Record<string, unknown>;
    const themeVal = st.theme === 'dark' ? 'dark' : 'light';
    const lastAcc = typeof st.lastUsedAccountId === 'string' ? st.lastUsedAccountId.slice(0, 64) : null;

    await prisma.userWorkspace.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email: auth.user.email,
        name: String(profile.name || auth.user.name || 'Meu nome').slice(0, 120),
        plan: String(profile.plan || 'Plano pessoal').slice(0, 80),
        monthlySalaryCents: Math.round(Number(profile.monthlySalaryCents) || 0),
        salaryDay: Math.min(28, Math.max(1, Number(profile.salaryDay) || 5)),
        monthlyBudgetCents: Math.round(Number(profile.monthlyBudgetCents) || 0),
        emergencyGoalCents: Math.max(0, Math.round(Number(profile.emergencyGoalCents) || 0)),
        theme: themeVal,
        hideValues: Boolean(st.privacyMode ?? st.hideValues),
        lastUsedAccountId: lastAcc,
        stateJson: serialized,
      },
      update: {
        email: auth.user.email,
        name: String(profile.name || auth.user.name || 'Meu nome').slice(0, 120),
        plan: String(profile.plan || 'Plano pessoal').slice(0, 80),
        monthlySalaryCents: Math.round(Number(profile.monthlySalaryCents) || 0),
        salaryDay: Math.min(28, Math.max(1, Number(profile.salaryDay) || 5)),
        monthlyBudgetCents: Math.round(Number(profile.monthlyBudgetCents) || 0),
        emergencyGoalCents: Math.max(0, Math.round(Number(profile.emergencyGoalCents) || 0)),
        theme: themeVal,
        hideValues: Boolean(st.privacyMode ?? st.hideValues),
        lastUsedAccountId: lastAcc,
        stateJson: serialized,
      },
    });

    // Sincroniza as Contas Bancárias / Cartões do usuário autenticado na tabela BankAccount
    if (Array.isArray(st.accounts)) {
      await prisma.bankAccount.deleteMany({ where: { userId } });
      if (st.accounts.length > 0) {
        await prisma.bankAccount.createMany({
          data: st.accounts.slice(0, 50).map((acc: Record<string, unknown>, idx: number) => {
            const accKey = String(acc?.id || `acc-${idx}`).slice(0, 64);
            return {
              id: `${userId}_${accKey}`,
              accountKey: accKey,
              userId,
              name: String(acc?.name || 'Conta').slice(0, 120),
              type: String(acc?.type || 'Conta + Cartão').slice(0, 48),
              initialBalanceCents: Math.round(Number(acc?.initialBalanceCents) || 0),
              limitCents: Math.round(Number(acc?.limitCents) || 200000),
              closingDay: Math.min(31, Math.max(1, Math.round(Number(acc?.closingDay) || 5))),
              dueDay: Math.min(31, Math.max(1, Math.round(Number(acc?.dueDay) || 12))),
            };
          }),
          skipDuplicates: true,
        });
      }
    }

    return NextResponse.json({ ok: true, mode: 'postgres' });
  } catch (err) {
    console.error('[Farol State PUT] Error:', err);
    return NextResponse.json(
      { ok: false, error: 'Erro interno ao salvar estado.' },
      { status: 500 }
    );
  }
}
