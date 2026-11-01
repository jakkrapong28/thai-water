'use client';

import { useState } from 'react';
import { X, RefreshCw, ExternalLink, MapPin, Building, Video } from 'lucide-react';

export default function CctvModal({ cctv, onClose, onZoomMap }) {
  const [key, setKey] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(true);

  if (!cctv) return null;

  const handleRefresh = () => {
    setIsLoading(true);
    setKey(Date.now());
  };

  const rawUrl = cctv.cctv_url || '';
  const separator = rawUrl.includes('?') ? '&' : '?';
  const streamSrc = rawUrl.startsWith('http')
    ? `${rawUrl}${separator}_t=${key}`
    : 'https://placehold.co/800x480/0f172a/94a3b8?text=CCTV+Feed+Offline';

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
        maxWidth: '850px',
        width: '100%',
        backgroundColor: '#090e1c',
        border: '1px solid rgba(168, 85, 247, 0.4)',
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
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc' }}>
                {cctv.title || 'กล้องวงจรปิด CCTV'}
              </h3>
              <p style={{ fontSize: '11px', color: '#94a3b8' }}>
                {cctv.description || `จ.${cctv.geocode?.province_name?.th || ''}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Video / Image Stream Display */}
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', backgroundColor: '#020617' }}>
          {isLoading && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#a855f7',
              fontSize: '13px',
              gap: '8px'
            }}>
              <RefreshCw className="animate-spin" size={18} />
              <span>กำลังดึงภาพสดจากเซิร์ฟเวอร์กล้อง...</span>
            </div>
          )}

          <img
            key={key}
            src={streamSrc}
            alt={cctv.title}
            onLoad={() => setIsLoading(false)}
            onError={(e) => {
              setIsLoading(false);
              e.target.src = 'https://placehold.co/800x480/0f172a/94a3b8?text=Camera+Connecting...';
            }}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />

          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            backgroundColor: 'rgba(220, 38, 38, 0.9)',
            color: 'white',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'white' }} className="ping-beacon" />
            LIVE CCTV
          </div>
        </div>

        {/* Footer info & Controls */}
        <div style={{
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '12px',
          color: '#94a3b8'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Building size={14} color="#a855f7" />
              <span>{cctv.agency?.agency_name?.th || 'กรมทรัพยากรน้ำ / สสน.'}</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={14} color="#06b6d4" />
              <span>{cctv.geocode?.amphoe_name?.th || ''} จ.{cctv.geocode?.province_name?.th || ''}</span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleRefresh}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 10px',
                background: '#1e293b',
                color: '#cbd5e1',
                border: '1px solid #334155',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              <RefreshCw size={13} />
              <span>รีเฟรชภาพ</span>
            </button>

            {cctv.lat && cctv.long && (
              <button
                onClick={() => {
                  onZoomMap && onZoomMap(parseFloat(cctv.lat), parseFloat(cctv.long));
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 12px',
                  background: '#9333ea',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '11px'
                }}
              >
                <span>ดูบนแผนที่</span>
                <ExternalLink size={12} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
