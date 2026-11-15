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

function toCents(val) {
  if (typeof val === 'number') return Math.round(val * 100);
  const cleaned = String(val || '0').replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
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
  try {
    const raw = localStorage.getItem(USERS_INDEX_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {
    activeUserId: 'user-default',
    users: [{ id: 'user-default', name: 'Meu nome' }]
  };
}

function saveUsersIndex(index) {
  localStorage.setItem(USERS_INDEX_KEY, JSON.stringify(index));
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
  const key = getUserStorageKey(usersIndex.activeUserId);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return mergeDefaultCategories({ ...getDefaultState(), ...JSON.parse(raw) });
    }
    if (usersIndex.activeUserId === 'user-default') {
      const legacyRaw = localStorage.getItem(LEGACY_V1_KEY);
      if (legacyRaw) {
        const migrated = mergeDefaultCategories(migrateLegacyV1(JSON.parse(legacyRaw)));
        localStorage.setItem(key, JSON.stringify(migrated));
        return migrated;
      }
    }
  } catch (e) {}
  return getDefaultState(
    usersIndex.users.find(u => u.id === usersIndex.activeUserId)?.name || 'Meu nome'
  );
}

function saveState() {
  const key = getUserStorageKey(usersIndex.activeUserId);
  localStorage.setItem(key, JSON.stringify(state));
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

function computeMonthMetrics(ym = state.selectedMonth) {
  const txs = getMonthTransactions(ym);
  const incomeCents = txs.filter(t => t.type === 'income').reduce((acc, t) => acc + (Number(t.amountCents) || 0), 0);
  const expenseCents = txs.filter(t => t.type === 'expense').reduce((acc, t) => acc + (Number(t.amountCents) || 0), 0);
  const partialResultCents = incomeCents - expenseCents;

  const budgetCents = Number(state.profile.monthlyBudgetCents) || 0;
  const overBudgetCents = Math.max(0, expenseCents - budgetCents);
  const daysRem = Number(state.profile.daysRemaining) || 18;
  const overPerDayCents = daysRem > 0 ? Math.round(overBudgetCents / daysRem) : overBudgetCents;

  const byCategoryMap = {};
  txs.filter(t => t.type === 'expense').forEach(t => {
    byCategoryMap[t.categoryId] = (byCategoryMap[t.categoryId] || 0) + (Number(t.amountCents) || 0);
  });

  const prevYM = addMonthsYM(ym, -1);
  const prevCatMap = {};
  getMonthTransactions(prevYM).filter(t => t.type === 'expense').forEach(t => {
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

  const reserveGoalCents = Number(state.profile.emergencyGoalCents) || 33000;
  const reserveCurrentCents = Math.max(0, totalInvestmentsCents);
  const reservePct = reserveGoalCents > 0 ? Math.min(100, Math.round((reserveCurrentCents / reserveGoalCents) * 100)) : 0;
  const reserveMonths = reserveGoalCents > 0 ? (reserveCurrentCents / (reserveGoalCents / 6)) : 0;

  return {
    txs,
    incomeCents,
    expenseCents,
    partialResultCents,
    budgetCents,
    overBudgetCents,
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
      const recMethod = (recType === 'expense' && targetAcc.type === 'Cartão de Crédito')
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

  document.getElementById('page-title').textContent = tabTitles[state.currentTab] || 'Visão geral';
  document.getElementById('page-subtitle').textContent =
    `${fmtMonthLabel(state.selectedMonth)} · ${state.profile.daysRemaining} dias restantes`;

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
  const lineChartSvg = buildMonthlySpendSvg(m.expenseCents, m.txs);
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
    const dailyAvgCents = Math.round(m.expenseCents / 12);
    accumulatedMainVal = `${fmtBRL(dailyAvgCents)} / dia`;
    accumulatedTitle = 'Média diária até o dia 12';
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
              <span>dia 7</span>
              <span>dia 12</span>
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
        <div class="vs-prev">vs R$ 0,00 mês anterior</div>

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
          <svg width="100%" height="46" viewBox="0 0 280 46" preserveAspectRatio="none">
            <defs>
              <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#38b6ff" stop-opacity="0.24"/>
                <stop offset="100%" stop-color="#38b6ff" stop-opacity="0.0"/>
              </linearGradient>
            </defs>
            <path d="M 4 14 L 210 14 Q 235 14 252 24 L 274 37 L 274 44 L 4 44 Z" fill="url(#invGrad)" />
            <path d="M 4 14 L 210 14 Q 235 14 252 24 L 274 37" fill="none" stroke="#49b6eb" stroke-width="2" stroke-linecap="round"/>
            <circle cx="274" cy="37" r="3.5" fill="#f59e0b" stroke="#14222b" stroke-width="1.5"/>
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
          ${buildAccumulatedAreaSvg(m.expenseCents, state.accumulatedSubTab, m.partialResultCents)}
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

  // Total de faturas em aberto no mês (respeitando fechamento)
  let totalFaturasOpenCents = 0;
  state.accounts.forEach(acc => {
    const meta = getInvoiceMeta(acc.id);
    if (meta.status === 'paid') return;
    const txSum = state.transactions
      .filter(t => t.accountId === acc.id && t.type === 'expense' && getInvoiceMonthForTransaction(t, acc) === state.selectedMonth)
      .reduce((s, t) => s + (Number(t.amountCents) || 0), 0);
    totalFaturasOpenCents += Math.max(0, txSum + (Number(meta.adjustmentCents) || 0));
  });
  const saldoAposPagamentoCents = m.incomeCents - m.expenseCents - totalFaturasOpenCents;

  // Meta prioritária em destaque
  const topGoal = state.goals[1] || state.goals[0];
  const goalHtml = !topGoal
    ? `<div class="vs-prev">Crie uma meta na aba Metas.</div>`
    : (() => {
        const pct = topGoal.targetCents > 0 ? Math.min(100, Math.round((topGoal.currentCents / topGoal.targetCents) * 100)) : 0;
        return `
          <div class="goal-highlight-box">
            <span class="goal-priority-pill">Prioridade</span>
            <div style="font-size:16px; font-weight:700; color:#fff;">${topGoal.title}</div>
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

  document.querySelectorAll('[data-tip-title]').forEach(el => {
    el.addEventListener('mouseenter', (e) => {
      const title = el.dataset.tipTitle || '';
      const val = el.dataset.tipVal || '';
      const hidden = state.privacyMode ? '•••' : val;
      tip.innerHTML = `<div class="tooltip-title">${title}</div><div class="tooltip-value">${hidden}</div>`;
      tip.classList.add('visible');
      tip.style.left = `${e.clientX}px`;
      tip.style.top = `${e.clientY - 8}px`;
    });
    el.addEventListener('mousemove', (e) => {
      tip.style.left = `${e.clientX}px`;
      tip.style.top = `${e.clientY - 8}px`;
    });
    el.addEventListener('mouseleave', hideTip);
  });
}

function buildMonthlySpendSvg(expenseCents, txs = []) {
  const hasSpend = expenseCents > 0;
  const pathLine = hasSpend
    ? 'M 4 56 L 145 56 C 160 56, 168 16, 182 16 L 288 16'
    : 'M 4 56 L 288 56';
  const pathArea = hasSpend
    ? 'M 4 56 L 145 56 C 160 56, 168 16, 182 16 L 288 16 L 288 68 L 4 68 Z'
    : 'M 4 56 L 288 56 L 288 68 L 4 68 Z';
  const endY = hasSpend ? 16 : 56;

  const days = Array.from({ length: 12 }, (_, i) => i + 1);
  const zones = days.map((day, idx) => {
    const x = idx * (296 / 12);
    const w = 296 / 12;
    const cumCents = txs
      .filter(t => t.type === 'expense' && parseInt((t.date || '').split('-')[2] || '12', 10) <= day)
      .reduce((s, t) => s + (Number(t.amountCents) || 0), 0);
    return `<rect x="${x.toFixed(1)}" y="0" width="${w.toFixed(1)}" height="72" fill="transparent"
      class="chart-hover-zone"
      data-tip-title="Dia ${day} (acumulado)"
      data-tip-val="${fmtBRL(cumCents)}" />`;
  }).join('');

  return `
    <svg width="100%" height="76" viewBox="0 0 296 72" preserveAspectRatio="none">
      <defs>
        <linearGradient id="coralArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#f16364" stop-opacity="0.28"/>
          <stop offset="100%" stop-color="#f16364" stop-opacity="0.02"/>
        </linearGradient>
      </defs>
      <line x1="0" y1="16" x2="296" y2="16" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
      <line x1="0" y1="36" x2="296" y2="36" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
      <line x1="0" y1="56" x2="296" y2="56" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
      <path d="${pathArea}" fill="url(#coralArea)"/>
      <path d="${pathLine}" fill="none" stroke="#f16364" stroke-width="2.3" stroke-linecap="round"/>
      <circle cx="288" cy="${endY}" r="4.5" fill="#f59e0b" stroke="#ffffff" stroke-width="1.5"/>
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

function buildAccumulatedAreaSvg(expenseCents, mode, partialResultCents = 0) {
  const color = mode === 'saldo' ? '#49b6eb' : '#f16364';
  const targetCents = mode === 'saldo' ? partialResultCents : mode === 'por-dia' ? Math.round(expenseCents / 12) : expenseCents;
  const labelPrefix = mode === 'saldo' ? 'Saldo' : mode === 'por-dia' ? 'Média/dia' : 'Acumulado';

  const points = [
    { x: 0, w: 140, title: `Dia 1–3 (${labelPrefix})`, valCents: 0 },
    { x: 140, w: 140, title: `Dia 4–6 (${labelPrefix})`, valCents: 0 },
    { x: 280, w: 140, title: `Dia 7–9 (${labelPrefix})`, valCents: Math.round(targetCents * 0.65) },
    { x: 420, w: 140, title: `Dia 10–12 (${labelPrefix})`, valCents: targetCents }
  ];

  const hoverZones = points.map(p => `
    <rect x="${p.x}" y="0" width="${p.w}" height="52" fill="transparent"
      class="chart-hover-zone"
      data-tip-title="${p.title}"
      data-tip-val="${fmtBRL(p.valCents)}" />
  `).join('');

  return `
    <svg width="100%" height="56" viewBox="0 0 560 52" preserveAspectRatio="none">
      <line x1="0" y1="44" x2="560" y2="44" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
      <path d="M 0 42 L 260 42 C 300 42, 320 14, 360 14 L 555 14" fill="none" stroke="${color}" stroke-width="2.2"/>
      <circle cx="555" cy="14" r="4" fill="#f59e0b" stroke="#fff" stroke-width="1.2"/>
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
            <td style="text-align:right;">
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
        <button class="btn-primary" id="btn-new-tx-page">+ Lançamento Rápido</button>
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
  `;
}

function bindTransacoesEvents() {
  const newBtn = document.getElementById('btn-new-tx-page');
  if (newBtn) newBtn.addEventListener('click', () => openTransactionModal());

  const searchInput = document.getElementById('filter-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      txFilter.search = e.target.value;
      renderApp();
      const el = document.getElementById('filter-search');
      if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
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
  `;
}

function bindRecorrenciasEvents() {
  document.querySelectorAll('[data-toggle-rec]').forEach(btn => {
    btn.addEventListener('click', () => {
      const rec = state.recurrences.find(r => r.id === btn.dataset.toggleRec);
      if (!rec) return;
      rec.active = !rec.active;
      saveState();
      renderApp();
    });
  });

  document.querySelectorAll('[data-edit-rec]').forEach(btn => {
    btn.addEventListener('click', () => openRecurrenceModal(btn.dataset.editRec));
  });

  document.querySelectorAll('[data-del-rec]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.recurrences = state.recurrences.filter(r => r.id !== btn.dataset.delRec);
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
      <line x1="${padL}" y1="${y}" x2="${svgW - padR}" y2="${y}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
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
    <svg width="100%" height="215" viewBox="0 0 ${svgW} ${svgH}" preserveAspectRatio="none">
      ${gridLines}
      ${svgBars}
    </svg>
    <div style="display:grid; grid-template-columns:repeat(6, 1fr); gap:8px; margin-top:12px; padding-top:12px; border-top:1px solid var(--border-subtle); text-align:center;">
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

    <div class="faturas-summary-grid" style="grid-template-columns: repeat(4, minmax(0, 1fr));">
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

    <div class="dashboard-row-2" style="grid-template-columns: 1.25fr 1fr; gap: 22px;">
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
    // Regra de fechamento: filtra todas as despesas deste cartão cuja fatura cai em state.selectedMonth
    const accTxs = state.transactions.filter(t => {
      if (t.accountId !== acc.id || t.type !== 'expense') return false;
      return getInvoiceMonthForTransaction(t, acc) === state.selectedMonth;
    }).sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    const txSpentCents = accTxs.reduce((s, t) => s + (Number(t.amountCents) || 0), 0);
    const meta = getInvoiceMeta(acc.id);
    const spentCents = Math.max(0, txSpentCents + (Number(meta.adjustmentCents) || 0));
    const limitCents = Number(acc.limitCents) || 200000;
    const availableCents = Math.max(0, limitCents - spentCents);
    const pct = limitCents > 0 ? Math.min(100, Math.round((spentCents / limitCents) * 100)) : 0;

    totalFaturasCents += spentCents;
    totalLimiteCents += limitCents;
    if (meta.status !== 'paid') totalOpenCents += spentCents;

    const barColor = pct >= 85 ? 'var(--coral-red)' : pct >= 60 ? 'var(--amber-gold)' : 'var(--cyan-accent)';
    const barWidth = spentCents > 0 ? Math.max(2, pct) : 0;
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
              <span class="cat-pct-badge">${pct}% do limite</span>
            </div>
            <div class="cat-progress-track" style="margin-top:10px;">
              <div class="cat-progress-fill" style="width:${barWidth}%; background:${barColor};"></div>
            </div>
            <div class="fatura-meta-row">
              <span class="sensitive-val">Disponível: <b>${fmtBRL(availableCents)}</b></span>
              <span class="sensitive-val">Limite: ${fmtBRL(limitCents)}</span>
            </div>
          </div>
        </div>

        <div class="fatura-tx-preview" style="max-height:130px; overflow-y:auto;">
          ${invoiceItems}
        </div>

        <div class="fatura-card-actions">
          <button class="btn-secondary" data-add-tx-account="${acc.id}">+ Lançar na fatura</button>
          <button class="btn-primary" data-toggle-paid-invoice="${acc.id}" style="padding:7px 14px; font-size:12px;">
            ${meta.status === 'paid' ? 'Reabrir Fatura' : 'Marcar como Paga'}
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
      <button class="btn-primary" id="btn-new-invoice-card">+ Novo Cartão / Fatura</button>
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

  document.querySelectorAll('[data-toggle-paid-invoice]').forEach(btn => {
    btn.addEventListener('click', () => {
      const accId = btn.dataset.togglePaidInvoice;
      const meta = getInvoiceMeta(accId);
      setInvoiceMeta(accId, { status: meta.status === 'paid' ? 'open' : 'paid' });
      saveState();
      renderApp();
    });
  });

  const btnNewCard = document.getElementById('btn-new-invoice-card');
  if (btnNewCard) btnNewCard.addEventListener('click', () => openInvoiceModal(null));
}

function openInvoiceModal(accountId) {
  const isNew = !accountId;
  const acc = isNew
    ? { id: '', name: '', limitCents: 300000, closingDay: 5, dueDay: 12 }
    : state.accounts.find(a => a.id === accountId);

  if (!acc) return;
  const meta = isNew ? { status: 'open', adjustmentCents: 0 } : getInvoiceMeta(acc.id);

  document.getElementById('modal-inv-title').textContent = isNew ? 'Novo Cartão / Fatura' : `Editar Fatura — ${acc.name}`;
  document.getElementById('inv-account-id').value = acc.id;
  document.getElementById('inv-name').value = acc.name;
  document.getElementById('inv-status').value = meta.status || 'open';
  document.getElementById('inv-limit').value = fromCents(acc.limitCents || 200000).toFixed(2);
  document.getElementById('inv-manual-adj').value = fromCents(meta.adjustmentCents || 0).toFixed(2);
  document.getElementById('inv-closing-day').value = acc.closingDay || 5;
  document.getElementById('inv-due-day').value = acc.dueDay || 12;

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
            saveState();
            renderApp();
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
              +${fmtBRL(monthlyYieldCents)}/mês
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
        <span style="font-size:11.5px; color:var(--text-muted);">Atalhos p/ 1º CDB:</span>
        <button class="btn-secondary" data-preset-cdb="100" style="padding:5px 10px; font-size:11.5px;">100% CDI</button>
        <button class="btn-secondary" data-preset-cdb="105" style="padding:5px 10px; font-size:11.5px;">105% CDI</button>
        <button class="btn-secondary" data-preset-cdb="110" style="padding:5px 10px; font-size:11.5px;">110% CDI</button>
        <button class="btn-secondary" data-preset-cdb="120" style="padding:5px 10px; font-size:11.5px;">120% CDI</button>
      </div>
    </div>

    <div class="faturas-summary-grid">
      <div class="card">
        <div class="card-title">Patrimônio Investido</div>
        <div class="partial-value sensitive-val" style="font-size:24px; margin-top:8px;">${fmtBRL(m.totalInvestmentsCents)}</div>
        <div class="vs-prev sensitive-val">Variação na semana: ${fmtBRL(m.weeklyInvDeltaCents, true)}</div>
      </div>
      <div class="card">
        <div class="card-title">Rendimento Estimado (Bruto)</div>
        <div class="partial-value positive sensitive-val" style="font-size:24px; margin-top:8px;">+${fmtBRL(totalMonthlyYieldCents)}<span style="font-size:13px; font-weight:400; color:var(--text-secondary);"> / mês</span></div>
        <div class="vs-prev sensitive-val">Projeção anual: +${fmtBRL(totalAnnualYieldCents)} / ano</div>
      </div>
      <div class="card">
        <div class="card-title">Alocação da Carteira</div>
        <div class="alloc-bar-track">${allocSegments}</div>
        <div class="alloc-legend">${allocLegend}</div>
      </div>
    </div>

    <div class="card">
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
  `;
}

function openAssetModal(assetId) {
  const isNew = !assetId;
  const asset = isNew
    ? { id: '', name: '', category: 'Renda Fixa (CDB)', amountCents: 0, cdbPercent: 100, institution: '', liquidity: 'Diária' }
    : state.assets.find(a => a.id === assetId);

  if (!asset) return;

  document.getElementById('modal-asset-title').textContent = isNew ? 'Novo Ativo / Investimento' : `Editar Ativo — ${asset.name}`;
  document.getElementById('ast-id').value = asset.id;
  document.getElementById('ast-name').value = asset.name;
  document.getElementById('ast-category').value = asset.category === 'Renda Fixa' ? 'Renda Fixa (CDB)' : (asset.category || 'Renda Fixa (CDB)');
  document.getElementById('ast-amount').value = fromCents(asset.amountCents || 0).toFixed(2);
  document.getElementById('ast-cdb-pct').value = asset.cdbPercent ?? 100;
  document.getElementById('ast-institution').value = asset.institution || '';
  document.getElementById('ast-liquidity').value = asset.liquidity || 'Diária';
  document.getElementById('ast-promo-cap').value = asset.promoCapCents > 0 ? fromCents(asset.promoCapCents).toFixed(2) : '';
  document.getElementById('ast-excess-pct').value = asset.excessCdbPercent !== undefined ? asset.excessCdbPercent : 100;

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

  document.querySelectorAll('[data-preset-cdb]').forEach(btn => {
    btn.addEventListener('click', () => {
      const pct = Number(btn.dataset.presetCdb);
      if (state.assets.length > 0) {
        state.assets[0].cdbPercent = pct;
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
            saveState();
            renderApp();
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

function renderProjecaoView() {
  const shortMonths = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const salaryCents = Number(state.profile.monthlySalaryCents) || 0;
  const fixedRecOutCents = state.recurrences
    .filter(r => r.active && r.type !== 'income')
    .reduce((s, r) => s + (Number(r.amountCents) || 0), 0);
  const goalMonthlyDeductionCents = projState.deductGoals
    ? Math.round(state.goals.reduce((s, g) => s + Math.max(0, (Number(g.targetCents) - Number(g.currentCents)) / 12), 0))
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

    // Para o mês atual usa o realizado + salário/recorrências; para futuros projeta salário + parcelas já lançadas + recorrências ativas
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
  const activeDetail = series[Math.min(projState.selectedIdx, series.length - 1)] || series[0];

  // Parcelamentos terminando nos próximos meses
  const endingInstallments = state.transactions.filter(t => /\(\d+\/\d+\)/.test(t.description || ''));
  let endingMsg = 'Nenhum parcelamento ativo no cartão para encerrar nos próximos meses.';
  if (endingInstallments.length > 0) {
    const totalReleasedCents = endingInstallments.reduce((s, t) => s + (Number(t.amountCents) || 0), 0);
    endingMsg = `${fmtBRL(totalReleasedCents)} em parcelas mapeadas nos próximos meses.`;
  }
  const bannerSlides = [
    { title: 'Parcelamentos terminando', desc: endingMsg },
    { title: 'Impacto das Recorrências', desc: `Suas despesas recorrentes ativas somam ${fmtBRL(fixedRecOutCents)}/mês frente ao salário de ${fmtBRL(salaryCents)}/mês.` }
  ];
  const currentBanner = bannerSlides[projState.bannerIdx % bannerSlides.length];

  // Gráfico Combo SVG (Barras Resultado Líquido + Linha Saldo Projetado)
  const svgW = 840;
  const svgH = 220;
  const padL = 54;
  const padR = 24;
  const padT = 20;
  const padB = 30;
  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;

  const allVals = series.flatMap(s => [s.endBalCents, s.netCents, 0]);
  const maxVal = Math.max(10000, ...allVals);
  const minVal = Math.min(0, ...allVals);
  const span = Math.max(1, maxVal - minVal);
  const toY = (v) => padT + chartH - ((v - minVal) / span) * chartH;
  const zeroY = toY(0);

  const stepX = chartW / Math.max(1, series.length);
  const barW = Math.min(28, stepX * 0.42);

  const barsAndDots = series.map((s, idx) => {
    const cx = padL + stepX * idx + stepX / 2;
    const yNet = toY(s.netCents);
    const barY = Math.min(yNet, zeroY);
    const barH = Math.max(3, Math.abs(zeroY - yNet));
    const barColor = s.netCents >= 0 ? '#34d399' : '#f16364';
    const yBal = toY(s.endBalCents);

    return `
      <rect x="${(cx - barW / 2).toFixed(1)}" y="${barY.toFixed(1)}" width="${barW.toFixed(1)}" height="${barH.toFixed(1)}" rx="5" fill="${barColor}" opacity="0.78"
        class="chart-hover-zone" data-proj-select="${idx}"
        data-tip-title="${s.label} · Saldo: ${fmtBRL(s.endBalCents)}"
        data-tip-val="Líquido: ${fmtBRL(s.netCents, true)}" />
      <circle cx="${cx.toFixed(1)}" cy="${yBal.toFixed(1)}" r="${idx === projState.selectedIdx ? 5.5 : 4}" fill="#49b6eb" stroke="#ffffff" stroke-width="1.5"
        class="chart-hover-zone" data-proj-select="${idx}"
        data-tip-title="${s.label} · Saldo Projetado"
        data-tip-val="${fmtBRL(s.endBalCents)}" />
      <text x="${cx.toFixed(1)}" y="${svgH - 8}" text-anchor="middle" fill="#8fa3b0" font-size="11">${s.label}</text>
    `;
  }).join('');

  const linePoints = series.map((s, idx) => {
    const cx = padL + stepX * idx + stepX / 2;
    return `${cx.toFixed(1)},${toY(s.endBalCents).toFixed(1)}`;
  }).join(' ');

  return `
    <div class="card" style="margin-bottom:18px;">
      <div class="section-toolbar" style="margin-bottom:12px;">
        <div>
          <div style="font-size:11px; font-weight:700; letter-spacing:0.06em; color:var(--text-muted);">SALDO PROJETADO</div>
          <div style="display:flex; align-items:center; gap:12px; margin-top:4px; flex-wrap:wrap;">
            <span class="big-currency sensitive-val" style="font-size:30px;">${fmtBRL(finalBalanceCents)}</span>
            <span class="badge-type ${periodDeltaCents >= 0 ? 'income' : 'expense'} sensitive-val">
              ${fmtBRL(periodDeltaCents, true)} no período
            </span>
          </div>
        </div>
        <div class="segmented-tabs">
          <button class="seg-btn ${horizon === 3 ? 'active' : ''}" data-proj-horizon="3">3M</button>
          <button class="seg-btn ${horizon === 6 ? 'active' : ''}" data-proj-horizon="6">6M</button>
          <button class="seg-btn ${horizon === 12 ? 'active' : ''}" data-proj-horizon="12">12M</button>
        </div>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:16px; font-size:11.5px; color:var(--text-secondary); margin-bottom:6px;">
        <span style="display:inline-flex; align-items:center; gap:6px;"><span class="cat-dot" style="background:#34d399;"></span>Resultado Líquido</span>
        <span style="display:inline-flex; align-items:center; gap:6px;"><span class="cat-dot" style="background:#49b6eb;"></span>Saldo Projetado</span>
      </div>

      <svg width="100%" height="225" viewBox="0 0 ${svgW} ${svgH}" preserveAspectRatio="none">
        <line x1="${padL}" y1="${zeroY.toFixed(1)}" x2="${svgW - padR}" y2="${zeroY.toFixed(1)}" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
        <text x="6" y="${toY(maxVal) + 4}" fill="#5e7482" font-size="10.5">${fmtBRL(maxVal)}</text>
        <text x="6" y="${zeroY + 4}" fill="#5e7482" font-size="10.5">R$ 0</text>
        <polyline fill="none" stroke="#49b6eb" stroke-width="2.5" points="${linePoints}" />
        ${barsAndDots}
      </svg>
    </div>

    <div class="proj-banner-blue" style="margin-bottom:18px;">
      <div>
        <div style="font-size:13px; font-weight:700; margin-bottom:4px;">👁 ${currentBanner.title}</div>
        <div class="sensitive-val" style="font-size:13.5px; opacity:0.95;">${currentBanner.desc}</div>
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
        <button class="icon-circle-btn" id="btn-proj-prev" style="width:30px; height:30px; background:rgba(255,255,255,0.18); border:none; color:#fff;">‹</button>
        <button class="icon-circle-btn" id="btn-proj-next" style="width:30px; height:30px; background:rgba(255,255,255,0.18); border:none; color:#fff;">›</button>
      </div>
    </div>

    <div class="card">
      <div class="card-header-row" style="margin-bottom:8px;">
        <span class="card-title" style="font-size:13px; font-weight:700; letter-spacing:0.04em;">DETALHAMENTO DO MÊS</span>
        <span class="badge-pill-dark">${activeDetail.label} (${activeDetail.ym})</span>
      </div>

      <div class="proj-detail-row">
        <span>Saldo Inicial</span>
        <b class="sensitive-val">${fmtBRL(activeDetail.startBalCents)}</b>
      </div>
      <div class="proj-detail-row">
        <span>RECEITAS</span>
        <b class="sensitive-val" style="color:var(--green-emerald);">+${fmtBRL(activeDetail.revCents)}</b>
      </div>
      <div class="proj-detail-row">
        <span>GASTOS</span>
        <b class="sensitive-val" style="color:var(--coral-red);">-${fmtBRL(activeDetail.expCents)}</b>
      </div>
      <div class="proj-detail-row">
        <div>
          <div style="font-weight:600;">Metas</div>
          <div style="font-size:11.5px; color:var(--text-muted);">Guardar para metas reduz o saldo projetado</div>
        </div>
        <div style="display:flex; align-items:center; gap:12px;">
          <b class="sensitive-val" style="color:#a78bfa;">-${fmtBRL(activeDetail.goalsCents)}</b>
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
  if (prevBtn) prevBtn.addEventListener('click', () => { projState.bannerIdx = Math.abs(projState.bannerIdx - 1); renderApp(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { projState.bannerIdx += 1; renderApp(); });

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
        <div class="card-header-row">
          <span style="font-weight:600;">${a.name}</span>
          <span class="cat-pct-badge">${a.type}</span>
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
      <h3 class="card-title" style="font-size:16px;">Minhas Contas & Cartões</h3>
      <button class="btn-primary" id="btn-new-account">+ Adicionar Conta</button>
    </div>
    <div class="cards-grid-3">${cards}</div>
  `;
}

function bindContasEvents() {
  const btn = document.getElementById('btn-new-account');
  if (btn) {
    btn.addEventListener('click', () => openAccountModal());
  }
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

function openTransactionModal(preselectedAccountId = null) {
  manualCategoryPicked = false;
  const accSelect = document.getElementById('tx-account');
  accSelect.innerHTML = state.accounts
    .map(a => `<option value="${a.id}">${a.name}</option>`)
    .join('');

  const targetAccId = preselectedAccountId || state.lastUsedAccountId || state.accounts[0]?.id;
  if (targetAccId && state.accounts.some(a => a.id === targetAccId)) {
    accSelect.value = targetAccId;
  }

  const targetAcc = getAccountById(accSelect.value);
  if (preselectedAccountId || targetAcc.type === 'Cartão de Crédito') {
    document.getElementById('tx-method').value = 'Cartão de Crédito';
  } else {
    document.getElementById('tx-method').value = 'Conta Corrente / Pix';
  }

  renderQuickCategoryChips(null);

  document.getElementById('tx-type').value = 'expense';
  document.getElementById('tx-installments').value = '1';
  document.getElementById('tx-date').value = getTodayISO();
  document.getElementById('tx-amount').value = '';
  document.getElementById('tx-desc').value = '';
  document.getElementById('tx-tag').value = '';
  document.getElementById('tx-is-recurring').checked = false;
  document.getElementById('quick-more-details').open = false;

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
  if (farolInitialized) return;
  farolInitialized = true;
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      state.currentTab = btn.dataset.tab;
      saveState();
      renderApp();
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

    if (installments > 1) {
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
          const recMethod = (type === 'expense' && targetAcc.type === 'Cartão de Crédito')
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

  // Salvar Nova Conta / Cartão
  const accTypeSelect = document.getElementById('acc-type');
  const accCardRow = document.getElementById('acc-card-dates-row');
  if (accTypeSelect && accCardRow) {
    accTypeSelect.addEventListener('change', () => {
      accCardRow.style.display = accTypeSelect.value === 'Cartão de Crédito' ? 'grid' : 'none';
    });
  }

  const formAcc = document.getElementById('form-account');
  if (formAcc) {
    formAcc.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('acc-name').value.trim();
      if (!name) return;
      const type = document.getElementById('acc-type').value;
      const balCents = toCents(document.getElementById('acc-balance').value);
      const limitCents = toCents(document.getElementById('acc-limit').value) || 300000;
      const closingDay = Math.min(31, Math.max(1, parseInt(document.getElementById('acc-closing-day').value, 10) || 5));
      const dueDay = Math.min(31, Math.max(1, parseInt(document.getElementById('acc-due-day').value, 10) || 12));

      state.accounts.push({
        id: 'acc-' + Date.now(),
        name,
        type,
        initialBalanceCents: balCents,
        limitCents,
        closingDay,
        dueDay
      });
      saveState();
      document.getElementById('modal-account').classList.remove('open');
      renderApp();
    });
  }

  renderApp();
  hydrateFromCloud();
}

// ============================================================
// MODAIS AUXILIARES: RECORRÊNCIA, CONTA & DIÁLOGO ESTILIZADO
// ============================================================
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
  document.getElementById('modal-rec-title').textContent = rec ? 'Editar Recorrência' : 'Nova Recorrência';
  document.getElementById('rec-id').value = rec ? rec.id : '';
  document.getElementById('rec-desc').value = rec ? rec.description : '';
  document.getElementById('rec-amount').value = rec ? fromCents(rec.amountCents).toFixed(2) : '';
  document.getElementById('rec-day').value = rec ? String(rec.day) : '10';
  document.getElementById('rec-type').value = rec ? (rec.type || 'expense') : 'expense';
  if (rec && catSelect && rec.categoryId) {
    catSelect.value = rec.categoryId;
  }
  document.getElementById('modal-recurrence').classList.add('open');
  setTimeout(() => document.getElementById('rec-desc').focus(), 40);
}

function openAccountModal() {
  document.getElementById('acc-name').value = '';
  document.getElementById('acc-type').value = 'Conta Corrente';
  document.getElementById('acc-balance').value = '0.00';
  document.getElementById('acc-limit').value = '3000.00';
  document.getElementById('acc-closing-day').value = '5';
  document.getElementById('acc-due-day').value = '12';
  const cardRow = document.getElementById('acc-card-dates-row');
  if (cardRow) cardRow.style.display = 'none';
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
// SINCRONIZAÇÃO POSTGRESQL (VERCEL) & OPEN FINANCE
// ============================================================
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
    const res = await fetch('/api/state?userId=' + encodeURIComponent(usersIndex.activeUserId));
    if (!res.ok) return;
    const data = await res.json();
    if (data && data.ok && data.state) {
      state = data.state;
      localStorage.setItem(getUserStorageKey(usersIndex.activeUserId), JSON.stringify(state));
      renderApp();
    }
  } catch {
    // Segue com cache local
  }
}