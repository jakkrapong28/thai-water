'use client';

import { useState, useEffect } from 'react';
import { X, Waves, Compass, Clock, MapPin, AlertCircle, RefreshCw } from 'lucide-react';

export default function TideDetailModal({ tide, onClose, onZoomMap }) {
  const [detailData, setDetailData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tide || !tide.code) return;
    setLoading(true);
    fetch(`/api/tide-detail?code=${tide.code}`)
      .then(res => res.json())
      .then(json => {
        setDetailData(json);
      })
      .catch(err => {
        console.error('Tide detail fetch error:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [tide]);

  if (!tide) return null;

  const isSurge = tide.max_value >= 1.0;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(3, 7, 18, 0.85)',
      backdropFilter: 'blur(10px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '750px',
        width: '100%',
        backgroundColor: '#090e1c',
        border: '1px solid rgba(6, 182, 212, 0.4)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              background: 'rgba(6, 182, 212, 0.2)',
              color: '#67e8f9',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex'
            }}>
              <Waves size={20} />
            </span>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{tide.name_th}</span>
                <span className="font-tech" style={{ fontSize: '12px', color: '#94a3b8' }}>({tide.code})</span>
                <span className={`badge ${isSurge ? 'badge-crisis' : 'badge-tide'}`}>
                  {isSurge ? '⚠️ เสี่ยงน้ำทะเลหนุนสูง' : 'ระดับน้ำขึ้น-ลงปกติ'}
                </span>
              </h3>
              <p style={{ fontSize: '11px', color: '#94a3b8' }}>
                {tide.name_en} • กรมอุทกศาสตร์ กองทัพเรือ ร่วมกับ สสน. (HII FEWS Marine Model)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '18px' }}>
          {/* Key Metric Highlights */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <div style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '12px'
            }}>
              <div style={{ fontSize: '11px', color: '#fca5a5' }}>น้ำทะเลหนุนสูงสุด (High Tide)</div>
              <div className="font-tech" style={{ fontSize: '24px', fontWeight: 700, color: '#f87171' }}>
                +{tide.max_value.toFixed(2)} <span style={{ fontSize: '12px', color: '#cbd5e1' }}>ม.รทก.</span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                เวลาสูงสุด: <strong style={{ color: '#f8fafc' }}>{tide.max_time} น.</strong>
              </div>
            </div>

            <div style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              padding: '12px'
            }}>
              <div style={{ fontSize: '11px', color: '#6ee7b7' }}>น้ำลงต่ำสุด (Low Tide)</div>
              <div className="font-tech" style={{ fontSize: '24px', fontWeight: 700, color: '#34d399' }}>
                {tide.min_value.toFixed(2)} <span style={{ fontSize: '12px', color: '#cbd5e1' }}>ม.รทก.</span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                เวลาต่ำสุด: <strong style={{ color: '#f8fafc' }}>{tide.min_time} น.</strong>
              </div>
            </div>

            <div style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '8px',
              padding: '12px'
            }}>
              <div style={{ fontSize: '11px', color: '#7dd3fc' }}>พิกัดสถานีชายฝั่ง</div>
              <div className="font-tech" style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0', marginTop: '4px' }}>
                {tide.lat.toFixed(4)}°N, {tide.long.toFixed(4)}°E
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                วันที่พยากรณ์: {tide.date || 'ปัจจุบัน'}
              </div>
            </div>
          </div>

          {/* 4-Hour Time Interval Forecast Curve */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            padding: '14px',
            marginBottom: '16px'
          }}>
            <h4 style={{ fontSize: '12px', fontWeight: 600, color: '#67e8f9', marginBottom: '10px' }}>
              ระดับน้ำขึ้น-น้ำลงรอบวัน (เมตร รทก.)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', textAlign: 'center' }}>
              {[
                { time: '00:00 น.', val: tide.t00 },
                { time: '04:00 น.', val: tide.t04 },
                { time: '08:00 น.', val: tide.t08 },
                { time: '12:00 น.', val: tide.t12 },
                { time: '16:00 น.', val: tide.t16 },
                { time: '20:00 น.', val: tide.t20 }
              ].map((item, idx) => (
                <div key={idx} style={{ background: '#090e1c', padding: '8px 4px', borderRadius: '6px', border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>{item.time}</div>
                  <div className="font-tech" style={{ fontSize: '14px', fontWeight: 700, color: '#38bdf8', marginTop: '2px' }}>
                    {item.val || '-'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Advice / Alert Info */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '10px 14px',
            background: isSurge ? 'rgba(239, 68, 68, 0.1)' : 'rgba(6, 182, 212, 0.08)',
            border: `1px solid ${isSurge ? 'rgba(239, 68, 68, 0.3)' : 'rgba(6, 182, 212, 0.2)'}`,
            borderRadius: '8px',
            fontSize: '11px',
            color: isSurge ? '#fca5a5' : '#94a3b8'
          }}>
            <AlertCircle size={16} color={isSurge ? '#ef4444' : '#06b6d4'} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              {isSurge ? (
                <span>
                  <strong>ข้อควรระวัง:</strong> ระดับน้ำทะเลหนุนสูงเกิน +1.00 ม.รทก. อาจส่งผลให้ระดับน้ำในแม่น้ำเจ้าพระยาและแม่น้ำสายหลักตอนล่างยกตัวสูงขึ้น ชุมชนนอกคันกั้นน้ำและพื้นที่ลุ่มต่ำริมแม่น้ำควรยกของขึ้นที่สูงและเฝ้าระวังช่วงน้ำขึ้นสูงสุด
                </span>
              ) : (
                <span>
                  สถานการณ์น้ำทะเลหนุนอยู่ในเกณฑ์ปกติ การระบายน้ำออกสู่ทะเลทำได้ตามรอบน้ำลง
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 18px',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {tide.lat && tide.long && (
            <button
              onClick={() => {
                onZoomMap && onZoomMap(tide.lat, tide.long);
                onClose();
              }}
              style={{
                padding: '6px 14px',
                background: '#0284c7',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              ดูตำแหน่งสถานีบนแผนที่ ↗
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              padding: '6px 14px',
              background: '#1e293b',
              color: '#cbd5e1',
              border: '1px solid #334155',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
