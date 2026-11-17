import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { ensureDbSchema } from '@/lib/db-init';
import { SESSION_COOKIE, verifyAdminRequest } from '@/lib/session';

const ALLOWED_RANGES = new Set(['24h', '7d', '30d', 'all']);

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  transactionsCount: number;
  goalsCount: number;
  accountsCount: number;
  eventsCount: number;
  lastEventAt: string | null;
}

export interface AdminDailyPoint {
  date: string;
  label: string;
  signups: number;
  clicks: number;
}

export interface AdminTopTarget {
  target: string;
  label: string;
  eventType: string;
  count: number;
  uniqueSessions: number;
}

export interface AdminRecentEvent {
  id: string;
  eventType: string;
  target: string;
  label: string;
  tab: string;
  path: string;
  userEmail: string | null;
  sessionId: string;
  createdAt: string;
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const auth = await verifyAdminRequest(token);

  if (auth.status === 'unauthenticated') {
    return NextResponse.json(
      { ok: false, error: 'Faça login com sua conta administradora para acessar este painel.' },
      { status: 401 }
    );
  }
  if (auth.status === 'forbidden') {
    return NextResponse.json(
      { ok: false, error: 'Acesso restrito ao administrador autorizado.' },
      { status: 403 }
    );
  }
  if (auth.status === 'no_database') {
    return NextResponse.json(
      { ok: false, error: 'DATABASE_URL não configurada neste ambiente.' },
      { status: 503 }
    );
  }

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ ok: false, error: 'Banco de dados indisponível.' }, { status: 503 });
  }

  const rawRange = req.nextUrl.searchParams.get('range');
  const range = rawRange ? rawRange.trim() : '7d';
  if (!ALLOWED_RANGES.has(range)) {
    return NextResponse.json({ ok: false, error: 'Parâmetro range inválido.' }, { status: 400 });
  }
  const now = new Date();
  let sinceDate: Date | undefined;
  if (range === '24h') {
    sinceDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  } else if (range === '7d') {
    sinceDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (range === '30d') {
    sinceDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  await ensureDbSchema(prisma);

  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const eventWhere = sinceDate ? { createdAt: { gte: sinceDate } } : {};

  const [
    accounts,
    workspaces,
    totalTxCount,
    totalBankCount,
    otpTotalCount,
    otpUsedCount,
    eventsInRange,
    eventsLast24h,
    recentEvents,
    allRangeEvents,
  ] = await Promise.all([
    prisma.userAccount.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.userWorkspace.findMany({
      select: { id: true, stateJson: true, updatedAt: true },
    }),
    prisma.transaction.count(),
    prisma.bankAccount.count(),
    prisma.otpVerification.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.otpVerification.count({ where: { createdAt: { gte: sevenDaysAgo }, used: true } }),
    prisma.analyticsEvent.count({ where: eventWhere }),
    prisma.analyticsEvent.count({ where: { createdAt: { gte: oneDayAgo } } }),
    prisma.analyticsEvent.findMany({
      where: eventWhere,
      orderBy: { createdAt: 'desc' },
      take: 80,
    }),
    prisma.analyticsEvent.findMany({
      where: eventWhere,
      select: {
        userId: true,
        sessionId: true,
        eventType: true,
        target: true,
        label: true,
        tab: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5000,
    }),
  ]);

  // Index workspaces por userId
  const wsMap = new Map<string, { txCount: number; goalsCount: number; accountsCount: number; updatedAt: Date }>();
  let totalStateGoals = 0;
  let totalStateTx = 0;

  for (const ws of workspaces) {
    let txCount = 0;
    let goalsCount = 0;
    let accountsCount = 0;
    try {
      const parsed = JSON.parse(ws.stateJson || '{}');
      txCount = Array.isArray(parsed.transactions) ? parsed.transactions.length : 0;
      goalsCount = Array.isArray(parsed.goals) ? parsed.goals.length : 0;
      accountsCount = Array.isArray(parsed.accounts) ? parsed.accounts.length : 0;
    } catch {
      // ignora JSON inválido
    }
    totalStateTx += txCount;
    totalStateGoals += goalsCount;
    wsMap.set(ws.id, { txCount, goalsCount, accountsCount, updatedAt: ws.updatedAt });
  }

  // Estatísticas por usuário & cliques
  const userEventStats = new Map<string, { count: number; lastAt: Date | null }>();
  const sessionSet = new Set<string>();
  const targetStats = new Map<string, { target: string; label: string; eventType: string; count: number; sessions: Set<string> }>();
  const tabStats = new Map<string, number>();

  for (const ev of allRangeEvents) {
    sessionSet.add(ev.sessionId);

    if (ev.userId) {
      const cur = userEventStats.get(ev.userId) || { count: 0, lastAt: null };
      cur.count += 1;
      if (!cur.lastAt || ev.createdAt > cur.lastAt) cur.lastAt = ev.createdAt;
      userEventStats.set(ev.userId, cur);
    }

    const key = `${ev.eventType}::${ev.target}`;
    const existingTarget = targetStats.get(key) || {
      target: ev.target,
      label: ev.label || ev.target,
      eventType: ev.eventType,
      count: 0,
      sessions: new Set<string>(),
    };
    existingTarget.count += 1;
    if (ev.label && existingTarget.label === existingTarget.target) {
      existingTarget.label = ev.label;
    }
    existingTarget.sessions.add(ev.sessionId);
    targetStats.set(key, existingTarget);

    if (ev.tab) {
      tabStats.set(ev.tab, (tabStats.get(ev.tab) || 0) + 1);
    }
  }

  // Série dos últimos 14 dias (cadastros + cliques)
  const dailyMap = new Map<string, { signups: number; clicks: number; label: string }>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const iso = d.toISOString().slice(0, 10);
    const label = `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
    dailyMap.set(iso, { signups: 0, clicks: 0, label });
  }
  for (const acc of accounts) {
    if (acc.createdAt >= fourteenDaysAgo) {
      const iso = acc.createdAt.toISOString().slice(0, 10);
      const bucket = dailyMap.get(iso);
      if (bucket) bucket.signups += 1;
    }
  }
  for (const ev of allRangeEvents) {
    if (ev.createdAt >= fourteenDaysAgo) {
      const iso = ev.createdAt.toISOString().slice(0, 10);
      const bucket = dailyMap.get(iso);
      if (bucket) bucket.clicks += 1;
    }
  }

  const users: AdminUserRow[] = accounts.map((acc) => {
    const ws = wsMap.get(acc.id);
    const evStat = userEventStats.get(acc.id);
    return {
      id: acc.id,
      name: acc.name,
      email: acc.email,
      verified: acc.verified,
      createdAt: acc.createdAt.toISOString(),
      updatedAt: (ws?.updatedAt && ws.updatedAt > acc.updatedAt ? ws.updatedAt : acc.updatedAt).toISOString(),
      transactionsCount: ws?.txCount || 0,
      goalsCount: ws?.goalsCount || 0,
      accountsCount: ws?.accountsCount || 0,
      eventsCount: evStat?.count || 0,
      lastEventAt: evStat?.lastAt ? evStat.lastAt.toISOString() : null,
    };
  });

  const topTargets: AdminTopTarget[] = Array.from(targetStats.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)
    .map((item) => ({
      target: item.target,
      label: item.label,
      eventType: item.eventType,
      count: item.count,
      uniqueSessions: item.sessions.size,
    }));

  const topTabs = Array.from(tabStats.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([tab, count]) => ({ tab, count }));

  const dailySeries: AdminDailyPoint[] = Array.from(dailyMap.entries()).map(([date, val]) => ({
    date,
    label: val.label,
    signups: val.signups,
    clicks: val.clicks,
  }));

  const recent: AdminRecentEvent[] = recentEvents.map((ev) => ({
    id: ev.id,
    eventType: ev.eventType,
    target: ev.target,
    label: ev.label,
    tab: ev.tab,
    path: ev.path,
    userEmail: ev.userEmail,
    sessionId: ev.sessionId,
    createdAt: ev.createdAt.toISOString(),
  }));

  const verifiedAccounts = accounts.filter((a) => a.verified).length;
  const newLast7d = accounts.filter((a) => a.createdAt >= sevenDaysAgo).length;

  return NextResponse.json({
    ok: true,
    admin: auth.user,
    range,
    kpis: {
      totalAccounts: accounts.length,
      verifiedAccounts,
      pendingAccounts: accounts.length - verifiedAccounts,
      newLast7d,
      workspacesCount: workspaces.length,
      totalTransactions: Math.max(totalTxCount, totalStateTx),
      totalBankAccounts: totalBankCount,
      totalGoals: totalStateGoals,
      eventsInRange,
      eventsLast24h,
      uniqueSessions: sessionSet.size,
      otpTotal7d: otpTotalCount,
      otpVerified7d: otpUsedCount,
    },
    dailySeries,
    topTargets,
    topTabs,
    users,
    recentEvents: recent,
  });
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const auth = await verifyAdminRequest(token);

  if (auth.status !== 'ok') {
    return NextResponse.json({ ok: false, error: 'Não autorizado.' }, { status: 403 });
  }

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ ok: false, error: 'Banco de dados indisponível.' }, { status: 503 });
  }

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const result = await prisma.analyticsEvent.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  return NextResponse.json({ ok: true, deletedCount: result.count });
}
