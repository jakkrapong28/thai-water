'use client';

import { AlertOctagon, Waves, Activity, CloudRain, ShieldAlert, Video } from 'lucide-react';

export default function MetricCards({ stats, onCardClick }) {
  const cards = [
    {
      id: 'crisis',
      label: 'วิกฤต / ล้นตลิ่ง',
      value: stats.crisisCount,
      unit: 'สถานี',
      sub: 'ระดับน้ำเกินความจุตลิ่ง',
      icon: <AlertOctagon size={20} color="#ef4444" />,
      colorBorder: 'rgba(239, 68, 68, 0.8)',
      colorBg: 'rgba(239, 68, 68, 0.1)',
      isCrisis: stats.crisisCount > 0,
      targetTab: 'crisis'
    },
    {
      id: 'canal',
      label: 'คลองระดับวิกฤต / เตือน',
      value: stats.canalAlertCount,
      unit: 'จุด',
      sub: 'คลอง กทม. และปริมณฑล',
      icon: <Waves size={20} color="#f97316" />,
      colorBorder: 'rgba(249, 115, 22, 0.8)',
      colorBg: 'rgba(249, 115, 22, 0.1)',
      isCrisis: stats.canalAlertCount > 0,
      targetTab: 'crisis'
    },
    {
      id: 'tide',
      label: 'น้ำทะเลหนุนสูงสุด',
      value: stats.maxTide > -999 ? `+${stats.maxTide.toFixed(2)}` : '--',
      unit: 'ม.รทก.',
      sub: stats.maxTideStation || 'ป้อมพระจุลจอมเกล้า',
      icon: <Activity size={20} color="#06b6d4" />,
      colorBorder: 'rgba(6, 182, 212, 0.8)',
      colorBg: 'rgba(6, 182, 212, 0.1)',
      targetTab: 'tide'
    },
    {
      id: 'rain',
      label: 'ฝนสูงสุด 24 ชม.',
      value: stats.maxRain > 0 ? stats.maxRain.toFixed(1) : '0.0',
      unit: 'มม.',
      sub: stats.maxRainLocation || 'ตรวจวัดทั่วประเทศ',
      icon: <CloudRain size={20} color="#38bdf8" />,
      colorBorder: 'rgba(56, 189, 248, 0.8)',
      colorBg: 'rgba(56, 189, 248, 0.1)',
      targetTab: 'rain'
    },
    {
      id: 'road',
      label: 'น้ำท่วมขังบนผิวถนน',
      value: stats.floodRoadCount,
      unit: 'จุด',
      sub: `จากทั้งหมด ${stats.totalRoadCount} จุดตรวจ`,
      icon: <ShieldAlert size={20} color="#ec4899" />,
      colorBorder: stats.floodRoadCount > 0 ? 'rgba(236, 72, 153, 0.9)' : 'rgba(236, 72, 153, 0.3)',
      colorBg: 'rgba(236, 72, 153, 0.1)',
      targetTab: 'roads'
    },
    {
      id: 'cctv',
      label: 'กล้องวงจรปิด CCTV',
      value: stats.cctvCount,
      unit: 'กล้อง',
      sub: 'ออนไลน์ตามถนนและลำน้ำ',
      icon: <Video size={20} color="#a855f7" />,
      colorBorder: 'rgba(168, 85, 247, 0.8)',
      colorBg: 'rgba(168, 85, 247, 0.1)',
      targetTab: 'cctv'
    }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
      gap: '12px',
      padding: '16px 20px 8px 20px',
      maxWidth: '1440px',
      margin: '0 auto',
      width: '100%'
    }}>
      {cards.map(c => (
        <div
          key={c.id}
          onClick={() => onCardClick && onCardClick(c.targetTab)}
          className={`glass-panel ${c.isCrisis ? 'crisis-pulsing' : ''}`}
          style={{
            padding: '12px 14px',
            borderLeft: `4px solid ${c.colorBorder}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>{c.label}</span>
            {c.icon}
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '4px 0' }}>
            <span className="font-tech" style={{
              fontSize: '24px',
              fontWeight: 700,
              color: c.isCrisis ? '#f87171' : '#f8fafc',
              lineHeight: 1
            }}>
              {c.value}
            </span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>{c.unit}</span>
          </div>

          <div style={{
            fontSize: '11px',
            color: '#94a3b8',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {c.sub}
          </div>
        </div>
      ))}
    </div>
  );
}
