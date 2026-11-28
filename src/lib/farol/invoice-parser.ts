import { getTodayISO } from './formatters';

export interface CategoryLike {
  id: string;
  name: string;
  archived?: boolean;
  rules?: string[];
}

export type EntryKind = 'purchase' | 'refund' | 'payment';

export interface MerchantClassification {
  categoryId: string;
  matchedByRule: boolean;
}

export interface ParsedInvoiceItem {
  id: string;
  include: boolean;
  date: string;
  cleanTitle: string;
  currentInstallment: number;
  totalInstallments: number;
  amount: number;
  entryKind: EntryKind;
  categoryId: string;
  matchedByRule: boolean;
}

export interface LocalInvoiceParserOptions {
  categories?: CategoryLike[];
  defaultYM?: string;
}

export const LOCAL_MERCHANT_KEYWORDS = [
  { catName: /transporte/i, fallbackId: 'cat-transporte', words: ['uber', '99app', '99*', '99 pop', 'localiza', 'movida', 'unidas', 'sem parar', 'veloe', 'conectcar', 'posto', 'ipiranga', 'shell', 'petrobras', 'br mania', 'estapar', 'indigo', 'azul linhas', 'gol linhas', 'latam', 'onibus', 'metro', 'pedagio'] },
  { catName: /delivery/i, fallbackId: 'cat-delivery', words: ['ifood', 'ifd*', 'ze delivery', 'rappi', '99food', 'aiqfome', 'james delivery'] },
  { catName: /alimenta|mercado/i, fallbackId: 'cat-alimentacao', words: ['restaurante', 'lanchonete', 'padaria', 'panificadora', 'pizzaria', 'burger', 'mcdonalds', 'mc donalds', 'bk ', 'outback', 'madero', 'coco bambu', 'supermercado', 'mercado', 'atacadao', 'assai', 'carrefour', 'pao de acucar', 'extra ', 'mateus', 'zaffari', 'angeloni', 'hortifruti', 'acougue', 'cafe', 'starbucks', 'cacau show'] },
  { catName: /assinatura|streaming/i, fallbackId: 'cat-assinaturas', words: ['netflix', 'spotify', 'amazon prime', 'prime video', 'disney', 'hbomax', 'max.com', 'youtube', 'apple.com/bill', 'google *', 'icloud', 'microsoft', 'chatgpt', 'openai', 'claude', 'canva', 'adobe', 'globoplay', 'audible', 'kindle'] },
  { catName: /internet|telefon/i, fallbackId: 'cat-internet', words: ['claro', 'vivo', 'tim', 'oi ', 'algar', 'brisanet', 'starlink', 'net servicos', 'sky', 'desktop internet'] },
  { catName: /sa[uú]de|farm[aá]cia/i, fallbackId: 'cat-saude', words: ['drogasil', 'droga raia', 'drogaria', 'pague menos', 'panvel', 'farmacia', 'unimed', 'hapvida', 'laboratorio', 'fleury', 'clinica', 'hospital', 'odonto', 'consulta', 'exame'] },
  { catName: /moradia|casa/i, fallbackId: 'cat-moradia', words: ['enel', 'cemig', 'copel', 'cpfl', 'celpe', 'neoenergia', 'light', 'sabesp', 'sanepar', 'condominio', 'aluguel', 'quintoandar', 'leroy merlin', 'telhanorte', 'gas '] },
  { catName: /educa/i, fallbackId: 'cat-educacao', words: ['alura', 'udemy', 'coursera', 'rocketseat', 'faculdade', 'escola', 'universidade', 'livraria', 'saraiva', 'leitura', 'curso'] },
  { catName: /compras|shopping/i, fallbackId: 'cat-compras', words: ['mercado livre', 'mercadolivre', 'meli', 'mercadopago*', 'mp *', 'amazon', 'shopee', 'shein', 'aliexpress', 'magalu', 'magazine luiza', 'casas bahia', 'fast shop', 'kabum', 'pichau', 'renner', 'riachuelo', 'cea', 'zara', 'centauro', 'nike', 'adidas', 'decathlon', ' Zara'] },
  { catName: /lazer/i, fallbackId: 'cat-lazer', words: ['ingresso', 'sympla', 'eventim', 'cinemark', 'cinepolis', 'uci', 'steam', 'playstation', 'xbox', 'nintendo', 'bar ', 'pub ', 'hotel', 'airbnb', 'booking'] },
];

