import { useState } from 'react';
import { DndContext,DragOverlay,MouseSensor,TouchSensor,KeyboardSensor,useSensor,useSensors,useDraggable,useDroppable,type DragEndEvent } from '@dnd-kit/core';
import { GripVertical,X } from 'lucide-react';
import { conclusionSlots,conclusionWords } from '../domain/learning';
import type { Session } from '../domain/model';
function WordChip({ word,id,selected,onSelect }: { word:string;id:string;selected:boolean;onSelect:()=>void }) {
  const {setNodeRef,attributes,listeners,isDragging}=useDraggable({id,data:{word}});
  return <div className={`conclusion-word ${selected?'selected':''} ${isDragging?'drag-source':''}`}><button aria-label={`Pilih perkataan ${word}`} aria-pressed={selected} onClick={onSelect}>{word}</button><button ref={setNodeRef} {...attributes} {...listeners} className="word-drag-handle" aria-label={`Seret perkataan ${word}`}><GripVertical size={18}/></button></div>;
}
function WordSlot({ slot,word,selected,onTap,onSelect,onRemove }: {slot:number;word:string;selected:string|null;onTap:()=>void;onSelect:()=>void;onRemove:()=>void}) {
  const {setNodeRef,isOver}=useDroppable({id:`word-slot-${slot}`,data:{slot}});
  return <div ref={setNodeRef} className={`word-slot ${isOver?'drop-over':''}`} data-testid={`word-slot-${slot}`}>
    {word?<><WordChip word={word} id={`placed-${word}`} selected={selected===word} onSelect={()=>selected&&selected!==word?onTap():onSelect()}/><button className="word-remove" aria-label={`Kosongkan ruang ${slot+1}`} onClick={onRemove}><X size={16}/></button></>:<button className="empty-word-slot" aria-label={`Isi ruang ${slot+1}`} onClick={onTap}>Ruang {slot+1}</button>}
  </div>;
}
export function ConclusionBuilder({session,onPlace,onRemove}:{session:Session;onPlace:(word:string,slot:number)=>void;onRemove:(slot:number)=>void}) {
  const [selected,setSelected]=useState<string|null>(null); const [dragged,setDragged]=useState<string|null>(null);
  const sensors=useSensors(useSensor(MouseSensor,{activationConstraint:{distance:7}}),useSensor(TouchSensor,{activationConstraint:{delay:180,tolerance:8}}),useSensor(KeyboardSensor));
  const slots=conclusionSlots(session); const place=(word:string,slot:number)=>{onPlace(word,slot);setSelected(null);};
  function end(event:DragEndEvent) {const slot=event.over?.data.current?.slot; const word=event.active.data.current?.word; if(typeof slot==='number'&&typeof word==='string')place(word,slot);setDragged(null);}
  return <DndContext sensors={sensors} autoScroll={false} onDragStart={event=>{setDragged(event.active.data.current?.word);setSelected(null);}} onDragEnd={end} onDragCancel={()=>setDragged(null)} accessibility={{screenReaderInstructions:{draggable:'Tekan Space untuk mengangkat perkataan. Gerakkan dengan anak panah, Space untuk melepaskan, Escape untuk membatalkan. Anda juga boleh memilih perkataan kemudian menekan ruang jawapan.'},announcements:{onDragStart:()=> 'Perkataan diangkat.',onDragOver:({over})=>over?`Di atas ruang ${Number(over.data.current?.slot)+1}.`:'Di luar ruang jawapan.',onDragEnd:({over})=>over?'Perkataan dilepaskan.':'Seretan dikembalikan.',onDragCancel:()=> 'Seretan dibatalkan.'}}}>
    <div className="conclusion-sentence"><span>Biji benih memerlukan</span><div className="sentence-slots">{slots.map((word,slot)=><div className="sentence-fragment" key={slot}>{slot===2&&<span>dan</span>}<WordSlot slot={slot} word={word} selected={selected} onTap={()=>selected&&place(selected,slot)} onSelect={()=>setSelected(selected===word?null:word)} onRemove={()=>{onRemove(slot);setSelected(null);}}/>{slot===0&&<span>,</span>}</div>)}</div><span>yang sesuai untuk bercambah.</span></div><div className="conclusion-word-bank">{conclusionWords.filter(word=>!slots.includes(word)).map(word=><WordChip key={word} word={word} id={`bank-${word}`} selected={selected===word} onSelect={()=>setSelected(selected===word?null:word)}/>)}</div><p className="builder-instruction" role="status">{selected?`${selected} dipilih. Tap ruang jawapan untuk meletakkannya.`:'Seret perkataan ke ruang jawapan, atau pilih perkataan kemudian tap ruang.'}</p><DragOverlay dropAnimation={null}>{dragged&&<div className="drag-overlay">{dragged}</div>}</DragOverlay>
  </DndContext>;
}
