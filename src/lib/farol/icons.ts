import { safeCssColor } from './formatters';

export interface CategoryIconInput {
  id?: string;
  name?: string;
  color?: string;
}

export const PRECISION_ICONS = {
  edit: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px;margin-right:3px;"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`,
  upload: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px;margin-right:4px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>`,
  inflow: `<svg viewBox="0 0 24 24" fill="none" stroke="var(--green-emerald)" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="6" stroke-opacity="0.38"/><path d="M9 15 15 9"/><path d="M9.5 9H15v5.5"/></svg>`,
  outflow: `<svg viewBox="0 0 24 24" fill="none" stroke="var(--coral-red)" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="6" stroke-opacity="0.38"/><path d="m9 9 6 6"/><path d="M15 9.5V15H9.5"/></svg>`,
  alert: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
  shieldOk: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>`,
  info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
  repeat: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7"/><polyline points="21 3 21 9 15 9"/><path d="M12 7v5l3 2"/></svg>`,
  target: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/></svg>`,
  trendUp: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
  trendDown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>`,
};

export const CATEGORY_PRECISION_SVGS = {
  moradia: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9v11h14V9"/><path d="M9 20v-6h6v6"/></svg>`,
  mercado: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
  delivery: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4a8 8 0 0 0-8 8h16a8 8 0 0 0-8-8Z"/><path d="M2 15h20"/><path d="M12 2v2"/></svg>`,
  transporte: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 17h14v-5l-2-5H7l-2 5v5Z"/><circle cx="7.5" cy="17" r="2"/><circle cx="16.5" cy="17" r="2"/></svg>`,
  saude: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19.5 12.6 12 20l-7.5-7.4A5 5 0 0 1 12 5.6a5 5 0 0 1 7.5 7Z"/><path d="M8 12h2l1.5-2.5L13 14l1.5-2H16"/></svg>`,
  lazer: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2m0 10v2m0-8v2"/></svg>`,
  compras: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`,
  assinaturas: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="14" rx="3"/><polygon points="10 8.5 16 11 10 13.5 10 8.5"/><path d="M8 21h8"/></svg>`,
  educacao: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2Z"/><path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7Z"/></svg>`,
  receita: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="6" width="20" height="12" rx="3"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/></svg>`,
  invest: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12l4 6-10 12L2 9l4-6Z"/><path d="M2 9h20"/></svg>`,
  default: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>`,
};

export function getCategoryIconSvg(cat: CategoryIconInput | null | undefined): string {
  const id = String(cat?.id || '').toLowerCase();
  const name = String(cat?.name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const key = `${id} ${name}`;
  if (key.includes('moradia') || key.includes('casa') || key.includes('aluguel') || key.includes('condominio')) return CATEGORY_PRECISION_SVGS.moradia;
  if (key.includes('mercado') || key.includes('feira') || key.includes('padaria')) return CATEGORY_PRECISION_SVGS.mercado;
  if (key.includes('delivery') || key.includes('ifood') || key.includes('restaurante') || key.includes('comida') || key.includes('alimentacao')) return CATEGORY_PRECISION_SVGS.delivery;
  if (key.includes('transporte') || key.includes('uber') || key.includes('combustivel') || key.includes('carro')) return CATEGORY_PRECISION_SVGS.transporte;
  if (key.includes('saude') || key.includes('farmacia') || key.includes('medico') || key.includes('academia')) return CATEGORY_PRECISION_SVGS.saude;
  if (key.includes('lazer') || key.includes('cinema') || key.includes('viagem') || key.includes('show')) return CATEGORY_PRECISION_SVGS.lazer;
  if (key.includes('compra') || key.includes('shopping') || key.includes('roupa') || key.includes('presente')) return CATEGORY_PRECISION_SVGS.compras;
  if (key.includes('assinatura') || key.includes('streaming') || key.includes('internet')) return CATEGORY_PRECISION_SVGS.assinaturas;
  if (key.includes('educacao') || key.includes('curso') || key.includes('livro') || key.includes('faculdade')) return CATEGORY_PRECISION_SVGS.educacao;
  if (key.includes('receita') || key.includes('salario') || key.includes('renda') || key.includes('entrada')) return CATEGORY_PRECISION_SVGS.receita;
  if (key.includes('invest') || key.includes('aporte') || key.includes('patrimonio') || key.includes('reserva')) return CATEGORY_PRECISION_SVGS.invest;
  return CATEGORY_PRECISION_SVGS.default;
}

export function renderCategoryBadge(cat: CategoryIconInput | null | undefined, sizeCls = ''): string {
  const safeCol = safeCssColor(cat?.color);
  const cls = sizeCls ? `cat-icon-badge ${sizeCls}` : 'cat-icon-badge';
  return `<span class="${cls}" style="background:${safeCol}1f; color:${safeCol}; border:1px solid ${safeCol}42;">${getCategoryIconSvg(cat)}</span>`;
}
