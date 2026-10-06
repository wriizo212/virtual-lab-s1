import { useEffect, useRef, useState } from 'react';
import { FocusModal } from './FocusModal';
import { decodeQrFromImageData } from '../domain/qrscan';

// Camera scanner for teacher mode. Works on any browser with getUserMedia
// (HTTPS); degrades to a clear message and the paste box when unavailable.
export function CodeScanner({ onCode, onClose }: { onCode: (code: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;
  const [status, setStatus] = useState('Menghidupkan kamera…');
  useEffect(() => {
    let active = true; let stream: MediaStream | undefined; let frame = 0; let lastScan = 0; let lastCode = ''; let lastAt = 0;
    const canvas = document.createElement('canvas');
    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) { setStatus('Kamera tidak tersedia pada peranti ini. Guna tampalan kod dalam kotak teks.'); return; }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        if (!active) { stream.getTracks().forEach(track => track.stop()); return; }
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setStatus('Halakan kamera ke kod QR murid. Kod sah akan diimport secara automatik.');
        const context = canvas.getContext('2d', { willReadFrequently: true });
        const tick = (now: number) => {
          if (!active) return;
          frame = window.requestAnimationFrame(tick);
          if (now - lastScan < 140 || !context || video.readyState < 2 || !video.videoWidth) return;
          lastScan = now;
          const width = Math.min(460, video.videoWidth);
          const height = Math.max(1, Math.round(width * video.videoHeight / video.videoWidth));
          canvas.width = width; canvas.height = height;
          context.drawImage(video, 0, 0, width, height);
          const image = context.getImageData(0, 0, width, height);
          const code = decodeQrFromImageData(image.data, width, height);
          if (!code || !code.startsWith('SCI1-KELAS-')) return;
          if (code === lastCode && now - lastAt < 2500) return;
          lastCode = code; lastAt = now;
          onCodeRef.current(code);
        };
        frame = window.requestAnimationFrame(tick);
      } catch {
        if (active) setStatus('Kamera tidak dibenarkan atau tidak tersedia. Guna tampalan kod dalam kotak teks.');
      }
    }
    start();
    return () => { active = false; window.cancelAnimationFrame(frame); stream?.getTracks().forEach(track => track.stop()); };
  }, []);
  return <FocusModal title="Imbas kod QR" closeLabel="Tutup pengimbas" onClose={onClose}>
    <div className="scanner-panel"><div className="eyebrow">IMBAS KOD QR MURID</div><h2>Imbas kod kelas</h2><video ref={videoRef} className="scanner-video" playsInline muted aria-label="Pratonton kamera untuk mengimbas kod QR"/><p role="status">{status}</p><p className="small muted">Jika kamera gagal, tutup pengimbas dan tampal kod dalam kotak teks.</p></div>
  </FocusModal>;
}
