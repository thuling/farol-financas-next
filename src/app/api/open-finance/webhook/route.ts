import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { getPrisma } from '@/lib/prisma';
import { ensureDbSchema } from '@/lib/db-init';

interface PluggyWebhookPayload {
  event?: string;
  itemId?: string;
  clientUserId?: string;
  transactions?: Array<{
    id?: string;
    description?: string;
    amount?: number;
    date?: string;
    type?: 'DEBIT' | 'CREDIT';
  }>;
}

export async function POST(req: NextRequest) {
  const secret = process.env.PLUGGY_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: 'Webhook Open Finance não configurado no servidor.' },
      { status: 503 }
    );
  }

  const headerSecret = req.headers.get('x-pluggy-signature') || '';
  const actualBuf = Buffer.from(headerSecret, 'utf8');
  const expectedBuf = Buffer.from(secret, 'utf8');
  if (actualBuf.length === 0 || actualBuf.length !== expectedBuf.length || !timingSafeEqual(actualBuf, expectedBuf)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized webhook' }, { status: 401 });
  }

  const payload = (await req.json().catch(() => null)) as PluggyWebhookPayload | null;
  if (!payload || typeof payload !== 'object') {
    return NextResponse.json({ ok: false, error: 'Payload inválido.' }, { status: 400 });
  }

  const clientUserId = typeof payload.clientUserId === 'string' ? payload.clientUserId.trim() : '';
  if (!clientUserId || clientUserId === 'user-default') {
    return NextResponse.json({ ok: false, error: 'clientUserId ausente ou inválido.' }, { status: 400 });
  }

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ ok: false, error: 'Banco de dados indisponível.' }, { status: 503 });
  }

  await ensureDbSchema(prisma);
  const workspace = await prisma.userWorkspace.findUnique({ where: { id: clientUserId }, select: { id: true } });
  if (!workspace) {
    return NextResponse.json({ ok: false, error: 'Workspace de destino não encontrado.' }, { status: 404 });
  }

  const txs = Array.isArray(payload.transactions) ? payload.transactions.slice(0, 500) : [];
  let imported = 0;

  for (const tx of txs) {
    if (!tx || typeof tx.id !== 'string' || !tx.id.trim()) continue;
    const extId = tx.id.trim().slice(0, 100);
    const amountCents = Math.round(Math.abs(Number(tx.amount) || 0) * 100);
    if (amountCents <= 0) continue;

    const cleanDate =
      typeof tx.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(tx.date)
        ? tx.date.slice(0, 10)
        : new Date().toISOString().slice(0, 10);

    await prisma.transaction.upsert({
      where: { externalId: extId },
      create: {
        id: `of-${extId}`,
        userId: workspace.id,
        type: tx.type === 'CREDIT' ? 'income' : 'expense',
        amountCents,
        description: String(tx.description || 'Open Finance').slice(0, 140),
        tag: 'open-finance',
        categoryId: 'cat-compras',
        accountId: 'acc-nubank',
        date: cleanDate,
        method: 'Open Finance',
        externalId: extId,
      },
      update: {},
    });
    imported++;
  }

  return NextResponse.json({ ok: true, event: String(payload.event || 'unknown').slice(0, 64), imported });
}
