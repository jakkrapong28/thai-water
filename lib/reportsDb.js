import { Binary } from 'mongodb';
import { getReportsDatabase } from './mongodb.mjs';

export function publicReport(row) {
  return {
    id: row._id, created_at: row.created_at, kind: row.kind,
    title: row.title, description: row.description, province: row.province,
    district: row.district, lat: row.lat, lng: row.lng, status: row.status,
    image_url: row.has_image ? `/api/reports/${row._id}/image` : null,
  };
}

export async function listReports() {
  const db = await getReportsDatabase();
  // Never transfer image bytes when loading the list/map.
  const rows = await db.collection('reports').find({}, { projection: { image: 0, image_mime: 0, location: 0 } })
    .sort({ created_at: -1, _id: -1 }).limit(500).toArray();
  return rows.map(publicReport);
}

export async function insertReport(report, image) {
  const db = await getReportsDatabase();
  const { id, ...fields } = report;
  const document = {
    _id: id, ...fields, has_image: Boolean(image),
    location: { type: 'Point', coordinates: [report.lng, report.lat] },
    ...(image ? { image: new Binary(image), image_mime: 'image/webp' } : {}),
  };
  await db.collection('reports').insertOne(document);
  return publicReport(document);
}

export async function reportExists(id) {
  const db = await getReportsDatabase();
  return Boolean(await db.collection('reports').findOne({ _id: id }, { projection: { _id: 1 } }));
}

export async function listReportUpdates(id) {
  const db = await getReportsDatabase();
  const rows = await db.collection('report_updates').find({ report_id: id }, { projection: { image: 0, image_mime: 0 } })
    .sort({ created_at: -1, _id: -1 }).limit(100).toArray();
  return rows.map(publicUpdate);
}

function publicUpdate(row) {
  return { id: row._id, report_id: row.report_id, created_at: row.created_at, message: row.message,
    image_url: row.has_image ? `/api/reports/updates/${row._id}/image` : null };
}

export async function insertReportUpdate(update, image) {
  const db = await getReportsDatabase();
  const { id, ...fields } = update;
  const document = { _id: id, ...fields, has_image: Boolean(image),
    ...(image ? { image: new Binary(image), image_mime: 'image/webp' } : {}) };
  await db.collection('report_updates').insertOne(document);
  return publicUpdate(document);
}

export async function getReportImage(id, isUpdate = false) {
  const db = await getReportsDatabase();
  const row = await db.collection(isUpdate ? 'report_updates' : 'reports')
    .findOne({ _id: id }, { projection: { image: 1, image_mime: 1 } });
  if (!row?.image) return null;
  return { image: row.image instanceof Binary ? row.image.value() : row.image, image_mime: row.image_mime };
}

export function storageFailure(error) {
  // Do not return driver messages: they can contain hostnames or credentials.
  return { error: 'ระบบรายงานประชาชนยังไม่พร้อม กรุณาลองใหม่ภายหลัง',
    code: error?.code === 'MONGODB_NOT_CONFIGURED' ? 'MONGODB_NOT_CONFIGURED' : 'REPORTS_STORAGE_UNAVAILABLE' };
}
