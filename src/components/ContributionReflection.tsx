import { UsersRound,Check } from 'lucide-react';
import { contributionItems,toggleContribution } from '../domain/learning';
import { useLab } from '../state/LabContext';
export function ContributionReflection() {
  const {state,updateSession}=useLab();const session=state.session!;
  return <div className="contribution-reflection"><div className="reflection-title"><UsersRound size={24}/><div><h2>Setiap ahli, satu refleksi.</h2><p>Ahli bergilir menandakan penglibatan sendiri. Tiada markah ditolak untuk pilihan ini.</p></div></div><div className="reflection-members">{session.members.map(member=><fieldset key={member.id}><legend>{member.name}</legend><span>Saya telah mengambil bahagian dalam…</span>{contributionItems.map(item=><label key={item}><input type="checkbox" checked={member.contributions.includes(item)} onChange={()=>updateSession(toggleContribution(session,member.id,item))}/>{item}</label>)}</fieldset>)}</div><div className="actions"><span className="small muted">Refleksi ini untuk pembelajaran, bukan hukuman.</span><button className="primary" onClick={()=>updateSession({...session,reflectionReviewed:true})}><Check size={18}/>Selesai refleksi</button></div></div>;
}
