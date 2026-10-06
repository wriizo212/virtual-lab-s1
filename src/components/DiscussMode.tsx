import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Eye, Maximize2, X } from 'lucide-react';
import { analysisQuestions, hypothesisOptions } from '../domain/learning';
import { commonMisconceptions, discussNotes, tubeOutcomes, tubeReasonById, type SlideNote } from '../domain/discuss';
import { resultLabels } from '../domain/simulation';
import { TubeVisual } from './ExperimentTube';

const resultFields = ['water', 'oxygen', 'temperature', 'germination'] as const;

function noteFor(id: string): SlideNote {
  if (id.startsWith('analysis-')) return discussNotes.analysis[Number(id.split('-')[1])];
  if (id === 'hypothesis') return discussNotes.hypothesis;
  if (id === 'outcome') return discussNotes.outcome;
  if (id === 'table') return discussNotes.table;
  if (id === 'misconceptions') return discussNotes.misconceptions;
  if (id === 'conclusion') return discussNotes.conclusion;
  return discussNotes.intro;
}

// Teacher-led class discussion: a projector-friendly walkthrough of the
// correct hypothesis, prediction vs evidence, results table, analysis
// questions (revealed one at a time), common misconceptions and the
// conclusion — with optional per-slide teacher notes (script + questions).
export function DiscussMode({ onClose }: { onClose: () => void }) {
  const slides = useMemo(() => [
    { id: 'intro', reveal: false },
    { id: 'hypothesis', reveal: true },
    { id: 'outcome', reveal: false },
    { id: 'table', reveal: false },
    ...analysisQuestions.map((_, i) => ({ id: `analysis-${i}`, reveal: true })),
    { id: 'misconceptions', reveal: false },
    { id: 'conclusion', reveal: false },
  ], []);
  const demo = useMemo(() => tubeOutcomes(), []);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const slide = slides[index];
  const question = slide.id.startsWith('analysis-') ? analysisQuestions[Number(slide.id.split('-')[1])] : null;
  const note = noteFor(slide.id);

  function next() {
    if (slide.reveal && !revealed) { setRevealed(true); return; }
    if (index < slides.length - 1) { setIndex(index + 1); setRevealed(false); }
  }
  function back() {
    if (slide.reveal && revealed) { setRevealed(false); return; }
    if (index > 0) { setIndex(index - 1); setRevealed(false); }
  }
  useEffect(() => {
    function key(event: KeyboardEvent) {
      const dialogs = document.querySelectorAll<HTMLElement>('[role="dialog"]');
      if (dialogs[dialogs.length - 1] !== ref.current) return;
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') next();
      if (event.key === 'ArrowLeft') back();
    }
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  });
  useEffect(() => { ref.current?.querySelector<HTMLButtonElement>('.primary')?.focus(); }, []);
  async function fullscreen() { try { await ref.current?.requestFullscreen(); } catch { /* ignored — projector can use F11 */ } }

  return <div className="discuss-overlay" role="dialog" aria-modal="true" aria-label="Bincang bersama kelas" ref={ref}>
    <div className="discuss-top"><strong>BINCANG BERSAMA · VIRTUAL LAB SAINS T1</strong><div className="discuss-top-actions"><span className="discuss-progress">{index + 1} / {slides.length}</span><button className="icon-button" aria-label="Nota guru" aria-pressed={notesOpen} title="Nota guru — skrip & soalan" onClick={() => setNotesOpen(value => !value)}><BookOpen size={20}/></button><button className="icon-button" aria-label="Skrin penuh" title="Skrin penuh" onClick={fullscreen}><Maximize2 size={20}/></button><button className="icon-button" aria-label="Tutup bincang bersama" onClick={onClose}><X size={20}/></button></div></div>
    <div className="discuss-body">
      {slide.id === 'intro' && <><span className="discuss-badge">BINCANG BERSAMA</span><h1>Adakah udara, air dan suhu yang sesuai diperlukan untuk biji benih bercambah?</h1><p className="discuss-lead">Mari kita bincang bersama: ramalan, bukti, dan sebabnya. Gunakan butang di bawah atau anak panah ←/→.</p></>}
      {slide.id === 'hypothesis' && <><span className="discuss-badge">HIPOTESIS</span><h2>Hipotesis manakah yang betul?</h2><div className="discuss-options">{hypothesisOptions.map((option, i) => <div key={option} className={`discuss-option ${revealed && i === 1 ? 'correct' : ''}`}><span className="letter">{String.fromCharCode(65 + i)}</span><span>{option}</span>{revealed && i === 1 && <strong>✓ BETUL</strong>}</div>)}</div>{revealed && <p className="discuss-lead">Biji benih memerlukan <strong>udara, air dan suhu yang sesuai</strong> — cahaya <strong>tidak</strong> diperlukan untuk bercambah.</p>}</>}
      {slide.id === 'outcome' && <><span className="discuss-badge">RAMALAN &amp; BUKTI</span><h2>Tabung manakah bercambah?</h2><div className="discuss-tubes">{demo.map(({ id, tube, result }) => <div key={id} className="discuss-tube"><b>Tabung {id}</b><TubeVisual tube={tube} day={5}/><span className={result.germination ? 'yes-text' : 'no-text'}>{result.germination ? '✓ Bercambah' : '✕ Tidak bercambah'}</span><span>{tubeReasonById[id]}</span></div>)}</div><p className="discuss-lead">Ramalan bukan untuk dihukum — yang penting kita belajar daripada bukti.</p></>}
      {slide.id === 'table' && <><span className="discuss-badge">JADUAL KEPUTUSAN</span><h2>Rekod penuh selepas 5 hari</h2><table className="discuss-table"><thead><tr><th>Tabung</th>{resultFields.map(field => <th key={field}>{resultLabels[field]}</th>)}</tr></thead><tbody>{demo.map(({ id, result }) => <tr key={id}><th>{id}</th>{resultFields.map(field => <td key={field} className={result[field] ? 'yes' : 'no'}>{result[field] ? '✓' : '✕'}</td>)}</tr>)}</tbody></table></>}
      {question && <><span className="discuss-badge">SOALAN {Number(slide.id.split('-')[1]) + 1} / {analysisQuestions.length}</span><h2>{question.question}</h2><div className="discuss-options">{question.options.map((option, j) => <div key={option} className={`discuss-option ${revealed && j === Number(question.answer) ? 'correct' : ''}`}><span className="letter">{String.fromCharCode(65 + j)}</span><span>{option}</span></div>)}</div>{revealed && <div className="discuss-answer"><strong>Jawapan: {String.fromCharCode(65 + Number(question.answer))}. {question.options[Number(question.answer)]}</strong><p>{question.explanation}</p></div>}</>}
      {slide.id === 'misconceptions' && <><span className="discuss-badge">SALAH FAHAM LAZIM</span><h2>Betulkan bersama-sama</h2><div className="discuss-misconceptions">{commonMisconceptions.map(item => <div key={item.belief} className="discuss-misconception"><p className="belief">✕ Murid kata: {item.belief}</p><p className="truth">✓ Sebenarnya: {item.truth}</p></div>)}</div></>}
      {slide.id === 'conclusion' && <><span className="discuss-badge">KESIMPULAN</span><h1>Air + Oksigen + Suhu yang sesuai<br/>= <em>PERCAMBAHAN</em></h1><p className="discuss-lead">Biji benih memerlukan udara, air dan suhu yang sesuai untuk bercambah. Tahniah semua — terima kasih kerana membincangkan bersama!</p></>}
    </div>
    {notesOpen && <div className="discuss-notes" role="note"><p><strong>Skrip cakap:</strong> {note.script}</p><p><strong>Soalan kelas:</strong> {note.questions.join(' ')}</p></div>}
    <div className="discuss-controls">
      <button className="secondary" onClick={back} disabled={index === 0 && !revealed}><ArrowLeft size={18}/>Sebelum</button>
      {slide.reveal && !revealed
        ? <button className="primary" onClick={next}><Eye size={18}/>Tunjuk jawapan</button>
        : <button className="primary" onClick={next} disabled={index === slides.length - 1}>{index === slides.length - 1 ? 'Tamat' : 'Seterusnya'}<ArrowRight size={18}/></button>}
    </div>
  </div>;
}
