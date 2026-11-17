/* ============================================================
   FAROL FINANÇAS — Motor Completo (Centavos Inteiros & Etapa 1)
   ============================================================ */

const USERS_INDEX_KEY = 'farol_financas_users_v2';
const LEGACY_V1_KEY = 'farol_financas_state_v1';

function getTodayISO() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getDefaultDateForSelectedMonth() {
  const today = getTodayISO();
  const selYM = state?.selectedMonth || '2026-11';
  if (today.startsWith(selYM)) return today;
  const day = String(Math.min(28, new Date().getDate())).padStart(2, '0');
  return `${selYM}-${day}`;
}

function toCents(val) {
  if (typeof val === 'number') return Math.round(val * 100);
  const s = String(val ?? '').trim().replace(/[^\d.,-]/g, '');
  if (!s) return 0;
  let normalized = s;
  if (s.includes(',') && s.includes('.')) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      normalized = s.replace(/\./g, '').replace(',', '.');
    } else {
      normalized = s.replace(/,/g, '');
    }
  } else if (s.includes(',')) {
    normalized = s.replace(',', '.');
  }
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : Math.round(num * 100);
}

function fromCents(cents) {
  return (Number(cents) || 0) / 100;
}

function fmtBRL(cents, showPlus = false) {
  const num = Math.round(Number(cents) || 0);
  const absFormatted = (Math.abs(num) / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  if (num < 0) return `-R$ ${absFormatted}`;
  if (num > 0 && showPlus) return `+R$ ${absFormatted}`;
  return `R$ ${absFormatted}`;
}

function fmtDateBR(isoDate) {
  if (!isoDate || !isoDate.includes('-')) return isoDate || '';
  return isoDate.split('-').reverse().join('/');
}

function fmtMonthLabel(ym) {
  const [y, m] = (ym || '2026-11').split('-').map(Number);
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return `${months[(m || 1) - 1]} de ${y}`;
}

function addMonthsYM(ym, delta) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, (m - 1) + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ============================================================
// ISOLAMENTO POR USUÁRIO & ESTADO EM CENTAVOS
// ============================================================
function getUsersIndex() {
  if (typeof window === 'undefined') {
    return {
      activeUserId: 'user-default',
      users: [{ id: 'user-default', name: 'Meu nome' }]
    };
  }
  try {
    const raw = window.localStorage.getItem(USERS_INDEX_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {
    activeUserId: 'user-default',
    users: [{ id: 'user-default', name: 'Meu nome' }]
  };
}

function saveUsersIndex(index) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(USERS_INDEX_KEY, JSON.stringify(index));
  } catch (e) {}
}

function getUserStorageKey(userId) {
  return `farol_financas_data_v2_${userId}`;
}

function getDefaultState(userName = 'Meu nome') {
  return {
    selectedMonth: '2026-11',
    currentTab: 'visao-geral',
    accumulatedSubTab: 'gastos',
    privacyMode: false,
    theme: 'dark',
    lastUsedAccountId: 'acc-nubank',
    profile: {
      name: userName,
      plan: 'Plano pessoal',
      monthlyBudgetCents: 0,
      emergencyGoalCents: 33000,
      monthlySalaryCents: 0,
      salaryDay: 5,
      daysRemaining: 18
    },
    categories: [
      { id: 'cat-internet', name: 'Internet & Telefonia', color: '#06b6d4', budgetCents: 15000, rules: ['internet', 'fibra', 'wifi', 'vivo', 'claro', 'tim', 'oi', 'celular', 'recarga', 'banda larga'], archived: false },
      { id: 'cat-moradia', name: 'Moradia & Contas', color: '#a78bfa', budgetCents: 120000, rules: ['aluguel', 'condominio', 'luz', 'energia', 'agua', 'gas', 'iptu', 'reforma', 'manutencao'], archived: false },
      { id: 'cat-mercado', name: 'Mercado & Casa', color: '#38b6ff', budgetCents: 60000, rules: ['mercado', 'supermercado', 'carrefour', 'assai', 'atacadao', 'padaria', 'hortifruti', 'acougue', 'limpeza'], archived: false },
      { id: 'cat-delivery', name: 'Delivery & Restaurantes', color: '#f16364', budgetCents: 20000, rules: ['ifood', 'rappi', 'delivery', 'pizza', 'lanche', 'restaurante', 'cafe', 'almoco', 'jantar', 'hamburguer'], archived: false },
      { id: 'cat-transporte', name: 'Transporte & Combustível', color: '#f59e0b', budgetCents: 30000, rules: ['uber', '99', 'gasolina', 'etanol', 'posto', 'metro', 'onibus', 'estacionamento', 'pedagio', 'ipva', 'mecanico'], archived: false },
      { id: 'cat-assinaturas', name: 'Assinaturas & Apps', color: '#6366f1', budgetCents: 12000, rules: ['netflix', 'spotify', 'youtube', 'prime', 'disney', 'icloud', 'google one', 'chatgpt', 'gemini', 'adobe', 'assinatura'], archived: false },
      { id: 'cat-saude', name: 'Saúde & Farmácia', color: '#10b981', budgetCents: 25000, rules: ['farmacia', 'drogaria', 'medico', 'consulta', 'exame', 'dentista', 'plano de saude', 'remedio', 'terapia', 'academia'], archived: false },
      { id: 'cat-educacao', name: 'Educação & Cursos', color: '#3b82f6', budgetCents: 20000, rules: ['curso', 'faculdade', 'escola', 'livro', 'udemy', 'alura', 'ingles', 'mensalidade', 'material escolar'], archived: false },
      { id: 'cat-compras', name: 'Compras & Vestuário', color: '#fb923c', budgetCents: 25000, rules: ['amazon', 'mercado livre', 'shopee', 'shein', 'roupa', 'tenis', 'shopping', 'eletronico', 'loja'], archived: false },
      { id: 'cat-lazer', name: 'Lazer & Entretenimento', color: '#ec4899', budgetCents: 25000, rules: ['cinema', 'show', 'bar', 'festa', 'ingresso', 'jogo', 'steam', 'playstation', 'xbox', 'passeio'], archived: false },
      { id: 'cat-viagem', name: 'Viagens & Hospedagem', color: '#14b8a6', budgetCents: 30000, rules: ['hotel', 'airbnb', 'passagem', 'aerea', 'voo', 'rodoviaria', 'malas', 'turismo', 'viagem'], archived: false },
      { id: 'cat-pets', name: 'Pets', color: '#eab308', budgetCents: 15000, rules: ['pet', 'racao', 'veterinario', 'petshop', 'banho e tosa', 'cobasi', 'petz'], archived: false },
      { id: 'cat-presentes', name: 'Presentes & Doações', color: '#f43f5e', budgetCents: 10000, rules: ['presente', 'aniversario', 'floricultura', 'doacao', 'igreja', 'casamento', 'lembranca'], archived: false },
      { id: 'cat-impostos', name: 'Impostos & Taxas', color: '#64748b', budgetCents: 15000, rules: ['imposto', 'darf', 'inss', 'mei', 'das', 'taxa', 'tarifa', 'anuidade', 'cartorio', 'multa'], archived: false },
      { id: 'cat-invest', name: 'Investimentos & Reserva', color: '#22c55e', budgetCents: 50000, rules: ['cdb', 'tesouro', 'fii', 'acao', 'corretora', 'reserva', 'poupanca', 'aporte'], archived: false },
      { id: 'cat-receita', name: 'Salário / Receitas', color: '#34d399', budgetCents: 0, rules: ['salario', 'pix recebido', 'freela', 'rendimento', 'reembolso', 'bonus', 'decimo terceiro', 'ferias'], archived: false }
    ],
    accounts: [
      { id: 'acc-nubank', name: 'Conta Principal', type: 'Conta Corrente', initialBalanceCents: 0, limitCents: 250000, closingDay: 5, dueDay: 12 },
      { id: 'acc-inter', name: 'Cartão Black', type: 'Cartão de Crédito', initialBalanceCents: 0, limitCents: 500000, closingDay: 10, dueDay: 17 }
    ],
    transactions: [
      {
        id: 'tx-initial-1',
        type: 'expense',
        amountCents: 5500,
        description: 'Pedido Delivery',
        tag: '',
        categoryId: 'cat-delivery',
        accountId: 'acc-nubank',
        date: '2026-11-09',
        method: 'Conta Corrente / Pix'
      }
    ],
    recurrences: [
      { id: 'rec-1', description: 'Internet Fibra', amountCents: 9990, type: 'expense', categoryId: 'cat-moradia', day: 15, active: false },
      { id: 'rec-2', description: 'Streaming Música', amountCents: 2190, type: 'expense', categoryId: 'cat-lazer', day: 20, active: false }
    ],
    goals: [
      { id: 'goal-1', title: 'Reserva de Emergência', currentCents: 0, targetCents: 33000, deadline: '2027-06', color: '#f59e0b' },
      { id: 'goal-2', title: 'Viagem de Férias', currentCents: 45000, targetCents: 300000, deadline: '2027-12', color: '#38b6ff' }
    ],
    assets: [
      {
        id: 'ast-1',
        name: 'CDB Liquidez Diária',
        category: 'Renda Fixa (CDB)',
        institution: 'Conta Principal',
        liquidity: 'Diária',
        cdbPercent: 100,
        amountCents: 0,
        weeklyDeltaCents: 0
      }
    ],
    cdiRate: 11.25,
    invoiceMeta: {}
  };
}

function migrateLegacyV1(v1) {
  const def = getDefaultState(v1?.profile?.name || 'Meu nome');
  return {
    ...def,
    selectedMonth: v1.selectedMonth || def.selectedMonth,
    currentTab: v1.currentTab || def.currentTab,
    accumulatedSubTab: v1.accumulatedSubTab || def.accumulatedSubTab,
    privacyMode: !!v1.privacyMode,
    cdiRate: Number(v1.cdiRate) || 11.25,
    profile: {
      name: v1.profile?.name || 'Meu nome',
      plan: v1.profile?.plan || 'Plano pessoal',
      monthlyBudgetCents: toCents(v1.profile?.monthlyBudget || 0),
      emergencyGoalCents: toCents(v1.profile?.emergencyGoal || 330),
      daysRemaining: v1.profile?.daysRemaining || 18
    },
    categories: (v1.categories || def.categories).map(c => ({
      id: c.id,
      name: c.name,
      color: c.color || '#38b6ff',
      budgetCents: c.budgetCents !== undefined ? c.budgetCents : toCents(c.budget || 0),
      rules: Array.isArray(c.rules) ? c.rules : [],
      archived: !!c.archived
    })),
    accounts: (v1.accounts || def.accounts).map(a => ({
      id: a.id,
      name: a.name,
      type: a.type || 'Conta Corrente',
      initialBalanceCents: a.initialBalanceCents !== undefined ? a.initialBalanceCents : toCents(a.initialBalance || 0),
      limitCents: a.limitCents !== undefined ? a.limitCents : toCents(a.limit || 2000),
      closingDay: a.closingDay || 5,
      dueDay: a.dueDay || 12
    })),
    transactions: (v1.transactions || def.transactions).map(t => ({
      id: t.id,
      type: t.type || 'expense',
      amountCents: t.amountCents !== undefined ? t.amountCents : toCents(t.amount || 0),
      description: t.description || '',
      tag: t.tag || '',
      categoryId: t.categoryId,
      accountId: t.accountId,
      date: t.date,
      method: t.method || 'Conta Corrente / Pix'
    })),
    assets: (v1.assets || def.assets).map(a => ({
      id: a.id,
      name: a.name,
      category: a.category || 'Renda Fixa (CDB)',
      institution: a.institution || 'Instituição',
      liquidity: a.liquidity || 'Diária',
      cdbPercent: a.cdbPercent ?? 100,
      amountCents: a.amountCents !== undefined ? a.amountCents : toCents(a.amount || 0),
      weeklyDeltaCents: a.weeklyDeltaCents !== undefined ? a.weeklyDeltaCents : toCents(a.weeklyDelta || 0)
    }))
  };
}

let usersIndex = getUsersIndex();
let state = loadState();

// Estado efêmero de UI (filtros, seleção em lote, desfazer)
let txFilter = { period: 'month', search: '', categoryId: '', accountId: '', tag: '' };
let selectedTxIds = new Set();
let undoSnapshot = null;
let undoTimer = null;

function mergeDefaultCategories(targetState) {
  if (!targetState || !Array.isArray(targetState.categories)) return targetState;
  const existingIds = new Set(targetState.categories.map(c => c.id));
  const defaults = getDefaultState().categories;
  defaults.forEach(defCat => {
    if (!existingIds.has(defCat.id)) {
      targetState.categories.push(defCat);
    }
  });
  return targetState;
}

function loadState() {
  if (typeof window === 'undefined') {
    return getDefaultState('Meu nome');
  }
  const key = getUserStorageKey(usersIndex.activeUserId);
  try {
    const raw = window.localStorage.getItem(key);
    if (raw) {
      return mergeDefaultCategories({ ...getDefaultState(), ...JSON.parse(raw) });
    }
    if (usersIndex.activeUserId === 'user-default') {
      const legacyRaw = window.localStorage.getItem(LEGACY_V1_KEY);
      if (legacyRaw) {
        const migrated = mergeDefaultCategories(migrateLegacyV1(JSON.parse(legacyRaw)));
        window.localStorage.setItem(key, JSON.stringify(migrated));
        return migrated;
      }
    }
  } catch (e) {}
  return getDefaultState(
    usersIndex.users.find(u => u.id === usersIndex.activeUserId)?.name || 'Meu nome'
  );
}

function saveState() {
  if (typeof window === 'undefined') return;
  state.updatedAt = Date.now();
  const key = getUserStorageKey(usersIndex.activeUserId);
  try {
    window.localStorage.setItem(key, JSON.stringify(state));
  } catch (e) {}
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncStateToCloud();
  }, 450);
}

// ============================================================
// HELPERS DE NEGÓCIO (FECHAMENTO DE FATURA, SALDO, REGRAS)
// ============================================================
function getCategoryById(id) {
  return state.categories.find(c => c.id === id) || { name: 'Outros', color: '#8fa3b0', rules: [], archived: false };
}

function getAccountById(id) {
  return state.accounts.find(a => a.id === id) || { name: 'Conta Padrão', type: 'Conta Corrente', closingDay: 5, dueDay: 12, limitCents: 200000, initialBalanceCents: 0 };
}

// Regra de fechamento: compras no cartão após o dia de fechamento vão para a fatura seguinte
function getInvoiceMonthForTransaction(tx, account) {
  const ym = (tx.date || state.selectedMonth).slice(0, 7);
  const isCard = tx.method === 'Cartão de Crédito' || account?.type === 'Cartão de Crédito';
  if (!isCard || !account) return ym;
  const day = parseInt((tx.date || '2026-11-01').split('-')[2], 10) || 1;
  const closingDay = Number(account.closingDay) || 5;
  return day > closingDay ? addMonthsYM(ym, 1) : ym;
}

// Saldo da conta em centavos (considera entradas e saídas à vista/débito)
function getAccountBalanceCents(acc) {
  let bal = Number(acc.initialBalanceCents) || 0;
  state.transactions.forEach(t => {
    if (t.accountId !== acc.id) return;
    if (t.type === 'income') {
      bal += Number(t.amountCents) || 0;
    } else if (t.method !== 'Cartão de Crédito' && acc.type !== 'Cartão de Crédito') {
      bal -= Number(t.amountCents) || 0;
    }
  });
  return bal;
}

// Regra automática: casa descrição com palavras-chave das categorias ativas
function matchCategoryByRules(description) {
  if (!description) return null;
  const text = description.toLowerCase();
  for (const cat of state.categories) {
    if (cat.archived || !Array.isArray(cat.rules)) continue;
    for (const kw of cat.rules) {
      const k = kw.trim().toLowerCase();
      if (k && text.includes(k)) return cat.id;
    }
  }
  return null;
}

// Categorias ordenadas por frequência de uso (para sugestão no lançamento rápido)
function getCategoriesSortedByUsage() {
  const counts = {};
  state.transactions.forEach(t => {
    counts[t.categoryId] = (counts[t.categoryId] || 0) + 1;
  });
  return state.categories
    .filter(c => !c.archived)
    .sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0));
}

function getMonthTransactions(ym = state.selectedMonth) {
  return state.transactions
    .filter(t => t.date && t.date.startsWith(ym))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function getCalendarMonthInfo(ym = state.selectedMonth) {
  const [yStr, mStr] = (ym || '2026-11').split('-');
  const year = parseInt(yStr, 10) || 2026;
  const month = parseInt(mStr, 10) || 11;
  const daysInMonth = new Date(year, month, 0).getDate();
  const todayISO = getTodayISO();
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

function isInternalTransferTx(t) {
  return Boolean(
    t.isInvoicePayment ||
    t.isAssetTransfer ||
    t.method === 'Pagamento de Fatura' ||
    t.method === 'Aporte / Investimento'
  );
}

function computeMonthMetrics(ym = state.selectedMonth) {
  const txs = getMonthTransactions(ym);
  const operationalTxs = txs.filter(t => !isInternalTransferTx(t));
  const incomeCents = operationalTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + (Number(t.amountCents) || 0), 0);
  const expenseCents = operationalTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + (Number(t.amountCents) || 0), 0);
  const partialResultCents = incomeCents - expenseCents;

  const cal = getCalendarMonthInfo(ym);
  const daysInMonth = cal.daysInMonth;
  const elapsedDays = cal.elapsedDays;
  const daysRem = cal.daysRem;

  const budgetCents = Number(state.profile.monthlyBudgetCents) || 0;
  const overBudgetCents = Math.max(0, expenseCents - budgetCents);
  const overPerDayCents = daysRem > 0 ? Math.round(overBudgetCents / daysRem) : overBudgetCents;

  const byCategoryMap = {};
  operationalTxs.filter(t => t.type === 'expense').forEach(t => {
    byCategoryMap[t.categoryId] = (byCategoryMap[t.categoryId] || 0) + (Number(t.amountCents) || 0);
  });

  const prevYM = addMonthsYM(ym, -1);
  const prevCatMap = {};
  const prevTxs = getMonthTransactions(prevYM).filter(t => !isInternalTransferTx(t));
  const prevIncomeCents = prevTxs.filter(t => t.type === 'income').reduce((s, t) => s + (Number(t.amountCents) || 0), 0);
  const prevExpenseCents = prevTxs.filter(t => t.type === 'expense').reduce((s, t) => s + (Number(t.amountCents) || 0), 0);
  const prevPartialResultCents = prevIncomeCents - prevExpenseCents;

  prevTxs.filter(t => t.type === 'expense').forEach(t => {
    prevCatMap[t.categoryId] = (prevCatMap[t.categoryId] || 0) + (Number(t.amountCents) || 0);
  });

  const distribution = Object.entries(byCategoryMap)
    .map(([catId, totalCents]) => {
      const cat = getCategoryById(catId);
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
        pctLabel
      };
    })
    .sort((a, b) => b.totalCents - a.totalCents);

  const totalInvestmentsCents = state.assets.reduce((acc, a) => acc + (Number(a.amountCents) || 0), 0);
  const weeklyInvDeltaCents = state.assets.reduce((acc, a) => acc + (Number(a.weeklyDeltaCents) || 0), 0);

  // Reserva de Emergência considera apenas ativos de renda fixa com liquidez diária/D+1 (exclui Cripto/Ações/FIIs/No Vencimento)
  const liquidReserveAssets = state.assets.filter(a => {
    const liq = a.liquidity || 'Diária';
    const isLiquid = liq === 'Diária' || liq === 'D+1';
    const isVolatile = a.category === 'Cripto' || a.category === 'Ações' || a.category === 'FIIs';
    return isLiquid && !isVolatile;
  });
  const reserveGoalCents = Number(state.profile.emergencyGoalCents) || 33000;
  const reserveCurrentCents = Math.max(0, liquidReserveAssets.reduce((s, a) => s + (Number(a.amountCents) || 0), 0));
  const reservePct = reserveGoalCents > 0 ? Math.min(100, Math.round((reserveCurrentCents / reserveGoalCents) * 100)) : 0;

  const fixedActiveOutCents = state.recurrences
    .filter(r => r.active && r.type !== 'income')
    .reduce((s, r) => s + (Number(r.amountCents) || 0), 0);
  const monthlyLivingCostCents = Math.max(
    1,
    expenseCents > 0 ? expenseCents : (fixedActiveOutCents > 0 ? fixedActiveOutCents : (budgetCents > 0 ? budgetCents : Math.round(reserveGoalCents / 6)))
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
    reserveMonths
  };
}

// ============================================================
// SINCRONIZAÇÃO AUTOMÁTICA DE RECORRÊNCIAS E SALÁRIO NO MÊS
// ============================================================
function syncRecurrencesForMonth(ym = state.selectedMonth) {
  let changed = false;

  // 1. Salário fixo automático
  const salaryCents = Number(state.profile.monthlySalaryCents) || 0;
  if (salaryCents > 0) {
    const existingSalary = state.transactions.find(
      t => t.recurrenceId === 'rec-salary' && (t.date || '').startsWith(ym)
    );
    const dayStr = String(Math.min(28, Math.max(1, Number(state.profile.salaryDay) || 5))).padStart(2, '0');
    if (!existingSalary) {
      state.transactions.push({
        id: `tx-salary-${ym}`,
        recurrenceId: 'rec-salary',
        type: 'income',
        amountCents: salaryCents,
        description: 'Salário Mensal',
        tag: 'salario',
        categoryId: 'cat-receita',
        accountId: state.accounts[0]?.id || 'acc-nubank',
        date: `${ym}-${dayStr}`,
        method: 'Conta Corrente / Pix'
      });
      changed = true;
    } else if (existingSalary.amountCents !== salaryCents) {
      existingSalary.amountCents = salaryCents;
      changed = true;
    }
  }

  // 2. Despesas/receitas recorrentes ativas entram automaticamente no mês
  state.recurrences.forEach(r => {
    if (!r.active) return;
    const exists = state.transactions.some(
      t => t.recurrenceId === r.id && (t.date || '').startsWith(ym)
    );
    if (!exists) {
      const dayStr = String(Math.min(28, Math.max(1, Number(r.day) || 10))).padStart(2, '0');
      const targetAccId = r.accountId || state.accounts[0]?.id || 'acc-nubank';
      const targetAcc = getAccountById(targetAccId);
      const recType = r.type || 'expense';
      const isCardAccount = targetAcc.type === 'Cartão de Crédito' || targetAcc.type === 'Conta + Cartão';
      const recMethod = (recType === 'expense' && isCardAccount)
        ? 'Cartão de Crédito'
        : 'Recorrência Automática';
      state.transactions.push({
        id: `tx-${r.id}-${ym}`,
        recurrenceId: r.id,
        type: recType,
        amountCents: Number(r.amountCents) || 0,
        description: r.description,
        tag: 'recorrente',
        categoryId: r.categoryId,
        accountId: targetAccId,
        date: `${ym}-${dayStr}`,
        method: recMethod
      });
      changed = true;
    }
  });

  if (changed) saveState();
}

// ============================================================
// RENDERIZAÇÃO PRINCIPAL
// ============================================================
function renderApp() {
  syncRecurrencesForMonth(state.selectedMonth);
  document.documentElement.setAttribute('data-theme', state.theme || 'dark');

  document.getElementById('user-name-label').textContent = state.profile.name;
  document.getElementById('user-plan-label').textContent = state.profile.plan;
  document.getElementById('user-avatar').textContent = (state.profile.name || 'M').trim().charAt(0).toUpperCase();

  const monthSel = document.getElementById('month-selector');
  if (monthSel) monthSel.value = state.selectedMonth;

  document.body.classList.toggle('privacy-hidden', !!state.privacyMode);

  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === state.currentTab);
  });

  const tabTitles = {
    'visao-geral': 'Visão geral',
    'transacoes': 'Transações',
    'recorrencias': 'Recorrências',
    'fluxo-caixa': 'Fluxo de caixa',
    'faturas': 'Faturas',
    'categorias': 'Categorias',
    'metas': 'Metas',
    'patrimonio': 'Patrimônio',
    'projecao': 'Projeção',
    'contas': 'Contas'
  };

  const calInfo = getCalendarMonthInfo(state.selectedMonth);
  document.getElementById('page-title').textContent = tabTitles[state.currentTab] || 'Visão geral';
  document.getElementById('page-subtitle').textContent =
    `${fmtMonthLabel(state.selectedMonth)} · ${calInfo.daysRem} dias restantes`;

  const container = document.getElementById('view-container');

  switch (state.currentTab) {
    case 'visao-geral':
      container.innerHTML = renderVisaoGeral();
      bindVisaoGeralEvents();
      break;
    case 'transacoes':
      container.innerHTML = renderTransacoesView();
      bindTransacoesEvents();
      break;
    case 'recorrencias':
      container.innerHTML = renderRecorrenciasView();
      bindRecorrenciasEvents();
      break;
    case 'fluxo-caixa':
      container.innerHTML = renderFluxoCaixaView();
      bindFluxoCaixaEvents();
      break;
    case 'faturas':
      container.innerHTML = renderFaturasView();
      bindFaturasEvents();
      break;
    case 'categorias':
      container.innerHTML = renderCategoriasView();
      bindCategoriasEvents();
      break;
    case 'metas':
      container.innerHTML = renderMetasView();
      bindMetasEvents();
      break;
    case 'patrimonio':
      container.innerHTML = renderPatrimonioView();
      bindPatrimonioEvents();
      break;
    case 'projecao':
      container.innerHTML = renderProjecaoView();
      bindProjecaoEvents();
      break;
    case 'contas':
      container.innerHTML = renderContasView();
      bindContasEvents();
      break;
    default:
      container.innerHTML = renderVisaoGeral();
      bindVisaoGeralEvents();
  }
}

