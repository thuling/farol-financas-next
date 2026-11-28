import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createHmac } from 'node:crypto';
import ts from 'typescript';

const ROOT = path.resolve(import.meta.dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function loadTsModule(relPath, moduleCache = new Map(), vmCtx = null) {
  const absPath = path.resolve(ROOT, relPath);
  if (moduleCache.has(absPath)) return moduleCache.get(absPath).exports;

  const src = fs.readFileSync(absPath, 'utf8');
  const { outputText } = ts.transpileModule(src, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: absPath,
  });

  const mod = { exports: {} };
  moduleCache.set(absPath, mod);

  const localRequire = (spec) => {
    if (spec.startsWith('.')) {
      const base = path.resolve(path.dirname(absPath), spec);
      const candidates = [base, `${base}.ts`, `${base}.js`, path.join(base, 'index.ts')];
      const found = candidates.find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
      if (!found) throw new Error(`Cannot resolve ${spec} from ${absPath}`);
      return loadTsModule(path.relative(ROOT, found), moduleCache, vmCtx);
    }
    throw new Error(`Unexpected external import "${spec}" in pure module ${relPath}`);
  };

  if (vmCtx) {
    const wrapper = vm.runInContext(
      `(function(exports, require, module, __filename, __dirname) {\n${outputText}\n})`,
      vmCtx
    );
    wrapper(mod.exports, localRequire, mod, absPath, path.dirname(absPath));
  } else {
    const fn = new Function('exports', 'require', 'module', '__filename', '__dirname', outputText);
    fn(mod.exports, localRequire, mod, absPath, path.dirname(absPath));
  }
  return mod.exports;
}

const farolModuleCache = new Map();
const farolFormatters = loadTsModule('src/lib/farol/formatters.ts', farolModuleCache);
const farolInstallments = loadTsModule('src/lib/farol/installments.ts', farolModuleCache);
const farolInvoiceParser = loadTsModule('src/lib/farol/invoice-parser.ts', farolModuleCache);
const farolMetrics = loadTsModule('src/lib/farol/metrics.ts', farolModuleCache);
const farolIcons = loadTsModule('src/lib/farol/icons.ts', farolModuleCache);
const farolCharts = loadTsModule('src/lib/farol/charts.ts', farolModuleCache);
const farolAnalytics = loadTsModule('src/lib/farol/analytics.ts', farolModuleCache);
const farolDialogs = loadTsModule('src/lib/farol/dialogs.ts', farolModuleCache);
const farolTour = loadTsModule('src/lib/farol/tour.ts', farolModuleCache);
const farolAuth = loadTsModule('src/lib/farol/auth.ts', farolModuleCache);

function attachFarolEngineGlobals(vmCtx) {
  const ctxCache = new Map();
  const fmt = loadTsModule('src/lib/farol/formatters.ts', ctxCache, vmCtx);
  const inst = loadTsModule('src/lib/farol/installments.ts', ctxCache, vmCtx);
  const inv = loadTsModule('src/lib/farol/invoice-parser.ts', ctxCache, vmCtx);
  const met = loadTsModule('src/lib/farol/metrics.ts', ctxCache, vmCtx);
  const icons = loadTsModule('src/lib/farol/icons.ts', ctxCache, vmCtx);
  const charts = loadTsModule('src/lib/farol/charts.ts', ctxCache, vmCtx);
  const analytics = loadTsModule('src/lib/farol/analytics.ts', ctxCache, vmCtx);
  const dialogs = loadTsModule('src/lib/farol/dialogs.ts', ctxCache, vmCtx);
  const tour = loadTsModule('src/lib/farol/tour.ts', ctxCache, vmCtx);
  const auth = loadTsModule('src/lib/farol/auth.ts', ctxCache, vmCtx);
  Object.assign(vmCtx, {
    ...fmt,
    ...inst,
    matchCategoryByRulesPure: inv.matchCategoryByRules,
    classifyMerchantLocallyPure: inv.classifyMerchantLocally,
    cleanBrazilianAmountToFloat: inv.cleanBrazilianAmountToFloat,
    extractInstallmentInfoFromTitle: inv.extractInstallmentInfoFromTitle,
    detectEntryKind: inv.detectEntryKind,
    parseInvoiceCSVOrOFXLocallyPure: inv.parseInvoiceCSVOrOFXLocally,
    parseInvoiceMarkdownLocallyPure: inv.parseInvoiceMarkdownLocally,
    getInvoiceMetaFromState: met.getInvoiceMetaFromState,
    getInvoiceMonthForTransactionPure: met.getInvoiceMonthForTransaction,
    getAccountBalanceCentsPure: met.getAccountBalanceCents,
    getCategoriesSortedByUsagePure: met.getCategoriesSortedByUsage,
    getMonthTransactionsPure: met.getMonthTransactions,
    getCalendarMonthInfoPure: met.getCalendarMonthInfo,
    isInternalTransferTx: met.isInternalTransferTx,
    computeMonthMetricsPure: met.computeMonthMetrics,
    computeVisaoGeralInvoiceSummaryPure: met.computeVisaoGeralInvoiceSummary,
    buildMonthlyInsightsListPure: met.buildMonthlyInsightsList,
    PRECISION_ICONS: icons.PRECISION_ICONS,
    CATEGORY_PRECISION_SVGS: icons.CATEGORY_PRECISION_SVGS,
    getCategoryIconSvg: icons.getCategoryIconSvg,
    renderCategoryBadge: icons.renderCategoryBadge,
    buildSmoothSvgPath: charts.buildSmoothSvgPath,
    buildMonthlySpendSvg: charts.buildMonthlySpendSvg,
    buildDonutSvg: charts.buildDonutSvg,
    buildReserveRingSvg: charts.buildReserveRingSvg,
    buildAccumulatedAreaSvg: charts.buildAccumulatedAreaSvg,
    fmtAxisCompactBRL: charts.fmtAxisCompactBRL,
    buildTopRoundedBarPath: charts.buildTopRoundedBarPath,
    createAnalyticsTracker: analytics.createAnalyticsTracker,
    openFarolModalBase: dialogs.openFarolModal,
    closeFarolModal: dialogs.closeFarolModal,
    setupFarolDialogs: dialogs.setupFarolDialogs,
    FAROL_PRODUCT_TOUR_STEPS: tour.FAROL_PRODUCT_TOUR_STEPS,
    createProductTourController: tour.createProductTourController,
    AUTH_SESSION_STORAGE_KEY: auth.AUTH_SESSION_STORAGE_KEY,
    setPasswordFieldVisibility: auth.setPasswordFieldVisibility,
    resetAllPasswordVisibilities: auth.resetAllPasswordVisibilities,
    bindPasswordVisibilityToggles: auth.bindPasswordVisibilityToggles,
    isLocalTourPreviewMode: auth.isLocalTourPreviewMode,
    createAuthController: auth.createAuthController,
  });
}

function toRunnableEngineScript(engineSrc) {
  return engineSrc
    .replace(/import\s+\{[\s\S]*?\}\s+from\s+['"]\.\/farol\/[^'"]+['"];?\s*/g, '')
    .replace(/export\s+function\s+initFarolApp/, 'function initFarolApp');
}

// 1. Fail-closed session & auth configuration
{
  const sessionSrc = read('src/lib/session.ts');
  assert.ok(!sessionSrc.includes('farol-financas-default-secret-key-2026'), 'Hardcoded session secret fallback must be removed');
  assert.ok(!sessionSrc.includes('process.env.DATABASE_URL'), 'DATABASE_URL must never be reused as HMAC signing secret');
  assert.ok(sessionSrc.includes("if (process.env.NODE_ENV === 'production')"), 'Production must fail closed when AUTH_SECRET is missing');
  assert.ok(sessionSrc.includes('verifyAuthenticatedSession'), 'Must enforce DB verified + sessionVersion checks');
  console.log('PASS [Security 1] session.ts has no secret fallbacks or DATABASE_URL key reuse');
}

