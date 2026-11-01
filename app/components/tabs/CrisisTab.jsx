'use client';

import { AlertOctagon, MapPin, ExternalLink, ShieldAlert, ArrowUpRight } from 'lucide-react';

export default function CrisisTab({ criticalStations = [], onZoomMap }) {
  if (criticalStations.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center', color: '#94a3b8' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#f8fafc', marginBottom: '6px' }}>
          สถานการณ์ภาพรวมปกติ
        </h3>
        <p style={{ fontSize: '13px', color: '#64748b' }}>
          ไม่พบสถานีแม่น้ำหรือคลองที่มีระดับน้ำวิกฤตหรือล้นตลิ่งในขณะนี้
        </p>
      </div>
    );
  }

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
            background: 'rgba(239, 68, 68, 0.2)',
            color: '#f87171',
            padding: '6px',
            borderRadius: '8px',
            display: 'flex'
          }}>
            <ShieldAlert size={18} />
          </span>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#f8fafc' }}>
            สถานีที่อยู่ในเกณฑ์วิกฤตและล้นตลิ่ง ({criticalStations.length} จุดทั่วประเทศ)
          </h2>
        </div>
        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
          เรียงตามระดับความรุนแรงของผลต่างเหนือน้ำ/ล้นตลิ่ง
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '14px'
      }}>
        {criticalStations.map((item, idx) => (
          <div
            key={idx}
            className={`glass-panel ${item.isOverflow ? 'crisis-pulsing' : ''}`}
            style={{
              padding: '16px',
              borderLeft: `4px solid ${item.isOverflow ? '#ef4444' : '#f97316'}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                <div>
                  <span className={`badge ${item.isOverflow ? 'badge-crisis' : 'badge-warning'}`} style={{ marginBottom: '6px' }}>
                    {item.isOverflow ? '🔴 ล้นตลิ่ง' : '🟠 ระดับวิกฤต'}
                  </span>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc', marginTop: '4px' }}>
                    {item.name}
                  </h3>
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                    {item.waterbody} • {item.amphoe} จ.{item.province}
                  </p>
                </div>
                <span style={{ fontSize: '24px' }}>
                  {item.type === 'canal' ? '🛶' : '🌊'}
                </span>
              </div>

              {/* Data Panel */}
              <div style={{
                marginTop: '12px',
                background: 'rgba(15, 23, 42, 0.7)',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                fontSize: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>ระดับน้ำปัจจุบัน:</span>
                  <strong className="font-tech" style={{ color: '#ffffff' }}>{item.currentLevel} ม.</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>ระดับตลิ่ง/เกณฑ์วิกฤต:</span>
                  <span className="font-tech" style={{ color: '#cbd5e1' }}>{item.bankLevel} ม.</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingTop: '4px',
                  marginTop: '2px',
                  color: item.isOverflow ? '#f87171' : '#fb923c',
                  fontWeight: 600
                }}>
                  <span>ผลต่างระดับน้ำ:</span>
                  <span>{item.diffText}</span>
                </div>
              </div>
            </div>

            {/* Bottom action */}
            <div style={{
              marginTop: '14px',
              paddingTop: '10px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px'
            }}>
              <span style={{ color: '#64748b' }}>
                {item.agency} • {item.datetime}
              </span>
              {item.lat && item.long && (
                <button
                  onClick={() => onZoomMap && onZoomMap(item.lat, item.long)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    background: '#0284c7',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 500
                  }}
                >
                  <span>ซูมแผนที่</span>
                  <ArrowUpRight size={12} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