// ============================================================
// 1. ABA: VISÃO GERAL
// ============================================================
function renderVisaoGeral() {
  const m = computeMonthMetrics();
  const lineChartSvg = buildMonthlySpendSvg(m.expenseCents, m.txs, m.daysInMonth);
  const donutSvg = buildDonutSvg(m.distribution, m.expenseCents);

  let categoryBarsHtml = '';
  if (m.distribution.length === 0) {
    categoryBarsHtml = `
      <div class="cat-bar-item">
        <div class="cat-caption">Nenhum gasto registrado neste mês. Clique no botão <b>+</b> acima para lançar.</div>
      </div>
    `;
  } else {
    categoryBarsHtml = m.distribution.map((d, idx) => {
      const overBudget = d.budgetCents > 0 && d.totalCents > d.budgetCents;
      const nearBudget = d.budgetCents > 0 && !overBudget && d.totalCents >= d.budgetCents * 0.8;
      const amountColor = overBudget ? 'var(--coral-red)' : nearBudget ? 'var(--amber-gold)' : 'inherit';

      let trendHtml = '';
      if (d.prevCents > 0) {
        if (d.totalCents > d.prevCents) {
          trendHtml = `<span title="Maior que no mês anterior" style="color:var(--coral-red); font-size:12px; margin-left:4px;">↗</span>`;
        } else if (d.totalCents < d.prevCents) {
          trendHtml = `<span title="Menor que no mês anterior" style="color:var(--green-emerald); font-size:12px; margin-left:4px;">↘</span>`;
        }
      }

      const budgetSuffix = d.budgetCents > 0
        ? `<span class="sensitive-val" style="color:var(--text-muted); font-size:12px; font-weight:500;"> / ${fmtBRL(d.budgetCents)}</span>`
        : '';

      return `
        <div class="cat-bar-item" style="gap:6px;">
          <div class="cat-bar-header">
            <div class="cat-name-group">
              <span style="width:24px; height:24px; border-radius:7px; background:${d.color}26; color:${d.color}; display:inline-flex; align-items:center; justify-content:center; font-size:12px; font-weight:700;">
                ●
              </span>
              <span style="font-weight:500;">${d.name}</span>
              <span class="cat-pct-badge">${d.pctLabel || (d.pct + '%')}</span>
            </div>
            <div style="display:flex; align-items:baseline; gap:2px;">
              <span class="cat-amount sensitive-val" style="color:${amountColor};">${fmtBRL(d.totalCents)}</span>
              ${trendHtml}
              ${budgetSuffix}
            </div>
          </div>
          <div class="cat-progress-track" style="height:5px;">
            <div class="cat-progress-fill" style="width:${Math.max(4, d.pct)}%; background:${d.color};"></div>
          </div>
          ${m.distribution.length === 1 && idx === 0
            ? `<div class="cat-caption">Única categoria com gasto neste mês.</div>`
            : ''}
        </div>
      `;
    }).join('');
  }

  let accumulatedMainVal = fmtBRL(m.expenseCents);
  let accumulatedTitle = 'Gastos acumulados';
  if (state.accumulatedSubTab === 'saldo') {
    accumulatedMainVal = fmtBRL(m.partialResultCents);
    accumulatedTitle = 'Saldo acumulado no período';
  } else if (state.accumulatedSubTab === 'por-dia') {
    const dailyAvgCents = Math.round(m.expenseCents / Math.max(1, m.elapsedDays));
    accumulatedMainVal = `${fmtBRL(dailyAvgCents)} / dia`;
    accumulatedTitle = `Média diária até o dia ${m.elapsedDays}`;
  }

  const topCat = m.distribution[0];
  const insightTitle = topCat
    ? `${topCat.name} concentra ${topCat.pct}% dos gastos`
    : 'Seus gastos estão sob controle';
  const insightDesc = topCat
    ? `Total de ${fmtBRL(topCat.totalCents)} registrado em ${topCat.name} neste período. Acompanhe o limite diário para equilibrar o mês.`
    : 'Adicione suas receitas e despesas para receber leituras automáticas do seu comportamento financeiro.';

  return `
    <section class="dashboard-row-1">
      <div class="card card-featured-cyan">
        <div class="card-featured-body">
          <div class="card-title" style="margin-bottom:6px;">Gastos no mês</div>
          <div>
            <span class="big-currency sensitive-val">${fmtBRL(m.expenseCents)}</span>
            <span class="currency-sub sensitive-val">/ ${fmtBRL(m.budgetCents)}</span>
          </div>

          <div class="mini-chart-wrap">
            ${lineChartSvg}
            <div class="chart-axis-labels">
              <span>dia 1</span>
              <span>dia ${Math.round(m.daysInMonth / 2)}</span>
              <span>dia ${m.daysInMonth}</span>
            </div>
          </div>

          <div class="budget-status-row">
            <span class="budget-status-text">
              ${m.overBudgetCents > 0 ? 'Você passou do orçamento em' : 'Dentro do orçamento previsto'}
            </span>
            <span class="badge-pill-dark sensitive-val">
              <span class="dot-red"></span>
              ${fmtBRL(m.overPerDayCents)} por dia
            </span>
          </div>
        </div>

        <div class="card-featured-footer">
          <span>Resumo do mês</span>
          <div style="display:flex; align-items:center; gap:10px;">
            <span>${m.daysRem} dias restantes</span>
            <div class="footer-dashes">
              <span class="footer-dash active"></span>
              <span class="footer-dash active"></span>
              <span class="footer-dash"></span>
              <span class="footer-dash"></span>
              <span class="footer-dash"></span>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header-row">
          <span class="card-title">Distribuição de gastos</span>
          <button class="card-link" id="go-to-categories-link">Categorias</button>
        </div>

        <div class="dist-content">
          <div class="donut-box">
            ${donutSvg}
            <div class="donut-center">
              <span class="donut-center-label">Gasto total</span>
              <span class="donut-center-val sensitive-val">${fmtBRL(m.expenseCents)}</span>
            </div>
          </div>

          <div class="category-bars-list">
            ${categoryBarsHtml}
          </div>
        </div>
      </div>
    </section>

    <section class="dashboard-row-2">
      <div class="card">
        <div class="card-title">Resultado parcial</div>
        <div class="partial-value ${m.partialResultCents < 0 ? 'negative' : 'positive'} sensitive-val">
          ${fmtBRL(m.partialResultCents)}
        </div>
        <div class="vs-prev sensitive-val">vs ${fmtBRL(m.prevPartialResultCents)} mês anterior</div>

        <div class="in-out-grid">
          <div class="in-out-item">
            <span class="in-out-label">↗ Entradas</span>
            <span class="in-out-val sensitive-val">${fmtBRL(m.incomeCents)}</span>
          </div>
          <div class="in-out-item">
            <span class="in-out-label">↘ Saídas</span>
            <span class="in-out-val sensitive-val">${fmtBRL(m.expenseCents)}</span>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header-row" style="margin-bottom:6px;">
          <span class="card-title">Investimentos</span>
          <span class="badge-pill-dark sensitive-val">${fmtBRL(m.weeklyInvDeltaCents)} na semana</span>
        </div>
        <div class="big-currency sensitive-val" style="margin-top:4px;">${fmtBRL(m.totalInvestmentsCents)}</div>

        <div style="margin: 18px 0 8px;">
          <svg width="100%" viewBox="0 0 280 46" style="display:block; height:auto; max-height:52px;">
            <defs>
              <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#38b6ff" stop-opacity="0.24"/>
                <stop offset="100%" stop-color="#38b6ff" stop-opacity="0.0"/>
              </linearGradient>
            </defs>
            <path d="M 4 14 L 210 14 Q 235 14 252 24 L 274 37 L 274 44 L 4 44 Z" fill="url(#invGrad)" />
            <path d="M 4 14 L 210 14 Q 235 14 252 24 L 274 37" fill="none" stroke="#49b6eb" stroke-width="2" stroke-linecap="round"/>
            <circle cx="274" cy="37" r="3.8" fill="#f59e0b" stroke="#14222b" stroke-width="1.5"/>
          </svg>
        </div>

        <div class="vs-prev sensitive-val">
          Patrimônio total ${fmtBRL(m.totalInvestmentsCents)} · ${fmtBRL(m.partialResultCents)} no período
        </div>
      </div>

      <div class="card">
        <div class="card-title">Reserva de emergência</div>

        <div class="reserve-body">
          <div>
            <div class="vs-prev" style="margin-bottom:2px;">Proteção</div>
            <div class="reserve-Months sensitive-val">${m.reserveMonths.toFixed(1).replace('.', ',')} meses</div>
            <div class="vs-prev sensitive-val">${fmtBRL(m.reserveCurrentCents)} / ${fmtBRL(m.reserveGoalCents)}</div>
          </div>

          <div class="reserve-ring-wrap">
            ${buildReserveRingSvg(m.reservePct)}
            <div class="reserve-ring-label">
              ${m.reservePct}%
              <span>da meta</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="dashboard-row-3">
      <div class="card">
        <div class="accumulated-top">
          <div>
            <div class="card-title">${accumulatedTitle}</div>
            <div class="big-currency sensitive-val" style="margin-top:6px;">${accumulatedMainVal}</div>
          </div>

          <div class="segmented-tabs">
            <button class="seg-btn ${state.accumulatedSubTab === 'gastos' ? 'active' : ''}" data-acc-tab="gastos">Gastos</button>
            <button class="seg-btn ${state.accumulatedSubTab === 'saldo' ? 'active' : ''}" data-acc-tab="saldo">Saldo</button>
            <button class="seg-btn ${state.accumulatedSubTab === 'por-dia' ? 'active' : ''}" data-acc-tab="por-dia">Por dia</button>
          </div>

          <div class="above-budget-info">
            <div class="above-budget-val sensitive-val">${fmtBRL(m.overBudgetCents)} acima</div>
            <div class="above-budget-sub">do orçamento</div>
          </div>
        </div>

        <div style="margin-top:14px;">
          ${buildAccumulatedAreaSvg(m.expenseCents, state.accumulatedSubTab, m.partialResultCents, m.txs, m.daysInMonth)}
        </div>
      </div>

      <div class="card">
        <div class="card-header-row" style="margin-bottom:8px;">
          <span class="card-title">Insights do mês</span>
          <span class="badge-pill-dark" style="font-weight:500;">leitura automática</span>
        </div>

        <div class="insight-alert-box">
          <div class="insight-icon">!</div>
          <div>
            <div class="insight-title">${insightTitle}</div>
            <div class="insight-desc sensitive-val">${insightDesc}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ROW 4: Próximas recorrências + Faturas + Metas -->
    ${renderVisaoGeralRow4(m)}
  `;
}

function renderVisaoGeralRow4(m) {
  const [, selMonth] = state.selectedMonth.split('-');
  const nextRecs = state.recurrences.slice(0, 3);
  const recRows = nextRecs.length === 0
    ? `<div class="vs-prev">Nenhuma recorrência cadastrada.</div>`
    : nextRecs.map(r => {
        const cat = getCategoryById(r.categoryId);
        const dayStr = String(r.day || 10).padStart(2, '0');
        return `
          <div class="recorrencia-mini-row">
            <span style="display:inline-flex; align-items:center; gap:8px;">
              <span class="cat-dot" style="background:${cat.color};"></span>
              <span style="font-weight:500;">${r.description}</span>
            </span>
            <span>
              <b class="sensitive-val">${fmtBRL(r.amountCents)}</b>
              <span style="color:var(--text-muted); font-size:11.5px; margin-left:6px;">${dayStr}/${selMonth}</span>
            </span>
          </div>
        `;
      }).join('');

  // Total de faturas em aberto no mês (respeitando fechamento e filtrando apenas compras no cartão)
  let totalFaturasOpenCents = 0;
  let totalFaturasPaidCents = 0;
  state.accounts.forEach(acc => {
    const meta = getInvoiceMeta(acc.id);
    const txSum = state.transactions
      .filter(t => {
        if (t.accountId !== acc.id || t.type !== 'expense') return false;
        if (t.method !== 'Cartão de Crédito' && acc.type !== 'Cartão de Crédito') return false;
        return getInvoiceMonthForTransaction(t, acc) === state.selectedMonth;
      })
      .reduce((s, t) => s + (Number(t.amountCents) || 0), 0);
    const invTotal = Math.max(0, txSum + (Number(meta.adjustmentCents) || 0));
    if (meta.status === 'paid') {
      totalFaturasPaidCents += invTotal;
    } else {
      totalFaturasOpenCents += invTotal;
    }
  });
  const cashExpensesCents = m.txs
    .filter(t => t.type === 'expense' && t.method !== 'Cartão de Crédito')
    .reduce((s, t) => s + (Number(t.amountCents) || 0), 0);
  const saldoAposPagamentoCents = m.incomeCents - cashExpensesCents - totalFaturasOpenCents - totalFaturasPaidCents;

  // Meta prioritária em destaque
  const topGoal = state.goals[1] || state.goals[0];
  const goalHtml = !topGoal
    ? `<div class="vs-prev">Crie uma meta na aba Metas.</div>`
    : (() => {
        const pct = topGoal.targetCents > 0 ? Math.min(100, Math.round((topGoal.currentCents / topGoal.targetCents) * 100)) : 0;
        return `
          <div class="goal-highlight-box">
            <span class="goal-priority-pill">Prioridade</span>
            <div class="goal-spotlight-title" style="font-size:16px; font-weight:700; color:#fff;">${topGoal.title}</div>
            <div style="font-size:11.5px; color:#c8e4f7;">Previsão de conclusão · ${topGoal.deadline || '2027-12'}</div>
          </div>
          <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:12px;">
            <span class="sensitive-val" style="font-size:12px; font-weight:600;">${fmtBRL(topGoal.currentCents)}</span>
            <div class="cat-progress-track" style="flex:1;">
              <div class="cat-progress-fill" style="width:${Math.max(4, pct)}%; background:var(--cyan-accent);"></div>
            </div>
            <span class="sensitive-val" style="font-size:12px; font-weight:600;">${fmtBRL(topGoal.targetCents)}</span>
          </div>
        `;
      })();

  return `
    <section class="dashboard-row-4">
      <div class="card">
        <div class="card-header-row" style="margin-bottom:8px;">
          <span class="card-title">Próximas recorrências</span>
          <button class="card-link" data-jump-tab="recorrencias">Ver todas</button>
        </div>
        ${recRows}
      </div>

      <div class="card">
        <div class="card-header-row" style="margin-bottom:8px;">
          <span class="card-title" style="display:inline-flex; align-items:center; gap:6px;">
            Faturas <span class="badge-pill-dark" style="padding:2px 7px; color:var(--amber-gold);">!</span>
          </span>
          <button class="card-link" data-jump-tab="faturas">Abrir faturas</button>
        </div>
        <div class="big-currency sensitive-val" style="margin-top:10px;">${fmtBRL(totalFaturasOpenCents)}</div>
        <div class="vs-prev sensitive-val" style="margin-top:8px;">
          Saldo após pagamento <b style="color:var(--text-main);">${fmtBRL(saldoAposPagamentoCents)}</b>
        </div>
      </div>

      <div class="card">
        <div class="card-header-row" style="margin-bottom:4px;">
          <span class="card-title">Metas</span>
          <button class="card-link" data-jump-tab="metas">Gerenciar</button>
        </div>
        ${goalHtml}
      </div>
    </section>
  `;
}

function bindVisaoGeralEvents() {
  document.querySelectorAll('[data-jump-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.currentTab = btn.dataset.jumpTab;
      saveState();
      renderApp();
    });
  });
  const catLink = document.getElementById('go-to-categories-link');
  if (catLink) {
    catLink.addEventListener('click', () => {
      state.currentTab = 'categorias';
      saveState();
      renderApp();
    });
  }

  document.querySelectorAll('[data-acc-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.accumulatedSubTab = btn.dataset.accTab;
      saveState();
      renderApp();
    });
  });

  bindChartTooltips();
}

function bindChartTooltips() {
  const tip = document.getElementById('chart-tooltip');
  if (!tip) return;
  const hideTip = () => tip.classList.remove('visible');

  const showAt = (el, clientX, clientY) => {
    const title = el.dataset.tipTitle || '';
    const val = el.dataset.tipVal || '';
    const hidden = state.privacyMode ? '•••' : val;
    tip.innerHTML = `<div class="tooltip-title">${title}</div><div class="tooltip-value">${hidden}</div>`;
    tip.classList.add('visible');
    const clampedX = Math.min(window.innerWidth - 90, Math.max(90, clientX));
    tip.style.left = `${clampedX}px`;
    tip.style.top = `${Math.max(48, clientY - 8)}px`;
  };

  document.querySelectorAll('[data-tip-title]').forEach(el => {
    el.addEventListener('mouseenter', (e) => showAt(el, e.clientX, e.clientY));
    el.addEventListener('mousemove', (e) => {
      const clampedX = Math.min(window.innerWidth - 90, Math.max(90, e.clientX));
      tip.style.left = `${clampedX}px`;
      tip.style.top = `${Math.max(48, e.clientY - 8)}px`;
    });
    el.addEventListener('mouseleave', hideTip);
    el.addEventListener('touchstart', (e) => {
      const t = e.touches && e.touches[0];
      if (t) showAt(el, t.clientX, t.clientY);
    }, { passive: true });
    el.addEventListener('touchend', () => {
      setTimeout(hideTip, 1600);
    }, { passive: true });
  });
}

