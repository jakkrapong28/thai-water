import { NextResponse } from 'next/server';
import { getOrFetchGovData } from '@/lib/govApi';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code') || 'N03';
  if (!/^[A-Z][0-9]{2}$/.test(code)) return NextResponse.json({ error: 'Invalid station code' }, { status: 400 });

  try {
    const result = await getOrFetchGovData(
      `https://fews2.hii.or.th/model-output/data_portal/tide_table/${code}.txt`,
      `tide_${code}.txt`,
      false
    );
    return NextResponse.json({
      raw_csv: result.data,
      stationCode: code,
      source: result.source,
      timestamp: result.timestamp
    }, {
      headers: {
        'Cache-Control': 'no-store',
        'X-Data-Source': result.source
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch detailed tide data for station ${code}`, message: error.message },
      { status: 500 }
    );
  }
}
