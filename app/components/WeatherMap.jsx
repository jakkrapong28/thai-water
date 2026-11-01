'use client';

import { useState } from 'react';

const modes = [
  { key:'radar', label:'เรดาร์ฝนล่าสุด', overlay:'radar', product:'radar', detail:'ภาพเรดาร์ย้อนหลังจาก Windy' },
  { key:'rain', label:'แนวโน้มฝน', overlay:'rain', product:'ecmwf', detail:'ฝนจากแบบจำลองพยากรณ์' },
  { key:'wind', label:'ลมและพายุ', overlay:'wind', product:'ecmwf', detail:'ทิศทางลมจากแบบจำลองพยากรณ์' }
];

export default function WeatherMap() {
  const [mode,setMode] = useState(modes[0]);
  const url = `https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=%C2%B0C&metricWind=km%2Fh&zoom=5&overlay=${mode.overlay}&product=${mode.product}&level=surface&lat=15.2&lon=101`;
  return <section className="panel weather-map-panel"><div className="panel-heading"><div><h2>แผนที่ฝน ลม และพายุ</h2><p>{mode.detail} · ดูเวลาบนแผนที่ก่อนใช้ข้อมูล</p></div><a href="https://www.windy.com/?15.2,101,5" target="_blank" rel="noreferrer">เปิดแผนที่ต้นทาง ↗</a></div><div className="weather-modes">{modes.map(option=><button key={option.key} className={mode.key === option.key ? 'active' : ''} onClick={()=>setMode(option)}>{option.label}</button>)}</div><iframe key={mode.key} src={url} title={`แผนที่ ${mode.label} จาก Windy`} loading="lazy" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/><div className="map-caption">แผนที่ฝังจาก Windy · เรดาร์คือภาพตรวจวัดย้อนหลัง ส่วนฝนและลมเป็นแบบจำลองพยากรณ์ · หากแผนที่ต้นทางไม่ตอบ ระบบไม่สร้างภาพจำลองแทน</div></section>;
}
