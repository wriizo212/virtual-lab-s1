import { useDraggable } from '@dnd-kit/core';
import { Sprout, Droplets, Cloud, Waves, CookingPot, Square, GripVertical } from 'lucide-react';
import type { Material } from '../domain/model';
import { materialNames } from '../domain/experiment';
const icons = { seed: Sprout, wetCotton: Droplets, dryCotton: Cloud, water: Waves, cooledBoiledWater: CookingPot, oil: Droplets, blackPaper: Square };
export const materialIds = Object.keys(materialNames) as Material[];
export function MaterialItem({ material, selected, onSelect }: { material: Material; selected: boolean; onSelect: () => void }) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id: `material-${material}`, data: { kind: 'material', material } }); const Icon = icons[material];
  return <div className={`material-item ${selected ? 'selected' : ''} ${isDragging ? 'drag-source' : ''}`}><button className="material-tap" onClick={onSelect} aria-pressed={selected} aria-label={`Pilih bahan ${materialNames[material]}`}><span className={`material-icon ${material}`}><Icon size={22}/></span><span>{materialNames[material]}</span></button><button className="material-handle" ref={setNodeRef} {...attributes} {...listeners} aria-label={`Seret ${materialNames[material]}`}><GripVertical size={17}/><span>Seret</span></button></div>;
}
export function MaterialTray({ selected, onSelect }: { selected: Material | null; onSelect: (material: Material) => void }) {
  return <section className="material-tray" aria-label="Tray bahan maya"><div className="tray-heading"><h2>Bahan maya</h2><p>Seret pemegang ke tabung, atau tap bahan kemudian tap tabung.</p></div><div className="materials-grid">{materialIds.map(material => <MaterialItem key={material} material={material} selected={selected === material} onSelect={() => onSelect(material)}/>)}</div></section>;
}
