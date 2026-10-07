import { useEffect, useRef, useState } from 'react';
import { ArrowRight,Check,Droplets,Wind,Thermometer,Sprout } from 'lucide-react';
import { useLab } from '../state/LabContext';
import { checkConclusion,conclusionSlots,isConclusionCorrect,placeConclusionWord,removeConclusionWord } from '../domain/learning';
import { ProgressBar } from '../components/ProgressBar';
import { GroupTurn } from '../components/GroupTurn';
import { GroupCheckpoint } from '../components/GroupCheckpoint';
import { ConclusionBuilder } from '../components/ConclusionBuilder';
import { celebrate } from '../domain/fx';
export function Conclusion() {
  const {state,updateSession}=useLab();const session=state.session!;const [agreed,setAgreed]=useState(false);
  const checked=session.conclusionChecked;const correct=checked&&isConclusionCorrect(session);
  const celebrated=useRef(correct);
  useEffect(()=>{if(correct&&!celebrated.current){celebrated.current=true;celebrate(state.soundEnabled,{confetti:'normal',vibrate:[16,50,16]});}},[correct,state.soundEnabled]);
  return <><ProgressBar/><section className="panel conclusion-panel"><div className="eyebrow">08 / KESIMPULAN</div><h1>Satukan hasil penyiasatan.</h1><p className="muted">Lengkapkan ayat dengan tiga syarat percambahan yang telah anda uji.</p><GroupTurn role="Pencatat" instruction="Minta setiap ahli mencadangkan satu syarat. Susun kesimpulan bersama."/><ConclusionBuilder session={session} onPlace={(word,slot)=>{setAgreed(false);updateSession(placeConclusionWord(session,word,slot));}} onRemove={slot=>{setAgreed(false);updateSession(removeConclusionWord(session,slot));}}/>{!correct&&<GroupCheckpoint agreed={agreed} onAgree={setAgreed} prompt="Bincangkan bagaimana Tabung B, C dan D menyokong kesimpulan anda."/>}<div className="analysis-check-row"><span className="small muted">Ketiga-tiga perkataan mesti digunakan sekali.</span><button className="primary" disabled={conclusionSlots(session).some(word=>!word)||!!checked||(session.mode==='group'&&!agreed)} onClick={()=>updateSession(checkConclusion(session))}>Semak kesimpulan</button></div>{checked&&!correct&&<div className="table-feedback" role="status"><strong>Susunan ini belum tepat.</strong><p>Semak perkataan yang diikuti oleh frasa “yang sesuai”. Anda boleh menukar kedudukan perkataan.</p></div>}{correct&&<div className="conclusion-success" role="status"><div className="concept-symbols"><Droplets/><span>+</span><Wind/><span>+</span><Thermometer/><span>=</span><Sprout/></div><h2>AIR + OKSIGEN + SUHU SESUAI</h2><span className="concept-equals">=</span><strong>PERCAMBAHAN</strong><p><Check size={18}/>Kesimpulan anda disokong oleh bukti eksperimen.</p></div>}<div className="actions"><button className="secondary" onClick={()=>updateSession({...session,screen:'explanation',step:6})}>Lihat semula analisis</button><button className="primary" disabled={!correct} onClick={()=>updateSession({...session,screen:'challenge',step:8})}>Buka cabaran <ArrowRight size={18}/></button></div></section></>;
}
