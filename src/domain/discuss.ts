import { analysisQuestions, formatLabDate, hypothesisOptions } from './learning';
import { deriveConditions, recipes, tubeIds } from './experiment';
import { expectedResult } from './simulation';

// Shared source for the teacher-led class discussion: per-slide script notes,
// common misconceptions to correct together, and the printable reference
// sheet. Content mirrors the app's model (air, oxygen, suitable temperature).
export interface SlideNote { script: string; questions: string[] }

export const discussNotes: {
  intro: SlideNote; hypothesis: SlideNote; outcome: SlideNote; table: SlideNote;
  analysis: SlideNote[]; misconceptions: SlideNote; conclusion: SlideNote;
} = {
  intro: {
    script: 'Semasa eksperimen, kamu menguji apa yang biji benih perlukan untuk bercambah. Sekarang kita bincang bersama bukti daripada keempat-empat tabung.',
    questions: ['Pemboleh ubah apa yang kita ubah dalam eksperimen kita?', 'Kenapa setiap tabung hanya ubah satu perkara?'],
  },
  hypothesis: {
    script: 'Hipotesis paling tepat menyebut ketiga-tiga keperluan: udara, air dan suhu yang sesuai. Cahaya tidak tersenarai sebagai syarat.',
    questions: ['Kenapa cahaya bukan salah satu syarat percambahan?', 'Apa maksud "suhu yang sesuai" pada pendapat kamu?'],
  },
  outcome: {
    script: 'Hanya Tabung A bercambah. Setiap tabung lain kekurangan SATU syarat sahaja — itulah peranan tabung kawalan.',
    questions: ['Tabung B kekurangan apa?', 'Tabung C ada air — kenapa masih tidak bercambah?', 'Kenapa Tabung D tidak bercambah?'],
  },
  table: {
    script: 'Bandingkan baris A dengan B, C dan D: satu syarat hilang, percambahan gagal. Itulah bukti daripada eksperimen kita.',
    questions: ['Kalau kita tiada Tabung A, bolehkah kita buat kesimpulan? Kenapa?'],
  },
  analysis: [
    { script: 'Tabung B: kapas kering, tiada air langsung. Air diperlukan untuk mengaktifkan proses percambahan.', questions: ['Apa akan berlaku kepada biji benih yang tidak mendapat air?'] },
    { script: 'Tabung C: pendidihan menyingkirkan oksigen terlarut, dan lapisan minyak menghalang oksigen masuk semula. Tanpa oksigen, respirasi tidak boleh berlaku.', questions: ['Kenapa air perlu didihkan dahulu sebelum ditambah minyak?'] },
    { script: 'Tabung D: suhu 5°C terlalu sejuk. Suhu rendah memperlahankan aktiviti enzim dan metabolisme, jadi biji benih tidak bercambah dalam simulasi ini.', questions: ['Bila suhu kembali sesuai, apa mungkin berlaku kepada biji benih?'] },
    { script: 'Tiga syarat utama percambahan: air, oksigen dan suhu yang sesuai. Jenis biji benih dimalarkan dalam eksperimen ini.', questions: ['Sebut ketiga-tiga syarat tanpa membuka nota!'] },
  ],
  misconceptions: {
    script: 'Empat salah faham biasa tentang percambahan — jom betulkan bersama-sama.',
    questions: ['Pernah dengar alasan ini daripada rakan? Kenapa ia tidak tepat?'],
  },
  conclusion: {
    script: 'Ulang tiga syarat: air, udara (oksigen) dan suhu yang sesuai. Cahaya tidak diperlukan untuk percambahan biji benih.',
    questions: ['Di mana kamu boleh nampak syarat ini dalam kehidupan harian?', 'Bila menyimpan benih untuk musim seterusnya, apa perlu dijaga?'],
  },
};

export const commonMisconceptions = [
  { belief: 'Biji benih memerlukan cahaya untuk bercambah.', truth: 'Tidak — biji benih bercambah dalam gelap di dalam tanah. Ia menggunakan simpanan makanan dalam biji dan memerlukan air, oksigen serta suhu yang sesuai.' },
  { belief: 'Minyak dalam Tabung C membekalkan makanan kepada biji benih.', truth: 'Tidak — minyak menghalang oksigen daripada masuk semula ke dalam air selepas air didihkan. Tanpa oksigen, biji benih tidak boleh melakukan respirasi.' },
  { belief: 'Biji benih dalam Tabung D “mati” kerana sejuk.', truth: 'Bukan kerana mati — suhu 5°C terlalu sejuk untuk percambahan dalam simulasi ini. Suhu rendah memperlahankan aktiviti enzim dan metabolisme.' },
  { belief: 'Baja diperlukan untuk biji benih bercambah.', truth: 'Tidak — percambahan menggunakan simpanan makanan dalam biji. Dalam eksperimen ini, benih bercambah atas kapas tanpa tanah atau baja.' },
] as const;

