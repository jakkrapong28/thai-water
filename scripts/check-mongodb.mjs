import { getReportsDatabase, closeMongoClient } from '../lib/mongodb.mjs';

try {
  const db = await getReportsDatabase();
  await db.command({ ping: 1 });
  console.log(`MongoDB connected; indexes ready in ${db.databaseName}`);
  console.log(`reports: ${await db.collection('reports').countDocuments({})}; updates: ${await db.collection('report_updates').countDocuments({})}`);
} catch (error) {
  console.error(error.code === 'MONGODB_NOT_CONFIGURED'
    ? 'Set MONGODB_URI and MONGODB_DB_NAME in .env.local or your server environment.'
    : `MongoDB check failed (${error.name}). Check credentials, database permissions and network access.`);
  process.exitCode = 1;
} finally { await closeMongoClient(); }
