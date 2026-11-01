import { NextResponse } from 'next/server';
import { getOrFetchGovData } from '@/lib/govApi';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await getOrFetchGovData('https://cctv.maholan.net/api/cameras', null, true, null);
    if (!Array.isArray(result.data.cameras)) throw new Error('Invalid camera index');
    const data = result.data.cameras.filter(camera => camera.live === true && camera.configured === true && ['hls', 'mjpeg'].includes(camera.type) && /^[a-zA-Z0-9_-]{1,80}$/.test(String(camera.id)) && Number.isFinite(Number(camera.lat)) && Number.isFinite(Number(camera.lng))).map(camera => ({
      id: `maholan-${camera.id}`,
      title: camera.name,
      lat: Number(camera.lat),
      long: Number(camera.lng),
      media_type: camera.type,
      image_url: `https://cctv.maholan.net/api/snap/${encodeURIComponent(camera.id)}?t=${Math.floor(Date.now() / 60_000)}`,
      stream_url: camera.type === 'hls' ? `https://cctv.maholan.net/api/hls/${encodeURIComponent(camera.id)}/index.m3u8` : `https://cctv.maholan.net/api/stream/${encodeURIComponent(camera.id)}`,
      cctv_url: camera.sourceUrl || 'https://cctv.maholan.net/',
      geocode: { province_name: { th: camera.region || 'ไม่ระบุจังหวัด' } },
      agency: { agency_shortname: { th: camera.source || 'ไม่ระบุแหล่ง' } },
      via: 'MAHOLAN CCTV'
    }));
    return NextResponse.json({ data, source: 'live-public-index', timestamp: Date.now(), upstream: 'https://cctv.maholan.net/' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: 'Live CCTV index unavailable', message: error.message }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
