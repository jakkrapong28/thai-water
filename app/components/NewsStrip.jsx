'use client';

import { ArrowUpRight, Newspaper } from 'lucide-react';

export default function NewsStrip({ items }) {
  if (!items.length) return null;
  return <section className="panel news-strip"><div className="panel-heading"><div><h2><Newspaper size={17}/> ข่าวน้ำและประกาศล่าสุด</h2><p>ข่าวกรมประชาสัมพันธ์และประกาศกรมอุตุนิยมวิทยา · กดอ่านรายละเอียดที่ต้นฉบับ · ข่าวไม่ใช่ค่าตรวจวัด</p></div><a href="https://www.tmd.go.th/warning-and-events" target="_blank" rel="noreferrer">ประกาศกรมอุตุนิยมวิทยา ↗</a></div><div className="news-list">{items.slice(0,6).map(item=><a key={item.id} href={item.url} target="_blank" rel="noreferrer"><small>{item.source} · {new Date(item.published_at).toLocaleString('th-TH',{timeZone:'Asia/Bangkok'})}</small><strong>{item.title}</strong><span>อ่านข่าวต้นฉบับ <ArrowUpRight size={13}/></span></a>)}</div></section>;
}
