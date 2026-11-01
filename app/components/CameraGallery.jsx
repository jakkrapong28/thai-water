'use client';

import { useEffect, useState } from 'react';
import { Camera } from 'lucide-react';

export function CameraImage({ camera, className = '', onUnavailable }) {
  const [failed, setFailed] = useState(false);
  const src = camera.image_url || (camera.media_type === 'img' && camera.cctv_url?.startsWith('https://') ? camera.cctv_url : null);
  useEffect(() => setFailed(false), [src]);
  if (!src || failed) return <div className={`camera-image-fallback ${className}`}><Camera size={23}/><span>{failed ? 'ต้นทางไม่ส่งภาพขณะนี้' : 'ไม่มีภาพที่ฝังได้'}</span></div>;
  return <img className={className} src={src} alt={`ภาพล่าสุดจาก ${camera.title || 'กล้อง'}`} loading="lazy" decoding="async" onError={() => { setFailed(true); onUnavailable?.(camera.id); }}/>;
}

export default function CameraGallery({ cameras, onSelect, source }) {
  const [limit, setLimit] = useState(48);
  const [unavailable, setUnavailable] = useState(new Set());
  const filterKey = source.replace(/-\d+$/, '');
  useEffect(() => setLimit(48), [filterKey]);
  useEffect(() => setUnavailable(new Set()), [source]);
  const available = cameras.filter(camera => (camera.image_url || (camera.media_type === 'img' && camera.cctv_url?.startsWith('https://'))) && !unavailable.has(camera.id));
  const shown = available.slice(0, limit);
  if (!available.length) return <span className="camera-empty" hidden/>;
  return <>
    <div className="gallery-count">พบ {available.length.toLocaleString('th-TH')} รายการกล้องที่มี URL ภาพ · ภาพที่ต้นทางเปิดไม่ได้จะถูกซ่อนอัตโนมัติ</div>
    <div className="camera-grid">{shown.map((item, i) => <button className="camera-card" key={item.id || i} onClick={() => onSelect(item)}>
      <CameraImage camera={item} className="camera-thumb" onUnavailable={id => setUnavailable(current => new Set(current).add(id))}/>
      <strong>{item.title || 'ไม่ระบุกล้อง'}</strong>
      <small>{item.agency?.agency_shortname?.th || item.geocode?.province_name?.th || 'ไม่ระบุหน่วยงาน'} · {item.media_type === 'hls' || item.media_type === 'mjpeg' ? 'สตรีมสด' : item.image_timestamp ? new Date(item.image_timestamp).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }) : 'ไม่ระบุเวลาภาพ'}</small>
      <span>ดูภาพและรายละเอียด ↗</span>
    </button>)}</div>
    {available.length > limit && <button className="gallery-more" onClick={() => setLimit(n => n + 48)}>ดูเพิ่มอีก {Math.min(48, available.length - limit)} กล้อง</button>}
  </>;
}