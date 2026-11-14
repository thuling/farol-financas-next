import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

interface PluggyWebhookPayload {
  event?: string;
  itemId?: string;
  clientUserId?: string;
  transactions?: Array<{
    id: string;
    description: string;
    amount: number;
    date: string;
    type?: 'DEBIT' | 'CREDIT';
  }>;
}

export async function POST(req: NextRequest) {
  const secret = process.env.PLUGGY_WEBHOOK_SECRET;
  if (secret) {
    const headerSecret = req.headers.get('x-pluggy-signature') || req.nextUrl.searchParams.get('secret');
    if (headerSecret !== secret) {
      return NextResponse.json({ ok: false, error: 'Unauthorized webhook' }, { status: 401 });
    }
  }

  const payload = (await req.json().catch(() => ({}))) as PluggyWebhookPayload;
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ ok: true, received: true, persisted: false });
  }

  const userId = payload.clientUserId || 'user-default';
  const txs = payload.transactions || [];
  let imported = 0;

  for (const tx of txs) {
    const amountCents = Math.round(Math.abs(Number(tx.amount) || 0) * 100);
    if (amountCents <= 0) continue;

    await prisma.transaction.upsert({
      where: { externalId: tx.id },
      create: {
        id: `of-${tx.id}`,
        userId,
        type: tx.type === 'CREDIT' ? 'income' : 'expense',
        amountCents,
        description: tx.description || 'Open Finance',
        tag: 'open-finance',
        categoryId: 'cat-compras',
        accountId: 'acc-nubank',
        date: (tx.date || new Date().toISOString()).slice(0, 10),
        method: 'Open Finance',
        externalId: tx.id,
      },
      update: {},
    });
    imported++;
  }

  return NextResponse.json({ ok: true, event: payload.event || 'unknown', imported });
}