function buildSmoothSvgPath(pts) {
  if (!pts || pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    const midX = (p0.x + p1.x) / 2;
    d += ` C ${midX.toFixed(1)} ${p0.y.toFixed(1)}, ${midX.toFixed(1)} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
  }
  return d;
}

function buildMonthlySpendSvg(expenseCents, txs = [], daysInMonth = 30) {
  const numBuckets = 15;
  const buckets = Array.from({ length: numBuckets }, (_, i) => {
    const day = Math.min(daysInMonth, Math.max(1, Math.round(1 + (i / (numBuckets - 1)) * (daysInMonth - 1))));
    const cumCents = txs
      .filter(t => t.type === 'expense' && parseInt((t.date || '').split('-')[2] || '1', 10) <= day)
      .reduce((s, t) => s + (Number(t.amountCents) || 0), 0);
    return { day, cumCents };
  });
  const maxCum = Math.max(expenseCents, ...buckets.map(b => b.cumCents), 100);
  const hasSpend = expenseCents > 0;

  const pts = buckets.map((b, idx) => {
    const x = 4 + (idx / (numBuckets - 1)) * 284;
    const y = hasSpend ? (56 - (b.cumCents / maxCum) * 40) : 56;
    return { x, y, day: b.day, cumCents: b.cumCents };
  });

  const pathLine = buildSmoothSvgPath(pts);
  const pathArea = `${pathLine} L 288 68 L 4 68 Z`;
  const endY = pts[pts.length - 1].y;

  const zones = pts.map((p, idx) => {
    const x = idx * (296 / numBuckets);
    const w = 296 / numBuckets;
    return `<rect x="${x.toFixed(1)}" y="0" width="${w.toFixed(1)}" height="72" fill="transparent"
      class="chart-hover-zone"
      data-tip-title="Até dia ${p.day} (acumulado)"
      data-tip-val="${fmtBRL(p.cumCents)}" />`;
  }).join('');

  return `
    <svg width="100%" viewBox="0 0 296 72" style="display:block; height:auto; max-height:80px;">
      <defs>
        <linearGradient id="coralArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#f16364" stop-opacity="0.28"/>
          <stop offset="100%" stop-color="#f16364" stop-opacity="0.02"/>
        </linearGradient>
      </defs>
      <line x1="0" y1="16" x2="296" y2="16" stroke="var(--chart-grid, rgba(255,255,255,0.05))" stroke-width="1"/>
      <line x1="0" y1="36" x2="296" y2="36" stroke="var(--chart-grid, rgba(255,255,255,0.05))" stroke-width="1"/>
      <line x1="0" y1="56" x2="296" y2="56" stroke="var(--chart-grid, rgba(255,255,255,0.05))" stroke-width="1"/>
      <path d="${pathArea}" fill="url(#coralArea)"/>
      <path d="${pathLine}" fill="none" stroke="#f16364" stroke-width="2.3" stroke-linecap="round"/>
      <circle cx="288" cy="${endY.toFixed(1)}" r="4.5" fill="#f59e0b" stroke="#ffffff" stroke-width="1.5"/>
      ${zones}
    </svg>
  `;
}

function buildDonutSvg(distribution, totalExpenseCents) {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;

  if (!totalExpenseCents || distribution.length === 0) {
    return `
      <svg width="146" height="146" viewBox="0 0 146 146">
        <circle cx="73" cy="73" r="${radius}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="18"
          class="donut-slice-hover" data-tip-title="Sem gastos" data-tip-val="R$ 0,00 (0%)"/>
      </svg>
    `;
  }

  let offset = 0;
  const segments = distribution.map(d => {
    const frac = d.totalCents / totalExpenseCents;
    const dash = frac * circumference;
    const seg = `<circle cx="73" cy="73" r="${radius}" fill="none" stroke="${d.color}" stroke-width="18"
      class="donut-slice-hover"
      data-tip-title="${d.name} (${d.pct}%)"
      data-tip-val="${fmtBRL(d.totalCents)}"
      stroke-dasharray="${dash} ${circumference - dash}"
      stroke-dashoffset="${-offset}"
      transform="rotate(-90 73 73)" />`;
    offset += dash;
    return seg;
  }).join('');

  return `
    <svg width="146" height="146" viewBox="0 0 146 146">
      <circle cx="73" cy="73" r="${radius}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="18"/>
      ${segments}
      <line x1="73" y1="8" x2="73" y2="27" stroke="#14222b" stroke-width="2.5" style="pointer-events:none;"/>
    </svg>
  `;
}

function buildReserveRingSvg(pct) {
  const r = 31;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  return `
    <svg width="78" height="78" viewBox="0 0 78 78">
      <circle cx="39" cy="39" r="${r}" fill="none" stroke="var(--ring-track, rgba(255,255,255,0.08))" stroke-width="7"/>
      <circle cx="39" cy="39" r="${r}" fill="none" stroke="#f59e0b" stroke-width="7"
        stroke-dasharray="${dash} ${c - dash}" transform="rotate(-90 39 39)" stroke-linecap="round"/>
      <circle cx="39" cy="8" r="3.8" fill="#f59e0b"/>
    </svg>
  `;
}

function buildAccumulatedAreaSvg(expenseCents, mode, partialResultCents = 0, txs = [], daysInMonth = 30) {
  const color = mode === 'saldo' ? '#49b6eb' : '#f16364';
  const labelPrefix = mode === 'saldo' ? 'Saldo' : mode === 'por-dia' ? 'Média/dia' : 'Acumulado';

  const numSteps = 10;
  const series = Array.from({ length: numSteps }, (_, idx) => {
    const dayEnd = Math.min(daysInMonth, Math.max(1, Math.round(1 + (idx / (numSteps - 1)) * (daysInMonth - 1))));
    const expUntil = txs
      .filter(t => t.type === 'expense' && parseInt((t.date || '').split('-')[2] || '1', 10) <= dayEnd)
      .reduce((s, t) => s + (Number(t.amountCents) || 0), 0);
    const incUntil = txs
      .filter(t => t.type === 'income' && parseInt((t.date || '').split('-')[2] || '1', 10) <= dayEnd)
      .reduce((s, t) => s + (Number(t.amountCents) || 0), 0);
    const valCents = mode === 'saldo'
      ? (incUntil - expUntil)
      : mode === 'por-dia'
        ? Math.round(expUntil / Math.max(1, dayEnd))
        : expUntil;
    return { dayEnd, valCents };
  });

  const allVals = series.map(s => s.valCents);
  const minVal = Math.min(0, ...allVals);
  const maxVal = Math.max(100, ...allVals);
  const span = Math.max(1, maxVal - minVal);
  const hasAny = txs.length > 0;

  const pts = series.map((s, idx) => {
    const x = 4 + (idx / (numSteps - 1)) * 548;
    const y = hasAny ? (42 - ((s.valCents - minVal) / span) * 28) : 42;
    return { x, y, dayEnd: s.dayEnd, valCents: s.valCents };
  });

  const pathLine = buildSmoothSvgPath(pts);
  const endY = pts[pts.length - 1].y;
  const colW = 560 / numSteps;

  const hoverZones = pts.map((p, idx) => `
    <rect x="${(idx * colW).toFixed(1)}" y="0" width="${colW.toFixed(1)}" height="52" fill="transparent"
      class="chart-hover-zone"
      data-tip-title="Até dia ${p.dayEnd} (${labelPrefix})"
      data-tip-val="${fmtBRL(p.valCents)}" />
  `).join('');

  return `
    <svg width="100%" viewBox="0 0 560 52" style="display:block; height:auto; max-height:62px;">
      <line x1="0" y1="44" x2="560" y2="44" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
      <path d="${pathLine}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round"/>
      <circle cx="552" cy="${endY.toFixed(1)}" r="4" fill="#f59e0b" stroke="#fff" stroke-width="1.2"/>
      ${hoverZones}
    </svg>
  `;
}

// ============================================================
// 2. ABA: TRANSAÇÕES (FILTROS COMBINÁVEIS + EDIÇÃO EM LOTE + DESFAZER)
// ============================================================
function getFilteredTransactions() {
  const today = getTodayISO();
  const nowDate = new Date();

  return state.transactions
    .filter(t => {
      if (txFilter.period === 'month' && !(t.date || '').startsWith(state.selectedMonth)) return false;
      if (txFilter.period === 'today' && t.date !== today) return false;
      if (txFilter.period === '7d' || txFilter.period === '30d') {
        const days = txFilter.period === '7d' ? 7 : 30;
        const tDate = new Date(t.date + 'T12:00:00');
        const diff = (nowDate - tDate) / (1000 * 60 * 60 * 24);
        if (diff > days || diff < -365) return false;
      }
      if (txFilter.categoryId && t.categoryId !== txFilter.categoryId) return false;
      if (txFilter.accountId && t.accountId !== txFilter.accountId) return false;
      if (txFilter.tag && (t.tag || '').toLowerCase() !== txFilter.tag.toLowerCase()) return false;
      if (txFilter.search) {
        const q = txFilter.search.toLowerCase();
        const hay = `${t.description} ${t.tag || ''} ${getCategoryById(t.categoryId).name}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

function showUndoToast(msg) {
  const toast = document.getElementById('undo-toast');
  const msgEl = document.getElementById('undo-toast-msg');
  if (!toast || !msgEl) return;
  msgEl.textContent = msg;
  toast.classList.add('visible');
  if (undoTimer) clearTimeout(undoTimer);
  undoTimer = setTimeout(() => {
    toast.classList.remove('visible');
    undoSnapshot = null;
  }, 9000);
}

function renderTransacoesView() {
  const filtered = getFilteredTransactions();
  const totalInCents = filtered.filter(t => t.type === 'income').reduce((s, t) => s + (Number(t.amountCents) || 0), 0);
  const totalOutCents = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + (Number(t.amountCents) || 0), 0);
  const netCents = totalInCents - totalOutCents;

  const uniqueTags = [...new Set(state.transactions.map(t => (t.tag || '').trim()).filter(Boolean))];

  const catOptions = state.categories.map(c => `<option value="${c.id}" ${txFilter.categoryId === c.id ? 'selected' : ''}>${c.name}</option>`).join('');
  const accOptions = state.accounts.map(a => `<option value="${a.id}" ${txFilter.accountId === a.id ? 'selected' : ''}>${a.name}</option>`).join('');
  const tagOptions = uniqueTags.map(tag => `<option value="${tag}" ${txFilter.tag === tag ? 'selected' : ''}>#${tag}</option>`).join('');

  const allSelected = filtered.length > 0 && filtered.every(t => selectedTxIds.has(t.id));

  const batchBar = selectedTxIds.size > 0 ? `
    <div class="batch-toolbar">
      <span style="font-size:13px; font-weight:600;">${selectedTxIds.size} selecionada(s)</span>
      <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
        <select id="batch-cat-select" class="form-select" style="width:auto; padding:6px 10px; font-size:12px;">
          <option value="">Alterar Categoria...</option>
          ${state.categories.filter(c => !c.archived).map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
        </select>
        <select id="batch-acc-select" class="form-select" style="width:auto; padding:6px 10px; font-size:12px;">
          <option value="">Alterar Conta...</option>
          ${state.accounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
        </select>
        <button class="btn-secondary" id="btn-batch-tag" style="padding:6px 12px; font-size:12px;">Definir Tag</button>
        <button class="btn-danger-ghost" id="btn-batch-delete">Excluir Lote</button>
      </div>
    </div>
  ` : '';

  const rows = filtered.length === 0
    ? `<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:28px;">Nenhuma transação encontrada para os filtros atuais.</td></tr>`
    : filtered.map(t => {
        const cat = getCategoryById(t.categoryId);
        const acc = getAccountById(t.accountId);
        const checked = selectedTxIds.has(t.id) ? 'checked' : '';
        return `
          <tr>
            <td><input type="checkbox" class="tx-row-check" data-tx-check="${t.id}" ${checked} /></td>
            <td>${fmtDateBR(t.date)}</td>
            <td style="font-weight:600;">
              ${t.description}
              ${t.tag ? `<span class="tag-pill">#${t.tag}</span>` : ''}
            </td>
            <td>
              <span style="display:inline-flex; align-items:center; gap:6px;">
                <span class="cat-dot" style="background:${cat.color}"></span>
                ${cat.name}
              </span>
            </td>
            <td>${acc.name} · <span style="color:var(--text-muted); font-size:11.5px;">${t.method || 'Pix'}</span></td>
            <td>
              <span class="badge-type ${t.type === 'expense' ? 'expense' : 'income'}">
                ${t.type === 'expense' ? 'Saída' : 'Entrada'}
              </span>
            </td>
            <td class="sensitive-val" style="font-weight:700; color:${t.type === 'expense' ? 'var(--coral-red)' : 'var(--green-emerald)'};">
              ${t.type === 'expense' ? '-' : '+'}${fmtBRL(t.amountCents)}
            </td>
            <td style="text-align:right; white-space:nowrap;">
              <button class="btn-icon-edit" data-edit-tx="${t.id}">✎ Editar</button>
              <button class="btn-danger-ghost" data-del-tx="${t.id}">Excluir</button>
            </td>
          </tr>
        `;
      }).join('');

  return `
    <div class="card">
      <div class="section-toolbar">
        <div>
          <h3 class="card-title" style="font-size:15px;">Lançamentos & Filtros</h3>
          <p class="vs-prev">Combine período, categoria, conta, tag ou texto e edite várias transações em lote.</p>
        </div>
        <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
          <button class="btn-secondary" id="btn-import-statement" title="Importar fatura ou extrato em CSV, Markdown (.md), PDF ou Imagem">
            ↑ Importar Fatura (CSV/MD/PDF/Foto)
          </button>
          <button class="btn-primary" id="btn-new-tx-page">+ Lançamento Rápido</button>
        </div>
      </div>

      <div class="tx-filters-grid">
        <input type="text" id="filter-search" class="form-input" placeholder="Buscar descrição ou tag..." value="${txFilter.search}" />
        <select id="filter-period" class="form-select">
          <option value="month" ${txFilter.period === 'month' ? 'selected' : ''}>Mês selecionado</option>
          <option value="today" ${txFilter.period === 'today' ? 'selected' : ''}>Hoje</option>
          <option value="7d" ${txFilter.period === '7d' ? 'selected' : ''}>Últimos 7 dias</option>
          <option value="30d" ${txFilter.period === '30d' ? 'selected' : ''}>Últimos 30 dias</option>
          <option value="all" ${txFilter.period === 'all' ? 'selected' : ''}>Todo o período</option>
        </select>
        <select id="filter-category" class="form-select">
          <option value="">Todas categorias</option>
          ${catOptions}
        </select>
        <select id="filter-account" class="form-select">
          <option value="">Todas contas</option>
          ${accOptions}
        </select>
        <select id="filter-tag" class="form-select">
          <option value="">Todas tags</option>
          ${tagOptions}
        </select>
      </div>

      <div class="tx-summary-strip">
        <span><b>${filtered.length}</b> transação(ões)</span>
        <div style="display:flex; gap:18px; flex-wrap:wrap;">
          <span>Entradas: <b class="sensitive-val" style="color:var(--green-emerald);">${fmtBRL(totalInCents)}</b></span>
          <span>Saídas: <b class="sensitive-val" style="color:var(--coral-red);">${fmtBRL(totalOutCents)}</b></span>
          <span>Saldo do filtro: <b class="sensitive-val">${fmtBRL(netCents)}</b></span>
        </div>
      </div>

      ${batchBar}

      <div class="table-responsive-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width:32px;"><input type="checkbox" id="tx-select-all" ${allSelected ? 'checked' : ''} /></th>
              <th>Data</th>
              <th>Descrição / Tag</th>
              <th>Categoria</th>
              <th>Conta / Método</th>
              <th>Tipo</th>
              <th>Valor</th>
              <th style="text-align:right;">Ações</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

// ============================================================
// IMPORTADOR MULTIFORMATO DE FATURAS (CSV LOCAL + PDF/FOTO IA + TABELA EDITÁVEL)
// ============================================================
let invoiceReviewItems = [];
let invoiceModalBound = false;

const LOCAL_MERCHANT_KEYWORDS = [
  { catName: /transporte/i, fallbackId: 'cat-transporte', words: ['uber', '99app', '99*', '99 pop', 'localiza', 'movida', 'unidas', 'sem parar', 'veloe', 'conectcar', 'posto', 'ipiranga', 'shell', 'petrobras', 'br mania', 'estapar', 'indigo', 'azul linhas', 'gol linhas', 'latam', 'onibus', 'metro', 'pedagio'] },
  { catName: /delivery/i, fallbackId: 'cat-delivery', words: ['ifood', 'ifd*', 'ze delivery', 'rappi', '99food', 'aiqfome', 'james delivery'] },
  { catName: /alimenta|mercado/i, fallbackId: 'cat-alimentacao', words: ['restaurante', 'lanchonete', 'padaria', 'panificadora', 'pizzaria', 'burger', 'mcdonalds', 'mc donalds', 'bk ', 'outback', 'madero', 'coco bambu', 'supermercado', 'mercado', 'atacadao', 'assai', 'carrefour', 'pao de acucar', 'extra ', 'mateus', 'zaffari', 'angeloni', 'hortifruti', 'acougue', 'cafe', 'starbucks', 'cacau show'] },
  { catName: /assinatura|streaming/i, fallbackId: 'cat-assinaturas', words: ['netflix', 'spotify', 'amazon prime', 'prime video', 'disney', 'hbomax', 'max.com', 'youtube', 'apple.com/bill', 'google *', 'icloud', 'microsoft', 'chatgpt', 'openai', 'claude', 'canva', 'adobe', 'globoplay', 'audible', 'kindle'] },
  { catName: /internet|telefon/i, fallbackId: 'cat-internet', words: ['claro', 'vivo', 'tim', 'oi ', 'algar', 'brisanet', 'starlink', 'net servicos', 'sky', 'desktop internet'] },
  { catName: /sa[uú]de|farm[aá]cia/i, fallbackId: 'cat-saude', words: ['drogasil', 'droga raia', 'drogaria', 'pague menos', 'panvel', 'farmacia', 'unimed', 'hapvida', 'laboratorio', 'fleury', 'clinica', 'hospital', 'odonto', 'consulta', 'exame'] },
  { catName: /moradia|casa/i, fallbackId: 'cat-moradia', words: ['enel', 'cemig', 'copel', 'cpfl', 'celpe', 'neoenergia', 'light', 'sabesp', 'sanepar', 'condominio', 'aluguel', 'quintoandar', 'leroy merlin', 'telhanorte', 'gas '] },
  { catName: /educa/i, fallbackId: 'cat-educacao', words: ['alura', 'udemy', 'coursera', 'rocketseat', 'faculdade', 'escola', 'universidade', 'livraria', 'saraiva', 'leitura', 'curso'] },
  { catName: /compras|shopping/i, fallbackId: 'cat-compras', words: ['mercado livre', 'mercadolivre', 'meli', 'mercadopago*', 'mp *', 'amazon', 'shopee', 'shein', 'aliexpress', 'magalu', 'magazine luiza', 'casas bahia', 'fast shop', 'kabum', 'pichau', 'renner', 'riachuelo', 'cea', 'zara', 'centauro', 'nike', 'adidas', 'decathlon', ' Zara'] },
  { catName: /lazer/i, fallbackId: 'cat-lazer', words: ['ingresso', 'sympla', 'eventim', 'cinemark', 'cinepolis', 'uci', 'steam', 'playstation', 'xbox', 'nintendo', 'bar ', 'pub ', 'hotel', 'airbnb', 'booking'] }
];

function classifyMerchantLocally(titleText) {
  const clean = String(titleText || '').trim();
  if (!clean) {
    return { categoryId: state.categories[0]?.id || 'cat-delivery', matchedByRule: false };
  }
  // 1. Regras personalizadas do usuário em Categorias
  const userRuleCatId = matchCategoryByRules(clean);
  if (userRuleCatId) {
    return { categoryId: userRuleCatId, matchedByRule: true };
  }
  // 2. Dicionário local de estabelecimentos brasileiros conhecidos
  const lower = clean.toLowerCase();
  for (const group of LOCAL_MERCHANT_KEYWORDS) {
    if (group.words.some(w => lower.includes(w.toLowerCase()))) {
      const targetCat = state.categories.find(c => !c.archived && (c.id === group.fallbackId || group.catName.test(c.name)));
      if (targetCat) {
        return { categoryId: targetCat.id, matchedByRule: true };
      }
    }
  }
  const defaultCat = state.categories.find(c => !c.archived && /compras|outros/i.test(c.name)) || state.categories.find(c => !c.archived) || state.categories[0];
  return { categoryId: defaultCat?.id || 'cat-delivery', matchedByRule: false };
}

function cleanBrazilianAmountToFloat(rawStr) {
  if (rawStr === undefined || rawStr === null) return NaN;
  if (typeof rawStr === 'number') return rawStr;
  // Ex: "- 1.946,15" ou "243,75" ou "R$ 1.250,90" ou "-1946.15"
  let s = String(rawStr).replace(/R\$/gi, '').replace(/\s+/g, '').trim();
  if (!s) return NaN;
  if (s.includes(',') && s.includes('.')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  }
  return parseFloat(s);
}

function extractInstallmentInfoFromTitle(rawTitle) {
  const title = String(rawTitle || '').trim();
  // Regex principal exigida: /^(.*?)\s*-\s*Parcela\s+(\d+)\/(\d+)$/i
  const primaryRegex = /^(.*?)\s*-\s*Parcela\s+(\d+)\/(\d+)$/i;
  const m1 = title.match(primaryRegex);
  if (m1) {
    const cur = Math.max(1, parseInt(m1[2], 10) || 1);
    const tot = Math.max(cur, parseInt(m1[3], 10) || 1);
    return { cleanTitle: m1[1].trim() || title, currentInstallment: cur, totalInstallments: tot };
  }
  // Fallback para outros formatos comuns ("Loja X - 02/10", "Loja X (2/10)", "Loja X Parcela 2/10")
  const fallbackRegex = /^(.*?)\s*(?:-\s*|\bParcela\s+|\()(\d{1,2})\/(\d{1,2})\)?$/i;
  const m2 = title.match(fallbackRegex);
  if (m2 && m2[1].trim().length >= 2) {
    const cur = Math.max(1, parseInt(m2[2], 10) || 1);
    const tot = Math.max(cur, parseInt(m2[3], 10) || 1);
    if (tot >= 2 && tot <= 48 && cur <= tot) {
      return { cleanTitle: m2[1].trim(), currentInstallment: cur, totalInstallments: tot };
    }
  }
  return { cleanTitle: title, currentInstallment: 1, totalInstallments: 1 };
}

function detectEntryKind(rawTitle, floatAmount, isCreditCardBill = true) {
  const t = String(rawTitle || '').toLowerCase();
  if (/pagamento\s+recebido|pagamento\s+de\s+fatura|pagamento\s+efetuado|inclus[aã]o\s+de\s+pagamento|fatura\s+paga|pagamento\s+em\s+/i.test(t)) {
    return 'payment';
  }
  if (/\bestorno\b|cr[eé]dito\s+de|desconto\s+antecipa|reembolso|cancelamento/i.test(t)) {
    return 'refund';
  }
  if (isCreditCardBill && floatAmount < 0) {
    return 'refund';
  }
  return 'purchase';
}

function parseInvoiceCSVOrOFXLocally(rawText, fileName = '') {
  const text = (rawText || '').trim();
  if (!text) return [];
  const defaultYM = state.selectedMonth || getTodayISO().slice(0, 7);
  const out = [];

  // Suporte OFX
  if (/<STMTTRN>/i.test(text) || fileName.toLowerCase().endsWith('.ofx')) {
    const blocks = text.split(/<STMTTRN>/i).slice(1);
    blocks.forEach((blk, idx) => {
      const amtMatch = blk.match(/<TRNAMT>\s*([+-]?[\d.,\s-]+)/i);
      const dtMatch = blk.match(/<DTPOSTED>\s*(\d{8})/i);
      const memoMatch = blk.match(/<(?:MEMO|NAME)>\s*([^<\r\n]+)/i);
      if (!amtMatch) return;
      const valFloat = cleanBrazilianAmountToFloat(amtMatch[1]);
      if (isNaN(valFloat) || valFloat === 0) return;
      let dateISO = `${defaultYM}-10`;
      if (dtMatch && dtMatch[1].length === 8) {
        const d = dtMatch[1];
        dateISO = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
      }
      const rawTitle = memoMatch ? memoMatch[1].trim() : `Lançamento #${idx + 1}`;
      const inst = extractInstallmentInfoFromTitle(rawTitle);
      const entryKind = detectEntryKind(rawTitle, valFloat, false);
      const cls = classifyMerchantLocally(inst.cleanTitle);
      out.push({
        id: 'rev-' + idx,
        include: entryKind !== 'payment',
        date: dateISO,
        cleanTitle: inst.cleanTitle,
        currentInstallment: inst.currentInstallment,
        totalInstallments: inst.totalInstallments,
        amount: Math.abs(valFloat),
        entryKind,
        categoryId: cls.categoryId,
        matchedByRule: cls.matchedByRule
      });
    });
    return out;
  }

  // Parse CSV (ex: Nubank date,title,amount ou date,category,title,amount)
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const sep = lines[0].includes(';') ? ';' : ',';
  const splitCSV = (line) => {
    const cols = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === sep && !inQuotes) { cols.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    cols.push(cur.trim());
    return cols;
  };

  const headers = splitCSV(lines[0]).map(h => h.toLowerCase());
  const dateIdx = headers.findIndex(h => /^date$|^data$|release_date|dt/.test(h));
  const titleIdx = headers.findIndex(h => /^title$|descri|estabelecimento|hist|memo|nome/.test(h));
  const amtIdx = headers.findIndex(h => /^amount$|^valor$|value|net_amount|quantia/.test(h));

  // No CSV de fatura de cartão do Nubank (date,title,amount), compras são positivas e estornos/pagamentos são negativos
  const isNubankCardCSV = headers.includes('date') && headers.includes('title') && headers.includes('amount');

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSV(lines[i]);
    if (cols.length < 2) continue;
    const rawDate = cols[dateIdx >= 0 ? dateIdx : 0] || '';
    const rawTitle = cols[titleIdx >= 0 ? titleIdx : Math.min(1, cols.length - 1)] || `Item #${i}`;
    const rawAmt = cols[amtIdx >= 0 ? amtIdx : (cols.length - 1)] || '';

    const valFloat = cleanBrazilianAmountToFloat(rawAmt);
    if (isNaN(valFloat) || valFloat === 0) continue;

    let dateISO = `${defaultYM}-10`;
    if (/^\d{4}-\d{2}-\d{2}/.test(rawDate)) {
      dateISO = rawDate.slice(0, 10);
    } else if (/^\d{2}\/\d{2}\/\d{4}/.test(rawDate)) {
      const [dd, mm, yyyy] = rawDate.slice(0, 10).split('/');
      dateISO = `${yyyy}-${mm}-${dd}`;
    } else if (/^\d{2}-\d{2}-\d{4}/.test(rawDate)) {
      const [dd, mm, yyyy] = rawDate.slice(0, 10).split('-');
      dateISO = `${yyyy}-${mm}-${dd}`;
    }

    const inst = extractInstallmentInfoFromTitle(rawTitle);
    const entryKind = detectEntryKind(rawTitle, valFloat, isNubankCardCSV || true);
    const cls = classifyMerchantLocally(inst.cleanTitle);

    out.push({
      id: 'rev-' + i,
      include: entryKind !== 'payment',
      date: dateISO,
      cleanTitle: inst.cleanTitle,
      currentInstallment: inst.currentInstallment,
      totalInstallments: inst.totalInstallments,
      amount: Math.abs(valFloat),
      entryKind,
      categoryId: cls.categoryId,
      matchedByRule: cls.matchedByRule
    });
  }
  return out;
}

const PT_MONTH_MAP = {
  jan: '01', janeiro: '01',
  fev: '02', fevereiro: '02',
  mar: '03', marco: '03', 'março': '03',
  abr: '04', abril: '04',
  mai: '05', maio: '05',
  jun: '06', junho: '06',
  jul: '07', julho: '07',
  ago: '08', agosto: '08',
  set: '09', setembro: '09',
  out: '10', outubro: '10',
  nov: '11', novembro: '11',
  dez: '12', dezembro: '12'
};

function stripMarkdownFormatting(str) {
  return String(str || '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`~]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTextAccents(str) {
  return String(str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function findCategoryByExplicitName(rawCatName) {
  const norm = normalizeTextAccents(stripMarkdownFormatting(rawCatName));
  if (!norm || norm === '-' || norm === 'outros') return null;
  const exact = state.categories.find(c => !c.archived && normalizeTextAccents(c.name) === norm);
  if (exact) return exact.id;
  const partial = state.categories.find(c => !c.archived && (normalizeTextAccents(c.name).includes(norm) || norm.includes(normalizeTextAccents(c.name))));
  return partial ? partial.id : null;
}

function parseFlexibleDateBR(rawStr, fallbackYM) {
  const clean = stripMarkdownFormatting(rawStr);
  const [fbYear, fbMonth] = (fallbackYM || '2026-11').split('-');

  // 1. AAAA-MM-DD ou AAAA/MM/DD
  const iso = clean.match(/(\d{4})[-/](\d{2})[-/](\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  // 2. DD/MM/AAAA ou DD-MM-AAAA
  const brFull = clean.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
  if (brFull) {
    const dd = brFull[1].padStart(2, '0');
    const mm = brFull[2].padStart(2, '0');
    const yyyy = brFull[3].length === 2 ? `20${brFull[3]}` : brFull[3];
    if (Number(mm) >= 1 && Number(mm) <= 12 && Number(dd) >= 1 && Number(dd) <= 31) {
      return `${yyyy}-${mm}-${dd}`;
    }
  }

  // 3. "12 de novembro" / "12 nov" / "12 NOV 2026"
  const ptDate = normalizeTextAccents(clean).match(/(\d{1,2})\s*(?:de\s+)?([a-z]+)(?:\s*(?:de\s+)?(\d{4}))?/);
  if (ptDate && PT_MONTH_MAP[ptDate[2]]) {
    const dd = ptDate[1].padStart(2, '0');
    const mm = PT_MONTH_MAP[ptDate[2]];
    const yyyy = ptDate[3] || fbYear;
    return `${yyyy}-${mm}-${dd}`;
  }

  // 4. DD/MM (cuidado para não confundir com parcela X/Y se dia > 31 ou mes > 12)
  const dm = clean.match(/\b(\d{1,2})\/(\d{1,2})\b/);
  if (dm) {
    const dNum = Number(dm[1]);
    const mNum = Number(dm[2]);
    if (dNum >= 1 && dNum <= 31 && mNum >= 1 && mNum <= 12) {
      return `${fbYear}-${String(mNum).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
    }
  }

  return null;
}

function isSummaryOrTotalLine(text) {
  const norm = normalizeTextAccents(text);
  return /^(total\b|subtotal\b|valor total|total da fatura|total de compras|limite\s+(total|disponivel)|saldo\s+(anterior|atual)|resumo\s+da\s+fatura|melhor\s+dia|fechamento|vencimento)/.test(norm);
}

function parseInvoiceMarkdownLocally(rawText) {
  const lines = String(rawText || '').split(/\r?\n/);
  const defaultYM = state.selectedMonth || getTodayISO().slice(0, 7);
  let contextYM = defaultYM;
  let contextDate = null;
  let sectionForcedKind = null; // 'refund' | 'payment' | null
  const out = [];

  // 1. Detecta ano/mês no cabeçalho global (ex: "# Fatura Novembro 2026" ou "Fatura 11/2026")
  for (let k = 0; k < Math.min(20, lines.length); k++) {
    const normL = normalizeTextAccents(lines[k]);
    const ymHeading = normL.match(/([a-z]+)\s*(?:de\s+|\/)?\s*(20\d{2})/);
    if (ymHeading && PT_MONTH_MAP[ymHeading[1]]) {
      contextYM = `${ymHeading[2]}-${PT_MONTH_MAP[ymHeading[1]]}`;
      break;
    }
    const numYM = normL.match(/\b(0?[1-9]|1[0-2])\/(20\d{2})\b/);
    if (numYM) {
      contextYM = `${numYM[2]}-${String(numYM[1]).padStart(2, '0')}`;
      break;
    }
  }

  let tableCols = null; // mapeamento de colunas de tabela Markdown ativa

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();
    if (!trimmed) {
      tableCols = null;
      continue;
    }

    // Cabeçalhos Markdown (#, ##, ###) podem definir data, seção (Estornos / Pagamentos) ou resetar tabela
    if (/^#{1,6}\s+/.test(trimmed)) {
      tableCols = null;
      const headingText = stripMarkdownFormatting(trimmed.replace(/^#{1,6}\s+/, ''));
      const normHead = normalizeTextAccents(headingText);

      if (/\b(estorno|reembolso|credito|desconto)\b/.test(normHead)) {
        sectionForcedKind = 'refund';
      } else if (/\bpagamento/.test(normHead)) {
        sectionForcedKind = 'payment';
      } else if (/\b(compra|lancamento|despesa|itens|fatura|gasto)/.test(normHead)) {
        sectionForcedKind = null;
      }

      const hDate = parseFlexibleDateBR(headingText, contextYM);
      if (hDate) contextDate = hDate;
      continue;
    }

    // Detecta linha de tabela Markdown (`| col1 | col2 | ... |`)
    if (trimmed.startsWith('|') || (trimmed.split('|').length >= 3 && !/^[-*+]\s/.test(trimmed))) {
      const rawCells = trimmed
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map(c => stripMarkdownFormatting(c));

      // Ignora linha separadora `| --- | :---: |`
      if (rawCells.every(c => /^:?-{2,}:?$/.test(c.replace(/\s/g, '')) || c === '')) {
        continue;
      }

      // Verifica se é cabeçalho da tabela
      const normCells = rawCells.map(c => normalizeTextAccents(c));
      const looksLikeHeader = normCells.some(c => /^(data|date|dt)$/.test(c)) ||
        (normCells.some(c => /descri|estabelecimento|title|loja|item|nome|historico/.test(c)) &&
         normCells.some(c => /valor|amount|preco|total/.test(c)));

      if (looksLikeHeader) {
        tableCols = {
          dateIdx: normCells.findIndex(c => /data|date|dt/.test(c)),
          titleIdx: normCells.findIndex(c => /descri|estabelecimento|title|loja|item|nome|historico/.test(c)),
          instIdx: normCells.findIndex(c => /parcela|prestacao/.test(c)),
          catIdx: normCells.findIndex(c => /categ/.test(c)),
          typeIdx: normCells.findIndex(c => /^tipo$|classifica/.test(c)),
          amtIdx: normCells.findIndex(c => /valor|amount|preco|total/.test(c))
        };
        continue;
      }

      // Linha de dados da tabela
      let cellDate = tableCols && tableCols.dateIdx >= 0 ? rawCells[tableCols.dateIdx] : '';
      let cellTitle = tableCols && tableCols.titleIdx >= 0 ? rawCells[tableCols.titleIdx] : '';
      const cellInst = tableCols && tableCols.instIdx >= 0 ? rawCells[tableCols.instIdx] : '';
      const cellCat = tableCols && tableCols.catIdx >= 0 ? rawCells[tableCols.catIdx] : '';
      const cellType = tableCols && tableCols.typeIdx >= 0 ? rawCells[tableCols.typeIdx] : '';
      let cellAmt = tableCols && tableCols.amtIdx >= 0 ? rawCells[tableCols.amtIdx] : '';

      // Se tabela não tinha cabeçalho explícito, infere colunas pelo conteúdo
      if (!tableCols) {
        for (const c of rawCells) {
          if (!cellDate && parseFlexibleDateBR(c, contextYM)) { cellDate = c; continue; }
          if (!cellAmt && /[+-]?\s*(?:R\$\s*)?\d[\d.]*,\d{2}/.test(c)) { cellAmt = c; continue; }
          if (!cellTitle && c.length > 1 && !/^\d+\/\d+$/.test(c)) { cellTitle = c; }
        }
        if (!cellAmt) cellAmt = rawCells[rawCells.length - 1] || '';
      }

      if (!cellTitle || isSummaryOrTotalLine(cellTitle)) continue;
      const amtMatch = cellAmt.match(/[+-]?\s*(?:R\$\s*)?[\d.]+\s*,\s*\d{2}|[+-]?\s*(?:R\$\s*)?\d+(?:\.\d{2})?/);
      const valFloat = cleanBrazilianAmountToFloat(amtMatch ? amtMatch[0] : cellAmt);
      if (isNaN(valFloat) || valFloat === 0) continue;

      const parsedDate = parseFlexibleDateBR(cellDate, contextYM) || contextDate || `${contextYM}-10`;
      const inst = extractInstallmentInfoFromTitle(cellTitle);

      // Se houver coluna Parcela explícita (ex: "2/10" ou "3 de 6")
      if (cellInst && inst.totalInstallments === 1) {
        const instColMatch = cellInst.match(/(\d{1,2})\s*(?:\/|de)\s*(\d{1,2})/i);
        if (instColMatch) {
          inst.currentInstallment = Math.max(1, parseInt(instColMatch[1], 10) || 1);
          inst.totalInstallments = Math.max(inst.currentInstallment, parseInt(instColMatch[2], 10) || 1);
        }
      }

      let entryKind = sectionForcedKind || detectEntryKind(cellTitle + ' ' + cellType, valFloat, true);
      if (/estorno|reembolso/i.test(cellType)) entryKind = 'refund';
      if (/pagamento/i.test(cellType)) entryKind = 'payment';

      const explicitCatId = cellCat ? findCategoryByExplicitName(cellCat) : null;
      const cls = classifyMerchantLocally(inst.cleanTitle);

      out.push({
        id: 'md-' + i,
        include: entryKind !== 'payment',
        date: parsedDate,
        cleanTitle: inst.cleanTitle,
        currentInstallment: inst.currentInstallment,
        totalInstallments: inst.totalInstallments,
        amount: Math.abs(valFloat),
        entryKind,
        categoryId: explicitCatId || cls.categoryId,
        matchedByRule: Boolean(explicitCatId) || cls.matchedByRule
      });
      continue;
    }

    // Listas com marcadores (-, *, 1., - [ ]) ou linhas livres de lançamento
    tableCols = null;
    let lineBody = trimmed
      .replace(/^[-*+]\s+\[[ xX]\]\s+/, '')
      .replace(/^[-*+]\s+/, '')
      .replace(/^\d+[.)]\s+/, '');
    lineBody = stripMarkdownFormatting(lineBody);

    if (!lineBody || isSummaryOrTotalLine(lineBody)) continue;

    // Bloco apenas de data (ex: "12 NOV" ou "12/11/2026") para herdar na linha seguinte
    const standaloneDate = parseFlexibleDateBR(lineBody, contextYM);
    if (standaloneDate && lineBody.length <= 22 && !/\d,\d{2}/.test(lineBody)) {
      contextDate = standaloneDate;
      continue;
    }

    // Extrai valor monetário da linha (ex: "- R$ 1.946,15", "R$ 243,75", "55,00")
    const moneyMatches = [...lineBody.matchAll(/([+-]?\s*(?:R\$\s*)?\d{1,3}(?:\.\d{3})*,\d{2}|[+-]?\s*R\$\s*\d+,\d{2}|[+-]?\s*\d+\.\d{2}(?!\d))/gi)];
    let pickedMoney = moneyMatches.length > 0 ? moneyMatches[moneyMatches.length - 1][0] : null;
    let pickedLineDate = parseFlexibleDateBR(lineBody, contextYM);
    let titleRemainder = lineBody;

    // Suporte a bloco multi-linha (Estabelecimento na linha atual + Valor na linha seguinte)
    if (!pickedMoney && i + 1 < lines.length) {
      const nextClean = stripMarkdownFormatting(lines[i + 1].trim().replace(/^[-*+]\s+/, ''));
      const nextMoneyMatch = nextClean.match(/^([+-]?\s*(?:R\$\s*)?\d{1,3}(?:\.\d{3})*,\d{2}|[+-]?\s*R\$\s*\d+,\d{2})$/i);
      if (nextMoneyMatch && !isSummaryOrTotalLine(lineBody)) {
        pickedMoney = nextMoneyMatch[0];
        i += 1;
      }
    }

    if (!pickedMoney) continue;
    const valFloat = cleanBrazilianAmountToFloat(pickedMoney);
    if (isNaN(valFloat) || valFloat === 0) continue;

    // Remove o trecho do valor e o trecho da data para sobrar apenas o estabelecimento
    titleRemainder = titleRemainder.replace(pickedMoney, ' ');
    if (pickedLineDate) {
      titleRemainder = titleRemainder
        .replace(/\b\d{4}[-/]\d{2}[-/]\d{2}\b/, ' ')
        .replace(/\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/, ' ')
        .replace(/\b\d{1,2}\/\d{1,2}\b/, ' ')
        .replace(/\b\d{1,2}\s*(?:de\s+)?(?:jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)[a-z]*(?:\s*(?:de\s+)?\d{4})?\b/i, ' ');
    }

    // Extrai categoria entre parênteses ou colchetes no fim (ex: "[Transporte]" ou "(Delivery)")
    let explicitCatId = null;
    const catTagMatch = titleRemainder.match(/(?:\(|\[)([A-Za-zÀ-ÿ\s/&]+)(?:\)|\])\s*$/);
    if (catTagMatch && !/^\d+\/\d+$/.test(catTagMatch[1])) {
      const foundCat = findCategoryByExplicitName(catTagMatch[1]);
      if (foundCat) {
        explicitCatId = foundCat;
        titleRemainder = titleRemainder.slice(0, catTagMatch.index).trim();
      }
    }

    titleRemainder = titleRemainder
      .replace(/^[\s\-—–:|•]+/, '')
      .replace(/[\s\-—–:|•]+$/, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!titleRemainder || isSummaryOrTotalLine(titleRemainder)) continue;

    const inst = extractInstallmentInfoFromTitle(titleRemainder);
    const entryKind = sectionForcedKind || detectEntryKind(titleRemainder, valFloat, true);
    const cls = classifyMerchantLocally(inst.cleanTitle);

    out.push({
      id: 'md-' + i,
      include: entryKind !== 'payment',
      date: pickedLineDate || contextDate || `${contextYM}-10`,
      cleanTitle: inst.cleanTitle,
      currentInstallment: inst.currentInstallment,
      totalInstallments: inst.totalInstallments,
      amount: Math.abs(valFloat),
      entryKind,
      categoryId: explicitCatId || cls.categoryId,
      matchedByRule: Boolean(explicitCatId) || cls.matchedByRule
    });
  }

  return out;
}

function setImportStatusBanner(msg, type = 'info') {
  const banner = document.getElementById('imp-status-banner');
  if (!banner) return;
  if (!msg) {
    banner.style.display = 'none';
    return;
  }
  banner.style.display = 'block';
  banner.style.background = type === 'error' ? 'var(--coral-soft)' : type === 'success' ? 'var(--green-soft)' : 'rgba(56, 182, 255, 0.14)';
  banner.style.color = type === 'error' ? 'var(--coral-red)' : type === 'success' ? 'var(--green-emerald)' : 'var(--cyan-accent)';
  banner.textContent = msg;
}

function renderInvoiceReviewTable() {
  const previewSec = document.getElementById('imp-preview-section');
  const tbody = document.getElementById('imp-review-tbody');
  const metricsEl = document.getElementById('imp-summary-metrics');
  const confirmBtn = document.getElementById('btn-confirm-import-invoice');
  const aiBtn = document.getElementById('btn-imp-ai-categorize');
  if (!previewSec || !tbody || !metricsEl || !confirmBtn) return;

  if (invoiceReviewItems.length === 0) {
    previewSec.style.display = 'none';
    confirmBtn.disabled = true;
    return;
  }

  previewSec.style.display = 'flex';
  const activeCats = state.categories.filter(c => !c.archived);
  const projectFuture = Boolean(document.getElementById('imp-project-installments')?.checked);

  let totalPurchaseCents = 0;
  let totalRefundCents = 0;
  let ignoredPaymentsCount = 0;
  let futureProjectedCount = 0;
  let unknownMerchantsCount = 0;
  let selectedActiveCount = 0;

  invoiceReviewItems.forEach(item => {
    if (!item.matchedByRule && item.entryKind === 'purchase') unknownMerchantsCount++;
    if (item.entryKind === 'payment' || !item.include) {
      if (item.entryKind === 'payment') ignoredPaymentsCount++;
      return;
    }
    selectedActiveCount++;
    const cents = Math.round((Number(item.amount) || 0) * 100);
    if (item.entryKind === 'refund') {
      totalRefundCents += cents;
    } else {
      totalPurchaseCents += cents;
      if (projectFuture && item.totalInstallments > item.currentInstallment) {
        futureProjectedCount += (item.totalInstallments - item.currentInstallment);
      }
    }
  });

  const netInvoiceCents = Math.max(0, totalPurchaseCents - totalRefundCents);

  metricsEl.innerHTML = `
    <span>Compras: <b style="color:var(--coral-red);">${fmtBRL(totalPurchaseCents)}</b></span>
    <span>Estornos Abatidos: <b style="color:var(--green-emerald);">-${fmtBRL(totalRefundCents)}</b></span>
    <span>Líquido na Fatura: <b>${fmtBRL(netInvoiceCents)}</b></span>
    <span>Pagamentos ignorados: <b>${ignoredPaymentsCount}</b></span>
    ${projectFuture && futureProjectedCount > 0 ? `<span style="color:#a78bfa;">Parcelas futuras a projetar: <b>+${futureProjectedCount}</b></span>` : ''}
  `;

  if (aiBtn) {
    aiBtn.textContent = unknownMerchantsCount > 0
      ? `✨ Sugerir Categorias c/ IA (${unknownMerchantsCount} desconhecido${unknownMerchantsCount > 1 ? 's' : ''})`
      : '✨ Reclassificar Tudo c/ IA';
  }

  confirmBtn.disabled = selectedActiveCount === 0;
  confirmBtn.textContent = `Confirmar e Lançar (${selectedActiveCount} item${selectedActiveCount === 1 ? '' : 's'})`;

  tbody.innerHTML = invoiceReviewItems.map((it, idx) => {
    const catOptions = activeCats.map(c => `<option value="${c.id}" ${c.id === it.categoryId ? 'selected' : ''}>${c.name}</option>`).join('');
    const isPayment = it.entryKind === 'payment';
    const isRefund = it.entryKind === 'refund';
    const rowOpacity = !it.include ? 'opacity:0.52;' : '';
    const futureRest = it.totalInstallments > it.currentInstallment ? (it.totalInstallments - it.currentInstallment) : 0;

    return `
      <tr style="${rowOpacity}">
        <td>
          <input type="checkbox" class="imp-row-check" data-imp-idx="${idx}" ${it.include ? 'checked' : ''} />
        </td>
        <td>
          <input type="date" class="form-input imp-row-date" data-imp-idx="${idx}" value="${it.date}" style="padding:5px 7px; font-size:11.5px;" />
        </td>
        <td>
          <div style="display:flex; align-items:center; gap:6px;">
            <input type="text" class="form-input imp-row-title" data-imp-idx="${idx}" value="${it.cleanTitle.replace(/"/g, '&quot;')}" style="padding:5px 8px; font-size:12px; font-weight:600;" />
            ${!it.matchedByRule && it.entryKind === 'purchase' ? `<span class="tag-pill" title="Estabelecimento sem regra local — revise ou clique em Sugerir c/ IA" style="font-size:10px; color:var(--amber-gold);">Novo</span>` : ''}
          </div>
        </td>
        <td>
          <div style="display:flex; align-items:center; gap:4px;">
            <input type="number" min="1" max="48" class="form-input imp-row-cur-inst" data-imp-idx="${idx}" value="${it.currentInstallment}" style="width:42px; padding:4px 5px; font-size:11.5px; text-align:center;" />
            <span style="color:var(--text-muted);">/</span>
            <input type="number" min="1" max="48" class="form-input imp-row-tot-inst" data-imp-idx="${idx}" value="${it.totalInstallments}" style="width:42px; padding:4px 5px; font-size:11.5px; text-align:center;" />
          </div>
          ${futureRest > 0 && projectFuture ? `<div style="font-size:10px; color:#a78bfa; margin-top:2px;">+${futureRest} mês(es)</div>` : ''}
        </td>
        <td>
          <select class="form-select imp-row-kind" data-imp-idx="${idx}" style="padding:5px 7px; font-size:11.5px; color:${isPayment ? 'var(--text-muted)' : isRefund ? 'var(--green-emerald)' : 'var(--text-main)'};">
            <option value="purchase" ${it.entryKind === 'purchase' ? 'selected' : ''}>Compra (+)</option>
            <option value="refund" ${it.entryKind === 'refund' ? 'selected' : ''}>Estorno (-)</option>
            <option value="payment" ${it.entryKind === 'payment' ? 'selected' : ''}>Pagto Fatura (Ignorar)</option>
          </select>
        </td>
        <td>
          <select class="form-select imp-row-cat" data-imp-idx="${idx}" style="padding:5px 7px; font-size:11.5px;" ${isPayment ? 'disabled' : ''}>
            ${catOptions}
          </select>
        </td>
        <td style="text-align:right;">
          <input type="number" step="0.01" min="0.01" class="form-input imp-row-amt" data-imp-idx="${idx}" value="${Number(it.amount).toFixed(2)}" style="padding:5px 7px; font-size:12px; font-weight:700; text-align:right; color:${isRefund ? 'var(--green-emerald)' : 'var(--coral-red)'};" />
        </td>
      </tr>
    `;
  }).join('');

  // Bind eventos de edição em tempo real nas células
  tbody.querySelectorAll('.imp-row-check').forEach(el => {
    el.addEventListener('change', (e) => {
      const i = Number(el.dataset.impIdx);
      if (invoiceReviewItems[i]) {
        invoiceReviewItems[i].include = e.target.checked;
        renderInvoiceReviewTable();
      }
    });
  });

  tbody.querySelectorAll('.imp-row-date').forEach(el => {
    el.addEventListener('change', (e) => {
      const i = Number(el.dataset.impIdx);
      if (invoiceReviewItems[i]) invoiceReviewItems[i].date = e.target.value;
    });
  });

  tbody.querySelectorAll('.imp-row-title').forEach(el => {
    el.addEventListener('input', (e) => {
      const i = Number(el.dataset.impIdx);
      if (invoiceReviewItems[i]) invoiceReviewItems[i].cleanTitle = e.target.value;
    });
  });

  tbody.querySelectorAll('.imp-row-cur-inst').forEach(el => {
    el.addEventListener('change', (e) => {
      const i = Number(el.dataset.impIdx);
      if (invoiceReviewItems[i]) {
        invoiceReviewItems[i].currentInstallment = Math.max(1, parseInt(e.target.value, 10) || 1);
        if (invoiceReviewItems[i].totalInstallments < invoiceReviewItems[i].currentInstallment) {
          invoiceReviewItems[i].totalInstallments = invoiceReviewItems[i].currentInstallment;
        }
        renderInvoiceReviewTable();
      }
    });
  });

  tbody.querySelectorAll('.imp-row-tot-inst').forEach(el => {
    el.addEventListener('change', (e) => {
      const i = Number(el.dataset.impIdx);
      if (invoiceReviewItems[i]) {
        invoiceReviewItems[i].totalInstallments = Math.max(invoiceReviewItems[i].currentInstallment, parseInt(e.target.value, 10) || 1);
        renderInvoiceReviewTable();
      }
    });
  });

  tbody.querySelectorAll('.imp-row-kind').forEach(el => {
    el.addEventListener('change', (e) => {
      const i = Number(el.dataset.impIdx);
      if (invoiceReviewItems[i]) {
        invoiceReviewItems[i].entryKind = e.target.value;
        invoiceReviewItems[i].include = e.target.value !== 'payment';
        renderInvoiceReviewTable();
      }
    });
  });

  tbody.querySelectorAll('.imp-row-cat').forEach(el => {
    el.addEventListener('change', (e) => {
      const i = Number(el.dataset.impIdx);
      if (invoiceReviewItems[i]) {
        invoiceReviewItems[i].categoryId = e.target.value;
        invoiceReviewItems[i].matchedByRule = true;
      }
    });
  });

  tbody.querySelectorAll('.imp-row-amt').forEach(el => {
    el.addEventListener('change', (e) => {
      const i = Number(el.dataset.impIdx);
      const v = parseFloat(e.target.value);
      if (invoiceReviewItems[i] && !isNaN(v) && v > 0) {
        invoiceReviewItems[i].amount = v;
        renderInvoiceReviewTable();
      }
    });
  });
}

function openImportInvoiceModal(preselectedAccountId = null) {
  const modal = document.getElementById('modal-import-invoice');
  if (!modal) return;

  const accSelect = document.getElementById('imp-target-account');
  if (accSelect) {
    accSelect.innerHTML = state.accounts
      .map(a => `<option value="${a.id}">${a.name} (${a.type})</option>`)
      .join('');
    if (preselectedAccountId && state.accounts.some(a => a.id === preselectedAccountId)) {
      accSelect.value = preselectedAccountId;
    } else if (state.lastUsedAccountId && state.accounts.some(a => a.id === state.lastUsedAccountId)) {
      accSelect.value = state.lastUsedAccountId;
    }
  }

  const keyInput = document.getElementById('imp-gemini-key');
  if (keyInput && typeof window !== 'undefined') {
    keyInput.value = window.localStorage.getItem('farol_gemini_api_key') || '';
  }

  const fileInput = document.getElementById('imp-file-input');
  if (fileInput) fileInput.value = '';
  invoiceReviewItems = [];
  setImportStatusBanner('');
  renderInvoiceReviewTable();
  bindImportInvoiceModalEvents();
  modal.classList.add('open');
}

function bindImportInvoiceModalEvents() {
  if (invoiceModalBound) return;
  invoiceModalBound = true;

  const fileInput = document.getElementById('imp-file-input');
  const projCheck = document.getElementById('imp-project-installments');
  const checkAll = document.getElementById('imp-check-all');
  const aiCatBtn = document.getElementById('btn-imp-ai-categorize');
  const confirmBtn = document.getElementById('btn-confirm-import-invoice');
  const keyInput = document.getElementById('imp-gemini-key');

  if (keyInput) {
    keyInput.addEventListener('change', () => {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('farol_gemini_api_key', keyInput.value.trim());
      }
    });
  }

  if (projCheck) {
    projCheck.addEventListener('change', () => renderInvoiceReviewTable());
  }

  if (checkAll) {
    checkAll.addEventListener('change', (e) => {
      invoiceReviewItems.forEach(it => {
        if (it.entryKind !== 'payment') it.include = e.target.checked;
      });
      renderInvoiceReviewTable();
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const lowerName = file.name.toLowerCase();

      // 1. Arquivos CSV, OFX ou Markdown (.md) -> Parse 100% via código local (custo zero de IA)
      if (
        lowerName.endsWith('.csv') ||
        lowerName.endsWith('.ofx') ||
        lowerName.endsWith('.md') ||
        lowerName.endsWith('.markdown') ||
        lowerName.endsWith('.txt')
      ) {
        const isMarkdown = lowerName.endsWith('.md') || lowerName.endsWith('.markdown');
        setImportStatusBanner(`Lendo "${file.name}" localmente...`, 'info');
        const reader = new FileReader();
        reader.onload = async () => {
          const textContent = String(reader.result || '');
          const parsed = isMarkdown
            ? parseInvoiceMarkdownLocally(textContent)
            : parseInvoiceCSVOrOFXLocally(textContent, file.name);

          if (parsed.length > 0) {
            invoiceReviewItems = parsed;
            setImportStatusBanner(
              `✓ ${parsed.length} lançamento(s) extraídos localmente de "${file.name}". Revise a tabela abaixo antes de confirmar.`,
              'success'
            );
            renderInvoiceReviewTable();
            return;
          }

          // Fallback com IA para Markdown não-estruturado (caso o usuário tenha chave Gemini)
          const apiKey = document.getElementById('imp-gemini-key')?.value?.trim() || '';
          if (isMarkdown) {
            setImportStatusBanner(`Markdown sem padrão tabular detectado — tentando interpretação inteligente em "${file.name}"...`, 'info');
            try {
              const defaultYear = (state.selectedMonth || '2026-11').split('-')[0];
              const res = await fetch('/api/import-invoice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  mode: 'extract',
                  apiKey,
                  rawText: textContent,
                  mimeType: 'text/markdown',
                  defaultYear,
                  categories: state.categories.filter(c => !c.archived).map(c => ({ id: c.id, name: c.name }))
                })
              });
              const data = await res.json();
              if (res.ok && data.ok && Array.isArray(data.items) && data.items.length > 0) {
                invoiceReviewItems = data.items.map((it, idx) => {
                  const localCls = classifyMerchantLocally(it.cleanTitle);
                  const validCatId = state.categories.some(c => c.id === it.suggestedCategoryId)
                    ? it.suggestedCategoryId
                    : localCls.categoryId;
                  const kind = ['purchase', 'refund', 'payment'].includes(it.entryKind)
                    ? it.entryKind
                    : detectEntryKind(it.cleanTitle, Number(it.amount) || 0, true);
                  return {
                    id: 'md-ai-' + idx,
                    include: kind !== 'payment',
                    date: /^\d{4}-\d{2}-\d{2}/.test(it.date || '') ? it.date.slice(0, 10) : `${state.selectedMonth}-10`,
                    cleanTitle: String(it.cleanTitle || `Item #${idx + 1}`).trim(),
                    currentInstallment: Math.max(1, parseInt(it.currentInstallment, 10) || 1),
                    totalInstallments: Math.max(1, parseInt(it.totalInstallments, 10) || 1),
                    amount: Math.abs(Number(it.amount) || 0),
                    entryKind: kind,
                    categoryId: localCls.matchedByRule ? localCls.categoryId : validCatId,
                    matchedByRule: true
                  };
                });
                setImportStatusBanner(`✓ ${invoiceReviewItems.length} lançamento(s) interpretados do Markdown "${file.name}". Revise antes de salvar.`, 'success');
                renderInvoiceReviewTable();
                return;
              }
            } catch {
              // Cai na mensagem amigável abaixo
            }
          }

          setImportStatusBanner(
            isMarkdown
              ? 'Nenhum lançamento identificado no arquivo .md. Use tabelas Markdown (| Data | Descrição | Valor |) ou lista com datas e valores em R$.'
              : 'Nenhum lançamento identificado no CSV. Verifique se o arquivo possui colunas date, title e amount.',
            'error'
          );
        };
        reader.readAsText(file);
        return;
      }

      // 2. Arquivos PDF ou Imagem (.pdf, .png, .jpg, .webp) -> OCR Multimodal via Gemini API
      const apiKey = document.getElementById('imp-gemini-key')?.value?.trim() || '';
      if (apiKey && typeof window !== 'undefined') {
        window.localStorage.setItem('farol_gemini_api_key', apiKey);
      }

      setImportStatusBanner(`Extraindo dados da fatura "${file.name}" via Visão/OCR Inteligente...`, 'info');
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const dataUrl = String(reader.result || '');
          const base64Data = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
          const mimeType = file.type || (lowerName.endsWith('.pdf') ? 'application/pdf' : 'image/png');
          const defaultYear = (state.selectedMonth || '2026-11').split('-')[0];

          const res = await fetch('/api/import-invoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mode: 'extract',
              apiKey,
              fileDataBase64: base64Data,
              mimeType,
              defaultYear,
              categories: state.categories.filter(c => !c.archived).map(c => ({ id: c.id, name: c.name }))
            })
          });
          const data = await res.json();
          if (!res.ok || !data.ok) {
            setImportStatusBanner(data.error || 'Não foi possível extrair os dados do PDF/Imagem.', 'error');
            return;
          }

          const rawItems = Array.isArray(data.items) ? data.items : [];
          invoiceReviewItems = rawItems.map((it, idx) => {
            const localCls = classifyMerchantLocally(it.cleanTitle);
            const validCatId = state.categories.some(c => c.id === it.suggestedCategoryId)
              ? it.suggestedCategoryId
              : localCls.categoryId;
            const kind = ['purchase', 'refund', 'payment'].includes(it.entryKind)
              ? it.entryKind
              : detectEntryKind(it.cleanTitle, Number(it.amount) || 0, true);
            return {
              id: 'ocr-' + idx,
              include: kind !== 'payment',
              date: /^\d{4}-\d{2}-\d{2}/.test(it.date || '') ? it.date.slice(0, 10) : `${state.selectedMonth}-10`,
              cleanTitle: String(it.cleanTitle || `Item #${idx + 1}`).trim(),
              currentInstallment: Math.max(1, parseInt(it.currentInstallment, 10) || 1),
              totalInstallments: Math.max(1, parseInt(it.totalInstallments, 10) || 1),
              amount: Math.abs(Number(it.amount) || 0),
              entryKind: kind,
              categoryId: localCls.matchedByRule ? localCls.categoryId : validCatId,
              matchedByRule: true
            };
          });

          setImportStatusBanner(`✓ ${invoiceReviewItems.length} lançamento(s) extraídos via OCR de "${file.name}". Revise antes de salvar.`, 'success');
          renderInvoiceReviewTable();
        } catch {
          setImportStatusBanner('Erro ao enviar documento para leitura OCR.', 'error');
        }
      };
      reader.readAsDataURL(file);
    });
  }

  const parseMdTextBtn = document.getElementById('btn-imp-parse-md-text');
  if (parseMdTextBtn) {
    parseMdTextBtn.addEventListener('click', () => {
      const mdArea = document.getElementById('imp-md-textarea');
      const rawMd = mdArea ? mdArea.value : '';
      const parsed = parseInvoiceMarkdownLocally(rawMd);
      if (parsed.length === 0) {
        setImportStatusBanner('Nenhum lançamento reconhecido no Markdown colado. Verifique se cada linha tem descrição e valor (ex: 12/11 Mercado Livre - Parcela 2/10 R$ 149,90).', 'error');
        return;
      }
      invoiceReviewItems = parsed;
      setImportStatusBanner(`✓ ${parsed.length} lançamento(s) extraídos do Markdown colado. Revise a tabela abaixo antes de confirmar.`, 'success');
      renderInvoiceReviewTable();
    });
  }

  if (aiCatBtn) {
    aiCatBtn.addEventListener('click', async () => {
      if (invoiceReviewItems.length === 0) return;
      const apiKey = document.getElementById('imp-gemini-key')?.value?.trim() || '';
      if (apiKey && typeof window !== 'undefined') {
        window.localStorage.setItem('farol_gemini_api_key', apiKey);
      }
      const unknownItems = invoiceReviewItems.filter(it => !it.matchedByRule && it.entryKind === 'purchase');
      const targetList = unknownItems.length > 0 ? unknownItems : invoiceReviewItems.filter(it => it.entryKind === 'purchase');
      const uniqueMerchants = [...new Set(targetList.map(it => it.cleanTitle))];
      if (uniqueMerchants.length === 0) return;

      setImportStatusBanner(`Classificando ${uniqueMerchants.length} estabelecimento(s) com IA...`, 'info');
      try {
        const res = await fetch('/api/import-invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'categorize',
            apiKey,
            merchants: uniqueMerchants,
            categories: state.categories.filter(c => !c.archived).map(c => ({ id: c.id, name: c.name }))
          })
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          setImportStatusBanner(data.error || 'Não foi possível categorizar com IA.', 'error');
          return;
        }
        const mappings = data.mappings || {};
        let updatedCount = 0;
        invoiceReviewItems.forEach(it => {
          const sug = mappings[it.cleanTitle];
          if (sug && state.categories.some(c => c.id === sug)) {
            it.categoryId = sug;
            it.matchedByRule = true;
            updatedCount++;
          }
        });
        setImportStatusBanner(`✓ ${updatedCount} lançamento(s) categorizados automaticamente pela IA!`, 'success');
        renderInvoiceReviewTable();
      } catch {
        setImportStatusBanner('Erro ao consultar o classificador IA.', 'error');
      }
    });
  }

  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      const targetAccId = document.getElementById('imp-target-account')?.value || state.accounts[0]?.id || 'acc-nubank';
      const targetAcc = getAccountById(targetAccId);
      const projectFuture = Boolean(document.getElementById('imp-project-installments')?.checked);
      const selectedRows = invoiceReviewItems.filter(it => it.include && it.entryKind !== 'payment');
      if (selectedRows.length === 0) return;

      undoSnapshot = JSON.parse(JSON.stringify(state.transactions));
      let addedCurrent = 0;
      let addedFuture = 0;
      let addedRefunds = 0;

      selectedRows.forEach((row, idx) => {
        const amountCents = Math.round((Number(row.amount) || 0) * 100);
        if (amountCents <= 0) return;
        const curInst = Math.max(1, Number(row.currentInstallment) || 1);
        const totInst = Math.max(curInst, Number(row.totalInstallments) || 1);
        const baseDate = /^\d{4}-\d{2}-\d{2}/.test(row.date || '') ? row.date.slice(0, 10) : `${state.selectedMonth}-10`;
        const baseYM = baseDate.slice(0, 7);
        const baseDayStr = baseDate.slice(8, 10) || '10';

        // 1. Estornos: abatem o valor da fatura e registram o crédito
        if (row.entryKind === 'refund') {
          const invYM = getInvoiceMonthForTransaction({ date: baseDate, method: 'Cartão de Crédito', type: 'expense' }, targetAcc);
          const curMeta = getInvoiceMeta(targetAcc.id, invYM);
          setInvoiceMeta(targetAcc.id, {
            adjustmentCents: (Number(curMeta.adjustmentCents) || 0) - amountCents
          }, invYM);

          state.transactions.push({
            id: `tx-refund-${Date.now()}-${idx}`,
            type: 'income',
            amountCents,
            description: `Estorno Fatura: ${row.cleanTitle}`,
            tag: 'estorno',
            categoryId: row.categoryId,
            accountId: targetAcc.id,
            date: baseDate,
            method: 'Estorno Cartão'
          });
          addedRefunds++;
          return;
        }

        // 2. Compras à vista ou parceladas (Parcela X/Y)
        const descCur = totInst > 1 ? `${row.cleanTitle} (${curInst}/${totInst})` : row.cleanTitle;
        const groupId = totInst > 1 ? `instgrp-${Date.now()}-${idx}` : undefined;

        const isDupCur = state.transactions.some(t =>
          t.accountId === targetAcc.id &&
          t.date === baseDate &&
          t.amountCents === amountCents &&
          (t.description || '').toLowerCase() === descCur.toLowerCase()
        );
        if (!isDupCur) {
          state.transactions.push({
            id: `tx-imp-${Date.now()}-${idx}`,
            installmentGroupId: groupId,
            installmentIndex: curInst,
            installmentTotal: totInst,
            type: 'expense',
            amountCents,
            description: descCur,
            tag: totInst > 1 ? 'parcelado' : 'fatura',
            categoryId: row.categoryId,
            accountId: targetAcc.id,
            date: baseDate,
            method: 'Cartão de Crédito'
          });
          addedCurrent++;
        }

        // 3. Projeção automática das parcelas restantes (X+1/Y até Y/Y) nos próximos meses
        if (projectFuture && totInst > curInst) {
          const remaining = totInst - curInst;
          for (let step = 1; step <= remaining; step++) {
            const nextInstNum = curInst + step;
            const futureYM = addMonthsYM(baseYM, step);
            const futureDate = `${futureYM}-${baseDayStr}`;
            const futureDesc = `${row.cleanTitle} (${nextInstNum}/${totInst})`;

            const isDupFuture = state.transactions.some(t =>
              t.accountId === targetAcc.id &&
              (t.date || '').startsWith(futureYM) &&
              t.amountCents === amountCents &&
              (t.description || '').toLowerCase() === futureDesc.toLowerCase()
            );
            if (!isDupFuture) {
              state.transactions.push({
                id: `tx-imp-fut-${Date.now()}-${idx}-${step}`,
                installmentGroupId: groupId,
                installmentIndex: nextInstNum,
                installmentTotal: totInst,
                type: 'expense',
                amountCents,
                description: futureDesc,
                tag: 'parcelado',
                categoryId: row.categoryId,
                accountId: targetAcc.id,
                date: futureDate,
                method: 'Cartão de Crédito'
              });
              addedFuture++;
            }
          }
        }
      });

      state.lastUsedAccountId = targetAcc.id;
      if (selectedRows[0]?.date) {
        state.selectedMonth = selectedRows[0].date.slice(0, 7);
      }
      saveState();
      document.getElementById('modal-import-invoice')?.classList.remove('open');
      renderApp();
      showUndoToast(
        `Fatura importada: ${addedCurrent} compra(s)` +
        (addedFuture > 0 ? `, +${addedFuture} parcela(s) futura(s)` : '') +
        (addedRefunds > 0 ? ` e ${addedRefunds} estorno(s)` : '') + '.'
      );
    });
  }
}

