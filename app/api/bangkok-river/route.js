import { NextResponse } from 'next/server';
import { getOrFetchGovData } from '@/lib/govApi';

export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const result = await getOrFetchGovData('https://flood.pop.in.th/api_river.php', null, true, null);
    if (!Array.isArray(result.data.stations) || result.data.summary?.stale || result.data.summary?.scrape_failing) throw new Error('Source is stale or unavailable');
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: 'Bangkok river unavailable', message: error.message }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
