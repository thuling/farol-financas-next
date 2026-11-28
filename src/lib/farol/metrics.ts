import { YM_RE, addMonthsYM, esc, fmtBRL, getTodayISO } from './formatters';

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface CalendarMonthInfo {
  year: number;
  month: number;
  daysInMonth: number;
  elapsedDays: number;
  daysRem: number;
}

export interface CategoryDistributionItem {
  catId: string;
  name: string;
  color: string;
  budgetCents: number;
  prevCents: number;
  totalCents: number;
  pct: number;
  pctLabel: string;
}

export interface MonthMetrics {
  txs: any[];
  allTxs: any[];
  incomeCents: number;
  expenseCents: number;
  partialResultCents: number;
  prevPartialResultCents: number;
  budgetCents: number;
  overBudgetCents: number;
  daysInMonth: number;
  elapsedDays: number;
  daysRem: number;
  overPerDayCents: number;
  distribution: CategoryDistributionItem[];
  totalInvestmentsCents: number;
  weeklyInvDeltaCents: number;
  reserveGoalCents: number;
  reserveCurrentCents: number;
  reservePct: number;
  reserveMonths: number;
}

export interface VisaoGeralInvoiceSummary {
  totalFaturasOpenCents: number;
  totalFaturasPaidCents: number;
  pendingInvoicesDeltaCents: number;
  pendingRecOutCents: number;
  totalLimitCents: number;
  totalUsedLimitCents: number;
  limitUsedPct: number;
  limitBarColor: string;
  cardCount: number;
  primaryCard: any | null;
  dueBadgeText: string;
  dueBadgeTone: string;
  saldoAposPagamentoCents: number;
  projectedCloseCents: number;
}

export interface MonthlyInsightItem {
  tone: 'amber' | 'info' | 'danger' | 'success';
  icon: string;
  title: string;
  desc: string;
}

export interface InsightIconPack {
  alert: string;
  info: string;
  shieldOk: string;
  repeat: string;
  target: string;
  trendUp: string;
  trendDown: string;
}

export function getInvoiceMetaFromState(
  state: Record<string, any> | null | undefined,
  accId: string,
  ym?: string
): { status: string; adjustmentCents: number; [key: string]: any } {
  const targetYM = ym || state?.selectedMonth || '2026-11';
  const key = `${targetYM}_${accId}`;
  return (state?.invoiceMeta && state.invoiceMeta[key]) || { status: 'open', adjustmentCents: 0 };
}

export function getInvoiceMonthForTransaction(
  tx: Record<string, any> | null | undefined,
  account: Record<string, any> | null | undefined,
  fallbackYM = '2026-11'
): string {
  if (tx && typeof tx.invoiceMonth === 'string' && YM_RE.test(tx.invoiceMonth)) {
    return tx.invoiceMonth;
  }
  const ym = String(tx?.date || fallbackYM).slice(0, 7);
  const isCard = tx?.method === 'Cartão de Crédito' || account?.type === 'Cartão de Crédito';
  if (!isCard || !account) return ym;
  const day = parseInt(String(tx?.date || '2026-11-01').split('-')[2], 10) || 1;
  const closingDay = Number(account.closingDay) || 5;
  return day > closingDay ? addMonthsYM(ym, 1) : ym;
}

export function getAccountBalanceCents(
  acc: Record<string, any>,
  transactions: Record<string, any>[] = []
): number {
  let bal = Number(acc?.initialBalanceCents) || 0;
  for (const t of transactions) {
    if (!t || t.accountId !== acc?.id) continue;
    if (t.type === 'income') {
      bal += Number(t.amountCents) || 0;
    } else if (t.method !== 'Cartão de Crédito' && acc?.type !== 'Cartão de Crédito') {
      bal -= Number(t.amountCents) || 0;
    }
  }
  return bal;
}

export function getCategoriesSortedByUsage(
  categories: Record<string, any>[] = [],
  transactions: Record<string, any>[] = []
): Record<string, any>[] {
  const counts: Record<string, number> = {};
  for (const t of transactions) {
    if (!t) continue;
    counts[t.categoryId] = (counts[t.categoryId] || 0) + 1;
  }
  return categories
    .filter((c) => c && !c.archived)
    .sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0));
}

