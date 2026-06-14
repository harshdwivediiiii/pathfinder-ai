import { NextResponse } from 'next/server';
import { db } from '@/lib/prisma';
import { isAiEnabled } from '@/lib/ai-gating';

export async function GET() {
  const checks = {};

  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'unreachable';
  }

  checks.ai = isAiEnabled() ? 'ok' : 'not configured';

  const healthy = Object.values(checks).every(v => v === 'ok');

  return NextResponse.json(
    {
      status: healthy ? 'ok' : 'degraded',
      checks,
    },
    {
      status: healthy ? 200 : 503,
    }
  );
}
