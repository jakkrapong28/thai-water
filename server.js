/**
 * Thailand Water & Crisis Command Center (Server)
 * Connects directly to Official Thai Government APIs:
 *  - HII / ThaiWater API (api-v3.thaiwater.net)
 *  - Royal Thai Navy / FEWS Marine Tide Forecast (fews2.hii.or.th)
 *  - DWR (Department of Water Resources)
 *  - BMA / DOH Flood Road Watch
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const PUBLIC_DIR = path.join(__dirname, 'public');

// In-memory cache to avoid rate limiting government APIs
const cache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 1 minute

function fetchLiveGov(targetUrl, timeoutMs = 4000) {
  return new Promise((resolve, reject) => {
    const parsed = url.parse(targetUrl);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.path,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
      },
      timeout: timeoutMs
    };

    const req = https.request(options, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve({ body, status: res.statusCode }));
      } else {
        reject(new Error(`Upstream returned ${res.statusCode}`));
      }
    });

    req.on('error', err => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Connection timed out'));
    });
    req.end();
  });
}

async function getOrFetch(apiEndpoint, fallbackFileName, isJson = true) {
  const now = Date.now();
  const cached = cache.get(apiEndpoint);
  if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    return { data: cached.data, source: 'cache-live', timestamp: cached.timestamp };
  }

  // Try live government fetch first
  try {
    const live = await fetchLiveGov(apiEndpoint);
    const data = isJson ? JSON.parse(live.body) : live.body;
    cache.set(apiEndpoint, { data, timestamp: now });
    return { data, source: 'live-government', timestamp: now };
  } catch (err) {
    // If live fetch fails (network restriction/sandbox/offline), use local snapshot
    const filePath = path.join(DATA_DIR, fallbackFileName);
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = isJson ? JSON.parse(raw) : raw;
      return { data, source: 'snapshot-cache', timestamp: now };
    }
    throw err;
  }
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // API Routes
  if (pathname.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    try {
      if (pathname === '/api/waterlevel') {
        const result = await getOrFetch(
          'https://api-v3.thaiwater.net/api/v1/thaiwater30/public/waterlevel_load',
          'waterlevel_load.json',
          true
        );
        res.writeHead(200, { 'X-Data-Source': result.source });
        res.end(JSON.stringify(result));
      } else if (pathname === '/api/canal') {
        const result = await getOrFetch(
          'https://api-v3.thaiwater.net/api/v1/thaiwater30/public/canal_waterlevel',
          'canal_waterlevel.json',
          true
        );
        res.writeHead(200, { 'X-Data-Source': result.source });
        res.end(JSON.stringify(result));
      } else if (pathname === '/api/watergate') {
        const result = await getOrFetch(
          'https://api-v3.thaiwater.net/api/v1/thaiwater30/public/watergate_load',
          'watergate_load.json',
          true
        );
        res.writeHead(200, { 'X-Data-Source': result.source });
        res.end(JSON.stringify(result));
      } else if (pathname === '/api/floodroad') {
        const result = await getOrFetch(
          'https://api-v3.thaiwater.net/api/v1/thaiwater30/public/flood_road',
          'flood_road.json',
          true
        );
        res.writeHead(200, { 'X-Data-Source': result.source });
        res.end(JSON.stringify(result));
      } else if (pathname === '/api/rain') {
        const result = await getOrFetch(
          'https://api-v3.thaiwater.net/api/v1/thaiwater30/public/rain_24h',
          'rain_24h.json',
          true
        );
        res.writeHead(200, { 'X-Data-Source': result.source });
        res.end(JSON.stringify(result));
      } else if (pathname === '/api/cctv') {
        const result = await getOrFetch(
          'https://api-v3.thaiwater.net/api/v1/thaiwater30/analyst/cctv',
          'cctv.json',
          true
        );
        res.writeHead(200, { 'X-Data-Source': result.source });
        res.end(JSON.stringify(result));
      } else if (pathname === '/api/storm') {
        const result = await getOrFetch(
          'https://api-v3.thaiwater.net/api/v1/thaiwater30/public/storm_data',
          'storm_data.json',
          true
        );
        res.writeHead(200, { 'X-Data-Source': result.source });
        res.end(JSON.stringify(result));
      } else if (pathname === '/api/tide') {
        const result = await getOrFetch(
          'https://fews2.hii.or.th/model-output/data_portal/tide_table/summary.txt',
          'tide_summary.txt',
          false
        );
        res.writeHead(200, { 'X-Data-Source': result.source });
        res.end(JSON.stringify({ raw_csv: result.data, source: result.source, timestamp: result.timestamp }));
      } else if (pathname === '/api/tide-detail') {
        const code = parsedUrl.query.code || 'N03';
        const result = await getOrFetch(
          `https://fews2.hii.or.th/model-output/data_portal/tide_table/${code}.txt`,
          `tide_${code}.txt`,
          false
        );
        res.writeHead(200, { 'X-Data-Source': result.source });
        res.end(JSON.stringify({ raw_csv: result.data, source: result.source, timestamp: result.timestamp }));
      } else if (pathname === '/api/status') {
        res.writeHead(200);
        res.end(JSON.stringify({
          status: 'ONLINE',
          service: 'Thai Water & Tide Crisis API Gateway',
          apis_supported: [
            'HII ThaiWater API v3 (waterlevel_load, canal_waterlevel, watergate_load, flood_road, rain_24h, cctv, storm_data)',
            'Royal Thai Navy / FEWS Tide Table API (summary.txt, hourly station forecasts)'
          ],
          cache_active: cache.size,
          server_time: new Date().toISOString()
        }));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Endpoint not found' }));
      }
    } catch (err) {
      console.error('API Error:', err);
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Internal server error', message: err.message }));
    }
    return;
  }

  // Static File Serving
  let reqPath = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.join(PUBLIC_DIR, reqPath);
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Fallback to index.html for SPA routing
        fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (err2, content2) => {
          if (err2) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(content2);
          }
        });
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Server Error: ' + err.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': mime });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🌊 Thai Water & Flood Crisis Command Center Active!`);
  console.log(`🚀 Server running on: http://localhost:${PORT}`);
  console.log(`📡 Connecting to Thai Govt APIs (ThaiWater & Navy FEWS)`);
  console.log(`=======================================================`);
});