export function getMonthTransactions(
  transactions: Record<string, any>[] = [],
  ym = '2026-11'
): Record<string, any>[] {
  return transactions
    .filter((t) => t && typeof t.date === 'string' && t.date.startsWith(ym))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

export function getCalendarMonthInfo(ym = '2026-11', todayISO = getTodayISO()): CalendarMonthInfo {
  const [yStr, mStr] = (ym || '2026-11').split('-');
  const year = parseInt(yStr, 10) || 2026;
  const month = parseInt(mStr, 10) || 11;
  const daysInMonth = new Date(year, month, 0).getDate();
  const todayYM = todayISO.slice(0, 7);
  const todayDay = parseInt(todayISO.split('-')[2] || '12', 10);

  let elapsedDays = 12;
  let daysRem = 18;
  if (ym === todayYM) {
    elapsedDays = Math.min(daysInMonth, Math.max(1, todayDay));
    daysRem = Math.max(1, daysInMonth - elapsedDays);
  } else if (ym < todayYM) {
    elapsedDays = daysInMonth;
    daysRem = 0;
  } else {
    elapsedDays = Math.min(12, daysInMonth);
    daysRem = Math.max(1, daysInMonth - 12);
  }
  return { year, month, daysInMonth, elapsedDays, daysRem };
}

export function isInternalTransferTx(t: Record<string, any> | null | undefined): boolean {
  if (!t) return false;
  return Boolean(
    t.isInvoicePayment ||
      t.isAssetTransfer ||
      t.method === 'Pagamento de Fatura' ||
      t.method === 'Aporte / Investimento' ||
      t.method === 'Resgate / Investimento'
  );
}

export function computeMonthMetrics(
  state: Record<string, any>,
  ym?: string,
  todayISO = getTodayISO()
): MonthMetrics {
  const targetYM = ym || state?.selectedMonth || '2026-11';
  const allStateTxs: any[] = Array.isArray(state?.transactions) ? state.transactions : [];
  const categories: any[] = Array.isArray(state?.categories) ? state.categories : [];
  const assets: any[] = Array.isArray(state?.assets) ? state.assets : [];
  const recurrences: any[] = Array.isArray(state?.recurrences) ? state.recurrences : [];
  const profile = state?.profile || {};

  const findCat = (id: string) =>
    categories.find((c) => c && c.id === id) || { name: 'Outros', color: '#8fa3b0', rules: [], archived: false };

  const txs = getMonthTransactions(allStateTxs, targetYM);
  const operationalTxs = txs.filter((t) => !isInternalTransferTx(t));
  const incomeCents = operationalTxs
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + (Number(t.amountCents) || 0), 0);
  const expenseCents = operationalTxs
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + (Number(t.amountCents) || 0), 0);
  const partialResultCents = incomeCents - expenseCents;

  const cal = getCalendarMonthInfo(targetYM, todayISO);
  const daysInMonth = cal.daysInMonth;
  const elapsedDays = cal.elapsedDays;
  const daysRem = cal.daysRem;

  const budgetCents = Number(profile.monthlyBudgetCents) || 0;
  const overBudgetCents = Math.max(0, expenseCents - budgetCents);
  const overPerDayCents = daysRem > 0 ? Math.round(overBudgetCents / daysRem) : overBudgetCents;

  const byCategoryMap: Record<string, number> = {};
  operationalTxs
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      byCategoryMap[t.categoryId] = (byCategoryMap[t.categoryId] || 0) + (Number(t.amountCents) || 0);
    });

  const prevYM = addMonthsYM(targetYM, -1);
  const prevCatMap: Record<string, number> = {};
  const prevTxs = getMonthTransactions(allStateTxs, prevYM).filter((t) => !isInternalTransferTx(t));
  const prevIncomeCents = prevTxs
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + (Number(t.amountCents) || 0), 0);
  const prevExpenseCents = prevTxs
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + (Number(t.amountCents) || 0), 0);
  const prevPartialResultCents = prevIncomeCents - prevExpenseCents;

  prevTxs
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      prevCatMap[t.categoryId] = (prevCatMap[t.categoryId] || 0) + (Number(t.amountCents) || 0);
    });

  const distribution: CategoryDistributionItem[] = Object.entries(byCategoryMap)
    .map(([catId, totalCents]) => {
      const cat = findCat(catId);
      const rawPct = expenseCents > 0 ? (totalCents / expenseCents) * 100 : 0;
      const pct = Math.round(rawPct);
      const pctLabel = rawPct % 1 === 0 ? `${pct}%` : `${rawPct.toFixed(1).replace('.', ',')}%`;
      return {
        catId,
        name: cat.name,
        color: cat.color,
        budgetCents: Number(cat.budgetCents) || 0,
        prevCents: prevCatMap[catId] || 0,
        totalCents,
        pct,
        pctLabel,
      };
    })
    .sort((a, b) => b.totalCents - a.totalCents);

  const totalInvestmentsCents = assets.reduce((acc, a) => acc + (Number(a?.amountCents) || 0), 0);
  const weeklyInvDeltaCents = assets.reduce((acc, a) => acc + (Number(a?.weeklyDeltaCents) || 0), 0);

  const liquidReserveAssets = assets.filter((a) => {
    if (!a) return false;
    const liq = a.liquidity || 'Diária';
    const isLiquid = liq === 'Diária' || liq === 'D+1';
    const isVolatile = a.category === 'Cripto' || a.category === 'Ações' || a.category === 'FIIs';
    return isLiquid && !isVolatile;
  });
  const reserveGoalCents = Math.max(0, Number(profile.emergencyGoalCents) || 0);
  const reserveCurrentCents = Math.max(
    0,
    liquidReserveAssets.reduce((s, a) => s + (Number(a.amountCents) || 0), 0)
  );
  const reservePct =
    reserveGoalCents > 0 ? Math.min(100, Math.round((reserveCurrentCents / reserveGoalCents) * 100)) : 0;

  const fixedActiveOutCents = recurrences
    .filter((r) => r && r.active && r.type !== 'income')
    .reduce((s, r) => s + (Number(r.amountCents) || 0), 0);
  const monthlyLivingCostCents = Math.max(
    1,
    expenseCents > 0
      ? expenseCents
      : fixedActiveOutCents > 0
        ? fixedActiveOutCents
        : budgetCents > 0
          ? budgetCents
          : Math.round(reserveGoalCents / 6)
  );
  const reserveMonths = reserveCurrentCents / monthlyLivingCostCents;

  return {
    txs: operationalTxs,
    allTxs: txs,
    incomeCents,
    expenseCents,
    partialResultCents,
    prevPartialResultCents,
    budgetCents,
    overBudgetCents,
    daysInMonth,
    elapsedDays,
    daysRem,
    overPerDayCents,
    distribution,
    totalInvestmentsCents,
    weeklyInvDeltaCents,
    reserveGoalCents,
    reserveCurrentCents,
    reservePct,
    reserveMonths,
  };
}

