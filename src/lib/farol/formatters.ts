export const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
export const YM_RE = /^(\d{4})-(\d{2})$/;

export function esc(val: unknown): string {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function safeCssColor(val: unknown, fallback = '#38b6ff'): string {
  const s = String(val ?? '').trim();
  return /^#[0-9a-fA-F]{3,8}$/.test(s) ? s : fallback;
}

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function toCents(val: unknown): number {
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
  return Number.isNaN(num) ? 0 : Math.round(num * 100);
}

export function fromCents(cents: unknown): number {
  return (Number(cents) || 0) / 100;
}

export function fmtBRL(cents: unknown, showPlus = false): string {
  const num = Math.round(Number(cents) || 0);
  const absFormatted = (Math.abs(num) / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (num < 0) return `-R$ ${absFormatted}`;
  if (num > 0 && showPlus) return `+R$ ${absFormatted}`;
  return `R$ ${absFormatted}`;
}

export function fmtDateBR(isoDate: unknown): string {
  const s = String(isoDate ?? '');
  if (!s || !s.includes('-')) return s;
  return s.split('-').reverse().join('/');
}

export function fmtMonthLabel(ym: unknown): string {
  const safe = typeof ym === 'string' && ym ? ym : '2026-11';
  const [y, m] = safe.split('-').map(Number);
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  return `${months[(m || 1) - 1]} de ${y}`;
}

export function addMonthsYM(ym: unknown, delta: number): string {
  const safeYM = typeof ym === 'string' && YM_RE.test(ym) ? ym : '2026-11';
  const [y, m] = safeYM.split('-').map(Number);
  const d = new Date(y || 2026, ((m || 11) - 1) + (Number(delta) || 0), 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function monthDiffYM(ymA: unknown, ymB: unknown): number {
  const a = YM_RE.exec(String(ymA || ''));
  const b = YM_RE.exec(String(ymB || ''));
  if (!a || !b) return 999;
  return (parseInt(a[1], 10) - parseInt(b[1], 10)) * 12 + (parseInt(a[2], 10) - parseInt(b[2], 10));
}

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

export function clampDayToYM(ym: unknown, dayNum: unknown): string {
  const ymStr = String(ym || '');
  const m = YM_RE.exec(ymStr);
  if (!m) {
    return `${ymStr}-${String(Math.min(28, Math.max(1, Number(dayNum) || 10))).padStart(2, '0')}`;
  }
  const year = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  const maxDay = new Date(year, month, 0).getDate();
  const clamped = Math.min(maxDay, Math.max(1, parseInt(String(dayNum ?? ''), 10) || 10));
  return `${m[1]}-${m[2]}-${String(clamped).padStart(2, '0')}`;
}
