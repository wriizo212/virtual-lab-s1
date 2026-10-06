import { Check, ArrowRight } from 'lucide-react';
import { useLab } from '../state/LabContext';
import { expectedResult, predictionMatches } from '../domain/simulation';
import { tubeIds } from '../domain/experiment';
import { ProgressBar } from '../components/ProgressBar';
import { GroupTurn } from '../components/GroupTurn';
import { setPredictionComparison } from '../domain/learning';
export function Comparison() {
  const { state, updateSession } = useLab(); const session = state.session!;
  const actual = tubeIds.filter(id => expectedResult(session.tubes[id]).germination);
  const matches = predictionMatches(session); const answered = typeof session.predictionComparison === 'boolean';
  const answerCorrect = session.predictionComparison === matches;
  return <><ProgressBar/><section className="panel comparison-panel"><div className="eyebrow">RAMALAN & BUKTI</div><h1>Adakah ramalan anda disokong?</h1><p className="muted">Ramalan membantu kita bertanya. Bukti membantu kita memahami.</p><GroupTurn role="Pembentang" instruction="Bacakan ramalan awal dan keputusan. Minta setiap ahli menyatakan apa yang dipelajari."/><div className="comparison-grid"><article><span>RAMALAN ANDA</span><h2>{session.prediction.length ? session.prediction.map(id => `Tabung ${id}`).join(' dan ') : 'Tiada tabung'}</h2><p>Direkodkan sebelum penyediaan.</p></article><article><span>KEPUTUSAN EKSPERIMEN</span><h2>{actual.length ? actual.map(id => `Tabung ${id}`).join(' dan ') : 'Tiada tabung'}{actual.length === 1 ? ' sahaja' : ''}</h2><p>Selepas 5 hari simulasi.</p></article></div><h2 className="comparison-question">Adakah ramalan anda sama dengan keputusan eksperimen?</h2><div className="observation-choices">{[true, false].map(value => <button key={String(value)} className={session.predictionComparison === value ? 'primary' : 'secondary'} aria-pressed={session.predictionComparison === value} onClick={() => updateSession(setPredictionComparison(session, value))}>{value ? 'Ya' : 'Tidak'}</button>)}</div>{answered && <div className="info-strip" role="status"><Check size={20}/><span>{answerCorrect ? matches ? 'Ramalan anda selaras dengan bukti eksperimen.' : 'Ramalan anda berbeza. Itu sebahagian daripada penyiasatan sains; tiada markah ditolak.' : 'Bandingkan semula nama tabung dalam kedua-dua rekod.'}</span></div>}{answered && answerCorrect && <div className="phase-notice"><Check size={22}/><div><strong>Pemerhatian dan keputusan selesai.</strong><p>Terangkan sebab keputusan ini, kemudian bina kesimpulan anda.</p></div></div>}<div className="actions"><button className="secondary" onClick={() => updateSession({ ...session, screen: 'results', step: 5 })}>Lihat jadual keputusan</button><button className="primary" disabled={!answered || !answerCorrect} onClick={() => updateSession({ ...session, screen: 'explanation', step: 6 })}>Teruskan analisis <ArrowRight size={18}/></button></div></section></>;
}

