import { useEffect, useRef, useState } from 'react';
import { useLab } from '../state/LabContext';
import type { Screen } from '../domain/model';

type Mood = 'hint' | 'happy' | 'sad' | 'cheer';
interface Bubble { text: string; mood: Mood }

const tips: Partial<Record<Screen | 'default', string>> = {
  default: 'Tekan “Mulakan penyiasatan” bila anda sudah bersedia.',
  roles: 'Agihkan peranan dahulu — setiap ahli penting.',
  ready: 'Tekan “Mulakan penyiasatan” bila anda sudah bersedia.',
  hypothesis: 'Fikir dahulu: apa sebenarnya yang diperlukan untuk percambahan?',
  prediction: 'Ramalan yang baik datang daripada pemahaman.',
  setup: 'Seret bahan ke dalam tabung yang betul.',
  setupComplete: 'Sedia? Tonton eksperimen dengan teliti.',
  simulation: 'Tekan Auto play untuk menonton lima hari.',
  observation: 'Perhatikan betul-betul sebelum merekod.',
  results: 'Isikan semua sel, kemudian tekan semak.',
  comparison: 'Jika ramalan berbeza, itu biasa — bukti yang mengajar.',
  explanation: 'Fikirkan sebab di sebalik setiap pilihan.',
  conclusion: 'Susun tiga perkataan ajaib itu.',
  challenge: 'Cabar diri: ubah satu perkara sahaja.',
  final: 'Hebat! Jangan lupa sijil anda.',
  report: 'Laporan anda tersusun dan lengkap.',
};
const cheers = ['Bagus! Teruskan ke langkah seterusnya. 💪', 'Syabas! Anda makin hampir. 🌟', 'Cemerlang! Jangan berhenti di sini. 🚀'];

// "Cik Biji" — a friendly seed guide. Decorative (pointer-events:none) so it
// can never block a tap; bubbles auto-hide and react to real progress.
export function SeedMascot() {
  const { state } = useLab();
  const session = state.session;
  const [bubble, setBubble] = useState<Bubble | null>(null);
  const previous = useRef<{ greeted?: boolean; screen?: string; steps?: number; fails?: number; done?: boolean }>({});

  useEffect(() => {
    if (!session) {
      if (!previous.current.greeted) { previous.current.greeted = true; setBubble({ text: 'Hai! Saya Cik Biji — jom siasat syarat percambahan!', mood: 'hint' }); }
      return;
    }
    const fails = Object.values(session.tubes).reduce((sum, tube) => sum + tube.attempts, 0);
    const stepsDone = session.completedSteps.length;
    const before = previous.current;
    let next: Bubble | null = null;
    if (session.completedAt && !before.done) next = { text: 'MISI SELESAI! Anda penyiasat sebenar. 🌱', mood: 'cheer' };
    else if (before.screen !== session.screen) next = { text: tips[session.screen] ?? tips.default!, mood: 'hint' };
    else if (stepsDone > (before.steps ?? 0)) next = { text: cheers[stepsDone % cheers.length], mood: 'happy' };
    else if (fails > (before.fails ?? 0)) next = { text: 'Hampir! Semak sekali lagi — anda boleh.', mood: 'sad' };
    previous.current = { ...before, screen: session.screen, steps: stepsDone, fails, done: !!session.completedAt };
    if (next) setBubble(next);
  }, [session]);

  useEffect(() => {
    if (!bubble) return;
    const timer = window.setTimeout(() => setBubble(null), 8000);
    return () => window.clearTimeout(timer);
  }, [bubble]);

  return <div className="seed-mascot">
    {bubble && <div key={bubble.text} className={`seed-mascot-bubble mood-${bubble.mood}`} role="status">{bubble.text}</div>}
    <svg viewBox="0 0 140 150" role="img" aria-label="Cik Biji, maskot panduan lab">
      <g className="mascot-body">
        <ellipse cx="70" cy="86" rx="44" ry="50" fill="#c98a4b" transform="rotate(-6 70 86)"/>
        <ellipse cx="54" cy="60" rx="11" ry="8" fill="#fff" opacity=".3" transform="rotate(-20 54 60)"/>
        <path d="M70 38 C66 22 74 12 88 8 C90 22 82 34 70 38Z" fill="#5fae56"/>
        <path d="M70 38 C64 26 52 22 42 26 C46 38 58 42 70 38Z" fill="#79c26d"/>
        <g className="mascot-eyes"><circle cx="56" cy="84" r="6.5" fill="#2f2418"/><circle cx="86" cy="84" r="6.5" fill="#2f2418"/></g>
        <path d="M58 104 q12 12 26 0" stroke="#2f2418" strokeWidth="4.5" fill="none" strokeLinecap="round"/>
        <circle cx="44" cy="98" r="7" fill="#e8998a" opacity=".5"/>
        <circle cx="96" cy="98" r="7" fill="#e8998a" opacity=".5"/>
      </g>
    </svg>
  </div>;
}
