import { germinationStage } from '../domain/simulation';
import type { TubeState } from '../domain/model';
const descriptions = ['Testa biji benih masih utuh. Tiada radikel kelihatan.', 'Biji benih kelihatan membengkak.', 'Testa pecah dan radikel pendek kelihatan.', 'Radikel kelihatan lebih panjang.', 'Radikel memanjang dan pucuk muda mula kelihatan.'];
export function SeedDrawing({ stage }: { stage: number }) {
  const root = ['','', 'M59 116Q57 126 61 134', 'M59 116Q53 129 62 142Q67 150 60 158', 'M59 116Q52 130 63 145Q72 163 60 183'];
  return <g>
    {stage >= 2 && <><path className="seed-radicle" d={root[stage]} fill="none" stroke="#89946a" strokeWidth={stage === 2 ? 6 : 7} strokeLinecap="round"/><path className="seed-radicle" d={root[stage]} fill="none" stroke="#f2eed6" strokeWidth={stage === 2 ? 4 : 5} strokeLinecap="round"/></>}
    {stage === 4 && <><path className="seed-plumule" d="M62 96Q68 79 61 64" fill="none" stroke="#839c65" strokeWidth="4" strokeLinecap="round"/><path d="M62 66Q49 63 51 54Q62 54 62 66" fill="#9bae79"/></>}
    <g className="seed-testa" style={{ transform: `scale(${stage > 0 ? 1.1 : 1})`, transformOrigin: '60px 95px' }}><ellipse cx="59" cy="95" rx="23" ry="24" fill="#c39765" stroke="#906139" strokeWidth="1.5"/><path d={stage >= 2 ? 'M61 73L56 84L63 91L57 101L62 115' : 'M61 74Q52 94 62 115'} stroke={stage >= 2 ? '#f4e4bb' : '#ead1a7'} strokeWidth={stage >= 2 ? 4 : 2} fill="none"/></g>
  </g>;
}
export function GerminationAnimation({ tube, day, closeup = false }: { tube: TubeState; day: number; closeup?: boolean }) {
  const stage = germinationStage(tube, day);
  return <svg className={`germination-art ${closeup ? 'closeup' : ''}`} viewBox="0 0 120 210" role="img" aria-label={`Hari ${day}. ${descriptions[stage]}`} data-stage={stage}>
    {closeup && <ellipse cx="60" cy="190" rx="45" ry="6" fill="#dce6d5"/>}
    <SeedDrawing key={day} stage={stage}/>
  </svg>;
}
