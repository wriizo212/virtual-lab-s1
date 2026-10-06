import { useEffect, useState } from 'react';
import { ArrowRight, Pause, Play, ScanEye, Check } from 'lucide-react';
import { useLab } from '../state/LabContext';
import { advanceDay } from '../domain/simulation';
import { tubeIds } from '../domain/experiment';
import { ProgressBar } from '../components/ProgressBar';
import { GroupTurn } from '../components/GroupTurn';
import { TubeVisual } from '../components/ExperimentTube';
export function Simulation() {
  const { state, updateSession } = useLab(); const session = state.session!;
  const [playing, setPlaying] = useState(false); const [revealPaper, setRevealPaper] = useState(false);
  useEffect(() => {
    if (!playing || session.day >= 5) { if (playing) setPlaying(false); return; }
    const timer = window.setTimeout(() => updateSession(advanceDay(session)), 1800);
    return () => window.clearTimeout(timer);
  }, [playing, session, updateSession]);
  return <><ProgressBar/><section className="panel simulation-panel"><div className="simulation-title"><div><div className="eyebrow">04 / EKSPERIMEN</div><h1>Lima hari, satu penyiasatan.</h1><p className="muted">Perhatikan perubahan pada biji benih. Masa ini ialah masa simulasi.</p></div><span className="day-badge" aria-live="polite">Hari <strong>{session.day}</strong><span>/ 5</span></span></div><GroupTurn role="Ketua Eksperimen" instruction="Kendalikan masa simulasi. Minta semua ahli memerhatikan setiap tabung."/><ol className="day-timeline" aria-label="Timeline simulasi">{[1,2,3,4,5].map(day => <li key={day}><button className={session.day === day ? 'current-day' : ''} disabled={day > (session.maxDay ?? 1)} aria-current={session.day === day ? 'step' : undefined} onClick={() => { setPlaying(false); updateSession(advanceDay(session, day)); }}>{day < (session.maxDay ?? 1) ? <Check size={16}/> : <span className="timeline-dot"/>}Hari {day}</button></li>)}</ol><div className="simulation-tubes">{tubeIds.map(id => <article key={id} className={`simulation-tube ${session.tubes[id].location === 'fridge' ? 'in-fridge' : ''}`} data-testid={`simulation-${id}`}><h2>Tabung {id}</h2><TubeVisual tube={session.tubes[id]} day={session.day} revealPaper={revealPaper}/><span>{session.tubes[id].location === 'fridge' ? '❄ Peti sejuk · 5°C' : 'Suhu bilik · 25°C'}</span></article>)}</div><button className="secondary cutaway-button" aria-pressed={revealPaper} onClick={() => setRevealPaper(!revealPaper)}><ScanEye size={18}/>{revealPaper ? 'Tutup paparan di sebalik balutan' : 'Lihat di sebalik balutan'}</button>{revealPaper && <p className="cutaway-note">Paparan keratan maya sahaja. Kertas hitam kekal membalut tabung semasa eksperimen.</p>}<div className="simulation-controls"><button className="secondary" onClick={() => setPlaying(!playing)} disabled={session.day === 5}>{playing ? <><Pause size={18}/> Jeda</> : <><Play size={18}/> Auto play</>}</button><button className="primary" disabled={session.day === 5} onClick={() => { setPlaying(false); updateSession(advanceDay(session)); }}>Hari seterusnya <ArrowRight size={18}/></button></div>{session.maxDay === 5 && <div className="day-five-action"><div><strong>Lima hari simulasi telah dilalui.</strong><p>Zoom setiap tabung untuk membuat pemerhatian anda sendiri.</p></div><button className="primary" onClick={() => { setPlaying(false); updateSession({ ...session, screen: 'observation', step: 4 }); }}>Buat pemerhatian <ArrowRight size={18}/></button></div>}</section></>;
}
