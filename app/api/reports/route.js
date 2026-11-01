import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { boundedReportForm, checkReportRequest } from '@/lib/reportInput';
import { listReports, insertReport, storageFailure } from '@/lib/reportsDb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const KINDS = new Set(['flood', 'help', 'road', 'shelter']);

export async function GET() {
  try {
    const rows = await listReports();
    return NextResponse.json({ data: rows, source: 'community-unverified', timestamp: Date.now() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json(storageFailure(error), { status: 503 });
  }
}

export async function POST(request) {
  const rejected = await checkReportRequest(request);
  if (rejected) return NextResponse.json({ error: rejected.error }, { status: rejected.status });
  try {
    if (Number(request.headers.get('content-length') || 0) > 5_000_000) return NextResponse.json({ error: 'รูปภาพใหญ่เกิน 4 MB' }, { status: 413 });
    const form = await boundedReportForm(request);
    const string = (name, max) => String(form.get(name) || '').trim().slice(0, max + 1);
    const kind = string('kind', 20);
    const title = string('title', 120);
    const description = string('description', 1500);
    const province = string('province', 80);
    const district = string('district', 80);
    const lat = Number(form.get('lat'));
    const lng = Number(form.get('lng'));
    if (!KINDS.has(kind) || title.length < 4 || title.length > 120 || description.length < 8 || description.length > 1500 || !province || province.length > 80 || district.length > 80 || !Number.isFinite(lat) || !Number.isFinite(lng) || lat <= 5 || lat >= 21 || lng <= 97 || lng >= 106) {
      return NextResponse.json({ error: 'กรอกหัวข้อ รายละเอียด จังหวัด และพิกัดในประเทศไทยให้ครบ' }, { status: 400 });
    }
    let image = null;
    const upload = form.get('image');
    if (upload && typeof upload.arrayBuffer === 'function' && upload.size > 0) {
      if (upload.size > 4_000_000 || !['image/jpeg', 'image/png', 'image/webp'].includes(upload.type)) return NextResponse.json({ error: 'รองรับเฉพาะภาพ JPG, PNG, WebP ขนาดไม่เกิน 4 MB' }, { status: 400 });
      image = await sharp(Buffer.from(await upload.arrayBuffer()), { limitInputPixels: 20_000_000 }).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
    }
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    if (image?.length > 4_000_000) return NextResponse.json({ error: 'รูปภาพหลังแปลงใหญ่เกิน 4 MB' }, { status: 413 });
    const data = await insertReport({ id, created_at: createdAt, kind, title, description, province, district, lat, lng, status: 'unverified' }, image);
    return NextResponse.json({ data }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error.message === 'UPLOAD_TOO_LARGE') return NextResponse.json({ error: 'รูปภาพใหญ่เกิน 4 MB' }, { status: 413 });
    return NextResponse.json(storageFailure(error), { status: 503 });
  }
}
