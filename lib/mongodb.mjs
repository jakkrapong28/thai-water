import { MongoClient } from 'mongodb';

// Shared across requests and development reloads. Never connect at build time.
const cacheKey = Symbol.for('thai-water-monitor.mongodb');
const cache = globalThis[cacheKey] ||= {};

function configuration() {
  const uri = process.env.MONGODB_URI?.trim();
  const name = process.env.MONGODB_DB_NAME?.trim() || 'thai_water_monitor';
  if (!uri || !/^mongodb(?:\+srv)?:\/\//.test(uri) || /[<>]/.test(uri)) {
    throw Object.assign(new Error('MongoDB connection string is not configured'), { code: 'MONGODB_NOT_CONFIGURED' });
  }
  if (!/^[a-zA-Z0-9_-]{1,63}$/.test(name)) {
    throw Object.assign(new Error('MongoDB database name is invalid'), { code: 'MONGODB_NOT_CONFIGURED' });
  }
  return { uri, name };
}

export async function getMongoClient() {
  const { uri } = configuration();
  if (!cache.clientPromise) {
    const client = new MongoClient(uri, {
      appName: 'thai-water-monitor', maxPoolSize: 10, minPoolSize: 0,
      maxIdleTimeMS: 60_000, serverSelectionTimeoutMS: 5_000,
      connectTimeoutMS: 5_000, waitQueueTimeoutMS: 5_000, timeoutMS: 10_000,
    });
    cache.client = client;
    cache.clientPromise = client.connect().catch(async error => {
      cache.clientPromise = undefined;
      cache.client = undefined;
      await client.close().catch(() => {});
      throw error;
    });
  }
  return cache.clientPromise;
}

export async function getReportsDatabase() {
  const { name } = configuration();
  const db = (await getMongoClient()).db(name);
  if (!cache.indexPromise) {
    cache.indexPromise = Promise.all([
      db.collection('reports').createIndexes([
        { key: { created_at: -1, _id: -1 }, name: 'latest_reports' },
        { key: { province: 1, district: 1, created_at: -1 }, name: 'report_area' },
        { key: { location: '2dsphere' }, name: 'report_location' },
      ]),
      db.collection('report_updates').createIndex({ report_id: 1, created_at: -1, _id: -1 }, { name: 'latest_report_updates' }),
      db.collection('report_limits').createIndex({ expires_at: 1 }, { expireAfterSeconds: 0, name: 'expired_report_limits' }),
    ]).catch(error => { cache.indexPromise = undefined; throw error; });
  }
  await cache.indexPromise;
  return db;
}

// CLI/test shutdown only; request handlers reuse the pool.
export async function closeMongoClient() {
  await cache.client?.close();
  cache.client = undefined;
  cache.clientPromise = undefined;
  cache.indexPromise = undefined;
}
