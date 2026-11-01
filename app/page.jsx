'use client';

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowUpRight, Camera, CloudRain, Droplets, ExternalLink, MapPinned, RefreshCw, Search, Waves, Wind, Workflow } from 'lucide-react';
import dynamic from 'next/dynamic';
import { riverRisk } from '@/lib/waterStatus';
const MapComponent = dynamic(() => import('./components/MapComponent'), { ssr: false, loading: () => <div className="map-canvas empty-state">กำลังเปิดแผนที่…</div> });
import CameraGallery, { CameraImage } from './components/CameraGallery';
const CommunityReports = dynamic(() => import('./components/CommunityReports'));
const LiveCameraPlayer = dynamic(() => import('./components/LiveCameraPlayer'));
import GlobalSearchResults from './components/GlobalSearchResults';
import NewsStrip from './components/NewsStrip';
const WeatherMap = dynamic(() => import('./components/WeatherMap'));

const feeds = [
  { key: 'waterlevel', label: 'แม่น้ำ', path: '/api/waterlevel', url: 'https://www.thaiwater.net/water/wl', extract: d => d.data?.waterlevel_data?.data },
  { key: 'canal', label: 'คลอง', path: '/api/canal', url: 'https://www.thaiwater.net/water/wl', extract: d => d.data?.data },
  { key: 'bkkcanal', label: 'คลอง กทม. ผ่าน POPNIX', path: '/api/bangkok-canals', url: 'https://flood.pop.in.th/api/', extract: d => d.data?.stations?.filter(s => s.online && s.wl !== null).map(s => ({ id: `pop-${s.id}`, canal_value: s.wl, canal_datetime: s.measured_at, delta: s.delta, trend: s.trend, river_name: s.river, station: { canal_name: { th: s.name }, canal_lat: s.lat, canal_long: s.lng, critical_level: s.crit, warning_level: s.warn }, geocode: { amphoe_name: { th: s.district || '' }, province_name: { th: 'กรุงเทพมหานคร' } }, via: 'POPNIX Flood' })) },
  { key: 'bkkriver', label: 'เจ้าพระยาและแนวโน้ม', path: '/api/bangkok-river', url: 'https://flood.pop.in.th/api/', extract: d => d.data?.stations?.filter(s => s.online && s.wl !== null).map(s => ({ id:`pop-river-${s.code}`, waterlevel_msl:s.wl, waterlevel_datetime:s.measured_at, situation_level:s.situation, diff_wl_bank_text:numeric(s.diff) !== null && Number(s.diff)>=0 ? 'ล้นตลิ่ง (ม.)' : '', delta:s.delta, trend:s.trend, river_name:s.river, station:{tele_station_name:{th:s.name},tele_station_lat:s.lat,tele_station_long:s.lng,tele_station_oldcode:s.oldcode,critical_level_msl:s.crit}, geocode:{province_name:{th:s.province || ''},amphoe_name:{th:s.district || ''}}, agency:{agency_shortname:{th:s.agency}}, via:'POPNIX Flood' })) },
  { key: 'bkkflow', label: 'การไหลและความเร็ว กทม.', path: '/api/bangkok-flow', url: 'https://flood.pop.in.th/api/', extract: d => d.data?.flows?.filter(s => s.online && numeric(s.flow) !== null).map(s => ({id:`pop-flow-${s.code}`,flow_value:s.flow,flow_datetime:s.measured_at,speed:s.speed,area:s.area,river_name:s.river,station:{flow_name:{th:s.name},flow_lat:s.lat,flow_long:s.lng},geocode:{province_name:{th:'กรุงเทพมหานคร'},amphoe_name:{th:s.district || ''}},via:'POPNIX Flood'})) },
  { key: 'bkkrain', label: 'ฝน กทม. และปริมณฑล', path:'/api/bangkok-rain', url:'https://flood.pop.in.th/api/', extract:d => d.data?.stations?.filter(s=>s.online && numeric(s.r24h) !== null).map(s=>({id:`pop-rain-${s.code}`,rain_24h:s.r24h,rain_1h:s.r1h,rain_3h:s.r3h,rainfall_datetime:s.measured_at,station:{tele_station_name:{th:s.name},tele_station_lat:s.lat,tele_station_long:s.lng},geocode:{province_name:{th:s.province || ''},amphoe_name:{th:s.district || ''}},agency:{agency_shortname:{th:s.agency}},via:'POPNIX Flood'})) },
  { key: 'flow', label: 'อัตราการไหล', path: '/api/flow', url: 'https://www.thaiwater.net/', extract: d => d.data?.data },
  { key: 'watergate', label: 'ประตูน้ำ', path: '/api/watergate', url: 'https://www.thaiwater.net/', extract: d => d.data?.watergate_data?.data },
  { key: 'floodroad', label: 'น้ำท่วมถนน', path: '/api/floodroad', url: 'https://floodbangkok.bangkok.go.th/', extract: d => d.data?.data },
  { key: 'bkkroad', label: 'ถนน กทม. ผ่าน POPNIX', path: '/api/bangkok-roads', url: 'https://flood.pop.in.th/api/', extract: d => d.data?.roads?.filter(r => r.level !== 'off' && r.depth !== null).map(r => ({ id: `pop-${r.code}`, floodroad_value: r.depth, floodroad_datetime: r.measured_at, station: { floodroad_name: { th: r.name }, floodroad_lat: r.lat, floodroad_long: r.lng }, geocode: { amphoe_name: { th: r.district || '' }, province_name: { th: 'กรุงเทพมหานคร' } }, via: 'POPNIX Flood' })) },
  { key: 'bkkcctv', label: 'กล้อง กทม. ภาพล่าสุด', path: '/api/bangkok-cctv', url: 'https://flood.pop.in.th/', extract: d => d.data },
  { key: 'livecctv', label: 'กล้องสตรีมสดทั่วไทย', path: '/api/live-cctv', url: 'https://cctv.maholan.net/', extract: d => d.data },
  { key: 'cctv', label: 'กล้อง', path: '/api/cctv', url: 'https://www.thaiwater.net/', extract: d => d.data?.data },
  { key: 'rain', label: 'ฝน', path: '/api/rain', url: 'https://www.thaiwater.net/weather/rainfall', extract: d => d.data?.data },
  { key: 'bkktide', label: 'น้ำขึ้นลงปากเจ้าพระยา', path: '/api/bangkok-tide', url: 'https://flood.pop.in.th/api/', extract: d => d.data?.date ? [{ code: 'BKK', name_th: 'ปากแม่น้ำเจ้าพระยา', date: d.data.date, high_am: d.data.high_am, low_am: d.data.low_am, high_pm: d.data.high_pm, low_pm: d.data.low_pm }] : null },
  { key: 'tide', label: 'น้ำทะเล', path: '/api/tide', url: 'https://fews2.hii.or.th/', extract: d => parseTides(d.raw_csv) },
  { key: 'storm', label: 'พายุ', path: '/api/storm', url: 'https://www.tmd.go.th/', extract: d => d.data?.data },
  { key: 'news', label: 'ข่าวน้ำท่วม', path: '/api/news', url: 'https://www.prd.go.th/th/rss/page/index/id/1', extract: d => d.data }
];