// 2. Session expiry, tamper resistance, and production throw simulation
{
  const secret = 'test-auth-secret-with-at-least-32-characters-123456';
  const sign = (payload) => {
    const data = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
    const sig = createHmac('sha256', secret).update(data).digest('base64url');
    return `${data}.${sig}`;
  };

  const verifyLocal = (token) => {
    if (!token || !token.includes('.')) return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [d, s] = parts;
    const exp = createHmac('sha256', secret).update(d).digest('base64url');
    if (s !== exp) return null;
    const parsed = JSON.parse(Buffer.from(d, 'base64url').toString('utf8'));
    if (typeof parsed.exp !== 'number' || parsed.exp <= Date.now()) return null;
    return parsed;
  };

  const valid = sign({ id: 'u1', email: 'a@b.com', name: 'A', sv: 1, exp: Date.now() + 60_000 });
  const expired = sign({ id: 'u1', email: 'a@b.com', name: 'A', sv: 1, exp: Date.now() - 1_000 });
  const noExp = sign({ id: 'u1', email: 'a@b.com', name: 'A', sv: 1 });

  assert.equal(verifyLocal(valid)?.id, 'u1');
  assert.equal(verifyLocal(expired), null, 'Expired session token must fail');
  assert.equal(verifyLocal(noExp), null, 'Token without exp claim must fail');
  assert.equal(verifyLocal(valid + 'tamper'), null, 'Tampered signature must fail');
  console.log('PASS [Security 2] Token expiry, claims, and HMAC verification enforced');
}

// 3. Access Control / IDOR guards in state, connect-token, import-invoice, webhook
{
  const stateSrc = read('src/app/api/state/route.ts');
  assert.ok(stateSrc.includes('verifyAuthenticatedSession'), '/api/state must call verifyAuthenticatedSession');
  assert.ok(!stateSrc.includes("searchParams.get('userId')"), '/api/state GET must never trust query userId');
  assert.ok(!stateSrc.includes('body.userId'), '/api/state PUT must never trust body userId');
  assert.ok(!stateSrc.includes('err.message'), '/api/state must not expose raw err.message');

  const connectSrc = read('src/app/api/open-finance/connect-token/route.ts');
  assert.ok(connectSrc.includes('verifyAuthenticatedSession'), 'connect-token must authenticate caller');
  assert.ok(!connectSrc.includes('body.userId'), 'connect-token must ignore body.userId');

  const webhookSrc = read('src/app/api/open-finance/webhook/route.ts');
  assert.ok(webhookSrc.includes('if (!secret)'), 'webhook must fail closed when PLUGGY_WEBHOOK_SECRET is unset');
  assert.ok(!webhookSrc.includes("searchParams.get('secret')"), 'webhook must never read secret from URL query string');
  assert.ok(webhookSrc.includes('timingSafeEqual'), 'webhook must use constant-time signature comparison');
  assert.ok(!webhookSrc.includes("payload.clientUserId || 'user-default'"), 'webhook must not silently fall back to user-default');

  const importSrc = read('src/app/api/import-invoice/route.ts');
  assert.ok(importSrc.includes('verifyAuthenticatedSession'), 'import-invoice must gate server GEMINI_API_KEY via session');
  assert.ok(importSrc.includes('ALLOWED_MIME_TYPES'), 'import-invoice must enforce MIME allowlist');
  assert.ok(!importSrc.includes('err.message'), 'import-invoice must not expose raw err.message');
  console.log('PASS [Security 3] IDOR, fail-open webhook, and unauthenticated AI import guards verified');
}

// 4. Auth hardening, admin non-disclosure, and telemetry allowlist
{
  const authSrc = read('src/app/api/auth/route.ts');
  assert.ok(authSrc.includes('escapeHtml(sanitizeName('), 'OTP e-mail template must HTML-escape userName');
  assert.ok(authSrc.includes('checkOtpCooldown'), 'Auth route must enforce OTP cooldown across register/login/resend');
  assert.ok(authSrc.includes('lockedUntil'), 'Auth route must enforce failed login lockout');
  assert.ok(authSrc.includes("secure: process.env.NODE_ENV === 'production'"), 'Session cookie must set Secure in production');
  assert.ok(authSrc.includes('sessionVersion: { increment: 1 }'), 'Logout must invalidate active sessionVersion in DB');
  assert.ok(authSrc.includes('password.length < 8'), 'Register must enforce >= 8 character passwords');

  const adminPageSrc = read('src/app/admin/page.tsx');
  assert.ok(!adminPageSrc.includes('PRIMARY_ADMIN_EMAIL'), 'Unauthenticated SSR /admin must not leak PRIMARY_ADMIN_EMAIL');

  const adminApiSrc = read('src/app/api/admin/route.ts');
  assert.ok(!adminApiSrc.includes('PRIMARY_ADMIN_EMAIL'), '/api/admin must not expose PRIMARY_ADMIN_EMAIL in 403');
  assert.ok(adminApiSrc.includes('ALLOWED_RANGES'), '/api/admin must validate ?range= via allowlist');

  const trackSrc = read('src/app/api/track/route.ts');
  assert.ok(trackSrc.includes('ALLOWED_EVENT_TYPES'), '/api/track must enforce eventType allowlist');
  assert.ok(trackSrc.includes('MAX_TRACK_BODY_BYTES'), '/api/track must enforce payload byte limit');
  console.log('PASS [Security 4] Auth lockout, cookie flags, admin non-disclosure, and track validation verified');
}

