import { NextResponse } from 'next/server';
import { getCacheStats } from '@/lib/govApi';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    service: 'Thai Water Watch',
    process: 'running',
    upstream_health: 'See each data endpoint; process status does not verify upstream availability.',
    cache: getCacheStats(),
    checked_at: new Date().toISOString()
  }, { headers: { 'Cache-Control': 'no-store' } });
}
