import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifyAuthenticatedSession } from '@/lib/session';

const PLUGGY_BASE = 'https://api.pluggy.ai';

export async function POST(req: NextRequest) {
  const auth = await verifyAuthenticatedSession(req.cookies.get(SESSION_COOKIE)?.value);
  if (auth.status === 'no_database') {
    return NextResponse.json({ ok: false, error: 'Banco de dados indisponível.' }, { status: 503 });
  }
  if (auth.status !== 'ok') {
    return NextResponse.json({ ok: false, error: 'Não autenticado.' }, { status: 401 });
  }

  const clientId = process.env.PLUGGY_CLIENT_ID;
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Integração Pluggy não configurada no servidor.',
      },
      { status: 501 }
    );
  }

  try {
    const clientUserId = auth.user.id;

    const authRes = await fetch(`${PLUGGY_BASE}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, clientSecret }),
    });

    if (!authRes.ok) {
      return NextResponse.json({ ok: false, error: 'Falha ao autenticar no provedor Open Finance.' }, { status: 502 });
    }
    const { apiKey } = (await authRes.json()) as { apiKey: string };

    const tokenRes = await fetch(`${PLUGGY_BASE}/connect_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify({
        options: {
          clientUserId,
          avoidDuplicates: true,
        },
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.json({ ok: false, error: 'Erro ao gerar connectToken.' }, { status: 502 });
    }

    const tokenData = (await tokenRes.json()) as { accessToken: string };
    return NextResponse.json({ ok: true, accessToken: tokenData.accessToken });
  } catch (err) {
    console.error('[Farol Pluggy Connect] Error:', err);
    return NextResponse.json({ ok: false, error: 'Erro interno ao conectar Open Finance.' }, { status: 500 });
  }
}
