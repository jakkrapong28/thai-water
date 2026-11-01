import https from 'node:https';

const cache = new Map();
const CACHE_TTL_MS = 60_000;
const MAX_BODY_BYTES = 12 * 1024 * 1024;
const pending = new Map();

function fetchLiveGov(targetUrl, timeoutMs = 8_000) {
  return new Promise((resolve, reject) => {
    const req = https.get(targetUrl, {
      headers: { Accept: 'application/json, text/plain, */*', 'User-Agent': 'ThaiWaterMonitor/1.0' },
      timeout: timeoutMs
    }, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        res.resume();
        reject(new Error(`Upstream HTTP ${res.statusCode}`));
        return;
      }
      const chunks = [];
      let size = 0;
      res.on('data', (chunk) => {
        size += chunk.length;
        if (size > MAX_BODY_BYTES) {
          req.destroy(new Error('Upstream response too large'));
          return;
        }
        chunks.push(chunk);
      });
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      res.on('error', reject);
    });
    const deadline = setTimeout(() => req.destroy(new Error('Upstream timeout')), timeoutMs);
    req.on('close', () => clearTimeout(deadline));
    req.on('timeout', () => req.destroy(new Error('Upstream timeout')));
    req.on('error', reject);
  });
}

export async function getOrFetchGovData(apiEndpoint, fallbackFileName, isJson = true, expectedResult = 'OK') {
  const cached = cache.get(apiEndpoint);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return { data: cached.data, source: 'live-cache', timestamp: cached.timestamp, upstream: apiEndpoint };
  }

  // Deduplicate concurrent requests. Never replace a failed live feed with a disk snapshot.
  if (pending.has(apiEndpoint)) return pending.get(apiEndpoint);
  const task = (async () => {
    const body = await fetchLiveGov(apiEndpoint);
    const data = isJson ? JSON.parse(body) : body;
    const upstreamResult = data?.result ?? data?.waterlevel_data?.result ?? data?.watergate_data?.result;
    if (isJson && (!data || (expectedResult !== null && upstreamResult !== expectedResult))) {
      throw new Error('Upstream returned an invalid result');
    }
    const timestamp = Date.now();
    cache.set(apiEndpoint, { data, timestamp });
    return { data, source: 'live-public-source', timestamp, upstream: apiEndpoint };
  })();
  pending.set(apiEndpoint, task);
  try { return await task; }
  finally { pending.delete(apiEndpoint); }
}

export function getCacheStats() {
  return { cacheSize: cache.size, cachedKeys: Array.from(cache.keys()) };
}
