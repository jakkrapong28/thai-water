'use client';

import { useEffect, useState } from 'react';
import { Camera, MapPin, Send } from 'lucide-react';

const labels = { flood: 'แจ้งน้ำท่วม', help: 'ขอความช่วยเหลือ', road: 'ถนนผ่านไม่ได้', shelter: 'จุดพักพิง/ช่วยเหลือ' };

export default function CommunityReports({ reports, provinces, onCreated, error }) {
  const [form, setForm] = useState({ kind: 'help', title: '', description: '', province: '', district: '', lat: '', lng: '' });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const update = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const locate = () => {
    if (!navigator.geolocation) { setMessage('อุปกรณ์นี้ไม่รองรับการอ่านพิกัด กรุณากรอกเอง'); return; }
    navigator.geolocation.getCurrentPosition(position => {
      setForm(current => ({ ...current, lat: position.coords.latitude.toFixed(6), lng: position.coords.longitude.toFixed(6) }));
      setMessage('ได้พิกัดแล้ว ตรวจตำแหน่งก่อนส่งรายงาน');
    }, () => setMessage('อ่านพิกัดไม่ได้ กรุณาอนุญาตตำแหน่งหรือกรอกเอง'), { enableHighAccuracy: true, timeout: 12000 });
  };
  const submit = async event => {
    event.preventDefault();
    setBusy(true);
    setMessage('กำลังบันทึก...');
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key,value]) => body.append(key, value));
      if (file) body.append('image', file);
      const response = await fetch('/api/reports', { method: 'POST', body });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'บันทึกไม่สำเร็จ');
      setForm({ kind: 'help', title: '', description: '', province: '', district: '', lat: '', lng: '' });
      setFile(null);
      setMessage('บันทึกรายงานแล้ว ข้อมูลนี้แสดงเป็นรายงานประชาชนที่ยังไม่ยืนยัน');
      onCreated?.();
    } catch (submissionError) { setMessage(submissionError.message); }
    finally { setBusy(false); }
  };
  return <div className="report-layout">
    <section className="panel report-composer"><div className="panel-heading"><div><h2>โพสต์อัปเดตจากจุดเกิดเหตุ</h2><p>แจ้งน้ำท่วม ขอความช่วยเหลือ หรืออัปเดตรูป ณ พิกัดจริง</p></div></div>
      {error && <p className="report-error" role="status">ระบบรับรายงานยังไม่พร้อม กรุณาลองใหม่ภายหลัง</p>}
      <form onSubmit={submit} className="report-form">
        <label>ประเภท<select value={form.kind} onChange={event=>update('kind',event.target.value)}>{Object.entries(labels).map(([key,label])=><option value={key} key={key}>{label}</option>)}</select></label>
        <label>หัวข้อ<input required minLength={4} maxLength={120} placeholder="เช่น น้ำท่วมหน้าตลาด ขอเรือรับผู้สูงอายุ" value={form.title} onChange={event=>update('title',event.target.value)}/></label>
        <label>รายละเอียด<textarea required minLength={8} maxLength={1500} rows={4} placeholder="ระดับน้ำโดยประมาณ เวลาเกิดเหตุ สิ่งที่ต้องการให้ช่วย" value={form.description} onChange={event=>update('description',event.target.value)}/></label>
        <div className="report-form-row"><label>จังหวัด<input required list="report-provinces" placeholder="จังหวัด" maxLength={80} value={form.province} onChange={event=>update('province',event.target.value)}/></label><datalist id="report-provinces">{provinces.map(name=><option key={name} value={name}/>)}</datalist><label>เขต/อำเภอ<input placeholder="เขตหรืออำเภอ" maxLength={80} value={form.district} onChange={event=>update('district',event.target.value)}/></label></div>
        <div className="report-location"><button type="button" onClick={locate}><MapPin size={16}/> ใช้ตำแหน่งปัจจุบัน</button><span>หรือกรอกพิกัดเอง</span></div>
        <div className="report-form-row"><label>ละติจูด<input required type="number" step="any" min="5" max="21" placeholder="13.7563" value={form.lat} onChange={event=>update('lat',event.target.value)}/></label><label>ลองจิจูด<input required type="number" step="any" min="97" max="106" placeholder="100.5018" value={form.lng} onChange={event=>update('lng',event.target.value)}/></label></div>
        <label className="report-file"><Camera size={17}/> {file ? file.name : 'แนบรูปจากจุดเกิดเหตุ (JPG, PNG, WebP ไม่เกิน 4 MB)'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={event=>setFile(event.target.files?.[0] || null)}/></label>
        {preview && <img className="report-preview" src={preview} alt="ตัวอย่างรูปก่อนส่ง"/>}
        <p className="report-disclosure">รายงานจะปรากฏบนเว็บทันทีพร้อมป้าย “ประชาชนแจ้ง · ยังไม่ยืนยัน” ระบบนี้ยังไม่ส่งเรื่องถึงหน่วยงานรัฐอัตโนมัติ หากต้องการความช่วยเหลือเร่งด่วนให้โทร 1784 โปรดอย่าใส่เบอร์โทรหรือข้อมูลส่วนตัวของผู้อื่นในข้อความ</p>
        <button className="report-submit" disabled={busy || Boolean(error)} type="submit"><Send size={16}/>{busy ? 'กำลังบันทึก...' : 'ส่งรายงานและปักหมุด'}</button>
        {message && <p className="report-message" role="status">{message}</p>}
      </form>
    </section>
    <section className="panel report-feed"><div className="panel-heading"><div><h2>รายงานล่าสุดจากประชาชน</h2><p>เรียงจากเวลาโพสต์ล่าสุด · ทุกจุดยังไม่ผ่านการยืนยัน</p></div><span className="feed-pill">{reports.length} จุด</span></div>
      {error && <p className="report-error">{error}</p>}
      {!reports.length && !error && <div className="empty-state">ยังไม่มีรายงานจากประชาชน</div>}
      {reports.map(report=><article className="report-card" key={report.id}><div className="report-card-head"><span>{labels[report.kind] || 'รายงาน'}</span><small>ประชาชนแจ้ง · ยังไม่ยืนยัน</small></div><h3>{report.title}</h3><p>{report.description}</p>{report.image_url && <img src={report.image_url} alt={`ภาพจากรายงาน ${report.title}`} loading="lazy"/>}<div className="report-card-foot"><span>{report.district ? `${report.district} · ` : ''}{report.province}</span><time dateTime={report.created_at}>{new Date(report.created_at).toLocaleString('th-TH',{timeZone:'Asia/Bangkok'})}</time><a href={`https://www.openstreetmap.org/?mlat=${report.lat}&mlon=${report.lng}#map=15/${report.lat}/${report.lng}`} target="_blank" rel="noreferrer">ดูพิกัดบนแผนที่ ↗</a></div><ReportUpdates report={report}/></article>)}
    </section>
  </div>;
}

