import { NextResponse } from 'next/server';
import { getOrFetchGovData } from '@/lib/govApi';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await getOrFetchGovData(
      'https://fews2.hii.or.th/model-output/data_portal/tide_table/summary.txt',
      'tide_summary.txt',
      false
    );
    return NextResponse.json({
      raw_csv: result.data,
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
      { error: 'Failed to fetch marine tide table', message: error.message },
      { status: 500 }
    );
  }
}
