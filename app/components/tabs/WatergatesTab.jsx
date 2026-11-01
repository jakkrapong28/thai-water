'use client';

import { Cog, ArrowUpRight, Activity } from 'lucide-react';

export default function WatergatesTab({ watergates = [], onZoomMap }) {
  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            background: 'rgba(99, 102, 241, 0.2)',
            color: '#a5b4fc',
            padding: '6px',
            borderRadius: '8px',
            display: 'flex'
          }}>
            <Cog size={18} />
          </span>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#f8fafc' }}>
              สถานีสูบน้ำและประตูระบายน้ำ (ปตร.) ทั่วประเทศ ({watergates.length} แห่ง)
            </h2>
            <p style={{ fontSize: '11px', color: '#94a3b8' }}>
              ตรวจวัดระดับน้ำเหนือน้ำและท้ายน้ำ เพื่อประเมินอัตราการไหลและศักยภาพการสูบระบายน้ำ
            </p>
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '12px'
      }}>
        {watergates.slice(0, 48).map((item, idx) => (
          <div
            key={idx}
            className="glass-panel"
            style={{
              padding: '14px',
              borderLeft: '4px solid #6366f1',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className="badge badge-normal" style={{ marginBottom: '6px' }}>
                    ประตูระบายน้ำ / สถานีสูบน้ำ
                  </span>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc', marginTop: '4px' }}>
                    {item.station?.tele_station_name?.th || 'ปตร.'}
                  </h3>
                  <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                    ลุ่มน้ำ{item.basin?.basin_name?.th || '-'} • {item.geocode?.amphoe_name?.th || ''} จ.{item.geocode?.province_name?.th || ''}
                  </p>
                </div>
                <span style={{ fontSize: '22px' }}>⚙️</span>
              </div>

              <div style={{
                marginTop: '10px',
                background: 'rgba(15, 23, 42, 0.7)',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                textAlign: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>เหนือน้ำ (In)</div>
                  <div className="font-tech" style={{ fontSize: '15px', fontWeight: 700, color: '#38bdf8' }}>
                    {item.watergate_in !== null ? `${item.watergate_in} ม.` : '-'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>ท้ายน้ำ (Out)</div>
                  <div className="font-tech" style={{ fontSize: '15px', fontWeight: 700, color: '#60a5fa' }}>
                    {item.watergate_out !== null ? `${item.watergate_out} ม.` : '-'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              marginTop: '10px',
              paddingTop: '8px',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px'
            }}>
              <span style={{ color: '#64748b' }}>
                {item.agency?.agency_shortname?.th || 'สสน.'} • {item.watergate_datetime_in || ''}
              </span>
              {item.station?.tele_station_lat && item.station?.tele_station_long && (
                <button
                  onClick={() => onZoomMap && onZoomMap(item.station.tele_station_lat, item.station.tele_station_long)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    background: '#1e293b',
                    color: '#cbd5e1',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}
                >
                  <span>แผนที่</span>
                  <ArrowUpRight size={11} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
