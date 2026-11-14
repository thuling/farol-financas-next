import { NextRequest, NextResponse } from 'next/server';

const PLUGGY_BASE = 'https://api.pluggy.ai';

export async function POST(req: NextRequest) {
  const clientId = process.env.PLUGGY_CLIENT_ID;
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      {
        ok: false,
        error: 'PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET não configurados na Vercel.',
      },
      { status: 501 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const clientUserId = String(body.userId || 'user-default');

    const authRes = await fetch(`${PLUGGY_BASE}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, clientSecret }),
    });

    if (!authRes.ok) {
      return NextResponse.json({ ok: false, error: 'Falha ao autenticar na Pluggy.' }, { status: 502 });
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
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
