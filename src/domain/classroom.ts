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
