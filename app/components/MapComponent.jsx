'use client';

import { useEffect, useRef, useState } from 'react';
import { riverRisk } from '@/lib/waterStatus';

const TYPES = [
  ['rivers', 'แม่น้ำ', '#2563eb'], ['canals', 'คลอง', '#0ea5e9'],
  ['watergates', 'ประตูน้ำ', '#059669'], ['flows','การไหล','#0f766e'], ['roads', 'ถนน', '#ea580c'],
  ['tides', 'น้ำทะเล', '#0891b2'], ['rains', 'ฝน', '#3388a7'], ['cctvs', 'กล้อง', '#7c3aed'], ['reports', 'ประชาชนแจ้ง', '#e11d48']
];
const number = value => value === null || value === undefined || value === '' ? null : Number(value);
const validPoint = (lat,lng) => Number.isFinite(number(lat)) && Number.isFinite(number(lng)) && number(lat) > 5 && number(lat) < 21 && number(lng) > 97 && number(lng) < 106;
const fresh = (value) => {
  if (!value) return false;
  const t = new Date(String(value).replace(' ', 'T') + (String(value).includes('T') ? '' : '+07:00')).getTime();
  return Number.isFinite(t) && Date.now() - t >= 0 && Date.now() - t < 6 * 60 * 60 * 1000;
};

