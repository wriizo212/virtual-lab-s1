import { useCallback, useState } from 'react';
import { Check, ScanEye } from 'lucide-react';
import type { TubeId } from '../domain/model';
import { useLab } from '../state/LabContext';
import { recordObservation } from '../domain/simulation';
import { tubeIds } from '../domain/experiment';
import { GerminationAnimation } from './GerminationAnimation';
import { FocusModal } from './FocusModal';
export function ObservationModal({ id, onClose }: { id: TubeId; onClose: () => void }) {
  const { state, updateSession } = useLab(); const session = state.session!; const tube = session.tubes[id];
  const [revealed, setRevealed] = useState(!tube.materials.includes('blackPaper'));
  const close = useCallback(onClose, [onClose]);
  const first = Math.max(0, session.members.findIndex(member => member.roles.includes('Pemerhati')));
  const member = session.mode === 'group' ? session.members[(first + tubeIds.indexOf(id)) % session.members.length] : undefined;
  return <FocusModal title={`Pemerhatian Tabung ${id}`} onClose={close}><div className="eyebrow">HARI 5 / PEMERHATIAN DEKAT</div><h2>Tabung {id}</h2>{member && <p className="modal-turn">Giliran: <strong>{member.name}</strong>. Bincangkan apa yang kelihatan bersama kumpulan.</p>}<div className="seed-closeup">{revealed ? <GerminationAnimation tube={tube} day={5} closeup/> : <div className="paper-cover"><ScanEye size={30}/><strong>Kertas hitam menutupi biji benih.</strong><button className="secondary" onClick={() => setRevealed(true)}>Buka balutan maya</button></div>}</div>{tube.materials.includes('blackPaper') && revealed && <p className="small muted">Balutan dibuka untuk pemerhatian selepas Hari 5.</p>}<h3 className="observation-question">Apakah pemerhatian anda?</h3><div className="observation-choices">{[true, false].map(value => <button key={String(value)} disabled={!revealed} className={session.observations[id] === value ? 'primary' : 'secondary'} aria-pressed={session.observations[id] === value} onClick={() => updateSession(recordObservation(session, id, value))}>{value ? 'Bercambah' : 'Tidak bercambah'}</button>)}</div><button className="primary save-observation" disabled={!revealed || typeof session.observations[id] !== 'boolean'} onClick={onClose}><Check size={18}/> Simpan pemerhatian</button></FocusModal>;
}
