import { useEffect, useState } from 'react';
import { MessageCircle, Timer } from 'lucide-react';
import { useLab } from '../state/LabContext';
export function GroupCheckpoint({ agreed, onAgree, prompt }: { agreed: boolean; onAgree: (value: boolean) => void; prompt: string }) {
  const { state } = useLab(); const [remaining, setRemaining] = useState(30); const [running, setRunning] = useState(false);
  useEffect(() => { if (!running) return; const timer = window.setInterval(() => setRemaining(value => Math.max(0, value - 1)), 1000); return () => window.clearInterval(timer); }, [running]);
  useEffect(() => { if (remaining === 0) setRunning(false); }, [remaining]);
  if (state.session?.mode !== 'group') return null;
  return <aside className="discussion-card"><div className="discussion-heading"><MessageCircle size={20}/><strong>Bincang bersama</strong></div><p>{prompt}</p>{state.settings.discussionCountdown && <div className="discussion-timer"><span aria-live="off"><Timer size={17}/>{remaining} saat</span><button className="secondary" onClick={() => { if (!remaining) setRemaining(30); setRunning(!running); }}>{running ? 'Jeda' : remaining === 0 ? 'Ulang pemasa' : remaining < 30 ? 'Sambung pemasa' : 'Mula 30 saat'}</button><button className="text-button" onClick={() => { setRunning(false); setRemaining(0); }}>Langkau pemasa</button></div>}<p className="agreement-question">Adakah semua ahli bersetuju dengan jawapan ini?</p><div className="agreement-actions"><button className={agreed ? 'primary' : 'secondary'} aria-pressed={agreed} onClick={() => onAgree(true)}>Ya, semua setuju</button><button className={!agreed ? 'selected secondary' : 'secondary'} aria-pressed={!agreed} onClick={() => onAgree(false)}>Belum</button></div></aside>;
}