function bindTransacoesEvents() {
  const newBtn = document.getElementById('btn-new-tx-page');
  if (newBtn) newBtn.addEventListener('click', () => openTransactionModal());

  const importBtn = document.getElementById('btn-import-statement');
  if (importBtn) {
    importBtn.addEventListener('click', () => openImportInvoiceModal());
  }

  const searchInput = document.getElementById('filter-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const selStart = e.target.selectionStart ?? e.target.value.length;
      const selEnd = e.target.selectionEnd ?? selStart;
      txFilter.search = e.target.value;
      renderApp();
      const el = document.getElementById('filter-search');
      if (el) { el.focus(); el.setSelectionRange(selStart, selEnd); }
    });
  }

  ['filter-period', 'filter-category', 'filter-account', 'filter-tag'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', (e) => {
      const key = id.replace('filter-', '') === 'category' ? 'categoryId' : id.replace('filter-', '') === 'account' ? 'accountId' : id.replace('filter-', '');
      txFilter[key] = e.target.value;
      selectedTxIds.clear();
      renderApp();
    });
  });

  const selAll = document.getElementById('tx-select-all');
  if (selAll) {
    selAll.addEventListener('change', (e) => {
      const filtered = getFilteredTransactions();
      if (e.target.checked) filtered.forEach(t => selectedTxIds.add(t.id));
      else selectedTxIds.clear();
      renderApp();
    });
  }

  document.querySelectorAll('.tx-row-check').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const id = cb.dataset.txCheck;
      if (e.target.checked) selectedTxIds.add(id);
      else selectedTxIds.delete(id);
      renderApp();
    });
  });

  const applyBatch = (label, mutator) => {
    if (selectedTxIds.size === 0) return;
    openDialogModal({
      title: label,
      message: `Confirmar "${label}" em ${selectedTxIds.size} transação(ões)?`,
      confirmLabel: 'Confirmar',
      onConfirm: () => {
        undoSnapshot = JSON.parse(JSON.stringify(state.transactions));
        mutator();
        selectedTxIds.clear();
        saveState();
        renderApp();
        showUndoToast(`${label} concluída.`);
      }
    });
  };

  const batchCat = document.getElementById('batch-cat-select');
  if (batchCat) {
    batchCat.addEventListener('change', () => {
      const newCatId = batchCat.value;
      if (!newCatId) return;
      applyBatch('Alterar categoria em lote', () => {
        state.transactions.forEach(t => { if (selectedTxIds.has(t.id)) t.categoryId = newCatId; });
      });
    });
  }

  const batchAcc = document.getElementById('batch-acc-select');
  if (batchAcc) {
    batchAcc.addEventListener('change', () => {
      const newAccId = batchAcc.value;
      if (!newAccId) return;
      applyBatch('Alterar conta em lote', () => {
        state.transactions.forEach(t => { if (selectedTxIds.has(t.id)) t.accountId = newAccId; });
      });
    });
  }

  const batchTagBtn = document.getElementById('btn-batch-tag');
  if (batchTagBtn) {
    batchTagBtn.addEventListener('click', () => {
      openDialogModal({
        title: 'Definir tag em lote',
        message: 'Digite a tag para aplicar às transações selecionadas (deixe vazio para limpar):',
        inputLabel: 'Tag',
        inputType: 'text',
        defaultValue: '',
        placeholder: 'Ex: viagem, trabalho',
        confirmLabel: 'Aplicar',
        onConfirm: (tag) => {
          undoSnapshot = JSON.parse(JSON.stringify(state.transactions));
          state.transactions.forEach(t => { if (selectedTxIds.has(t.id)) t.tag = (tag || '').trim(); });
          selectedTxIds.clear();
          saveState();
          renderApp();
          showUndoToast('Definir tag em lote concluída.');
        }
      });
    });
  }

  document.querySelectorAll('[data-edit-tx]').forEach(btn => {
    btn.addEventListener('click', () => {
      openTransactionModal(null, btn.dataset.editTx);
    });
  });

  const batchDelBtn = document.getElementById('btn-batch-delete');
  if (batchDelBtn) {
    batchDelBtn.addEventListener('click', () => {
      applyBatch('Excluir transações em lote', () => {
        state.transactions = state.transactions.filter(t => !selectedTxIds.has(t.id));
      });
    });
  }

  document.querySelectorAll('[data-del-tx]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.delTx;
      undoSnapshot = JSON.parse(JSON.stringify(state.transactions));
      state.transactions = state.transactions.filter(t => t.id !== id);
      selectedTxIds.delete(id);
      saveState();
      renderApp();
      showUndoToast('Transação excluída.');
    });
  });
}

