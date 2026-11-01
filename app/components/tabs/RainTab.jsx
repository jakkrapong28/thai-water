'use client';

import { CloudRain, Droplets, Award, Compass } from 'lucide-react';

export default function RainTab({ rains = [] }) {
  // Sort top 30 stations by rain_24h descending
  const topRains = [...rains]
    .filter(r => (r.rain_24h || 0) > 0)
    .sort((a, b) => (b.rain_24h || 0) - (a.rain_24h || 0))
    .slice(0, 35);

  const getRainSeverity = (val) => {
    if (val >= 90) return { label: 'ฝนตกหนักมาก ⚠️', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' };
    if (val >= 35) return { label: 'ฝนตกหนัก 🌧️', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' };
    if (val >= 10) return { label: 'ฝนปานกลาง 🌦️', color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)' };
    return { label: 'ฝนเล็กน้อย 💧', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' };
  };

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
            background: 'rgba(56, 189, 248, 0.2)',
            color: '#38bdf8',
            padding: '6px',
            borderRadius: '8px',
            display: 'flex'
          }}>
            <CloudRain size={18} />
          </span>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#f8fafc' }}>
              รายงานปริมาณน้ำฝนสะสม 24 ชั่วโมง (สถานีที่มีปริมาณฝนสูงสุด)
            </h2>
            <p style={{ fontSize: '11px', color: '#94a3b8' }}>
              เชื่อมโยงข้อมูลสถานีโทรมาตรตรวจวัดน้ำฝนอัตโนมัติ กรมอุตุนิยมวิทยา และ สสน. ทั่วประเทศ
            </p>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '8px',
          fontSize: '11px',
          color: '#cbd5e1'
        }}>
          <span style={{ padding: '3px 8px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
            ≥ 90 มม. หนักมาก
          </span>
          <span style={{ padding: '3px 8px', borderRadius: '4px', background: 'rgba(249, 115, 22, 0.2)', color: '#fb923c' }}>
            ≥ 35 มม. หนัก
          </span>
          <span style={{ padding: '3px 8px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.2)', color: '#7dd3fc' }}>
            &lt; 35 มม. ปานกลาง/เล็กน้อย
          </span>
        </div>
      </div>

      <div className="glass-panel" style={{ overflowX: 'auto', borderRadius: '10px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
          <thead>
            <tr style={{
              background: 'rgba(15, 23, 42, 0.9)',
              borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
              color: '#94a3b8',
              fontSize: '11px'
            }}>
              <th style={{ padding: '10px 14px', width: '50px' }}>อันดับ</th>
              <th style={{ padding: '10px 14px' }}>ชื่อสถานีตรวจวัด</th>
              <th style={{ padding: '10px 14px' }}>อำเภอ / จังหวัด</th>
              <th style={{ padding: '10px 14px' }}>ลุ่มน้ำ</th>
              <th style={{ padding: '10px 14px', textAlign: 'right' }}>ฝน 1 ชม.</th>
              <th style={{ padding: '10px 14px', textAlign: 'right' }}>ฝนสะสม 24 ชม.</th>
              <th style={{ padding: '10px 14px', textAlign: 'center' }}>ระดับความรุนแรง</th>
            </tr>
          </thead>
          <tbody>
            {topRains.map((r, idx) => {
              const val = r.rain_24h || 0;
              const sev = getRainSeverity(val);
              return (
                <tr
                  key={idx}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td className="font-tech" style={{
                    padding: '10px 14px',
                    fontWeight: 700,
                    color: idx < 3 ? '#facc15' : '#64748b'
                  }}>
                    #{idx + 1}
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#f8fafc' }}>
                    {r.station?.tele_station_name?.th || r.station?.tele_station_name?.en || '-'}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#cbd5e1' }}>
                    {r.geocode?.amphoe_name?.th || ''} จ.{r.geocode?.province_name?.th || '-'}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#94a3b8' }}>
                    {r.basin?.basin_name?.th || '-'}
                  </td>
                  <td className="font-tech" style={{ padding: '10px 14px', textAlign: 'right', color: '#cbd5e1' }}>
                    {r.rain_1h !== null ? `${r.rain_1h} มม.` : '-'}
                  </td>
                  <td className="font-tech" style={{
                    padding: '10px 14px',
                    textAlign: 'right',
                    fontWeight: 700,
                    fontSize: '14px',
                    color: '#38bdf8'
                  }}>
                    {val.toFixed(1)} มม.
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: sev.bg,
                      color: sev.color,
                      fontSize: '11px',
                      fontWeight: 600
                    }}>
                      {sev.label}
                    </span>
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
