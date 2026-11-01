'use client';

import { useEffect, useState } from 'react';

export default function GlobalSearchResults({ results, query, onSelect }) {
  const [limit, setLimit] = useState(30);
  useEffect(() => setLimit(30), [query]);
  return <section className="panel global-results"><div className="panel-heading"><div><h2>ผลการค้นหาทุกหมวด</h2><p>ค้นจากชื่อจุด เขต/อำเภอ จังหวัด และรหัสสถานี · รวม {results.length.toLocaleString('th-TH')} รายการ</p></div></div>
    {results.length > 0 && <div className="global-results-list">{results.slice(0,limit).map((result,index)=><button key={`${result.key}-${result.id || index}`} onClick={()=>onSelect(result)}><span className="result-kind">{result.category}</span><strong>{result.title}</strong><small>{result.area} · {result.timestamp || 'ไม่ระบุเวลา'}</small><span className="result-open">{result.camera ? 'ดูกล้อง ↗' : result.point ? 'ดูบนแผนที่ ↗' : 'ดูหมวดข้อมูล ↗'}</span></button>)}</div>}
    {!results.length && <div className="empty-state">ไม่พบจุดจากข้อมูลที่เชื่อมได้ ลองค้นชื่อเขต จังหวัด หรือรหัสสถานีอื่น</div>}
    {results.length > limit && <button className="gallery-more" onClick={()=>setLimit(n=>n+30)}>ดูเพิ่มอีก {Math.min(30,results.length-limit)} รายการ</button>}
  </section>;
}
