import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET() {
  const hasDatabase = Boolean(process.env.DATABASE_URL && getPrisma());
  const hasOpenFinance = Boolean(process.env.PLUGGY_CLIENT_ID && process.env.PLUGGY_CLIENT_SECRET);
  return NextResponse.json({
    ok: true,
    database: hasDatabase ? 'connected' : 'local-fallback',
    openFinance: hasOpenFinance ? 'configured' : 'sandbox-unconfigured',
  });
}
