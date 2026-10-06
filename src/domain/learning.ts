import { canGerminate, type ChallengeConfig, type ChallengeFactor, type ChallengeRun, type Session } from './model';
import { predictionMatches } from './simulation';
import { clearLearningEvidence } from './invalidation';
export const hypothesisOptions = [
  'Biji benih hanya memerlukan air untuk bercambah.',
  'Biji benih memerlukan udara, air dan suhu yang sesuai untuk bercambah.',
  'Biji benih memerlukan cahaya untuk bercambah.',
  'Semua biji benih boleh bercambah pada sebarang keadaan.',
];
export const analysisQuestions = [
  { id: 'water', question: 'Mengapakah biji benih dalam Tabung B tidak bercambah?', options: ['Tiada cahaya.', 'Tiada air.', 'Tiada oksigen.', 'Suhu terlalu tinggi.'], answer: '1', explanation: 'Kapas kering tidak membekalkan air. Biji benih memerlukan air untuk mengaktifkan proses percambahan.' },
  { id: 'oxygen', question: 'Apakah fungsi lapisan minyak dalam Tabung C?', options: ['Membekalkan nutrien.', 'Mengekalkan suhu.', 'Menghalang oksigen memasuki air semula.', 'Membantu biji benih menyerap air.'], answer: '2', explanation: 'Pendidihan menyingkirkan oksigen terlarut. Selepas air disejukkan, lapisan minyak menghalang oksigen daripada masuk semula. Biji benih memerlukan oksigen untuk respirasi.' },
  { id: 'temperature', question: 'Mengapakah biji benih dalam Tabung D tidak bercambah dalam simulasi ini?', options: ['Tiada air di dalam kapas.', 'Cahaya di dalam peti sejuk terlalu terang.', 'Suhu rendah memperlahankan aktiviti enzim dan proses metabolisme.', 'Udara di dalam tabung terlalu banyak.'], answer: '2', explanation: 'Suhu peti sejuk tidak sesuai untuk biji benih contoh ini. Suhu rendah memperlahankan aktiviti enzim dan proses metabolisme yang terlibat dalam percambahan.' },
  { id: 'conditions', question: 'Apakah tiga syarat utama percambahan yang diuji?', options: ['Air, baja dan cahaya.', 'Oksigen, tanah dan baja.', 'Cahaya, tanah dan suhu tinggi.', 'Air, oksigen dan suhu yang sesuai.'], answer: '3', explanation: 'Eksperimen ini menguji keperluan air, oksigen dan suhu yang sesuai. Jenis biji benih dimalarkan.' },
];
export function readyForAnalysis(session: Session) {
  return session.completedSteps.includes(5) && session.resultsCheck?.correct === 16 && typeof session.predictionComparison === 'boolean' && session.predictionComparison === predictionMatches(session);
}
export function setPredictionComparison(session:Session,value:boolean):Session {
  if(session.predictionComparison===value)return session;
  return {...clearLearningEvidence(session),predictionComparison:value,completedSteps:session.completedSteps.filter(step=>step<6)};
}
export function editAnalysis(session: Session, questionId: string, answer: string): Session {
  if (!analysisQuestions.some(q => q.id === questionId && q.options[Number(answer)] !== undefined)) return session;
  return { ...resetAfterConclusionEdit(session), explanationAnswers: { ...session.explanationAnswers, [questionId]: answer }, analysisReviewed: (session.analysisReviewed ?? []).filter(id => id !== questionId), completedSteps: session.completedSteps.filter(step => step < 6) };
}
export function checkAnalysis(session: Session, questionId: string): Session {
  if (!readyForAnalysis(session)) return session;
  const question = analysisQuestions.find(q => q.id === questionId); const answer = session.explanationAnswers[questionId];
  if (!question || !question.options[Number(answer)] || answer === undefined) return session;
  const first = { ...session.analysisFirstAnswers };
  first[questionId] ??= answer;
  const reviewed = [...new Set([...(session.analysisReviewed ?? []), questionId])];
  const score = analysisQuestions.filter(q => first[q.id] === q.answer).length;
  const finished = analysisQuestions.every(q => reviewed.includes(q.id));
  return { ...session, analysisFirstAnswers: first, analysisReviewed: reviewed, scores: { ...session.scores, analysis: score }, completedSteps: finished ? [...new Set([...session.completedSteps, 6])] : session.completedSteps };
}
export const conclusionWords = ['AIR', 'OKSIGEN', 'SUHU'];
export const conclusionSlots = (session: Session) => Array.from({ length: 3 }, (_, i) => session.conclusion[i] ?? '');
export function isConclusionCorrect(session: Session) {
  const words = conclusionSlots(session);
  return words[2] === 'SUHU' && new Set(words.slice(0,2)).size === 2 && words.slice(0,2).every(word => word === 'AIR' || word === 'OKSIGEN');
}
function resetAfterConclusionEdit(session: Session): Session {
  return { ...session, conclusionChecked: false, completedAt: undefined, resultCode: undefined, reflectionReviewed: false,
    challengeRuns: [], scores: { ...session.scores, conclusion: 0, bonus: 0 }, completedSteps: session.completedSteps.filter(step => step < 7) };
}
export function placeConclusionWord(session: Session, word: string, slot: number): Session {
  if (!conclusionWords.includes(word) || slot < 0 || slot > 2) return session;
  const slots = conclusionSlots(session); const previous = slots.indexOf(word);
  if (previous === slot) return session;
  const replaced = slots[slot]; if (previous >= 0) slots[previous] = replaced;
  slots[slot] = word;
  return { ...resetAfterConclusionEdit(session), conclusion: slots };
}
export function removeConclusionWord(session: Session, slot: number): Session {
  const slots = conclusionSlots(session); if (slot < 0 || slot > 2 || !slots[slot]) return session;
  slots[slot] = ''; return { ...resetAfterConclusionEdit(session), conclusion: slots };
}
export function checkConclusion(session: Session): Session {
  if (!session.completedSteps.includes(6) || conclusionSlots(session).some(word => !word)) return session;
  if (session.conclusionChecked) return session;
  const correct = isConclusionCorrect(session);
  return { ...session, conclusionChecked: true, conclusionAttempts: (session.conclusionAttempts ?? 0) + 1,
    scores: { ...session.scores, conclusion: correct ? 4 : 0 }, completedSteps: correct ? [...new Set([...session.completedSteps, 7])] : session.completedSteps };
}
export const defaultChallenge: ChallengeConfig = { water: 'suitable', oxygen: true, temperature: 25 };
export const waterLabels = { none: 'Tiada', little: 'Sedikit', suitable: 'Sesuai', excess: 'Terlalu banyak' };
export const factorLabels: Record<ChallengeFactor, string> = { water: 'Air', oxygen: 'Oksigen', temperature: 'Suhu', allMet: 'Ketiga-tiga syarat dipenuhi' };
export function evaluateChallenge(config: ChallengeConfig) {
  const waterAvailable = config.water === 'suitable' || config.water === 'excess';
  const oxygenAvailable = config.oxygen && config.water !== 'excess';
  const temperatureSuitable = config.temperature >= 15 && config.temperature <= 35;
  const germinated = canGerminate({ id:'A', materials:['seed'], location:'bench', waterAvailable, oxygenAvailable, temperatureC:config.temperature, validated:false, attempts:0, hintLevel:0 });
  const factors: ChallengeFactor[] = [];
  if (!waterAvailable || config.water === 'excess') factors.push('water');
  if (!oxygenAvailable) factors.push('oxygen');
  if (!temperatureSuitable || (germinated && config.temperature === 15)) factors.push('temperature');
  if (!factors.length) factors.push('allMet');
  return { germinated, slow: germinated && config.temperature === 15, limitingFactors: factors };
}
export function testChallenge(session: Session): Session {
  if (!session.completedSteps.includes(7)) return session;
  const config = { ...(session.challengeConfig ?? defaultChallenge) };
  const run: ChallengeRun = { id: crypto.randomUUID(), testedAt: new Date().toISOString(), config, ...evaluateChallenge(config), selectedFactors: [], checked: false, explained: false };
  return { ...session, challengeConfig:config, challengeRuns:[...(session.challengeRuns ?? []).slice(-19),run] };
}
export function selectChallengeFactor(session: Session, factor: ChallengeFactor): Session {
  const runs = [...(session.challengeRuns ?? [])]; const last = runs.at(-1); if (!last) return session;
  const selectedFactors = last.selectedFactors.includes(factor) ? last.selectedFactors.filter(f => f !== factor) : [...last.selectedFactors,factor];
  runs[runs.length-1] = { ...last, selectedFactors, checked:false, explained:false };
  return { ...session, challengeRuns:runs };
}
export function checkChallenge(session: Session): Session {
  const runs = [...(session.challengeRuns ?? [])]; const last = runs.at(-1); if (!last || !last.selectedFactors.length) return session;
  if (JSON.stringify(last.config)!==JSON.stringify(session.challengeConfig??defaultChallenge)) return session;
  const explained = last.selectedFactors.length === last.limitingFactors.length && last.limitingFactors.every(factor => last.selectedFactors.includes(factor));
  runs[runs.length-1] = { ...last, checked:true, explained };
  return { ...session, challengeRuns:runs, scores:{ ...session.scores, bonus: explained ? 2 : session.scores.bonus }, completedSteps: explained ? [...new Set([...session.completedSteps,8])] : session.completedSteps };
}
export function challengeExplanation(run: ChallengeRun) {
  const reasons = [];
  if (run.config.water === 'none') reasons.push('Tiada air untuk mengaktifkan percambahan.');
  if (run.config.water === 'little') reasons.push('Dalam model ini, air sedikit mewakili kelembapan yang belum mencukupi.');
  if (run.config.water === 'excess') reasons.push('Air terlalu banyak memenuhi ruang udara dan mengurangkan oksigen yang tersedia kepada biji benih.');
  if (!run.config.oxygen) reasons.push('Oksigen tidak tersedia untuk respirasi.');
  if (run.config.temperature === 5) reasons.push('Suhu 5°C terlalu rendah untuk biji benih contoh ini.');
  if (run.config.temperature === 40 || run.config.temperature === 70) reasons.push(`Suhu ${run.config.temperature}°C terlalu tinggi untuk biji benih contoh ini.`);
  if (run.slow) reasons.push('Suhu 15°C membolehkan percambahan tetapi lebih perlahan berbanding 25°C dalam model.');
  if (!reasons.length) reasons.push('Air, oksigen dan suhu yang sesuai tersedia untuk percambahan.');
  return reasons.join(' ');
}
export const scoreSections = [
  { key:'hypothesis', label:'Hipotesis', max:2 }, { key:'setup', label:'Penyediaan eksperimen', max:8 },
  { key:'observation', label:'Pemerhatian', max:4 }, { key:'results', label:'Jadual keputusan', max:8 },
  { key:'analysis', label:'Analisis', max:4 }, { key:'conclusion', label:'Kesimpulan', max:4 },
] as const;
export function mainScore(session: Session) { return scoreSections.reduce((total,section)=>total+session.scores[section.key],0); }
export function finishSession(session: Session): Session {
  if (![0,1,2,3,4,5,6,7].every(step=>session.completedSteps.includes(step)) || !session.conclusionChecked || !isConclusionCorrect(session)) return session;
  return { ...session, screen:'final', completedAt: session.completedAt ?? new Date().toISOString(),
    resultCode: session.resultCode ?? `SCI1-GERM-${crypto.randomUUID().replace(/-/g,'').slice(0,7).toUpperCase()}`, scores:{ ...session.scores,hypothesis:session.hypothesis===1?2:0 } };
}
export const contributionItems = ['Membina eksperimen','Membuat pemerhatian','Membincangkan keputusan','Membuat kesimpulan'];
export function toggleContribution(session:Session,memberId:string,item:string):Session {
  if (!contributionItems.includes(item)) return session;
  return { ...session,members:session.members.map(member=>member.id===memberId?{ ...member,contributions:member.contributions.includes(item)?member.contributions.filter(i=>i!==item):[...member.contributions,item] }:member) };
}
export function pbdSuggestion(session:Session) {
  const strongAnalysis=analysisQuestions.every(q=>session.explanationAnswers[q.id]===q.answer);
  if (strongAnalysis && (session.challengeRuns ?? []).some(run=>run.explained)) return { tp:'TP5',reason:'Rekod analisis dan cabaran menunjukkan murid menghubungkan perubahan pemboleh ubah dengan percambahan. Guru perlu mengesahkan hujah dan penglibatan murid.' };
  if (session.completedSteps.includes(6) && session.scores.analysis>=2) return { tp:'TP4',reason:'Murid menjalankan simulasi dan memberikan penjelasan hasil eksperimen. Pertimbangkan mutu penjelasan lisan dan tahap bimbingan semasa aktiviti.' };
  return { tp:'TP3',reason:'Murid menyelesaikan simulasi dengan bimbingan. Nilai semula pemahaman sebab percambahan melalui perbincangan bersama guru.' };
}
export function learningFeedback(session:Session) {
  const misconceptions=analysisQuestions.filter(q=>session.analysisFirstAnswers?.[q.id]!==q.answer);
  const strengths=analysisQuestions.filter(q=>session.analysisFirstAnswers?.[q.id]===q.answer);
  return { positive:strengths.length===4?'Anda menerangkan keperluan air, oksigen dan suhu yang sesuai dengan baik.':'Anda telah menjalankan penyiasatan dan menyusun bukti percambahan.',
    review:misconceptions.length?`Ulang kaji: ${misconceptions.map(q=>q.id==='water'?'keperluan air (Tabung B)':q.id==='oxygen'?'fungsi minyak dan oksigen (Tabung C)':q.id==='temperature'?'kesan suhu rendah (Tabung D)':'tiga syarat percambahan').join('; ')}.`:'Teruskan menguji keadaan baharu dan menerangkan bukti anda.' };
}
export function formatLabDate(value:string) { return new Intl.DateTimeFormat('ms-MY',{ dateStyle:'long',timeStyle:'short',timeZone:'Asia/Kuala_Lumpur' }).format(new Date(value)); }
