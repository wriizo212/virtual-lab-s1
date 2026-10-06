import { Check, FlaskConical, Play } from 'lucide-react';
import { useLab } from '../state/LabContext';
import { ProgressBar } from '../components/ProgressBar';
import { tubeIds, materialNames } from '../domain/experiment';
import { canStartExperiment, startExperiment } from '../domain/simulation';
export function SetupComplete() {
  const { state, updateSession } = useLab(); const session = state.session!;
  return <><ProgressBar/><section className="panel"><div className="eyebrow">PENYEDIAAN SELESAI</div><h1>Makmal anda sudah bersedia.</h1><p className="muted">Hipotesis, ramalan dan penyediaan tabung telah disimpan.</p><div className="setup-summary">{tubeIds.map(id => <article key={id}><strong><Check size={18}/> Tabung {id}</strong><p>{session.tubes[id].materials.map(material => materialNames[material]).join(' · ')}</p><span>{session.tubes[id].location === 'fridge' ? 'Peti sejuk · 5°C' : 'Suhu bilik · 25°C'}</span></article>)}</div><div className="info-strip"><FlaskConical size={22}/><span>Ramalan anda: <strong>{session.prediction.length ? session.prediction.map(id => `Tabung ${id}`).join(', ') : 'Tiada tabung'}</strong>. Keputusan akan dibandingkan selepas simulasi.</span></div><div className="actions"><button className="secondary" onClick={() => updateSession({ ...session, screen: 'setup', step: 2 })}>Kembali ke makmal</button><button className="primary" disabled={!canStartExperiment(session)} onClick={() => updateSession(startExperiment(session))}><Play size={20}/>{session.experimentStartedAt ? 'Sambung eksperimen' : 'Mulakan eksperimen'}</button></div></section></>;
}
