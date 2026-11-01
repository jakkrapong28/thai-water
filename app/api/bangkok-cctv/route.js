import { NextResponse } from 'next/server';
import { getOrFetchGovData } from '@/lib/govApi';

export const dynamic = 'force-dynamic';

const indexes = [
  ['traffic', 'https://flood.pop.in.th/cctv/cams.json', '/cctv/', 'กล้องจราจร กทม.'],
  ['drainage', 'https://flood.pop.in.th/cctv/dds.json', '/cctv/dds/', 'สำนักการระบายน้ำ กทม.']
];

export async function GET() {
  try {
    const results = await Promise.allSettled(indexes.map(async ([kind, url, imagePath, agency]) => {
      const result = await getOrFetchGovData(url, null, true, null);
      if (!Array.isArray(result.data.cams) || !Number.isFinite(Number(result.data.at)) || Math.abs(Date.now() / 1000 - Number(result.data.at)) > 600) {
        throw new Error(`${kind} index is stale or invalid`);
      }
      return result.data.cams.filter(camera => {
        const imageAge = Date.now() / 1000 - Number(camera.img);
        return Number.isFinite(Number(camera.lat)) && Number.isFinite(Number(camera.lng)) && imageAge >= 0 && imageAge <= 900;
      }).map(camera => ({
        id: `bkk-${kind}-${camera.id}`,
        title: camera.name,
        description: camera.detail || '',
        lat: camera.lat,
        long: camera.lng,
        media_type: 'img',
        is_active: true,
        image_timestamp: Number(camera.img) * 1000,
        image_url: `/api/camera-image?kind=${kind}&id=${Number(camera.id)}&t=${Number(camera.img)}`,
        cctv_url: `https://flood.pop.in.th${imagePath}${encodeURIComponent(String(camera.id))}.jpg?t=${Number(camera.img)}`,
        geocode: { province_name: { th: 'กรุงเทพมหานคร' } },
        agency: { agency_shortname: { th: agency } },
        via: 'POPNIX Flood'
      }));
    }));
    const data = results.flatMap(result => result.status === 'fulfilled' ? result.value : []);
    if (!results.some(result => result.status === 'fulfilled')) throw new Error('All camera indexes unavailable');
    const sources = indexes.map(([,url], index) => ({ url, ok: results[index].status === 'fulfilled' }));
    return NextResponse.json({ data, sources, source: 'live-public-index', timestamp: Date.now(), upstream: 'https://flood.pop.in.th/' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: 'Bangkok CCTV index unavailable', message: error.message }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
