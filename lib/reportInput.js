import { createHash } from 'node:crypto';
import { getReportsDatabase } from './mongodb.mjs';

export async function checkReportRequest(request) {
  const origin = request.headers.get('origin');
  if (origin) {
    let sameOrigin = false;
    try {
      const actual = new URL(origin);
      const expectedHost = request.headers.get('host') || new URL(request.url).host;
      const expectedProtocol = (request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || new URL(request.url).protocol.replace(':','')) + ':';
      sameOrigin = actual.host === expectedHost && actual.protocol === expectedProtocol;
    } catch {}
    if (!sameOrigin) return { error: 'ส่งรายงานจากหน้าเว็บนี้เท่านั้น', status: 403 };
  }
  try {
    const db = await getReportsDatabase();
    const now = Date.now();
    const windowMs = 15 * 60_000;
    const bucket = Math.floor(now / windowMs);
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
    const id = createHash('sha256').update(`${ip}:${bucket}`).digest('hex');
    const limits = db.collection('report_limits');
    const change = { $inc: { count: 1 }, $setOnInsert: { expires_at: new Date((bucket + 2) * windowMs) } };
    let entry;
    try {
      entry = await limits.findOneAndUpdate({ _id: id }, change, { upsert: true, returnDocument: 'after' });
    } catch (error) {
      // Two cold instances can race on the same first upsert.
      if (error.code !== 11000) throw error;
      entry = await limits.findOneAndUpdate({ _id: id }, change, { returnDocument: 'after' });
    }
    return entry?.count <= 8 ? null : { error: 'ส่งถี่เกินไป โปรดลองใหม่ใน 15 นาที', status: 429 };
  } catch {
    return { error: 'ระบบรายงานประชาชนยังไม่พร้อม กรุณาลองใหม่ภายหลัง', status: 503 };
  }
}
export async function boundedReportForm(request) {
  const maximum = 5_000_000;
  if (Number(request.headers.get('content-length') || 0) > maximum) throw new Error('UPLOAD_TOO_LARGE');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('INVALID_FORM');
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maximum) { await reader.cancel(); throw new Error('UPLOAD_TOO_LARGE'); }
      chunks.push(Buffer.from(value));
    }
  } finally { reader.releaseLock(); }
  return new Response(Buffer.concat(chunks), { headers: { 'Content-Type': request.headers.get('content-type') || '' } }).formData();
}
