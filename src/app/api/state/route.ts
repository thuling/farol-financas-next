import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { ensureDbSchema } from '@/lib/db-init';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId') || 'user-default';
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ ok: false, mode: 'local-fallback', state: null });
  }

  try {
    await ensureDbSchema(prisma);
    const workspace = await prisma.userWorkspace.findUnique({
      where: { id: userId },
      include: { bankAccounts: true },
    });
    if (!workspace) {
      return NextResponse.json({ ok: true, mode: 'postgres', state: null });
    }
    const parsedState = JSON.parse(workspace.stateJson);
    if (parsedState && typeof parsedState === 'object') {
      parsedState.privacyMode = Boolean(parsedState.privacyMode ?? workspace.hideValues);
      if (Array.isArray(workspace.bankAccounts) && workspace.bankAccounts.length > 0 && (!Array.isArray(parsedState.accounts) || parsedState.accounts.length === 0)) {
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
    }
    return NextResponse.json({
      ok: true,
      mode: 'postgres',
      state: parsedState,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, mode: 'local-fallback', error: err instanceof Error ? err.message : 'DB error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ ok: false, mode: 'local-fallback' });
  }

  try {
    await ensureDbSchema(prisma);
    const body = await req.json();
    const userId: string = body.userId || 'user-default';
    const state = body.state;
    if (!state) {
      return NextResponse.json({ ok: false, error: 'Missing state payload' }, { status: 400 });
    }

    const profile = state.profile || {};
    await prisma.userWorkspace.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email: state.userEmail ? String(state.userEmail) : null,
        name: String(profile.name || 'Meu nome'),
        plan: String(profile.plan || 'Plano pessoal'),
        monthlySalaryCents: Math.round(Number(profile.monthlySalaryCents) || 0),
        salaryDay: Math.min(28, Math.max(1, Number(profile.salaryDay) || 5)),
        monthlyBudgetCents: Math.round(Number(profile.monthlyBudgetCents) || 0),
        emergencyGoalCents: Math.round(Number(profile.emergencyGoalCents) || 33000),
        theme: String(state.theme || 'dark'),
        hideValues: Boolean(state.privacyMode ?? state.hideValues),
        lastUsedAccountId: state.lastUsedAccountId || null,
        stateJson: JSON.stringify(state),
      },
      update: {
        email: state.userEmail ? String(state.userEmail) : undefined,
        name: String(profile.name || 'Meu nome'),
        plan: String(profile.plan || 'Plano pessoal'),
        monthlySalaryCents: Math.round(Number(profile.monthlySalaryCents) || 0),
        salaryDay: Math.min(28, Math.max(1, Number(profile.salaryDay) || 5)),
        monthlyBudgetCents: Math.round(Number(profile.monthlyBudgetCents) || 0),
        emergencyGoalCents: Math.round(Number(profile.emergencyGoalCents) || 33000),
        theme: String(state.theme || 'dark'),
        hideValues: Boolean(state.privacyMode ?? state.hideValues),
        lastUsedAccountId: state.lastUsedAccountId || null,
        stateJson: JSON.stringify(state),
      },
    });

    // Sincroniza as Contas Bancárias / Cartões na tabela dedicada BankAccount
    if (Array.isArray(state.accounts)) {
      await prisma.bankAccount.deleteMany({ where: { userId } });
      if (state.accounts.length > 0) {
        await prisma.bankAccount.createMany({
          data: state.accounts.map((acc: Record<string, unknown>, idx: number) => {
            const accKey = String(acc.id || `acc-${idx}`);
            return {
              id: `${userId}_${accKey}`,
              accountKey: accKey,
              userId,
              name: String(acc.name || 'Conta'),
              type: String(acc.type || 'Conta + Cartão'),
              initialBalanceCents: Math.round(Number(acc.initialBalanceCents) || 0),
              limitCents: Math.round(Number(acc.limitCents) || 200000),
              closingDay: Math.min(31, Math.max(1, Math.round(Number(acc.closingDay) || 5))),
              dueDay: Math.min(31, Math.max(1, Math.round(Number(acc.dueDay) || 12))),
            };
          }),
          skipDuplicates: true,
        });
      }
    }

    return NextResponse.json({ ok: true, mode: 'postgres' });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Failed to save state' },
      { status: 500 }
    );
  }
}
