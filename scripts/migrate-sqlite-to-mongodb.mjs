import { existsSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { Binary } from 'mongodb';
import { getReportsDatabase, closeMongoClient } from '../lib/mongodb.mjs';

const source = process.argv.find(value => value.endsWith('.sqlite'))
  || path.join(process.env.REPORTS_DATA_DIR || 'data/community', 'reports.sqlite');
let sqlite;
try {
  if (!existsSync(source)) throw new Error('SOURCE_MISSING');
  sqlite = new DatabaseSync(source, { readOnly: true });
  const counts = Object.fromEntries(['reports', 'report_updates'].map(table =>
    [table, sqlite.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count]));
  console.log(`SQLite source: ${counts.reports} reports, ${counts.report_updates} updates`);
  if (!process.argv.includes('--dry-run')) {
    const db = await getReportsDatabase();
    // Insert only missing IDs. Re-running never overwrites existing MongoDB reports.
    for (const collection of ['reports', 'report_updates']) {
      let inserted = 0;
      let verified = 0;
      let batch = [];
      const flush = async () => {
        if (!batch.length) return;
        const operations = batch.map(row => {
          const { id, image, image_mime, ...fields } = row;
          const document = { ...fields, has_image: Boolean(image),
            ...(image ? { image: new Binary(Buffer.from(image)), image_mime } : {}) };
          if (collection === 'reports' && Number.isFinite(row.lat) && Number.isFinite(row.lng)) {
            document.location = { type: 'Point', coordinates: [row.lng, row.lat] };
          }
          return { updateOne: { filter: { _id: id }, update: { $setOnInsert: document }, upsert: true } };
        });
        inserted += (await db.collection(collection).bulkWrite(operations, { ordered: true })).upsertedCount;
        const present = await db.collection(collection).countDocuments({ _id: { $in: batch.map(row => row.id) } });
        if (present !== batch.length) throw new Error('MIGRATION_INCOMPLETE');
        verified += present;
        batch = [];
      };
      // Bound memory even when the legacy database contains many image uploads.
      for (const row of sqlite.prepare(`SELECT * FROM ${collection} ORDER BY created_at`).iterate()) {
        batch.push(row);
        if (batch.length >= 10) await flush();
      }
      await flush();
      console.log(`${collection}: inserted ${inserted}, verified ${verified}/${counts[collection]}`);
    }
    console.log('Migration complete. Original SQLite file was not changed.');
  }
} catch (error) {
  console.error(['SOURCE_MISSING', 'MIGRATION_INCOMPLETE'].includes(error.message) ? error.message
    : error.code === 'MONGODB_NOT_CONFIGURED' ? 'Configure MONGODB_URI before migration.'
    : `Migration failed (${error.name}). The SQLite source was not changed.`);
  process.exitCode = 1;
} finally {
  sqlite?.close();
  await closeMongoClient();
}
