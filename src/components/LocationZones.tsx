import { useDroppable } from '@dnd-kit/core';
import { Snowflake, Thermometer } from 'lucide-react';
import type { Session, TubeState } from '../domain/model';
import { tubeIds } from '../domain/experiment';
function LocationZone({ location, onPlace, selectedTube, occupants }: { location: TubeState['location']; onPlace: () => void; selectedTube: string; occupants: string[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: location, data: { kind: 'location', location } }); const fridge = location === 'fridge'; const Icon = fridge ? Snowflake : Thermometer;
  return <button ref={setNodeRef} className={`location-zone ${fridge ? 'fridge-zone' : ''} ${isOver ? 'drop-over' : ''}`} onClick={onPlace} aria-label={`Letakkan Tabung ${selectedTube} ${fridge ? 'dalam peti sejuk' : 'pada suhu bilik'}`}><Icon size={27}/><span><strong>{fridge ? 'Peti sejuk' : 'Suhu bilik'}</strong><small>{fridge ? '5°C' : '25°C'} · Seret tabung ke sini</small>{occupants.length > 0 && <span className="zone-occupants">Tabung {occupants.join(', ')} {fridge ? 'di dalam' : 'di meja'}</span>}</span></button>;
}
export function LocationZones({ selectedTube, onPlace, tubes }: { selectedTube: string; onPlace: (location: TubeState['location']) => void; tubes: Session['tubes'] }) {
  const occupants = (location: TubeState['location']) => tubeIds.filter(id => tubes[id].location === location && tubes[id].placementConfirmed);
  return <div className="location-zones"><LocationZone location="bench" selectedTube={selectedTube} occupants={occupants('bench')} onPlace={() => onPlace('bench')}/><LocationZone location="fridge" selectedTube={selectedTube} occupants={occupants('fridge')} onPlace={() => onPlace('fridge')}/></div>;
}