const sections = [
  ['overview', 'ภาพรวม', MapPinned],
  ['water', 'แม่น้ำและคลอง', Droplets],
  ['weather', 'ฝนและพายุ', CloudRain],
  ['tide', 'น้ำทะเลหนุน', Waves],
  ['infrastructure', 'ประตูระบายน้ำ', Workflow],
  ['roads', 'น้ำท่วมถนน', Workflow],
  ['cameras', 'กล้อง CCTV', Camera],
  ['help', 'แจ้งเหตุและช่วยเหลือ', AlertTriangle],
  ['sources', 'สถานะแหล่งข้อมูล', ExternalLink]
];

function parseTides(raw) {
  if (typeof raw !== 'string') return [];
  return raw.trim().split(/\r?\n/).slice(1).map(line => {
    const c = line.split(',');
    if (c.length < 10 || !Number.isFinite(Number(c[3])) || !Number.isFinite(Number(c[4]))) return null;
    return { code: c[0]?.trim(), name_th: c[1]?.trim(), name_en: c[2]?.trim(), lat: Number(c[3]), long: Number(c[4]), date: c[5]?.trim(), max_value: numeric(c[6]), max_time: c[7]?.trim(), min_value: numeric(c[8]), min_time: c[9]?.trim() };
  }).filter(Boolean);
}
function numeric(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
function normalizedSearch(value) {
  return String(value || '').toLocaleLowerCase('th').replace(/จังหวัด|อำเภอ|ตำบล|แขวง|เขต|จ\.|อ\.|ต\./g, '').replace(/[\s.,\-_/]/g, '');
}
function fmt(value, suffix = '') { return value === null || value === undefined ? 'ไม่มีข้อมูล' : `${value}${suffix}`; }
const thaiTimeFormatter = new Intl.DateTimeFormat('th-TH', { timeZone:'Asia/Bangkok', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' });
function time(value) {
  if (!value) return 'ไม่ระบุเวลา';
  const parsed = new Date(typeof value === 'number' ? value : String(value).includes('T') ? value : String(value).replace(' ', 'T') + '+07:00');
  return Number.isFinite(parsed.getTime()) ? thaiTimeFormatter.format(parsed) : 'ไม่ระบุเวลา';
}
function province(item) { return item.geocode?.province_name?.th || 'ไม่ระบุจังหวัด'; }
function name(item, type) {
  if (type === 'waterlevel' || type === 'bkkriver' || type === 'watergate' || type === 'rain' || type === 'bkkrain') return item.station?.tele_station_name?.th || 'ไม่ระบุสถานี';
  if (type === 'canal' || type === 'bkkcanal') return item.station?.canal_name?.th || 'ไม่ระบุคลอง';
  if (type === 'floodroad' || type === 'bkkroad') return item.station?.floodroad_name?.th || 'ไม่ระบุถนน';
  if ((type === 'flow' || type === 'bkkflow')) return item.station?.flow_name?.th || 'ไม่ระบุสถานี';
  if (type === 'cctv' || type === 'bkkcctv' || type === 'livecctv') return item.title || 'ไม่ระบุกล้อง';
  return item.name_th || 'ไม่ระบุสถานี';
}
function dateAge(value) {
  if (!value) return null;
  const parsed = typeof value === 'number' ? new Date(value) : new Date(String(value).includes('T') ? value : String(value).replace(' ', 'T') + '+07:00');
  const age = Date.now() - parsed.getTime();
  return Number.isFinite(age) && age >= 0 ? age : null;
}
function readingTime(item, type) {
  return item[({waterlevel:'waterlevel_datetime',bkkriver:'waterlevel_datetime',bkkflow:'flow_datetime',bkkrain:'rainfall_datetime',canal:'canal_datetime',bkkcanal:'canal_datetime',flow:'flow_datetime',watergate:'watergate_datetime_in',rain:'rainfall_datetime',floodroad:'floodroad_datetime',bkkroad:'floodroad_datetime',bkkcctv:'image_timestamp',news:'published_at'})[type]] || null;
}
function crisis(item) { return riverRisk(item) === 3; }

function severity(item, key) {
  const age = dateAge(readingTime(item, key));
  if (age === null || age > 6 * 60 * 60 * 1000) return -1;
  if (key === 'waterlevel' || key === 'bkkriver') return riverRisk(item);
  if (key === 'canal' || key === 'bkkcanal') {
    const value = numeric(item.canal_value), limit = numeric(item.station?.critical_level);
    const warning = numeric(item.station?.warning_level);
    return value !== null && limit !== null && value >= limit ? 3 : value !== null && warning !== null && value >= warning ? 2 : 0;
  }
  if (key === 'floodroad' || key === 'bkkroad') {
    const value = numeric(item.floodroad_value);
    return value !== null && value > 10 ? 3 : value !== null && value > 0 ? 2 : 0;
  }
  return 0;
}
function trend(item) {
  const change = numeric(item.delta);
  if (change === null) return 'ไม่มีค่าเทียบ';
  return `${change > 0 ? '↑ +' : change < 0 ? '↓ ' : '→ '}${Math.round(change * 100)} ซม.`;
}

function pointOf(item, key) {
  const station = item.station || {};
  const lat = key === 'canal' || key === 'bkkcanal' ? station.canal_lat : key === 'floodroad' || key === 'bkkroad' ? station.floodroad_lat : (key === 'flow' || key === 'bkkflow') ? station.flow_lat : item.lat ?? station.tele_station_lat;
  const lng = key === 'canal' || key === 'bkkcanal' ? station.canal_long : key === 'floodroad' || key === 'bkkroad' ? station.floodroad_long : (key === 'flow' || key === 'bkkflow') ? station.flow_long : item.long ?? station.tele_station_long;
  return Number.isFinite(Number(lat)) && Number.isFinite(Number(lng)) && Number(lat) > 5 && Number(lat) < 21 && Number(lng) > 97 && Number(lng) < 106 ? [Number(lat), Number(lng)] : null;
}

export default function HomePage() {
  const [data, setData] = useState({});
  const [state, setState] = useState({});
  const [active, setActive] = useState('overview');
  const [inputQuery, setQuery] = useState('');
  const query = useDeferredValue(inputQuery);
  const pendingFeeds = useRef(new Map());
  const mounted = useRef(false);
  const refreshTask = useRef(null);
  const [provinceFilter, setProvinceFilter] = useState('all');
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [checkedAt, setCheckedAt] = useState(null);
  const [reports, setReports] = useState([]);
  const [reportsError, setReportsError] = useState('');
  const [focusPoint, setFocusPoint] = useState(null);

  const loadReports = useCallback(async () => {
    try {
      const response = await fetch('/api/reports', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      setReports(Array.isArray(payload.data) ? payload.data : []);
      setReportsError('');
    } catch { setReportsError('ระบบรายงานประชาชนยังเชื่อมต่อไม่ได้'); }
  }, []);

  const fetchFeed = useCallback(feed => {
    if (pendingFeeds.current.has(feed.key)) return pendingFeeds.current.get(feed.key).task;
    const controller = new AbortController();
    const task = (async () => {
      const timer = setTimeout(() => controller.abort(new DOMException('Timeout', 'TimeoutError')), 12_000);
      let result;
      try {
        const response = await fetch(feed.path, { cache: 'no-store', signal: controller.signal });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || payload.error || `HTTP ${response.status}`);
        const rows = feed.extract(payload);
        if (!Array.isArray(rows)) throw new Error('รูปแบบข้อมูลไม่ถูกต้อง');
        if (feed.key === 'tide' && rows.length && !rows.some(row => row.date === new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()))) throw new Error(`ตารางล่าสุดเป็นวันที่ ${rows[0].date} ยังไม่มีพยากรณ์ของวันนี้`);
        const withTime = rows.filter(row => readingTime(row, feed.key));
        const maxAge = feed.key === 'bkkcctv' ? 15 * 60_000 : 6 * 60 * 60_000;
        const freshCount = withTime.filter(row => { const age = dateAge(readingTime(row, feed.key)); return age !== null && age < maxAge; }).length;
        result = { rows, status: { ok: true, count: rows.length, freshCount: withTime.length ? freshCount : null, timestamp: payload.timestamp, source: payload.source, upstream: payload.upstream || feed.url, sourceStatuses: payload.sources } };
      } catch (error) {
        result = { rows: [], status: { ok: false, count: 0, error: error.name === 'AbortError' ? 'ต้นทางตอบช้า จะตรวจใหม่รอบถัดไป' : error.message, upstream: feed.url } };
      } finally { clearTimeout(timer); }
      if (mounted.current && !controller.signal.aborted) {
        setData(current => ({ ...current, [feed.key]: result.rows }));
        setState(current => ({ ...current, [feed.key]: result.status }));
        setCheckedAt(new Date());
      } else if (mounted.current && controller.signal.reason?.name === 'TimeoutError') {
        setData(current => ({ ...current, [feed.key]: [] }));
        setState(current => ({ ...current, [feed.key]: result.status }));
      }
    })();
    pendingFeeds.current.set(feed.key, { task, controller });
    task.finally(() => { if (pendingFeeds.current.get(feed.key)?.task === task) pendingFeeds.current.delete(feed.key); });
    return task;
  }, []);

  const load = useCallback(() => {
    if (refreshTask.current) return refreshTask.current;
    setRefreshing(true);
    const spinnerTimer = setTimeout(() => { if (mounted.current) setRefreshing(false); }, 9_000);
    const task = Promise.allSettled(feeds.map(fetchFeed)).then(() => {
      if (mounted.current) { setCheckedAt(new Date()); setRefreshing(false); }
    }).finally(() => { clearTimeout(spinnerTimer); refreshTask.current = null; });
    refreshTask.current = task;
    return task;
  }, [fetchFeed]);

  useEffect(() => {
    mounted.current = true;
    load();
    loadReports();
    const fastFeeds = feeds.filter(feed => ['bkkcctv','livecctv','cctv','news'].includes(feed.key));
    const generalFeeds = feeds.filter(feed => !fastFeeds.includes(feed));
    const fast = setInterval(() => { if (!document.hidden) { fastFeeds.forEach(fetchFeed); loadReports(); } }, 60_000);
    const general = setInterval(() => { if (!document.hidden) generalFeeds.forEach(fetchFeed); }, 120_000);
    const resume = () => { if (!document.hidden) { load(); loadReports(); } };
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('online', resume);
    return () => {
      mounted.current = false;
      clearInterval(fast); clearInterval(general);
      document.removeEventListener('visibilitychange', resume);
      window.removeEventListener('online', resume);
      pendingFeeds.current.forEach(({ controller }) => controller.abort());
      pendingFeeds.current.clear();
      refreshTask.current = null;
    };
  }, [fetchFeed, load, loadReports]);

  useEffect(() => {
    if (!selectedCamera) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const dialog = document.querySelector('.camera-modal');
    dialog?.querySelector('button')?.focus();
    const keydown = event => {
      if (event.key === 'Escape') setSelectedCamera(null);
      if (event.key !== 'Tab') return;
      const targets = Array.from(dialog?.querySelectorAll('button,a[href],video[controls]') || []);
      const first = targets[0], last = targets[targets.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', keydown); previousFocus?.focus?.(); };
  }, [selectedCamera]);

  const bkkCanalRows = useMemo(() => (data.bkkcanal || []).map(item => {
    if (item.geocode?.amphoe_name?.th) return item;
    const matches = (data.canal || []).filter(reference => Math.abs(Number(reference.station?.canal_lat) - Number(item.station.canal_lat)) < 0.00002 && Math.abs(Number(reference.station?.canal_long) - Number(item.station.canal_long)) < 0.00002);
    return matches.length === 1 && matches[0].geocode?.amphoe_name?.th ? { ...item, geocode:matches[0].geocode } : item;
  }), [data.bkkcanal,data.canal]);
  const bkkRiverRows = useMemo(() => (data.bkkriver || []).map(item => {
    if (item.geocode?.province_name?.th && item.geocode?.amphoe_name?.th) return item;
    const matches = (data.waterlevel || []).filter(reference => Math.abs(Number(reference.station?.tele_station_lat) - Number(item.station.tele_station_lat)) < 0.00002 && Math.abs(Number(reference.station?.tele_station_long) - Number(item.station.tele_station_long)) < 0.00002);
    return matches.length === 1 && matches[0].geocode?.province_name?.th ? { ...item, geocode:matches[0].geocode } : item;
  }), [data.bkkriver,data.waterlevel]);
  const rows = key => key === 'bkkcanal' ? bkkCanalRows : key === 'bkkriver' ? bkkRiverRows : data[key] || [];

  const provinces = useMemo(() => [...new Set(Object.entries(data).flatMap(([key, items]) => key === 'tide' ? [] : items.map(province)))].filter(p => p !== 'ไม่ระบุจังหวัด' && !/^(ภาค|สาธารณรัฐ|ประเทศ)/.test(p)).sort((a,b) => a.localeCompare(b, 'th')), [data]);
  const filter = (items, key) => items.filter(item => {
    if (provinceFilter !== 'all' && province(item) !== provinceFilter) return false;
    const needle = normalizedSearch(query);
    if (!needle) return true;
    const haystack = [name(item,key), province(item), item.geocode?.amphoe_name?.th,
      item.geocode?.tumbon_name?.th, item.description, item.id, item.code,
      item.station?.tele_station_oldcode, item.station?.canal_oldcode,
      item.station?.flow_name?.th, item.agency?.agency_shortname?.th,
      item.station?.river_name?.th, item.river_name].filter(Boolean).join(' ');
    return normalizedSearch(haystack).includes(needle);
  });
  const riverAlerts = rows('waterlevel').filter(item => crisis(item) && dateAge(item.waterlevel_datetime) !== null && dateAge(item.waterlevel_datetime) < 6 * 60 * 60 * 1000);
  const riverWarnings = rows('waterlevel').filter(item => riverRisk(item) === 2 && dateAge(item.waterlevel_datetime) !== null && dateAge(item.waterlevel_datetime) < 6 * 60 * 60 * 1000);
  const canalAlerts = rows('canal').filter(item => {
    const val = numeric(item.canal_value), threshold = numeric(item.station?.critical_level);
    return val !== null && threshold !== null && val >= threshold && dateAge(item.canal_datetime) !== null && dateAge(item.canal_datetime) < 6 * 60 * 60 * 1000;
  });
  const bkkCanalAlerts = rows('bkkcanal').filter(item => numeric(item.canal_value) !== null && numeric(item.station?.critical_level) !== null && Number(item.canal_value) >= Number(item.station.critical_level) && dateAge(item.canal_datetime) !== null && dateAge(item.canal_datetime) < 3 * 60 * 60 * 1000);
  const roadAlerts = rows('floodroad').filter(item => numeric(item.floodroad_value) > 0 && dateAge(item.floodroad_datetime) !== null && dateAge(item.floodroad_datetime) < 6 * 60 * 60 * 1000);
  const bkkRoadAlerts = rows('bkkroad').filter(item => numeric(item.floodroad_value) > 0 && dateAge(item.floodroad_datetime) !== null && dateAge(item.floodroad_datetime) < 3 * 60 * 60 * 1000);
  const maxRain = [...rows('rain'),...rows('bkkrain')].filter(item => numeric(item.rain_24h) !== null && dateAge(item.rainfall_datetime) !== null && dateAge(item.rainfall_datetime) < 6 * 60 * 60 * 1000).sort((a,b) => Number(b.rain_24h) - Number(a.rain_24h))[0];
  const availableFeeds = Object.values(state).filter(s => s.ok).length;
  const selectedRows = key => filter(rows(key), key).sort((a,b) => {
    const priority = severity(b,key) - severity(a,key);
    if (priority) return priority;
    const aTime = dateAge(readingTime(a,key));
    const bTime = dateAge(readingTime(b,key));
    return (aTime === null ? Infinity : aTime) - (bTime === null ? Infinity : bTime);
  });
  const prioritizedAlerts = [
    ...riverAlerts.map(item => ({ item, key: 'waterlevel' })),
    ...riverWarnings.map(item => ({ item, key: 'waterlevel' })),
    ...rows('bkkriver').filter(item => severity(item,'bkkriver') >= 2).map(item => ({ item, key:'bkkriver' })),
    ...rows('bkkcanal').filter(item => severity(item,'bkkcanal') === 2).map(item => ({ item, key:'bkkcanal' })),
    ...canalAlerts.map(item => ({ item, key: 'canal' })),
    ...bkkCanalAlerts.map(item => ({ item, key: 'bkkcanal' })),
    ...roadAlerts.map(item => ({ item, key: 'floodroad' })),
    ...bkkRoadAlerts.map(item => ({ item, key: 'bkkroad' }))
  ].sort((a,b) => severity(b.item,b.key) - severity(a.item,a.key) || dateAge(readingTime(a.item,a.key)) - dateAge(readingTime(b.item,b.key)));
  const searchIndex = useMemo(() => feeds.filter(feed => !['bkktide','tide','storm','news'].includes(feed.key)).flatMap(feed => (feed.key === 'bkkcanal' ? bkkCanalRows : feed.key === 'bkkriver' ? bkkRiverRows : data[feed.key] || []).map(item => ({
    id: item.id, key: feed.key, category: feed.label, title: name(item,feed.key),
    area: `${item.geocode?.amphoe_name?.th || ''} ${province(item)}`.trim(), province: province(item),
    terms: normalizedSearch([name(item,feed.key),province(item),item.geocode?.amphoe_name?.th,item.geocode?.tumbon_name?.th,item.description,item.id,item.code,item.station?.tele_station_oldcode,item.station?.canal_oldcode,item.station?.flow_name?.th,item.agency?.agency_shortname?.th,item.river_name,item.station?.river_name?.th].filter(Boolean).join(' ')),
    timestamp: time(readingTime(item,feed.key)), priority: severity(item,feed.key),
    age: dateAge(readingTime(item,feed.key)), point: pointOf(item,feed.key),
    camera: ['bkkcctv','livecctv','cctv'].includes(feed.key) ? item : null
  }))), [data,bkkCanalRows,bkkRiverRows]);
  const searchResults = useMemo(() => {
    const needle = normalizedSearch(query);
    if (!needle) return [];
    const stationMatches = searchIndex.filter(item => (provinceFilter === 'all' || item.province === provinceFilter) && item.terms.includes(needle));
    const communityMatches = reports.filter(item => (provinceFilter === 'all' || item.province === provinceFilter) && normalizedSearch(`${item.title} ${item.description} ${item.district} ${item.province}`).includes(needle)).map(item => ({
      id: item.id, key: 'report', category: 'ประชาชนแจ้ง', title: item.title,
      area: `${item.district || ''} ${item.province}`.trim(), timestamp: time(item.created_at),
      priority: item.kind === 'help' ? 2 : 0, age: dateAge(item.created_at),
      point: [Number(item.lat),Number(item.lng)], camera: null
    }));
    return [...stationMatches,...communityMatches].sort((a,b)=>b.priority-a.priority || (a.age ?? Infinity)-(b.age ?? Infinity));
  }, [searchIndex,reports,query,provinceFilter]);
  const selectSearchResult = result => {
    if (result.camera) { setSelectedCamera(result.camera); return; }
    setActive(result.point ? 'overview' : ['waterlevel','bkkriver','canal','bkkcanal','flow','bkkflow'].includes(result.key) ? 'water' : ['floodroad','bkkroad'].includes(result.key) ? 'roads' : ['rain','bkkrain'].includes(result.key) ? 'weather' : 'infrastructure');
    if (result.point) {
      const layer = ['waterlevel','bkkriver'].includes(result.key) ? 'rivers' : ['canal','bkkcanal'].includes(result.key) ? 'canals' : ['flow','bkkflow'].includes(result.key) ? 'flows' : ['floodroad','bkkroad'].includes(result.key) ? 'roads' : ['rain','bkkrain'].includes(result.key) ? 'rains' : result.key === 'report' ? 'reports' : 'watergates';
      setFocusPoint({ lat: result.point[0], lng: result.point[1], layer, nonce: Date.now() });
      setTimeout(() => document.querySelector('.map-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
    }
  };
  const mapData = useMemo(() => ({
    rivers: [...filter(rows('waterlevel'),'waterlevel'),...filter(rows('bkkriver'),'bkkriver')],
    canals: [...filter(rows('canal'),'canal'),...filter(rows('bkkcanal'),'bkkcanal')],
    watergates: filter(rows('watergate'),'watergate'),
    flows: [...filter(rows('flow'),'flow'),...filter(rows('bkkflow'),'bkkflow')],
    roads: [...filter(rows('floodroad'),'floodroad'),...filter(rows('bkkroad'),'bkkroad')],
    tides: rows('tide'),
    rains: [...filter(rows('rain'),'rain'),...filter(rows('bkkrain'),'bkkrain')],
    cctvs: [...filter(rows('cctv'),'cctv'),...filter(rows('bkkcctv'),'bkkcctv'),...filter(rows('livecctv'),'livecctv')]
  }), [data.waterlevel,bkkRiverRows,data.bkkrain,data.canal,bkkCanalRows,data.watergate,data.flow,data.bkkflow,data.floodroad,data.bkkroad,data.tide,data.rain,data.cctv,data.bkkcctv,data.livecctv,query,provinceFilter]);

  return <div className="site-shell">
    <header className="masthead">
      <div className="masthead-inner">
        <div className="brand"><div className="brand-mark"><Waves size={23}/></div><div><strong>เฝ้าระวังน้ำไทย</strong><span>THAILAND WATER WATCH</span></div></div>
        <div className="header-right"><span className="header-status"><span className={availableFeeds ? 'status-dot' : 'status-dot offline'} />แหล่งข้อมูลที่เชื่อมได้ {availableFeeds}/{feeds.length}</span><button className="refresh-button" onClick={load} disabled={refreshing}><RefreshCw size={16} className={refreshing ? 'spin' : ''}/>{refreshing ? 'กำลังตรวจ...' : 'อัปเดตข้อมูล'}</button></div>
      </div>
    </header>
    {active === 'overview' && <div className="hero"><div className="hero-inner"><div><div className="eyebrow">ข้อมูลสถานีตรวจวัดจากแหล่งสาธารณะ</div><h1>ติดตามสถานการณ์น้ำทั่วประเทศไทย</h1><p>ระดับแม่น้ำ คลอง ฝน น้ำทะเล ประตูระบายน้ำ ถนน และกล้องที่แหล่งข้อมูลเปิดให้เข้าถึง ตรวจสอบเวลาวัดและสถานะต้นทางก่อนใช้ตัดสินใจ</p></div><div className="hero-meta"><span>ตรวจสอบล่าสุด</span><strong>{checkedAt ? checkedAt.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }) : 'กำลังเชื่อมต่อ...'}</strong><small>เวลาไทย · ข้อมูลทั่วไป 2 นาที · กล้อง/ข่าว 1 นาที</small></div></div></div>}
    <nav className="section-nav" aria-label="หมวดหมู่ข้อมูล"><div className="nav-inner">{sections.map(([id,label,Icon]) => <button key={id} className={active === id ? 'nav-item active' : 'nav-item'} onClick={() => setActive(id)}><Icon size={17}/>{label}</button>)}</div><select className="mobile-nav" aria-label="เลือกหมวดข้อมูล" value={active} onChange={e=>setActive(e.target.value)}>{sections.map(([id,label])=><option value={id} key={id}>{label}</option>)}</select></nav>
    <main className="main-content">
      {active !== 'sources' && <div className="toolbar"><div className="toolbar-title"><span>{sections.find(s => s[0] === active)?.[1]}</span><small>เลือกหมวดจากแถบด้านบน</small></div><div className="filters"><label className="search"><Search size={17}/><input aria-label="ค้นหาสถานีหรือพื้นที่" placeholder="ค้นหาสถานี เขต หรือจังหวัด" value={inputQuery} onChange={e=>setQuery(e.target.value)}/></label><select aria-label="เลือกจังหวัด" value={provinceFilter} onChange={e=>setProvinceFilter(e.target.value)}><option value="all">ทุกจังหวัด</option>{provinces.map(p=><option key={p}>{p}</option>)}</select></div></div>}
      <div className="notice"><AlertTriangle size={18}/><span>ค่าที่แสดงเป็นข้อมูลจากสถานีต้นทางตามเวลาตรวจวัด ไม่ใช่การแจ้งเตือนภัยอย่างเป็นทางการ หากแหล่งข้อมูลขัดข้อง ระบบจะไม่แสดงค่าจากไฟล์เก่าแทน</span></div>
      {active === 'overview' && <div className="summary-grid">
        {state.waterlevel?.ok && rows('waterlevel').length > 0 && <Summary title="แม่น้ำถึงเกณฑ์วิกฤต/ล้นตลิ่ง" value={state.waterlevel?.ok ? riverAlerts.length : '—'} detail={state.waterlevel?.ok ? `จาก ${rows('waterlevel').length.toLocaleString('th-TH')} สถานี` : 'ยังดึงข้อมูลไม่ได้'} tone="red" onClick={() => setActive('water')}/>}
        {(rows('canal').length > 0 || rows('bkkcanal').length > 0) && <Summary title="รายการคลองถึงเกณฑ์วิกฤต" value={state.canal?.ok || state.bkkcanal?.ok ? canalAlerts.length + bkkCanalAlerts.length : '—'} detail={state.canal?.ok || state.bkkcanal?.ok ? `ThaiWater ${rows('canal').length} · กทม. ${rows('bkkcanal').length}` : 'ยังดึงข้อมูลไม่ได้'} tone="orange" onClick={() => setActive('water')}/>}
        {(rows('floodroad').length > 0 || rows('bkkroad').length > 0) && <Summary title="จุดถนนมีน้ำ (ข้อมูลสด)" value={state.floodroad?.ok || state.bkkroad?.ok ? roadAlerts.length + bkkRoadAlerts.length : '—'} detail={state.floodroad?.ok || state.bkkroad?.ok ? `ThaiWater ${rows('floodroad').length} · กทม. ${rows('bkkroad').length}` : 'ยังดึงข้อมูลไม่ได้'} tone="blue" onClick={() => setActive('roads')}/>}
        {maxRain && <Summary title="ฝนสูงสุด 24 ชม. (ข้อมูลสด)" value={maxRain ? `${maxRain.rain_24h} มม.` : '—'} detail={maxRain ? `${name(maxRain,'rain')} · ${province(maxRain)}` : 'ยังดึงข้อมูลไม่ได้'} tone="teal" onClick={() => setActive('weather')}/>}
      </div>}
      {active === 'overview' && <NewsStrip items={rows('news')}/>}

      {query.trim() && <GlobalSearchResults results={searchResults} query={query} onSelect={selectSearchResult}/>}
      {active === 'overview' && <div className="overview-grid"><div className="panel map-panel"><div className="panel-heading"><div><h2>แผนที่สถานีตรวจวัด</h2><p>จุดที่มีพิกัดจากข้อมูลต้นทาง · เปิด/ปิดชั้นข้อมูลในแผนที่</p></div><span className="soft-tag">ประเทศไทย</span></div><MapComponent {...mapData} focusPoint={focusPoint} searchKey={`${query}|${provinceFilter}`} onOpenCctv={setSelectedCamera} reports={reports}/></div><aside className="panel alerts-panel"><div className="panel-heading"><div><h2>จุดที่ถึงเกณฑ์</h2><p>เฉพาะค่าที่มีเวลาวัดไม่เกิน 6 ชั่วโมง</p></div></div>{prioritizedAlerts.length ? prioritizedAlerts.slice(0,20).map(({item,key},i)=><div className="alert-row" key={`${key}-${item.id || i}`}><span className={severity(item,key) === 2 ? 'alert-pin warning' : 'alert-pin'}/><div><strong>{name(item,key)}</strong><small>{province(item)} · {time(readingTime(item,key))}</small></div><span className="alert-value">{fmt((key === 'waterlevel' || key === 'bkkriver') ? item.waterlevel_msl ?? item.waterlevel_m : key === 'canal' || key === 'bkkcanal' ? item.canal_value : item.floodroad_value, key === 'floodroad' || key === 'bkkroad' ? ' ซม.' : ' ม.')}</span></div>) : <Empty label={availableFeeds ? 'ยังไม่มีจุดที่ถึงเกณฑ์ในข้อมูลที่เชื่อมได้' : 'กำลังรอข้อมูลจากแหล่งต้นทาง'}/>}<button className="text-link" onClick={()=>setActive('water')}>ดูข้อมูลแม่น้ำและคลอง <ArrowUpRight size={15}/></button></aside></div>}
      {active === 'water' && <div className="content-stack"><Section title="เจ้าพระยาและแนวโน้มระดับน้ำ" subtitle="ข้อมูล: สสน. และสำนักการระบายน้ำ กทม. ผ่าน POPNIX Flood · เทียบประมาณ 1 ชั่วโมงก่อน" feed={state.bkkriver} code="bkkriver"><DataTable items={selectedRows('bkkriver')} columns={['จุดวัด / ลำน้ำ','ระดับน้ำ ม.รทก.','สถานะ','เปลี่ยนประมาณ 1 ชม.','เวลาวัด']} render={item=>[<Place key="p" item={item} type="bkkriver"/>,fmt(item.waterlevel_msl,' ม.'),severity(item,'bkkriver')<0?'ข้อมูลเก่า':crisis(item)?'ล้นตลิ่ง/ถึงเกณฑ์':riverRisk(item)===2?'น้ำมาก':'ตามข้อมูลต้นทาง',trend(item),time(item.waterlevel_datetime)]}/></Section><Section title="การไหลและความเร็วกระแสน้ำ กทม." subtitle="ข้อมูล: สำนักการระบายน้ำ กรุงเทพมหานคร ผ่าน POPNIX Flood (flood.pop.in.th)" feed={state.bkkflow} code="bkkflow"><DataTable items={selectedRows('bkkflow')} columns={['จุดวัด / เขต','อัตราการไหล','ความเร็ว','พื้นที่หน้าตัด','เวลาวัด']} render={item=>[<Place key="p" item={item} type="bkkflow"/>,fmt(item.flow_value,' ลบ.ม./วินาที'),fmt(item.speed,' ม./วินาที'),fmt(item.area,' ตร.ม.'),time(item.flow_datetime)]}/></Section><Section title="แม่น้ำและลำน้ำ" subtitle="ระดับและเกณฑ์สถานีจาก ThaiWater" feed={state.waterlevel} code="waterlevel"><DataTable items={selectedRows('waterlevel',250)} type="waterlevel" columns={['สถานี / พื้นที่','ระดับน้ำ','สถานะ','เวลาตรวจวัด']} render={item=>[<Place key="p" item={item} type="waterlevel"/>,fmt(item.waterlevel_msl ?? item.waterlevel_m,' ม.'),dateAge(item.waterlevel_datetime) === null || dateAge(item.waterlevel_datetime) >= 6*60*60*1000 ? 'ข้อมูลเก่า/ไม่ระบุเวลา' : crisis(item)?'ล้นตลิ่ง/ถึงเกณฑ์วิกฤต':riverRisk(item)===2?'น้ำมาก · เฝ้าระวัง':'ตามข้อมูลต้นทาง',time(item.waterlevel_datetime)]}/></Section><Section title="อัตราการไหล" subtitle="หน่วยลูกบาศก์เมตรต่อวินาที · ตรวจเวลาวัด เพราะบางสถานีส่งค่าล่าช้า" feed={state.flow} code="flow"><DataTable items={selectedRows('flow',250)} columns={['สถานี / พื้นที่','อัตราการไหล','ความสด','เวลาตรวจวัด']} render={item=>[<Place key="p" item={item} type="flow"/>,fmt(item.flow_value,' ลบ.ม./วินาที'),dateAge(item.flow_datetime) !== null && dateAge(item.flow_datetime) < 6*60*60*1000 ? 'วัดไม่เกิน 6 ชม.' : 'ข้อมูลเก่า/ไม่ระบุเวลา',time(item.flow_datetime)]}/></Section><Section title="คลอง" subtitle="เกณฑ์วิกฤตตามแต่ละสถานี" feed={state.canal} code="canal"><DataTable items={selectedRows('canal',250)} type="canal" columns={['คลอง / พื้นที่','ระดับน้ำ','เกณฑ์วิกฤต','เวลาตรวจวัด']} render={item=>[<Place key="p" item={item} type="canal"/>,fmt(item.canal_value,' ม.'),fmt(item.station?.critical_level,' ม.'),time(item.canal_datetime)]}/></Section><Section title="คลอง กทม. เพิ่มเติม" subtitle="ข้อมูล: สำนักการระบายน้ำ กรุงเทพมหานคร ผ่าน POPNIX Flood (flood.pop.in.th) · เฉพาะจุดที่ออนไลน์" feed={state.bkkcanal} code="bkkcanal"><DataTable items={selectedRows('bkkcanal',250)} columns={['คลอง / เขต','ระดับน้ำ ม.รทก.','เฝ้าระวัง / วิกฤต','เปลี่ยน 60 นาที','เวลาตรวจวัด']} render={item=>[<Place key="p" item={item} type="bkkcanal"/>,fmt(item.canal_value,' ม.'),`${fmt(item.station?.warning_level)} / ${fmt(item.station?.critical_level)} ม.`,trend(item),time(item.canal_datetime)]}/></Section></div>}
      {active === 'weather' && <div className="content-stack"><WeatherMap/><div className="quick-links"><a href="https://satda.tmd.go.th/" target="_blank" rel="noreferrer"><CloudRain size={19}/> เรดาร์ฝนทั่วประเทศ กรมอุตุนิยมวิทยา <ExternalLink size={15}/></a><a href="https://www.tmd.go.th/" target="_blank" rel="noreferrer"><Wind size={19}/> ประกาศและพยากรณ์อากาศ กรมอุตุนิยมวิทยา <ExternalLink size={15}/></a><a href="https://www.thaiwater.net/risk-rainfall-3-day-forecast" target="_blank" rel="noreferrer"><CloudRain size={19}/> แนวโน้มฝน 3 วัน ThaiWater <ExternalLink size={15}/></a></div><Section title="ฝน กทม. และปริมณฑลเพิ่มเติม" subtitle="ข้อมูล: สสน. และสำนักการระบายน้ำ กรุงเทพมหานคร ผ่าน POPNIX Flood (flood.pop.in.th)" feed={state.bkkrain} code="bkkrain"><DataTable items={selectedRows('bkkrain')} columns={['จุดวัด / เขต','ฝน 24 ชม.','ฝน 3 ชม.','ฝน 1 ชม.','เวลาวัด']} render={item=>[<Place key="p" item={item} type="bkkrain"/>,fmt(item.rain_24h,' มม.'),fmt(item.rain_3h,' มม.'),fmt(item.rain_1h,' มม.'),time(item.rainfall_datetime)]}/></Section><Section title="ฝนสะสม 24 ชั่วโมง" subtitle="ค่าจากสถานีตรวจวัด ไม่ใช่ภาพเรดาร์หรือพยากรณ์" feed={state.rain} code="rain"><DataTable items={selectedRows('rain')} columns={['สถานี / พื้นที่','ฝน 24 ชม.','ฝน 1 ชม.','เวลาตรวจวัด']} render={item=>[<Place key="p" item={item} type="rain"/>,fmt(item.rain_24h,' มม.'),fmt(item.rain_1h,' มม.'),time(item.rainfall_datetime)]}/></Section><Section title="ข้อมูลพายุ" subtitle="แสดงรายการเมื่อแหล่งต้นทางส่งข้อมูล; ตรวจประกาศอย่างเป็นทางการก่อนเสมอ" feed={state.storm} code="storm"><div className="simple-note">{rows('storm').length ? `พบข้อมูล ${rows('storm').length} รายการจากต้นทาง` : 'ต้นทางไม่ส่งรายการพายุในขณะนี้'} · <a href="https://www.tmd.go.th/" target="_blank" rel="noreferrer">ดูประกาศกรมอุตุนิยมวิทยา ↗</a></div></Section></div>}
      {active === 'tide' && <div className="content-stack"><Section title="น้ำขึ้นลงปากแม่น้ำเจ้าพระยา วันนี้" subtitle="ข้อมูลคาดการณ์: สำนักการระบายน้ำ กรุงเทพมหานคร ผ่าน POPNIX Flood (flood.pop.in.th)" feed={state.bkktide} code="bkktide"><DataTable items={rows('bkktide')} columns={['พื้นที่','วันพยากรณ์','น้ำสูงช่วงเช้า','น้ำสูงช่วงเย็น','น้ำต่ำช่วงเช้า','น้ำต่ำช่วงเย็น']} render={item=>[item.name_th,item.date,`${fmt(item.high_am?.v,' ม.')} · ${item.high_am?.t || '—'}`,`${fmt(item.high_pm?.v,' ม.')} · ${item.high_pm?.t || '—'}`,`${fmt(item.low_am?.v,' ม.')} · ${item.low_am?.t || '—'}`,`${fmt(item.low_pm?.v,' ม.')} · ${item.low_pm?.t || '—'}`]}/></Section><Section title="พยากรณ์ระดับน้ำทะเล" subtitle="ค่าจากแบบจำลอง FEWS · วันพยากรณ์ระบุเป็นรายสถานี ไม่ใช่ระดับน้ำที่วัดได้ขณะนี้" feed={state.tide} code="tide"><DataTable items={rows('tide')} columns={['สถานีชายฝั่ง','วันพยากรณ์','สูงสุด / เวลา','ต่ำสุด / เวลา']} render={item=>[<strong key="p">{item.name_th || item.code}</strong>,item.date || 'ไม่ระบุ',`${fmt(item.max_value,' ม.')} · ${item.max_time || '—'}`,`${fmt(item.min_value,' ม.')} · ${item.min_time || '—'}`]}/></Section></div>}
      {active === 'infrastructure' && <Section title="ประตูระบายน้ำและจุดตรวจวัดโครงสร้าง" subtitle="ชุดนี้เป็นจุดวัดประตูน้ำ ยังไม่มีข้อมูลสถานะเครื่องสูบจากต้นทาง" feed={state.watergate} code="watergate"><DataTable items={selectedRows('watergate',250)} columns={['สถานี / พื้นที่','เหนือน้ำ','ท้ายน้ำ','เวลาตรวจวัด']} render={item=>[<Place key="p" item={item} type="watergate"/>,fmt(item.watergate_in,' ม.'),fmt(item.watergate_out,' ม.'),time(item.watergate_datetime_in || item.watergate_datetime_out)]}/></Section>}
      {active === 'roads' && <div className="content-stack"><Section title="ถนน กทม. เพิ่มเติม" subtitle="ข้อมูล: สำนักการระบายน้ำ กรุงเทพมหานคร ผ่าน POPNIX Flood (flood.pop.in.th) · เฉพาะจุดที่ออนไลน์" feed={state.bkkroad} code="bkkroad"><DataTable items={selectedRows('bkkroad',250)} columns={['ถนน / เขต','ระดับน้ำ','สถานะ','เวลาตรวจวัด']} render={item=>[<Place key="p" item={item} type="bkkroad"/>,fmt(item.floodroad_value,' ซม.'),dateAge(item.floodroad_datetime) === null || dateAge(item.floodroad_datetime) >= 6*60*60*1000 ? 'ข้อมูลเก่า/ไม่ระบุเวลา' : numeric(item.floodroad_value)>0?'มีน้ำ':'ไม่พบระดับน้ำ',time(item.floodroad_datetime)]}/></Section><Section title="น้ำท่วมผิวถนน" subtitle="ระดับน้ำตามเซนเซอร์/รายการที่ต้นทางเปิดเผย" feed={state.floodroad} code="floodroad"><DataTable items={selectedRows('floodroad',250)} columns={['ถนน / พื้นที่','ระดับน้ำ','สถานะ','เวลาตรวจวัด']} render={item=>[<Place key="p" item={item} type="floodroad"/>,fmt(item.floodroad_value,' ซม.'),dateAge(item.floodroad_datetime) === null || dateAge(item.floodroad_datetime) >= 6*60*60*1000 ? 'ข้อมูลเก่า/ไม่ระบุเวลา' : numeric(item.floodroad_value)>0?'มีน้ำ':'ไม่พบระดับน้ำ',time(item.floodroad_datetime)]}/></Section></div>}
      {active === 'cameras' && <div className="content-stack"><Section title="กล้องสตรีมสดทั่วประเทศ" subtitle="ดัชนีสตรีมสาธารณะจาก MAHOLAN CCTV · แสดงเฉพาะภาพที่โหลดได้ · สตรีมต้นทางอาจหยุดได้ทุกเวลา" feed={state.livecctv} code="livecctv"><CameraGallery cameras={selectedRows('livecctv')} onSelect={setSelectedCamera} source={`live-${query}-${provinceFilter}-${state.livecctv?.timestamp || 0}`}/></Section><Section title="กล้อง กทม. ภาพใหม่ไม่เกิน 15 นาที" subtitle="ข้อมูล: สำนักการระบายน้ำ กรุงเทพมหานคร ผ่าน POPNIX Flood (flood.pop.in.th) · กล้องจราจรและจุดตรวจน้ำท่วม" feed={state.bkkcctv} code="bkkcctv"><CameraGallery cameras={selectedRows('bkkcctv')} onSelect={setSelectedCamera} source={`bkk-${query}-${provinceFilter}-${state.bkkcctv?.timestamp || 0}`}/></Section><Section title="กล้องจากรายการที่เปิดเผย" subtitle="จำนวนกล้องคือรายการที่ API ส่งมา ไม่ยืนยันว่าเปิดภาพได้ทุกตัว" feed={state.cctv} code="cctv"><CameraGallery cameras={selectedRows('cctv')} onSelect={setSelectedCamera} source={`thaiwater-${query}-${provinceFilter}-${state.cctv?.timestamp || 0}`}/></Section></div>}
      {active === 'help' && <div className="help-grid"><div className="panel help-card"><h2>ต้องการความช่วยเหลือขณะนี้</h2><p>ติดต่อกรมป้องกันและบรรเทาสาธารณภัยเพื่อแจ้งเหตุและประสานหน่วยงานในพื้นที่</p><a className="help-primary" href="tel:1784">โทร 1784</a><a href="https://www.disaster.go.th/home" target="_blank" rel="noreferrer">เว็บไซต์ ปภ. และประกาศทางการ ↗</a></div><div className="panel help-card"><h2>จุดพักพิงและข้อมูลชุมชน</h2><p>ดูรายการอัปเดตจากเครือข่ายที่คุณส่งมา โปรดตรวจเวลารายงานและยืนยันกับพื้นที่ก่อนเดินทาง</p><a href="https://flood69.peoplesparty.or.th/#events" target="_blank" rel="noreferrer">เปิดหน้าเหตุการณ์และจุดช่วยเหลือ ↗</a></div><div className="help-card wide report-section"><CommunityReports reports={reports} provinces={provinces} error={reportsError} onCreated={loadReports}/></div></div>}
      {active === 'sources' && <div className="panel sources-panel"><div className="panel-heading"><div><h2>สถานะและที่มาของข้อมูล</h2><p>จำนวนรายการหมายถึงสิ่งที่ต้นทางส่งมา ไม่ใช่จำนวนสถานีทั้งหมดในประเทศไทย</p></div></div><div className="source-grid">{feeds.map(feed=><div className="source-card" key={feed.key}><div><span className={state[feed.key]?.ok?'source-light':'source-light failed'}/><strong>{feed.label}</strong></div><p>{state[feed.key]?.ok ? `${state[feed.key].count.toLocaleString('th-TH')} รายการ · ดึงสำเร็จ ${state[feed.key].timestamp ? new Date(state[feed.key].timestamp).toLocaleTimeString('th-TH',{timeZone:'Asia/Bangkok'}) : ''}${state[feed.key].freshCount != null ? ` · ${feed.key === 'bkkcctv' ? 'ภาพไม่เกิน 15 นาที' : feed.key === 'news' ? 'เผยแพร่ไม่เกิน 6 ชม.' : 'วัดไม่เกิน 6 ชม.'} ${state[feed.key].freshCount}` : ''}` : state[feed.key] ? `เชื่อมต่อไม่ได้ · ${state[feed.key].error}` : 'กำลังตรวจสอบ'}</p><a href={feed.url} target="_blank" rel="noreferrer">เปิดแหล่งข้อมูล <ExternalLink size={13}/></a></div>)}</div><p className="source-foot">ยังไม่ครอบคลุมกล้องทุกหน่วยงาน ผังเมือง เส้นคลองทุกสาย หรือภาพดาวเทียม Google รายงานประชาชนแยกจากข้อมูลหน่วยงานและยังไม่ผ่านการยืนยัน</p><div className="reference-links"><strong>เว็บอ้างอิงที่สำรวจ</strong><a href="https://flood.pop.in.th/" target="_blank" rel="noreferrer">POPNIX Flood</a><a href="https://floodbangkok.bangkok.go.th/" target="_blank" rel="noreferrer">น้ำท่วมถนน กทม.</a><a href="https://faonam.com/p/12" target="_blank" rel="noreferrer">เฝ้าน้ำ นนทบุรี</a><a href="https://cctv.maholan.net/" target="_blank" rel="noreferrer">Flood CCTV Thailand</a></div></div>}
    </main>
    <footer>ข้อมูลเพื่อเฝ้าระวังเบื้องต้น · เมื่อต้องการความช่วยเหลือฉุกเฉิน โปรดติดต่อหน่วยงานในพื้นที่ · <a href="https://www.thaiwater.net/" target="_blank" rel="noreferrer">ThaiWater</a> · <a href="https://www.tmd.go.th/" target="_blank" rel="noreferrer">กรมอุตุนิยมวิทยา</a></footer>
    {selectedCamera && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="ภาพกล้อง" onClick={()=>setSelectedCamera(null)}><div className="camera-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setSelectedCamera(null)}>ปิด ×</button><h2>{name(selectedCamera,'cctv')}</h2><p>{province(selectedCamera)} · {selectedCamera.image_timestamp ? `ภาพล่าสุด ${new Date(selectedCamera.image_timestamp).toLocaleString('th-TH',{timeZone:'Asia/Bangkok'})}` : 'ไม่ระบุเวลาภาพ'} · {selectedCamera.agency?.agency_shortname?.th || 'ไม่ระบุหน่วยงาน'}</p>{selectedCamera.stream_url ? <LiveCameraPlayer camera={selectedCamera}/> : <CameraImage camera={selectedCamera} className="camera-large"/>}{/^https?:\/\//.test(selectedCamera.cctv_url || '') && <a href={selectedCamera.cctv_url} target="_blank" rel="noreferrer">เปิดภาพที่ต้นทาง ↗</a>}</div></div>}
  </div>;
}
function Summary({title,value,detail,tone,onClick}) { return <button className={`summary-card ${tone}`} onClick={onClick}><span>{title}</span><strong>{value}</strong><small>{detail}</small></button>; }
function Empty({label}) { return <div className="empty-state">{label}</div>; }
function Place({item,type}) { return <div className="place"><strong>{name(item,type)}</strong><small>{item.geocode?.amphoe_name?.th ? `${item.geocode.amphoe_name.th} · ` : ''}{province(item)}</small></div>; }
function Section({title,subtitle,feed,code,children}) { const filteredCount = children?.props?.items?.length ?? children?.props?.cameras?.length; if (!feed?.ok || !feed.count || filteredCount === 0) return null; return <section className="panel data-section"><div className="panel-heading"><div><h2>{title}</h2><p>{subtitle}</p></div><span className={feed?.ok?'feed-pill':'feed-pill failed'}>{feed?.ok ? `${filteredCount != null && filteredCount !== feed.count ? filteredCount.toLocaleString('th-TH') + '/' : ''}${feed.count.toLocaleString('th-TH')} รายการ` : 'ไม่มีข้อมูลสด'}</span></div>{feed?.ok ? children : <Empty label={feed ? `ไม่มีข้อมูลปัจจุบันจากแหล่งนี้ · ${feed.error || 'ตรวจสอบต้นทาง'}` : 'กำลังเชื่อมต่อแหล่งข้อมูล'}/>}<a className="source-inline" href={feeds.find(f=>f.key===code)?.url} target="_blank" rel="noreferrer">ตรวจสอบแหล่งข้อมูล ↗</a></section>; }
function DataTable({items,columns,render}) {
  const [limit,setLimit] = useState(25);
  const [pageSize,setPageSize] = useState(25);
  useEffect(() => { const size = window.matchMedia('(max-width:700px)').matches ? 25 : 100; setLimit(size); setPageSize(size); }, []);
  return <div className="table-wrap"><table><thead><tr>{columns.map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{items.slice(0,limit).map((item,i)=><tr key={item.id || item.station?.id || i}>{render(item).map((cell,j)=><td key={j} data-label={columns[j]}>{cell}</td>)}</tr>)}</tbody></table>{!items.length && <Empty label="ไม่มีรายการตามเงื่อนไขที่เลือก"/>}{items.length > limit && <button className="gallery-more" onClick={()=>setLimit(n=>n+pageSize)}>ดูเพิ่มอีก {Math.min(pageSize,items.length-limit)} จาก {items.length.toLocaleString('th-TH')} รายการ</button>}</div>;
}
