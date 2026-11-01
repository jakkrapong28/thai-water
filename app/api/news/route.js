import { NextResponse } from 'next/server';
import { getOrFetchGovData } from '@/lib/govApi';

export const dynamic = 'force-dynamic';

const sources = [
  'https://www.prd.go.th/th/rss/page/contentjson/id/142/cid/33',
  'https://www.prd.go.th/th/rss/page/contentjson/id/1/cid/9'
];
const relevant = /น้ำท่วม|อุทกภัย|น้ำหลาก|น้ำป่า|ฝนตกหนัก|พายุ|ระบายน้ำ|น้ำทะเลหนุน|น้ำล้นตลิ่ง|ภัยพิบัติ|เตือนภัย|จุดพักพิง|ผู้ประสบภัย/;
const capUrl = 'https://www.tmd.go.th/api/xml/CAP';
const xmlText = (xml, tag) => {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return (match?.[1] || '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").trim();
};

export async function GET() {
  const results = await Promise.allSettled([...sources.map(url => getOrFetchGovData(url, null, true, null)), getOrFetchGovData(capUrl, null, false, null)]);
  const cutoff = Date.now() - 3 * 24 * 60 * 60 * 1000;
  const items = results.slice(0, 2).flatMap(result => result.status === 'fulfilled' && Array.isArray(result.value.data.items) ? result.value.data.items : []);
  const capXml = results[2].status === 'fulfilled' ? results[2].value.data : '';
  const warningSeen = new Set();
  const warnings = [...String(capXml).matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([,body]) => ({ title: xmlText(body,'title'), url: xmlText(body,'link'), published_at: xmlText(body,'pubDate') })).filter(item => {
    const published = new Date(item.published_at).getTime();
    if (!Number.isFinite(published) || published < cutoff || published > Date.now() + 5 * 60_000 || !item.title) return false;
    try { if (new URL(item.url).hostname !== 'www.tmd.go.th') return false; } catch { return false; }
    if (warningSeen.has(item.title)) return false;
    warningSeen.add(item.title);
    return true;
  }).slice(0, 3).map(item => ({ id: item.url, ...item, source: 'กรมอุตุนิยมวิทยา · CAP', kind: 'warning' }));
  if (!results.some(result => result.status === 'fulfilled')) return NextResponse.json({ error: 'News feeds unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  const seen = new Set();
  const data = items.filter(item => {
    const published = new Date(item.date_published).getTime();
    if (!Number.isFinite(published) || published < cutoff || published > Date.now() + 5 * 60_000 || !relevant.test(String(item.title || ''))) return false;
    try { if (new URL(item.url).hostname !== 'www.prd.go.th') return false; } catch { return false; }
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  }).map(item => ({ id: item.id || item.url, title: String(item.title).trim(), url: item.url, published_at: item.date_published, source: 'กรมประชาสัมพันธ์', kind: 'news' }));
  data.push(...warnings);
  data.sort((a,b) => (b.kind === 'warning') - (a.kind === 'warning') || new Date(b.published_at) - new Date(a.published_at));
  const sourceStatuses = [...sources,capUrl].map((url,index) => ({ url, ok: results[index].status === 'fulfilled', fetched_at: results[index].status === 'fulfilled' ? results[index].value.timestamp : null }));
  return NextResponse.json({ data, sources: sourceStatuses, source: 'government-json-feed', timestamp: Date.now(), upstream: 'https://www.prd.go.th/th/rss/page/index/id/1' }, { headers: { 'Cache-Control': 'no-store' } });
}
