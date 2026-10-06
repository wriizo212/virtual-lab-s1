import { useState } from 'react';
import { Copy,FileText,FlaskConical,Lightbulb,Share2,Sprout,UsersRound } from 'lucide-react';
import { useLab } from '../state/LabContext';
import { formatLabDate,learningFeedback,pbdSuggestion } from '../domain/learning';
import { encodeShareCode } from '../domain/classroom';
import { ClassCodeQr } from '../components/ClassCodeQr';
import { ProgressBar } from '../components/ProgressBar';
import { ScoreBreakdown } from '../components/ScoreBreakdown';
import { ContributionReflection } from '../components/ContributionReflection';
function CopyClassCode({code}:{code:string}) {
  const [state,setState]=useState<'idle'|'ok'|'manual'>('idle');
  if(state==='manual') return <input readOnly value={code} aria-label="Kod kelas untuk salinan manual" onFocus={event=>event.target.select()}/>;
  return <button className="secondary" onClick={async()=>{try{await navigator.clipboard.writeText(code);setState('ok');}catch{setState('manual');}}}><Copy size={17}/>{state==='ok'?'Kod kelas disalin':'Salin kod kelas'}</button>;
}
export function FinalResults() {
  const {state,updateSession}=useLab();const session=state.session!;
  const feedback=learningFeedback(session);const pbd=pbdSuggestion(session);const shareCode=encodeShareCode(session);
  return <><ProgressBar/><section className="panel final-panel"><div className="completion-heading"><span className="completion-icon"><Sprout size={35}/></span><div><div className="eyebrow">EKSPERIMEN SELESAI</div><h1>{session.mode==='group'?`Tahniah, ${session.name}.`:`Penyiasatan selesai, ${session.name}.`}</h1><p className="muted">{session.className} · {formatLabDate(session.completedAt!)}</p></div></div>{session.mode==='group'&&!session.reflectionReviewed?<ContributionReflection/>:<><div className="final-participants"><span>{session.mode==='group'?'Kumpulan':'Nama murid'}: <strong>{session.name}</strong></span>{session.mode==='group'&&<span><UsersRound size={18}/>{session.members.map(m=>m.name).join(' · ')}</span>}</div>{state.settings.scoreEnabled&&<ScoreBreakdown session={session}/>}<div className="learning-feedback"><Lightbulb size={24}/><div><h2>{feedback.positive}</h2><p>{feedback.review}</p></div></div><div className="report-facts"><span>Petunjuk digunakan: <strong>{session.hintsUsed}</strong></span><span>Kod rujukan: <strong>{session.resultCode}</strong></span></div><div className="class-code-card"><div className="class-code-main"><ClassCodeQr text={shareCode}/><div className="class-code-text"><span className="small muted">KOD UNTUK GURU</span><strong>{shareCode}</strong><div className="class-code-actions"><CopyClassCode code={shareCode}/>{'share' in navigator&&<button className="secondary" onClick={()=>{navigator.share({title:'Kod kelas — Virtual Lab',text:shareCode}).catch(()=>{});}}><Share2 size={17}/>Kongsi</button>}</div></div></div><p className="small muted">Tunjukkan kod QR ini kepada guru untuk diimbas, atau hantar kod supaya keputusan anda disertakan dalam ringkasan kelas.</p></div><div className="pbd-preview"><span>Cadangan TP untuk pertimbangan guru</span><strong>{pbd.tp}</strong><p>Cadangan berasaskan rekod pembelajaran. Guru menentukan TP dengan bukti pemerhatian dan perbincangan.</p></div><div className="actions"><button className="secondary" onClick={()=>updateSession({...session,screen:'challenge',step:8})}><FlaskConical size={18}/>Teruskan cabaran</button><button className="primary" onClick={()=>updateSession({...session,screen:'report'})}><FileText size={18}/>Lihat laporan</button></div>{session.mode==='group'&&<button className="text-button revisit-reflection" onClick={()=>updateSession({...session,reflectionReviewed:false})}>Semak refleksi ahli</button>}</>}</section></>;
}
