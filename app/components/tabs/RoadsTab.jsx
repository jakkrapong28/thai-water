'use client';

import { Navigation, AlertTriangle, CheckCircle, ArrowUpRight } from 'lucide-react';

export default function RoadsTab({ roads = [], onZoomMap }) {
  const floodedRoads = roads.filter(r => (r.floodroad_value || 0) > 0);

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
            background: 'rgba(236, 72, 153, 0.2)',
            color: '#f472b6',
            padding: '6px',
            borderRadius: '8px',
            display: 'flex'
          }}>
            <Navigation size={18} />
          </span>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#f8fafc' }}>
              จุดตรวจวัดระดับน้ำท่วมขังบนผิวจราจร ({roads.length} จุดตรวจ)
            </h2>
            <p style={{ fontSize: '11px', color: '#94a3b8' }}>
              ข้อมูลเซนเซอร์ตรวจวัดน้ำท่วมขังบนถนนสายหลัก สำนักการระบายน้ำ กรุงเทพมหานคร
            </p>
          </div>
        </div>

        <div style={{
          fontSize: '12px',
          padding: '6px 12px',
          borderRadius: '6px',
          background: floodedRoads.length > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
          border: `1px solid ${floodedRoads.length > 0 ? '#ef4444' : '#10b981'}`,
          color: floodedRoads.length > 0 ? '#fca5a5' : '#6ee7b7',
          fontWeight: 600
        }}>
          {floodedRoads.length > 0
            ? `⚠️ มีน้ำท่วมขังบนผิวถนน ${floodedRoads.length} จุด`
            : '✅ ถนนทุกสายแห้ง ระบายน้ำได้ตามปกติ'}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
        gap: '12px'
      }}>
        {roads.map((item, idx) => {
          const val = item.floodroad_value || 0;
          const isFlood = val > 0;

          return (
            <div
              key={idx}
              className={`glass-panel ${isFlood ? 'crisis-pulsing' : ''}`}
              style={{
                padding: '14px',
                borderLeft: `4px solid ${isFlood ? '#ef4444' : '#ec4899'}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className={`badge ${isFlood ? 'badge-crisis' : 'badge-normal'}`} style={{ marginBottom: '6px' }}>
                      {isFlood ? '⚠️ มีน้ำท่วมขัง' : '✅ ถนนแห้ง ปกติ'}
                    </span>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc', marginTop: '4px' }}>
                      {item.station?.floodroad_name?.th || 'จุดตรวจถนน'}
                    </h3>
                    <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                      เขต{item.geocode?.amphoe_name?.th || ''} จ.{item.geocode?.province_name?.th || 'กรุงเทพมหานคร'}
                    </p>
                  </div>
                  <span style={{ fontSize: '22px' }}>🛣️</span>
                </div>

                <div style={{
                  marginTop: '10px',
                  background: 'rgba(15, 23, 42, 0.7)',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>ระดับน้ำบนผิวถนน:</span>
                  <span className="font-tech" style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: isFlood ? '#f87171' : '#34d399'
                  }}>
                    {val} ซม.
                  </span>
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
                  {item.floodroad_datetime || ''}
                </span>
                {item.station?.floodroad_lat && item.station?.floodroad_long && (
                  <button
                    onClick={() => onZoomMap && onZoomMap(item.station.floodroad_lat, item.station.floodroad_long)}
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
          );
        })}
      </div>
    </div>
  );
}
