'use client';

import { useState } from 'react';
import { Video, Maximize2, ExternalLink, RefreshCw } from 'lucide-react';

export default function CctvTab({ cctvs = [], onSelectCctv, onZoomMap }) {
  const [selectedProvince, setSelectedProvince] = useState('all');

  // Extract unique provinces
  const provinces = Array.from(new Set(cctvs.map(c => c.geocode?.province_name?.th).filter(Boolean))).sort();

  const filtered = selectedProvince === 'all'
    ? cctvs
    : cctvs.filter(c => c.geocode?.province_name?.th === selectedProvince);

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            background: 'rgba(168, 85, 247, 0.2)',
            color: '#d8b4fe',
            padding: '6px',
            borderRadius: '8px',
            display: 'flex'
          }}>
            <Video size={18} />
          </span>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#f8fafc' }}>
              กล้องวงจรปิด CCTV ถ่ายทอดสดตามจุดสำคัญ ({cctvs.length} กล้อง)
            </h2>
            <p style={{ fontSize: '11px', color: '#94a3b8' }}>
              เชื่อมต่อเครือข่ายกล้องตรวจสอบระดับน้ำและสภาพจราจร กรมทรัพยากรน้ำ, กฟผ., กทม., สสน.
            </p>
          </div>
        </div>

        {/* Province Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '12px', color: '#94a3b8' }}>เลือกจังหวัด:</label>
          <select
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              background: '#0f172a',
              color: '#f8fafc',
              border: '1px solid #334155',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            <option value="all">ทุกจังหวัด ({cctvs.length})</option>
            {provinces.map(p => {
              const count = cctvs.filter(c => c.geocode?.province_name?.th === p).length;
              return <option key={p} value={p}>{p} ({count})</option>;
            })}
          </select>
        </div>
      </div>

      {/* Grid of CCTV feeds */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '14px'
      }}>
        {filtered.map((item, idx) => {
          const rawUrl = item.cctv_url || '';
          const imgUrl = rawUrl.startsWith('http')
            ? rawUrl
            : 'https://placehold.co/600x380/0f172a/94a3b8?text=CCTV+Feed';

          return (
            <div
              key={idx}
              className="glass-panel"
              style={{
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: '1px solid rgba(168, 85, 247, 0.2)'
              }}
            >
              <div>
                {/* Image Snapshot Container */}
                <div
                  className="cctv-img-container"
                  onClick={() => onSelectCctv && onSelectCctv(item)}
                  style={{ cursor: 'pointer' }}
                >
                  <img
                    src={imgUrl}
                    alt={item.title}
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = 'https://placehold.co/600x380/0f172a/94a3b8?text=Camera+Connecting...';
                    }}
                  />
                  <span style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    background: 'rgba(220, 38, 38, 0.85)',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'white' }} className="ping-beacon" />
                    LIVE
                  </span>
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    color: '#e2e8f0',
                    padding: '4px',
                    borderRadius: '4px',
                    display: 'flex'
                  }}>
                    <Maximize2 size={13} />
                  </div>
                </div>

                <div style={{ marginTop: '10px' }}>
                  <h4 style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#f8fafc',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {item.title || 'กล้องวงจรปิด'}
                  </h4>
                  <p style={{
                    fontSize: '11px',
                    color: '#94a3b8',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginTop: '2px'
                  }}>
                    {item.description || item.basin_name?.th || ''} • จ.{item.geocode?.province_name?.th || '-'}
                  </p>
                </div>
              </div>

              <div style={{
                marginTop: '10px',
                paddingTop: '8px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11px'
              }}>
                <span style={{ color: '#64748b' }}>
                  {item.agency?.agency_shortname?.th || 'DWR/EGAT'}
                </span>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => onSelectCctv && onSelectCctv(item)}
                    style={{
                      padding: '3px 8px',
                      background: 'rgba(168, 85, 247, 0.25)',
                      color: '#d8b4fe',
                      border: '1px solid rgba(168, 85, 247, 0.5)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 500
                    }}
                  >
                    ขยายภาพ
                  </button>
                  {item.lat && item.long && (
                    <button
                      onClick={() => onZoomMap && onZoomMap(parseFloat(item.lat), parseFloat(item.long))}
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
                      <ExternalLink size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
