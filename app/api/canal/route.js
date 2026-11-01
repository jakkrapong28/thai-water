import { NextResponse } from 'next/server';
import { getOrFetchGovData } from '@/lib/govApi';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await getOrFetchGovData(
      'https://api-v3.thaiwater.net/api/v1/thaiwater30/public/canal_waterlevel',
      'canal_waterlevel.json',
      true
    );
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store',
        'X-Data-Source': result.source
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch canal data', message: error.message },
      { status: 500 }
    );
  }
}