export default function MapComponent({ rivers=[], canals=[], watergates=[], flows=[], roads=[], tides=[], rains=[], cctvs=[], reports=[], focusPoint, searchKey='', onOpenCctv }) {
  const container = useRef(null);
  const map = useRef(null);
  const groups = useRef({});
  const canvas = useRef(null);
  const lastSearchKey = useRef('');
  const [visible, setVisible] = useState({ rivers:true, canals:true, watergates:false, flows:false, roads:false, tides:true, rains:false, cctvs:false, reports:true });
  const [riskOnly, setRiskOnly] = useState(false);

  useEffect(() => {
    let L;
    try { L = require('leaflet'); } catch { return; }
    if (!container.current || map.current) return;
    const instance = L.map(container.current, { preferCanvas: true, scrollWheelZoom: false, zoomControl: true }).setView([15.2,101], 6);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>'
    }).addTo(instance);
    canvas.current = L.canvas({ padding: 0.4 });
    TYPES.forEach(([key]) => { groups.current[key] = L.layerGroup().addTo(instance); });
    map.current = instance;
    const resize = new ResizeObserver(() => instance.invalidateSize());
    resize.observe(container.current);
    return () => { resize.disconnect(); instance.remove(); map.current = null; groups.current = {}; };
  }, []);

  useEffect(() => {
    if (!map.current) return;
    const L = require('leaflet');
    function add(key, lat, lng, title, details, color, camera) {
      if (!validPoint(lat,lng)) return;
      const marker = L.circleMarker([Number(lat),Number(lng)], {
        renderer: canvas.current, radius: key === 'cctvs' ? 7 : 6,
        color: '#fff', weight: 2, fillColor: color, fillOpacity: 0.95
      });
      const popup = document.createElement('div');
      popup.className = 'map-popup';
      const heading = document.createElement('strong');
      heading.textContent = title || 'ไม่ระบุชื่อ';
      popup.append(heading);
      details.forEach(([label,value]) => {
        const row = document.createElement('div');
        row.textContent = `${label}: ${value ?? 'ไม่มีข้อมูล'}`;
        popup.append(row);
      });
      if (camera) {
        const button = document.createElement('button');
        button.textContent = 'ดูภาพจากต้นทาง ↗';
        button.onclick = () => onOpenCctv?.(camera);
        popup.append(button);
      }
      marker.bindPopup(popup).addTo(groups.current[key]);
    }
    TYPES.forEach(([key]) => groups.current[key]?.clearLayers());
    if (visible.rivers) for (const item of rivers) {
      const critical = riverRisk(item) === 3;
      if (riskOnly && !(critical && fresh(item.waterlevel_datetime))) continue;
      add('rivers',item.station?.tele_station_lat,item.station?.tele_station_long,item.station?.tele_station_name?.th,[['จังหวัด',item.geocode?.province_name?.th],['ระดับน้ำ',item.waterlevel_msl ?? item.waterlevel_m],['เวลาวัด',item.waterlevel_datetime]],!fresh(item.waterlevel_datetime)?'#94a3b8':critical?'#dc2626':riverRisk(item)===2?'#d97706':'#2563eb');
    }
    if (visible.canals) for (const item of canals) {
      const value=number(item.canal_value), threshold=number(item.station?.critical_level);
      if (riskOnly && !(value!==null&&threshold!==null&&value>=threshold&&fresh(item.canal_datetime))) continue;
      add('canals',item.station?.canal_lat,item.station?.canal_long,item.station?.canal_name?.th,[['จังหวัด',item.geocode?.province_name?.th],['ระดับน้ำ',item.canal_value],['เวลาวัด',item.canal_datetime]],!fresh(item.canal_datetime)?'#94a3b8':value!==null&&threshold!==null&&value>=threshold?'#dc2626':'#0ea5e9');
    }
    if (visible.watergates) for (const item of watergates) add('watergates',item.station?.tele_station_lat,item.station?.tele_station_long,item.station?.tele_station_name?.th,[['จังหวัด',item.geocode?.province_name?.th],['เหนือน้ำ',item.watergate_in],['ท้ายน้ำ',item.watergate_out]],'#059669');
    if (visible.flows) for (const item of flows) add('flows',item.station?.flow_lat,item.station?.flow_long,item.station?.flow_name?.th,[['จังหวัด',item.geocode?.province_name?.th],['การไหล ลบ.ม./วินาที',item.flow_value],['ความเร็ว ม./วินาที',item.speed],['เวลาวัด',item.flow_datetime]],fresh(item.flow_datetime)?'#0f766e':'#94a3b8');
    if (visible.roads) for (const item of roads) {
      if (riskOnly && !(Number(item.floodroad_value)>0 && fresh(item.floodroad_datetime))) continue;
      add('roads',item.station?.floodroad_lat,item.station?.floodroad_long,item.station?.floodroad_name?.th,[['จังหวัด',item.geocode?.province_name?.th],['ระดับน้ำบนถนน',item.floodroad_value],['เวลาวัด',item.floodroad_datetime]],!fresh(item.floodroad_datetime)?'#94a3b8':Number(item.floodroad_value)>0?'#dc2626':'#ea580c');
    }
    if (visible.tides) for (const item of tides) add('tides',item.lat,item.long,item.name_th,[['วันพยากรณ์',item.date],['ระดับสูงสุด',item.max_value],['เวลาสูงสุด',item.max_time]],'#0891b2');
    if (visible.rains) for (const item of rains) add('rains',item.station?.tele_station_lat,item.station?.tele_station_long,item.station?.tele_station_name?.th,[['จังหวัด',item.geocode?.province_name?.th],['ฝน 24 ชม.',item.rain_24h],['เวลาวัด',item.rainfall_datetime]],fresh(item.rainfall_datetime)?'#3388a7':'#94a3b8');
    if (visible.cctvs) for (const item of cctvs) add('cctvs',item.lat,item.long,item.title,[['จังหวัด',item.geocode?.province_name?.th],['หน่วยงาน',item.agency?.agency_name?.th]],'#7c3aed',item);
    if (visible.reports) for (const item of reports) add('reports',item.lat,item.lng,item.title,[['ประเภท','ประชาชนแจ้ง · ยังไม่ยืนยัน'],['พื้นที่',`${item.district || ''} ${item.province || ''}`],['รายละเอียด',item.description],['เวลาโพสต์',item.created_at]],'#e11d48');
  },[rivers,canals,watergates,flows,roads,tides,rains,cctvs,reports,onOpenCctv,riskOnly,visible]);

  useEffect(() => {
    if (!map.current) return;
    TYPES.forEach(([key]) => {
      const group=groups.current[key];
      if (!group) return;
      if (visible[key] && !map.current.hasLayer(group)) map.current.addLayer(group);
      if (!visible[key] && map.current.hasLayer(group)) map.current.removeLayer(group);
    });
  },[visible]);

  useEffect(() => {
    if (!map.current || !searchKey || searchKey === '|all' || lastSearchKey.current === searchKey) return;
    const points = [
      ...rivers.map(item=>[item.station?.tele_station_lat,item.station?.tele_station_long]),
      ...canals.map(item=>[item.station?.canal_lat,item.station?.canal_long]),
      ...roads.map(item=>[item.station?.floodroad_lat,item.station?.floodroad_long]),
      ...cctvs.map(item=>[item.lat,item.long]),
      ...rains.map(item=>[item.station?.tele_station_lat,item.station?.tele_station_long])
    ].filter(([lat,lng])=>validPoint(lat,lng)).map(([lat,lng])=>[Number(lat),Number(lng)]);
    if (points.length) {
      map.current.fitBounds(points, { padding:[35,35], maxZoom:12 });
      setRiskOnly(false);
      lastSearchKey.current = searchKey;
    }
  },[searchKey,rivers,canals,roads,cctvs,rains]);

  useEffect(() => {
    if (map.current && focusPoint) {
      map.current.setView([focusPoint.lat,focusPoint.lng], 13);
      if (focusPoint.layer) setVisible(current => ({ ...current, [focusPoint.layer]:true }));
      setRiskOnly(false);
    }
  },[focusPoint]);

  return <div className="map-wrap"><div className="map-shortcuts"><button onClick={()=>{ map.current?.setView([13.76,100.55],11); setVisible(v=>({...v,canals:true})); setRiskOnly(false); }}>ผังคลองและจุดวัด กทม.</button><button onClick={()=>map.current?.setView([15.2,101],6)}>ดูทั่วประเทศ</button></div><div className="map-controls" aria-label="ชั้นข้อมูลแผนที่"><label className="risk-toggle"><input type="checkbox" checked={riskOnly} onChange={e=>setRiskOnly(e.target.checked)}/>กรองจุดน้ำถึงเกณฑ์</label>{TYPES.map(([key,label,color])=><label key={key}><input type="checkbox" checked={visible[key]} onChange={e=>setVisible(v=>({...v,[key]:e.target.checked}))}/><span style={{background:color}}/>{label}</label>)}</div><div ref={container} className="map-canvas"/><div className="map-caption"><a href="https://flood.pop.in.th/" target="_blank" rel="noreferrer">POPNIX Flood</a> · จุด กทม.: ข้อมูลสำนักการระบายน้ำและ สสน. ผ่าน POPNIX Flood (flood.pop.in.th) · แผนที่ OpenStreetMap แสดงเส้นทางน้ำที่มีในแผนที่ พร้อมจุดวัดจาก API ที่เชื่อมได้ · จุดสีแดงถึงเกณฑ์ · สีส้มน้ำมาก · สีเทาค่าที่วัดเกิน 6 ชั่วโมงหรือไม่ระบุเวลา</div></div>;
}
