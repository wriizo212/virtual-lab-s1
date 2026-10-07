import { useEffect, useRef } from 'react';
import { consumePendingConfetti } from '../domain/fx';

const colors = ['#e5484d', '#f5a524', '#30a46c', '#0091ff', '#8e4ec6', '#f76808'];

// Celebration overlay: listens for 'vlab:confetti' events and rains
// short-lived pieces (Web Animations API — no dependencies, fully offline).
// Skipped when the device asks for reduced motion.
export function Confetti() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const layer = ref.current;
    if (!layer) return;
    const burst = (intensity: 'normal' | 'big') => {
      const count = intensity === 'big' ? 90 : 55;
      const height = window.innerHeight + 60;
      for (let i = 0; i < count; i++) {
        const piece = document.createElement('i');
        piece.className = 'confetti-piece';
        const size = 6 + Math.random() * 7;
        piece.style.cssText = `position:absolute;top:-18px;left:${Math.random() * 100}%;width:${size}px;height:${size * .62}px;background:${colors[i % colors.length]};border-radius:2px;opacity:${.7 + Math.random() * .3}`;
        layer.appendChild(piece);
        const drift = (Math.random() - .5) * 170;
        const fall = piece.animate([
          { transform: 'translate(0,0) rotate(0deg)' },
          { transform: `translate(${drift}px, ${height}px) rotate(${Math.random() * 720 - 360}deg)` },
        ], { duration: 2200 + Math.random() * 2300, delay: Math.random() * (intensity === 'big' ? 900 : 600), easing: 'cubic-bezier(.2,.5,.6,1)', fill: 'forwards' });
        fall.onfinish = () => piece.remove();
      }
    };
    const reduced = () => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };
    const onEvent = (event: Event) => {
      const queued = consumePendingConfetti();
      if (reduced()) return;
      burst((event as CustomEvent).detail?.intensity ?? queued ?? 'normal');
    };
    window.addEventListener('vlab:confetti', onEvent);
    // A celebration may have been queued before this overlay mounted.
    const queued = consumePendingConfetti();
    if (queued && !reduced()) burst(queued);
    return () => window.removeEventListener('vlab:confetti', onEvent);
  }, []);
  return <div id="confetti-layer" ref={ref} aria-hidden="true"/>;
}