// Expected outcomes of the four demonstration tubes (same derivation the
// pupils see in the simulation) so slides and the sheet never disagree.
export function tubeOutcomes() {
  return tubeIds.map(id => {
    const tube = deriveConditions({ id, materials: [...recipes[id].required], location: recipes[id].location, placementConfirmed: true, validated: true, attempts: 1, hintLevel: 0, waterAvailable: false, oxygenAvailable: true, temperatureC: 25 });
    return { id, tube, result: expectedResult(tube) };
  });
}
export const tubeReasonById: Record<string, string> = { A: 'Air + oksigen + suhu sesuai', B: 'Tiada air', C: 'Tiada oksigen (minyak menghalang udara)', D: 'Suhu 5°C terlalu sejuk' };

const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function teacherSheetHtml(): string {
  const fields = ['water', 'oxygen', 'temperature', 'germination'] as const;
  const tubeRows = tubeOutcomes().map(({ id, result }) => `<tr><td>${id}</td>${fields.map(field => `<td class="${result[field] ? 'yes' : 'no'}">${result[field] ? '✓' : '✕'}</td>`).join('')}<td>${escapeHtml(tubeReasonById[id])}</td></tr>`).join('');
  const questionBlocks = analysisQuestions.map(q => `<article class="q"><h3>${escapeHtml(q.question)}</h3><p><strong>Jawapan: ${String.fromCharCode(65 + Number(q.answer))}. ${escapeHtml(q.options[Number(q.answer)])}</strong></p><p>${escapeHtml(q.explanation)}</p></article>`).join('');
  const misconceptionBlocks = commonMisconceptions.map(item => `<article class="q"><p class="belief">✕ Murid kata: ${escapeHtml(item.belief)}</p><p class="truth">✓ Sebenarnya: ${escapeHtml(item.truth)}</p></article>`).join('');
  const noteRows: [string, SlideNote][] = [
    ['Pembukaan', discussNotes.intro], ['Hipotesis', discussNotes.hypothesis], ['Ramalan &amp; bukti', discussNotes.outcome], ['Jadual keputusan', discussNotes.table],
    ...discussNotes.analysis.map((note, i) => [`Analisis ${i + 1}`, note] as [string, SlideNote]),
    ['Salah faham lazim', discussNotes.misconceptions], ['Kesimpulan', discussNotes.conclusion],
  ];
  const noteBlocks = noteRows.map(([label, note]) => `<p class="note"><strong>${label}</strong> — ${escapeHtml(note.script)} <em>Soalan: ${escapeHtml(note.questions.join(' '))}</em></p>`).join('');
  return `<!doctype html><html lang="ms"><head><meta charset="utf-8"><title>Helaian Rujukan Guru — Virtual Lab Sains Tingkatan 1</title><style>body{margin:0;background:white;color:#173c38;font-family:Arial,sans-serif;padding:24px}main{max-width:980px;margin:auto}h1{font-size:20pt;margin:0 0 6px}h2{font-size:13.5pt;margin:18px 0 8px;border-bottom:1px solid #d3e2d8;padding-bottom:4px}h3{font-size:11pt;margin:0 0 6px}p.meta{color:#597053;font-size:9.5pt;margin:0 0 12px}ul{margin:6px 0 0 18px}table{border-collapse:collapse;width:100%;font-size:9.5pt}th,td{border:1px solid #d3dfd6;padding:7px 9px;text-align:center}th{background:#e9f3e4}td.yes{color:#2f6b3c;font-weight:700}td.no{color:#a04a26;font-weight:700}.q{break-inside:avoid;border:1px solid #d3dfd6;border-radius:8px;padding:10px 12px;margin:8px 0;font-size:10pt}.q p{margin:4px 0}.belief{color:#a04a26;font-weight:600}.truth{color:#2f5c3c}.note{margin:6px 0;font-size:9.5pt}.note em{color:#597053}@page{size:A4;margin:14mm}@media print{body{padding:0}tr{break-inside:avoid}}</style></head><body><main><h1>Helaian Rujukan Guru — Virtual Lab Sains Tingkatan 1</h1><p class="meta">Syarat percambahan biji benih · Dijana ${escapeHtml(formatLabDate(new Date().toISOString()))} · daripada Mod guru → Cetak helaian rujukan</p><section><h2>Jawapan ringkas</h2><ul><li><strong>Hipotesis betul:</strong> ${escapeHtml(hypothesisOptions[1])}</li><li><strong>Tiga syarat utama:</strong> air, oksigen dan suhu yang sesuai.</li><li><strong>Keputusan:</strong> hanya Tabung A bercambah — B tiada air, C tiada oksigen, D suhu tidak sesuai.</li><li><strong>Kesimpulan:</strong> air + oksigen + suhu yang sesuai = PERCAMBAHAN. Cahaya tidak diperlukan.</li></ul></section><section><h2>Jadual keputusan penuh</h2><table><thead><tr><th>Tabung</th><th>Air</th><th>Udara (oksigen)</th><th>Suhu sesuai</th><th>Percambahan</th><th>Sebab</th></tr></thead><tbody>${tubeRows}</tbody></table></section><section><h2>Soalan analisis &amp; jawapan</h2>${questionBlocks}</section><section><h2>Salah faham lazim</h2>${misconceptionBlocks}</section><section><h2>Nota bincang (skrip ringkas)</h2>${noteBlocks}</section><p class="meta">Untuk pertimbangan guru semasa perbincangan kelas bersama murid.</p></main></body></html>`;
}
