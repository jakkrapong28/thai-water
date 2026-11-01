import { getReportImage } from '@/lib/reportsDb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response(null, { status: 400 });
  try {
    const row = await getReportImage(id);
    if (!row?.image) return new Response(null, { status: 404 });
    return new Response(row.image, { headers: { 'Content-Type': row.image_mime, 'Cache-Control': 'public, max-age=86400', 'X-Content-Type-Options': 'nosniff' } });
  } catch {
    return new Response(null, { status: 503 });
  }
}