// ============================================================
// 3. ABA: RECORRÊNCIAS (LANÇAMENTO AUTOMÁTICO NO MÊS)
// ============================================================
function renderRecorrenciasView() {
  const totalFixoCents = state.recurrences
    .filter(r => r.active)
    .reduce((acc, r) => acc + (Number(r.amountCents) || 0), 0);

  const listHtml = state.recurrences.map(r => {
    const cat = getCategoryById(r.categoryId);
    const acc = getAccountById(r.accountId || state.accounts[0]?.id || 'acc-nubank');
    const statusPill = r.active
      ? `<span class="status-pill paid">Automática no mês</span>`
      : `<span class="status-pill closed">Pausada</span>`;

    return `
      <tr>
        <td>Todo dia <b>${r.day}</b></td>
        <td style="font-weight:600;">${r.description}</td>
        <td><span class="cat-dot" style="background:${cat.color}; display:inline-block; margin-right:6px;"></span>${cat.name}</td>
        <td style="color:var(--text-secondary);">${acc.name}</td>
        <td>${statusPill}</td>
        <td class="sensitive-val" style="font-weight:700;">${fmtBRL(r.amountCents)}</td>
        <td style="text-align:right;">
          <div style="display:flex; gap:8px; justify-content:flex-end; flex-wrap:nowrap;">
            <button class="btn-icon-edit" data-edit-rec="${r.id}">✎ Editar</button>
            <button class="btn-secondary" data-toggle-rec="${r.id}">${r.active ? 'Pausar' : 'Ativar Automático'}</button>
            <button class="btn-danger-ghost" data-del-rec="${r.id}">Remover</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <div class="card">
      <div class="section-toolbar">
        <div>
          <h3 class="card-title" style="font-size:15px;">Despesas & Receitas Recorrentes</h3>
          <p class="vs-prev">Recorrências ativas entram automaticamente em todo mês selecionado. Total ativo: <b class="sensitive-val">${fmtBRL(totalFixoCents)}</b></p>
        </div>
        <button class="btn-primary" id="btn-add-rec">+ Nova Recorrência</button>
      </div>

      <div class="table-responsive-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Vencimento</th>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Conta / Cartão</th>
              <th>Status</th>
              <th>Valor Mensal</th>
              <th style="text-align:right;">Ações</th>
            </tr>
          </thead>
          <tbody>${listHtml}</tbody>
        </table>
      </div>
    </div>
  `;
}

function bindRecorrenciasEvents() {
  document.querySelectorAll('[data-toggle-rec]').forEach(btn => {
    btn.addEventListener('click', () => {
      const rec = state.recurrences.find(r => r.id === btn.dataset.toggleRec);
      if (!rec) return;
      rec.active = !rec.active;
      if (!rec.active) {
        state.transactions = state.transactions.filter(
          t => !(t.recurrenceId === rec.id && (t.date || '').startsWith(state.selectedMonth))
        );
      }
      saveState();
      renderApp();
    });
  });

  document.querySelectorAll('[data-edit-rec]').forEach(btn => {
    btn.addEventListener('click', () => openRecurrenceModal(btn.dataset.editRec));
  });

  document.querySelectorAll('[data-del-rec]').forEach(btn => {
    btn.addEventListener('click', () => {
      const delId = btn.dataset.delRec;
      state.recurrences = state.recurrences.filter(r => r.id !== delId);
      state.transactions = state.transactions.filter(
        t => !(t.recurrenceId === delId && (t.date || '').startsWith(state.selectedMonth))
      );
      saveState();
      renderApp();
    });
  });

  const addBtn = document.getElementById('btn-add-rec');
  if (addBtn) {
    addBtn.addEventListener('click', () => openRecurrenceModal());
  }
}

// ============================================================
// 4. ABA: FLUXO DE CAIXA DETALHADO & SAÚDE FINANCEIRA
// ============================================================
function renderFluxoCaixaView() {
  const m = computeMonthMetrics();
  const salaryCents = Number(state.profile.monthlySalaryCents) || 0;
  const savingsRate = m.incomeCents > 0 ? Math.round((m.partialResultCents / m.incomeCents) * 100) : 0;
  const healthLabel = m.incomeCents === 0
    ? 'Sem receitas'
    : savingsRate >= 20 ? 'Saudável' : savingsRate >= 0 ? 'Atenção' : 'Deficitário';
  const healthClass = m.incomeCents === 0 ? 'closed' : savingsRate >= 20 ? 'paid' : savingsRate >= 0 ? 'closed' : 'open';

  const fixedActiveOutCents = state.recurrences
    .filter(r => r.active && r.type !== 'income')
    .reduce((s, r) => s + (Number(r.amountCents) || 0), 0);

  const pixOutCents = m.txs
    .filter(t => t.type === 'expense' && t.method !== 'Cartão de Crédito')
    .reduce((s, t) => s + (Number(t.amountCents) || 0), 0);
  const cardOutCents = m.txs
    .filter(t => t.type === 'expense' && t.method === 'Cartão de Crédito')
    .reduce((s, t) => s + (Number(t.amountCents) || 0), 0);

  // Histórico dos últimos 6 meses até o mês selecionado (Gráfico Vertical Agrupado SVG)
  const shortMonths = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const historyMonths = [-5, -4, -3, -2, -1, 0].map(delta => {
    const ym = addMonthsYM(state.selectedMonth, delta);
    const [yStr, mStr] = ym.split('-');
    const hm = computeMonthMetrics(ym);
    const shortLabel = `${shortMonths[(parseInt(mStr, 10) || 1) - 1]}/${yStr.slice(2)}`;
    return { ym, label: shortLabel, inCents: hm.incomeCents, outCents: hm.expenseCents, netCents: hm.partialResultCents };
  });
  const maxBarCents = Math.max(10000, ...historyMonths.map(h => Math.max(h.inCents, h.outCents)));

  const svgW = 540;
  const svgH = 210;
  const padL = 56;
  const padR = 16;
  const padT = 16;
  const padB = 30;
  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;
  const baseY = padT + chartH;
  const colW = chartW / 6;
  const barW = 18;

  const gridLines = [0, 0.5, 1].map(frac => {
    const y = (padT + chartH * (1 - frac)).toFixed(1);
    const valCents = Math.round(maxBarCents * frac);
    return `
      <line x1="${padL}" y1="${y}" x2="${svgW - padR}" y2="${y}" stroke="var(--chart-grid, rgba(255,255,255,0.06))" stroke-width="1"/>
      <text x="4" y="${Number(y) + 4}" fill="#5e7482" font-size="10.5">${fmtBRL(valCents)}</text>
    `;
  }).join('');

  const svgBars = historyMonths.map((h, idx) => {
    const cx = padL + colW * idx + colW / 2;
    const inH = h.inCents > 0 ? Math.max(4, (h.inCents / maxBarCents) * chartH) : 3;
    const outH = h.outCents > 0 ? Math.max(4, (h.outCents / maxBarCents) * chartH) : 3;
    const inY = baseY - inH;
    const outY = baseY - outH;

    return `
      <rect x="${(cx - barW - 3).toFixed(1)}" y="${inY.toFixed(1)}" width="${barW}" height="${inH.toFixed(1)}" rx="5"
        fill="${h.inCents > 0 ? '#34d399' : 'rgba(255,255,255,0.08)'}"
        class="chart-hover-zone"
        data-tip-title="${h.label} · Entradas"
        data-tip-val="+${fmtBRL(h.inCents)}" />
      <rect x="${(cx + 3).toFixed(1)}" y="${outY.toFixed(1)}" width="${barW}" height="${outH.toFixed(1)}" rx="5"
        fill="${h.outCents > 0 ? '#f16364' : 'rgba(255,255,255,0.08)'}"
        class="chart-hover-zone"
        data-tip-title="${h.label} · Saídas"
        data-tip-val="-${fmtBRL(h.outCents)}" />
      <text x="${cx.toFixed(1)}" y="${svgH - 8}" text-anchor="middle" fill="#8fa3b0" font-size="11.5" font-weight="600">${h.label}</text>
    `;
  }).join('');

  const historyChartHtml = `
    <svg width="100%" viewBox="0 0 ${svgW} ${svgH}" style="display:block; height:auto; max-height:225px;">
      ${gridLines}
      ${svgBars}
    </svg>
    <div class="history-months-grid">
      ${historyMonths.map(h => `
        <div style="font-size:11px;">
          <div style="color:var(--text-muted); margin-bottom:2px;">Saldo ${h.label}</div>
          <div class="sensitive-val" style="font-weight:700; color:${h.netCents >= 0 ? 'var(--green-emerald)' : 'var(--coral-red)'};">
            ${fmtBRL(h.netCents, true)}
          </div>
        </div>
      `).join('')}
    </div>
  `;

  const topExpenses = m.txs
    .filter(t => t.type === 'expense')
    .sort((a, b) => (b.amountCents || 0) - (a.amountCents || 0))
    .slice(0, 5);

  const topExpHtml = topExpenses.length === 0
    ? `<p class="vs-prev">Nenhuma despesa registrada neste mês.</p>`
    : topExpenses.map(t => `
        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border-subtle); font-size:13px;">
          <span>${fmtDateBR(t.date)} · <b>${t.description}</b></span>
          <span class="sensitive-val" style="color:var(--coral-red); font-weight:700;">-${fmtBRL(t.amountCents)}</span>
        </div>
      `).join('');

  return `
    <div class="cdi-bar">
      <div class="cdi-control-group">
        <span style="font-size:13px; font-weight:600;">Salário Mensal Fixo:</span>
        <span class="sensitive-val" style="font-size:15px; font-weight:700; color:var(--green-emerald);">${fmtBRL(salaryCents)}</span>
        <span style="font-size:11.5px; color:var(--text-muted);">(cai automaticamente todo dia ${state.profile.salaryDay || 5})</span>
      </div>
      <button class="btn-primary" id="btn-config-salary" style="padding:7px 14px; font-size:12px;">
        ${salaryCents > 0 ? '✎ Editar Salário' : '+ Definir Salário'}
      </button>
    </div>

    <div class="faturas-summary-grid cols-4">
      <div class="card">
        <div class="card-title">Total de Entradas</div>
        <div class="partial-value positive sensitive-val" style="font-size:23px;">${fmtBRL(m.incomeCents)}</div>
        <div class="vs-prev">Receitas em ${fmtMonthLabel(state.selectedMonth)}</div>
      </div>
      <div class="card">
        <div class="card-title">Total de Saídas</div>
        <div class="partial-value negative sensitive-val" style="font-size:23px;">-${fmtBRL(m.expenseCents)}</div>
        <div class="vs-prev">Despesas acumuladas</div>
      </div>
      <div class="card">
        <div class="card-title">Geração Líquida</div>
        <div class="partial-value ${m.partialResultCents < 0 ? 'negative' : 'positive'} sensitive-val" style="font-size:23px;">${fmtBRL(m.partialResultCents)}</div>
        <div class="vs-prev">Saldo entre entradas e saídas</div>
      </div>
      <div class="card">
        <div class="card-header-row" style="margin-bottom:6px;">
          <span class="card-title">Saúde Financeira</span>
          <span class="status-pill ${healthClass}">${healthLabel}</span>
        </div>
        <div class="partial-value sensitive-val" style="font-size:23px; margin-top:4px;">${savingsRate}%</div>
        <div class="vs-prev">Taxa de poupança do mês</div>
      </div>
    </div>

    <div class="dashboard-row-2 fluxo-split-grid">
      <div class="card">
        <div class="card-header-row">
          <span class="card-title" style="font-size:15px;">Evolução Mensal (Últimos 6 Meses)</span>
          <div style="display:flex; gap:12px; font-size:11.5px; color:var(--text-secondary);">
            <span style="display:inline-flex; align-items:center; gap:5px;"><span class="cat-dot" style="background:var(--green-emerald);"></span>Entradas</span>
            <span style="display:inline-flex; align-items:center; gap:5px;"><span class="cat-dot" style="background:var(--coral-red);"></span>Saídas</span>
          </div>
        </div>
        ${historyChartHtml}
      </div>

      <div style="display:flex; flex-direction:column; gap:22px;">
        <div class="card">
          <div class="card-title" style="font-size:15px; margin-bottom:12px;">Raio-X do Fluxo no Mês</div>
          <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:8px;">
            <span>Saídas à vista (Pix / Débito)</span>
            <b class="sensitive-val">${fmtBRL(pixOutCents)}</b>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:8px;">
            <span>Compras no Cartão de Crédito</span>
            <b class="sensitive-val">${fmtBRL(cardOutCents)}</b>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:13px;">
            <span>Custo Fixo Recorrente Ativo</span>
            <b class="sensitive-val">${fmtBRL(fixedActiveOutCents)}</b>
          </div>
        </div>

        <div class="card">
          <div class="card-title" style="font-size:15px; margin-bottom:8px;">Maiores Saídas do Mês</div>
          ${topExpHtml}
        </div>
      </div>
    </div>
  `;
}

function bindFluxoCaixaEvents() {
  const btnSal = document.getElementById('btn-config-salary');
  if (btnSal) {
    btnSal.addEventListener('click', () => openProfileModal());
  }
  bindChartTooltips();
}

// ============================================================
// 5. ABA: FATURAS DE CARTÃO (COM REGRA DE FECHAMENTO)
// ============================================================
function getInvoiceMeta(accId, ym = state.selectedMonth) {
  const key = `${ym}_${accId}`;
  return (state.invoiceMeta && state.invoiceMeta[key]) || { status: 'open', adjustmentCents: 0 };
}

function setInvoiceMeta(accId, data, ym = state.selectedMonth) {
  if (!state.invoiceMeta) state.invoiceMeta = {};
  const key = `${ym}_${accId}`;
  state.invoiceMeta[key] = { ...getInvoiceMeta(accId, ym), ...data };
}

function renderFaturasView() {
  const statusLabels = { open: 'Aberta', closed: 'Fechada', paid: 'Paga' };
  const [selYear, selMonth] = state.selectedMonth.split('-');

  let totalFaturasCents = 0;
  let totalLimiteCents = 0;
  let totalOpenCents = 0;

  const cardsHtml = state.accounts.map(acc => {
    // Regra de fechamento: filtra apenas despesas no Cartão de Crédito deste banco/cartão cuja fatura cai em state.selectedMonth
    const accTxs = state.transactions.filter(t => {
      if (t.accountId !== acc.id || t.type !== 'expense') return false;
      if (t.method !== 'Cartão de Crédito' && acc.type !== 'Cartão de Crédito') return false;
      return getInvoiceMonthForTransaction(t, acc) === state.selectedMonth;
    }).sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    // Parcelas futuras já comprometidas no cartão (faturas de meses posteriores a state.selectedMonth)
    const futureInstallmentsCents = state.transactions
      .filter(t => {
        if (t.accountId !== acc.id || t.type !== 'expense') return false;
        if (t.method !== 'Cartão de Crédito' && acc.type !== 'Cartão de Crédito') return false;
        return getInvoiceMonthForTransaction(t, acc) > state.selectedMonth;
      })
      .reduce((s, t) => s + (Number(t.amountCents) || 0), 0);

    const txSpentCents = accTxs.reduce((s, t) => s + (Number(t.amountCents) || 0), 0);
    const meta = getInvoiceMeta(acc.id);
    const spentCents = Math.max(0, txSpentCents + (Number(meta.adjustmentCents) || 0));
    const limitCents = Number(acc.limitCents) || 200000;
    const activeInvoiceDebtCents = meta.status === 'paid' ? 0 : spentCents;
    const totalCommittedCents = activeInvoiceDebtCents + futureInstallmentsCents;
    const availableCents = Math.max(0, limitCents - totalCommittedCents);
    const pct = limitCents > 0 ? Math.min(100, Math.round((totalCommittedCents / limitCents) * 100)) : 0;
    const curBarPct = limitCents > 0 ? Math.min(100, (activeInvoiceDebtCents / limitCents) * 100) : 0;
    const futBarPct = limitCents > 0 ? Math.min(Math.max(0, 100 - curBarPct), (futureInstallmentsCents / limitCents) * 100) : 0;

    totalFaturasCents += spentCents;
    totalLimiteCents += limitCents;
    if (meta.status !== 'paid') totalOpenCents += spentCents;

    const barColor = pct >= 85 ? 'var(--coral-red)' : pct >= 60 ? 'var(--amber-gold)' : 'var(--cyan-accent)';
    const barWidth = activeInvoiceDebtCents > 0 ? Math.max(2, curBarPct) : 0;
    const dueDateStr = `${String(acc.dueDay || 12).padStart(2, '0')}/${selMonth}/${selYear}`;

    const invoiceItems = accTxs.length === 0
      ? `<div class="fatura-tx-item" style="color:var(--text-muted);">Nenhuma compra nesta fatura (fechamento dia ${acc.closingDay || 5})</div>`
      : accTxs.map(t => `
          <div class="fatura-tx-item">
            <span>${fmtDateBR(t.date)} · ${t.description}</span>
            <span class="sensitive-val" style="font-weight:600;">${fmtBRL(t.amountCents)}</span>
          </div>
        `).join('');

    return `
      <div class="card fatura-card">
        <div>
          <div class="fatura-card-top">
            <div class="fatura-brand-wrap">
              <div class="fatura-icon-box">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>
                </svg>
              </div>
              <div>
                <div class="fatura-name">${acc.name}</div>
                <div class="fatura-dates">Fecha dia ${acc.closingDay || 5} · Vencimento ${dueDateStr}</div>
              </div>
            </div>

            <div class="fatura-top-right">
              <span class="status-pill ${meta.status}">${statusLabels[meta.status] || 'Aberta'}</span>
              <button class="btn-icon-edit" data-edit-invoice="${acc.id}" title="Editar fatura">
                ✎ Editar
              </button>
            </div>
          </div>

          <div style="margin-top:18px;">
            <div class="fatura-amount-row">
              <div class="big-currency sensitive-val">${fmtBRL(spentCents)}</div>
              <span class="cat-pct-badge">${pct}% comprometido</span>
            </div>
            <div class="cat-progress-track" style="margin-top:10px; display:flex; overflow:hidden;">
              <div class="cat-progress-fill" style="width:${barWidth.toFixed(1)}%; background:${barColor};" title="Fatura atual: ${fmtBRL(activeInvoiceDebtCents)}"></div>
              ${futBarPct > 0 ? `<div class="cat-progress-fill" style="width:${Math.max(2, futBarPct).toFixed(1)}%; background:#a78bfa;" title="Parcelas futuras: ${fmtBRL(futureInstallmentsCents)}"></div>` : ''}
            </div>
            <div class="fatura-meta-row" style="flex-wrap:wrap; gap:6px;">
              <span class="sensitive-val">Livre real: <b style="color:var(--green-emerald);">${fmtBRL(availableCents)}</b></span>
              ${futureInstallmentsCents > 0 ? `<span class="sensitive-val" style="color:#a78bfa;">Parcelado futuro: <b>${fmtBRL(futureInstallmentsCents)}</b></span>` : ''}
              <span class="sensitive-val">Limite: ${fmtBRL(limitCents)}</span>
            </div>
          </div>
        </div>

        <div class="fatura-tx-preview" style="max-height:130px; overflow-y:auto;">
          ${invoiceItems}
        </div>

        <div class="fatura-card-actions" style="flex-wrap:wrap;">
          <div style="display:flex; gap:6px;">
            <button class="btn-secondary" data-add-tx-account="${acc.id}">+ Lançar</button>
            <button class="btn-secondary" data-import-invoice-acc="${acc.id}" title="Fazer upload de fatura CSV, Markdown (.md), PDF ou Foto para este cartão">↑ Importar Fatura</button>
          </div>
          <button class="btn-primary" data-toggle-paid-invoice="${acc.id}" data-invoice-total="${spentCents}" style="padding:7px 14px; font-size:12px;">
            ${meta.status === 'paid' ? 'Reabrir Fatura' : 'Pagar Fatura (Debitar Conta)'}
          </button>
        </div>
      </div>
    `;
  }).join('');

  const totalAvailableCents = Math.max(0, totalLimiteCents - totalFaturasCents);

  return `
    <div class="section-toolbar">
      <div>
        <h3 class="card-title" style="font-size:16px;">Faturas & Cartões — ${fmtMonthLabel(state.selectedMonth)}</h3>
        <p class="vs-prev">Compras após o dia de fechamento entram automaticamente na fatura do mês seguinte.</p>
      </div>
      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <button class="btn-secondary" id="btn-import-invoice-top">↑ Importar Fatura (CSV/MD/PDF/Foto)</button>
        <button class="btn-primary" id="btn-new-invoice-card">+ Novo Cartão / Fatura</button>
      </div>
    </div>

    <div class="faturas-summary-grid">
      <div class="card">
        <div class="card-title">Total em Faturas do Mês</div>
        <div class="partial-value negative sensitive-val" style="font-size:24px; margin-top:8px;">${fmtBRL(totalFaturasCents)}</div>
        <div class="vs-prev">Respeitando data de fechamento</div>
      </div>
      <div class="card">
        <div class="card-title">A Pagar no Período</div>
        <div class="partial-value sensitive-val" style="font-size:24px; margin-top:8px; color:var(--amber-gold);">${fmtBRL(totalOpenCents)}</div>
        <div class="vs-prev">Faturas abertas ou fechadas</div>
      </div>
      <div class="card">
        <div class="card-title">Limite Global Disponível</div>
        <div class="partial-value positive sensitive-val" style="font-size:24px; margin-top:8px;">${fmtBRL(totalAvailableCents)}</div>
        <div class="vs-prev sensitive-val">De ${fmtBRL(totalLimiteCents)} em limites</div>
      </div>
    </div>

    <div class="cards-grid-2">${cardsHtml}</div>
  `;
}

function bindFaturasEvents() {
  document.querySelectorAll('[data-edit-invoice]').forEach(btn => {
    btn.addEventListener('click', () => openInvoiceModal(btn.dataset.editInvoice));
  });

  document.querySelectorAll('[data-add-tx-account]').forEach(btn => {
    btn.addEventListener('click', () => openTransactionModal(btn.dataset.addTxAccount));
  });

  document.querySelectorAll('[data-import-invoice-acc]').forEach(btn => {
    btn.addEventListener('click', () => openImportInvoiceModal(btn.dataset.importInvoiceAcc));
  });

  const btnImpTop = document.getElementById('btn-import-invoice-top');
  if (btnImpTop) btnImpTop.addEventListener('click', () => openImportInvoiceModal());

  document.querySelectorAll('[data-toggle-paid-invoice]').forEach(btn => {
    btn.addEventListener('click', () => {
      const accId = btn.dataset.togglePaidInvoice;
      const acc = getAccountById(accId);
      const meta = getInvoiceMeta(accId);
      const paymentTxId = `tx-invpay-${state.selectedMonth}-${accId}`;

      if (meta.status === 'paid') {
        setInvoiceMeta(accId, { status: 'open', paidFromAccountId: null });
        state.transactions = state.transactions.filter(t => t.id !== paymentTxId);
        saveState();
        renderApp();
        showUndoToast(`Fatura ${acc.name} reaberta e saldo restaurado.`);
        return;
      }

      const spentCents = Number(btn.dataset.invoiceTotal) || 0;
      const defaultPayer = state.accounts.find(a => a.type !== 'Cartão de Crédito') || state.accounts[0];
      openDialogModal({
        title: `Pagar Fatura — ${acc.name}`,
        message: `Valor da fatura: ${fmtBRL(spentCents)}. Informe o nome da conta bancária de onde sairá o dinheiro para debitar o saldo automaticamente:`,
        inputLabel: 'Debitar da conta',
        inputType: 'text',
        defaultValue: defaultPayer ? defaultPayer.name : 'Nubank',
        placeholder: 'Ex: Nubank, Mercado Pago',
        confirmLabel: 'Confirmar Pagamento',
        onConfirm: (payerName) => {
          const payerAcc = state.accounts.find(
            a => a.name.toLowerCase().includes((payerName || '').trim().toLowerCase())
          ) || defaultPayer || acc;

          setInvoiceMeta(accId, { status: 'paid', paidFromAccountId: payerAcc.id });
          state.transactions = state.transactions.filter(t => t.id !== paymentTxId);
          if (spentCents > 0) {
            const dueDayStr = String(Math.min(28, Math.max(1, Number(acc.dueDay) || 12))).padStart(2, '0');
            state.transactions.push({
              id: paymentTxId,
              isInvoicePayment: true,
              type: 'expense',
              amountCents: spentCents,
              description: `Pagamento Fatura ${acc.name}`,
              tag: 'fatura-paga',
              categoryId: state.categories[0]?.id || 'cat-moradia',
              accountId: payerAcc.id,
              date: `${state.selectedMonth}-${dueDayStr}`,
              method: 'Pagamento de Fatura'
            });
          }
          saveState();
          renderApp();
          showUndoToast(`Fatura paga com débito em ${payerAcc.name}.`);
        }
      });
    });
  });

  const btnNewCard = document.getElementById('btn-new-invoice-card');
  if (btnNewCard) btnNewCard.addEventListener('click', () => openInvoiceModal(null));
}

function updateInvoiceLiveSummary() {
  const cDay = parseInt(document.getElementById('inv-closing-day')?.value, 10) || 5;
  const dDay = parseInt(document.getElementById('inv-due-day')?.value, 10) || 12;
  const limCents = toCents(document.getElementById('inv-limit')?.value);
  const cycleEl = document.getElementById('inv-live-cycle');
  const limEl = document.getElementById('inv-live-limit');
  if (cycleEl) cycleEl.textContent = `Fecha dia ${cDay} · Vence dia ${dDay}`;
  if (limEl) limEl.textContent = fmtBRL(limCents);
}

function openInvoiceModal(accountId) {
  const isNew = !accountId;
  const acc = isNew
    ? { id: '', name: '', limitCents: 300000, closingDay: 5, dueDay: 12 }
    : state.accounts.find(a => a.id === accountId);

  if (!acc) return;
  const meta = isNew ? { status: 'open', adjustmentCents: 0 } : getInvoiceMeta(acc.id);

  document.getElementById('modal-inv-title').textContent = isNew ? 'Novo cartão / fatura' : `Editar fatura — ${acc.name}`;
  document.getElementById('inv-account-id').value = acc.id;
  document.getElementById('inv-name').value = acc.name;
  document.getElementById('inv-status').value = meta.status || 'open';
  syncSegmentedControl('inv-status');
  document.getElementById('inv-limit').value = fromCents(acc.limitCents || 200000).toFixed(2);
  document.getElementById('inv-manual-adj').value = fromCents(meta.adjustmentCents || 0).toFixed(2);
  document.getElementById('inv-closing-day').value = acc.closingDay || 5;
  document.getElementById('inv-due-day').value = acc.dueDay || 12;

  updateInvoiceLiveSummary();

  const delBtn = document.getElementById('btn-delete-invoice');
  delBtn.style.display = (!isNew && state.accounts.length > 1) ? 'inline-flex' : 'none';

  document.getElementById('modal-invoice').classList.add('open');
}

// ============================================================
// 6. ABA: CATEGORIAS PERSONALIZÁVEIS COM REGRAS AUTOMÁTICAS
// ============================================================
function renderCategoriasView() {
  const m = computeMonthMetrics();
  const activeCats = state.categories.filter(c => !c.archived);
  const archivedCats = state.categories.filter(c => c.archived);

  const renderCatCard = (cat) => {
    const spentObj = m.distribution.find(d => d.catId === cat.id);
    const spentCents = spentObj ? spentObj.totalCents : 0;
    const budgetCents = Number(cat.budgetCents) || 0;
    const pct = budgetCents > 0 ? Math.min(100, Math.round((spentCents / budgetCents) * 100)) : (spentCents > 0 ? 100 : 0);
    const rulesHtml = (cat.rules || []).length > 0
      ? (cat.rules || []).map(r => `<span class="rule-badge">${r}</span>`).join(' ')
      : `<span style="font-size:11px; color:var(--text-muted);">Sem regras automáticas</span>`;

    return `
      <div class="card" style="${cat.archived ? 'opacity:0.65;' : ''}">
        <div class="card-header-row" style="gap:10px;">
          <div style="display:flex; align-items:center; gap:8px; min-width:0; flex:1;">
            <span class="cat-dot" style="background:${cat.color}; width:10px; height:10px; flex-shrink:0;"></span>
            <span style="font-weight:600; overflow:hidden; text-overflow:ellipsis;">${cat.name}</span>
            ${cat.archived ? `<span class="tag-pill">Arquivada</span>` : ''}
          </div>
          <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
            <span class="cat-pct-badge sensitive-val">${fmtBRL(spentCents)}</span>
            <button class="btn-icon-edit" data-edit-cat="${cat.id}">✎ Editar</button>
          </div>
        </div>
        <div class="vs-prev sensitive-val">Teto mensal: ${fmtBRL(budgetCents)}</div>
        <div class="cat-progress-track" style="margin:10px 0 12px;">
          <div class="cat-progress-fill" style="width:${spentCents > 0 ? Math.max(6, pct) : 0}%; background:${cat.color};"></div>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:5px; align-items:center;">
          ${rulesHtml}
        </div>
      </div>
    `;
  };

  return `
    <div class="section-toolbar">
      <div>
        <h3 class="card-title" style="font-size:16px;">Categorias & Regras Automáticas</h3>
        <p class="vs-prev">Crie, edite, arquive categorias e defina palavras-chave para categorização automática.</p>
      </div>
      <button class="btn-primary" id="btn-new-category">+ Nova Categoria</button>
    </div>
    <div class="cards-grid-3">${activeCats.map(renderCatCard).join('')}</div>
    ${archivedCats.length > 0 ? `
      <h4 class="card-title" style="margin:22px 0 12px; color:var(--text-secondary);">Categorias Arquivadas (${archivedCats.length})</h4>
      <div class="cards-grid-3">${archivedCats.map(renderCatCard).join('')}</div>
    ` : ''}
  `;
}

function openCategoryModal(catId) {
  const isNew = !catId;
  const cat = isNew
    ? { id: '', name: '', color: '#38b6ff', budgetCents: 20000, rules: [], archived: false }
    : state.categories.find(c => c.id === catId);
  if (!cat) return;

  document.getElementById('modal-cat-title').textContent = isNew ? 'Nova Categoria' : `Editar Categoria — ${cat.name}`;
  document.getElementById('cat-id').value = cat.id;
  document.getElementById('cat-name').value = cat.name;
  document.getElementById('cat-color').value = cat.color || '#38b6ff';
  document.getElementById('cat-budget').value = fromCents(cat.budgetCents || 0).toFixed(2);
  document.getElementById('cat-rules').value = (cat.rules || []).join(', ');

  const archBtn = document.getElementById('btn-archive-category');
  archBtn.style.display = !isNew ? 'inline-flex' : 'none';
  archBtn.textContent = cat.archived ? 'Reativar Categoria' : 'Arquivar Categoria';

  document.getElementById('modal-category').classList.add('open');
}

function bindCategoriasEvents() {
  const btn = document.getElementById('btn-new-category');
  if (btn) btn.addEventListener('click', () => openCategoryModal(null));

  document.querySelectorAll('[data-edit-cat]').forEach(el => {
    el.addEventListener('click', () => openCategoryModal(el.dataset.editCat));
  });
}

// ============================================================
// 7. ABA: METAS ESTRATÉGICAS
// ============================================================
function renderMetasView() {
  const html = state.goals.map(g => {
    const pct = g.targetCents > 0 ? Math.min(100, Math.round((g.currentCents / g.targetCents) * 100)) : 0;
    return `
      <div class="card">
        <div class="card-header-row">
          <span style="font-weight:600;">${g.title}</span>
          <span class="cat-pct-badge">${pct}%</span>
        </div>
        <div class="big-currency sensitive-val" style="font-size:22px;">${fmtBRL(g.currentCents)} <span class="currency-sub">/ ${fmtBRL(g.targetCents)}</span></div>
        <div class="cat-progress-track" style="margin:14px 0;">
          <div class="cat-progress-fill" style="width:${Math.max(3, pct)}%; background:${g.color};"></div>
        </div>
        <button class="btn-secondary" data-aporte-goal="${g.id}">+ Registrar Aporte</button>
      </div>
    `;
  }).join('');

  return `<div class="cards-grid-3">${html}</div>`;
}

function bindMetasEvents() {
  document.querySelectorAll('[data-aporte-goal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const goal = state.goals.find(g => g.id === btn.dataset.aporteGoal);
      if (!goal) return;
      openDialogModal({
        title: `Aportar em "${goal.title}"`,
        message: 'Informe o valor que deseja adicionar a esta meta:',
        inputLabel: 'Valor do aporte (R$)',
        inputType: 'number',
        defaultValue: '50.00',
        placeholder: '50,00',
        confirmLabel: 'Confirmar Aporte',
        onConfirm: (val) => {
          const valCents = toCents(val);
          if (valCents > 0) {
            goal.currentCents += valCents;
            if (goal.id === 'goal-1' && state.assets.length > 0) {
              state.assets[0].amountCents = (Number(state.assets[0].amountCents) || 0) + valCents;
            }
            const sourceAcc = state.accounts.find(a => a.type !== 'Cartão de Crédito') || state.accounts[0];
            if (sourceAcc) {
              state.transactions.push({
                id: 'tx-goal-' + Date.now(),
                isAssetTransfer: true,
                type: 'expense',
                amountCents: valCents,
                description: `Aporte na Meta: ${goal.title}`,
                tag: 'aporte-meta',
                categoryId: state.categories[0]?.id || 'cat-moradia',
                accountId: sourceAcc.id,
                date: getTodayISO().startsWith(state.selectedMonth) ? getTodayISO() : `${state.selectedMonth}-10`,
                method: 'Aporte / Investimento'
              });
            }
            saveState();
            renderApp();
            showUndoToast(`Aporte de ${fmtBRL(valCents)} debitado de ${sourceAcc?.name || 'Conta'}.`);
          }
        }
      });
    });
  });
}