export function computeVisaoGeralInvoiceSummary(
  state: Record<string, any>,
  m: MonthMetrics,
  todayISO = getTodayISO()
): VisaoGeralInvoiceSummary {
  const ym = state?.selectedMonth || todayISO.slice(0, 7);
  const [selY, selM] = ym.split('-').map(Number);
  const maxDayInMonth = new Date(selY || 2026, selM || 11, 0).getDate();
  const [tY, tM, tD] = todayISO.split('-').map(Number);
  const todayMidday = new Date(tY || 2026, (tM || 11) - 1, tD || 1, 12, 0, 0);

  let totalFaturasOpenCents = 0;
  let totalFaturasPaidCents = 0;
  let pendingInvoicesDeltaCents = 0;
  let totalLimitCents = 0;
  let totalUsedLimitCents = 0;

  const allAccounts: any[] = Array.isArray(state?.accounts) ? state.accounts : [];
  const allTxs: any[] = Array.isArray(state?.transactions) ? state.transactions : [];
  const cardAccounts = allAccounts.filter(
    (a) => a && (a.type === 'Cartão de Crédito' || a.type === 'Conta + Cartão' || Number(a.limitCents) > 0)
  );
  const effectiveCards = cardAccounts.length > 0 ? cardAccounts : allAccounts;

  let primaryCard = effectiveCards[0] || null;
  let primaryOpenCents = -1;
  let hasAnyUnpaid = false;

  allAccounts.forEach((acc) => {
    if (!acc) return;
    const meta = getInvoiceMetaFromState(state, acc.id, ym);
    const invTxs = allTxs.filter((t) => {
      if (!t || t.accountId !== acc.id || t.type !== 'expense') return false;
      if (t.method !== 'Cartão de Crédito' && acc.type !== 'Cartão de Crédito') return false;
      return getInvoiceMonthForTransaction(t, acc, ym) === ym;
    });
    const txSum = invTxs.reduce((s, t) => s + (Number(t.amountCents) || 0), 0);
    const adjCents = Number(meta.adjustmentCents) || 0;
    const invTotal = Math.max(0, txSum + adjCents);

    const futureCents = allTxs
      .filter((t) => {
        if (!t || t.accountId !== acc.id || t.type !== 'expense') return false;
        if (t.method !== 'Cartão de Crédito' && acc.type !== 'Cartão de Crédito') return false;
        return getInvoiceMonthForTransaction(t, acc, ym) > ym;
      })
      .reduce((s, t) => s + (Number(t.amountCents) || 0), 0);

    const isCardCapable =
      acc.type === 'Cartão de Crédito' || acc.type === 'Conta + Cartão' || Number(acc.limitCents) > 0;
    if (isCardCapable) {
      totalLimitCents += Math.max(0, Number(acc.limitCents) || 0);
      totalUsedLimitCents += (meta.status === 'paid' ? 0 : invTotal) + futureCents;
    }

    if (meta.status === 'paid') {
      totalFaturasPaidCents += invTotal;
    } else {
      hasAnyUnpaid = true;
      totalFaturasOpenCents += invTotal;
      const carryoverTxCents = invTxs
        .filter((t) => !(t.date || '').startsWith(ym))
        .reduce((s, t) => s + (Number(t.amountCents) || 0), 0);
      pendingInvoicesDeltaCents += carryoverTxCents + Math.max(0, adjCents);

      if (isCardCapable && invTotal > primaryOpenCents) {
        primaryOpenCents = invTotal;
        primaryCard = acc;
      }
    }
  });

  const pendingRecOutCents = (Array.isArray(state?.recurrences) ? state.recurrences : [])
    .filter((r: any) => r && r.active && r.type !== 'income')
    .filter((r: any) => !allTxs.some((t) => t.recurrenceId === r.id && (t.date || '').startsWith(ym)))
    .reduce((s: number, r: any) => s + Math.max(0, Number(r.amountCents) || 0), 0);

  let dueBadgeText = 'Sem cartão';
  let dueBadgeTone = 'is-neutral';
  if (primaryCard) {
    const clampedDueDay = Math.min(maxDayInMonth, Math.max(1, Number(primaryCard.dueDay) || 12));
    const dueDateStr = `${String(clampedDueDay).padStart(2, '0')}/${String(selM || 11).padStart(2, '0')}`;
    const dueMidday = new Date(selY || 2026, (selM || 11) - 1, clampedDueDay, 12, 0, 0);
    const diffDays = Math.round((dueMidday.getTime() - todayMidday.getTime()) / 86400000);

    if (!hasAnyUnpaid && totalFaturasPaidCents > 0) {
      dueBadgeText = `Paga · ${dueDateStr}`;
      dueBadgeTone = 'is-paid';
    } else if (diffDays < 0) {
      dueBadgeText = `Venceu há ${Math.abs(diffDays)}d · ${dueDateStr}`;
      dueBadgeTone = totalFaturasOpenCents > 0 ? 'is-danger' : 'is-neutral';
    } else if (diffDays === 0) {
      dueBadgeText = `Vence hoje · ${dueDateStr}`;
      dueBadgeTone = totalFaturasOpenCents > 0 ? 'is-danger' : 'is-warning';
    } else if (diffDays === 1) {
      dueBadgeText = `Vence amanhã · ${dueDateStr}`;
      dueBadgeTone = 'is-warning';
    } else {
      dueBadgeText = `Vence em ${diffDays} dias · ${dueDateStr}`;
      dueBadgeTone = diffDays <= 5 && totalFaturasOpenCents > 0 ? 'is-warning' : 'is-neutral';
    }
  }

  const limitUsedPct =
    totalLimitCents > 0 ? Math.min(100, Math.round((totalUsedLimitCents / totalLimitCents) * 100)) : 0;
  const limitBarColor =
    limitUsedPct > 90
      ? 'var(--coral-red)'
      : limitUsedPct > 70
        ? 'var(--amber-gold)'
        : 'var(--azure-primary)';

  const cashExpensesCents = m.txs
    .filter((t) => t.type === 'expense' && t.method !== 'Cartão de Crédito')
    .reduce((s, t) => s + (Number(t.amountCents) || 0), 0);
  const saldoAposPagamentoCents =
    m.incomeCents - cashExpensesCents - totalFaturasOpenCents - totalFaturasPaidCents;
  const projectedCloseCents = m.partialResultCents - pendingInvoicesDeltaCents - pendingRecOutCents;

  return {
    totalFaturasOpenCents,
    totalFaturasPaidCents,
    pendingInvoicesDeltaCents,
    pendingRecOutCents,
    totalLimitCents,
    totalUsedLimitCents,
    limitUsedPct,
    limitBarColor,
    cardCount: cardAccounts.length,
    primaryCard,
    dueBadgeText,
    dueBadgeTone,
    saldoAposPagamentoCents,
    projectedCloseCents,
  };
}

