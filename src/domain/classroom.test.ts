import { describe, expect, it } from 'vitest';
import { createSession } from './model';
import { finishSession } from './learning';
import { decodeShareCode, encodeShareCode, extractShareCodes, mergeRecords, recordsCsv } from './classroom';

function finished(name: string, className: string, mode: 'individual' | 'group' = 'individual') {
  let session = createSession(mode, name, className, mode === 'group' ? ['Aina', 'Siti', 'Mei'] : []);
  session = { ...session, hypothesis: 1, predictionMade: true, prediction: ['A'], completedSteps: [0, 1, 2, 3, 4, 5, 6, 7],
    conclusion: ['AIR', 'OKSIGEN', 'SUHU'], conclusionChecked: true,
    explanationAnswers: { water: '1', oxygen: '2', temperature: '2', conditions: '3' },
    scores: { hypothesis: 2, setup: 8, observation: 4, results: 8, analysis: 4, conclusion: 4, bonus: 0 } };
  return finishSession(session);
}

describe('class share codes', () => {
  it('round-trips a finished session, including Malay text and special characters', () => {
    const session = finished('Aina <Sains>', '1 AMANAH');
    const code = encodeShareCode(session);
    expect(code).toMatch(/^SCI1-KELAS-[A-Za-z0-9_-]+\.[0-9a-z]{2}$/);
    const record = decodeShareCode(code);
    expect(record).toMatchObject({ name: 'Aina <Sains>', className: '1 AMANAH', mode: 'individual', score: 30, bonus: 0, tp: 'TP4', members: 0 });
    expect(Math.floor(new Date(session.completedAt!).getTime() / 1000) * 1000).toBe(new Date(record!.completedAt).getTime());
    expect(session.resultCode).toMatch(/^SCI1-GERM-[A-F0-9]{7}$/);
  });
  it('carries group mode, member count and TP5 with challenge bonus', () => {
    let session = finished('Kumpulan Tunas', '1 Cekal', 'group');
    session = { ...session, challengeRuns: [{ id: 'run-1', testedAt: new Date().toISOString(), config: { water: 'suitable', oxygen: true, temperature: 25 }, germinated: true, slow: false, limitingFactors: ['allMet'], selectedFactors: ['allMet'], checked: true, explained: true }], scores: { ...session.scores, bonus: 2 } };
    expect(decodeShareCode(encodeShareCode(session))).toMatchObject({ mode: 'group', members: 3, bonus: 2, tp: 'TP5' });
  });
  it('rejects tampered, truncated and foreign codes', () => {
    const code = encodeShareCode(finished('Aina', '1 Bestari'));
    const body = code.slice('SCI1-KELAS-'.length);
    const tampered = 'SCI1-KELAS-' + (body[0] === 'A' ? 'B' : 'A') + body.slice(1);
    expect(decodeShareCode(tampered)).toBeNull();
    expect(decodeShareCode(code.slice(0, -3))).toBeNull();
    expect(decodeShareCode('SCI1-GERM-ABCDEF1')).toBeNull();
    expect(decodeShareCode('')).toBeNull();
  });
  it('extracts codes from free text and ignores other content', () => {
    const a = encodeShareCode(finished('Aina', '1 Bestari'));
    const b = encodeShareCode(finished('Kumpulan Tunas', '1 Cekal', 'group'));
    const text = `hai semua ini kod saya ${a} dan ${b}. kod lama SCI1-GERM-ABCDEF1 abaikan.`;
    expect(extractShareCodes(text)).toEqual([a, b]);
  });
  it('merges by pupil identity so re-imports update instead of duplicating', () => {
    const a = decodeShareCode(encodeShareCode(finished('Aina', '1 Bestari')))!;
    const b = decodeShareCode(encodeShareCode(finished('Siti', '1 Bestari')))!;
    const first = mergeRecords([], [a, b]);
    expect(first).toMatchObject({ added: 2, updated: 0 });
    const second = mergeRecords(first.records, [{ ...a, code: 'SCI1-KELAS-lain.00', score: 26 }]);
    expect(second).toMatchObject({ added: 0, updated: 1 });
    expect(second.records).toHaveLength(2);
    expect(second.records.find(record => record.name === 'Aina')?.score).toBe(26);
  });
  it('builds CSV with BOM, quotes special values and guards formulas', () => {
    const now = new Date().toISOString();
    const records = [
      { code: 'c1', name: 'Aina, "Cekal"', className: '1 Bestari', mode: 'individual' as const, score: 30, bonus: 0, tp: 'TP4', members: 0, completedAt: now, addedAt: now },
      { code: 'c2', name: '=SUM(A1)', className: '1 Bestari', mode: 'group' as const, score: 25.5, bonus: 2, tp: 'TP5', members: 3, completedAt: now, addedAt: now },
    ];
    const csv = recordsCsv(records);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('Kelas,Nama,Mod');
    expect(csv).toContain('"Aina, ""Cekal"""');
    expect(csv).toContain("'=SUM(A1)");
    expect(csv).toContain('25.5');
  });
});
