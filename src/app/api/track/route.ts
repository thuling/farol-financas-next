import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { ensureDbSchema } from '@/lib/db-init';
import { SESSION_COOKIE, verifySession } from '@/lib/session';

const ALLOWED_EVENT_TYPES = new Set(['click', 'tab_switch', 'modal_open', 'page_view', 'auth_success']);
const MAX_TRACK_BODY_BYTES = 64 * 1024;
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX_REQUESTS = 40;

const trackRateMap = new Map<string, { count: number; resetAt: number }>();

function checkTrackRateLimit(key: string): boolean {
  const now = Date.now();
  if (trackRateMap.size > 2000) {
    for (const [k, v] of trackRateMap.entries()) {
      if (v.resetAt <= now) trackRateMap.delete(k);
    }
  }
  const cur = trackRateMap.get(key);
  if (!cur || cur.resetAt <= now) {
    trackRateMap.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (cur.count >= RATE_MAX_REQUESTS) {
    return false;
  }
  cur.count += 1;
  return true;
}

interface IncomingTrackEvent {
  sessionId?: unknown;
  eventType?: unknown;
  target?: unknown;
  label?: unknown;
  tab?: unknown;
  path?: unknown;
}

function cleanStr(val: unknown, maxLen: number, fallback = ''): string {
  const s = typeof val === 'string'
    ? val.replace(/[\u0000-\u001F\u007F]/g, '').trim()
    : '';
  return (s || fallback).slice(0, maxLen);
}

export async function POST(req: NextRequest) {
  const contentLength = Number(req.headers.get('content-length') || 0);
  if (contentLength > MAX_TRACK_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: 'Payload muito grande.' }, { status: 413 });
  }

  let rawText = '';
  try {
    rawText = await req.text();
  } catch {
    return NextResponse.json({ ok: false, error: 'Payload inválido.' }, { status: 400 });
  }

  if (Buffer.byteLength(rawText, 'utf8') > MAX_TRACK_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: 'Payload muito grande.' }, { status: 413 });
  }

  const prisma = getPrisma();
  if (!prisma) {
    return NextResponse.json({ ok: true, recorded: 0, mode: 'local-fallback' });
  }

  const clientIp = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'anon-ip';
  if (!checkTrackRateLimit(clientIp)) {
    return NextResponse.json({ ok: false, error: 'Muitas requisições de telemetria.' }, { status: 429 });
  }

  let rawBody: unknown;
  try {
    rawBody = JSON.parse(rawText);
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

  const rows = list
    .slice(0, 100)
    .map((item) => {
      const evType = cleanStr(item?.eventType, 40, '');
      return {
        userId: session?.id || null,
        userEmail: session?.email || null,
        sessionId: cleanStr(item?.sessionId, 64, 'anon'),
        eventType: evType,
        target: cleanStr(item?.target, 120, ''),
        label: cleanStr(item?.label, 120, ''),
        tab: cleanStr(item?.tab, 48, ''),
        path: cleanStr(item?.path, 120, '/'),
      };
    })
    .filter((r) => ALLOWED_EVENT_TYPES.has(r.eventType) && r.target && r.path !== '/admin');

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
