/**
 * Thailand Water, Flood, Pumping Stations & Marine Tide Command Center
 * Connects directly to Official Thai Government APIs & Local Real-time Gateways
 */

// Application State
const state = {
  rivers: [],
  canals: [],
  watergates: [],
  roads: [],
  cctvs: [],
  rains: [],
  tides: [],
  storms: [],
  criticalStations: [],
  activeTab: 'map',
  soundEnabled: true,
  searchQuery: '',
  selectedRegion: 'all',
  map: null,
  mapLayers: {
    rivers: null,
    canals: null,
    watergates: null,
    roads: null,
    tides: null,
    cctv: null
  },
  markers: []
};

// ================= AUDIO ALERT SYNTHESIZER (Web Audio API) =================
let audioCtx = null;
function playAlarmSound() {
  if (!state.soundEnabled) return;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sawtooth';
    const now = audioCtx.currentTime;

    // Siren sweep
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.linearRampToValueAtTime(950, now + 0.35);
    osc.frequency.linearRampToValueAtTime(600, now + 0.7);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.75);
  } catch (e) {
    console.warn('Audio synthesis error:', e);
  }
}

// ================= LIVE CLOCK =================
function initClock() {
  function update() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('th-TH', { hour12: false }) + ' น.';
    const dateStr = now.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
    const clockEl = document.getElementById('liveClock');
    const dateEl = document.getElementById('liveDate');
    if (clockEl) clockEl.textContent = timeStr;
    if (dateEl) dateEl.textContent = dateStr;
  }
  update();
  setInterval(update, 1000);
}

// ================= INITIALIZE LEAFLET MAP =================
function initMap() {
  const mapContainer = document.getElementById('mainMap');
  if (!mapContainer || state.map) return;

  // Center on Central Thailand
  state.map = L.map('mainMap', {
    zoomControl: true,
    attributionControl: false
  }).setView([13.7563, 100.5018], 7);

  // CartoDB Dark Matter tiles (High contrast for crisis maps)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    subdomains: 'abcd'
  }).addTo(state.map);

  // Layer Groups
  state.mapLayers.rivers = L.layerGroup().addTo(state.map);
  state.mapLayers.canals = L.layerGroup().addTo(state.map);
  state.mapLayers.watergates = L.layerGroup().addTo(state.map);
  state.mapLayers.roads = L.layerGroup().addTo(state.map);
  state.mapLayers.tides = L.layerGroup().addTo(state.map);
  state.mapLayers.cctv = L.layerGroup().addTo(state.map);

  // Layer Checkbox Listeners
  setupLayerCheckbox('layerWaterlevel', state.mapLayers.rivers);
  setupLayerCheckbox('layerCanal', state.mapLayers.canals);
  setupLayerCheckbox('layerWatergate', state.mapLayers.watergates);
  setupLayerCheckbox('layerRoad', state.mapLayers.roads);
  setupLayerCheckbox('layerTide', state.mapLayers.tides);
  setupLayerCheckbox('layerCctv', state.mapLayers.cctv);

  // Zoom button shortcuts
  document.getElementById('btnMapReset')?.addEventListener('click', () => {
    state.map.setView([13.7367, 100.5231], 6);
  });
  document.getElementById('btnMapBkk')?.addEventListener('click', () => {
    state.map.setView([13.7850, 100.5400], 11);
  });
}

function setupLayerCheckbox(id, layer) {
  const chk = document.getElementById(id);
  if (!chk) return;
  chk.addEventListener('change', () => {
    if (chk.checked) {
      state.map.addLayer(layer);
    } else {
      state.map.removeLayer(layer);
    }
  });
}

// ================= FETCH ALL GOVERNMENT DATA =================
async function loadAllData() {
  const refreshBtn = document.getElementById('btnRefresh');
  const spinner = document.getElementById('refreshSpinner');
  if (spinner) spinner.classList.add('animate-spin');

  try {
    const [
      resRivers,
      resCanals,
      resGates,
      resRoads,
      resCctv,
      resRain,
      resTide,
      resStorm
    ] = await Promise.all([
      fetch('/api/waterlevel').then(r => r.json()).catch(() => ({ data: { waterlevel_data: { data: [] } } })),
      fetch('/api/canal').then(r => r.json()).catch(() => ({ data: { data: [] } })),
      fetch('/api/watergate').then(r => r.json()).catch(() => ({ data: { watergate_data: { data: [] } } })),
      fetch('/api/floodroad').then(r => r.json()).catch(() => ({ data: { data: [] } })),
      fetch('/api/cctv').then(r => r.json()).catch(() => ({ data: { data: [] } })),
      fetch('/api/rain').then(r => r.json()).catch(() => ({ data: { data: [] } })),
      fetch('/api/tide').then(r => r.json()).catch(() => ({ raw_csv: '' })),
      fetch('/api/storm').then(r => r.json()).catch(() => ({ data: { data: [] } }))
    ]);

    // Parse Data
    state.rivers = resRivers.data?.waterlevel_data?.data || [];
    state.canals = resCanals.data?.data || [];
    state.watergates = resGates.data?.watergate_data?.data || [];
    state.roads = resRoads.data?.data || [];
    state.cctvs = resCctv.data?.data || [];
    state.rains = resRain.data?.data || [];
    state.storms = resStorm.data?.data || [];

    // Parse Tides CSV from Royal Thai Navy
    parseTidesCsv(resTide.raw_csv || '');

    // Identify Critical Stations
    computeCrisisData();

    // Render Everything
    renderTopMetrics();
    renderCrisisTicker();
    renderMapMarkers();
    renderCrisisTab();
    renderTideTab();
    renderWatergatesTab();
    renderCctvTab();
    renderRainTab();
    renderRoadTab();

    // Trigger siren once if new critical stations exist
    if (state.criticalStations.length > 0) {
      playAlarmSound();
    }
  } catch (err) {
    console.error('Error loading data:', err);
  } finally {
    if (spinner) spinner.classList.remove('animate-spin');
  }
}

