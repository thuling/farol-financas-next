import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { SESSION_COOKIE, verifyAuthenticatedSession } from '@/lib/session';

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1/interactions';
const GEMINI_MODEL = 'gemini-4-hydrogen';

const ALLOWED_MODES = new Set(['extract', 'categorize']);
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/markdown',
  'text/plain',
]);
const MAX_MERCHANTS = 150;
const MAX_RAW_TEXT_CHARS = 120_000;
const MAX_BASE64_CHARS = 8_500_000; // ~6 MB file ceiling

interface CategoryOption {
  id: string;
  name: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ ok: false, error: 'Payload inválido.' }, { status: 400 });
    }

    const userProvidedKey = String((body as Record<string, unknown>).apiKey || '').trim();
    const serverKey = String(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();

    // Exige sessão autenticada quando o banco está ativo ou quando a chamada consome a chave do servidor
    const prisma = getPrisma();
    if (prisma || (!userProvidedKey && serverKey)) {
      const auth = await verifyAuthenticatedSession(req.cookies.get(SESSION_COOKIE)?.value);
      if (auth.status !== 'ok') {
        return NextResponse.json(
          { ok: false, error: 'Faça login para utilizar a importação inteligente com IA.' },
          { status: 401 }
        );
      }
    }

    const apiKey = userProvidedKey || serverKey;
    if (!apiKey) {
      return NextResponse.json(
        {
          ok: false,
          needsApiKey: true,
          error:
            'Para ler arquivos PDF/Imagem ou categorizar com IA, informe sua chave da API Gemini (GEMINI_API_KEY) no campo abaixo ou configure nas variáveis da Vercel.',
        },
        { status: 400 }
      );
    }

    const mode = String((body as Record<string, unknown>).mode || 'extract');
    if (!ALLOWED_MODES.has(mode)) {
      return NextResponse.json({ ok: false, error: 'Modo inválido.' }, { status: 400 });
    }

    const rawCategories = (body as Record<string, unknown>).categories;
    const categories: CategoryOption[] = Array.isArray(rawCategories)
      ? rawCategories.slice(0, 60).map((c) => {
          const item = (c && typeof c === 'object' ? c : {}) as Record<string, unknown>;
          return {
            id: String(item.id || '').slice(0, 64),
            name: String(item.name || '').slice(0, 80),
          };
        })
      : [];

    const categoryListText = categories
      .map((c) => `- "${c.id}": ${c.name}`)
      .join('\n');

    // MODO 1: Categorização inteligente em lote para estabelecimentos desconhecidos do CSV
    if (mode === 'categorize') {
      const rawMerchants = (body as Record<string, unknown>).merchants;
      const merchants: string[] = Array.isArray(rawMerchants)
        ? rawMerchants
            .slice(0, MAX_MERCHANTS)
            .map((m) => String(m || '').trim().slice(0, 120))
            .filter(Boolean)
        : [];
      if (merchants.length === 0) {
        return NextResponse.json({ ok: true, mappings: {} });
      }

      const prompt = `Você é um classificador financeiro brasileiro especialista em faturas de cartão de crédito (Nubank, Mercado Pago, Itaú, Inter).
Associe cada estabelecimento da lista abaixo ao ID de categoria mais adequado entre as categorias disponíveis do usuário.

Categorias disponíveis (formato "id": Nome):
${categoryListText}

Estabelecimentos para classificar:
${merchants.map((m, idx) => `${idx + 1}. ${m}`).join('\n')}

Retorne um objeto JSON com a propriedade "items", onde cada item possui "merchant" (nome exato enviado) e "categoryId" (um dos IDs listados acima).`;

      const geminiRes = await fetch(GEMINI_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          model: GEMINI_MODEL,
          input: [{ type: 'text', text: prompt }],
          response_format: {
            type: 'text',
            mime_type: 'application/json',
            schema: {
              type: 'object',
              properties: {
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      merchant: { type: 'string' },
                      categoryId: { type: 'string' },
                    },
                    required: ['merchant', 'categoryId'],
                  },
                },
              },
              required: ['items'],
            },
          },
        }),
      });

      if (!geminiRes.ok) {
        console.error('[Farol Import] Gemini categorize HTTP error:', geminiRes.status);
        return NextResponse.json(
          { ok: false, error: `Falha ao consultar API Gemini (${geminiRes.status}).` },
          { status: 502 }
        );
      }

      const interaction = await geminiRes.json();
      const outputText = extractOutputText(interaction);
      const parsed = JSON.parse(outputText || '{"items":[]}');
      const mappings: Record<string, string> = {};
      if (Array.isArray(parsed.items)) {
        for (const it of parsed.items) {
          if (it && it.merchant && it.categoryId) {
            mappings[String(it.merchant)] = String(it.categoryId);
          }
        }
      }
      return NextResponse.json({ ok: true, mappings });
    }

    // MODO 2: Extração Multimodal OCR de Fatura em PDF, Imagem ou Texto/Markdown (.pdf, .png, .jpg, .webp, .md)
    const fileDataBase64 = String((body as Record<string, unknown>).fileDataBase64 || '');
    const rawTextContent = String((body as Record<string, unknown>).rawText || '');
    const mimeType = String((body as Record<string, unknown>).mimeType || 'application/pdf').trim().toLowerCase();
    const rawYear = String((body as Record<string, unknown>).defaultYear || '').trim();
    const defaultYear = /^\d{4}$/.test(rawYear) ? rawYear : String(new Date().getFullYear());

    if (!fileDataBase64 && !rawTextContent) {
      return NextResponse.json({ ok: false, error: 'Arquivo vazio ou não enviado.' }, { status: 400 });
    }
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json({ ok: false, error: 'Tipo de arquivo não suportado.' }, { status: 400 });
    }
    if (rawTextContent.length > MAX_RAW_TEXT_CHARS) {
      return NextResponse.json({ ok: false, error: 'Texto da fatura excede o limite de 120 KB.' }, { status: 413 });
    }
    if (fileDataBase64.length > MAX_BASE64_CHARS) {
      return NextResponse.json({ ok: false, error: 'Arquivo excede o limite de 6 MB.' }, { status: 413 });
    }

    const isPdf = mimeType === 'application/pdf';
    const isTextMd = Boolean(rawTextContent) || mimeType === 'text/markdown' || mimeType === 'text/plain';
    const mediaBlock = isTextMd
      ? {
          type: 'text',
          text: `Conteúdo da fatura em Markdown/Texto:\n\n${rawTextContent || Buffer.from(fileDataBase64, 'base64').toString('utf8').slice(0, MAX_RAW_TEXT_CHARS)}`,
        }
      : isPdf
        ? {
            type: 'document',
            data: fileDataBase64,
            mime_type: 'application/pdf',
          }
        : {
            type: 'image',
            data: fileDataBase64,
            mime_type: mimeType,
          };

    const extractionPrompt = `Você é um extrator contábil de alta precisão para faturas de cartão de crédito brasileiras (Nubank, Mercado Pago, Itaú, Inter, C6, Bradesco, Santander).
Analise o documento/imagem da fatura em anexo e extraia TODOS os lançamentos individuais (compras à vista, compras parceladas, estornos/créditos e pagamentos recebidos).

Regras obrigatórias de extração:
1. Data ("date"): Formato AAAA-MM-DD. Se na fatura constar apenas dia e mês (ex: "12 NOV" ou "12/11"), use o ano base ${defaultYear}.
2. Estabelecimento limpo ("cleanTitle"): Se o título contiver indicação de parcela (ex: "Mercado Livre - Parcela 2/10", "Amazon 03/06", "Loja X (2/4)"), remova o sufixo de parcela do nome e retorne apenas o nome limpo do estabelecimento em "cleanTitle", preenchendo "currentInstallment" = X e "totalInstallments" = Y. Se for à vista, use "currentInstallment": 1 e "totalInstallments": 1.
3. Valor numérico ("amount"): Número decimal positivo em reais (ex: 243.75 para R$ 243,75).
4. Tipo do item ("entryKind"):
   - "payment" se for pagamento da própria fatura (ex: "Pagamento recebido", "Pagamento em", "Pagamento de fatura").
   - "refund" se for estorno, reembolso, crédito na fatura, desconto de antecipação ou valor negativo abatendo a fatura.
   - "purchase" para compras e cobranças normais (incluindo IOF, seguro ou anuidade).
5. Categoria sugerida ("suggestedCategoryId"): Escolha o ID mais adequado da lista abaixo:
${categoryListText}`;

    const geminiRes = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        model: GEMINI_MODEL,
        input: [
          mediaBlock,
          { type: 'text', text: extractionPrompt },
        ],
        response_format: {
          type: 'text',
          mime_type: 'application/json',
          schema: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    date: { type: 'string' },
                    cleanTitle: { type: 'string' },
                    amount: { type: 'number' },
                    currentInstallment: { type: 'integer' },
                    totalInstallments: { type: 'integer' },
                    entryKind: {
                      type: 'string',
                      enum: ['purchase', 'refund', 'payment'],
                    },
                    suggestedCategoryId: { type: 'string' },
                  },
                  required: [
                    'date',
                    'cleanTitle',
                    'amount',
                    'currentInstallment',
                    'totalInstallments',
                    'entryKind',
                    'suggestedCategoryId',
                  ],
                },
              },
            },
            required: ['items'],
          },
        },
      }),
    });

    if (!geminiRes.ok) {
      console.error('[Farol Import] Gemini extract HTTP error:', geminiRes.status);
      return NextResponse.json(
        { ok: false, error: `Falha ao processar documento na API Gemini (${geminiRes.status}).` },
        { status: 502 }
      );
    }

    const interaction = await geminiRes.json();
    const outputText = extractOutputText(interaction);
    const parsed = JSON.parse(outputText || '{"items":[]}');

    return NextResponse.json({
      ok: true,
      items: Array.isArray(parsed.items) ? parsed.items : [],
    });
  } catch (err) {
    console.error('[Farol Import] Error:', err);
    return NextResponse.json(
      { ok: false, error: 'Erro interno ao processar fatura.' },
      { status: 500 }
    );
  }
}

function extractOutputText(interaction: Record<string, unknown>): string {
  if (typeof interaction.output_text === 'string' && interaction.output_text) {
    return interaction.output_text;
  }
  const steps = Array.isArray(interaction.steps) ? interaction.steps : [];
  for (let i = steps.length - 1; i >= 0; i--) {
    const step = steps[i] as Record<string, unknown>;
    if (step && step.type === 'model_output' && Array.isArray(step.content)) {
      for (const part of step.content as Array<Record<string, unknown>>) {
        if (part && part.type === 'text' && typeof part.text === 'string') {
          return part.text;
        }
      }
    }
  }
  return '';
}