export const PT_MONTH_MAP: Record<string, string> = {
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
  dez: '12', dezembro: '12',
};

export function matchCategoryByRules(description: unknown, categories: CategoryLike[] = []): string | null {
  if (!description) return null;
  const text = String(description).toLowerCase();
  for (const cat of categories) {
    if (!cat || cat.archived || !Array.isArray(cat.rules)) continue;
    for (const kw of cat.rules) {
      const k = String(kw || '').trim().toLowerCase();
      if (k && text.includes(k)) return cat.id;
    }
  }
  return null;
}

export function classifyMerchantLocally(
  titleText: unknown,
  categories: CategoryLike[] = []
): MerchantClassification {
  const clean = String(titleText || '').trim();
  if (!clean) {
    return { categoryId: categories[0]?.id || 'cat-delivery', matchedByRule: false };
  }
  // 1. Regras personalizadas do usuário em Categorias
  const userRuleCatId = matchCategoryByRules(clean, categories);
  if (userRuleCatId) {
    return { categoryId: userRuleCatId, matchedByRule: true };
  }
  // 2. Dicionário local de estabelecimentos brasileiros conhecidos
  const lower = clean.toLowerCase();
  for (const group of LOCAL_MERCHANT_KEYWORDS) {
    if (group.words.some((w) => lower.includes(w.toLowerCase()))) {
      const targetCat = categories.find(
        (c) => !c.archived && (c.id === group.fallbackId || group.catName.test(c.name))
      );
      if (targetCat) {
        return { categoryId: targetCat.id, matchedByRule: true };
      }
    }
  }
  const defaultCat =
    categories.find((c) => !c.archived && /compras|outros/i.test(c.name)) ||
    categories.find((c) => !c.archived) ||
    categories[0];
  return { categoryId: defaultCat?.id || 'cat-delivery', matchedByRule: false };
}

export function cleanBrazilianAmountToFloat(rawStr: unknown): number {
  if (rawStr === undefined || rawStr === null) return NaN;
  if (typeof rawStr === 'number') return rawStr;
  let s = String(rawStr).replace(/R\$/gi, '').replace(/\s+/g, '').trim();
  if (!s) return NaN;
  if (s.includes(',') && s.includes('.')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  }
  return parseFloat(s);
}