// Parse Royal Thai Navy Tides CSV
function parseTidesCsv(rawCsv) {
  if (!rawCsv) return;
  const lines = rawCsv.trim().split('\n');
  if (lines.length < 2) return;
  const items = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length >= 10) {
      items.push({
        code: cols[0]?.trim(),
        name_th: cols[1]?.trim(),
        name_en: cols[2]?.trim(),
        lat: parseFloat(cols[3]),
        long: parseFloat(cols[4]),
        date: cols[5]?.trim(),
        max_value: parseFloat(cols[6]),
        max_time: cols[7]?.trim(),
        min_value: parseFloat(cols[8]),
        min_time: cols[9]?.trim(),
        t00: cols[10]?.trim(),
        t04: cols[11]?.trim(),
        t08: cols[12]?.trim(),
        t12: cols[13]?.trim(),
        t16: cols[14]?.trim(),
        t20: cols[15]?.trim()
      });
    }
  }
  state.tides = items;
}

// Compute Crisis & Overflowing Stations
function computeCrisisData() {
  const critical = [];

  // 1. Critical River Stations (situation_level >= 4 or ล้นตลิ่ง)
  state.rivers.forEach(item => {
    const isOverflow = item.diff_wl_bank_text && item.diff_wl_bank_text.includes('ล้นตลิ่ง');
    const level = item.situation_level || 1;
    if (isOverflow || level >= 4) {
      critical.push({
        type: 'river',
        id: item.id,
        name: item.station?.tele_station_name?.th || item.station?.tele_station_name?.en || 'สถานีไม่ระบุชื่อ',
        waterbody: item.river_name || item.basin?.basin_name?.th || 'แม่น้ำ/ลำน้ำ',
        province: item.geocode?.province_name?.th || '',
        amphoe: item.geocode?.amphoe_name?.th || '',
        basin: item.basin?.basin_name?.th || '',
        currentLevel: item.waterlevel_msl || item.waterlevel_m || '-',
        bankLevel: item.station?.min_bank || '-',
        diffBank: item.diff_wl_bank || '0',
        diffText: isOverflow ? `ล้นตลิ่ง +${item.diff_wl_bank} ม.` : 'ระดับวิกฤต',
        isOverflow: isOverflow,
        level: level,
        agency: item.agency?.agency_shortname?.th || 'ชป./สสน.',
        datetime: item.waterlevel_datetime || '',
        lat: item.station?.tele_station_lat,
        long: item.station?.tele_station_long
      });
    }
  });

  // 2. Critical Canal Stations
  state.canals.forEach(item => {
    const val = item.canal_value;
    const crit = item.station?.critical_level;
    const warn = item.station?.warning_level;
    const isCrit = (crit !== null && val >= crit) || (warn !== null && val >= warn);
    if (isCrit) {
      critical.push({
        type: 'canal',
        id: item.station?.id,
        name: item.station?.canal_name?.th || 'คลองไม่ระบุชื่อ',
        waterbody: 'คลอง',
        province: item.geocode?.province_name?.th || 'กรุงเทพมหานคร',
        amphoe: item.geocode?.amphoe_name?.th || '',
        basin: 'ลุ่มน้ำเจ้าพระยา / คลอง กทม.',
        currentLevel: val,
        bankLevel: item.station?.bank || '-',
        diffBank: crit ? (val - crit).toFixed(2) : '0',
        diffText: (crit && val >= crit) ? `ระดับวิกฤต (เกินเกณฑ์ +${(val - crit).toFixed(2)} ม.)` : 'ระดับเฝ้าระวังเตือนภัย',
        isOverflow: val >= (item.station?.bank || 999),
        level: (crit && val >= crit) ? 5 : 4,
        agency: item.agency?.agency_name?.th || 'สำนักการระบายน้ำ กทม.',
        datetime: item.canal_datetime || '',
        lat: item.station?.canal_lat,
        long: item.station?.canal_long
      });
    }
  });

  // Sort: highest overflow / critical first
  critical.sort((a, b) => (parseFloat(b.diffBank) || 0) - (parseFloat(a.diffBank) || 0));
  state.criticalStations = critical;
}

