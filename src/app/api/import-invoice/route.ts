import { NextRequest, NextResponse } from 'next/server';

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1/interactions';
const GEMINI_MODEL = 'gemini-4-hydrogen';

interface CategoryOption {
  id: string;
  name: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const mode = String(body.mode || 'extract');
    const apiKey = String(
      body.apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || ''
    ).trim();

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

    const categories: CategoryOption[] = Array.isArray(body.categories)
      ? body.categories.map((c: Record<string, unknown>) => ({
          id: String(c.id || ''),
          name: String(c.name || ''),
        }))
      : [];

    const categoryListText = categories
      .map((c) => `- "${c.id}": ${c.name}`)
      .join('\n');

    // MODO 1: Categorização inteligente em lote para estabelecimentos desconhecidos do CSV
    if (mode === 'categorize') {
      const merchants: string[] = Array.isArray(body.merchants) ? body.merchants : [];
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
        const errText = await geminiRes.text();
        return NextResponse.json(
          { ok: false, error: `Erro na API Gemini (${geminiRes.status}): ${errText.slice(0, 220)}` },
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
    const fileDataBase64 = String(body.fileDataBase64 || '');
    const rawTextContent = String(body.rawText || '');
    const mimeType = String(body.mimeType || 'application/pdf');
    const defaultYear = String(body.defaultYear || new Date().getFullYear());

    if (!fileDataBase64 && !rawTextContent) {
      return NextResponse.json(
        { ok: false, error: 'Arquivo vazio ou não enviado.' },
        { status: 400 }
      );
    }

    const isPdf = mimeType === 'application/pdf';
    const isTextMd = Boolean(rawTextContent) || mimeType === 'text/markdown' || mimeType === 'text/plain';
    const mediaBlock = isTextMd
      ? {
          type: 'text',
          text: `Conteúdo da fatura em Markdown/Texto:\n\n${rawTextContent || Buffer.from(fileDataBase64, 'base64').toString('utf8')}`,
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
      const errText = await geminiRes.text();
      return NextResponse.json(
        { ok: false, error: `Falha ao processar documento na API Gemini (${geminiRes.status}): ${errText.slice(0, 240)}` },
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
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Erro interno ao processar fatura.' },
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
