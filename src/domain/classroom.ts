import type { ClassRecord, Session } from './model';
import { formatLabDate, mainScore, pbdSuggestion } from './learning';

// Class share codes let a pupil hand their finished result to the teacher
// offline: the code embeds a compact snapshot, the teacher pastes it into
// Teacher Mode. No backend and no student session data are involved.
export const SHARE_CODE_PREFIX = 'SCI1-KELAS-';
const SHARE_CODE_PATTERN = /^SCI1-KELAS-([A-Za-z0-9_-]+)\.([0-9a-z]{2})$/;
const SHARE_CODE_TOKEN = /SCI1-KELAS-[A-Za-z0-9_-]+\.[0-9a-z]{2}/g;
const VERSION = '1';

function checksum(payload: string): string {
  let total = 7;
  for (const char of payload) total += char.codePointAt(0) ?? 0;
  return (total % 1296).toString(36).padStart(2, '0');
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(token: string): string | null {
  try {
    const padded = token.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (token.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch { return null; }
}

export function encodeShareCode(session: Session): string {
  const clean = (value: string) => value.replace(/\|/g, ' ').trim();
  const completed = session.completedAt ?? session.createdAt;
  const payload = [
    VERSION,
    clean(session.className),
    clean(session.name),
    session.mode === 'group' ? 'G' : 'I',
    String(mainScore(session)),
    String(session.scores.bonus),
    pbdSuggestion(session).tp.replace(/[^0-9]/g, ''),
    String(session.mode === 'group' ? session.members.length : 0),
    String(Math.floor(new Date(completed).getTime() / 1000)),
  ].join('|');
  return `${SHARE_CODE_PREFIX}${toBase64Url(payload)}.${checksum(payload)}`;
}

export function decodeShareCode(raw: string): ClassRecord | null {
  const match = raw.trim().match(SHARE_CODE_PATTERN);
  if (!match) return null;
  const payload = fromBase64Url(match[1]);
  if (!payload || checksum(payload) !== match[2]) return null;
  const parts = payload.split('|');
  if (parts.length !== 9 || parts[0] !== VERSION) return null;
  const [className, name, modeToken, scoreText, bonusText, tpText, membersText, epochText] = parts.slice(1);
  const score = Number(scoreText), bonus = Number(bonusText), members = Number(membersText), epoch = Number(epochText);
  if (!className || !name) return null;
  if (!Number.isFinite(score) || score < 0 || score > 30) return null;
  if (![0, 2].includes(bonus)) return null;
  if (!['3', '4', '5'].includes(tpText)) return null;
  if (!Number.isInteger(members) || members < 0 || members > 5) return null;
  if (!Number.isFinite(epoch) || epoch <= 0) return null;
  return {
    code: raw.trim(), className, name,
    mode: modeToken === 'G' ? 'group' : 'individual',
    score, bonus, tp: `TP${tpText}`, members,
    completedAt: new Date(epoch * 1000).toISOString(),
    addedAt: new Date().toISOString(),
  };
}

export function extractShareCodes(text: string): string[] {
  return text.match(SHARE_CODE_TOKEN) ?? [];
}

const recordKey = (record: ClassRecord) => `${record.className.toLocaleLowerCase('ms')}|${record.name.toLocaleLowerCase('ms')}|${record.mode}`;

export function mergeRecords(existing: ClassRecord[], incoming: ClassRecord[]): { records: ClassRecord[]; added: number; updated: number } {
  const records = [...existing];
  let added = 0, updated = 0;
  for (const record of incoming) {
    const index = records.findIndex(item => item.code === record.code || recordKey(item) === recordKey(record));
    if (index >= 0) { records[index] = { ...record, addedAt: records[index].addedAt }; updated++; }
    else { records.push(record); added++; }
  }
  return { records, added, updated };
}

// Spreadsheet cells are escaped for CSV and guarded against formula injection.
const csvCell = (value: string) => {
  const guarded = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[",\n]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded;
};

export function recordsCsv(records: ClassRecord[]): string {
  const header = ['Kelas', 'Nama', 'Mod', 'Markah (30)', 'Bonus', 'Cadangan TP', 'Bilangan ahli', 'Selesai', 'Ditambah'];
  const rows = records.map(record => [
    csvCell(record.className), csvCell(record.name),
    record.mode === 'group' ? 'Kumpulan' : 'Individu',
    String(record.score), String(record.bonus), record.tp,
    record.members ? String(record.members) : '',
    csvCell(formatLabDate(record.completedAt)), csvCell(formatLabDate(record.addedAt)),
  ]);
  return '\uFEFF' + [header.join(','), ...rows.map(row => row.join(','))].join('\r\n');
}

function summaryStats(records: ClassRecord[]) {
  const scores = records.map(record => record.score);
  return {
    count: records.length,
    average: scores.length ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length * 10) / 10 : 0,
    highest: scores.length ? Math.max(...scores) : 0,
    lowest: scores.length ? Math.min(...scores) : 0,
  };
}

export function classSummaryText(records: ClassRecord[]): string {
  const stats = summaryStats(records);
  const lines = records.map(record => `• ${record.name} (${record.className}) — ${record.score}/30${record.bonus ? ` +${record.bonus} bonus` : ''} · ${record.tp}`);
  return [
    'Ringkasan Kelas — Virtual Lab Sains Tingkatan 1',
    `Rekod: ${stats.count} · Purata: ${stats.average}/30 · Tertinggi: ${stats.highest} · Terendah: ${stats.lowest}`,
    ...lines,
  ].join('\n');
}

const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function classSummaryHtml(records: ClassRecord[]): string {
  const stats = summaryStats(records);
  const rows = records.map(record => `<tr><td>${escapeHtml(record.className)}</td><td>${escapeHtml(record.name)}</td><td>${record.mode === 'group' ? 'Kumpulan' : 'Individu'}</td><td>${record.score} / 30</td><td>${record.bonus > 0 ? `+${record.bonus}` : '—'}</td><td>${record.tp}</td><td>${record.members || '—'}</td><td>${escapeHtml(formatLabDate(record.completedAt))}</td></tr>`).join('');
  return `<!doctype html><html lang="ms"><head><meta charset="utf-8"><title>Ringkasan Kelas — Virtual Lab Sains Tingkatan 1</title><style>body{margin:0;background:white;color:#173c38;font-family:Arial,sans-serif;padding:24px}main{max-width:980px;margin:auto}h1{font-size:22pt;margin:0 0 6px}p.meta{color:#597053;font-size:10pt;margin:0 0 14px}.stats{display:flex;gap:18px;flex-wrap:wrap;font-size:10pt;background:#f1f7f4;border:1px solid #d3e2d8;border-radius:10px;padding:12px 16px;margin:14px 0 18px}table{border-collapse:collapse;width:100%;font-size:9.5pt}th,td{border:1px solid #d3dfd6;padding:8px 10px;text-align:left}th{background:#e9f3e4}@page{size:A4;margin:14mm}@media print{body{padding:0}tr{break-inside:avoid}}</style></head><body><main><h1>Ringkasan Kelas — Virtual Lab Sains Tingkatan 1</h1><p class="meta">Syarat percambahan biji benih · Dicetak ${escapeHtml(formatLabDate(new Date().toISOString()))}</p><div class="stats"><span><strong>${stats.count}</strong> rekod</span><span>Purata: <strong>${stats.average}</strong> / 30</span><span>Tertinggi: <strong>${stats.highest}</strong></span><span>Terendah: <strong>${stats.lowest}</strong></span></div><table><thead><tr><th>Kelas</th><th>Nama</th><th>Mod</th><th>Markah</th><th>Bonus</th><th>TP</th><th>Ahli</th><th>Tarikh selesai</th></tr></thead><tbody>${rows}</tbody></table><p class="meta">Cadangan TP ialah untuk pertimbangan guru. Rekod diimport daripada kod kelas murid dan disimpan pada peranti guru sahaja.</p></main></body></html>`;
}
