import { useDraggable, useDroppable } from '@dnd-kit/core';
import { useId } from 'react';
import { GripVertical, Check, Circle } from 'lucide-react';
import type { Material, TubeState } from '../domain/model';
import { materialNames } from '../domain/experiment';
import { germinationStage } from '../domain/simulation';
import { SeedDrawing } from './GerminationAnimation';
export function TubeVisual({ tube, day, revealPaper = false }: { tube: TubeState; day?: number; revealPaper?: boolean }) {
  const clipId = useId().replace(/:/g, '');
  const has = (material: Material) => tube.materials.includes(material); const water = has('water') || has('cooledBoiledWater');
  return <svg className="tube-visual" viewBox="0 0 120 210" role="img" aria-label={`Tabung ${tube.id}: ${tube.materials.map(m => materialNames[m]).join(', ') || 'kosong'}, ${tube.location === 'fridge' ? 'dalam peti sejuk' : 'di meja'}`}>
    <defs><clipPath id={clipId}><path d="M34 15H86V169Q86 198 60 198Q34 198 34 169Z"/></clipPath></defs>
    <g clipPath={`url(#${clipId})`}><rect x="34" y="15" width="52" height="185" fill="#f9ffff"/>
      {water && <rect className="water-fill" x="34" y="85" width="52" height="116" fill={has('cooledBoiledWater') ? '#b7dce5' : '#c0e6f0'}/>}
      {(has('wetCotton') || has('dryCotton')) && <g className="cotton-fill"><path d="M34 154Q40 139 49 148Q55 135 65 145Q77 135 86 152V198H34Z" fill={has('wetCotton') ? '#c2e1e4' : '#eeede6'} stroke={has('wetCotton') ? '#91bac1' : '#c9c7bc'}/><path d="M42 163Q50 157 58 163M58 180Q69 171 79 180M37 186Q46 178 55 185" fill="none" stroke={has('wetCotton') ? '#8db7bb' : '#c9c7bc'}/>{has('wetCotton') && <path d="M76 151Q67 163 76 166Q85 163 76 151Z" fill="#6daabb"/>}</g>}
      {has('seed') && (day === undefined ? <g><ellipse cx="51" cy={water ? 174 : 145} rx="8" ry="11" transform={`rotate(-25 51 ${water ? 174 : 145})`} fill="#b4824f" stroke="#88582f"/><ellipse cx="69" cy={water ? 180 : 150} rx="8" ry="10" fill="#c29461" stroke="#88582f"/><path d={water ? 'M51 168Q47 174 52 180M69 174Q65 180 69 185' : 'M51 139Q47 145 52 151M69 144Q65 150 69 155'} fill="none" stroke="#ead6b5" strokeWidth="1.5"/></g> : <g data-stage={germinationStage(tube, day)}>{[29, 49].map(x => <g key={`${day}-${x}`} transform={`translate(${x} ${water ? 147 : 115}) scale(.34)`}><SeedDrawing stage={germinationStage(tube, day)}/></g>)}</g>)}
      {has('oil') && water && <rect className="oil-layer" x="34" y="72" width="52" height="13" fill="#e7c56e"/>}
      {has('blackPaper') && !revealPaper && <g><rect x="34" y="122" width="52" height="77" fill="#353d3c"/><text x="60" y="162" textAnchor="middle" fill="#dbe4df" fontSize="9">KERTAS</text><text x="60" y="175" textAnchor="middle" fill="#dbe4df" fontSize="9">HITAM</text></g>}
    </g><path d="M34 15V169Q34 198 60 198Q86 198 86 169V15" fill="none" stroke="#779ca0" strokeWidth="3"/><path d="M30 15H90" stroke="#779ca0" strokeWidth="4" strokeLinecap="round"/><path d="M39 24V117" stroke="#fff" strokeWidth="4" opacity=".8"/>
  </svg>;
}
export function ExperimentTube({ tube, selected, onSelect, onDropTap }: { tube: TubeState; selected: boolean; onSelect: () => void; onDropTap: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: `tube-${tube.id}`, data: { kind: 'tube', tubeId: tube.id } });
  const { setNodeRef: setDragRef, listeners, attributes, isDragging } = useDraggable({ id: `move-${tube.id}`, data: { kind: 'tube', tubeId: tube.id } });
  return <article ref={setNodeRef} className={`tube-card ${selected ? 'tube-selected' : ''} ${isOver ? 'drop-over' : ''} ${isDragging ? 'drag-source' : ''}`} data-testid={`tube-${tube.id}`}><button className="tube-select" onClick={() => { onSelect(); onDropTap(); }} aria-label={`Pilih Tabung ${tube.id}`} aria-pressed={selected}><span className="tube-heading">Tabung {tube.id}</span><TubeVisual tube={tube}/><span className="tube-status">{tube.validated ? <><Check size={15}/> Lengkap</> : <><Circle size={14}/> Belum lengkap</>}</span><span className={`location-tag ${tube.location === 'fridge' ? 'cold' : ''}`}>{tube.placementConfirmed ? tube.location === 'fridge' ? '❄ 5°C · Peti sejuk' : '25°C · Suhu bilik' : 'Lokasi belum disahkan'}</span></button><button className="tube-handle" ref={setDragRef} {...attributes} {...listeners} aria-label={`Seret Tabung ${tube.id}`}><GripVertical size={16}/> Seret tabung</button></article>;
}


