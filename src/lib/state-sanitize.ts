import type { PrismaClient } from '@prisma/client';

export interface SanitizeResult<T = Record<string, unknown>> {
  state: T;
  changed: boolean;
  removedTransactions: number;
  removedRecurrences: number;
  fixedDates: number;
}

interface ParsedInstallment {
  baseTitle: string;
  normalizedBase: string;
  index: number;
  total: number;
}

const INSTALLMENT_DESC_RE = /^(.*?)\s*\((\d{1,2})\s*\/\s*(\d{1,2})\)\s*$/;
const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const YM_RE = /^(\d{4})-(\d{2})$/;

export function normalizeTxText(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function clampIsoDate(dateStr: unknown): string {
  const raw = String(dateStr ?? '').slice(0, 10);
  const m = ISO_DATE_RE.exec(raw);
  if (!m) return raw;
  const year = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  const day = parseInt(m[3], 10);
  if (month < 1 || month > 12) return raw;
  const maxDay = new Date(year, month, 0).getDate();
  const clamped = Math.min(maxDay, Math.max(1, day));
  return `${m[1]}-${m[2]}-${String(clamped).padStart(2, '0')}`;
}

export function addMonthsYM(ym: string, delta: number): string {
  const m = YM_RE.exec(String(ym || ''));
  if (!m) return ym;
  const base = new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1 + delta, 1);
  return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}`;
}

export function monthDiffYM(ymA: string, ymB: string): number {
  const a = YM_RE.exec(String(ymA || ''));
  const b = YM_RE.exec(String(ymB || ''));
  if (!a || !b) return 999;
  return (parseInt(a[1], 10) - parseInt(b[1], 10)) * 12 + (parseInt(a[2], 10) - parseInt(b[2], 10));
}

export function parseInstallmentMeta(tx: Record<string, unknown>): ParsedInstallment | null {
  const desc = String(tx?.description ?? '').trim();
  const match = INSTALLMENT_DESC_RE.exec(desc);
  if (match) {
    const baseTitle = match[1].trim();
    const index = parseInt(match[2], 10);
    const total = parseInt(match[3], 10);
    if (total > 1 && index >= 1 && index <= total) {
      return {
        baseTitle,
        normalizedBase: normalizeTxText(baseTitle),
        index,
        total,
      };
    }
  }

  const idx = Number(tx?.installmentIndex);
  const tot = Number(tx?.installmentTotal);
  if (Number.isInteger(idx) && Number.isInteger(tot) && tot > 1 && idx >= 1 && idx <= tot) {
    return {
      baseTitle: desc,
      normalizedBase: normalizeTxText(desc),
      index: idx,
      total: tot,
    };
  }

  return null;
}

function computeInvoiceYM(
  tx: Record<string, unknown>,
  accountsById: Map<string, Record<string, unknown>>
): string {
  const explicit = typeof tx.invoiceMonth === 'string' && YM_RE.test(tx.invoiceMonth) ? tx.invoiceMonth : null;
  if (explicit) return explicit;
  const dateStr = String(tx.date ?? '');
  const ym = dateStr.slice(0, 7);
  const acc = accountsById.get(String(tx.accountId ?? ''));
  const isCard = tx.method === 'Cartão de Crédito' || acc?.type === 'Cartão de Crédito';
  if (!isCard || !acc || !YM_RE.test(ym)) return ym;
  const day = parseInt(dateStr.split('-')[2] || '1', 10) || 1;
  const closingDay = Number(acc.closingDay) || 5;
  return day > closingDay ? addMonthsYM(ym, 1) : ym;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sanitizeWorkspaceInstallments<T extends Record<string, any>>(inputState: T): SanitizeResult<T> {
  if (!inputState || typeof inputState !== 'object' || Array.isArray(inputState)) {
    return { state: inputState, changed: false, removedTransactions: 0, removedRecurrences: 0, fixedDates: 0 };
  }

  const st = inputState;
  const origTxs: Record<string, unknown>[] = Array.isArray(st.transactions) ? st.transactions : [];
  const origRecs: Record<string, unknown>[] = Array.isArray(st.recurrences) ? st.recurrences : [];
  const accounts: Record<string, unknown>[] = Array.isArray(st.accounts) ? st.accounts : [];

  const accountsById = new Map<string, Record<string, unknown>>();
  for (const acc of accounts) {
    if (acc && typeof acc === 'object' && acc.id) {
      accountsById.set(String(acc.id), acc);
    }
  }

  let changed = false;
  let removedTransactions = 0;
  let removedRecurrences = 0;
  let fixedDates = 0;

  // 1. Clamping de datas inválidas (ex: 2026-02-31 -> 2026-02-28) e deduplicação por ID exato
  const seenIds = new Set<string>();
  const stage1: Record<string, unknown>[] = [];
  for (const rawTx of origTxs) {
    if (!rawTx || typeof rawTx !== 'object') {
      changed = true;
      removedTransactions++;
      continue;
    }
    const tx = { ...rawTx };
    const id = typeof tx.id === 'string' ? tx.id : '';
    if (id) {
      if (seenIds.has(id)) {
        changed = true;
        removedTransactions++;
        continue;
      }
      seenIds.add(id);
    }
    if (typeof tx.date === 'string' && ISO_DATE_RE.test(tx.date.slice(0, 10))) {
      const clamped = clampIsoDate(tx.date);
      if (clamped !== tx.date) {
        tx.date = clamped;
        changed = true;
        fixedDates++;
      }
    }
    const inst = parseInstallmentMeta(tx);
    if (inst) {
      if (Number(tx.installmentIndex) !== inst.index) {
        tx.installmentIndex = inst.index;
        changed = true;
      }
      if (Number(tx.installmentTotal) !== inst.total) {
        tx.installmentTotal = inst.total;
        changed = true;
      }
    }
    stage1.push(tx);
  }

  // 2. Identificar séries parceladas ativas para detectar recorrências acidentais
  interface SeriesSummary {
    accountId: string;
    type: string;
    normalizedBase: string;
    total: number;
    sampleAmountCents: number;
    estimatedTotalCents: number;
    firstIndexMonths: Set<string>;
  }
  const seriesByBaseKey = new Map<string, SeriesSummary[]>();
  const seriesBySeriesKey = new Map<string, SeriesSummary>();

  for (const tx of stage1) {
    const inst = parseInstallmentMeta(tx);
    if (!inst) continue;
    const accId = String(tx.accountId ?? '');
    const type = String(tx.type ?? 'expense');
    const amt = Math.round(Number(tx.amountCents) || 0);
    const ym = String(tx.date ?? '').slice(0, 7);
    const baseKey = `${accId}|${type}|${inst.normalizedBase}`;
    const seriesKey = `${baseKey}|${inst.total}`;

    let summary = seriesBySeriesKey.get(seriesKey);
    if (!summary) {
      summary = {
        accountId: accId,
        type,
        normalizedBase: inst.normalizedBase,
        total: inst.total,
        sampleAmountCents: amt,
        estimatedTotalCents: amt * inst.total,
        firstIndexMonths: new Set<string>(),
      };
      seriesBySeriesKey.set(seriesKey, summary);
      const list = seriesByBaseKey.get(baseKey) || [];
      list.push(summary);
      seriesByBaseKey.set(baseKey, list);
    }
    if (inst.index === 1 && ym) {
      summary.firstIndexMonths.add(ym);
    }
  }

  // 3. Remover recorrências criadas por engano junto com compras parceladas
  const bogusRecIds = new Set<string>();
  const cleanedRecs: Record<string, unknown>[] = [];
  for (const rawRec of origRecs) {
    if (!rawRec || typeof rawRec !== 'object') {
      changed = true;
      removedRecurrences++;
      continue;
    }
    const recId = String(rawRec.id ?? '');
    const recAccId = String(rawRec.accountId ?? '');
    const recType = String(rawRec.type ?? 'expense');
    const recAmt = Math.round(Number(rawRec.amountCents) || 0);
    const recDescNorm = normalizeTxText(rawRec.description);
    const recInst = parseInstallmentMeta(rawRec);
    const lookupNorm = recInst ? recInst.normalizedBase : recDescNorm;

    const matchingSeries = seriesByBaseKey.get(`${recAccId}|${recType}|${lookupNorm}`) || [];
    const matchesInstallmentAmount = matchingSeries.some(
      (s) =>
        Math.abs(recAmt - s.estimatedTotalCents) <= s.total + 2 ||
        Math.abs(recAmt - s.sampleAmountCents) <= 2
    );

    if (matchingSeries.length > 0 && (matchesInstallmentAmount || recInst !== null)) {
      if (recId) bogusRecIds.add(recId);
      changed = true;
      removedRecurrences++;
      continue;
    }

    cleanedRecs.push(rawRec);
  }

  // 4. Remover transações geradas pelas recorrências espúrias (ou órfãs de recorrência de parcelamento) + deduplicar parcelas repetidas
  const activeRecIds = new Set(cleanedRecs.map((r) => String(r.id ?? '')).filter(Boolean));
  const stage2: Record<string, unknown>[] = [];
  const seenInstSameMonth = new Map<string, Record<string, unknown>[]>();
  const seenInstByGroup = new Set<string>();
  const seenInstBySeriesIdx = new Map<string, Record<string, unknown>[]>();
  const seenRecMonth = new Set<string>();

  for (const tx of stage1) {
    const recId = typeof tx.recurrenceId === 'string' ? tx.recurrenceId : '';
    if (recId && bogusRecIds.has(recId)) {
      changed = true;
      removedTransactions++;
      continue;
    }

    // Remove também transações órfãs geradas por uma recorrência já excluída que duplicava um parcelamento
    if (recId && recId !== 'rec-salary' && !activeRecIds.has(recId)) {
      const txAccId = String(tx.accountId ?? '');
      const txType = String(tx.type ?? 'expense');
      const txAmt = Math.round(Number(tx.amountCents) || 0);
      const txNorm = normalizeTxText(tx.description);
      const matchingSeries = seriesByBaseKey.get(`${txAccId}|${txType}|${txNorm}`) || [];
      const matchesSeries = matchingSeries.some(
        (s) =>
          Math.abs(txAmt - s.estimatedTotalCents) <= s.total + 2 ||
          Math.abs(txAmt - s.sampleAmountCents) <= 2
      );
      if (matchesSeries) {
        changed = true;
        removedTransactions++;
        continue;
      }
    }

    const ym = String(tx.date ?? '').slice(0, 7);
    if (recId && ym) {
      const recMonthKey = `${recId}|${ym}`;
      if (seenRecMonth.has(recMonthKey)) {
        changed = true;
        removedTransactions++;
        continue;
      }
      seenRecMonth.add(recMonthKey);
    }

    const inst = parseInstallmentMeta(tx);
    if (inst) {
      const accId = String(tx.accountId ?? '');
      const type = String(tx.type ?? 'expense');
      const amt = Math.round(Number(tx.amountCents) || 0);
      const grpId = typeof tx.installmentGroupId === 'string' && tx.installmentGroupId ? tx.installmentGroupId : '';

      // 4a. Mesmo installmentGroupId + mesmo índice de parcela
      if (grpId) {
        const grpKey = `${grpId}|${inst.index}`;
        if (seenInstByGroup.has(grpKey)) {
          changed = true;
          removedTransactions++;
          continue;
        }
        seenInstByGroup.add(grpKey);
      }

      // 4b. Mesma conta + mesmo mês + mesma descrição base + mesma parcela (k/N) + mesmo valor (±1 centavo)
      const monthKey = `${accId}|${type}|${ym}|${inst.normalizedBase}|${inst.index}|${inst.total}`;
      const sameMonthExisting = seenInstSameMonth.get(monthKey) || [];
      const dupInSameMonth = sameMonthExisting.find(
        (prev) => Math.abs((Number(prev.amountCents) || 0) - amt) <= 1
      );
      if (dupInSameMonth) {
        if (!dupInSameMonth.installmentGroupId && grpId) {
          dupInSameMonth.installmentGroupId = grpId;
        }
        if (!dupInSameMonth.invoiceMonth && tx.invoiceMonth) {
          dupInSameMonth.invoiceMonth = tx.invoiceMonth;
        }
        changed = true;
        removedTransactions++;
        continue;
      }

      // 4c. Mesmo índice (k/N) em mês adjacente (±1 mês) oriundo de importação com data deslocada,
      //     quando só existe no máximo uma série (1/N) para aquela compra
      const seriesKey = `${accId}|${type}|${inst.normalizedBase}|${inst.total}`;
      const seriesSummary = seriesBySeriesKey.get(seriesKey);
      const idxKey = `${seriesKey}|${inst.index}`;
      const sameIdxList = seenInstBySeriesIdx.get(idxKey) || [];
      if (inst.index > 1 && (!seriesSummary || seriesSummary.firstIndexMonths.size <= 1)) {
        const adjacentDup = sameIdxList.find((prev) => {
          const prevAmt = Math.round(Number(prev.amountCents) || 0);
          const prevYM = String(prev.date ?? '').slice(0, 7);
          return Math.abs(prevAmt - amt) <= 1 && Math.abs(monthDiffYM(ym, prevYM)) <= 1;
        });
        if (adjacentDup) {
          // Se sabemos o mês esperado a partir de (1/N) e o novo tx está no mês certo enquanto o anterior não, substitui
          const firstYM = seriesSummary && seriesSummary.firstIndexMonths.size === 1
            ? Array.from(seriesSummary.firstIndexMonths)[0]
            : null;
          const expectedYM = firstYM ? addMonthsYM(firstYM, inst.index - 1) : null;
          const prevYM = String(adjacentDup.date ?? '').slice(0, 7);
          if (expectedYM && ym === expectedYM && prevYM !== expectedYM) {
            const pos = stage2.indexOf(adjacentDup);
            if (pos >= 0) stage2[pos] = tx;
            const listPos = sameIdxList.indexOf(adjacentDup);
            if (listPos >= 0) sameIdxList[listPos] = tx;
          }
          changed = true;
          removedTransactions++;
          continue;
        }
      }

      sameMonthExisting.push(tx);
      seenInstSameMonth.set(monthKey, sameMonthExisting);
      sameIdxList.push(tx);
      seenInstBySeriesIdx.set(idxKey, sameIdxList);
    }

    stage2.push(tx);
  }

  // 5. Deduplicar recorrência gerada no mesmo mês de um lançamento manual idêntico (bug isRecurring sem recurrenceId)
  const manualBySignature = new Map<string, Record<string, unknown>>();
  for (const tx of stage2) {
    if (tx.recurrenceId) continue;
    const ym = String(tx.date ?? '').slice(0, 7);
    const sig = `${tx.accountId ?? ''}|${tx.type ?? 'expense'}|${ym}|${Math.round(Number(tx.amountCents) || 0)}|${normalizeTxText(tx.description)}`;
    if (!manualBySignature.has(sig)) {
      manualBySignature.set(sig, tx);
    }
  }

  const stage3: Record<string, unknown>[] = [];
  for (const tx of stage2) {
    if (typeof tx.recurrenceId === 'string' && tx.recurrenceId && tx.recurrenceId !== 'rec-salary') {
      const ym = String(tx.date ?? '').slice(0, 7);
      const sig = `${tx.accountId ?? ''}|${tx.type ?? 'expense'}|${ym}|${Math.round(Number(tx.amountCents) || 0)}|${normalizeTxText(tx.description)}`;
      const manualMatch = manualBySignature.get(sig);
      if (manualMatch && !manualMatch.recurrenceId) {
        manualMatch.recurrenceId = tx.recurrenceId;
        changed = true;
        removedTransactions++;
        continue;
      }
    }
    stage3.push(tx);
  }

  // 6. Garantir que parcelas consecutivas da mesma compra no cartão não colidam na mesma fatura (ex: dia 31 + fev/28)
  const cardSeriesBuckets = new Map<string, { tx: Record<string, unknown>; inst: ParsedInstallment }[]>();
  for (const tx of stage3) {
    const inst = parseInstallmentMeta(tx);
    if (!inst) continue;
    const acc = accountsById.get(String(tx.accountId ?? ''));
    const isCard = tx.method === 'Cartão de Crédito' || acc?.type === 'Cartão de Crédito';
    if (!isCard || !acc) continue;
    const bucketKey = tx.installmentGroupId
      ? `grp:${tx.installmentGroupId}`
      : `ser:${tx.accountId ?? ''}|${tx.type ?? 'expense'}|${inst.normalizedBase}|${inst.total}`;
    const list = cardSeriesBuckets.get(bucketKey) || [];
    list.push({ tx, inst });
    cardSeriesBuckets.set(bucketKey, list);
  }

  for (const items of cardSeriesBuckets.values()) {
    if (items.length < 2) continue;
    items.sort((a, b) => a.inst.index - b.inst.index);
    const invMonths = items.map((it) => computeInvoiceYM(it.tx, accountsById));
    const hasCollision = new Set(invMonths).size < invMonths.length;
    if (hasCollision) {
      const firstItem = items[0];
      const baseInvYM = computeInvoiceYM(firstItem.tx, accountsById);
      if (YM_RE.test(baseInvYM)) {
        for (const it of items) {
          const expectedYM = addMonthsYM(baseInvYM, it.inst.index - firstItem.inst.index);
          if (it.tx.invoiceMonth !== expectedYM) {
            it.tx.invoiceMonth = expectedYM;
            changed = true;
          }
        }
      }
    }
  }

  if (!changed) {
    return { state: st, changed: false, removedTransactions: 0, removedRecurrences: 0, fixedDates: 0 };
  }

  const nextState = {
    ...st,
    transactions: stage3,
    recurrences: cleanedRecs,
  } as T;

  return {
    state: nextState,
    changed: true,
    removedTransactions,
    removedRecurrences,
    fixedDates,
  };
}

let allWorkspacesSanitizedPromise: Promise<void> | null = null;

export function sanitizeAllWorkspacesOnce(prisma: PrismaClient): Promise<void> {
  if (allWorkspacesSanitizedPromise) return allWorkspacesSanitizedPromise;

  allWorkspacesSanitizedPromise = (async () => {
    try {
      const rows = await prisma.userWorkspace.findMany({
        select: { id: true, stateJson: true },
      });

      for (const row of rows) {
        if (!row.stateJson) continue;
        try {
          const parsed = JSON.parse(row.stateJson);
          if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) continue;
          const result = sanitizeWorkspaceInstallments(parsed);
          if (result.changed) {
            await prisma.userWorkspace.update({
              where: { id: row.id },
              data: { stateJson: JSON.stringify(result.state) },
            });
          }
        } catch {
          // Ignora registro individual malformado para não interromper a limpeza dos demais
        }
      }
    } catch (err) {
      console.warn('[Farol Sanitize] Batch workspace cleanup warning:', err);
      allWorkspacesSanitizedPromise = null;
    }
  })();

  return allWorkspacesSanitizedPromise;
}
