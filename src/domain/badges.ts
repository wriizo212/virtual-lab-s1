import type { Session } from './model';
import { analysisQuestions, formatLabDate, mainScore, pbdSuggestion } from './learning';

// Pupil badges (lencana) and the printable "Sijil Penyiasat Muda".
export interface LabBadge { id: string; icon: string; label: string; description: string; earned: boolean }

export function computeBadges(session: Session): LabBadge[] {
  const minutes = session.completedAt ? (Date.parse(session.completedAt) - Date.parse(session.createdAt)) / 60000 : Infinity;
  return [
    { id: 'penyiasat', icon: '🌱', label: 'Penyiasat Muda', description: 'Menamatkan penyiasatan sepenuhnya.', earned: !!session.completedAt },
    { id: 'kilat', icon: '⚡', label: 'Kilat', description: 'Selesai dalam masa 15 minit atau kurang.', earned: minutes <= 15 },
    { id: 'tepat', icon: '🎯', label: 'Tepat Sasar', description: 'Semua soalan analisis betul pada cubaan pertama.', earned: analysisQuestions.every(q => session.analysisFirstAnswers?.[q.id] === q.answer) },
    { id: 'mata', icon: '🔍', label: 'Mata Helang', description: 'Jadual keputusan 16 / 16 tepat.', earned: session.resultsCheck?.correct === 16 },
    { id: 'peneroka', icon: '🧭', label: 'Peneroka', description: 'Menjelaskan cabaran faktor dengan lengkap.', earned: (session.challengeRuns ?? []).some(run => run.explained) },
    { id: 'hemat', icon: '💡', label: 'Bebas Petunjuk', description: 'Selesai tanpa menggunakan sebarang petunjuk.', earned: session.hintsUsed === 0 && !!session.completedAt },
  ];
}

const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function certificateHtml(session: Session): string {
  const badges = computeBadges(session).filter(badge => badge.earned);
  const score = mainScore(session);
  const pbd = pbdSuggestion(session);
  const who = session.mode === 'group' ? `Kumpulan · ${session.members.map(member => member.name).join(', ')}` : 'Individu';
  return `<!doctype html><html lang="ms"><head><meta charset="utf-8"><title>Sijil Penyiasat Muda — ${escapeHtml(session.name)}</title><style>
  body{margin:0;background:#eef3ea;color:#173c38;font-family:Georgia,'Times New Roman',serif;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}
  .cert{background:#fff;border:10px double #2f8f5b;border-radius:18px;padding:44px 54px;max-width:820px;width:100%;text-align:center}
  .top{letter-spacing:4px;font-size:11pt;color:#547468;font-family:Arial,sans-serif}
  h1{font-size:32pt;margin:14px 0 4px;color:#1f5c3c}
  .subtitle{font-size:13.5pt;color:#33584a;margin:0 0 20px}
  .name{font-size:25pt;font-weight:700;border-bottom:2px solid #cfe3cd;display:inline-block;padding:0 34px 8px;margin:6px 0}
  .meta{font-family:Arial,sans-serif;font-size:11.5pt;color:#4a6a5a;margin:6px 0}
  .score{font-family:Arial,sans-serif;margin:16px 0 4px;font-size:13pt}
  .badges{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:16px 0}
  .badge{border:1px solid #cfe3cd;border-radius:999px;padding:6px 14px;font-family:Arial,sans-serif;font-size:10.5pt;font-weight:700;color:#2c5a36;background:#f2f8f1}
  .foot{display:flex;justify-content:space-between;gap:20px;margin-top:36px;font-family:Arial,sans-serif;font-size:10pt;color:#5d7168}
  .line{border-top:1px solid #9db3a5;padding-top:6px;flex:1}
  @page{size:A4 landscape;margin:10mm}
  @media print{body{background:#fff;padding:0}}
  </style></head><body><main class="cert"><div class="top">VIRTUAL LAB SAINS TINGKATAN 1</div><h1>SIJIL PENYIASAT MUDA</h1><p class="subtitle">Syarat Percambahan Biji Benih</p><p class="meta">Dengan ini disahkan bahawa</p><div class="name">${escapeHtml(session.name)}</div><p class="meta">${escapeHtml(who)} · ${escapeHtml(session.className)}</p><p class="score">telah menyempurnakan penyiasatan dengan <strong>${score} / 30 markah</strong>${session.scores.bonus ? ` (+${session.scores.bonus} bonus)` : ''} · Cadangan ${pbd.tp}</p><div class="badges">${badges.map(badge => `<span class="badge">${badge.icon} ${escapeHtml(badge.label)}</span>`).join('') || '<span class="badge">🌱 Penyiasat Muda</span>'}</div><div class="foot"><span class="line">Guru Sains</span><span class="line">${escapeHtml(formatLabDate(session.completedAt ?? session.createdAt))}</span><span class="line">Kod: ${escapeHtml(session.resultCode ?? '—')}</span></div></main></body></html>`;
}
