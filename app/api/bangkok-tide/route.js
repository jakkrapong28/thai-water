import { NextResponse } from 'next/server';
import { getOrFetchGovData } from '@/lib/govApi';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await getOrFetchGovData('https://flood.pop.in.th/api_overview.php', null, true, null);
    const tide = result.data.summary?.tide;
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    if (result.data.summary?.stale || result.data.summary?.scrape_failing || !tide || tide.date !== today) {
      throw new Error('Current Bangkok tide forecast unavailable');
    }
    return NextResponse.json({ data: tide, source: result.source, timestamp: result.timestamp, upstream: result.upstream }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: 'Bangkok tide unavailable', message: error.message }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
