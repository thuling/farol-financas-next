import { esc, fmtBRL, safeCssColor } from './formatters';
import type { CategoryDistributionItem } from './metrics';

export interface SvgPoint {
  x: number;
  y: number;
}

export interface ChartTransactionLike {
  type?: string;
  date?: string;
  amountCents?: number;
}

export function buildSmoothSvgPath(pts: SvgPoint[]): string {
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

export function buildMonthlySpendSvg(
  expenseCents: number,
  txs: ChartTransactionLike[] = [],
  daysInMonth = 30
): string {
  const numBuckets = 15;
  const buckets = Array.from({ length: numBuckets }, (_, i) => {
    const day = Math.min(daysInMonth, Math.max(1, Math.round(1 + (i / (numBuckets - 1)) * (daysInMonth - 1))));
    const cumCents = txs
      .filter((t) => t.type === 'expense' && parseInt((t.date || '').split('-')[2] || '1', 10) <= day)
      .reduce((s, t) => s + (Number(t.amountCents) || 0), 0);
    return { day, cumCents };
  });
  const maxCum = Math.max(expenseCents, ...buckets.map((b) => b.cumCents), 100);
  const hasSpend = expenseCents > 0;

  const pts = buckets.map((b, idx) => {
    const x = 4 + (idx / (numBuckets - 1)) * 284;
    const y = hasSpend ? 56 - (b.cumCents / maxCum) * 40 : 56;
    return { x, y, day: b.day, cumCents: b.cumCents };
  });

  const pathLine = buildSmoothSvgPath(pts);
  const pathArea = `${pathLine} L 288 68 L 4 68 Z`;
  const endY = pts[pts.length - 1].y;

  const zones = pts
    .map((p, idx) => {
      const x = idx * (296 / numBuckets);
      const w = 296 / numBuckets;
      return `<rect x="${x.toFixed(1)}" y="0" width="${w.toFixed(1)}" height="72" fill="transparent"
      class="chart-hover-zone"
      data-tip-title="Até dia ${p.day} (acumulado)"
      data-tip-val="${fmtBRL(p.cumCents)}" />`;
    })
    .join('');

  return `
    <svg width="100%" viewBox="0 0 296 72" style="display:block; height:auto; max-height:80px;">
      <defs>
        <linearGradient id="coralArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.32"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0.02"/>
        </linearGradient>
      </defs>
      <line x1="0" y1="16" x2="296" y2="16" stroke="rgba(255,255,255,0.16)" stroke-width="1"/>
      <line x1="0" y1="36" x2="296" y2="36" stroke="rgba(255,255,255,0.16)" stroke-width="1"/>
      <line x1="0" y1="56" x2="296" y2="56" stroke="rgba(255,255,255,0.16)" stroke-width="1"/>
      <path d="${pathArea}" fill="url(#coralArea)"/>
      <path d="${pathLine}" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" class="anim-spark-draw"/>
      <circle cx="288" cy="${endY.toFixed(1)}" r="4.5" fill="#bef264" stroke="#0d6efd" stroke-width="1.8"/>
      ${zones}
    </svg>
  `;
}

export function buildDonutSvg(
  distribution: CategoryDistributionItem[],
  totalExpenseCents: number
): string {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;

  if (!totalExpenseCents || distribution.length === 0) {
    return `
      <svg width="146" height="146" viewBox="0 0 146 146">
        <circle cx="73" cy="73" r="${radius}" fill="none" stroke="var(--ring-track, rgba(15,35,50,0.12))" stroke-width="18"
          class="donut-slice-hover" data-tip-title="Sem gastos" data-tip-val="R$ 0,00 (0%)"/>
      </svg>
    `;
  }

  let offset = 0;
  const segments = distribution
    .map((d) => {
      const frac = d.totalCents / totalExpenseCents;
      const dash = frac * circumference;
      const seg = `<circle cx="73" cy="73" r="${radius}" fill="none" stroke="${safeCssColor(d.color)}" stroke-width="18"
      class="donut-slice-hover"
      data-tip-title="${esc(d.name)} (${d.pct}%)"
      data-tip-val="${fmtBRL(d.totalCents)}"
      stroke-dasharray="${dash} ${circumference - dash}"
      stroke-dashoffset="${-offset}"
      transform="rotate(-90 73 73)" />`;
      offset += dash;
      return seg;
    })
    .join('');

  return `
    <svg width="146" height="146" viewBox="0 0 146 146" class="anim-donut-in">
      <circle cx="73" cy="73" r="${radius}" fill="none" stroke="var(--ring-track, rgba(15,35,50,0.08))" stroke-width="18"/>
      ${segments}
      <line x1="73" y1="8" x2="73" y2="27" stroke="var(--bg-card-solid, #ffffff)" stroke-width="2.5" style="pointer-events:none;"/>
    </svg>
  `;
}

export function buildReserveRingSvg(pct: number): string {
  const r = 31;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  return `
    <svg width="78" height="78" viewBox="0 0 78 78" class="anim-donut-in">
      <circle cx="39" cy="39" r="${r}" fill="none" stroke="var(--ring-track, rgba(15,35,50,0.12))" stroke-width="7"/>
      <circle cx="39" cy="39" r="${r}" fill="none" stroke="#0d6efd" stroke-width="7"
        stroke-dasharray="${dash} ${c - dash}" transform="rotate(-90 39 39)" stroke-linecap="round"/>
      <circle cx="39" cy="8" r="3.8" fill="#0d6efd"/>
    </svg>
  `;
}

export function buildAccumulatedAreaSvg(
  _expenseCents: number,
  mode: string,
  _partialResultCents = 0,
  txs: ChartTransactionLike[] = [],
  daysInMonth = 30
): string {
  const color = mode === 'saldo' ? '#49b6eb' : '#f16364';
  const labelPrefix = mode === 'saldo' ? 'Saldo' : mode === 'por-dia' ? 'Média/dia' : 'Acumulado';

  const numSteps = 10;
  const series = Array.from({ length: numSteps }, (_, idx) => {
    const dayEnd = Math.min(daysInMonth, Math.max(1, Math.round(1 + (idx / (numSteps - 1)) * (daysInMonth - 1))));
    const expUntil = txs
      .filter((t) => t.type === 'expense' && parseInt((t.date || '').split('-')[2] || '1', 10) <= dayEnd)
      .reduce((s, t) => s + (Number(t.amountCents) || 0), 0);
    const incUntil = txs
      .filter((t) => t.type === 'income' && parseInt((t.date || '').split('-')[2] || '1', 10) <= dayEnd)
      .reduce((s, t) => s + (Number(t.amountCents) || 0), 0);
    const valCents =
      mode === 'saldo'
        ? incUntil - expUntil
        : mode === 'por-dia'
          ? Math.round(expUntil / Math.max(1, dayEnd))
          : expUntil;
    return { dayEnd, valCents };
  });

  const allVals = series.map((s) => s.valCents);
  const minVal = Math.min(0, ...allVals);
  const maxVal = Math.max(100, ...allVals);
  const span = Math.max(1, maxVal - minVal);
  const hasAny = txs.length > 0;

  const pts = series.map((s, idx) => {
    const x = 4 + (idx / (numSteps - 1)) * 548;
    const y = hasAny ? 42 - ((s.valCents - minVal) / span) * 28 : 42;
    return { x, y, dayEnd: s.dayEnd, valCents: s.valCents };
  });

  const pathLine = buildSmoothSvgPath(pts);
  const endY = pts[pts.length - 1].y;
  const colW = 560 / numSteps;

  const hoverZones = pts
    .map(
      (p, idx) => `
    <rect x="${(idx * colW).toFixed(1)}" y="0" width="${colW.toFixed(1)}" height="52" fill="transparent"
      class="chart-hover-zone"
      data-tip-title="Até dia ${p.dayEnd} (${labelPrefix})"
      data-tip-val="${fmtBRL(p.valCents)}" />
  `
    )
    .join('');

  return `
    <svg width="100%" viewBox="0 0 560 52" style="display:block; height:auto; max-height:62px;">
      <line x1="0" y1="44" x2="560" y2="44" stroke="var(--chart-grid, rgba(15,35,50,0.08))" stroke-width="1"/>
      <path d="${pathLine}" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" class="anim-spark-draw"/>
      <circle cx="552" cy="${endY.toFixed(1)}" r="4" fill="#0d6efd" stroke="var(--bg-card-solid, #ffffff)" stroke-width="1.4"/>
      ${hoverZones}
    </svg>
  `;
}

export function fmtAxisCompactBRL(cents: number): string {
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

export function buildTopRoundedBarPath(
  x: number,
  yTop: number,
  w: number,
  h: number,
  r = 7,
  isNegative = false
): string {
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
      'Z',
    ].join(' ');
  }
  return [
    `M ${x.toFixed(1)} ${yTop.toFixed(1)}`,
    `L ${xRight.toFixed(1)} ${yTop.toFixed(1)}`,
    `L ${xRight.toFixed(1)} ${(yBottom - radius).toFixed(1)}`,
    `Q ${xRight.toFixed(1)} ${yBottom.toFixed(1)} ${(xRight - radius).toFixed(1)} ${yBottom.toFixed(1)}`,
    `L ${(x + radius).toFixed(1)} ${yBottom.toFixed(1)}`,
    `Q ${x.toFixed(1)} ${yBottom.toFixed(1)} ${x.toFixed(1)} ${(yBottom - radius).toFixed(1)}`,
    'Z',
  ].join(' ');
}