export function buildMonthlyInsightsList(
  state: Record<string, any>,
  m: MonthMetrics,
  icons: InsightIconPack
): MonthlyInsightItem[] {
  const list: MonthlyInsightItem[] = [];
  const topCat = m.distribution[0];

  if (topCat) {
    list.push({
      tone: 'amber',
      icon: icons.alert,
      title: `${esc(topCat.name)} concentra ${topCat.pct}% dos gastos`,
      desc: `Total de ${fmtBRL(topCat.totalCents)} registrado em ${esc(topCat.name)} neste período. Acompanhe o limite diário para equilibrar o mês.`,
    });
  } else {
    list.push({
      tone: 'amber',
      icon: icons.alert,
      title: 'Seus gastos estão sob controle',
      desc: 'Adicione suas receitas e despesas para receber leituras automáticas do seu comportamento financeiro.',
    });
  }

  const remainingBudgetCents = m.budgetCents - m.expenseCents;
  if (m.budgetCents <= 0) {
    list.push({
      tone: 'info',
      icon: icons.info,
      title: 'Defina um orçamento mensal',
      desc: `Configure seu teto no perfil para calcular o ritmo diário seguro nos próximos ${m.daysRem} ${m.daysRem === 1 ? 'dia' : 'dias'}.`,
    });
  } else if (remainingBudgetCents < 0) {
    const overAbs = Math.abs(remainingBudgetCents);
    list.push({
      tone: 'danger',
      icon: icons.alert,
      title: `Orçamento estourado em ${fmtBRL(overAbs)}`,
      desc:
        m.daysRem > 0
          ? `Você passou dos ${fmtBRL(m.budgetCents)} previstos com ${m.daysRem} ${m.daysRem === 1 ? 'dia restante' : 'dias restantes'} no mês.`
          : `Você ultrapassou o orçamento mensal de ${fmtBRL(m.budgetCents)} neste período.`,
    });
  } else if (m.daysRem <= 0) {
    list.push({
      tone: 'success',
      icon: icons.shieldOk,
      title: `Orçamento livre: ${fmtBRL(remainingBudgetCents)}`,
      desc: `Período encerrado dentro do orçamento mensal de ${fmtBRL(m.budgetCents)}.`,
    });
  } else {
    const safeDailyCents = Math.floor(remainingBudgetCents / m.daysRem);
    list.push({
      tone: 'success',
      icon: icons.shieldOk,
      title: `Orçamento livre: ${fmtBRL(safeDailyCents)}/dia`,
      desc: `Para fechar dentro dos ${fmtBRL(m.budgetCents)} nos próximos ${m.daysRem} ${m.daysRem === 1 ? 'dia' : 'dias'}.`,
    });
  }

  const fixedRecOutCents = (Array.isArray(state?.recurrences) ? state.recurrences : [])
    .filter((r: any) => r && r.active && r.type !== 'income')
    .reduce((s: number, r: any) => s + Math.max(0, Number(r.amountCents) || 0), 0);
  if (fixedRecOutCents > 0) {
    const fixedPct = m.incomeCents > 0 ? Math.round((fixedRecOutCents / m.incomeCents) * 100) : null;
    list.push({
      tone: 'info',
      icon: icons.repeat,
      title: `Custo fixo ativo: ${fmtBRL(fixedRecOutCents)}/mês`,
      desc:
        fixedPct !== null
          ? `Compromete ${fixedPct}% das suas entradas registradas no mês.`
          : 'Total automático das despesas recorrentes ativas neste período.',
    });
  }

  if (m.reserveGoalCents > 0 && m.reservePct < 100) {
    const missingReserve = Math.max(0, m.reserveGoalCents - m.reserveCurrentCents);
    list.push({
      tone: 'info',
      icon: icons.target,
      title: `Reserva em ${m.reservePct}% da meta`,
      desc: `Faltam ${fmtBRL(missingReserve)} para completar sua meta de proteção de ${fmtBRL(m.reserveGoalCents)}.`,
    });
  } else if (m.prevPartialResultCents !== 0) {
    const diffPrev = m.partialResultCents - m.prevPartialResultCents;
    list.push({
      tone: diffPrev >= 0 ? 'success' : 'amber',
      icon: diffPrev >= 0 ? icons.trendUp : icons.trendDown,
      title:
        diffPrev >= 0
          ? `Saldo ${fmtBRL(diffPrev)} acima do mês anterior`
          : `Saldo ${fmtBRL(Math.abs(diffPrev))} abaixo do mês anterior`,
      desc: `Resultado atual de ${fmtBRL(m.partialResultCents)} frente a ${fmtBRL(m.prevPartialResultCents)} no período anterior.`,
    });
  }

  return list;
}