function ReportUpdates({ report }) {
  const [open,setOpen] = useState(false);
  const [updates,setUpdates] = useState([]);
  const [message,setMessage] = useState('');
  const [file,setFile] = useState(null);
  const [status,setStatus] = useState('');
  const [busy,setBusy] = useState(false);
  const load = async () => {
    try {
      const response = await fetch(`/api/reports/${report.id}/updates`, { cache:'no-store' });
      if (!response.ok) throw new Error('อ่านอัปเดตไม่ได้');
      const payload = await response.json();
      setUpdates(Array.isArray(payload.data) ? payload.data : []);
    } catch { setStatus('อ่านอัปเดตไม่ได้ในขณะนี้'); }
  };
  useEffect(() => { if (open) load(); }, [open,report.id]);
  const submit = async event => {
    event.preventDefault(); setBusy(true); setStatus('');
    try {
      const body = new FormData();
      body.append('message',message);
      if (file) body.append('image',file);
      const response = await fetch(`/api/reports/${report.id}/updates`, { method:'POST', body });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'บันทึกไม่สำเร็จ');
      setMessage(''); setFile(null); setStatus('บันทึกอัปเดตแล้ว · ยังไม่ยืนยัน');
      await load();
    } catch (error) { setStatus(error.message); }
    finally { setBusy(false); }
  };
  return <div className="report-updates"><button type="button" className="report-updates-toggle" onClick={()=>setOpen(value=>!value)}>{open ? 'ซ่อนอัปเดต' : 'ดู/เพิ่มอัปเดตที่จุดนี้'}</button>{open && <div className="report-updates-body"><form onSubmit={submit}><textarea maxLength={1000} rows={2} placeholder="อัปเดตระดับน้ำ การช่วยเหลือ หรือสถานะล่าสุด" value={message} onChange={event=>setMessage(event.target.value)}/><label>แนบรูปเพิ่มเติม<input type="file" accept="image/jpeg,image/png,image/webp" onChange={event=>setFile(event.target.files?.[0] || null)}/></label><button type="submit" disabled={busy}>{busy ? 'กำลังส่ง...' : 'ส่งอัปเดต'}</button></form>{status && <p role="status">{status}</p>}{updates.map(update=><div className="report-update" key={update.id}><small>{new Date(update.created_at).toLocaleString('th-TH',{timeZone:'Asia/Bangkok'})} · ประชาชนแจ้ง ยังไม่ยืนยัน</small>{update.message && <p>{update.message}</p>}{update.image_url && <img src={update.image_url} alt={`ภาพอัปเดตจุด ${report.title}`} loading="lazy"/>}</div>)}</div>}</div>;
}
