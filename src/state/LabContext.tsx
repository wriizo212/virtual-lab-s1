import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { type AppState, type ClassRecord, type Session, type TeacherSettings } from '../domain/model';
import { localRepository } from '../data/storage';
import { normalizeSettings } from '../domain/settings';
import { playCue } from '../sound';
interface LabContextValue { state: AppState; saveError: boolean; updateSession: (session: Session | null) => void; updateSettings: (settings: TeacherSettings) => void; updateRecords: (records: ClassRecord[]) => void; toggleSound: () => void }
const LabContext = createContext<LabContextValue | null>(null);
export function LabProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(localRepository.load);
  const [saveError, setSaveError] = useState(false);
  useEffect(() => { try { localRepository.save(state); setSaveError(false); } catch { setSaveError(true); } }, [state]);
  const updateSession = (session: Session | null) => {
    if(state.soundEnabled&&session&&state.session){
      if(session.completedAt&&!state.session.completedAt)playCue('complete');
      else if(session.completedSteps.length>state.session.completedSteps.length)playCue('correct');
      else if(Object.values(session.tubes).some(tube=>tube.materials.length>state.session!.tubes[tube.id].materials.length))playCue('drop');
      else if(Object.values(session.tubes).some(tube=>tube.attempts>state.session!.tubes[tube.id].attempts&&!tube.validated))playCue('wrong');
    }
    setState(s => ({ ...s, session: session ? { ...session, updatedAt: new Date().toISOString() } : null }));
  };
  return <LabContext.Provider value={{ state, saveError, updateSession, updateSettings: settings => setState(s => ({...s, settings:normalizeSettings(settings)})), updateRecords: records => setState(s => ({ ...s, classRecords: records })), toggleSound: () => {if(!state.soundEnabled)playCue('correct');setState(s => ({ ...s, soundEnabled: !s.soundEnabled }));} }}>{children}</LabContext.Provider>;
}
export function useLab() { const value = useContext(LabContext); if (!value) throw new Error('LabProvider missing'); return value; }
