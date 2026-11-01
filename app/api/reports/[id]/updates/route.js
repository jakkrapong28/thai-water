import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { boundedReportForm, checkReportRequest } from '@/lib/reportInput';
import { reportExists, listReportUpdates, insertReportUpdate, storageFailure } from '@/lib/reportsDb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const validId = id => /^[0-9a-f-]{36}$/.test(id);

export async function GET(_request, { params }) {
  const { id } = await params;
  if (!validId(id)) return NextResponse.json({ error: 'Invalid report' }, { status: 400 });
  try {
    if (!await reportExists(id)) return NextResponse.json({ error: 'ไม่พบจุดรายงานนี้' }, { status: 404 });
    const data = await listReportUpdates(id);
    return NextResponse.json({ data }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error.message === 'UPLOAD_TOO_LARGE') return NextResponse.json({ error: 'รูปภาพใหญ่เกิน 4 MB' }, { status: 413 });
    return NextResponse.json(storageFailure(error), { status: 503 });
  }
}

export async function POST(request, { params }) {
  const rejected = await checkReportRequest(request);
  if (rejected) return NextResponse.json({ error: rejected.error }, { status: rejected.status });
  const { id } = await params;
  if (!validId(id)) return NextResponse.json({ error: 'Invalid report' }, { status: 400 });
  if (Number(request.headers.get('content-length') || 0) > 5_000_000) return NextResponse.json({ error: 'รูปภาพใหญ่เกิน 4 MB' }, { status: 413 });
  try {
    if (!await reportExists(id)) return NextResponse.json({ error: 'ไม่พบจุดรายงานนี้' }, { status: 404 });
    const form = await boundedReportForm(request);
    const message = String(form.get('message') || '').trim();
    const upload = form.get('image');
    if (message.length > 1000 || (message.length < 4 && !upload?.size)) return NextResponse.json({ error: 'กรอกข้อความอัปเดตอย่างน้อย 4 ตัวอักษร หรือแนบรูป' }, { status: 400 });
    let image = null;
    if (upload && typeof upload.arrayBuffer === 'function' && upload.size > 0) {
      if (upload.size > 4_000_000 || !['image/jpeg','image/png','image/webp'].includes(upload.type)) return NextResponse.json({ error: 'รองรับ JPG, PNG, WebP ไม่เกิน 4 MB' }, { status: 400 });
      image = await sharp(Buffer.from(await upload.arrayBuffer()), { limitInputPixels: 20_000_000 }).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
    }
    const updateId = randomUUID();
    const createdAt = new Date().toISOString();
    if (image?.length > 4_000_000) return NextResponse.json({ error: 'รูปภาพหลังแปลงใหญ่เกิน 4 MB' }, { status: 413 });
    const data = await insertReportUpdate({ id: updateId, report_id: id, created_at: createdAt, message }, image);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error.message === 'UPLOAD_TOO_LARGE') return NextResponse.json({ error: 'รูปภาพใหญ่เกิน 4 MB' }, { status: 413 });
    return NextResponse.json(storageFailure(error), { status: 503 });
  }
}