export function extractInstallmentInfoFromTitle(rawTitle: unknown): {
  cleanTitle: string;
  currentInstallment: number;
  totalInstallments: number;
} {
  const title = String(rawTitle || '').trim();
  const primaryRegex = /^(.*?)\s*-\s*Parcela\s+(\d+)\/(\d+)$/i;
  const m1 = title.match(primaryRegex);
  if (m1) {
    const cur = Math.max(1, parseInt(m1[2], 10) || 1);
    const tot = Math.max(cur, parseInt(m1[3], 10) || 1);
    return { cleanTitle: m1[1].trim() || title, currentInstallment: cur, totalInstallments: tot };
  }
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

export function detectEntryKind(
  rawTitle: unknown,
  floatAmount: number,
  isCreditCardBill = true
): EntryKind {
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

export function stripMarkdownFormatting(str: unknown): string {
  return String(str || '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`~]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeTextAccents(str: unknown): string {
  return String(str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export function findCategoryByExplicitName(
  rawCatName: unknown,
  categories: CategoryLike[] = []
): string | null {
  const norm = normalizeTextAccents(stripMarkdownFormatting(rawCatName));
  if (!norm || norm === '-' || norm === 'outros') return null;
  const exact = categories.find((c) => !c.archived && normalizeTextAccents(c.name) === norm);
  if (exact) return exact.id;
  const partial = categories.find(
    (c) =>
      !c.archived &&
      (normalizeTextAccents(c.name).includes(norm) || norm.includes(normalizeTextAccents(c.name)))
  );
  return partial ? partial.id : null;
}

export function parseFlexibleDateBR(rawStr: unknown, fallbackYM: string): string | null {
  const clean = stripMarkdownFormatting(rawStr);
  const [fbYear] = (fallbackYM || '2026-11').split('-');

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

  // 4. DD/MM
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

export function isSummaryOrTotalLine(text: unknown): boolean {
  const norm = normalizeTextAccents(text);
  return /^(total\b|subtotal\b|valor total|total da fatura|total de compras|limite\s+(total|disponivel)|saldo\s+(anterior|atual)|resumo\s+da\s+fatura|melhor\s+dia|fechamento|vencimento)/.test(norm);
}

export function parseInvoiceCSVOrOFXLocally(
  rawText: unknown,
  fileName = '',
  options: LocalInvoiceParserOptions = {}
): ParsedInvoiceItem[] {
  const text = String(rawText || '').trim();
  if (!text) return [];
  const categories = options.categories || [];
  const defaultYM = options.defaultYM || getTodayISO().slice(0, 7);
  const out: ParsedInvoiceItem[] = [];

  // Suporte OFX
  if (/<STMTTRN>/i.test(text) || fileName.toLowerCase().endsWith('.ofx')) {
    const blocks = text.split(/<STMTTRN>/i).slice(1);
    blocks.forEach((blk, idx) => {
      const amtMatch = blk.match(/<TRNAMT>\s*([+-]?[\d.,\s-]+)/i);
      const dtMatch = blk.match(/<DTPOSTED>\s*(\d{8})/i);
      const memoMatch = blk.match(/<(?:MEMO|NAME)>\s*([^<\r\n]+)/i);
      if (!amtMatch) return;
      const valFloat = cleanBrazilianAmountToFloat(amtMatch[1]);
      if (Number.isNaN(valFloat) || valFloat === 0) return;
      let dateISO = `${defaultYM}-10`;
      if (dtMatch && dtMatch[1].length === 8) {
        const d = dtMatch[1];
        dateISO = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
      }
      const rawTitle = memoMatch ? memoMatch[1].trim() : `Lançamento #${idx + 1}`;
      const inst = extractInstallmentInfoFromTitle(rawTitle);
      const entryKind = detectEntryKind(rawTitle, valFloat, false);
      const cls = classifyMerchantLocally(inst.cleanTitle, categories);
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
        matchedByRule: cls.matchedByRule,
      });
    });
    return out;
  }

  // Parse CSV (ex: Nubank date,title,amount ou date,category,title,amount)
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const sep = lines[0].includes(';') ? ';' : ',';
  const splitCSV = (line: string): string[] => {
    const cols: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (ch === sep && !inQuotes) {
        cols.push(cur.trim());
        cur = '';
        continue;
      }
      cur += ch;
    }
    cols.push(cur.trim());
    return cols;
  };

  const headers = splitCSV(lines[0]).map((h) => h.toLowerCase());
  const dateIdx = headers.findIndex((h) => /^date$|^data$|release_date|dt/.test(h));
  const titleIdx = headers.findIndex((h) => /^title$|descri|estabelecimento|hist|memo|nome/.test(h));
  const amtIdx = headers.findIndex((h) => /^amount$|^valor$|value|net_amount|quantia/.test(h));

  const isNubankCardCSV = headers.includes('date') && headers.includes('title') && headers.includes('amount');

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSV(lines[i]);
    if (cols.length < 2) continue;
    const rawDate = cols[dateIdx >= 0 ? dateIdx : 0] || '';
    const rawTitle = cols[titleIdx >= 0 ? titleIdx : Math.min(1, cols.length - 1)] || `Item #${i}`;
    const rawAmt = cols[amtIdx >= 0 ? amtIdx : cols.length - 1] || '';

    const valFloat = cleanBrazilianAmountToFloat(rawAmt);
    if (Number.isNaN(valFloat) || valFloat === 0) continue;

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
    const cls = classifyMerchantLocally(inst.cleanTitle, categories);

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
      matchedByRule: cls.matchedByRule,
    });
  }
  return out;
}

