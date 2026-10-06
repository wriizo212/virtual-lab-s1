import { useState } from 'react';
import { DndContext, DragOverlay, MouseSensor, TouchSensor, KeyboardSensor, useSensor, useSensors, pointerWithin, rectIntersection, type DragEndEvent, type CollisionDetection } from '@dnd-kit/core';
import { Check, ArrowRight, Hand, UserRound, X } from 'lucide-react';
import { useLab } from '../state/LabContext';
import type { Material, TubeId, TubeState } from '../domain/model';
import { editMaterial, getHint, materialNames, placeTube, setupMember, tubeIds, updateTube, validateTube } from '../domain/experiment';
import { ProgressBar } from '../components/ProgressBar';
import { ExperimentTube, TubeVisual } from '../components/ExperimentTube';
import { MaterialTray } from '../components/MaterialTray';
import { LocationZones } from '../components/LocationZones';
import { SetupInstructions } from '../components/SetupInstructions';
const collisionDetection: CollisionDetection = args => {
  const permitted = args.droppableContainers.filter(container => args.active.data.current?.kind === 'material' ? container.data.current?.kind === 'tube' : container.data.current?.kind === 'location');
  const filtered = { ...args, droppableContainers: permitted }; const collisions = pointerWithin(filtered);
  return collisions.length ? collisions : rectIntersection(filtered);
};
export function Setup() {
  const { state, updateSession } = useLab(); const session = state.session!; const id = session.setupTube ?? 'A'; const tube = session.tubes[id];
  const [selected, setSelected] = useState<Material | null>(null);
  const [active, setActive] = useState<{ kind: string; material?: Material; tubeId?: TubeId } | null>(null);
  const [message, setMessage] = useState('Pilih tabung untuk melihat protokol. Seret bahan atau gunakan tap.');
  const [failed, setFailed] = useState<TubeId | null>(null); const [confirmClear, setConfirmClear] = useState(false);
  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 7 } }), useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }), useSensor(KeyboardSensor));
  const member = session.mode === 'group' ? setupMember(session, id) : undefined; const completeCount = tubeIds.filter(tubeId => session.tubes[tubeId].validated).length;
  function putMaterial(target: TubeId, material: Material, remove = false) {
    const result = editMaterial(session.tubes[target], material, remove);
    if (result.changed) updateSession({ ...updateTube(session, result.tube), setupTube: target });
    setConfirmClear(false);
    setMessage(result.message); setSelected(null); setFailed(null);
  }
  function place(target: TubeId, location: TubeState['location']) {
    updateSession({ ...updateTube(session, placeTube(session.tubes[target], location)), setupTube: target });
    setMessage(`Tabung ${target} ${location === 'fridge' ? 'dipindahkan ke dalam peti sejuk. Suhu: 5°C.' : 'diletakkan pada suhu bilik. Suhu: 25°C.'}`); setFailed(null); setConfirmClear(false);
  }
  function onDragEnd(event: DragEndEvent) {
    const source = event.active.data.current; const target = event.over?.data.current;
    setActive(null);
    if (!target) { setMessage('Item dikembalikan. Cuba lepaskan tepat pada sasaran.'); return; }
    if (source?.kind === 'material' && target.kind === 'tube') putMaterial(target.tubeId, source.material);
    else if (source?.kind === 'tube' && target.kind === 'location') place(source.tubeId, target.location);
  }
  function check() {
    const checked = validateTube(tube); updateSession(updateTube(session, checked)); setFailed(checked.validated ? null : id);
    setMessage(checked.validated ? `✓ Tabung ${id} lengkap. Teruskan menyediakan tabung lain.` : `Tabung ${id} perlu diperiksa semula.`);
  }
  return <><ProgressBar/><DndContext autoScroll={false} sensors={sensors} collisionDetection={collisionDetection} onDragStart={event => { setSelected(null); setActive(event.active.data.current as typeof active); setMessage('Seret ke zon sasaran, kemudian lepaskan.'); }} onDragEnd={onDragEnd} onDragCancel={() => { setActive(null); setMessage('Seretan dibatalkan.'); }} accessibility={{ screenReaderInstructions: { draggable: 'Tekan Space untuk mengangkat bahan atau tabung. Gunakan anak panah untuk bergerak. Tekan Space untuk melepaskan, atau Escape untuk membatalkan. Anda juga boleh memilih bahan dengan tap dan kemudian memilih tabung.' }, announcements: { onDragStart: () => 'Item diangkat. Gerakkan ke sasaran.', onDragOver: ({ over }) => over ? `Di atas ${over.id.toString().replace('tube-', 'Tabung ')}.` : 'Di luar sasaran.', onDragEnd: ({ over }) => over ? 'Item dilepaskan pada sasaran.' : 'Tiada sasaran. Item dikembalikan.', onDragCancel: () => 'Seretan dibatalkan.' } }}>
    <section className="lab-workspace"><div className="lab-title"><div><div className="eyebrow">03 / PENYEDIAAN</div><h1>Meja makmal anda.</h1><p className="muted">Sediakan setiap tabung mengikut protokol. Kemudian semak penyediaan anda.</p></div><span className="lab-counter"><Check size={18}/>{completeCount} / 4 lengkap</span></div>
    {member && <div className="turn-banner"><UserRound size={20}/><div><strong>Giliran: {member.name}</strong><span>Pengendali bahan untuk Tabung {id}. Ahli lain membantu menyemak protokol. Peranan asal: {member.roles.join(' · ')}.</span></div></div>}
    {session.experimentStartedAt && <div className="setup-restart-notice">Mengubah bahan atau lokasi akan memulakan semula eksperimen dan mengosongkan rekod pemerhatian serta keputusan lama. Hipotesis dan ramalan dikekalkan.</div>}<div className="lab-grid"><div className="bench-area"><div className="bench-heading"><span>MEJA EKSPERIMEN</span><span>Jenis biji benih yang sama untuk semua tabung</span></div><div className="tube-grid">{tubeIds.map(tubeId => <ExperimentTube key={tubeId} tube={session.tubes[tubeId]} selected={id === tubeId} onSelect={() => { updateSession({ ...session, setupTube: tubeId }); setFailed(null); setConfirmClear(false); }} onDropTap={() => { if (selected) putMaterial(tubeId, selected); }}/>)}</div><LocationZones tubes={session.tubes} selectedTube={id} onPlace={location => place(id, location)}/><div className="lab-feedback" role="status" aria-live="polite"><Hand size={18}/><span>{selected ? `${materialNames[selected]} dipilih. Tap tabung sasaran.` : message}</span>{selected && <button className="icon-button" aria-label="Batal pilihan bahan" onClick={() => setSelected(null)}><X size={18}/></button>}</div></div>
    <div><SetupInstructions tube={tube} hintsEnabled={state.settings.hintsEnabled} onRemove={material => putMaterial(id, material, true)} onCheck={check} onHint={() => { const hint = getHint(tube); updateSession({ ...updateTube(session, hint.tube), hintsUsed: session.hintsUsed + (hint.counted ? 1 : 0) }); }} onClear={() => setConfirmClear(true)} failed={failed === id} onReview={() => { setFailed(null); setMessage(`Periksa kandungan, lokasi dan protokol Tabung ${id}.`); }}/>{confirmClear && <div className="clear-confirm" role="alert"><p>Kosongkan Tabung {id}? Bilangan petunjuk dan cubaan akan dikekalkan.</p><button className="secondary" onClick={() => setConfirmClear(false)}>Batal</button><button className="primary" onClick={() => { updateSession(updateTube(session, { ...tube, materials: [], location: 'bench', temperatureC: 25, waterAvailable: false, oxygenAvailable: true, placementConfirmed: false, validated: false })); setConfirmClear(false); setFailed(null); setMessage(`Tabung ${id} dikosongkan.`); }}>Ya, kosongkan</button></div>}</div></div>
    <MaterialTray selected={selected} onSelect={material => setSelected(selected === material ? null : material)}/><div className="lab-actions"><span className="muted">{completeCount < 4 ? 'Semua tabung perlu lengkap sebelum meneruskan.' : '✓ Keempat-empat tabung telah disediakan.'}</span><button className="primary" disabled={completeCount < 4} onClick={() => updateSession({ ...session, screen: 'setupComplete' })}>Selesai penyediaan <ArrowRight size={18}/></button></div></section>
    <DragOverlay dropAnimation={null}>{active && <div className="drag-overlay">{active.kind === 'material' ? materialNames[active.material!] : <><strong>Tabung {active.tubeId}</strong><TubeVisual tube={session.tubes[active.tubeId!]}/></>}</div>}</DragOverlay>
  </DndContext></>;
}