// ================= TOP METRIC CARDS =================
function renderTopMetrics() {
  // 1. Critical Count
  const elCrit = document.getElementById('statCrisisCount');
  if (elCrit) elCrit.textContent = state.criticalStations.length;
  const elBadge = document.getElementById('tabCrisisBadge');
  if (elBadge) elBadge.textContent = state.criticalStations.length;
  const elBadgeLg = document.getElementById('crisisBadgeLarge');
  if (elBadgeLg) elBadgeLg.textContent = state.criticalStations.length;

  // 2. Canal Count in Crisis
  const canalCount = state.criticalStations.filter(s => s.type === 'canal').length;
  const elCanal = document.getElementById('statCanalCount');
  if (elCanal) elCanal.textContent = canalCount;

  // 3. Max Tide
  let maxTideVal = -999;
  let maxTideStation = 'ป้อมพระจุลจอมเกล้า';
  state.tides.forEach(t => {
    if (t.max_value > maxTideVal) {
      maxTideVal = t.max_value;
      maxTideStation = t.name_th;
    }
  });
  const elTide = document.getElementById('statMaxTide');
  if (elTide && maxTideVal > -999) elTide.textContent = `+${maxTideVal.toFixed(2)}`;
  const elTideStn = document.getElementById('statTideStation');
  if (elTideStn) elTideStn.textContent = maxTideStation;
  const elTideHi = document.getElementById('tideHighlightVal');
  if (elTideHi && maxTideVal > -999) elTideHi.textContent = `+${maxTideVal.toFixed(2)} ม.`;

  // 4. Max 24h Rain
  let maxRainVal = 0;
  let maxRainLoc = '-';
  state.rains.forEach(r => {
    if (r.rain_24h > maxRainVal) {
      maxRainVal = r.rain_24h;
      maxRainLoc = `${r.station?.tele_station_name?.th || ''} (${r.geocode?.province_name?.th || ''})`;
    }
  });
  const elRain = document.getElementById('statMaxRain');
  if (elRain) elRain.textContent = maxRainVal.toFixed(1);
  const elRainLoc = document.getElementById('statRainLocation');
  if (elRainLoc) elRainLoc.textContent = maxRainLoc;

  // 5. Road Flood Spots
  const activeRoads = state.roads.filter(r => r.floodroad_value > 0);
  const elRoad = document.getElementById('statRoadFloodCount');
  if (elRoad) elRoad.textContent = activeRoads.length;
  const elRoadTot = document.getElementById('statRoadCountTotal');
  if (elRoadTot) elRoadTot.textContent = state.roads.length;

  // 6. Active CCTV Count
  const elCctv = document.getElementById('statCctvCount');
  if (elCctv) elCctv.textContent = state.cctvs.length;

  // Layer counts
  document.getElementById('countMapRivers').textContent = state.rivers.length;
  document.getElementById('countMapCanals').textContent = state.canals.length;
  document.getElementById('countMapGates').textContent = state.watergates.length;
  document.getElementById('countMapTides').textContent = state.tides.length;
  document.getElementById('countMapRoads').textContent = state.roads.length;
  document.getElementById('countMapCctv').textContent = state.cctvs.length;
}

// Render Top Alert Ticker
function renderCrisisTicker() {
  const tickerEl = document.getElementById('crisisTickerText');
  if (!tickerEl) return;

  if (state.criticalStations.length === 0) {
    tickerEl.textContent = 'สถานการณ์น้ำภาพรวมปกติ ไม่พบสถานีที่มีระดับน้ำล้นตลิ่งหรือวิกฤตในขณะนี้';
    return;
  }

  const topItems = state.criticalStations.slice(0, 10).map(s => {
    return `[${s.province}] ${s.name} (${s.waterbody}) ${s.diffText}`;
  });

  // Add tide headline
  const fortChula = state.tides.find(t => t.name_th.includes('ป้อมพระจุล'));
  if (fortChula) {
    topItems.push(`[สมุทรปราการ] ป้อมพระจุลจอมเกล้า น้ำทะเลหนุนสูงสุด +${fortChula.max_value} ม.รทก. เวลา ${fortChula.max_time} น.`);
  }

  tickerEl.textContent = topItems.join('  •  ');
}

