import { UserRound } from 'lucide-react';
import { useLab } from '../state/LabContext';
export function GroupTurn({ role, instruction }: { role: string; instruction: string }) {
  const { state } = useLab(); const session = state.session;
  if (session?.mode !== 'group') return null;
  const member = session.members.find(person => person.roles.includes(role));
  if (!member) return null;
  return <div className="turn-banner"><UserRound size={20}/><div><strong>Giliran: {member.name} · {role}</strong><span>{instruction}</span></div></div>;
}
