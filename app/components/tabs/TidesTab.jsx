'use client';

import { Waves, Activity, AlertTriangle, Eye, ArrowUpRight } from 'lucide-react';

export default function TidesTab({ tides = [], onSelectTide, onZoomMap }) {
  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '14px',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            background: 'rgba(6, 182, 212, 0.2)',
            color: '#22d3ee',
            padding: '6px',
            borderRadius: '8px',
            display: 'flex'
          }}>
            <Waves size={18} />
          </span>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#f8fafc' }}>
              ตารางพยากรณ์น้ำทะเลหนุนสูงและระดับน้ำขึ้น-น้ำลงชายฝั่ง ({tides.length} สถานี)
            </h2>
            <p style={{ fontSize: '11px', color: '#94a3b8' }}>
              ข้อมูลโมเดล FEWS Marine กรมอุทกศาสตร์ กองทัพเรือ ร่วมกับ สสน. ตรวจวัดจุดเสี่ยงปากอ่าวไทยและอันดามัน
            </p>
          </div>
        </div>

        <div style={{
          fontSize: '11px',
          color: '#cbd5e1',
          background: 'rgba(15, 23, 42, 0.7)',
          padding: '6px 12px',
          borderRadius: '6px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          ⚠️ สีแดง: น้ำทะเลหนุนสูงเกิน <strong style={{ color: '#f87171' }}>+1.00 ม.รทก.</strong> (เฝ้าระวังน้ำเอ่อล้น)
        </div>
      </div>

      {/* Table Container */}
      <div className="glass-panel" style={{ overflowX: 'auto', borderRadius: '10px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
          <thead>
            <tr style={{
              background: 'rgba(15, 23, 42, 0.9)',
              borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
              color: '#94a3b8',
              fontSize: '11px'
            }}>
              <th style={{ padding: '10px 14px' }}>รหัส</th>
              <th style={{ padding: '10px 14px' }}>ชื่อสถานีชายฝั่ง</th>
              <th style={{ padding: '10px 14px', textAlign: 'right' }}>หนุนสูงสุด (ม.)</th>
              <th style={{ padding: '10px 14px', textAlign: 'center' }}>เวลาสูงสุด</th>
              <th style={{ padding: '10px 14px', textAlign: 'right' }}>ต่ำสุด (ม.)</th>
              <th style={{ padding: '10px 14px', textAlign: 'center' }}>เวลาต่ำสุด</th>
              <th style={{ padding: '10px 8px', textAlign: 'center' }}>00:00</th>
              <th style={{ padding: '10px 8px', textAlign: 'center' }}>04:00</th>
              <th style={{ padding: '10px 8px', textAlign: 'center' }}>08:00</th>
              <th style={{ padding: '10px 8px', textAlign: 'center' }}>12:00</th>
              <th style={{ padding: '10px 8px', textAlign: 'center' }}>16:00</th>
              <th style={{ padding: '10px 8px', textAlign: 'center' }}>20:00</th>
              <th style={{ padding: '10px 14px', textAlign: 'center' }}>การกระทำ</th>
            </tr>
          </thead>
          <tbody>
            {tides.map((t, idx) => {
              const isSurge = t.max_value >= 1.0;
              return (
                <tr
                  key={idx}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    backgroundColor: isSurge ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isSurge ? 'rgba(239, 68, 68, 0.05)' : 'transparent'}
                >
                  <td className="font-tech" style={{ padding: '10px 14px', color: '#64748b', fontWeight: 600 }}>
                    {t.code}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ fontWeight: 600, color: '#f8fafc' }}>{t.name_th}</div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>{t.name_en}</div>
                  </td>
                  <td className="font-tech" style={{
                    padding: '10px 14px',
                    textAlign: 'right',
                    fontWeight: 700,
                    color: isSurge ? '#f87171' : '#38bdf8',
                    fontSize: '13px'
                  }}>
                    +{t.max_value.toFixed(2)}
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'center', color: '#cbd5e1' }}>
                    {t.max_time} น.
                  </td>
                  <td className="font-tech" style={{ padding: '10px 14px', textAlign: 'right', color: '#34d399', fontWeight: 600 }}>
                    {t.min_value.toFixed(2)}
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'center', color: '#cbd5e1' }}>
                    {t.min_time} น.
                  </td>
                  <td className="font-tech" style={{ padding: '10px 8px', textAlign: 'center', color: '#94a3b8' }}>{t.t00 || '-'}</td>
                  <td className="font-tech" style={{ padding: '10px 8px', textAlign: 'center', color: '#94a3b8' }}>{t.t04 || '-'}</td>
                  <td className="font-tech" style={{ padding: '10px 8px', textAlign: 'center', color: '#94a3b8' }}>{t.t08 || '-'}</td>
                  <td className="font-tech" style={{ padding: '10px 8px', textAlign: 'center', color: '#94a3b8' }}>{t.t12 || '-'}</td>
                  <td className="font-tech" style={{ padding: '10px 8px', textAlign: 'center', color: '#94a3b8' }}>{t.t16 || '-'}</td>
                  <td className="font-tech" style={{ padding: '10px 8px', textAlign: 'center', color: '#94a3b8' }}>{t.t20 || '-'}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button
                        onClick={() => onSelectTide && onSelectTide(t)}
                        style={{
                          padding: '3px 8px',
                          background: 'rgba(6, 182, 212, 0.2)',
                          color: '#67e8f9',
                          border: '1px solid rgba(6, 182, 212, 0.4)',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '11px'
                        }}
                      >
                        วิเคราะห์
                      </button>
                      {t.lat && t.long && (
                        <button
                          onClick={() => onZoomMap && onZoomMap(t.lat, t.long)}
                          style={{
                            padding: '3px 6px',
                            background: '#1e293b',
                            color: '#94a3b8',
                            border: '1px solid #334155',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px'
                          }}
                          title="ดูบนแผนที่"
                        >
                          <ArrowUpRight size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
