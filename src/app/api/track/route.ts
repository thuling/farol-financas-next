import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { ensureDbSchema } from '@/lib/db-init';
import { SESSION_COOKIE, verifySession } from '@/lib/session';

interface IncomingTrackEvent {
  sessionId?: unknown;
  eventType?: unknown;
  target?: unknown;
  label?: unknown;
  tab?: unknown;
  path?: unknown;
}

function cleanStr(val: unknown, maxLen: number, fallback = ''): string {
  const s = typeof val === 'string' ? val.trim() : '';
  return (s || fallback).slice(0, maxLen);
}

export async function POST(req: NextRequest) {
  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ ok: true, recorded: 0, mode: 'local-fallback' });
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Payload inválido.' }, { status: 400 });
  }

  const list: IncomingTrackEvent[] = Array.isArray(rawBody)
    ? rawBody
    : rawBody && typeof rawBody === 'object' && Array.isArray((rawBody as { events?: unknown }).events)
      ? (rawBody as { events: IncomingTrackEvent[] }).events
      : rawBody && typeof rawBody === 'object'
        ? [rawBody as IncomingTrackEvent]
        : [];

  if (list.length === 0) {
    return NextResponse.json({ ok: true, recorded: 0 });
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = verifySession(token);

  const rows = list.slice(0, 100).map((item) => ({
    userId: session?.id || null,
    userEmail: session?.email || null,
    sessionId: cleanStr(item?.sessionId, 64, 'anon'),
    eventType: cleanStr(item?.eventType, 40, 'click'),
    target: cleanStr(item?.target, 120, 'unknown'),
    label: cleanStr(item?.label, 120, ''),
    tab: cleanStr(item?.tab, 48, ''),
    path: cleanStr(item?.path, 120, '/'),
  })).filter((r) => r.target && r.path !== '/admin');

  if (rows.length === 0) {
    return NextResponse.json({ ok: true, recorded: 0 });
  }

  try {
    await ensureDbSchema(prisma);
    await prisma.analyticsEvent.createMany({ data: rows });
    return NextResponse.json({ ok: true, recorded: rows.length });
  } catch {
    return NextResponse.json({ ok: true, recorded: 0 });
  }
}