// ============================================================
// 8. ABA: PATRIMÔNIO & INVESTIMENTOS (COM % CDB, CDI E ALOCAÇÃO)
// ============================================================
function calcMonthlyYieldCents(amountCents, cdbPercent, cdiAnnualRate) {
  const rateAnnual = (cdiAnnualRate / 100) * ((cdbPercent ?? 100) / 100);
  const rateMonthly = Math.pow(1 + rateAnnual, 1 / 12) - 1;
  return Math.round(amountCents * rateMonthly);
}

function renderPatrimonioView() {
  const m = computeMonthMetrics();
  const cdiRate = Number(state.cdiRate) || 11.25;
  const irRate = state.irRate !== undefined ? Number(state.irRate) : 17.5;
  const netFactor = Math.max(0, 1 - irRate / 100);

  let totalMonthlyYieldCents = 0;
  const classTotals = {};
  const classColors = {
    'Renda Fixa (CDB)': '#49b6eb',
    'Renda Fixa': '#49b6eb',
    'Tesouro Direto': '#34d399',
    'FIIs': '#a78bfa',
    'Ações': '#f59e0b',
    'Cripto': '#ec4899',
    'Reserva / Outros': '#94a3b8'
  };

  const calcAssetMonthlyYieldCents = (asset) => {
    const amtCents = Number(asset.amountCents) || 0;
    const basePct = asset.cdbPercent !== undefined ? Number(asset.cdbPercent) : 100;
    const capCents = Number(asset.promoCapCents) || 0;
    const excessPct = asset.excessCdbPercent !== undefined ? Number(asset.excessCdbPercent) : 100;
    if (capCents > 0 && amtCents > capCents) {
      return calcMonthlyYieldCents(capCents, basePct, cdiRate)
        + calcMonthlyYieldCents(amtCents - capCents, excessPct, cdiRate);
    }
    return calcMonthlyYieldCents(amtCents, basePct, cdiRate);
  };

  state.assets.forEach(a => {
    const amtCents = Number(a.amountCents) || 0;
    totalMonthlyYieldCents += calcAssetMonthlyYieldCents(a);
    classTotals[a.category] = (classTotals[a.category] || 0) + amtCents;
  });

  const totalAnnualYieldCents = totalMonthlyYieldCents * 12;
  const totalNetMonthlyYieldCents = Math.round(totalMonthlyYieldCents * netFactor);
  const totalNetAnnualYieldCents = totalNetMonthlyYieldCents * 12;
  const allocEntries = Object.entries(classTotals).filter(([, val]) => val > 0);
  const allocSegments = m.totalInvestmentsCents > 0 && allocEntries.length > 0
    ? allocEntries.map(([cls, val]) => {
        const pct = ((val / m.totalInvestmentsCents) * 100).toFixed(1);
        const col = classColors[cls] || '#49b6eb';
        return `<div style="width:${pct}%; background:${col};" title="${cls}: ${pct}%"></div>`;
      }).join('')
    : '';

  const allocLegend = allocEntries.length > 0
    ? allocEntries.map(([cls, val]) => {
        const pct = m.totalInvestmentsCents > 0 ? Math.round((val / m.totalInvestmentsCents) * 100) : 0;
        const col = classColors[cls] || '#49b6eb';
        return `<span style="display:inline-flex; align-items:center; gap:5px;"><span class="cat-dot" style="background:${col};"></span>${cls} (${pct}%)</span>`;
      }).join('')
    : '<span style="color:var(--text-muted);">Adicione saldo para visualizar a distribuição por classe.</span>';

  const rows = state.assets.length === 0
    ? `<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:28px;">Nenhum ativo cadastrado. Clique em + Novo Ativo para começar.</td></tr>`
    : state.assets.map(a => {
        const cdbPct = a.cdbPercent !== undefined ? Number(a.cdbPercent) : 100;
        const amtCents = Number(a.amountCents) || 0;
        const capCents = Number(a.promoCapCents) || 0;
        const excessPct = a.excessCdbPercent !== undefined ? Number(a.excessCdbPercent) : 100;
        const monthlyYieldCents = calcAssetMonthlyYieldCents(a);
        const col = classColors[a.category] || '#49b6eb';
        const tierNote = capCents > 0
          ? `<div style="font-size:10.5px; color:var(--text-muted); margin-top:4px;">Até ${fmtBRL(capCents)} · ${excessPct}% exced.</div>`
          : '';

        return `
          <tr>
            <td>
              <div style="font-weight:600;">${a.name}</div>
              <div style="font-size:11px; color:var(--text-muted);">${a.institution || 'Instituição'} · ${a.liquidity || 'Diária'}</div>
            </td>
            <td>
              <span style="display:inline-flex; align-items:center; gap:6px;">
                <span class="cat-dot" style="background:${col};"></span>
                ${a.category}
              </span>
            </td>
            <td>
              <button class="cdb-badge" data-quick-cdb="${a.id}" title="Clique para alterar a % do CDI / CDB">
                ${cdbPct}% CDI ✎
              </button>
              ${tierNote}
            </td>
            <td class="sensitive-val" style="color:var(--green-emerald); font-weight:600;">
              <div>+${fmtBRL(Math.round(monthlyYieldCents * netFactor))}/mês <span style="font-size:10px; color:var(--text-muted); font-weight:500;">(líq.)</span></div>
              <div style="font-size:10.5px; color:var(--text-muted); font-weight:400;">Bruto: +${fmtBRL(monthlyYieldCents)}/mês</div>
            </td>
            <td class="sensitive-val" style="font-weight:700;">${fmtBRL(amtCents)}</td>
            <td class="sensitive-val" style="color:${(a.weeklyDeltaCents || 0) >= 0 ? 'var(--green-emerald)' : 'var(--coral-red)'};">
              ${fmtBRL(a.weeklyDeltaCents || 0, true)}
            </td>
            <td style="text-align:right;">
              <div style="display:flex; gap:6px; justify-content:flex-end;">
                <button class="btn-secondary" data-aporte-asset="${a.id}">+ Aporte</button>
                <button class="btn-icon-edit" data-edit-asset="${a.id}">Editar</button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

  return `
    <div class="section-toolbar">
      <div>
        <h3 class="card-title" style="font-size:16px;">Patrimônio & Rentabilidade CDB</h3>
        <p class="vs-prev">Gerencie seus ativos, altere a % do CDI de cada CDB e acompanhe o rendimento estimado.</p>
      </div>
      <button class="btn-primary" id="btn-new-asset">+ Novo Ativo</button>
    </div>

    <div class="cdi-bar">
      <div class="cdi-control-group">
        <span style="font-size:13px; font-weight:600;">Taxa CDI Base (% ao ano):</span>
        <input type="number" step="0.05" min="0" max="50" id="input-cdi-rate" class="cdi-input-mini" value="${cdiRate}" />
        <span style="font-size:12px; color:var(--text-secondary);">% a.a.</span>
      </div>
      <div class="cdi-control-group">
        <span style="font-size:11.5px; color:var(--text-muted);">Alíquota IR Regressivo:</span>
        <button class="btn-secondary ${irRate === 22.5 ? 'active' : ''}" data-ir-rate="22.5" style="padding:5px 9px; font-size:11px; ${irRate === 22.5 ? 'border-color:var(--cyan-accent); color:var(--cyan-accent);' : ''}">22,5% (até 6m)</button>
        <button class="btn-secondary ${irRate === 20 ? 'active' : ''}" data-ir-rate="20" style="padding:5px 9px; font-size:11px; ${irRate === 20 ? 'border-color:var(--cyan-accent); color:var(--cyan-accent);' : ''}">20% (6–12m)</button>
        <button class="btn-secondary ${irRate === 17.5 ? 'active' : ''}" data-ir-rate="17.5" style="padding:5px 9px; font-size:11px; ${irRate === 17.5 ? 'border-color:var(--cyan-accent); color:var(--cyan-accent);' : ''}">17,5% (1–2a)</button>
        <button class="btn-secondary ${irRate === 15 ? 'active' : ''}" data-ir-rate="15" style="padding:5px 9px; font-size:11px; ${irRate === 15 ? 'border-color:var(--cyan-accent); color:var(--cyan-accent);' : ''}">15% (+2a)</button>
      </div>
    </div>

    <div class="faturas-summary-grid">
      <div class="card">
        <div class="card-title">Patrimônio Investido</div>
        <div class="partial-value sensitive-val" style="font-size:24px; margin-top:8px;">${fmtBRL(m.totalInvestmentsCents)}</div>
        <div class="vs-prev sensitive-val">Variação na semana: ${fmtBRL(m.weeklyInvDeltaCents, true)}</div>
      </div>
      <div class="card">
        <div class="card-title">Rendimento Líquido (pós-IR ${String(irRate).replace('.', ',')}%)</div>
        <div class="partial-value positive sensitive-val" style="font-size:24px; margin-top:8px;">+${fmtBRL(totalNetMonthlyYieldCents)}<span style="font-size:13px; font-weight:400; color:var(--text-secondary);"> / mês</span></div>
        <div class="vs-prev sensitive-val">Bruto: +${fmtBRL(totalMonthlyYieldCents)}/mês · Anual líq.: +${fmtBRL(totalNetAnnualYieldCents)}</div>
      </div>
      <div class="card">
        <div class="card-title">Alocação da Carteira</div>
        <div class="alloc-bar-track">${allocSegments}</div>
        <div class="alloc-legend">${allocLegend}</div>
      </div>
    </div>

    <div class="card">
      <div class="table-responsive-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Ativo / Liquidez</th>
              <th>Classe</th>
              <th>Rentabilidade (% CDI)</th>
              <th>Rendimento Est.</th>
              <th>Saldo Atual</th>
              <th>Semana</th>
              <th style="text-align:right;">Ações</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function updateAssetLiveSummary() {
  const cdiRate = Number(state.cdiRate) || 11.25;
  const irRate = state.irRate !== undefined ? Number(state.irRate) : 17.5;
  const netFactor = Math.max(0, 1 - irRate / 100);
  const amtCents = toCents(document.getElementById('ast-amount')?.value);
  const basePct = parseFloat(document.getElementById('ast-cdb-pct')?.value);
  const capCents = toCents(document.getElementById('ast-promo-cap')?.value);
  const excessRaw = parseFloat(document.getElementById('ast-excess-pct')?.value);
  const effBase = isNaN(basePct) ? 100 : basePct;
  const effExcess = isNaN(excessRaw) ? 100 : excessRaw;

  let monthlyCents = 0;
  if (capCents > 0 && amtCents > capCents) {
    monthlyCents = calcMonthlyYieldCents(capCents, effBase, cdiRate)
      + calcMonthlyYieldCents(amtCents - capCents, effExcess, cdiRate);
  } else {
    monthlyCents = calcMonthlyYieldCents(amtCents, effBase, cdiRate);
  }
  const netMonthlyCents = Math.round(monthlyCents * netFactor);
  const mEl = document.getElementById('ast-live-monthly');
  const aEl = document.getElementById('ast-live-annual');
  if (mEl) mEl.textContent = `+${fmtBRL(netMonthlyCents)}/mês (líq.)`;
  if (aEl) aEl.textContent = `+${fmtBRL(netMonthlyCents * 12)}/ano`;
}

function openAssetModal(assetId) {
  const isNew = !assetId;
  const asset = isNew
    ? { id: '', name: '', category: 'Renda Fixa (CDB)', amountCents: 0, cdbPercent: 100, institution: '', liquidity: 'Diária' }
    : state.assets.find(a => a.id === assetId);

  if (!asset) return;

  document.getElementById('modal-asset-title').textContent = isNew ? 'Novo ativo / investimento' : `Editar ativo — ${asset.name}`;
  document.getElementById('ast-id').value = asset.id;
  document.getElementById('ast-name').value = asset.name;
  document.getElementById('ast-category').value = asset.category === 'Renda Fixa' ? 'Renda Fixa (CDB)' : (asset.category || 'Renda Fixa (CDB)');
  document.getElementById('ast-amount').value = fromCents(asset.amountCents || 0).toFixed(2);
  document.getElementById('ast-cdb-pct').value = asset.cdbPercent ?? 100;
  document.getElementById('ast-institution').value = asset.institution || '';
  document.getElementById('ast-liquidity').value = asset.liquidity || 'Diária';
  document.getElementById('ast-promo-cap').value = asset.promoCapCents > 0 ? fromCents(asset.promoCapCents).toFixed(2) : '';
  document.getElementById('ast-excess-pct').value = asset.excessCdbPercent !== undefined ? asset.excessCdbPercent : 100;

  updateAssetLiveSummary();

  const delBtn = document.getElementById('btn-delete-asset');
  delBtn.style.display = !isNew ? 'inline-flex' : 'none';

  document.getElementById('modal-asset').classList.add('open');
}

function bindPatrimonioEvents() {
  const cdiInput = document.getElementById('input-cdi-rate');
  if (cdiInput) {
    cdiInput.addEventListener('change', () => {
      const val = parseFloat(cdiInput.value);
      if (!isNaN(val) && val >= 0) {
        state.cdiRate = val;
        saveState();
        renderApp();
      }
    });
  }

  document.querySelectorAll('[data-ir-rate]').forEach(btn => {
    btn.addEventListener('click', () => {
      const rate = parseFloat(btn.dataset.irRate);
      if (!isNaN(rate)) {
        state.irRate = rate;
        saveState();
        renderApp();
      }
    });
  });

  document.querySelectorAll('[data-quick-cdb]').forEach(btn => {
    btn.addEventListener('click', () => openAssetModal(btn.dataset.quickCdb));
  });

  document.querySelectorAll('[data-edit-asset]').forEach(btn => {
    btn.addEventListener('click', () => openAssetModal(btn.dataset.editAsset));
  });

  document.querySelectorAll('[data-aporte-asset]').forEach(btn => {
    btn.addEventListener('click', () => {
      const asset = state.assets.find(a => a.id === btn.dataset.aporteAsset);
      if (!asset) return;
      openDialogModal({
        title: `Aporte em "${asset.name}"`,
        message: 'Informe o valor a somar neste investimento:',
        inputLabel: 'Valor do aporte (R$)',
        inputType: 'number',
        defaultValue: '100.00',
        placeholder: '100,00',
        confirmLabel: 'Confirmar Aporte',
        onConfirm: (val) => {
          const valCents = toCents(val);
          if (valCents > 0) {
            asset.amountCents = (Number(asset.amountCents) || 0) + valCents;
            asset.weeklyDeltaCents = (Number(asset.weeklyDeltaCents) || 0) + valCents;
            const sourceAcc = state.accounts.find(a => a.type !== 'Cartão de Crédito') || state.accounts[0];
            if (sourceAcc) {
              state.transactions.push({
                id: 'tx-ast-' + Date.now(),
                isAssetTransfer: true,
                type: 'expense',
                amountCents: valCents,
                description: `Aporte em ${asset.name}`,
                tag: 'investimento',
                categoryId: state.categories[0]?.id || 'cat-moradia',
                accountId: sourceAcc.id,
                date: getTodayISO().startsWith(state.selectedMonth) ? getTodayISO() : `${state.selectedMonth}-10`,
                method: 'Aporte / Investimento'
              });
            }
            saveState();
            renderApp();
            showUndoToast(`Aporte de ${fmtBRL(valCents)} debitado de ${sourceAcc?.name || 'Conta'}.`);
          }
        }
      });
    });
  });

  const btnNew = document.getElementById('btn-new-asset');
  if (btnNew) btnNew.addEventListener('click', () => openAssetModal(null));
}

// ============================================================
// 9. ABA: PROJEÇÃO ESTRATÉGICA (3M / 6M / 12M, COMBO CHART & DETALHAMENTO)
// ============================================================
let projState = { horizon: 12, deductGoals: true, selectedIdx: 0, bannerIdx: 0 };

function fmtAxisCompactBRL(cents) {
  const abs = Math.abs(cents);
  const sign = cents < 0 ? '-' : '';
  if (abs === 0) return 'R$ 0';
  if (abs >= 100000) {
    const kVal = abs / 100000;
    const formatted = Number.isInteger(kVal) ? String(kVal) : kVal.toFixed(1).replace('.', ',');
    return `${sign}R$ ${formatted}k`;
  }
  return `${sign}R$ ${Math.round(abs / 100)}`;
}

function buildTopRoundedBarPath(x, yTop, w, h, r = 7, isNegative = false) {
  if (h <= 0.5) return '';
  const radius = Math.min(r, w / 2, h);
  const xRight = x + w;
  const yBottom = yTop + h;
  if (!isNegative) {
    return [
      `M ${x.toFixed(1)} ${yBottom.toFixed(1)}`,
      `L ${x.toFixed(1)} ${(yTop + radius).toFixed(1)}`,
      `Q ${x.toFixed(1)} ${yTop.toFixed(1)} ${(x + radius).toFixed(1)} ${yTop.toFixed(1)}`,
      `L ${(xRight - radius).toFixed(1)} ${yTop.toFixed(1)}`,
      `Q ${xRight.toFixed(1)} ${yTop.toFixed(1)} ${xRight.toFixed(1)} ${(yTop + radius).toFixed(1)}`,
      `L ${xRight.toFixed(1)} ${yBottom.toFixed(1)}`,
      'Z'
    ].join(' ');
  } else {
    return [
      `M ${x.toFixed(1)} ${yTop.toFixed(1)}`,
      `L ${xRight.toFixed(1)} ${yTop.toFixed(1)}`,
      `L ${xRight.toFixed(1)} ${(yBottom - radius).toFixed(1)}`,
      `Q ${xRight.toFixed(1)} ${yBottom.toFixed(1)} ${(xRight - radius).toFixed(1)} ${yBottom.toFixed(1)}`,
      `L ${(x + radius).toFixed(1)} ${yBottom.toFixed(1)}`,
      `Q ${x.toFixed(1)} ${yBottom.toFixed(1)} ${x.toFixed(1)} ${(yBottom - radius).toFixed(1)}`,
      'Z'
    ].join(' ');
  }
}

function renderProjecaoView() {
  const shortMonths = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const salaryCents = Number(state.profile.monthlySalaryCents) || 0;
  const fixedRecOutCents = state.recurrences
    .filter(r => r.active && r.type !== 'income')
    .reduce((s, r) => s + (Number(r.amountCents) || 0), 0);
  const goalMonthlyDeductionCents = projState.deductGoals
    ? Math.round(state.goals.reduce((s, g) => {
        const remCents = Math.max(0, (Number(g.targetCents) || 0) - (Number(g.currentCents) || 0));
        if (remCents <= 0) return s;
        const [selY, selM] = (state.selectedMonth || '2026-11').split('-').map(Number);
        const [dlY, dlM] = (g.deadline || '2027-11').split('-').map(Number);
        const monthsLeft = Math.max(1, (dlY - selY) * 12 + (dlM - selM));
        return s + (remCents / monthsLeft);
      }, 0))
    : 0;

  let runningBalanceCents = state.accounts
    .filter(a => a.type !== 'Cartão de Crédito')
    .reduce((s, a) => s + getAccountBalanceCents(a), 0);

  const horizon = projState.horizon;
  const series = [];

  for (let i = 0; i < horizon; i++) {
    const ym = addMonthsYM(state.selectedMonth, i);
    const [, mStr] = ym.split('-');
    const monthLabel = shortMonths[(parseInt(mStr, 10) || 1) - 1];
    const mMetrics = computeMonthMetrics(ym);

    const hasTxInMonth = mMetrics.incomeCents > 0 || mMetrics.expenseCents > 0;
    const revCents = hasTxInMonth ? mMetrics.incomeCents : salaryCents;
    const expCents = hasTxInMonth ? mMetrics.expenseCents : (mMetrics.expenseCents + fixedRecOutCents);
    const netCents = revCents - expCents - goalMonthlyDeductionCents;

    const startBalCents = runningBalanceCents;
    runningBalanceCents = startBalCents + netCents;

    series.push({
      idx: i,
      ym,
      label: monthLabel,
      startBalCents,
      revCents,
      expCents,
      goalsCents: goalMonthlyDeductionCents,
      netCents,
      endBalCents: runningBalanceCents
    });
  }

  const finalBalanceCents = series[series.length - 1]?.endBalCents || 0;
  const periodDeltaCents = finalBalanceCents - (series[0]?.startBalCents || 0);
  const selIdx = Math.min(projState.selectedIdx, series.length - 1);
  const activeDetail = series[selIdx] || series[0];

  // Parcelamentos terminando nos próximos meses
  const endingInstallments = state.transactions.filter(t => /\(\d+\/\d+\)/.test(t.description || ''));
  let endingMsg = 'Nenhum parcelamento ativo no cartão para encerrar nos próximos meses.';
  if (endingInstallments.length > 0) {
    const totalReleasedCents = endingInstallments.reduce((s, t) => s + (Number(t.amountCents) || 0), 0);
    endingMsg = `<b>${fmtBRL(totalReleasedCents)}/mês</b> liberados quando <b>${endingInstallments.length} parcelamento(s)</b> terminam.`;
  }
  const bannerSlides = [
    { title: 'Parcelamentos terminando', desc: endingMsg },
    { title: 'Impacto das Recorrências', desc: `Suas despesas recorrentes ativas somam <b>${fmtBRL(fixedRecOutCents)}/mês</b> frente ao salário de <b>${fmtBRL(salaryCents)}/mês</b>.` },
    { title: 'Ritmo de Acúmulo no Período', desc: `Em <b>${horizon} meses</b>, sua geração acumulada projetada é de <b>${fmtBRL(periodDeltaCents, true)}</b>.` }
  ];
  const activeSlideIdx = ((projState.bannerIdx % bannerSlides.length) + bannerSlides.length) % bannerSlides.length;
  const currentBanner = bannerSlides[activeSlideIdx];

  // Gráfico Combo SVG de Alta Precisão (sem preserveAspectRatio="none", sem distorção oval)
  const svgW = 1040;
  const svgH = 264;
  const padL = 68;
  const padR = 24;
  const padT = 22;
  const padB = 34;
  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;

  const allVals = series.flatMap(s => [s.endBalCents, s.netCents, 0]);
  const rawMax = Math.max(100000, ...allVals);
  const rawMin = Math.min(0, ...allVals);

  // Calcula passo arredondado elegante para 5 divisões acima de zero
  const targetSteps = 5;
  const rawStep = Math.max(20000, (rawMax - rawMin) / targetSteps);
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / mag;
  const niceFactor = residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 2.5 ? 2.5 : residual <= 5 ? 5 : 10;
  const stepVal = niceFactor * mag;

  const niceMax = Math.max(stepVal * targetSteps, Math.ceil(rawMax / stepVal) * stepVal);
  const niceMin = rawMin < 0 ? Math.floor(rawMin / stepVal) * stepVal : 0;
  const span = Math.max(1, niceMax - niceMin);

  const toY = (v) => padT + chartH - ((v - niceMin) / span) * chartH;
  const zeroY = toY(0);

  // Linhas horizontais de grade (Y-axis) estilo Visor/Monarch
  const gridTicks = [];
  for (let v = niceMin; v <= niceMax + stepVal * 0.1; v += stepVal) {
    gridTicks.push(Math.round(v));
  }
  const yGridHtml = gridTicks.map(val => {
    const y = toY(val);
    const isZero = val === 0;
    return `
      <line x1="${padL}" y1="${y.toFixed(1)}" x2="${svgW - padR}" y2="${y.toFixed(1)}"
        stroke="${isZero ? 'var(--chart-zero-line, rgba(255,255,255,0.16))' : 'var(--chart-grid, rgba(255,255,255,0.055))'}"
        stroke-width="${isZero ? '1.2' : '1'}" />
      <text x="${padL - 12}" y="${(y + 4).toFixed(1)}" text-anchor="end" fill="#6e8594" font-size="11" font-weight="500" class="sensitive-val">${fmtAxisCompactBRL(val)}</text>
    `;
  }).join('');

  const stepX = chartW / Math.max(1, series.length);
  const barW = Math.min(38, Math.max(18, stepX * 0.44));

  // Escala visual proporcional para as barras de Resultado Líquido (para que barras de R$ 2k não fiquem esmagadas quando o saldo de 12M é R$ 26k)
  const maxAbsNet = Math.max(1, ...series.map(s => Math.abs(s.netCents)));
  const naturalMaxBarH = (maxAbsNet / span) * chartH;
  const minDesiredPeakBarH = Math.min(chartH * 0.36, Math.max(24, zeroY - padT - 12));
  const barBoost = naturalMaxBarH < minDesiredPeakBarH ? (minDesiredPeakBarH / naturalMaxBarH) : 1;

  const lineCoords = series.map((s, idx) => ({
    x: padL + stepX * idx + stepX / 2,
    y: toY(s.endBalCents),
    s,
    idx
  }));

  const barsHtml = series.map((s, idx) => {
    const cx = padL + stepX * idx + stepX / 2;
    const isSelected = idx === selIdx;
    const isNeg = s.netCents < 0;
    const rawBarH = (Math.abs(s.netCents) / span) * chartH * barBoost;
    const maxAllowedPosH = Math.max(6, zeroY - padT - 6);
    const maxAllowedNegH = Math.max(6, padT + chartH - zeroY - 4);
    const barH = s.netCents === 0 ? 3 : Math.min(isNeg ? maxAllowedNegH : maxAllowedPosH, Math.max(8, rawBarH));
    const barY = isNeg ? zeroY : (zeroY - barH);

    const fillCol = isNeg
      ? (isSelected ? '#f16364' : 'rgba(241, 99, 100, 0.52)')
      : (isSelected ? 'url(#projBarActiveGrad)' : 'rgba(52, 211, 153, 0.42)');
    const barPath = buildTopRoundedBarPath(cx - barW / 2, barY, barW, barH, 7, isNeg);

    return `
      <g class="chart-hover-zone" data-proj-select="${idx}"
         data-tip-title="${s.label} (${s.ym}) · Saldo: ${fmtBRL(s.endBalCents)}"
         data-tip-val="Resultado Líquido: ${fmtBRL(s.netCents, true)}">
        <rect x="${(cx - stepX / 2).toFixed(1)}" y="${padT}" width="${stepX.toFixed(1)}" height="${chartH}" fill="transparent" />
        ${isSelected ? `<line x1="${cx.toFixed(1)}" y1="${padT}" x2="${cx.toFixed(1)}" y2="${zeroY.toFixed(1)}" stroke="rgba(56, 189, 248, 0.22)" stroke-width="1" stroke-dasharray="3 3" />` : ''}
        <path d="${barPath}" fill="${fillCol}" />
        <text x="${cx.toFixed(1)}" y="${svgH - 8}" text-anchor="middle"
          fill="${isSelected ? 'var(--text-main)' : '#7c94a3'}"
          font-size="11.5"
          font-weight="${isSelected ? '700' : '500'}">${s.label}</text>
      </g>
    `;
  }).join('');

  const smoothLinePath = buildSmoothSvgPath(lineCoords);
  const firstX = lineCoords[0]?.x || padL;
  const lastX = lineCoords[lineCoords.length - 1]?.x || (svgW - padR);
  const areaUnderLinePath = `${smoothLinePath} L ${lastX.toFixed(1)} ${zeroY.toFixed(1)} L ${firstX.toFixed(1)} ${zeroY.toFixed(1)} Z`;

  const dotsHtml = lineCoords.map(({ x, y, s, idx }) => {
    const isSelected = idx === selIdx;
    return `
      <g class="chart-hover-zone" data-proj-select="${idx}"
         data-tip-title="${s.label} (${s.ym}) · Saldo Projetado"
         data-tip-val="${fmtBRL(s.endBalCents)}">
        ${isSelected ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="rgba(59, 130, 246, 0.24)" />` : ''}
        <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${isSelected ? '5' : '4'}"
          fill="${isSelected ? '#38bdf8' : '#3b82f6'}"
          stroke="#ffffff"
          stroke-width="${isSelected ? '2.2' : '1.6'}" />
      </g>
    `;
  }).join('');

  const bannerDotsHtml = bannerSlides.map((_, idx) =>
    `<span class="proj-carousel-dot ${idx === activeSlideIdx ? 'active' : ''}" data-proj-slide="${idx}"></span>`
  ).join('');

  return `
    <div class="card proj-main-card" style="margin-bottom:18px;">
      <div class="proj-header-top">
        <div>
          <div class="proj-eyebrow">SALDO PROJETADO</div>
          <div style="display:flex; align-items:center; gap:12px; margin-top:4px; flex-wrap:wrap;">
            <span class="big-currency sensitive-val" style="font-size:32px; letter-spacing:-0.03em;">${fmtBRL(finalBalanceCents)}</span>
            <span class="proj-delta-pill ${periodDeltaCents >= 0 ? 'positive' : 'negative'} sensitive-val">
              ${periodDeltaCents >= 0 ? '↗' : '↘'} ${fmtBRL(periodDeltaCents, true)} no período
            </span>
          </div>
        </div>

        <div class="proj-controls-right">
          <div class="segmented-tabs">
            <button class="seg-btn ${horizon === 3 ? 'active' : ''}" data-proj-horizon="3">3M</button>
            <button class="seg-btn ${horizon === 6 ? 'active' : ''}" data-proj-horizon="6">6M</button>
            <button class="seg-btn ${horizon === 12 ? 'active' : ''}" data-proj-horizon="12">12M</button>
          </div>

          <div class="proj-legend-row">
            <span class="proj-legend-item">
              <span class="proj-legend-box"></span>Resultado Líquido
            </span>
            <span class="proj-legend-item">
              <span class="proj-legend-line"></span>Saldo Projetado
            </span>
          </div>
        </div>
      </div>

      <div class="proj-chart-container">
        <svg class="proj-chart-svg" width="100%" viewBox="0 0 ${svgW} ${svgH}">
          <defs>
            <linearGradient id="projBarActiveGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#34d399" stop-opacity="1" />
              <stop offset="100%" stop-color="#10b981" stop-opacity="0.88" />
            </linearGradient>
            <linearGradient id="projLineAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.20" />
              <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.0" />
            </linearGradient>
          </defs>
          ${yGridHtml}
          <path d="${areaUnderLinePath}" fill="url(#projLineAreaGrad)" pointer-events="none" />
          ${barsHtml}
          <path d="${smoothLinePath}" fill="none" stroke="#3b82f6" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" pointer-events="none" />
          ${dotsHtml}
        </svg>
      </div>
    </div>

    <div class="proj-banner-blue" style="margin-bottom:18px;">
      <div class="proj-banner-content">
        <div class="proj-banner-title-row">
          <span class="proj-banner-eye">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
            </svg>
          </span>
          <span>${currentBanner.title}</span>
        </div>
        <div class="proj-banner-desc sensitive-val">${currentBanner.desc}</div>
      </div>

      <div class="proj-carousel-nav">
        <button class="proj-carousel-btn" id="btn-proj-prev" aria-label="Slide anterior">‹</button>
        <div class="proj-carousel-dots">${bannerDotsHtml}</div>
        <button class="proj-carousel-btn" id="btn-proj-next" aria-label="Próximo slide">›</button>
      </div>
    </div>

    <div class="card proj-detail-card">
      <div class="card-header-row" style="margin-bottom:10px; padding-bottom:10px; border-bottom:1px solid var(--border-subtle);">
        <span style="display:inline-flex; align-items:center; gap:8px; font-size:12px; font-weight:700; letter-spacing:0.06em; color:var(--text-secondary);">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
          DETALHAMENTO DO MÊS
        </span>
        <span class="badge-pill-dark" style="font-weight:700;">${activeDetail.label} (${activeDetail.ym})</span>
      </div>

      <div class="proj-detail-row">
        <div class="proj-detail-left">
          <span class="proj-chevron">›</span>
          <span class="proj-row-icon neutral">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
          </span>
          <span style="font-weight:600;">Saldo Inicial</span>
        </div>
        <b class="sensitive-val" style="font-size:14px;">${fmtBRL(activeDetail.startBalCents)}</b>
      </div>

      <div class="proj-detail-row">
        <div class="proj-detail-left">
          <span class="proj-chevron">›</span>
          <span class="proj-row-icon income">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 10 5 5 5-5"/><path d="m7 5 5 5 5-5"/></svg>
          </span>
          <span style="font-size:12px; font-weight:700; letter-spacing:0.04em; color:var(--text-secondary);">RECEITAS</span>
        </div>
        <b class="sensitive-val" style="color:var(--green-emerald); font-size:14px;">+${fmtBRL(activeDetail.revCents)}</b>
      </div>

      <div class="proj-detail-row">
        <div class="proj-detail-left">
          <span class="proj-chevron">›</span>
          <span class="proj-row-icon expense">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m17 14-5-5-5 5"/><path d="m17 19-5-5-5 5"/></svg>
          </span>
          <span style="font-size:12px; font-weight:700; letter-spacing:0.04em; color:var(--text-secondary);">GASTOS</span>
        </div>
        <b class="sensitive-val" style="color:var(--coral-red); font-size:14px;">-${fmtBRL(activeDetail.expCents)}</b>
      </div>

      <div class="proj-detail-row">
        <div class="proj-detail-left">
          <span class="proj-chevron">›</span>
          <span class="proj-row-icon goals">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
          </span>
          <div>
            <div style="font-weight:600;">Metas</div>
            <div style="font-size:11.5px; color:var(--text-muted);">Guardar para metas reduz o saldo projetado</div>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:12px;">
          <b class="sensitive-val" style="color:#a78bfa; font-size:14px;">-${fmtBRL(activeDetail.goalsCents)}</b>
          <label class="switch-toggle" title="Ativar/desativar reserva para metas na projeção">
            <input type="checkbox" id="toggle-proj-goals" ${projState.deductGoals ? 'checked' : ''} />
            <span class="switch-slider"></span>
          </label>
        </div>
      </div>
    </div>
  `;
}

function bindProjecaoEvents() {
  document.querySelectorAll('[data-proj-horizon]').forEach(btn => {
    btn.addEventListener('click', () => {
      projState.horizon = Number(btn.dataset.projHorizon);
      projState.selectedIdx = 0;
      renderApp();
    });
  });

  document.querySelectorAll('[data-proj-select]').forEach(el => {
    el.addEventListener('click', () => {
      projState.selectedIdx = Number(el.dataset.projSelect);
      renderApp();
    });
  });

  const prevBtn = document.getElementById('btn-proj-prev');
  const nextBtn = document.getElementById('btn-proj-next');
  if (prevBtn) prevBtn.addEventListener('click', () => { projState.bannerIdx = (projState.bannerIdx - 1 + 3) % 3; renderApp(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { projState.bannerIdx = (projState.bannerIdx + 1) % 3; renderApp(); });

  document.querySelectorAll('[data-proj-slide]').forEach(dot => {
    dot.addEventListener('click', () => {
      projState.bannerIdx = Number(dot.dataset.projSlide) || 0;
      renderApp();
    });
  });

  const toggleGoals = document.getElementById('toggle-proj-goals');
  if (toggleGoals) {
    toggleGoals.addEventListener('change', (e) => {
      projState.deductGoals = e.target.checked;
      renderApp();
    });
  }

  bindChartTooltips();
}

// ============================================================
// 10. ABA: CONTAS BANCÁRIAS (SALDO REAL EM CENTAVOS)
// ============================================================
function renderContasView() {
  const cards = state.accounts.map(a => {
    const balCents = getAccountBalanceCents(a);
    return `
      <div class="card">
        <div class="card-header-row" style="gap:10px;">
          <span style="font-weight:600;">${a.name}</span>
          <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
            <span class="cat-pct-badge">${a.type}</span>
            <button class="btn-icon-edit" data-edit-acc="${a.id}">✎ Editar</button>
          </div>
        </div>
        <div class="big-currency sensitive-val" style="font-size:22px; margin-top:8px;">
          ${a.type === 'Cartão de Crédito' ? `Limite: ${fmtBRL(a.limitCents)}` : `Saldo: ${fmtBRL(balCents)}`}
        </div>
        <div class="vs-prev sensitive-val" style="margin-top:6px;">
          Limite: ${fmtBRL(a.limitCents)} · Fechamento dia ${a.closingDay} · Vencimento dia ${a.dueDay}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="section-toolbar">
      <div>
        <h3 class="card-title" style="font-size:16px;">Minhas Contas & Cartões</h3>
        <p class="vs-prev">Use "Conta + Cartão" para bancos onde você concentra o saldo da conta e também usa o cartão de crédito.</p>
      </div>
      <button class="btn-primary" id="btn-new-account">+ Adicionar Conta</button>
    </div>
    <div class="cards-grid-3">${cards}</div>
  `;
}

function bindContasEvents() {
  const btn = document.getElementById('btn-new-account');
  if (btn) {
    btn.addEventListener('click', () => openAccountModal(null));
  }
  document.querySelectorAll('[data-edit-acc]').forEach(el => {
    el.addEventListener('click', () => openAccountModal(el.dataset.editAcc));
  });
}

// ============================================================
// MODAIS: LANÇAMENTO RÁPIDO (3 TOQUES) & PERFIL ISOLADO
// ============================================================
let manualCategoryPicked = false;

function renderQuickCategoryChips(selectedId) {
  const sortedCats = getCategoriesSortedByUsage();
  const chipsWrap = document.getElementById('quick-cat-chips');
  if (!chipsWrap) return;

  const activeId = selectedId || (sortedCats[0]?.id || '');
  document.getElementById('tx-category').value = activeId;

  chipsWrap.innerHTML = sortedCats.map(c => `
    <button type="button" class="cat-chip ${c.id === activeId ? 'selected' : ''}" data-quick-cat="${c.id}">
      <span class="cat-dot" style="background:${c.color};"></span>
      ${c.name}
    </button>
  `).join('');

  chipsWrap.querySelectorAll('[data-quick-cat]').forEach(chip => {
    chip.addEventListener('click', () => {
      manualCategoryPicked = true;
      renderQuickCategoryChips(chip.dataset.quickCat);
    });
  });
}

function syncSegmentedControl(selectId) {
  const sel = document.getElementById(selectId);
  const group = document.querySelector(`[data-seg-for="${selectId}"]`);
  if (!sel || !group) return;
  group.querySelectorAll('[data-seg-val]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.segVal === sel.value);
  });
}

function openTransactionModal(preselectedAccountId = null, editTxId = null) {
  const editTx = editTxId ? state.transactions.find(t => t.id === editTxId) : null;
  manualCategoryPicked = Boolean(editTx);
  const accSelect = document.getElementById('tx-account');
  accSelect.innerHTML = state.accounts
    .map(a => `<option value="${a.id}">${a.name}</option>`)
    .join('');

  document.getElementById('tx-id').value = editTx ? editTx.id : '';
  document.getElementById('modal-tx-title').textContent = editTx ? 'Editar transação' : 'Lançamento rápido';
  const delTxBtn = document.getElementById('btn-delete-transaction');
  if (delTxBtn) delTxBtn.style.display = editTx ? 'inline-flex' : 'none';

  if (editTx) {
    if (editTx.accountId && state.accounts.some(a => a.id === editTx.accountId)) {
      accSelect.value = editTx.accountId;
    }
    document.getElementById('tx-method').value = editTx.method || 'Conta Corrente / Pix';
    renderQuickCategoryChips(editTx.categoryId);

    document.getElementById('tx-type').value = editTx.type || 'expense';
    document.getElementById('tx-installments').value = '1';
    document.getElementById('tx-date').value = editTx.date || getTodayISO();
    document.getElementById('tx-amount').value = (editTx.amountCents / 100).toFixed(2);
    document.getElementById('tx-desc').value = editTx.description || '';
    document.getElementById('tx-tag').value = editTx.tag || '';
    document.getElementById('tx-is-recurring').checked = false;
    document.getElementById('quick-more-details').open = true;
  } else {
    const targetAccId = preselectedAccountId || state.lastUsedAccountId || state.accounts[0]?.id;
    if (targetAccId && state.accounts.some(a => a.id === targetAccId)) {
      accSelect.value = targetAccId;
    }

    const targetAcc = getAccountById(accSelect.value);
    if (preselectedAccountId || targetAcc.type === 'Cartão de Crédito' || targetAcc.type === 'Conta + Cartão') {
      document.getElementById('tx-method').value = 'Cartão de Crédito';
    } else {
      document.getElementById('tx-method').value = 'Conta Corrente / Pix';
    }

    renderQuickCategoryChips(null);

    document.getElementById('tx-type').value = 'expense';
    document.getElementById('tx-installments').value = '1';
    document.getElementById('tx-date').value = getDefaultDateForSelectedMonth();
    document.getElementById('tx-amount').value = '';
    document.getElementById('tx-desc').value = '';
    document.getElementById('tx-tag').value = '';
    document.getElementById('tx-is-recurring').checked = false;
    document.getElementById('quick-more-details').open = true;
  }

  syncSegmentedControl('tx-type');
  updateInstallmentUI();
  document.getElementById('modal-transaction').classList.add('open');
  setTimeout(() => document.getElementById('tx-amount').focus(), 60);
}

function updateInstallmentUI() {
  const type = document.getElementById('tx-type').value;
  const method = document.getElementById('tx-method').value;
  const wrap = document.getElementById('tx-installments-wrap');
  const preview = document.getElementById('tx-installment-preview');
  const isCardExpense = type === 'expense' && method === 'Cartão de Crédito';

  wrap.style.display = isCardExpense ? 'flex' : 'none';
  if (isCardExpense) {
    const totalCents = toCents(document.getElementById('tx-amount').value);
    const count = parseInt(document.getElementById('tx-installments').value, 10) || 1;
    preview.textContent = count > 1 && totalCents > 0 ? `${count}x de ${fmtBRL(Math.round(totalCents / count))}` : 'À vista';
  }
}

function openProfileModal() {
  const userSel = document.getElementById('prof-user-select');
  userSel.innerHTML = usersIndex.users
    .map(u => `<option value="${u.id}" ${u.id === usersIndex.activeUserId ? 'selected' : ''}>${u.name}</option>`)
    .join('');
  document.getElementById('prof-new-user').value = '';
  document.getElementById('prof-name').value = state.profile.name;
  document.getElementById('prof-plan').value = state.profile.plan;
  document.getElementById('prof-salary').value = fromCents(state.profile.monthlySalaryCents || 0).toFixed(2);
  document.getElementById('prof-salary-day').value = state.profile.salaryDay || 5;
  document.getElementById('prof-budget').value = fromCents(state.profile.monthlyBudgetCents || 0).toFixed(2);
  document.getElementById('prof-reserve-goal').value = fromCents(state.profile.emergencyGoalCents || 33000).toFixed(2);
  document.getElementById('modal-profile').classList.add('open');
}

let farolInitialized = false;
export function initFarolApp() {
  usersIndex = getUsersIndex();
  state = loadState();
  const viewContainer = document.getElementById('view-container');
  if (farolInitialized && viewContainer && viewContainer.dataset.bound === '1') {
    renderApp();
    return;
  }
  farolInitialized = true;
  if (viewContainer) viewContainer.dataset.bound = '1';
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      state.currentTab = btn.dataset.tab;
      saveState();
      renderApp();
      try {
        const navScroll = btn.closest('.sidebar-nav-scroll');
        if (navScroll && navScroll.scrollWidth > navScroll.clientWidth) {
          const targetLeft = btn.offsetLeft - (navScroll.clientWidth / 2) + (btn.offsetWidth / 2);
          navScroll.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
        }
        if (window.scrollX !== 0) {
          window.scrollTo({ left: 0, top: window.scrollY });
        }
      } catch {
        // fallback silencioso
      }
    });
  });

  const monthSel = document.getElementById('month-selector');
  monthSel.value = state.selectedMonth;
  monthSel.addEventListener('change', (e) => {
    state.selectedMonth = e.target.value;
    saveState();
    renderApp();
  });

  document.getElementById('theme-toggle-btn').addEventListener('click', () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    saveState();
    renderApp();
  });

  document.getElementById('privacy-toggle-btn').addEventListener('click', () => {
    state.privacyMode = !state.privacyMode;
    saveState();
    renderApp();
  });

  document.getElementById('quick-add-btn').addEventListener('click', () => openTransactionModal());
  document.getElementById('profile-trigger').addEventListener('click', () => openProfileModal());

  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById(btn.dataset.closeModal).classList.remove('open');
    });
  });

  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) backdrop.classList.remove('open');
    });
  });

  // Segmented controls (Tipo / Status)
  document.querySelectorAll('[data-seg-for]').forEach(group => {
    const selectId = group.dataset.segFor;
    const sel = document.getElementById(selectId);
    group.querySelectorAll('[data-seg-val]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (sel) {
          sel.value = btn.dataset.segVal;
          sel.dispatchEvent(new Event('change'));
        }
        syncSegmentedControl(selectId);
      });
    });
  });

  // Live summary listeners nos modais
  ['inv-limit', 'inv-closing-day', 'inv-due-day'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateInvoiceLiveSummary);
  });

  ['ast-amount', 'ast-cdb-pct', 'ast-promo-cap', 'ast-excess-pct'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateAssetLiveSummary);
  });

  ['rec-amount', 'rec-day'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateRecurrenceLiveSummary);
  });

  const delTxBtn = document.getElementById('btn-delete-transaction');
  if (delTxBtn) {
    delTxBtn.addEventListener('click', () => {
      const txId = document.getElementById('tx-id').value;
      if (!txId) return;
      state.transactions = state.transactions.filter(t => t.id !== txId);
      saveState();
      document.getElementById('modal-transaction').classList.remove('open');
      renderApp();
    });
  }

  const delRecBtn = document.getElementById('btn-delete-recurrence');
  if (delRecBtn) {
    delRecBtn.addEventListener('click', () => {
      const recId = document.getElementById('rec-id').value;
      if (!recId) return;
      state.recurrences = state.recurrences.filter(r => r.id !== recId);
      state.transactions = state.transactions.filter(t => !(t.recurrenceId === recId && (t.date || '').startsWith(state.selectedMonth)));
      saveState();
      document.getElementById('modal-recurrence').classList.remove('open');
      renderApp();
    });
  }

  // Desfazer edição em lote
  document.getElementById('btn-undo-batch').addEventListener('click', () => {
    if (!undoSnapshot) return;
    state.transactions = undoSnapshot;
    undoSnapshot = null;
    document.getElementById('undo-toast').classList.remove('visible');
    saveState();
    renderApp();
  });

  // Regra automática ao digitar descrição
  document.getElementById('tx-desc').addEventListener('input', (e) => {
    if (manualCategoryPicked) return;
    const matched = matchCategoryByRules(e.target.value);
    if (matched) renderQuickCategoryChips(matched);
  });

  // Troca de usuário isolado
  document.getElementById('prof-user-select').addEventListener('change', (e) => {
    usersIndex.activeUserId = e.target.value;
    saveUsersIndex(usersIndex);
    state = loadState();
    document.getElementById('modal-profile').classList.remove('open');
    renderApp();
  });

  document.getElementById('btn-create-user').addEventListener('click', () => {
    const newName = document.getElementById('prof-new-user').value.trim();
    if (!newName) return;
    const newId = 'user-' + Date.now();
    usersIndex.users.push({ id: newId, name: newName });
    usersIndex.activeUserId = newId;
    saveUsersIndex(usersIndex);
    state = getDefaultState(newName);
    saveState();
    document.getElementById('modal-profile').classList.remove('open');
    renderApp();
  });

  // Salvar Categoria & Regras
  document.getElementById('form-category').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('cat-id').value;
    const name = document.getElementById('cat-name').value.trim();
    const color = document.getElementById('cat-color').value || '#38b6ff';
    const budgetCents = toCents(document.getElementById('cat-budget').value);
    const rules = document.getElementById('cat-rules').value
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (!name) return;

    if (id) {
      const cat = state.categories.find(c => c.id === id);
      if (cat) {
        cat.name = name;
        cat.color = color;
        cat.budgetCents = budgetCents;
        cat.rules = rules;
      }
    } else {
      state.categories.push({
        id: 'cat-' + Date.now(),
        name,
        color,
        budgetCents,
        rules,
        archived: false
      });
    }

    saveState();
    document.getElementById('modal-category').classList.remove('open');
    renderApp();
  });

  document.getElementById('btn-archive-category').addEventListener('click', () => {
    const id = document.getElementById('cat-id').value;
    const cat = state.categories.find(c => c.id === id);
    if (!cat) return;
    cat.archived = !cat.archived;
    saveState();
    document.getElementById('modal-category').classList.remove('open');
    renderApp();
  });

  // Salvar Edição / Criação de Fatura
  document.getElementById('form-invoice').addEventListener('submit', (e) => {
    e.preventDefault();
    const accId = document.getElementById('inv-account-id').value;
    const name = document.getElementById('inv-name').value.trim();
    const status = document.getElementById('inv-status').value;
    const limitCents = toCents(document.getElementById('inv-limit').value) || 200000;
    const adjustmentCents = toCents(document.getElementById('inv-manual-adj').value);
    const closingDay = Math.min(31, Math.max(1, parseInt(document.getElementById('inv-closing-day').value, 10) || 5));
    const dueDay = Math.min(31, Math.max(1, parseInt(document.getElementById('inv-due-day').value, 10) || 12));

    if (!name) return;

    let targetId = accId;
    if (accId) {
      const acc = state.accounts.find(a => a.id === accId);
      if (acc) {
        acc.name = name;
        acc.limitCents = limitCents;
        acc.closingDay = closingDay;
        acc.dueDay = dueDay;
      }
    } else {
      targetId = 'acc-' + Date.now();
      state.accounts.push({
        id: targetId,
        name,
        type: 'Cartão de Crédito',
        initialBalanceCents: 0,
        limitCents,
        closingDay,
        dueDay
      });
    }

    setInvoiceMeta(targetId, { status, adjustmentCents });
    saveState();
    document.getElementById('modal-invoice').classList.remove('open');
    renderApp();
  });

  document.getElementById('btn-delete-invoice').addEventListener('click', () => {
    const accId = document.getElementById('inv-account-id').value;
    if (!accId || state.accounts.length <= 1) return;
    state.accounts = state.accounts.filter(a => a.id !== accId);
    saveState();
    document.getElementById('modal-invoice').classList.remove('open');
    renderApp();
  });

  // Salvar Ativo / Patrimônio
  document.getElementById('form-asset').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('ast-id').value;
    const name = document.getElementById('ast-name').value.trim();
    const category = document.getElementById('ast-category').value;
    const amountCents = toCents(document.getElementById('ast-amount').value);
    const cdbPercent = parseFloat(document.getElementById('ast-cdb-pct').value);
    const institution = document.getElementById('ast-institution').value.trim() || 'Instituição';
    const liquidity = document.getElementById('ast-liquidity').value;
    const promoCapCents = toCents(document.getElementById('ast-promo-cap').value);
    const excessRaw = parseFloat(document.getElementById('ast-excess-pct').value);
    const excessCdbPercent = isNaN(excessRaw) ? 100 : excessRaw;

    if (!name) return;

    if (id) {
      const asset = state.assets.find(a => a.id === id);
      if (asset) {
        asset.weeklyDeltaCents = amountCents - (Number(asset.amountCents) || 0);
        asset.name = name;
        asset.category = category;
        asset.amountCents = amountCents;
        asset.cdbPercent = isNaN(cdbPercent) ? 100 : cdbPercent;
        asset.promoCapCents = promoCapCents > 0 ? promoCapCents : 0;
        asset.excessCdbPercent = excessCdbPercent;
        asset.institution = institution;
        asset.liquidity = liquidity;
      }
    } else {
      state.assets.push({
        id: 'ast-' + Date.now(),
        name,
        category,
        amountCents,
        cdbPercent: isNaN(cdbPercent) ? 100 : cdbPercent,
        promoCapCents: promoCapCents > 0 ? promoCapCents : 0,
        excessCdbPercent,
        institution,
        liquidity,
        weeklyDeltaCents: amountCents
      });
    }

    saveState();
    document.getElementById('modal-asset').classList.remove('open');
    renderApp();
  });

  document.getElementById('btn-delete-asset').addEventListener('click', () => {
    const id = document.getElementById('ast-id').value;
    if (!id) return;
    state.assets = state.assets.filter(a => a.id !== id);
    saveState();
    document.getElementById('modal-asset').classList.remove('open');
    renderApp();
  });

  ['tx-type', 'tx-method', 'tx-installments'].forEach(id => {
    document.getElementById(id).addEventListener('change', updateInstallmentUI);
  });
  document.getElementById('tx-amount').addEventListener('input', updateInstallmentUI);

  // Salvar Lançamento Rápido (até 3 toques, centavos inteiros, parcelamento e recorrência)
  document.getElementById('form-transaction').addEventListener('submit', (e) => {
    e.preventDefault();
    const editId = document.getElementById('tx-id').value;
    const type = document.getElementById('tx-type').value;
    const amountCents = toCents(document.getElementById('tx-amount').value);
    const categoryId = document.getElementById('tx-category').value || state.categories[0]?.id;
    const catObj = getCategoryById(categoryId);
    const rawDesc = document.getElementById('tx-desc').value.trim();
    const description = rawDesc || catObj.name;
    const tag = document.getElementById('tx-tag').value.trim();
    const accountId = document.getElementById('tx-account').value || state.accounts[0]?.id;
    const date = document.getElementById('tx-date').value || getTodayISO();
    const method = document.getElementById('tx-method').value;
    const isRecurring = document.getElementById('tx-is-recurring').checked;
    const installments = (type === 'expense' && method === 'Cartão de Crédito')
      ? (parseInt(document.getElementById('tx-installments').value, 10) || 1)
      : 1;

    if (isNaN(amountCents) || amountCents <= 0) return;

    state.lastUsedAccountId = accountId;

    if (editId) {
      const existing = state.transactions.find(t => t.id === editId);
      if (existing) {
        existing.type = type;
        existing.amountCents = amountCents;
        existing.description = description;
        existing.tag = tag;
        existing.categoryId = categoryId;
        existing.accountId = accountId;
        existing.date = date;
        existing.method = method;
      }
    } else if (installments > 1) {
      const [yStr, mStr, dStr] = date.split('-');
      const baseYear = parseInt(yStr, 10);
      const baseMonth = parseInt(mStr, 10) - 1;
      const baseDay = parseInt(dStr, 10);
      const perInstallmentCents = Math.floor(amountCents / installments);
      const remainderCents = amountCents - (perInstallmentCents * installments);
      const baseTs = Date.now();

      for (let i = 0; i < installments; i++) {
        const targetDate = new Date(baseYear, baseMonth + i, 1);
        const daysInMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
        const clampedDay = Math.min(baseDay, daysInMonth);
        const ym = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
        const formattedDate = `${ym}-${String(clampedDay).padStart(2, '0')}`;

        state.transactions.push({
          id: `tx-${baseTs}-${i}`,
          type,
          amountCents: perInstallmentCents + (i === 0 ? remainderCents : 0),
          description: `${description} (${i + 1}/${installments})`,
          tag,
          categoryId,
          accountId,
          date: formattedDate,
          method
        });
      }
    } else {
      state.transactions.push({
        id: 'tx-' + Date.now(),
        type,
        amountCents,
        description,
        tag,
        categoryId,
        accountId,
        date,
        method
      });
    }

    if (isRecurring) {
      const day = parseInt(date.split('-')[2], 10) || 10;
      state.recurrences.push({
        id: 'rec-' + Date.now(),
        description,
        amountCents,
        type,
        categoryId,
        accountId,
        day,
        active: true
      });
    }

    saveState();
    document.getElementById('modal-transaction').classList.remove('open');
    renderApp();
  });

  // Salvar Perfil e Orçamento
  document.getElementById('form-profile').addEventListener('submit', (e) => {
    e.preventDefault();
    const newName = document.getElementById('prof-name').value.trim() || 'Meu nome';
    state.profile.name = newName;
    state.profile.plan = document.getElementById('prof-plan').value.trim() || 'Plano pessoal';
    state.profile.monthlySalaryCents = toCents(document.getElementById('prof-salary').value);
    state.profile.salaryDay = Math.min(28, Math.max(1, parseInt(document.getElementById('prof-salary-day').value, 10) || 5));
    state.profile.monthlyBudgetCents = toCents(document.getElementById('prof-budget').value);
    state.profile.emergencyGoalCents = toCents(document.getElementById('prof-reserve-goal').value) || 33000;

    const u = usersIndex.users.find(x => x.id === usersIndex.activeUserId);
    if (u) {
      u.name = newName;
      saveUsersIndex(usersIndex);
    }

    saveState();
    document.getElementById('modal-profile').classList.remove('open');
    renderApp();
  });

  document.getElementById('btn-reset-demo').addEventListener('click', () => {
    state = getDefaultState(state.profile.name);
    saveState();
    document.getElementById('modal-profile').classList.remove('open');
    renderApp();
  });

  // Salvar Nova / Editar Recorrência
  const formRec = document.getElementById('form-recurrence');
  if (formRec) {
    formRec.addEventListener('submit', (e) => {
      e.preventDefault();
      const recId = document.getElementById('rec-id').value;
      const desc = document.getElementById('rec-desc').value.trim();
      const valCents = toCents(document.getElementById('rec-amount').value);
      const day = Math.min(31, Math.max(1, parseInt(document.getElementById('rec-day').value, 10) || 10));
      const type = document.getElementById('rec-type').value;
      const categoryId = document.getElementById('rec-category').value || (state.categories[0]?.id || 'cat-delivery');
      const accountId = document.getElementById('rec-account').value || (state.accounts[0]?.id || 'acc-nubank');
      if (!desc || valCents <= 0) return;

      if (recId) {
        const existing = state.recurrences.find(r => r.id === recId);
        if (existing) {
          existing.description = desc;
          existing.amountCents = valCents;
          existing.type = type;
          existing.categoryId = categoryId;
          existing.accountId = accountId;
          existing.day = day;
          // Atualiza a transação gerada no mês selecionado para refletir imediatamente na fatura/conta
          const targetAcc = getAccountById(accountId);
          const isCardAcc = targetAcc.type === 'Cartão de Crédito' || targetAcc.type === 'Conta + Cartão';
          const recMethod = (type === 'expense' && isCardAcc)
            ? 'Cartão de Crédito'
            : 'Recorrência Automática';
          const dayStr = String(Math.min(28, Math.max(1, day))).padStart(2, '0');
          state.transactions.forEach(t => {
            if (t.recurrenceId === recId && (t.date || '').startsWith(state.selectedMonth)) {
              t.description = desc;
              t.amountCents = valCents;
              t.type = type;
              t.categoryId = categoryId;
              t.accountId = accountId;
              t.method = recMethod;
              t.date = `${state.selectedMonth}-${dayStr}`;
            }
          });
        }
      } else {
        state.recurrences.push({
          id: 'rec-' + Date.now(),
          description: desc,
          amountCents: valCents,
          type,
          categoryId,
          accountId,
          day,
          active: true
        });
      }
      saveState();
      document.getElementById('modal-recurrence').classList.remove('open');
      renderApp();
    });
  }

  // Salvar Nova / Editar Conta / Cartão
  const accTypeSelect = document.getElementById('acc-type');
  const accCardRow = document.getElementById('acc-card-dates-row');
  if (accTypeSelect && accCardRow) {
    accTypeSelect.addEventListener('change', () => {
      accCardRow.style.display = (accTypeSelect.value === 'Cartão de Crédito' || accTypeSelect.value === 'Conta + Cartão') ? 'grid' : 'none';
    });
  }

  const formAcc = document.getElementById('form-account');
  if (formAcc) {
    formAcc.addEventListener('submit', (e) => {
      e.preventDefault();
      const accId = document.getElementById('acc-id').value;
      const name = document.getElementById('acc-name').value.trim();
      if (!name) return;
      const type = document.getElementById('acc-type').value;
      const balCents = toCents(document.getElementById('acc-balance').value);
      const limitCents = toCents(document.getElementById('acc-limit').value) || 300000;
      const closingDay = Math.min(31, Math.max(1, parseInt(document.getElementById('acc-closing-day').value, 10) || 5));
      const dueDay = Math.min(31, Math.max(1, parseInt(document.getElementById('acc-due-day').value, 10) || 12));

      if (accId) {
        const existing = state.accounts.find(a => a.id === accId);
        if (existing) {
          existing.name = name;
          existing.type = type;
          existing.initialBalanceCents = balCents;
          existing.limitCents = limitCents;
          existing.closingDay = closingDay;
          existing.dueDay = dueDay;
        }
      } else {
        state.accounts.push({
          id: 'acc-' + Date.now(),
          name,
          type,
          initialBalanceCents: balCents,
          limitCents,
          closingDay,
          dueDay
        });
      }
      saveState();
      document.getElementById('modal-account').classList.remove('open');
      renderApp();
    });
  }

  const delAccBtn = document.getElementById('btn-delete-account');
  if (delAccBtn) {
    delAccBtn.addEventListener('click', () => {
      const accId = document.getElementById('acc-id').value;
      if (!accId || state.accounts.length <= 1) return;
      document.getElementById('modal-account').classList.remove('open');
      openDialogModal({
        title: 'Excluir conta ou cartão',
        message: 'Tem certeza que deseja excluir esta conta? Os lançamentos existentes permanecerão no histórico.',
        confirmLabel: 'Excluir',
        onConfirm: () => {
          state.accounts = state.accounts.filter(a => a.id !== accId);
          saveState();
          renderApp();
        }
      });
    });
  }

  bindAuthEvents();
  renderApp();
  hydrateFromCloud();
}

// ============================================================
// MODAIS AUXILIARES: RECORRÊNCIA, CONTA & DIÁLOGO ESTILIZADO
// ============================================================
function updateRecurrenceLiveSummary() {
  const valCents = toCents(document.getElementById('rec-amount')?.value);
  const day = Math.min(31, Math.max(1, parseInt(document.getElementById('rec-day')?.value, 10) || 10));
  const [yStr, mStr] = (state.selectedMonth || '2026-12').split('-');
  const shortMonths = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const mLabel = shortMonths[(parseInt(mStr, 10) || 12) - 1] || 'dez';
  const nextEl = document.getElementById('rec-live-next');
  const annEl = document.getElementById('rec-live-annual');
  if (nextEl) nextEl.textContent = `${String(day).padStart(2, '0')} de ${mLabel} de ${yStr}`;
  if (annEl) annEl.textContent = fmtBRL(valCents * 12);
}

function openRecurrenceModal(recId = null) {
  const rec = recId ? state.recurrences.find(r => r.id === recId) : null;
  const catSelect = document.getElementById('rec-category');
  if (catSelect) {
    const activeCats = state.categories.filter(c => !c.archived);
    catSelect.innerHTML = activeCats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  }
  const accSelect = document.getElementById('rec-account');
  if (accSelect) {
    accSelect.innerHTML = state.accounts
      .map(a => `<option value="${a.id}">${a.name} (${a.type})</option>`)
      .join('');
    accSelect.value = rec?.accountId || state.lastUsedAccountId || state.accounts[0]?.id || '';
  }
  document.getElementById('modal-rec-title').textContent = rec ? 'Editar recorrência' : 'Nova recorrência';
  document.getElementById('rec-id').value = rec ? rec.id : '';
  document.getElementById('rec-desc').value = rec ? rec.description : '';
  document.getElementById('rec-amount').value = rec ? fromCents(rec.amountCents).toFixed(2) : '';
  document.getElementById('rec-day').value = rec ? String(rec.day) : '10';
  document.getElementById('rec-type').value = rec ? (rec.type || 'expense') : 'expense';
  syncSegmentedControl('rec-type');
  if (rec && catSelect && rec.categoryId) {
    catSelect.value = rec.categoryId;
  }
  const delBtn = document.getElementById('btn-delete-recurrence');
  if (delBtn) delBtn.style.display = rec ? 'inline-flex' : 'none';
  updateRecurrenceLiveSummary();
  document.getElementById('modal-recurrence').classList.add('open');
  setTimeout(() => document.getElementById('rec-desc').focus(), 40);
}

function openAccountModal(accId = null) {
  const acc = accId ? state.accounts.find(a => a.id === accId) : null;
  document.getElementById('modal-acc-title').textContent = acc ? `Editar — ${acc.name}` : 'Nova Conta ou Cartão';
  document.getElementById('acc-id').value = acc ? acc.id : '';
  document.getElementById('acc-name').value = acc ? acc.name : '';
  document.getElementById('acc-type').value = acc ? acc.type : 'Conta + Cartão';
  document.getElementById('acc-balance').value = acc ? fromCents(acc.initialBalanceCents || 0).toFixed(2) : '0.00';
  document.getElementById('acc-limit').value = acc ? fromCents(acc.limitCents || 300000).toFixed(2) : '3000.00';
  document.getElementById('acc-closing-day').value = acc ? String(acc.closingDay || 5) : '5';
  document.getElementById('acc-due-day').value = acc ? String(acc.dueDay || 12) : '12';
  const cardRow = document.getElementById('acc-card-dates-row');
  const showCardDates = !acc || acc.type === 'Cartão de Crédito' || acc.type === 'Conta + Cartão';
  if (cardRow) cardRow.style.display = showCardDates ? 'grid' : 'none';
  const delAccBtn = document.getElementById('btn-delete-account');
  if (delAccBtn) delAccBtn.style.display = (acc && state.accounts.length > 1) ? 'inline-flex' : 'none';
  document.getElementById('modal-account').classList.add('open');
  setTimeout(() => document.getElementById('acc-name').focus(), 40);
}

function openDialogModal({ title, message, inputLabel, inputType = 'text', defaultValue = '', placeholder = '', confirmLabel = 'Confirmar', onConfirm }) {
  const modal = document.getElementById('modal-dialog');
  const titleEl = document.getElementById('dialog-title');
  const msgEl = document.getElementById('dialog-message');
  const wrapEl = document.getElementById('dialog-input-wrap');
  const labelEl = document.getElementById('dialog-input-label');
  const inputEl = document.getElementById('dialog-input');
  const confirmBtn = document.getElementById('dialog-confirm-btn');
  const cancelBtn = document.getElementById('dialog-cancel-btn');
  const closeX = document.getElementById('dialog-close-x');
  const form = document.getElementById('form-dialog');

  titleEl.textContent = title || 'Confirmar';
  msgEl.textContent = message || '';
  confirmBtn.textContent = confirmLabel || 'Confirmar';

  const hasInput = Boolean(inputLabel);
  wrapEl.style.display = hasInput ? 'block' : 'none';
  if (hasInput) {
    labelEl.textContent = inputLabel;
    inputEl.type = inputType;
    if (inputType === 'number') {
      inputEl.step = '0.01';
      inputEl.min = '0';
    } else {
      inputEl.removeAttribute('step');
      inputEl.removeAttribute('min');
    }
    inputEl.value = defaultValue;
    inputEl.placeholder = placeholder;
  }

  const close = () => modal.classList.remove('open');
  cancelBtn.onclick = close;
  closeX.onclick = close;
  form.onsubmit = (e) => {
    e.preventDefault();
    close();
    if (onConfirm) onConfirm(hasInput ? inputEl.value : true);
  };

  modal.classList.add('open');
  setTimeout(() => {
    if (hasInput) {
      inputEl.focus();
      inputEl.select();
    } else {
      confirmBtn.focus();
    }
  }, 40);
}


// ============================================================
// AUTENTICAÇÃO DE CONTA NA NUVEM (LOGIN / CADASTRO) & POSTGRESQL
// ============================================================
const AUTH_SESSION_STORAGE_KEY = 'farol_auth_session_v1';
let cloudSessionUser = null;
let otpCooldownInterval = null;
let pendingOtpRemember = true;

function setAuthGateVisibility(showGate) {
  const gate = document.getElementById('auth-gate-screen');
  const shell = document.getElementById('main-app-shell');
  if (gate) gate.style.display = showGate ? 'flex' : 'none';
  if (shell) shell.style.display = showGate ? 'none' : 'grid';
}

function startOtpCooldownTimer(seconds = 60) {
  const resendBtn = document.getElementById('btn-gate-resend-otp');
  if (!resendBtn) return;
  if (otpCooldownInterval) clearInterval(otpCooldownInterval);

  let rem = Math.max(0, Math.round(seconds));
  const updateLabel = () => {
    if (rem > 0) {
      resendBtn.disabled = true;
      resendBtn.textContent = `Reenviar código (${rem}s)`;
    } else {
      resendBtn.disabled = false;
      resendBtn.textContent = 'Reenviar código agora';
      if (otpCooldownInterval) {
        clearInterval(otpCooldownInterval);
        otpCooldownInterval = null;
      }
    }
  };
  updateLabel();
  if (rem > 0) {
    otpCooldownInterval = setInterval(() => {
      rem -= 1;
      updateLabel();
    }, 1000);
  }
}

function getOtpBoxes() {
  return Array.from(document.querySelectorAll('.otp-digit-box'));
}

function clearAndFocusOtpBoxes() {
  const boxes = getOtpBoxes();
  boxes.forEach(b => { b.value = ''; });
  if (boxes[0]) setTimeout(() => boxes[0].focus(), 40);
}

function fillOtpBoxesWithCode(codeStr) {
  const digits = String(codeStr || '').replace(/\D/g, '').slice(0, 6);
  const boxes = getOtpBoxes();
  boxes.forEach((b, idx) => {
    b.value = digits[idx] || '';
  });
  const lastIdx = Math.min(5, Math.max(0, digits.length - 1));
  if (boxes[lastIdx]) boxes[lastIdx].focus();
}

function getEnteredOtpCode() {
  return getOtpBoxes().map(b => (b.value || '').trim()).join('');
}

function showOtpVerificationStep({ email, purpose, cooldownSeconds = 60 }) {
  const formGate = document.getElementById('form-auth-gate');
  const formOtp = document.getElementById('form-auth-otp');
  const titleEl = document.getElementById('auth-gate-title');
  const badgeEl = document.getElementById('otp-badge-label');
  const emailDisplay = document.getElementById('otp-email-display');
  const targetEmailInput = document.getElementById('otp-target-email');
  const purposeInput = document.getElementById('otp-purpose');
  const otpFeedback = document.getElementById('otp-feedback');

  if (formGate) formGate.style.display = 'none';
  if (formOtp) formOtp.style.display = 'flex';
  if (titleEl) titleEl.textContent = 'Verifique seu código';
  if (targetEmailInput) targetEmailInput.value = email || '';
  if (purposeInput) purposeInput.value = purpose || 'login';
  if (emailDisplay) emailDisplay.textContent = email || '';
  if (badgeEl) {
    badgeEl.textContent = purpose === 'register'
      ? 'Ativação de Conta (OTP)'
      : 'Autenticação em 2 Etapas (2FA)';
  }
  if (otpFeedback) otpFeedback.style.display = 'none';

  clearAndFocusOtpBoxes();
  startOtpCooldownTimer(cooldownSeconds || 60);
}

function setAuthGateMode(mode) {
  const isReg = mode === 'register';
  const formGate = document.getElementById('form-auth-gate');
  const formOtp = document.getElementById('form-auth-otp');
  const modeInput = document.getElementById('gate-mode');
  const titleEl = document.getElementById('auth-gate-title');
  const nameWrap = document.getElementById('gate-name-wrap');
  const submitLabel = document.getElementById('gate-submit-label');
  const heroTitle = document.getElementById('gate-hero-title');
  const heroSub = document.getElementById('gate-hero-sub');
  const heroBtn = document.getElementById('gate-hero-toggle-btn');
  const inlineSwitch = document.getElementById('gate-switch-inline');
  const feedback = document.getElementById('gate-feedback');

  if (formGate) formGate.style.display = 'flex';
  if (formOtp) formOtp.style.display = 'none';
  if (modeInput) modeInput.value = isReg ? 'register' : 'login';
  if (titleEl) titleEl.textContent = isReg ? 'Crie sua conta' : 'Acesse sua conta';
  if (nameWrap) nameWrap.style.display = isReg ? 'flex' : 'none';
  if (submitLabel) submitLabel.textContent = isReg ? 'CRIAR CONTA' : 'ENTRAR';
  if (heroTitle) heroTitle.textContent = isReg ? 'JÁ TEM CONTA?' : 'BEM-VINDO!';
  if (heroSub) {
    heroSub.textContent = isReg
      ? 'Entre com seu e-mail e senha para acessar seu painel financeiro sincronizado na nuvem'
      : 'Insira seus dados e comece sua jornada financeira conosco no Farol';
  }
  if (heroBtn) heroBtn.textContent = isReg ? 'FAZER LOGIN' : 'CRIAR CONTA';
  if (inlineSwitch) inlineSwitch.textContent = isReg ? 'Já tenho conta' : 'Criar conta grátis';
  if (feedback) feedback.style.display = 'none';
}

function applyAuthenticatedUser(user, serverState, remember = true) {
  cloudSessionUser = user;
  if (typeof window !== 'undefined') {
    if (remember) {
      window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    }
  }
  usersIndex.activeUserId = user.id;
  if (!usersIndex.users.some(u => u.id === user.id)) {
    usersIndex.users.push({ id: user.id, name: user.name });
  }
  saveUsersIndex();

  if (serverState && typeof serverState === 'object') {
    state = mergeDefaultCategories({ ...getDefaultState(), ...serverState });
  } else {
    state = loadStateForUser(user.id);
  }
  state.userEmail = user.email;
  if (state.profile) state.profile.name = user.name;
  saveState();
  updateAuthHeaderBadge();
  setAuthGateVisibility(false);
  renderApp();
}

function updateAuthHeaderBadge() {
  const dot = document.getElementById('auth-status-dot');
  const label = document.getElementById('auth-btn-label');
  if (!dot || !label) return;
  if (cloudSessionUser && cloudSessionUser.email) {
    dot.style.background = 'var(--green-emerald)';
    label.textContent = cloudSessionUser.name || cloudSessionUser.email.split('@')[0];
  } else {
    dot.style.background = 'var(--amber-gold)';
    label.textContent = 'Entrar / Criar Conta';
  }
}

function openAuthModal() {
  const modal = document.getElementById('modal-auth');
  if (!modal) return;
  const loggedView = document.getElementById('auth-logged-view');
  const formFields = document.getElementById('auth-form-fields');
  const logoutBtn = document.getElementById('btn-auth-logout');
  const submitBtn = document.getElementById('btn-auth-submit');
  const feedback = document.getElementById('auth-feedback');
  const loggedEmail = document.getElementById('auth-logged-email');

  if (feedback) feedback.style.display = 'none';

  if (cloudSessionUser && cloudSessionUser.email) {
    if (loggedView) loggedView.style.display = 'block';
    if (formFields) formFields.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'inline-flex';
    if (submitBtn) submitBtn.textContent = 'Sincronizar Agora';
    if (loggedEmail) loggedEmail.textContent = `${cloudSessionUser.name} (${cloudSessionUser.email})`;
  } else {
    if (loggedView) loggedView.style.display = 'none';
    if (formFields) formFields.style.display = 'block';
    if (logoutBtn) logoutBtn.style.display = 'none';
    const mode = document.getElementById('auth-mode')?.value || 'login';
    if (submitBtn) submitBtn.textContent = mode === 'register' ? 'Criar minha conta' : 'Entrar na conta';
  }

  modal.classList.add('open');
}

function bindAuthEvents() {
  // Restaura sessão lembrada localmente para não piscar caso já esteja autenticado
  if (typeof window !== 'undefined') {
    try {
      const savedUser = JSON.parse(window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY) || 'null');
      if (savedUser && savedUser.id && savedUser.email) {
        cloudSessionUser = savedUser;
        usersIndex.activeUserId = savedUser.id;
        state = loadStateForUser(savedUser.id);
        setAuthGateVisibility(false);
        updateAuthHeaderBadge();
      } else {
        setAuthGateVisibility(true);
      }
    } catch {
      setAuthGateVisibility(true);
    }
  }

  // Eventos da Tela Inicial (Auth Gate)
  const heroToggleBtn = document.getElementById('gate-hero-toggle-btn');
  if (heroToggleBtn) {
    heroToggleBtn.addEventListener('click', () => {
      const cur = document.getElementById('gate-mode')?.value || 'login';
      setAuthGateMode(cur === 'login' ? 'register' : 'login');
    });
  }

  const inlineSwitchBtn = document.getElementById('gate-switch-inline');
  if (inlineSwitchBtn) {
    inlineSwitchBtn.addEventListener('click', () => {
      const cur = document.getElementById('gate-mode')?.value || 'login';
      setAuthGateMode(cur === 'login' ? 'register' : 'login');
    });
  }

  const formGate = document.getElementById('form-auth-gate');
  if (formGate) {
    formGate.addEventListener('submit', async (e) => {
      e.preventDefault();
      const feedback = document.getElementById('gate-feedback');
      const showGateMsg = (msg, isError = false) => {
        if (!feedback) return;
        feedback.style.display = 'block';
        feedback.style.background = isError ? 'var(--coral-soft)' : 'var(--green-soft)';
        feedback.style.color = isError ? 'var(--coral-red)' : 'var(--green-emerald)';
        feedback.textContent = msg;
      };

      const action = document.getElementById('gate-mode')?.value || 'login';
      const name = document.getElementById('gate-name')?.value?.trim() || state.profile.name || 'Minha Conta';
      const email = document.getElementById('gate-email')?.value?.trim() || '';
      const password = document.getElementById('gate-password')?.value || '';
      pendingOtpRemember = Boolean(document.getElementById('gate-remember')?.checked);

      showGateMsg(action === 'register' ? 'Gerando código de verificação de cadastro...' : 'Validando credenciais e gerando código 2FA...', false);

      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, name, email, password, state })
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          showGateMsg(data.error || 'Não foi possível autenticar.', true);
          return;
        }
        if (data.step === 'verify_otp') {
          showOtpVerificationStep(data);
          return;
        }
        if (data.user) {
          applyAuthenticatedUser(data.user, data.state, pendingOtpRemember);
          showUndoToast(`Bem-vindo(a), ${data.user.name}! Conta sincronizada na nuvem.`);
        }
      } catch {
        showGateMsg('Erro de conexão com o servidor.', true);
      }
    });
  }

  // Navegação inteligente das 6 caixas de dígitos OTP (auto-advance, backspace e colar)
  const otpBoxes = getOtpBoxes();
  otpBoxes.forEach((box, idx) => {
    box.addEventListener('input', (e) => {
      const val = (e.target.value || '').replace(/\D/g, '');
      e.target.value = val.slice(-1);
      if (e.target.value && idx < otpBoxes.length - 1) {
        otpBoxes[idx + 1].focus();
        otpBoxes[idx + 1].select();
      }
    });

    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !box.value && idx > 0) {
        otpBoxes[idx - 1].focus();
        otpBoxes[idx - 1].value = '';
      }
    });

    box.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData).getData('text');
      fillOtpBoxesWithCode(pasted);
    });
  });

  const backOtpBtn = document.getElementById('btn-gate-otp-back');
  if (backOtpBtn) {
    backOtpBtn.addEventListener('click', () => {
      const curMode = document.getElementById('gate-mode')?.value || 'login';
      setAuthGateMode(curMode);
    });
  }

  const resendOtpBtn = document.getElementById('btn-gate-resend-otp');
  if (resendOtpBtn) {
    resendOtpBtn.addEventListener('click', async () => {
      const email = document.getElementById('otp-target-email')?.value || '';
      const otpFeedback = document.getElementById('otp-feedback');
      const showOtpMsg = (msg, isErr = false) => {
        if (!otpFeedback) return;
        otpFeedback.style.display = 'block';
        otpFeedback.style.background = isErr ? 'var(--coral-soft)' : 'var(--green-soft)';
        otpFeedback.style.color = isErr ? 'var(--coral-red)' : 'var(--green-emerald)';
        otpFeedback.textContent = msg;
      };
      if (!email) return;
      showOtpMsg('Enviando novo código de 6 dígitos...', false);
      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'resend_otp', email })
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          if (data.remainingCooldown) startOtpCooldownTimer(data.remainingCooldown);
          showOtpMsg(data.error || 'Aguarde antes de reenviar.', true);
          return;
        }
        showOtpVerificationStep(data);
        showOtpMsg('Novo código de 6 dígitos enviado! O anterior foi invalidado.', false);
      } catch {
        showOtpMsg('Erro ao reenviar código.', true);
      }
    });
  }

  const formOtp = document.getElementById('form-auth-otp');
  if (formOtp) {
    formOtp.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('otp-target-email')?.value || '';
      const code = getEnteredOtpCode();
      const otpFeedback = document.getElementById('otp-feedback');
      const showOtpMsg = (msg, isErr = false) => {
        if (!otpFeedback) return;
        otpFeedback.style.display = 'block';
        otpFeedback.style.background = isErr ? 'var(--coral-soft)' : 'var(--green-soft)';
        otpFeedback.style.color = isErr ? 'var(--coral-red)' : 'var(--green-emerald)';
        otpFeedback.textContent = msg;
      };

      if (code.length !== 6) {
        showOtpMsg('Preencha todos os 6 dígitos do código.', true);
        return;
      }

      showOtpMsg('Verificando código de segurança...', false);
      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'verify_otp', email, code, state })
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          showOtpMsg(data.error || 'Código inválido.', true);
          if (data.locked || data.expired) {
            clearAndFocusOtpBoxes();
          }
          return;
        }

        if (otpCooldownInterval) {
          clearInterval(otpCooldownInterval);
          otpCooldownInterval = null;
        }
        applyAuthenticatedUser(data.user, data.state, pendingOtpRemember);
        showUndoToast(`Código verificado! Bem-vindo(a), ${data.user.name}.`);
      } catch {
        showOtpMsg('Erro de rede ao validar o código.', true);
      }
    });
  }

  const openBtn = document.getElementById('btn-open-auth');
  if (openBtn) {
    openBtn.addEventListener('click', () => openAuthModal());
  }

  document.querySelectorAll('[data-auth-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.authTab;
      const modeInput = document.getElementById('auth-mode');
      const nameGroup = document.getElementById('auth-name-group');
      const submitBtn = document.getElementById('btn-auth-submit');
      const feedback = document.getElementById('auth-feedback');
      if (modeInput) modeInput.value = mode;
      document.querySelectorAll('[data-auth-tab]').forEach(b => b.classList.toggle('active', b.dataset.authTab === mode));
      if (nameGroup) nameGroup.style.display = mode === 'register' ? 'flex' : 'none';
      if (submitBtn) submitBtn.textContent = mode === 'register' ? 'Criar minha conta' : 'Entrar na conta';
      if (feedback) feedback.style.display = 'none';
    });
  });

  const logoutBtn = document.getElementById('btn-auth-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' })
      }).catch(() => {});
      cloudSessionUser = null;
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
      }
      updateAuthHeaderBadge();
      document.getElementById('modal-auth')?.classList.remove('open');
      setAuthGateVisibility(true);
    });
  }

  const formAuth = document.getElementById('form-auth');
  if (formAuth) {
    formAuth.addEventListener('submit', async (e) => {
      e.preventDefault();
      const feedback = document.getElementById('auth-feedback');
      const showMsg = (msg, isError = false) => {
        if (!feedback) return;
        feedback.style.display = 'block';
        feedback.style.background = isError ? 'var(--coral-soft)' : 'var(--green-soft)';
        feedback.style.color = isError ? 'var(--coral-red)' : 'var(--green-emerald)';
        feedback.textContent = msg;
      };

      if (cloudSessionUser && cloudSessionUser.email) {
        await syncStateToCloud();
        showMsg('Dados e contas sincronizados com sucesso no PostgreSQL!');
        return;
      }

      const action = document.getElementById('auth-mode')?.value || 'login';
      const name = document.getElementById('auth-name')?.value?.trim() || state.profile.name || 'Minha Conta';
      const email = document.getElementById('auth-email')?.value?.trim() || '';
      const password = document.getElementById('auth-password')?.value || '';

      showMsg('Conectando ao banco de dados...', false);

      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, name, email, password, state })
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          showMsg(data.error || 'Não foi possível autenticar.', true);
          return;
        }

        if (data.step === 'verify_otp') {
          document.getElementById('modal-auth')?.classList.remove('open');
          setAuthGateVisibility(true);
          showOtpVerificationStep(data);
          return;
        }

        applyAuthenticatedUser(data.user, data.state, true);
        document.getElementById('modal-auth')?.classList.remove('open');
        showUndoToast(`Conectado como ${data.user.email}. Dados salvos na nuvem!`);
      } catch {
        showMsg('Erro de conexão com o servidor.', true);
      }
    });
  }
}

let syncTimer = null;
async function syncStateToCloud() {
  try {
    await fetch('/api/state', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: usersIndex.activeUserId, state })
    });
  } catch {
    // Fallback silencioso para localStorage
  }
}

async function hydrateFromCloud() {
  try {
    // 1. Verifica se há sessão autenticada via cookie
    const authRes = await fetch('/api/auth');
    if (authRes.ok) {
      const authData = await authRes.json();
      if (authData && authData.authenticated && authData.user) {
        cloudSessionUser = authData.user;
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(authData.user));
        }
        usersIndex.activeUserId = authData.user.id;
        if (!usersIndex.users.some(u => u.id === authData.user.id)) {
          usersIndex.users.push({ id: authData.user.id, name: authData.user.name });
        }
        saveUsersIndex();
        updateAuthHeaderBadge();
        setAuthGateVisibility(false);
      } else if (!cloudSessionUser) {
        setAuthGateVisibility(true);
        return;
      }
    }

    if (!cloudSessionUser) return;

    const res = await fetch('/api/state?userId=' + encodeURIComponent(usersIndex.activeUserId));
    if (!res.ok) return;
    const data = await res.json();
    if (data && data.ok && data.state) {
      const cloudState = mergeDefaultCategories({ ...getDefaultState(), ...data.state });
      const localUpdated = Number(state?.updatedAt) || 0;
      const cloudUpdated = Number(cloudState?.updatedAt) || 0;
      if (cloudUpdated >= localUpdated) {
        state = cloudState;
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(getUserStorageKey(usersIndex.activeUserId), JSON.stringify(state));
        }
        renderApp();
      } else {
        syncStateToCloud();
      }
    } else if (data && data.ok && !data.state) {
      syncStateToCloud();
    }
  } catch {
    // Segue com cache local
  }
}