import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId') || 'user-default';
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ ok: false, mode: 'local-fallback', state: null });
  }

  try {
    const workspace = await prisma.userWorkspace.findUnique({ where: { id: userId } });
    if (!workspace) {
      return NextResponse.json({ ok: true, mode: 'postgres', state: null });
    }
    const parsedState = JSON.parse(workspace.stateJson);
    if (parsedState && typeof parsedState === 'object') {
      parsedState.privacyMode = Boolean(parsedState.privacyMode ?? workspace.hideValues);
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

    return NextResponse.json({ ok: true, mode: 'postgres' });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Failed to save state' },
      { status: 500 }
    );
  }
}
