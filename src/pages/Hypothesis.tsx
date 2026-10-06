import { ArrowRight } from 'lucide-react';
import { ProgressBar } from '../components/ProgressBar';
import { GroupTurn } from '../components/GroupTurn';
import { useLab } from '../state/LabContext';
import { hypothesisOptions as options } from '../domain/learning';
export function Hypothesis() {
  const { state, updateSession } = useLab(); const session = state.session!;
  return <><ProgressBar/><section className="panel hypothesis-panel"><div className="eyebrow">01 / HIPOTESIS</div><h1>Apakah yang anda jangkakan?</h1><p className="muted">Pilih satu hipotesis. Anda akan mengujinya melalui eksperimen.</p><div className="question-banner">Adakah udara, air dan suhu yang sesuai diperlukan untuk biji benih bercambah?</div><GroupTurn role="Ketua Eksperimen" instruction="Baca persoalan dan minta pendapat setiap ahli sebelum memilih hipotesis."/><fieldset className="hypothesis-options"><legend className="sr-only">Pilihan hipotesis</legend>{options.map((option, i) => <label key={option} className={session.hypothesis === i ? 'option-card selected' : 'option-card'}><input type="radio" name="hypothesis" checked={session.hypothesis === i} onChange={() => updateSession({ ...session, hypothesis: i })}/><span className="option-letter">{String.fromCharCode(65 + i)}</span><span>{option}</span></label>)}</fieldset><div className="actions"><span className="small muted">Jawapan anda disimpan untuk dibandingkan kemudian.</span><button className="primary" disabled={session.hypothesis === null} onClick={() => updateSession({ ...session, screen: 'prediction', step: 1, completedSteps: [...new Set([...session.completedSteps, 0])] })}>Simpan & buat ramalan <ArrowRight size={18}/></button></div></section></>;
}

