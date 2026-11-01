'use client';

import { useEffect, useRef, useState } from 'react';
import { CameraImage } from './CameraGallery';

let loader;
function loadHls() {
  if (window.Hls) return Promise.resolve(window.Hls);
  if (!loader) loader = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.17/hls.min.js';
    script.async = true;
    script.onload = () => resolve(window.Hls);
    script.onerror = () => { script.remove(); loader = null; reject(new Error('Player unavailable')); };
    document.body.append(script);
  });
  return loader;
}

export default function LiveCameraPlayer({ camera }) {
  const video = useRef(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!camera?.stream_url || camera.media_type !== 'hls' || !video.current) return;
    setError('');
    const element = video.current;
    let player;
    let cancelled = false;
    if (element.canPlayType('application/vnd.apple.mpegurl')) {
      element.src = camera.stream_url;
      element.play().catch(() => setError('แตะปุ่มเล่นเพื่อเริ่มสตรีม'));
    } else {
      loadHls().then(Hls => {
        if (cancelled) return;
        if (!Hls?.isSupported()) { setError('เบราว์เซอร์นี้ไม่รองรับสตรีม'); return; }
        player = new Hls({ maxBufferLength: 10 });
        player.loadSource(camera.stream_url);
        player.attachMedia(element);
        player.on(Hls.Events.MANIFEST_PARSED, () => element.play().catch(() => {}));
        player.on(Hls.Events.ERROR, (_event, details) => { if (details.fatal) setError('สตรีมต้นทางขัดข้องชั่วคราว'); });
      }).catch(() => { if (!cancelled) setError('โหลดตัวเล่นสตรีมไม่ได้'); });
    }
    return () => { cancelled = true; player?.destroy(); element.pause(); element.removeAttribute('src'); element.load(); };
  }, [camera.stream_url, camera.media_type]);
  if (camera.media_type === 'mjpeg') return <img className="camera-large" src={camera.stream_url} alt={`ภาพสด ${camera.title}`}/>;
  return <div className="live-player"><video ref={video} controls muted playsInline className="camera-large" onError={()=>setError('สตรีมต้นทางขัดข้องชั่วคราว')}/>{error && <div className="live-error"><span>{error}</span><CameraImage camera={camera} className="camera-large"/></div>}</div>;
}