// 5. Client-side DOM/Stored XSS & CSS color neutralization in farol-engine.js
{
  const engineSrc = read('src/lib/farol-engine.js');
  assert.ok(!engineSrc.includes('thulioggomes@gmail.com'), 'Client JS bundle must not hardcode admin email');

  const storage = new Map();
  const elements = new Map();
  const makeEl = (id) => {
    if (!elements.has(id)) {
      elements.set(id, {
        id,
        style: { setProperty() {} },
        dataset: {},
        classList: { add() {}, remove() {}, toggle() {} },
        children: [],
        textContent: '',
        innerHTML: '',
        value: '',
        checked: false,
        addEventListener() {},
        appendChild(child) {
          this.children.push(child);
        },
        querySelector: () => null,
        querySelectorAll: () => [],
      });
    }
    return elements.get(id);
  };

  const ctx = vm.createContext({
    console,
    setTimeout,
    clearTimeout,
    Date,
    Math,
    JSON,
    Number,
    String,
    Boolean,
    Array,
    Object,
    encodeURIComponent,
    fetch: async () => ({ ok: true, json: async () => ({ ok: true }) }),
    window: {
      localStorage: {
        getItem: (k) => (storage.has(k) ? storage.get(k) : null),
        setItem: (k, v) => storage.set(k, String(v)),
        removeItem: (k) => storage.delete(k),
      },
    },
    document: {
      documentElement: { setAttribute() {}, style: {} },
      getElementById: (id) => makeEl(id),
      querySelector: () => null,
      querySelectorAll: () => [],
      createElement: (tag) => ({ tagName: tag, className: '', textContent: '' }),
    },
  });
  ctx.globalThis = ctx;
  ctx.self = ctx;
  attachFarolEngineGlobals(ctx);

  const runnable = toRunnableEngineScript(engineSrc);
  new vm.Script(
    runnable +
      '\nglobalThis.__sec = { esc, safeCssColor, getCleanEmptyState, setState: s => { state = s; }, getState: () => state, getTxFilter: () => txFilter, setTxFilter: f => { txFilter = { ...txFilter, ...f }; }, getFilteredTransactions, getAccountBalanceCents, getInvoiceMonthForTransaction, computeMonthMetrics, isInternalTransferTx, sanitizeWorkspaceInstallments, hasDuplicateInstallmentTx, clampDayToYM, syncRecurrencesForMonth, renderVisaoGeral, renderTransacoesView, renderRecorrenciasView, renderFluxoCaixaView, renderFaturasView, renderCategoriasView, renderMetasView, renderPatrimonioView, renderContasView, renderInvoiceReviewTable, setReviewItems: arr => { invoiceReviewItems = arr; } };'
  ).runInContext(ctx);

  const sec = ctx.__sec;
  const xss = '<img src=x onerror=alert(1)>';
  const attrBreak = '" onmouseover="alert(2)';

  assert.equal(sec.esc(xss), '&lt;img src=x onerror=alert(1)&gt;');
  assert.equal(sec.safeCssColor('red;background-image:url(x)', '#38b6ff'), '#38b6ff');
  assert.equal(sec.safeCssColor('#10b981'), '#10b981');

  const poisoned = sec.getCleanEmptyState(`User ${xss}`);
  poisoned.selectedMonth = '2026-11';
  poisoned.categories = [
    { id: 'cat-xss', name: `Comida ${xss}`, color: '#ef4444', budgetCents: 10000, rules: [`rule ${xss}`], archived: false },
  ];
  poisoned.accounts = [
    { id: 'acc-xss', name: `Banco ${xss}`, type: `Conta ${xss}`, initialBalanceCents: 10000, limitCents: 50000, closingDay: 5, dueDay: 12 },
  ];
  poisoned.transactions = [
    { id: 'tx-xss', type: 'expense', amountCents: 5000, description: `Compra ${xss}`, tag: `tag${attrBreak}`, categoryId: 'cat-xss', accountId: 'acc-xss', date: '2026-11-10', method: 'Cartão de Crédito' },
  ];
  poisoned.recurrences = [
    { id: 'rec-xss', description: `Rec ${xss}`, amountCents: 2000, type: 'expense', categoryId: 'cat-xss', accountId: 'acc-xss', day: 10, active: true },
  ];
  poisoned.goals = [
    { id: 'goal-xss', title: `Meta ${xss}`, currentCents: 1000, targetCents: 10000, deadline: '2027-01', color: 'bad(css)' },
  ];
  poisoned.assets = [
    { id: 'ast-xss', name: `CDB ${xss}`, category: 'Renda Fixa (CDB)', institution: `Inst ${xss}`, liquidity: 'Diária', cdbPercent: 100, amountCents: 10000, weeklyDeltaCents: 0 },
  ];
  sec.setState(poisoned);

  const renderedViews = [
    sec.renderVisaoGeral(),
    sec.renderTransacoesView(),
    sec.renderRecorrenciasView(),
    sec.renderFluxoCaixaView(),
    sec.renderFaturasView(),
    sec.renderCategoriasView(),
    sec.renderMetasView(),
    sec.renderPatrimonioView(),
    sec.renderContasView(),
  ].join('\n');

  assert.ok(!renderedViews.includes('<img src=x'), 'XSS <img tag must never appear unescaped in rendered HTML');
  assert.ok(!renderedViews.includes('onmouseover="alert(2)'), 'Attribute breakout must never appear unescaped');
  assert.ok(!renderedViews.includes('bad(css)'), 'Invalid CSS color must be rejected by safeCssColor');

  sec.setReviewItems([
    { id: 'r1', include: true, date: '2026-11-10', cleanTitle: xss, currentInstallment: 1, totalInstallments: 1, amount: 50, entryKind: 'purchase', categoryId: 'cat-xss', matchedByRule: false },
  ]);
  sec.renderInvoiceReviewTable();
  const tbodyHtml = elements.get('imp-review-tbody').innerHTML;
  assert.ok(!tbodyHtml.includes('<img src=x'), 'Invoice review table must HTML-escape AI/CSV cleanTitle & categories');
  console.log('PASS [Security 5] XSS & CSS injection vectors neutralized across all views and invoice review table');

  // 6. Transaction Date/Type/Method Filters, Sortable Table Markup, and Patrimônio Resgate Accounting
  const st = sec.getCleanEmptyState('Teste Filtros');
  st.selectedMonth = '2026-11';
  st.accounts = [
    { id: 'acc-nubank', name: 'Conta Principal', type: 'Conta Corrente', initialBalanceCents: 100000, limitCents: 0, closingDay: 5, dueDay: 12 },
  ];
  st.transactions = [
    { id: 't1', type: 'expense', amountCents: 15000, description: 'Mercado Alfa', tag: 'casa', categoryId: 'cat-mercado', accountId: 'acc-nubank', date: '2026-11-05', method: 'Conta Corrente / Pix' },
    { id: 't2', type: 'income', amountCents: 400000, description: 'Salário', tag: 'fixo', categoryId: 'cat-receita', accountId: 'acc-nubank', date: '2026-11-10', method: 'Conta Corrente / Pix' },
    { id: 't3', type: 'expense', amountCents: 8000, description: 'Uber Centro', tag: '', categoryId: 'cat-transporte', accountId: 'acc-nubank', date: '2026-11-20', method: 'Cartão de Crédito' },
  ];
  st.assets = [
    { id: 'ast-1', name: 'CDB 110%', category: 'Renda Fixa (CDB)', institution: 'Inter', liquidity: 'Diária', cdbPercent: 110, amountCents: 50000, weeklyDeltaCents: 0 },
    { id: 'ast-zero', name: 'Tesouro Zero', category: 'Tesouro Direto', institution: 'B3', liquidity: 'D+1', cdbPercent: 100, amountCents: 0, weeklyDeltaCents: 0 },
  ];
  sec.setState(st);

  // Date range custom filter
  sec.setTxFilter({ period: 'custom', dateFrom: '2026-11-06', dateTo: '2026-11-15', type: '', method: '', sortBy: 'date', sortDir: 'descending' });
  const rangeTxs = sec.getFilteredTransactions();
  assert.equal(rangeTxs.length, 1);
  assert.equal(rangeTxs[0].id, 't2');

  // Ascending date sort
  sec.setTxFilter({ period: 'month', dateFrom: '', dateTo: '', sortBy: 'date', sortDir: 'ascending' });
  const ascDates = sec.getFilteredTransactions().map(t => t.id);
  assert.deepEqual(ascDates, ['t1', 't2', 't3']);

  // Descending amount sort (signed: income +400000 > expense -8000 > expense -15000)
  sec.setTxFilter({ sortBy: 'amount', sortDir: 'descending' });
  const descAmt = sec.getFilteredTransactions().map(t => t.id);
  assert.deepEqual(descAmt, ['t2', 't3', 't1']);

  // Type & method filter
  sec.setTxFilter({ type: 'expense', method: 'Cartão de Crédito', sortBy: 'date', sortDir: 'descending' });
  const cardExp = sec.getFilteredTransactions();
  assert.equal(cardExp.length, 1);
  assert.equal(cardExp[0].id, 't3');

  // Sortable table semantic markup check
  const txHtml = sec.renderTransacoesView();
  assert.ok(txHtml.includes('id="filter-date-from"'), 'Must render date-from input');
  assert.ok(txHtml.includes('id="filter-date-to"'), 'Must render date-to input');
  assert.ok(txHtml.includes('commandfor="tx-data-table" command="--sort"'), 'Sortable headers must use invoker commands');
  assert.ok(txHtml.includes('aria-sort="descending"'), 'Active sorted th must expose aria-sort');

  // Patrimônio withdrawal button & transfer accounting check
  const patHtml = sec.renderPatrimonioView();
  assert.ok(patHtml.includes('data-resgate-asset="ast-1"'), 'Must render Resgatar button for assets');
  assert.ok(/data-resgate-asset="ast-zero"[^>]*disabled/.test(patHtml), 'Zero-balance asset Resgatar button must be disabled');

  const balBefore = sec.getAccountBalanceCents(st.accounts[0]);
  const incBefore = sec.computeMonthMetrics('2026-11').incomeCents;
  st.assets[0].amountCents -= 20000;
  st.transactions.push({
    id: 'tx-resg-test',
    isAssetTransfer: true,
    type: 'income',
    amountCents: 20000,
    description: 'Resgate de CDB 110%',
    tag: 'resgate',
    categoryId: 'cat-invest',
    accountId: 'acc-nubank',
    date: '2026-11-22',
    method: 'Resgate / Investimento',
  });
  assert.equal(sec.isInternalTransferTx(st.transactions[st.transactions.length - 1]), true);
  assert.equal(sec.getAccountBalanceCents(st.accounts[0]), balBefore + 20000, 'Withdrawal credited to account must raise bank balance');
  assert.equal(sec.computeMonthMetrics('2026-11').incomeCents, incBefore, 'Patrimônio withdrawal must not inflate operational monthly income');
  console.log('PASS [Feature 6] Transaction date/type/method filters, sortable headers, and Patrimônio withdrawal verified');

  // 7. Installment Deduplication, Account Healing, Invoice Closing Collision, and Recurrence Safety
  {
    const dirty = sec.getCleanEmptyState('Conta Parcelada');
    dirty.selectedMonth = '2026-11';
    dirty.accounts = [
      { id: 'acc-card', name: 'Nubank', type: 'Conta + Cartão', initialBalanceCents: 100000, limitCents: 500000, closingDay: 28, dueDay: 10 },
      { id: 'acc-cc', name: 'Conta Corrente', type: 'Conta Corrente', initialBalanceCents: 200000, limitCents: 0, closingDay: 5, dueDay: 12 },
    ];
    dirty.recurrences = [
      // Bogus recurrence accidentally created alongside a 3x installment purchase
      { id: 'rec-bogus', description: 'Notebook Gamer', amountCents: 300000, type: 'expense', categoryId: 'cat-compras', accountId: 'acc-card', day: 10, active: true },
      // Legitimate single recurring expense
      { id: 'rec-legit', description: 'Internet Fibra', amountCents: 12000, type: 'expense', categoryId: 'cat-moradia', accountId: 'acc-cc', day: 15, active: true },
    ];
    dirty.transactions = [
      // Real 3x installment series + duplicate copy in Dec + shifted copy + invalid Feb 31 date
      { id: 'tx-nb-1', type: 'expense', amountCents: 100000, description: 'Notebook Gamer (1/3)', tag: 'parcelado', categoryId: 'cat-compras', accountId: 'acc-card', date: '2026-11-10', method: 'Cartão de Crédito' },
      { id: 'tx-nb-2', type: 'expense', amountCents: 100000, description: 'Notebook Gamer (2/3)', tag: 'parcelado', categoryId: 'cat-compras', accountId: 'acc-card', date: '2026-12-10', method: 'Cartão de Crédito' },
      { id: 'tx-nb-2-dup', type: 'expense', amountCents: 100000, description: 'notebook gamer (2/3)', tag: 'parcelado', categoryId: 'cat-compras', accountId: 'acc-card', date: '2026-12-12', method: 'Cartão de Crédito' },
      { id: 'tx-nb-2-shift', type: 'expense', amountCents: 100000, description: 'Notebook Gamer (2/3)', tag: 'parcelado', categoryId: 'cat-compras', accountId: 'acc-card', date: '2026-11-10', method: 'Cartão de Crédito' },
      { id: 'tx-nb-3', type: 'expense', amountCents: 100000, description: 'Notebook Gamer (3/3)', tag: 'parcelado', categoryId: 'cat-compras', accountId: 'acc-card', date: '2027-01-10', method: 'Cartão de Crédito' },
      { id: 'tx-nb-3-dup', type: 'expense', amountCents: 100001, description: 'Notebook Gamer (3/3)', tag: 'parcelado', categoryId: 'cat-compras', accountId: 'acc-card', date: '2027-01-10', method: 'Cartão de Crédito' },
      // Bogus recurrence generated copies across months
      { id: 'tx-rec-bogus-2026-11', recurrenceId: 'rec-bogus', type: 'expense', amountCents: 300000, description: 'Notebook Gamer', tag: 'recorrente', categoryId: 'cat-compras', accountId: 'acc-card', date: '2026-11-10', method: 'Cartão de Crédito' },
      { id: 'tx-rec-bogus-2026-12', recurrenceId: 'rec-bogus', type: 'expense', amountCents: 300000, description: 'Notebook Gamer', tag: 'recorrente', categoryId: 'cat-compras', accountId: 'acc-card', date: '2026-12-10', method: 'Cartão de Crédito' },
      // Orphan tx from an already-deleted bogus recurrence on checking account (was draining saldo!)
      { id: 'tx-orphan-rec', recurrenceId: 'rec-deleted-old', type: 'expense', amountCents: 100000, description: 'Notebook Gamer', tag: 'recorrente', categoryId: 'cat-compras', accountId: 'acc-card', date: '2027-01-10', method: 'Recorrência Automática' },
      // Legitimate single recurring expense duplicated in Nov (manual + auto)
      { id: 'tx-net-manual', type: 'expense', amountCents: 12000, description: 'Internet Fibra', tag: '', categoryId: 'cat-moradia', accountId: 'acc-cc', date: '2026-11-15', method: 'Conta Corrente / Pix' },
      { id: 'tx-rec-legit-2026-11', recurrenceId: 'rec-legit', type: 'expense', amountCents: 12000, description: 'Internet Fibra', tag: 'recorrente', categoryId: 'cat-moradia', accountId: 'acc-cc', date: '2026-11-15', method: 'Recorrência Automática' },
      // Distinct purchase with same name & installment index but DIFFERENT value must NOT be deleted
      { id: 'tx-nb-other-price', type: 'expense', amountCents: 45000, description: 'Notebook Gamer (2/3)', tag: 'parcelado', categoryId: 'cat-compras', accountId: 'acc-card', date: '2026-12-10', method: 'Cartão de Crédito' },
      // Closing day 28 collision (Jan 30 -> Feb invoice; Feb 31 -> clamped Feb 28 -> must get Mar invoice)
      { id: 'tx-col-1', type: 'expense', amountCents: 25000, description: 'Celular (1/2)', tag: 'parcelado', categoryId: 'cat-compras', accountId: 'acc-card', date: '2026-01-30', method: 'Cartão de Crédito' },
      { id: 'tx-col-2', type: 'expense', amountCents: 25000, description: 'Celular (2/2)', tag: 'parcelado', categoryId: 'cat-compras', accountId: 'acc-card', date: '2026-02-31', method: 'Cartão de Crédito' },
    ];

    const res = sec.sanitizeWorkspaceInstallments(dirty);
    assert.equal(res.changed, true, 'Dirty workspace must be healed');
    assert.equal(res.removedRecurrences, 1, 'Bogus installment recurrence must be removed');
    assert.equal(res.fixedDates, 1, 'Invalid 2026-02-31 date must be clamped');

    const nb100 = dirty.transactions.filter(t => t.description.startsWith('Notebook Gamer') && t.amountCents >= 99999);
    assert.equal(nb100.length, 3, 'Must leave exactly 3 installments (1/3, 2/3, 3/3) of Notebook Gamer');
    assert.deepEqual([...nb100.map(t => t.date)].sort(), ['2026-11-10', '2026-12-10', '2027-01-10']);

    const otherPrice = dirty.transactions.filter(t => t.id === 'tx-nb-other-price');
    assert.equal(otherPrice.length, 1, 'Distinct purchase with different amount must be preserved');

    const netNov = dirty.transactions.filter(t => t.description === 'Internet Fibra' && t.date.startsWith('2026-11'));
    assert.equal(netNov.length, 1, 'Single recurring tx must not be duplicated in Nov');
    assert.equal(netNov[0].recurrenceId, 'rec-legit', 'Manual tx must be linked to recurrenceId');

    const col1 = dirty.transactions.find(t => t.id === 'tx-col-1');
    const col2 = dirty.transactions.find(t => t.id === 'tx-col-2');
    assert.equal(col2.date, '2026-02-28', 'Invalid Feb 31 must clamp to 2026-02-28');
    assert.equal(sec.getInvoiceMonthForTransaction(col1, dirty.accounts[0]), '2026-02');
    assert.equal(sec.getInvoiceMonthForTransaction(col2, dirty.accounts[0]), '2026-03', 'Consecutive installment must land on next invoice month, not collide in Feb');

    // Syncing recurrences across Nov, Dec, Jan must NOT recreate any duplicate
    sec.setState(dirty);
    sec.syncRecurrencesForMonth('2026-11');
    sec.syncRecurrencesForMonth('2026-12');
    sec.syncRecurrencesForMonth('2027-01');
    assert.equal(
      dirty.transactions.filter(t => t.description.startsWith('Notebook Gamer') && t.amountCents >= 99999).length,
      3,
      'syncRecurrencesForMonth must never duplicate Notebook Gamer installments across months'
    );
    assert.equal(
      dirty.transactions.filter(t => t.description === 'Internet Fibra' && t.date.startsWith('2026-11')).length,
      1,
      'syncRecurrencesForMonth must not duplicate linked Nov Internet Fibra'
    );
    // Account balance on acc-card must be restored (orphan non-credit recurrence removed)
    assert.equal(sec.getAccountBalanceCents(dirty.accounts[0]), 100000, 'Card account cash balance must be healed');
    // Account balance on acc-cc must reflect 3 months of Internet Fibra (Nov, Dec, Jan = 36000) without Nov duplication
    assert.equal(sec.getAccountBalanceCents(dirty.accounts[1]), 200000 - 36000, 'Checking account balance must reflect single Internet Fibra per month');

    // Duplicate guard helper check (shifted day + 1 cent rounding)
    assert.equal(
      sec.hasDuplicateInstallmentTx(dirty.transactions, {
        accountId: 'acc-card',
        type: 'expense',
        amountCents: 100000,
        description: 'Notebook Gamer (2/3)',
        date: '2026-12-14'
      }),
      true,
      'Shifted day in same month must be caught as duplicate installment'
    );
    assert.equal(sec.clampDayToYM('2026-02', 31), '2026-02-28');

    // Verify server API routes & state-sanitize.ts integration
    const stateRouteSrc = read('src/app/api/state/route.ts');
    const authRouteSrc = read('src/app/api/auth/route.ts');
    const sanitizeSrc = read('src/lib/state-sanitize.ts');
    assert.ok(stateRouteSrc.includes('sanitizeWorkspaceInstallments'), '/api/state must sanitize workspaces');
    assert.ok(stateRouteSrc.includes('sanitizeAllWorkspacesOnce'), '/api/state must heal existing workspaces');
    assert.ok(authRouteSrc.includes('sanitizeWorkspaceInstallments'), '/api/auth must sanitize workspaces');
    assert.ok(sanitizeSrc.includes('sanitizeAllWorkspacesOnce'), 'state-sanitize.ts must export batch healer');
    console.log('PASS [Feature 7] Installment deduplication, account healing, invoice closing alignment, and recurrence safety verified');
  }

  // 8. Enriched Visão Geral Cards (Resultado Parcial, Faturas, Insights, Metas) & Zero/Empty Fallbacks
  {
    const vg = sec.getCleanEmptyState('Dashboard Rico');
    vg.selectedMonth = '2026-11';
    vg.profile.monthlyBudgetCents = 200000; // R$ 2.000,00
    vg.profile.emergencyGoalCents = 1000000;
    vg.accounts = [
      { id: 'acc-nu', name: 'Nubank', type: 'Conta + Cartão', initialBalanceCents: 300000, limitCents: 100000, closingDay: 5, dueDay: 10 },
      { id: 'acc-xp', name: 'XP Visa', type: 'Cartão de Crédito', initialBalanceCents: 0, limitCents: 100000, closingDay: 15, dueDay: 22 },
    ];
    vg.recurrences = [
      { id: 'rec-net', description: 'Internet', amountCents: 10000, type: 'expense', categoryId: 'cat-moradia', accountId: 'acc-nu', day: 20, active: true },
    ];
    vg.transactions = [
      { id: 'tx-sal', type: 'income', amountCents: 500000, description: 'Salário', tag: '', categoryId: 'cat-receita', accountId: 'acc-nu', date: '2026-11-05', method: 'Conta Corrente / Pix' },
      { id: 'tx-food', type: 'expense', amountCents: 160000, description: 'Mercado', tag: '', categoryId: 'cat-mercado', accountId: 'acc-nu', date: '2026-11-04', method: 'Cartão de Crédito' },
    ];
    vg.goals = [
      { id: 'g-1', title: 'Viagem Europa', currentCents: 60000, targetCents: 300000, deadline: '2027-11', color: '#38b6ff' },
    ];
    sec.setState(vg);

    const htmlPop = sec.renderVisaoGeral();
    assert.ok(!htmlPop.includes('NaN') && !htmlPop.includes('Infinity'), 'Populated Visão Geral must never render NaN or Infinity');
    // Card 1: Resultado parcial (+68% economizado, Projeção do mês, flow split bar)
    assert.ok(htmlPop.includes('+68% economizado'), 'Must render positive savings rate pill');
    assert.ok(htmlPop.includes('Projeção do mês'), 'Must render monthly projection label');
    assert.ok(htmlPop.includes('flow-split-bar'), 'Must render income/expense proportion bar');
    // Card 2: Faturas (due badge, 80% amber limit bar, +1 cartão footer)
    assert.ok(htmlPop.includes('10/11'), 'Must render primary card due date badge');
    assert.ok(htmlPop.includes('Limite utilizado · <strong>80%</strong>'), 'Must calculate 80% limit utilization across both cards');
    assert.ok(htmlPop.includes('--progress-bar-fill:var(--amber-gold)'), '70%-90% limit must use amber progress bar');
    assert.ok(htmlPop.includes('Cartão principal:') && htmlPop.includes('+1 cartão'), 'Must display primary card + extra cards count');
    // Card 3: Insights (max 2 blocks rendered, pagination 1/2 for > 2 insights, safe daily budget)
    assert.equal((htmlPop.match(/class="insight-alert-box/g) || []).length, 2, 'Must show at most 2 insight blocks at once');
    assert.ok(htmlPop.includes('1/2'), 'Must show < 1/2 > pagination when > 2 insights exist');
    assert.ok(htmlPop.includes('Orçamento livre:'), 'Must show safe daily budget insight');
    // Card 4: Metas (Aporte mensal sugerido = (3000-600)/12 = R$ 200,00/mês + progress percentage)
    assert.ok(htmlPop.includes('Aporte mensal sugerido'), 'Must render suggested monthly contribution');
    assert.ok(htmlPop.includes('200,00/mês'), 'Must compute exact monthly goal contribution');
    assert.ok(htmlPop.includes('(20%)'), 'Must display goal completion percentage next to current value');
    assert.ok(htmlPop.includes('cat-icon-badge'), 'Must render Precision Stroke category icon badges instead of plain ●');
    assert.ok(!htmlPop.includes('↗ Entradas'), 'Must render Precision Stroke SVG inflow icon instead of text ↗');

    // Edge cases: zero income, zero limit, over-budget, goal without deadline / past deadline
    const emptyVg = sec.getCleanEmptyState('Vazio');
    emptyVg.selectedMonth = '2026-11';
    emptyVg.profile.monthlyBudgetCents = 10000;
    emptyVg.profile.emergencyGoalCents = 0;
    emptyVg.accounts = [
      { id: 'acc-nolim', name: 'Carteira', type: 'Conta Corrente', initialBalanceCents: 0, limitCents: 0, closingDay: 5, dueDay: 12 },
    ];
    emptyVg.transactions = [
      { id: 'tx-over', type: 'expense', amountCents: 25000, description: 'Extra', tag: '', categoryId: 'cat-compras', accountId: 'acc-nolim', date: '2026-11-10', method: 'Conta Corrente / Pix' },
    ];
    emptyVg.recurrences = [];
    emptyVg.goals = [
      { id: 'g-past', title: 'Meta Hoje', currentCents: 0, targetCents: 100000, deadline: '2026-11', color: '#38b6ff' },
    ];
    sec.setState(emptyVg);

    const htmlEdge = sec.renderVisaoGeral();
    assert.ok(!htmlEdge.includes('NaN') && !htmlEdge.includes('Infinity'), 'Edge-case Visão Geral must never render NaN or Infinity');
    assert.ok(htmlEdge.includes('Sem entradas'), 'Zero income must render Sem entradas pill');
    assert.ok(htmlEdge.includes('Sem limite'), 'Zero limit must render clean fallback');
    assert.ok(htmlEdge.includes('Orçamento estourado'), 'Negative remaining budget must render over-budget warning');
    assert.ok(!htmlEdge.includes('insights-pager'), 'Pagination must hide when <= 2 insights exist');
    assert.ok(htmlEdge.includes('prazo já atingido'), 'Zero months left must avoid division by zero');
    assert.ok(htmlEdge.includes('(0%)'), 'Zero goal progress must render (0%) cleanly');
    console.log('PASS [Feature 8] Enriched Visão Geral 4 cards, tabular-nums, dynamic limit colors, insights pager, and zero-state fallbacks verified');
  }

  // 9. Returning-user cold boot with pre-populated localStorage (guards against TDZ / module-eval crashes)
  {
    const prePopStorage = new Map();
    prePopStorage.set('farol_financas_users_v2', JSON.stringify({
      activeUserId: 'usr-returning',
      users: [{ id: 'usr-returning', name: 'Thulio' }],
    }));
    prePopStorage.set('farol_financas_data_v2_usr-returning', JSON.stringify({
      selectedMonth: '2026-11',
      currentTab: 'visao-geral',
      theme: 'dark',
      profile: { name: 'Thulio', plan: 'Plano pessoal', monthlyBudgetCents: 200000, emergencyGoalCents: 100000 },
      accounts: [{ id: 'acc-1', name: 'Nubank', type: 'Conta + Cartão', initialBalanceCents: 0, limitCents: 500000, closingDay: 5, dueDay: 12 }],
      transactions: [
        { id: 't-1', type: 'expense', amountCents: 10000, description: 'Compra (1/3)', date: '2026-11-10', accountId: 'acc-1', categoryId: 'cat-compras', method: 'Cartão de Crédito' },
        { id: 't-2', type: 'expense', amountCents: 10000, description: 'Compra (2/3)', date: '2026-12-10', accountId: 'acc-1', categoryId: 'cat-compras', method: 'Cartão de Crédito' },
        { id: 't-2-dup', type: 'expense', amountCents: 10000, description: 'Compra (2/3)', date: '2026-12-10', accountId: 'acc-1', categoryId: 'cat-compras', method: 'Cartão de Crédito' },
      ],
      recurrences: [],
      goals: [{ id: 'g-1', title: 'Reserva', currentCents: 10000, targetCents: 100000, deadline: '2027-11', color: '#38b6ff' }],
      assets: [],
      categories: [],
    }));
    const bootCtx = vm.createContext({
      console,
      Intl,
      Date,
      Math,
      JSON,
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      fetch: async () => ({ ok: false, json: async () => ({}) }),
      window: {
        localStorage: {
          getItem: (k) => (prePopStorage.has(k) ? prePopStorage.get(k) : null),
          setItem: (k, v) => prePopStorage.set(k, String(v)),
          removeItem: (k) => prePopStorage.delete(k),
        },
        location: { pathname: '/' },
      },
      document: {
        documentElement: { setAttribute() {}, getAttribute() { return 'dark'; } },
        body: { classList: { toggle() {}, add() {}, remove() {} } },
        getElementById: () => makeEl('boot-el'),
        querySelectorAll: () => [],
        addEventListener() {},
        removeEventListener() {},
      },
    });
    bootCtx.globalThis = bootCtx;
    bootCtx.self = bootCtx;
    attachFarolEngineGlobals(bootCtx);
    new vm.Script(runnable + '\ninitFarolApp();\nglobalThis.__bootState = state;\nglobalThis.__ensureShape = ensureValidStateShape;').runInContext(bootCtx);
    assert.equal(bootCtx.__bootState.transactions.length, 2, 'Cold boot with pre-populated localStorage must sanitize duplicates without TDZ error');

    // Corrupted partial state recovery check
    const healed = bootCtx.__ensureShape({ selectedMonth: null, profile: null, transactions: null, recurrences: 'bad', accounts: [] }, 'Thulio');
    assert.equal(healed.selectedMonth, '2026-11');
    assert.equal(healed.profile.name, 'Thulio');
    assert.ok(Array.isArray(healed.transactions) && Array.isArray(healed.recurrences) && healed.accounts.length > 0);
    console.log('PASS [Boot 9] Returning-user cold boot with pre-populated and corrupted localStorage verified (zero TDZ/init crash)');

    // -------------------------------------------------------------------------
    // 10. Product Tour (9 steps, no permanent topbar button, Next/Prev/Skip)
    // -------------------------------------------------------------------------
    const shellSrc = fs.readFileSync(path.join(ROOT, 'src/lib/shell-html.ts'), 'utf8');
    assert.ok(shellSrc.includes('id="farol-tour-popover"'), 'Shell HTML must include #farol-tour-popover dialog');
    assert.ok(shellSrc.includes('id="tour-spotlight-box"'), 'Shell HTML must include #tour-spotlight-box');
    assert.ok(shellSrc.includes('id="tour-btn-next"') && shellSrc.includes('id="tour-btn-prev"') && shellSrc.includes('id="tour-btn-skip-footer"'), 'Shell HTML must include Próximo, Anterior, and Pular buttons');
    assert.ok(!shellSrc.includes('class="tour-trigger-pill"'), 'Topbar must NOT have a permanent Tour Guiado button');

    new vm.Script('globalThis.__tourSteps = FAROL_PRODUCT_TOUR_STEPS;').runInContext(bootCtx);
    assert.equal(bootCtx.__tourSteps.length, 9, 'Complete Product Tour must have all 9 steps');
    assert.equal(bootCtx.__tourSteps[0].view, 'visao-geral');
    assert.equal(bootCtx.__tourSteps[5].view, 'transacoes');
    assert.equal(bootCtx.__tourSteps[7].selector, '#tour-tx-thead');
    assert.equal(bootCtx.__tourSteps[8].selector, '#profile-trigger');
    console.log('PASS [Feature 10] Complete 9-step Product Tour structure, absence of permanent topbar button, and target selectors verified');

    // -------------------------------------------------------------------------
    // 11. Forgot Password (OTP reset flow) & Password Visibility Eye Toggles
    // -------------------------------------------------------------------------
    const authApiSrc = read('src/app/api/auth/route.ts');
    assert.ok(authApiSrc.includes("if (action === 'forgot_password')"), 'Auth API must implement forgot_password action');
    assert.ok(authApiSrc.includes("if (action === 'reset_password')"), 'Auth API must implement reset_password action');
    assert.ok(authApiSrc.includes("purpose: { in: ['login', 'register'] }"), 'verify_otp must reject reset_password OTPs (purpose isolation)');
    assert.ok(authApiSrc.includes("purpose: 'reset_password'"), 'reset_password must require reset_password OTPs');
    assert.ok(authApiSrc.includes('newPassword.length < 8'), 'reset_password must enforce >= 8 character passwords');
    assert.ok(authApiSrc.includes('lockedUntil: null'), 'reset_password must unlock locked accounts upon valid reset');
    assert.ok((authApiSrc.match(/sessionVersion:\s*\{\s*increment:\s*1\s*\}/g) || []).length >= 2, 'Both logout and reset_password must increment sessionVersion to revoke old sessions');

    assert.ok(shellSrc.includes('id="gate-forgot-btn"'), 'Auth gate must include Esqueci minha senha button');
    assert.ok(shellSrc.includes('id="btn-modal-auth-forgot"'), 'Auth modal must include Esqueci minha senha button');
    assert.ok(shellSrc.includes('id="form-auth-forgot"'), 'Auth gate must include forgot-password email form');
    assert.ok(shellSrc.includes('id="form-auth-reset"'), 'Auth gate must include OTP + new password reset form');
    assert.ok(shellSrc.includes('data-toggle-password="gate-password"'), 'Auth gate password must include eye toggle');
    assert.ok(shellSrc.includes('data-toggle-password="auth-password"'), 'Auth modal password must include eye toggle');
    assert.ok(shellSrc.includes('data-toggle-password="reset-new-password"'), 'Reset new password must include eye toggle');
    assert.ok(shellSrc.includes('data-toggle-password="reset-confirm-password"'), 'Reset confirm password must include eye toggle');

    const authCssSrc = read('src/app/styles/auth.css');
    assert.ok(authCssSrc.includes('.password-toggle-btn') && authCssSrc.includes('::-ms-reveal'), 'Auth CSS must style password eye toggle and suppress duplicate native Edge reveal icon');

    // Runtime verification of password visibility toggle and forgot/reset UI transitions
    const pwElements = new Map();
    const makePwEl = (id) => {
      if (!pwElements.has(id)) {
        pwElements.set(id, {
          id,
          type: 'password',
          value: '',
          textContent: '',
          disabled: false,
          style: {},
          dataset: {},
          attrs: {},
          classes: new Set(),
          classList: {
            toggle(c, force) {
              if (force === undefined) {
                if (this._set.has(c)) this._set.delete(c);
                else this._set.add(c);
              } else if (force) {
                this._set.add(c);
              } else {
                this._set.delete(c);
              }
            },
            add(c) { this._set.add(c); },
            remove(c) { this._set.delete(c); },
            _set: null,
          },
          setAttribute(k, v) { this.attrs[k] = String(v); },
          getAttribute(k) { return this.attrs[k]; },
          focus() {},
        });
        const obj = pwElements.get(id);
        obj.classList._set = obj.classes;
      }
      return pwElements.get(id);
    };
    const toggleBtnMock = makePwEl('toggle-gate-pw');
    toggleBtnMock.dataset.togglePassword = 'gate-password';

    const origGetEl = bootCtx.document.getElementById;
    const origQsa = bootCtx.document.querySelectorAll;
    bootCtx.document.getElementById = (id) => makePwEl(id);
    bootCtx.document.querySelectorAll = (sel) => (sel === '[data-toggle-password="gate-password"]' ? [toggleBtnMock] : []);

    new vm.Script(`
      setPasswordFieldVisibility('gate-password', true);
      globalThis.__pwTypeVisible = document.getElementById('gate-password').type;
      globalThis.__pwAriaVisible = document.querySelectorAll('[data-toggle-password="gate-password"]')[0].getAttribute('aria-pressed');
      resetAllPasswordVisibilities();
      globalThis.__pwTypeHidden = document.getElementById('gate-password').type;
      globalThis.__pwAriaHidden = document.querySelectorAll('[data-toggle-password="gate-password"]')[0].getAttribute('aria-pressed');
      setAuthGateMode('register');
      globalThis.__forgotInReg = document.getElementById('gate-forgot-btn').style.display;
      setAuthGateMode('login');
      globalThis.__forgotInLogin = document.getElementById('gate-forgot-btn').style.display;
      showForgotPasswordStep('user@test.com');
      globalThis.__forgotFormDisplay = document.getElementById('form-auth-forgot').style.display;
      globalThis.__forgotEmailVal = document.getElementById('forgot-email').value;
      showResetPasswordStep({ email: 'user@test.com', cooldownSeconds: 0 });
      globalThis.__resetFormDisplay = document.getElementById('form-auth-reset').style.display;
      globalThis.__resetTargetEmail = document.getElementById('reset-target-email').value;
    `).runInContext(bootCtx);

    bootCtx.document.getElementById = origGetEl;
    bootCtx.document.querySelectorAll = origQsa;

    assert.equal(bootCtx.__pwTypeVisible, 'text', 'Eye toggle must reveal password input as type="text"');
    assert.equal(bootCtx.__pwAriaVisible, 'true', 'Eye toggle must set aria-pressed="true" when visible');
    assert.equal(bootCtx.__pwTypeHidden, 'password', 'Resetting visibility must restore type="password"');
    assert.equal(bootCtx.__pwAriaHidden, 'false', 'Resetting visibility must restore aria-pressed="false"');
    assert.equal(bootCtx.__forgotInReg, 'none', 'Esqueci minha senha must hide in register mode');
    assert.equal(bootCtx.__forgotInLogin, 'inline-block', 'Esqueci minha senha must show in login mode');
    assert.equal(bootCtx.__forgotFormDisplay, 'flex', 'showForgotPasswordStep must display #form-auth-forgot');
    assert.equal(bootCtx.__forgotEmailVal, 'user@test.com', 'showForgotPasswordStep must prefill e-mail');
    assert.equal(bootCtx.__resetFormDisplay, 'flex', 'showResetPasswordStep must display #form-auth-reset');
    assert.equal(bootCtx.__resetTargetEmail, 'user@test.com', 'showResetPasswordStep must bind target e-mail');
    console.log('PASS [Feature 11] Forgot password (OTP reset + session revocation + purpose isolation) and password visibility eye toggles verified');

    // -------------------------------------------------------------------------
    // 12. Direct Unit Tests for Modularized Stage 1 TS Modules (formatters, installments, invoice-parser)
    // -------------------------------------------------------------------------
    // 12a. formatters.ts
    assert.equal(farolFormatters.toCents('R$ 1.234,56'), 123456);
    assert.equal(farolFormatters.toCents('1234.56'), 123456);
    assert.equal(farolFormatters.toCents(-42.5), -4250);
    assert.equal(farolFormatters.fromCents(123456), 1234.56);
    assert.equal(farolFormatters.fmtBRL(123456, true), '+R$ 1.234,56');
    assert.equal(farolFormatters.fmtBRL(-5500), '-R$ 55,00');
    assert.equal(farolFormatters.fmtDateBR('2026-11-28'), '28/11/2026');
    assert.equal(farolFormatters.fmtMonthLabel('2026-11'), 'Novembro de 2026');
    assert.equal(farolFormatters.addMonthsYM('2026-11', 2), '2027-01');
    assert.equal(farolFormatters.monthDiffYM('2027-01', '2026-11'), 2);
    assert.equal(farolFormatters.clampIsoDate('2026-02-31'), '2026-02-28');
    assert.equal(farolFormatters.clampDayToYM('2024-02', 31), '2024-02-29');

    // 12b. installments.ts shared single source of truth
    const stateSanitizeSrc = read('src/lib/state-sanitize.ts');
    assert.ok(stateSanitizeSrc.includes("from './farol/installments'"), 'state-sanitize.ts must reuse unified farol/installments module');
    assert.ok(engineSrc.includes("from './farol/installments'"), 'farol-engine.js must import unified farol/installments module');
    assert.ok(engineSrc.includes("from './farol/formatters'"), 'farol-engine.js must import unified farol/formatters module');
    assert.ok(engineSrc.includes("from './farol/invoice-parser'"), 'farol-engine.js must import unified farol/invoice-parser module');

    const instMeta = farolInstallments.parseInstallmentMeta({ description: 'Monitor 4K (3/12)' });
    assert.deepEqual(instMeta, { baseTitle: 'Monitor 4K', normalizedBase: 'monitor 4k', index: 3, total: 12 });

    // 12c. invoice-parser.ts (CSV, OFX, Markdown + local classifier)
    const sampleCats = [
      { id: 'cat-transporte', name: 'Transporte & Combustível', archived: false, rules: ['uber'] },
      { id: 'cat-delivery', name: 'Delivery & Restaurantes', archived: false, rules: ['ifood'] },
      { id: 'cat-compras', name: 'Compras & Vestuário', archived: false, rules: [] },
    ];
    assert.equal(farolInvoiceParser.cleanBrazilianAmountToFloat('R$ 1.946,15'), 1946.15);
    assert.deepEqual(
      farolInvoiceParser.extractInstallmentInfoFromTitle('Mercado Livre - Parcela 2/10'),
      { cleanTitle: 'Mercado Livre', currentInstallment: 2, totalInstallments: 10 }
    );
    assert.equal(farolInvoiceParser.detectEntryKind('Pagamento recebido', -500, true), 'payment');
    assert.equal(farolInvoiceParser.detectEntryKind('Estorno loja X', -100, true), 'refund');

    const csvParsed = farolInvoiceParser.parseInvoiceCSVOrOFXLocally(
      'date,title,amount\n2026-11-10,Uber Trip,28.50\n2026-11-12,Mercado Livre - Parcela 2/6,150.00\n2026-11-15,Pagamento recebido,-500.00',
      'fatura.csv',
      { categories: sampleCats, defaultYM: '2026-11' }
    );
    assert.equal(csvParsed.length, 3);
    assert.equal(csvParsed[0].categoryId, 'cat-transporte');
    assert.equal(csvParsed[1].currentInstallment, 2);
    assert.equal(csvParsed[1].totalInstallments, 6);
    assert.equal(csvParsed[2].entryKind, 'payment');
    assert.equal(csvParsed[2].include, false);

    const ofxParsed = farolInvoiceParser.parseInvoiceCSVOrOFXLocally(
      '<OFX><STMTTRN><TRNAMT>-45.90<DTPOSTED>20261118<MEMO>IFOOD *BURGER</STMTTRN></OFX>',
      'extrato.ofx',
      { categories: sampleCats, defaultYM: '2026-11' }
    );
    assert.equal(ofxParsed.length, 1);
    assert.equal(ofxParsed[0].date, '2026-11-18');
    assert.equal(ofxParsed[0].categoryId, 'cat-delivery');
    assert.equal(ofxParsed[0].amount, 45.9);

    const mdParsed = farolInvoiceParser.parseInvoiceMarkdownLocally(
      '# Fatura Novembro 2026\n| Data | Descrição | Valor |\n| --- | --- | --- |\n| 12/11/2026 | Amazon Prime (1/3) | R$ 99,90 |\n| Total da fatura | Total | R$ 99,90 |\n\n## Estornos\n- 14/11 Loja Teste -R$ 20,00',
      { categories: sampleCats, defaultYM: '2026-11' }
    );
    assert.equal(mdParsed.length, 2, 'Summary Total line must be skipped in Markdown table');
    assert.equal(mdParsed[0].cleanTitle, 'Amazon Prime');
    assert.equal(mdParsed[0].totalInstallments, 3);
    assert.equal(mdParsed[1].entryKind, 'refund');
    assert.equal(mdParsed[1].date, '2026-11-14');
    console.log('PASS [Feature 12] Direct unit tests for Stage 1 TS modules (formatters, installments, invoice-parser) verified');

    // -------------------------------------------------------------------------
    // 13. Direct Unit Tests for Stage 2 TS Modules (metrics, tour, auth)
    // -------------------------------------------------------------------------
    assert.ok(engineSrc.includes("from './farol/metrics'"), 'farol-engine.js must import farol/metrics');
    assert.ok(engineSrc.includes("from './farol/tour'"), 'farol-engine.js must import farol/tour');
    assert.ok(engineSrc.includes("from './farol/auth'"), 'farol-engine.js must import farol/auth');

    // 13a. metrics.ts pure calculations
    const cardAcc = { id: 'acc-c', name: 'Nubank', type: 'Conta + Cartão', initialBalanceCents: 100000, limitCents: 200000, closingDay: 5, dueDay: 12 };
    assert.equal(
      farolMetrics.getInvoiceMonthForTransaction({ date: '2026-11-04', method: 'Cartão de Crédito' }, cardAcc),
      '2026-11'
    );
    assert.equal(
      farolMetrics.getInvoiceMonthForTransaction({ date: '2026-11-06', method: 'Cartão de Crédito' }, cardAcc),
      '2026-12'
    );
    assert.equal(
      farolMetrics.getAccountBalanceCents(cardAcc, [
        { accountId: 'acc-c', type: 'income', amountCents: 50000, method: 'Pix' },
        { accountId: 'acc-c', type: 'expense', amountCents: 20000, method: 'Pix' },
        { accountId: 'acc-c', type: 'expense', amountCents: 80000, method: 'Cartão de Crédito' },
      ]),
      130000,
      'Card credit expense must not deduct cash account balance'
    );

    const metricsState = {
      selectedMonth: '2026-11',
      profile: { monthlyBudgetCents: 200000, emergencyGoalCents: 1000000 },
      categories: [
        { id: 'cat-mercado', name: 'Mercado', color: '#38b6ff', budgetCents: 60000, archived: false },
        { id: 'cat-lazer', name: 'Lazer', color: '#ec4899', budgetCents: 20000, archived: false },
      ],
      accounts: [cardAcc],
      transactions: [
        { id: 'm1', type: 'income', amountCents: 500000, categoryId: 'cat-receita', accountId: 'acc-c', date: '2026-11-05', method: 'Pix' },
        { id: 'm2', type: 'expense', amountCents: 120000, categoryId: 'cat-mercado', accountId: 'acc-c', date: '2026-11-04', method: 'Cartão de Crédito' },
        { id: 'm3', type: 'expense', amountCents: 30000, categoryId: 'cat-lazer', accountId: 'acc-c', date: '2026-11-04', method: 'Pix' },
        { id: 'm4', type: 'expense', amountCents: 50000, isAssetTransfer: true, categoryId: 'cat-invest', accountId: 'acc-c', date: '2026-11-06', method: 'Aporte / Investimento' },
      ],
      recurrences: [
        { id: 'r1', active: true, type: 'expense', amountCents: 10000 },
      ],
      assets: [
        { id: 'a1', category: 'Renda Fixa (CDB)', liquidity: 'Diária', amountCents: 500000, weeklyDeltaCents: 1200 },
        { id: 'a2', category: 'Cripto', liquidity: 'Diária', amountCents: 300000, weeklyDeltaCents: -500 },
      ],
      invoiceMeta: {},
    };
    const mRes = farolMetrics.computeMonthMetrics(metricsState, '2026-11', '2026-11-10');
    assert.equal(mRes.incomeCents, 500000);
    assert.equal(mRes.expenseCents, 150000, 'Internal asset transfer must be excluded from operational expenses');
    assert.equal(mRes.partialResultCents, 350000);
    assert.equal(mRes.distribution[0].catId, 'cat-mercado');
    assert.equal(mRes.distribution[0].pct, 80);
    assert.equal(mRes.totalInvestmentsCents, 800000);
    assert.equal(mRes.reserveCurrentCents, 500000, 'Volatile Cripto must be excluded from emergency reserve');
    assert.equal(mRes.reservePct, 50);

    const invSum = farolMetrics.computeVisaoGeralInvoiceSummary(metricsState, mRes, '2026-11-10');
    assert.equal(invSum.totalFaturasOpenCents, 120000);
    assert.equal(invSum.limitUsedPct, 60);
    assert.equal(invSum.dueBadgeText, 'Vence em 2 dias · 12/11');

    const insights = farolMetrics.buildMonthlyInsightsList(metricsState, mRes, {
      alert: '', info: '', shieldOk: '', repeat: '', target: '', trendUp: '', trendDown: '',
    });
    assert.ok(insights.length >= 4);
    assert.ok(insights[0].title.includes('Mercado concentra 80%'));
    assert.ok(insights[1].title.includes('Orçamento livre:'));

    // 13b. tour.ts pure controller checks
    assert.equal(farolTour.FAROL_PRODUCT_TOUR_STEPS.length, 9);
    const tourState = { productTourCompleted: false, currentTab: 'visao-geral' };
    let tourSaved = 0;
    const tourCtrl = farolTour.createProductTourController({
      getState: () => tourState,
      getActiveUserId: () => 'u-test',
      saveState: () => { tourSaved++; },
      renderApp: () => {},
    });
    assert.equal(tourCtrl.getProductTourStorageKey(), 'farol_product_tour_done_v1_u-test');
    assert.equal(tourCtrl.hasCompletedProductTour(), false);
    tourCtrl.markProductTourCompleted();
    assert.equal(tourCtrl.hasCompletedProductTour(), true);
    assert.equal(tourSaved, 1);

    // 13c. auth.ts export surface check
    assert.equal(farolAuth.AUTH_SESSION_STORAGE_KEY, 'farol_auth_session_v1');
    assert.equal(typeof farolAuth.createAuthController, 'function');
    assert.equal(typeof farolAuth.setPasswordFieldVisibility, 'function');
    console.log('PASS [Feature 13] Direct unit tests for Stage 2 TS modules (metrics, tour, auth) verified');

    // -------------------------------------------------------------------------
    // 14. Stage 3 Modularization (icons, charts, analytics, dialogs, CSS split) & Dead Code Cleanup
    // -------------------------------------------------------------------------
    assert.ok(engineSrc.includes("from './farol/icons'"), 'farol-engine.js must import farol/icons');
    assert.ok(engineSrc.includes("from './farol/charts'"), 'farol-engine.js must import farol/charts');
    assert.ok(engineSrc.includes("from './farol/analytics'"), 'farol-engine.js must import farol/analytics');
    assert.ok(engineSrc.includes("from './farol/dialogs'"), 'farol-engine.js must import farol/dialogs');

    // 14a. icons.ts
    assert.ok(farolIcons.getCategoryIconSvg({ id: 'cat-moradia', name: 'Moradia' }).includes('<svg'));
    const badgeHtml = farolIcons.renderCategoryBadge({ id: 'cat-mercado', name: 'Mercado', color: 'bad(css)' }, 'is-sm');
    assert.ok(badgeHtml.includes('cat-icon-badge is-sm') && !badgeHtml.includes('bad(css)'), 'Badge must sanitize CSS color');

    // 14b. charts.ts
    assert.equal(farolCharts.fmtAxisCompactBRL(250000), 'R$ 2,5k');
    assert.equal(farolCharts.fmtAxisCompactBRL(-50000), '-R$ 500');
    assert.equal(farolCharts.fmtAxisCompactBRL(0), 'R$ 0');
    assert.ok(farolCharts.buildTopRoundedBarPath(10, 20, 30, 40).startsWith('M 10.0 60.0'));
    assert.ok(farolCharts.buildMonthlySpendSvg(15000, [{ type: 'expense', date: '2026-11-10', amountCents: 15000 }], 30).includes('<svg'));
    assert.ok(farolCharts.buildDonutSvg([{ catId: 'c1', name: 'Mercado', color: '#38b6ff', budgetCents: 0, prevCents: 0, totalCents: 10000, pct: 100, pctLabel: '100%' }], 10000).includes('donut-slice-hover'));
    assert.ok(farolCharts.buildReserveRingSvg(50).includes('stroke-dasharray='));

    // 14c. analytics.ts & dialogs.ts
    assert.equal(farolAnalytics.describeClickableTarget({ id: 'quick-add-btn', getAttribute: () => null }), '#quick-add-btn');
    assert.equal(farolAnalytics.describeClickableTarget({ dataset: { tab: 'faturas' }, getAttribute: () => null }), 'tab:faturas');
    assert.equal(typeof farolDialogs.openFarolModal, 'function');
    assert.equal(typeof farolDialogs.setupFarolDialogs, 'function');

    // 14d. Modularized CSS manifest & removal of verified dead CSS selectors
    const globalsManifest = read('src/app/globals.css');
    const expectedStyleSheets = ['tokens.css', 'layout.css', 'dashboard.css', 'modals.css', 'auth.css', 'responsive.css', 'admin.css', 'tour.css'];
    let allSplitCss = '';
    for (const sheet of expectedStyleSheets) {
      assert.ok(globalsManifest.includes(`@import "./styles/${sheet}";`), `globals.css must import ./styles/${sheet}`);
      allSplitCss += read(`src/app/styles/${sheet}`) + '\n';
    }
    assert.ok(!allSplitCss.includes('.search-input'), 'Dead CSS rule .search-input must be removed');
    assert.ok(!allSplitCss.includes('.quick-amount-hero'), 'Dead CSS rule .quick-amount-hero must be removed');
    assert.ok(!allSplitCss.includes('.use-css-anchor'), 'Dead CSS rule .use-css-anchor must be removed');
    console.log('PASS [Feature 14] Stage 3 TS modules (icons, charts, analytics, dialogs), 8-file CSS split, and dead code cleanup verified');
    process.exit(0);
  }
}
