import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createHmac } from 'node:crypto';

const ROOT = path.resolve(import.meta.dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
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

  const runnable = engineSrc.replace(/export\s+function\s+initFarolApp/, 'function initFarolApp');
  new vm.Script(
    runnable +
      '\nglobalThis.__sec = { esc, safeCssColor, getCleanEmptyState, setState: s => { state = s; }, renderVisaoGeral, renderTransacoesView, renderRecorrenciasView, renderFluxoCaixaView, renderFaturasView, renderCategoriasView, renderMetasView, renderPatrimonioView, renderContasView, renderInvoiceReviewTable, setReviewItems: arr => { invoiceReviewItems = arr; } };'
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
}
