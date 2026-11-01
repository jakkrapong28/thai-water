import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PATHS = { traffic: '/cctv/', drainage: '/cctv/dds/' };

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const kind = params.get('kind');
  const id = params.get('id');
  const timestamp = params.get('t');
  if (!PATHS[kind] || !/^\d{1,7}$/.test(id || '') || !/^\d{10}$/.test(timestamp || '')) {
    return NextResponse.json({ error: 'Invalid camera image request' }, { status: 400 });
  }
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (age > 3600) return NextResponse.json({ error: 'Camera image is old' }, { status: 410 });
  const url = `https://flood.pop.in.th${PATHS[kind]}${id}.jpg?t=${timestamp}`;
  try {
    const upstream = await fetch(url, { cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000) });
    const contentType = upstream.headers.get('content-type') || '';
    const length = Number(upstream.headers.get('content-length') || 0);
    if (!upstream.ok || !contentType.startsWith('image/jpeg') || length > 2_000_000) throw new Error('Camera image unavailable');
    const bytes = await upstream.arrayBuffer();
    if (bytes.byteLength > 2_000_000) throw new Error('Camera image too large');
    return new Response(bytes, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=60', 'X-Content-Type-Options': 'nosniff' } });
  } catch {
    return NextResponse.json({ error: 'Camera image unavailable' }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}
