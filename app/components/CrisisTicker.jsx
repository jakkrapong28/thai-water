'use client';

import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, AlertTriangle, Radio } from 'lucide-react';

export default function CrisisTicker({ criticalStations = [], tides = [] }) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioCtxRef = useRef(null);

  const playSiren = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }

      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      const now = ctx.currentTime;

      // Siren frequency sweep
      osc.frequency.setValueAtTime(620, now);
      osc.frequency.linearRampToValueAtTime(980, now + 0.35);
      osc.frequency.linearRampToValueAtTime(620, now + 0.7);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.75);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  };

  const handleTestSiren = () => {
    playSiren();
  };

  // Compile ticker headlines
  const headlines = [];
  if (criticalStations.length > 0) {
    criticalStations.slice(0, 10).forEach(s => {
      headlines.push(`🚨 [${s.province || 'ส่วนกลาง'}] ${s.name} (${s.waterbody}) : ${s.diffText || 'ระดับวิกฤต'}`);
    });
  }

  // Tide highlight
  const fortChula = tides.find(t => t.name_th && t.name_th.includes('ป้อมพระจุล'));
  if (fortChula) {
    headlines.push(`🌊 [สมุทรปราการ] ป้อมพระจุลจอมเกล้า น้ำทะเลหนุนสูงสุด +${fortChula.max_value} ม.รทก. เวลา ${fortChula.max_time} น.`);
  }

  const defaultText = '⚡ เชื่อมต่อ API สสน. ThaiWater v3, กรมชลประทาน, สำนักการระบายน้ำ กทม. และกรมอุทกศาสตร์ กองทัพเรือ เรียลไทม์';

  return (
    <div style={{
      background: 'rgba(69, 10, 10, 0.85)',
      borderBottom: '1px solid rgba(239, 68, 68, 0.4)',
      backdropFilter: 'blur(8px)',
      padding: '6px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      fontSize: '13px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden', flex: 1 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(185, 28, 28, 0.8)',
          color: '#fee2e2',
          padding: '2px 8px',
          borderRadius: '6px',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          border: '1px solid rgba(248, 113, 113, 0.5)'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#ef4444'
          }} className="ping-beacon" />
          <Radio size={14} />
          <span>แจ้งเตือนวิกฤต</span>
        </div>

        <div style={{
          color: '#fecaca',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          fontSize: '12px'
        }}>
          {headlines.length > 0 ? headlines.join('   •••   ') : defaultText}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 8px',
            background: soundEnabled ? 'rgba(127, 29, 29, 0.6)' : 'rgba(30, 41, 59, 0.8)',
            border: `1px solid ${soundEnabled ? 'rgba(239, 68, 68, 0.5)' : 'rgba(100, 116, 139, 0.3)'}`,
            borderRadius: '6px',
            color: soundEnabled ? '#fca5a5' : '#94a3b8',
            fontSize: '11px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          title={soundEnabled ? 'ปิดเสียงแจ้งเตือน' : 'เปิดเสียงแจ้งเตือน'}
        >
          {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
          <span>{soundEnabled ? 'เสียง: เปิด' : 'เสียง: ปิด'}</span>
        </button>

        <button
          onClick={handleTestSiren}
          style={{
            padding: '3px 8px',
            background: 'rgba(30, 41, 59, 0.9)',
            border: '1px solid rgba(148, 163, 184, 0.3)',
            borderRadius: '6px',
            color: '#cbd5e1',
            fontSize: '11px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          ทดสอบไซเรน
        </button>
      </div>
    </div>
  );
}
