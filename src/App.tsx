import { TeacherMode } from './components/TeacherMode';
import { PwaStatus } from './components/PwaStatus';
import { useEffect, useRef, useState } from 'react';
import { Sprout, RotateCcw, X, HardDrive, VolumeX, Volume2, Settings } from 'lucide-react';
import { type Mode } from './domain/model';
import { useLab } from './state/LabContext';
import { Landing } from './pages/Landing';
import { Registration } from './pages/Registration';
import { SessionScreen } from './pages/SessionScreen';

export default function App() {
 const { state, saveError, updateSession, toggleSound } = useLab();
 const [view, setView] = useState<'home' | 'registration' | 'session'>(state.session ? 'session' : 'home');
 const [teacherOpen,setTeacherOpen]=useState(false);
 const [mode, setMode] = useState<Mode>('individual'); const [resetOpen, setResetOpen] = useState(false);
 const [replaceMode, setReplaceMode] = useState<Mode | null>(null);
 const modalRef = useRef<HTMLDivElement>(null);
 useEffect(() => {
   if (!resetOpen && !replaceMode) return;
   const previousFocus = document.activeElement as HTMLElement;
   function keyHandler(event: KeyboardEvent) {
     if (event.key === 'Escape') { setResetOpen(false); setReplaceMode(null); }
     if (event.key === 'Tab') {
       const buttons = modalRef.current?.querySelectorAll<HTMLButtonElement>('button');
       if (!buttons?.length) return;
       const first = buttons[0], last = buttons[buttons.length - 1];
       if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
       else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
     }
   }
   document.addEventListener('keydown', keyHandler);
   return () => { document.removeEventListener('keydown', keyHandler); previousFocus?.focus(); };
 }, [resetOpen, replaceMode]);
 const begin = (next: Mode) => { if (state.session) { setReplaceMode(next); return; } setMode(next); setView('registration'); };

 return <div className="app-shell"><header className="header"><button className="brand" onClick={() => setView('home')} aria-label="Skrin utama"><span className="brand-icon"><Sprout size={26}/></span><span><strong>VIRTUAL LAB</strong><small>SAINS TINGKATAN 1</small></span></button><div className="header-actions"><span className="unit-label">SYARAT PERCAMBAHAN BIJI BENIH</span><button className="icon-button" aria-label="Guru" title="Mod guru" onClick={()=>setTeacherOpen(true)}><Settings size={20}/></button><button className="icon-button" aria-label={state.soundEnabled ? 'Matikan bunyi' : 'Hidupkan bunyi'} title="Bunyi aktiviti" onClick={toggleSound}>{state.soundEnabled ? <Volume2 size={20}/> : <VolumeX size={20}/>}</button>{state.session && <button className="icon-button" aria-label="Reset sesi" onClick={() => setResetOpen(true)}><RotateCcw size={20}/></button>}</div></header><main>{view === 'home' || (!state.session && view === 'session') ? <Landing onSelect={begin} onResume={() => setView('session')}/> : view === 'registration' ? <Registration key={mode} mode={mode} onBack={() => setView('home')} onComplete={() => setView('session')}/> : <SessionScreen onHome={() => setView('home')}/>}</main><footer><span><HardDrive size={15}/>{saveError ? 'Kemajuan tidak dapat disimpan pada peranti ini.' : 'Kemajuan disimpan pada peranti ini'}</span><span>Makmal maya · Tiada bahan sebenar diperlukan</span></footer><PwaStatus/>{teacherOpen&&<TeacherMode onClose={()=>setTeacherOpen(false)} onReset={()=>{updateSession(null);setView('home');setTeacherOpen(false);}}/>}{(resetOpen || replaceMode) && <div className="modal-backdrop" ref={modalRef}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="reset-title"><button autoFocus className="close-button" aria-label="Tutup" onClick={() => { setResetOpen(false); setReplaceMode(null); }}><X size={20}/></button><RotateCcw size={30}/><h2 id="reset-title">{replaceMode ? 'Mulakan sesi baharu?' : 'Reset sesi ini?'}</h2><p>Maklumat dan kemajuan sesi {state.session?.name} akan dipadam daripada peranti ini.</p><div className="actions"><button className="secondary" onClick={() => { setResetOpen(false); setReplaceMode(null); }}>Batal</button><button className="primary" onClick={() => { updateSession(null); if (replaceMode) { setMode(replaceMode); setView('registration'); } else setView('home'); setResetOpen(false); setReplaceMode(null); }}>Ya, {replaceMode ? 'mulakan baharu' : 'reset sesi'}</button></div></section></div>}</div>;
}





