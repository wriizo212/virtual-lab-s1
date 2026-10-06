import type { Session } from '../domain/model';
import { mainScore,scoreSections } from '../domain/learning';
export function ScoreBreakdown({session}:{session:Session}) {
  return <div className="score-breakdown"><div className="total-score"><span>{session.mode==='group'?'Skor kumpulan':'Skor pembelajaran'}</span><div><strong>{mainScore(session)}</strong><span>/ 30</span></div><p>{session.scores.bonus?`Bonus cabaran: +${session.scores.bonus} (di luar 30)`:'Cabaran tidak menjejaskan markah utama.'}</p></div><dl className="section-scores">{scoreSections.map(section=><div key={section.key}><dt>{section.label}</dt><dd>{session.scores[section.key]} / {section.max}</dd></div>)}</dl></div>;
}
