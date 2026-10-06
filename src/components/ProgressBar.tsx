import { Check, LockKeyhole } from 'lucide-react';
import { steps, type Screen } from '../domain/model';
import { useLab } from '../state/LabContext';
import { readyForAnalysis } from '../domain/learning';
const screens: Screen[] = ['hypothesis', 'prediction', 'setup', 'simulation', 'observation', 'results', 'explanation', 'conclusion', 'challenge'];
export function ProgressBar() {
  const { state, updateSession } = useLab(); const session = state.session;
  return <nav className="progress-nav" aria-label="Kemajuan eksperimen"><ol>{steps.map((label, i) => {
    const complete = session?.completedSteps.includes(i); const active = !!session && (screens[i] === session.screen || (i === 5 && session.screen === 'comparison') || (i === 3 && session.screen === 'setupComplete'));
    const frozen = i < 2 && !!session?.experimentStartedAt;
    const available = !!session && !frozen && (i===6?readyForAnalysis(session):i===0||session.completedSteps.includes(i-1));
    const unavailableLabel = frozen ? ' — jawapan direkodkan, aktiviti selesai' : ' — belum dibuka';
    return <li key={label} className={active ? 'active-step' : complete ? 'complete-step' : ''}><button disabled={!available} aria-label={`${i + 1}. ${label}${available ? '' : unavailableLabel}`} aria-current={active ? 'step' : undefined} onClick={() => session && updateSession({ ...session, screen: i === 3 && !session.experimentStartedAt ? 'setupComplete' : screens[i], step: i })}><span className="step-number">{complete ? <Check size={16}/> : i + 1}</span><span>{label}</span>{!available && !complete && <LockKeyhole size={12} aria-label="Belum dibuka"/>}</button></li>;
  })}</ol></nav>;
}

