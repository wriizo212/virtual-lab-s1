import type { Session } from '../domain/model';
import { computeBadges } from '../domain/badges';
export function BadgeShelf({ session }: { session: Session }) {
  const badges = computeBadges(session);
  const earned = badges.filter(badge => badge.earned).length;
  return <div className="badge-shelf" aria-label="Lencana penyiasatan"><span>LENCANA · {earned} / {badges.length}</span><ul>{badges.map(badge => <li key={badge.id} className={badge.earned ? 'earned' : 'locked'} title={badge.description}><span className="badge-icon" aria-hidden="true">{badge.icon}</span><span><strong>{badge.label}</strong><small>{badge.earned ? 'Diperoleh' : badge.description}</small></span></li>)}</ul></div>;
}