// ================= RENDER MAP MARKERS =================
function renderMapMarkers() {
  if (!state.map) return;

  // Clear existing markers
  state.mapLayers.rivers.clearLayers();
  state.mapLayers.canals.clearLayers();
  state.mapLayers.watergates.clearLayers();
  state.mapLayers.roads.clearLayers();
  state.mapLayers.tides.clearLayers();
  state.mapLayers.cctv.clearLayers();

  // 1. Rivers
  state.rivers.forEach(item => {
    const lat = item.station?.tele_station_lat;
    const lng = item.station?.tele_station_long;
    if (!lat || !lng) return;

    const isOverflow = item.diff_wl_bank_text && item.diff_wl_bank_text.includes('ล้นตลิ่ง');
    const level = item.situation_level || 1;
    let markerClass = 'marker-level-1';
    let iconSymbol = '💧';
    if (isOverflow || level === 5) {
      markerClass = 'marker-level-5';
      iconSymbol = '🚨';
    } else if (level === 4) {
      markerClass = 'marker-level-4';
    } else if (level === 3) {
      markerClass = 'marker-level-3';
    }

    const icon = L.divIcon({
      className: `custom-map-icon ${markerClass}`,
      html: `<span>${iconSymbol}</span>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });

    const popupHtml = `
      <div class="text-xs">
        <div class="flex items-center justify-between font-bold text-sm text-cyan-300 pb-1 border-b border-slate-700">
          <span>${item.station?.tele_station_name?.th || 'สถานีวัดน้ำ'}</span>
          <span class="badge ${isOverflow ? 'badge-crisis' : 'badge-normal'}">${isOverflow ? 'ล้นตลิ่ง' : 'ระดับน้ำปกติ'}</span>
        </div>
        <div class="mt-2 space-y-1 text-slate-300">
          <div>แม่น้ำ/ลำน้ำ: <strong>${item.river_name || item.basin?.basin_name?.th || '-'}</strong></div>
          <div>จังหวัด: <strong>${item.geocode?.amphoe_name?.th || ''} จ.${item.geocode?.province_name?.th || ''}</strong></div>
          <div>ระดับน้ำปัจจุบัน: <span class="font-tech font-bold text-cyan-400 text-sm">${item.waterlevel_msl || item.waterlevel_m || '-'} ม.รทก.</span></div>
          <div>ระดับตลิ่ง: <strong>${item.station?.min_bank || '-'} ม.</strong></div>
          ${isOverflow ? `<div class="text-red-400 font-bold">⚠️ ล้นตลิ่ง: +${item.diff_wl_bank} เมตร</div>` : ''}
          <div class="text-[10px] text-slate-400 mt-1">อัปเดต: ${item.waterlevel_datetime || '-'} • หน่วยงาน: ${item.agency?.agency_shortname?.th || 'ชป./สสน.'}</div>
        </div>
      </div>
    `;

    L.marker([lat, lng], { icon }).bindPopup(popupHtml).addTo(state.mapLayers.rivers);
  });

  // 2. Canals
  state.canals.forEach(item => {
    const lat = item.station?.canal_lat;
    const lng = item.station?.canal_long;
    if (!lat || !lng) return;

    const val = item.canal_value;
    const crit = item.station?.critical_level;
    const isCrit = crit !== null && val >= crit;

    const icon = L.divIcon({
      className: `custom-map-icon ${isCrit ? 'marker-level-5' : 'marker-level-3'}`,
      html: `<span>🛶</span>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const popupHtml = `
      <div class="text-xs">
        <div class="flex items-center justify-between font-bold text-sm text-orange-300 pb-1 border-b border-slate-700">
          <span>${item.station?.canal_name?.th || 'สถานีคลอง'}</span>
          <span class="badge ${isCrit ? 'badge-crisis' : 'badge-watch'}">${isCrit ? 'คลองวิกฤต' : 'เฝ้าระวัง'}</span>
        </div>
        <div class="mt-2 space-y-1 text-slate-300">
          <div>พื้นที่: <strong>เขต${item.geocode?.amphoe_name?.th || ''} ${item.geocode?.province_name?.th || 'กทม.'}</strong></div>
          <div>ระดับน้ำในคลอง: <span class="font-tech font-bold text-orange-400 text-sm">${val} ม.</span></div>
          <div>ระดับวิกฤตคลอง: <strong>${crit !== null ? crit + ' ม.' : '-'}</strong></div>
          <div>ระดับเตือนภัยคลอง: <strong>${item.station?.warning_level !== null ? item.station?.warning_level + ' ม.' : '-'}</strong></div>
          <div class="text-[10px] text-slate-400 mt-1">อัปเดต: ${item.canal_datetime || '-'} • สำนักการระบายน้ำ กทม.</div>
        </div>
      </div>
    `;

    L.marker([lat, lng], { icon }).bindPopup(popupHtml).addTo(state.mapLayers.canals);
  });

  // 3. Watergates & Pumps
  state.watergates.forEach(item => {
    const lat = item.station?.tele_station_lat;
    const lng = item.station?.tele_station_long;
    if (!lat || !lng) return;

    const icon = L.divIcon({
      className: 'custom-map-icon marker-pump',
      html: `<span>⚙️</span>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });

    const popupHtml = `
      <div class="text-xs">
        <div class="font-bold text-sm text-cyan-300 pb-1 border-b border-slate-700">
          ${item.station?.tele_station_name?.th || 'ประตูระบายน้ำ'}
        </div>
        <div class="mt-2 space-y-1 text-slate-300">
          <div>ลุ่มน้ำ: <strong>${item.basin?.basin_name?.th || '-'}</strong></div>
          <div>พิกัด: <strong>${item.geocode?.amphoe_name?.th || ''} จ.${item.geocode?.province_name?.th || ''}</strong></div>
          <div>ระดับเหนือน้ำ (In): <span class="font-tech font-bold text-cyan-400">${item.watergate_in !== null ? item.watergate_in + ' ม.' : '-'}</span></div>
          <div>ระดับท้ายน้ำ (Out): <span class="font-tech font-bold text-blue-400">${item.watergate_out !== null ? item.watergate_out + ' ม.' : '-'}</span></div>
          <div class="text-[10px] text-slate-400 mt-1">อัปเดต: ${item.watergate_datetime_in || '-'} • ${item.agency?.agency_shortname?.th || 'สสน.'}</div>
        </div>
      </div>
    `;

    L.marker([lat, lng], { icon }).bindPopup(popupHtml).addTo(state.mapLayers.watergates);
  });

  // 4. Coastal Tides
  state.tides.forEach(item => {
    if (!item.lat || !item.long) return;

    const isHigh = item.max_value >= 1.0;
    const icon = L.divIcon({
      className: 'custom-map-icon marker-tide',
      html: `<span>🌊</span>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });

    const popupHtml = `
      <div class="text-xs">
        <div class="flex items-center justify-between font-bold text-sm text-blue-300 pb-1 border-b border-slate-700">
          <span>${item.name_th} (${item.code})</span>
          <span class="badge ${isHigh ? 'badge-crisis' : 'badge-tide'}">${isHigh ? 'หนุนสูงมาก' : 'น้ำทะเลหนุน'}</span>
        </div>
        <div class="mt-2 space-y-1 text-slate-300">
          <div>น้ำหนุนสูงสุด: <span class="font-tech font-bold text-red-400 text-sm">+${item.max_value} ม.รทก.</span> (เวลา ${item.max_time} น.)</div>
          <div>น้ำลงต่ำสุด: <span class="font-tech text-emerald-400">${item.min_value} ม.รทก.</span> (เวลา ${item.min_time} น.)</div>
          <div class="text-[10px] text-slate-400 mt-1">กองอุทกศาสตร์ กองทัพเรือ • ข้อมูลพยากรณ์ประจำวัน</div>
        </div>
      </div>
    `;

    L.marker([item.lat, item.long], { icon }).bindPopup(popupHtml).addTo(state.mapLayers.tides);
  });

  // 5. Road Floods
  state.roads.forEach(item => {
    const lat = item.station?.floodroad_lat;
    const lng = item.station?.floodroad_long;
    if (!lat || !lng) return;

    const val = item.floodroad_value;
    const isFlood = val > 0;

    const icon = L.divIcon({
      className: `custom-map-icon ${isFlood ? 'marker-level-5' : 'marker-road'}`,
      html: `<span>🛣️</span>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });

    const popupHtml = `
      <div class="text-xs">
        <div class="font-bold text-sm ${isFlood ? 'text-red-400' : 'text-pink-300'} pb-1 border-b border-slate-700">
          ${item.station?.floodroad_name?.th || 'จุดตรวจน้ำท่วมถนน'}
        </div>
        <div class="mt-2 space-y-1 text-slate-300">
          <div>สถานะ: <strong>${isFlood ? `⚠️ มีน้ำท่วมขังสูง ${val} ซม.` : '✅ ถนนแห้ง ปกติ'}</strong></div>
          <div>พื้นที่: เขต${item.geocode?.amphoe_name?.th || ''} ${item.geocode?.province_name?.th || 'กทม.'}</div>
          <div class="text-[10px] text-slate-400 mt-1">สำนักการระบายน้ำ กทม. • ${item.floodroad_datetime || '-'}</div>
        </div>
      </div>
    `;

    L.marker([lat, lng], { icon }).bindPopup(popupHtml).addTo(state.mapLayers.roads);
  });

  // 6. CCTV
  state.cctvs.forEach(item => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.long);
    if (!lat || !lng) return;

    const icon = L.divIcon({
      className: 'custom-map-icon marker-cctv',
      html: `<span>📹</span>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const popupHtml = `
      <div class="text-xs">
        <div class="font-bold text-sm text-purple-300 pb-1 border-b border-slate-700">
          ${item.title || 'กล้องวงจรปิด CCTV'}
        </div>
        <div class="mt-2 space-y-1 text-slate-300">
          <div>${item.description || ''}</div>
          <div>จังหวัด: <strong>${item.geocode?.province_name?.th || '-'}</strong></div>
          <div>หน่วยงาน: <strong>${item.agency?.agency_name?.th || 'DWR/EGAT'}</strong></div>
          <button onclick="openCctvModal('${encodeURIComponent(JSON.stringify(item))}')" class="mt-2 w-full py-1 bg-purple-700 hover:bg-purple-600 text-white rounded font-medium text-xs transition">
            ดูภาพกล้องสด 📹
          </button>
        </div>
      </div>
    `;

    L.marker([lat, lng], { icon }).bindPopup(popupHtml).addTo(state.mapLayers.cctv);
  });
}

// ================= RENDER CRISIS TAB =================
function renderCrisisTab() {
  const container = document.getElementById('crisisCardsGrid');
  if (!container) return;

  if (state.criticalStations.length === 0) {
    container.innerHTML = `
      <div class="col-span-full p-8 text-center glass-panel text-slate-400">
        <span class="text-4xl block mb-2">✅</span>
        สถานการณ์ปกติ ไม่พบสถานีที่มีระดับน้ำคลองหรือแม่น้ำล้นตลิ่งในขณะนี้
      </div>
    `;
    return;
  }

  // Filter based on search & region
  const filtered = filterList(state.criticalStations);

  container.innerHTML = filtered.map(item => `
    <div class="glass-panel p-4 border-l-4 ${item.isOverflow ? 'border-l-red-500 crisis-pulsing' : 'border-l-orange-500'} flex flex-col justify-between">
      <div>
        <div class="flex items-start justify-between gap-2">
          <div>
            <span class="badge ${item.isOverflow ? 'badge-crisis' : 'badge-warning'} mb-1.5">
              ${item.isOverflow ? '🔴 ล้นตลิ่ง' : '🟠 ระดับวิกฤต'}
            </span>
            <h3 class="font-bold text-base text-white">${item.name}</h3>
            <p class="text-xs text-slate-400">${item.waterbody} • ${item.amphoe} จ.${item.province}</p>
          </div>
          <span class="text-2xl">${item.type === 'canal' ? '🛶' : '🌊'}</span>
        </div>

        <div class="mt-3 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-xs space-y-1 font-tech">
          <div class="flex justify-between">
            <span class="text-slate-400">ระดับน้ำปัจจุบัน:</span>
            <span class="font-bold text-white">${item.currentLevel} ม.</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">ระดับตลิ่ง/วิกฤต:</span>
            <span class="text-slate-300">${item.bankLevel} ม.</span>
          </div>
          <div class="flex justify-between border-t border-slate-800 pt-1 text-red-400 font-bold">
            <span>ผลต่างตลิ่ง:</span>
            <span>${item.diffText}</span>
          </div>
        </div>
      </div>

      <div class="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
        <span class="text-slate-500">${item.agency} • ${item.datetime}</span>
        <button onclick="zoomToMap(${item.lat}, ${item.long})" class="px-2.5 py-1 bg-blue-600/80 hover:bg-blue-600 text-white rounded font-medium transition flex items-center gap-1">
          <span>ซูมดูแผนที่</span> <span>↗</span>
        </button>
      </div>
    </div>
  `).join('');
}

// ================= RENDER TIDE TAB =================
function renderTideTab() {
  const tbody = document.getElementById('tideTableBody');
  if (!tbody) return;

  tbody.innerHTML = state.tides.map(item => {
    const isSurge = item.max_value >= 1.0;
    return `
      <tr class="hover:bg-slate-800/40 transition">
        <td class="p-3 font-bold text-slate-400">${item.code}</td>
        <td class="p-3 font-sans">
          <div class="font-bold text-slate-200 text-sm">${item.name_th}</div>
          <div class="text-[10px] text-slate-500">${item.name_en}</div>
        </td>
        <td class="p-3 text-right font-bold text-sm ${isSurge ? 'text-red-400 bg-red-950/20' : 'text-slate-200'}">
          +${item.max_value.toFixed(2)}
        </td>
        <td class="p-3 text-center text-slate-300">${item.max_time} น.</td>
        <td class="p-3 text-right text-emerald-400 font-bold">${item.min_value.toFixed(2)}</td>
        <td class="p-3 text-center text-slate-300">${item.min_time} น.</td>
        <td class="p-3 text-center text-slate-400">${item.t00 || '-'}</td>
        <td class="p-3 text-center text-slate-400">${item.t04 || '-'}</td>
        <td class="p-3 text-center text-slate-400">${item.t08 || '-'}</td>
        <td class="p-3 text-center text-slate-400">${item.t12 || '-'}</td>
        <td class="p-3 text-center text-slate-400">${item.t16 || '-'}</td>
        <td class="p-3 text-center text-slate-400">${item.t20 || '-'}</td>
        <td class="p-3 text-center">
          <button onclick="zoomToMap(${item.lat}, ${item.long})" class="px-2 py-0.5 bg-blue-900/60 hover:bg-blue-800 text-blue-200 rounded text-[11px] transition">
            แผนที่
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// ================= RENDER WATERGATES TAB =================
function renderWatergatesTab() {
  const container = document.getElementById('gatesCardsGrid');
  if (!container) return;

  const totalEl = document.getElementById('statGatesTotal');
  if (totalEl) totalEl.textContent = state.watergates.length;

  const filtered = filterList(state.watergates, (item) => {
    return {
      name: item.station?.tele_station_name?.th || '',
      province: item.geocode?.province_name?.th || '',
      amphoe: item.geocode?.amphoe_name?.th || '',
      basin: item.basin?.basin_name?.th || ''
    };
  });

  container.innerHTML = filtered.slice(0, 30).map(item => `
    <div class="glass-panel p-4 flex flex-col justify-between">
      <div>
        <div class="flex items-start justify-between">
          <div>
            <span class="badge badge-normal mb-1.5">ประตูระบายน้ำ</span>
            <h3 class="font-bold text-sm text-cyan-300">${item.station?.tele_station_name?.th || 'ปตร.'}</h3>
            <p class="text-xs text-slate-400">ลุ่มน้ำ${item.basin?.basin_name?.th || '-'} • ${item.geocode?.amphoe_name?.th || ''} จ.${item.geocode?.province_name?.th || ''}</p>
          </div>
          <span class="text-2xl">⚙️</span>
        </div>

        <div class="mt-3 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-xs space-y-1 font-tech">
          <div class="flex justify-between">
            <span class="text-slate-400">ระดับน้ำเหนือน้ำ:</span>
            <span class="font-bold text-cyan-400">${item.watergate_in !== null ? item.watergate_in + ' ม.' : '-'}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">ระดับน้ำท้ายน้ำ:</span>
            <span class="font-bold text-blue-400">${item.watergate_out !== null ? item.watergate_out + ' ม.' : '-'}</span>
          </div>
        </div>
      </div>

      <div class="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
        <span class="text-slate-500">${item.agency?.agency_shortname?.th || 'สสน.'} • ${item.watergate_datetime_in || '-'}</span>
        <button onclick="zoomToMap(${item.station?.tele_station_lat}, ${item.station?.tele_station_long})" class="text-blue-400 hover:text-blue-300">
          ดูบนแผนที่ ↗
        </button>
      </div>
    </div>
  `).join('');
}

// ================= RENDER CCTV TAB =================
function renderCctvTab() {
  const container = document.getElementById('cctvGrid');
  if (!container) return;

  const filtered = filterList(state.cctvs, (item) => ({
    name: item.title || '',
    province: item.geocode?.province_name?.th || '',
    amphoe: item.geocode?.amphoe_name?.th || '',
    basin: item.basin_name?.th || ''
  }));

  container.innerHTML = filtered.map(item => {
    const rawUrl = item.cctv_url || '';
    const imgUrl = rawUrl.startsWith('http') ? rawUrl : 'https://placehold.co/600x400/0f172a/94a3b8?text=CCTV+Feed';
    const jsonStr = encodeURIComponent(JSON.stringify(item));

    return `
      <div class="glass-panel p-3 flex flex-col justify-between group">
        <div>
          <div class="cctv-img-container cursor-pointer" onclick="openCctvModal('${jsonStr}')">
            <img src="${imgUrl}" alt="${item.title}" onerror="this.src='https://placehold.co/600x400/0f172a/94a3b8?text=Camera+Connecting...'" loading="lazy">
            <span class="absolute top-2 left-2 bg-red-600/90 text-white font-tech text-[10px] px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span> LIVE
            </span>
          </div>

          <div class="mt-2.5">
            <h4 class="font-bold text-sm text-white truncate">${item.title}</h4>
            <p class="text-[11px] text-slate-400 truncate">${item.description || item.basin_name?.th || ''}</p>
          </div>
        </div>

        <div class="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
          <span class="text-slate-500">${item.agency?.agency_shortname?.th || 'DWR/EGAT'}</span>
          <button onclick="openCctvModal('${jsonStr}')" class="text-purple-400 hover:text-purple-300 font-medium">
            ขยายภาพเต็ม ↗
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// ================= RENDER RAIN TAB =================
function renderRainTab() {
  const tbody = document.getElementById('rainLeaderboardBody');
  if (!tbody) return;

  // Sort top rain 24h
  const sorted = [...state.rains].sort((a, b) => (b.rain_24h || 0) - (a.rain_24h || 0)).slice(0, 25);

  tbody.innerHTML = sorted.map((item, idx) => `
    <tr class="hover:bg-slate-800/40 transition">
      <td class="p-2.5 font-tech font-bold text-slate-400">${idx + 1}</td>
      <td class="p-2.5 font-bold text-slate-200">
        ${item.station?.tele_station_name?.th || item.station?.tele_station_name?.en || '-'}
      </td>
      <td class="p-2.5 text-slate-300">
        ${item.geocode?.amphoe_name?.th || ''} จ.${item.geocode?.province_name?.th || ''}
      </td>
      <td class="p-2.5 text-slate-400">${item.basin?.basin_name?.th || '-'}</td>
      <td class="p-2.5 text-right font-tech text-slate-300">${item.rain_1h || '0'} มม.</td>
      <td class="p-2.5 text-right font-tech font-bold text-cyan-400 text-sm">
        ${(item.rain_24h || 0).toFixed(1)} มม.
      </td>
    </tr>
  `).join('');
}

// ================= RENDER ROAD TAB =================
function renderRoadTab() {
  const container = document.getElementById('roadFloodGrid');
  if (!container) return;

  const filtered = filterList(state.roads, (item) => ({
    name: item.station?.floodroad_name?.th || '',
    province: item.geocode?.province_name?.th || '',
    amphoe: item.geocode?.amphoe_name?.th || '',
    basin: ''
  }));

  container.innerHTML = filtered.map(item => {
    const val = item.floodroad_value;
    const isFlood = val > 0;
    return `
      <div class="glass-panel p-4 border-l-4 ${isFlood ? 'border-l-red-500 crisis-pulsing' : 'border-l-pink-500'} flex flex-col justify-between">
        <div>
          <div class="flex items-start justify-between">
            <div>
              <span class="badge ${isFlood ? 'badge-crisis' : 'badge-normal'} mb-1.5">
                ${isFlood ? '⚠️ มีน้ำท่วมขัง' : '✅ ถนนแห้ง ปกติ'}
              </span>
              <h3 class="font-bold text-sm text-white">${item.station?.floodroad_name?.th}</h3>
              <p class="text-xs text-slate-400">เขต${item.geocode?.amphoe_name?.th || ''} ${item.geocode?.province_name?.th || 'กทม.'}</p>
            </div>
            <span class="text-2xl">🛣️</span>
          </div>

          <div class="mt-3 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-xs space-y-1 font-tech">
            <div class="flex justify-between">
              <span class="text-slate-400">ระดับน้ำท่วมขังบนผิวถนน:</span>
              <span class="font-bold ${isFlood ? 'text-red-400 text-base' : 'text-slate-300'}">${val} ซม.</span>
            </div>
          </div>
        </div>

        <div class="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
          <span class="text-slate-500">${item.floodroad_datetime || '-'}</span>
          <button onclick="zoomToMap(${item.station?.floodroad_lat}, ${item.station?.floodroad_long})" class="text-pink-400 hover:text-pink-300">
            ดูบนแผนที่ ↗
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// ================= ZOOM TO MAP HELPER =================
window.zoomToMap = function(lat, lng) {
  if (!lat || !lng) return;
  // Switch to Map tab
  document.querySelector('.nav-tab[data-tab="map"]')?.click();
  setTimeout(() => {
    state.map.setView([lat, lng], 13);
  }, 150);
};

// ================= CCTV MODAL =================
window.openCctvModal = function(encodedJson) {
  try {
    const item = JSON.parse(decodeURIComponent(encodedJson));
    const modal = document.getElementById('cctvModal');
    const titleEl = document.getElementById('modalCctvTitle');
    const subEl = document.getElementById('modalCctvSub');
    const imgEl = document.getElementById('modalCctvImg');
    const agencyEl = document.getElementById('modalCctvAgency');
    const loadingEl = document.getElementById('modalLoading');

    titleEl.textContent = item.title || 'กล้องวงจรปิด';
    subEl.textContent = item.description || `จ.${item.geocode?.province_name?.th || ''}`;
    agencyEl.textContent = `หน่วยงาน: ${item.agency?.agency_name?.th || 'DWR/EGAT'}`;

    const rawUrl = item.cctv_url || '';
    imgEl.src = rawUrl.startsWith('http') ? rawUrl + (rawUrl.includes('?') ? '&' : '?') + 't=' + Date.now() : 'https://placehold.co/600x400/0f172a/94a3b8?text=CCTV+Feed';

    loadingEl.style.display = 'flex';
    imgEl.onload = () => { loadingEl.style.display = 'none'; };
    imgEl.onerror = () => { loadingEl.textContent = 'ไม่สามารถดึงภาพสดได้ในขณะนี้'; };

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    document.getElementById('btnModalRefresh').onclick = () => {
      loadingEl.style.display = 'flex';
      imgEl.src = rawUrl.startsWith('http') ? rawUrl + (rawUrl.includes('?') ? '&' : '?') + 't=' + Date.now() : imgEl.src;
    };
  } catch (e) {
    console.error('Modal error:', e);
  }
};

document.getElementById('btnCloseModal')?.addEventListener('click', () => {
  const modal = document.getElementById('cctvModal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
});

// ================= FILTER UTILITY =================
function filterList(items, accessor) {
  const query = state.searchQuery.toLowerCase().trim();
  const region = state.selectedRegion;

  return items.filter(item => {
    let text = '';
    let prov = '';
    if (accessor) {
      const a = accessor(item);
      text = `${a.name} ${a.province} ${a.amphoe} ${a.basin}`.toLowerCase();
      prov = a.province;
    } else {
      text = `${item.name || ''} ${item.province || ''} ${item.amphoe || ''} ${item.basin || ''} ${item.waterbody || ''}`.toLowerCase();
      prov = item.province || '';
    }

    if (query && !text.includes(query)) return false;

    // Region filter
    if (region !== 'all') {
      if (region === 'bangkok' && !prov.includes('กรุงเทพ') && !prov.includes('นนทบุรี') && !prov.includes('สมุทรปราการ') && !prov.includes('ปทุมธานี')) return false;
      if (region === 'central' && !['พระนครศรีอยุธยา', 'อ่างทอง', 'สิงห์บุรี', 'ชัยนาท', 'สุพรรณบุรี', 'สระบุรี', 'ลพบุรี', 'นครปฐม', 'สมุทรสงคราม', 'สมุทรสาคร'].includes(prov)) return false;
      if (region === 'north' && !['เชียงใหม่', 'เชียงราย', 'ลำปาง', 'ลำพูน', 'แม่ฮ่องสอน', 'น่าน', 'แพร่', 'พะเยา', 'ตาก', 'พิษณุโลก', 'สุโขทัย', 'พิจิตร', 'กำแพงเพชร', 'เพชรบูรณ์', 'นครสวรรค์', 'อุทัยธานี'].includes(prov)) return false;
      if (region === 'northeast' && !['ขอนแก่น', 'นครราชสีมา', 'อุบลราชธานี', 'อุดรธานี', 'สกลนคร', 'นครพนม', 'กาฬสินธุ์', 'ร้อยเอ็ด', 'มหาสารคาม', 'บุรีรัมย์', 'สุรินทร์', 'ศรีสะเกษ', 'ชัยภูมิ', 'เลย', 'หนองคาย', 'บึงกาฬ', 'หนองบัวลำภู', 'มุกดาหาร', 'ยโสธร', 'อำนาจเจริญ'].includes(prov)) return false;
      if (region === 'south' && !['ภูเก็ต', 'กระบี่', 'พังงา', 'สุราษฎร์ธานี', 'นครศรีธรรมราช', 'สงขลา', 'ตรัง', 'พัทลุง', 'สตูล', 'ยะลา', 'ปัตตานี', 'นราธิวาส', 'ชุมพร', 'ระนอง'].includes(prov)) return false;
      if (region === 'east' && !['ชลบุรี', 'ระยอง', 'จันทบุรี', 'ตราด', 'ฉะเชิงเทรา', 'ปราจีนบุรี', 'สระแก้ว', 'นครนายก'].includes(prov)) return false;
    }

    return true;
  });
}

// ================= EVENT LISTENERS =================
function setupEventListeners() {
  // Tab switching
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const target = tab.dataset.tab;
      state.activeTab = target;

      document.querySelectorAll('.tab-content').forEach(c => {
        c.classList.add('hidden');
        c.classList.remove('flex');
      });

      const activeContent = document.getElementById(`tabContent${target.charAt(0).toUpperCase() + target.slice(1)}`);
      if (activeContent) {
        activeContent.classList.remove('hidden');
        activeContent.classList.add('flex');
      }

      if (target === 'map' && state.map) {
        setTimeout(() => { state.map.invalidateSize(); }, 100);
      }
    });
  });

  // Sound toggle
  document.getElementById('btnToggleSound')?.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    const icon = document.getElementById('soundIcon');
    const text = document.getElementById('soundText');
    if (state.soundEnabled) {
      icon.textContent = '🔊';
      text.textContent = 'เสียงเตือน: เปิด';
      playAlarmSound();
    } else {
      icon.textContent = '🔇';
      text.textContent = 'เสียงเตือน: ปิด';
    }
  });

  // Test Alarm
  document.getElementById('btnTestAlarm')?.addEventListener('click', () => {
    playAlarmSound();
  });

  // Manual Refresh
  document.getElementById('btnRefresh')?.addEventListener('click', loadAllData);
  document.getElementById('btnRefreshCctv')?.addEventListener('click', renderCctvTab);

  // Search Input
  document.getElementById('searchInput')?.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderCrisisTab();
    renderWatergatesTab();
    renderCctvTab();
    renderRoadTab();
  });

  // Region Filter
  document.getElementById('filterRegion')?.addEventListener('change', (e) => {
    state.selectedRegion = e.target.value;
    renderCrisisTab();
    renderWatergatesTab();
    renderCctvTab();
    renderRoadTab();
  });
}

// ================= BOOTSTRAP =================
window.addEventListener('DOMContentLoaded', () => {
  initClock();
  initMap();
  setupEventListeners();
  loadAllData();

  // Auto refresh every 60 seconds
  setInterval(loadAllData, 60000);
});