export function parseInvoiceMarkdownLocally(
  rawText: unknown,
  options: LocalInvoiceParserOptions = {}
): ParsedInvoiceItem[] {
  const lines = String(rawText || '').split(/\r?\n/);
  const categories = options.categories || [];
  const defaultYM = options.defaultYM || getTodayISO().slice(0, 7);
  let contextYM = defaultYM;
  let contextDate: string | null = null;
  let sectionForcedKind: EntryKind | null = null;
  const out: ParsedInvoiceItem[] = [];

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

  let tableCols: {
    dateIdx: number;
    titleIdx: number;
    instIdx: number;
    catIdx: number;
    typeIdx: number;
    amtIdx: number;
  } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();
    if (!trimmed) {
      tableCols = null;
      continue;
    }

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

    if (trimmed.startsWith('|') || (trimmed.split('|').length >= 3 && !/^[-*+]\s/.test(trimmed))) {
      const rawCells = trimmed
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((c) => stripMarkdownFormatting(c));

      if (rawCells.every((c) => /^:?-{2,}:?$/.test(c.replace(/\s/g, '')) || c === '')) {
        continue;
      }

      const normCells = rawCells.map((c) => normalizeTextAccents(c));
      const looksLikeHeader =
        normCells.some((c) => /^(data|date|dt)$/.test(c)) ||
        (normCells.some((c) => /descri|estabelecimento|title|loja|item|nome|historico/.test(c)) &&
          normCells.some((c) => /valor|amount|preco|total/.test(c)));

      if (looksLikeHeader) {
        tableCols = {
          dateIdx: normCells.findIndex((c) => /data|date|dt/.test(c)),
          titleIdx: normCells.findIndex((c) => /descri|estabelecimento|title|loja|item|nome|historico/.test(c)),
          instIdx: normCells.findIndex((c) => /parcela|prestacao/.test(c)),
          catIdx: normCells.findIndex((c) => /categ/.test(c)),
          typeIdx: normCells.findIndex((c) => /^tipo$|classifica/.test(c)),
          amtIdx: normCells.findIndex((c) => /valor|amount|preco|total/.test(c)),
        };
        continue;
      }

      let cellDate = tableCols && tableCols.dateIdx >= 0 ? rawCells[tableCols.dateIdx] : '';
      let cellTitle = tableCols && tableCols.titleIdx >= 0 ? rawCells[tableCols.titleIdx] : '';
      const cellInst = tableCols && tableCols.instIdx >= 0 ? rawCells[tableCols.instIdx] : '';
      const cellCat = tableCols && tableCols.catIdx >= 0 ? rawCells[tableCols.catIdx] : '';
      const cellType = tableCols && tableCols.typeIdx >= 0 ? rawCells[tableCols.typeIdx] : '';
      let cellAmt = tableCols && tableCols.amtIdx >= 0 ? rawCells[tableCols.amtIdx] : '';

      if (!tableCols) {
        for (const c of rawCells) {
          if (!cellDate && parseFlexibleDateBR(c, contextYM)) {
            cellDate = c;
            continue;
          }
          if (!cellAmt && /[+-]?\s*(?:R\$\s*)?\d[\d.]*,\d{2}/.test(c)) {
            cellAmt = c;
            continue;
          }
          if (!cellTitle && c.length > 1 && !/^\d+\/\d+$/.test(c)) {
            cellTitle = c;
          }
        }
        if (!cellAmt) cellAmt = rawCells[rawCells.length - 1] || '';
      }

      if (!cellTitle || isSummaryOrTotalLine(cellTitle)) continue;
      const amtMatch = cellAmt.match(/[+-]?\s*(?:R\$\s*)?[\d.]+\s*,\s*\d{2}|[+-]?\s*(?:R\$\s*)?\d+(?:\.\d{2})?/);
      const valFloat = cleanBrazilianAmountToFloat(amtMatch ? amtMatch[0] : cellAmt);
      if (Number.isNaN(valFloat) || valFloat === 0) continue;

      const parsedDate = parseFlexibleDateBR(cellDate, contextYM) || contextDate || `${contextYM}-10`;
      const inst = extractInstallmentInfoFromTitle(cellTitle);

      if (cellInst && inst.totalInstallments === 1) {
        const instColMatch = cellInst.match(/(\d{1,2})\s*(?:\/|de)\s*(\d{1,2})/i);
        if (instColMatch) {
          inst.currentInstallment = Math.max(1, parseInt(instColMatch[1], 10) || 1);
          inst.totalInstallments = Math.max(inst.currentInstallment, parseInt(instColMatch[2], 10) || 1);
        }
      }

      let entryKind: EntryKind = sectionForcedKind || detectEntryKind(cellTitle + ' ' + cellType, valFloat, true);
      if (/estorno|reembolso/i.test(cellType)) entryKind = 'refund';
      if (/pagamento/i.test(cellType)) entryKind = 'payment';

      const explicitCatId = cellCat ? findCategoryByExplicitName(cellCat, categories) : null;
      const cls = classifyMerchantLocally(inst.cleanTitle, categories);

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
        matchedByRule: Boolean(explicitCatId) || cls.matchedByRule,
      });
      continue;
    }

    tableCols = null;
    let lineBody = trimmed
      .replace(/^[-*+]\s+\[[ xX]\]\s+/, '')
      .replace(/^[-*+]\s+/, '')
      .replace(/^\d+[.)]\s+/, '');
    lineBody = stripMarkdownFormatting(lineBody);

    if (!lineBody || isSummaryOrTotalLine(lineBody)) continue;

    const standaloneDate = parseFlexibleDateBR(lineBody, contextYM);
    if (standaloneDate && lineBody.length <= 22 && !/\d,\d{2}/.test(lineBody)) {
      contextDate = standaloneDate;
      continue;
    }

    const moneyMatches = [...lineBody.matchAll(/([+-]?\s*(?:R\$\s*)?\d{1,3}(?:\.\d{3})*,\d{2}|[+-]?\s*R\$\s*\d+,\d{2}|[+-]?\s*\d+\.\d{2}(?!\d))/gi)];
    let pickedMoney = moneyMatches.length > 0 ? moneyMatches[moneyMatches.length - 1][0] : null;
    const pickedLineDate = parseFlexibleDateBR(lineBody, contextYM);
    let titleRemainder = lineBody;

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
    if (Number.isNaN(valFloat) || valFloat === 0) continue;

    titleRemainder = titleRemainder.replace(pickedMoney, ' ');
    if (pickedLineDate) {
      titleRemainder = titleRemainder
        .replace(/\b\d{4}[-/]\d{2}[-/]\d{2}\b/, ' ')
        .replace(/\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/, ' ')
        .replace(/\b\d{1,2}\/\d{1,2}\b/, ' ')
        .replace(/\b\d{1,2}\s*(?:de\s+)?(?:jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)[a-z]*(?:\s*(?:de\s+)?\d{4})?\b/i, ' ');
    }

    let explicitCatId: string | null = null;
    const catTagMatch = titleRemainder.match(/(?:\(|\[)([A-Za-zÀ-ÿ\s/&]+)(?:\)|\])\s*$/);
    if (catTagMatch && !/^\d+\/\d+$/.test(catTagMatch[1])) {
      const foundCat = findCategoryByExplicitName(catTagMatch[1], categories);
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
    const cls = classifyMerchantLocally(inst.cleanTitle, categories);

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
      matchedByRule: Boolean(explicitCatId) || cls.matchedByRule,
    });
  }

  return out;
}
