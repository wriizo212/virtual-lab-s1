import { useState } from 'react';
import { ArrowRight, Check, Search } from 'lucide-react';
import { useLab } from '../state/LabContext';
import type { TubeId } from '../domain/model';
import { tubeIds } from '../domain/experiment';
import { finishObservations, observationsComplete } from '../domain/simulation';
import { ProgressBar } from '../components/ProgressBar';
import { GroupTurn } from '../components/GroupTurn';
import { TubeVisual } from '../components/ExperimentTube';
import { ObservationModal } from '../components/ObservationModal';
export function Observation() {
  const { state, updateSession } = useLab(); const session = state.session!; const [zoom, setZoom] = useState<TubeId | null>(null);
  const recorded = tubeIds.filter(id => typeof session.observations[id] === 'boolean').length;
  return <><ProgressBar/><section className="panel observation-panel"><div className="eyebrow">05 / PEMERHATIAN</div><h1>Lihat dekat. Catat dengan teliti.</h1><p className="muted">Tap setiap tabung untuk zoom. Perhatikan biji benih dan rekodkan pemerhatian Hari 5.</p><GroupTurn role="Pemerhati" instruction="Ajak setiap ahli memerhatikan biji benih. Ahli bergilir mencatat pemerhatian setiap tabung."/><div className="observation-grid">{tubeIds.map(id => <button className="observation-card" key={id} onClick={() => setZoom(id)} aria-label={`Zoom Tabung ${id}`} data-testid={`observe-${id}`}><span className="observation-card-title">Tabung {id}<Search size={19}/></span><TubeVisual tube={session.tubes[id]} day={5}/><span className="observed-status">{typeof session.observations[id] === 'boolean' ? <><Check size={16}/> Direkod: {session.observations[id] ? 'Bercambah' : 'Tidak bercambah'}</> : <><Search size={16}/> Belum diperhatikan</>}</span></button>)}</div><div className="actions"><span className="small muted">{recorded} / 4 pemerhatian direkodkan</span><button className="primary" disabled={!observationsComplete(session)} onClick={() => updateSession(finishObservations(session))}>Rekod jadual keputusan <ArrowRight size={18}/></button></div></section>{zoom && <ObservationModal key={zoom} id={zoom} onClose={() => setZoom(null)}/>}</>;
}
