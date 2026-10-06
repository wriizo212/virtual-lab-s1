import type { Material, Session, TubeId, TubeState } from './model';
import { clearLearningEvidence } from './invalidation';
export const tubeIds: TubeId[] = ['A', 'B', 'C', 'D'];
export const materialNames: Record<Material, string> = {
  seed: 'Biji benih', wetCotton: 'Kapas lembap', dryCotton: 'Kapas kering', water: 'Air',
  cooledBoiledWater: 'Air didih disejukkan', oil: 'Minyak masak', blackPaper: 'Kertas hitam',
};
export const recipes: Record<TubeId, { title: string; instructions: string[]; required: Material[]; location: TubeState['location'] }> = {
  A: { title: 'Keadaan rujukan', instructions: ['Masukkan biji benih dan kapas lembap.', 'Balut bahagian bawah tabung dengan kertas hitam.', 'Letakkan pada suhu bilik.'], required: ['seed', 'wetCotton', 'blackPaper'], location: 'bench' },
  B: { title: 'Keadaan tanpa air', instructions: ['Masukkan biji benih dan kapas kering.', 'Letakkan pada suhu bilik.'], required: ['seed', 'dryCotton'], location: 'bench' },
  C: { title: 'Keadaan air yang berbeza', instructions: ['Masukkan biji benih.', 'Tambah air didih yang telah disejukkan.', 'Tuangkan minyak masak sebagai lapisan di atas air.', 'Letakkan pada suhu bilik.'], required: ['seed', 'cooledBoiledWater', 'oil'], location: 'bench' },
  D: { title: 'Keadaan sejuk', instructions: ['Masukkan biji benih dan kapas lembap.', 'Pindahkan tabung ke dalam peti sejuk.'], required: ['seed', 'wetCotton'], location: 'fridge' },
};
// Physical conditions are derived after every edit; validation does not decide outcomes.
export function deriveConditions(tube: TubeState): TubeState {
  return { ...tube, waterAvailable: tube.materials.some(m => ['wetCotton', 'water', 'cooledBoiledWater'].includes(m)), oxygenAvailable: !(tube.materials.includes('cooledBoiledWater') && !tube.materials.includes('water') && tube.materials.includes('oil')), temperatureC: tube.location === 'fridge' ? 5 : 25 };
}
export function editMaterial(tube: TubeState, material: Material, remove = false): { tube: TubeState; message: string; changed: boolean } {
  if (!remove && tube.materials.includes(material)) return { tube, message: 'Bahan ini sudah ada dalam tabung.', changed: false };
  if (!remove && material === 'oil' && !tube.materials.some(m => m === 'water' || m === 'cooledBoiledWater')) return { tube, message: 'Tuangkan cecair dahulu sebelum menambah lapisan minyak.', changed: false };
  const materials = remove ? tube.materials.filter(m => m !== material) : [...tube.materials, material];
  if (remove && (material === 'water' || material === 'cooledBoiledWater') && !materials.some(m => m === 'water' || m === 'cooledBoiledWater')) {
    const oilIndex = materials.indexOf('oil'); if (oilIndex >= 0) materials.splice(oilIndex, 1);
  }
  return { tube: deriveConditions({ ...tube, materials, validated: false }), changed: true, message: remove ? `${materialNames[material]} dikeluarkan dari Tabung ${tube.id}.` : `${materialNames[material]} ditambah ke Tabung ${tube.id}.` };
}
export function placeTube(tube: TubeState, location: TubeState['location']): TubeState {
  return deriveConditions({ ...tube, location, placementConfirmed: true, validated: false });
}
export function isSetupCorrect(tube: TubeState): boolean {
  const recipe = recipes[tube.id];
  return recipe.required.every(m => tube.materials.includes(m)) && tube.materials.every(m => recipe.required.includes(m) || (m === 'blackPaper' && tube.id !== 'A')) && tube.location === recipe.location && tube.placementConfirmed === true;
}
export function validateTube(tube: TubeState): TubeState {
  if (tube.validated) return tube;
  return { ...deriveConditions(tube), attempts: tube.attempts + 1, validated: isSetupCorrect(tube) };
}
const hints: Record<TubeId, string[]> = {
  A: ['Periksa keadaan air dalam tabung.', 'Biji benih perlu berada pada kapas lembap. Semak juga balutan dan tempat tabung.', 'Gunakan biji benih, kapas lembap dan kertas hitam. Kemudian sahkan suhu bilik. Keluarkan bahan lain.'],
  B: ['Perhatikan sama ada kapas anda basah atau kering.', 'Bandingkan jenis kapas dengan arahan Tabung B.', 'Gunakan biji benih dan kapas kering sahaja. Kemudian sahkan suhu bilik.'],
  C: ['Semak jenis cecair dan susunan lapisan.', 'Gunakan air yang telah dididihkan dan disejukkan, kemudian tambah lapisan di atasnya.', 'Gunakan biji benih, air didih disejukkan dan minyak masak. Kemudian sahkan suhu bilik. Keluarkan bahan lain.'],
  D: ['Periksa lokasi tabung anda.', 'Semak kelembapan kapas dan pindahkan tabung ke tempat sejuk.', 'Gunakan biji benih dan kapas lembap, kemudian seret tabung ke peti sejuk. Keluarkan bahan lain.'],
};
export function getHint(tube: TubeState): { tube: TubeState; text: string; counted: boolean } {
  if (tube.hintLevel < 3 && tube.attempts < tube.hintLevel) return { tube, text: 'Cuba periksa dan semak tabung sebelum meminta petunjuk seterusnya.', counted: false };
  const level = Math.min(3, tube.hintLevel + 1);
  return { tube: { ...tube, hintLevel: level }, text: hints[tube.id][level - 1], counted: level > tube.hintLevel };
}
export function currentHint(tube: TubeState): string { return tube.hintLevel > 0 ? hints[tube.id][Math.min(3, tube.hintLevel) - 1] : ''; }
export function setupScore(tubes: Session['tubes']): number {
  return tubeIds.reduce((score, id) => score + (tubes[id].validated ? 2 : 0), 0);
}
export function updateTube(session: Session, tube: TubeState): Session {
  const tubes = { ...session.tubes, [tube.id]: tube }; const complete = tubeIds.every(id => tubes[id].validated);
  const oldTube = session.tubes[tube.id];
  const physicalChange = oldTube.location !== tube.location || oldTube.materials.join('|') !== tube.materials.join('|');
  const reset = physicalChange && session.experimentStartedAt ? {
    experimentStartedAt: undefined, maxDay: 1, day: 1, inspectedTubes: [], observations: {}, results: {}, resultsCheck: undefined,
    predictionComparison: undefined, explanationAnswers: {}, conclusion: [],
    completedSteps: session.completedSteps.filter(step => step < 2),
    scores: { ...session.scores, hypothesis: 0, observation: 0, results: 0, analysis: 0, conclusion: 0, bonus: 0 },
  } : {};
  const next = { ...(physicalChange && session.experimentStartedAt ? clearLearningEvidence(session) : session), ...reset };
  return { ...next, tubes, scores: { ...next.scores, setup: setupScore(tubes) }, completedSteps: complete ? [...new Set([...next.completedSteps, 2])] : next.completedSteps.filter(step => step !== 2) };
}
export function setupMember(session: Session, id: TubeId) {
  const first = Math.max(0, session.members.findIndex(member => member.roles.includes('Pengendali Bahan Maya')));
  return session.members[(first + tubeIds.indexOf(id)) % session.members.length];
}
