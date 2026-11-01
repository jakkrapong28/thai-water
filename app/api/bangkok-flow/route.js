import { NextResponse } from 'next/server';
import { getOrFetchGovData } from '@/lib/govApi';

export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const result = await getOrFetchGovData('https://flood.pop.in.th/api_river.php', null, true, null);
    if (!Array.isArray(result.data.flows)) throw new Error('Invalid flow data');
    const fresh = result.data.flows.some(point => {
      const measured = new Date(String(point.measured_at).replace(' ', 'T') + '+07:00').getTime();
      const age = Date.now() - measured;
      return point.online && point.flow != null && Number.isFinite(Number(point.flow)) && Number.isFinite(age) && age >= 0 && age <= 30 * 60_000;
    });
    if (!fresh) throw new Error('No current flow readings');
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: 'Bangkok flow unavailable', message: error.message }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
