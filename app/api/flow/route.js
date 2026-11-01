import { NextResponse } from 'next/server';
import { getOrFetchGovData } from '@/lib/govApi';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await getOrFetchGovData('https://api-v3.thaiwater.net/api/v1/thaiwater30/public/flow', null, true);
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: 'Flow data unavailable', message: error.message }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
