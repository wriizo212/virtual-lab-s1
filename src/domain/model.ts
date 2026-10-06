export type Mode = 'individual' | 'group';
export type Screen = 'landing' | 'registration' | 'roles' | 'ready' | 'hypothesis' | 'prediction' | 'setup' | 'setupComplete' | 'simulation' | 'observation' | 'results' | 'comparison' | 'explanation' | 'conclusion' | 'challenge' | 'final' | 'report';
export const steps = ['Hipotesis', 'Ramalan', 'Penyediaan', 'Eksperimen', 'Pemerhatian', 'Keputusan', 'Analisis', 'Kesimpulan', 'Cabaran'] as const;
export type TubeId = 'A' | 'B' | 'C' | 'D';
export type Material = 'seed' | 'wetCotton' | 'dryCotton' | 'water' | 'cooledBoiledWater' | 'oil' | 'blackPaper';
export interface TubeState { id: TubeId; materials: Material[]; location: 'bench' | 'fridge'; waterAvailable: boolean; oxygenAvailable: boolean; temperatureC: number; validated: boolean; attempts: number; hintLevel: number; placementConfirmed?: boolean }
export interface Member { id: string; name: string; roles: string[]; contributions: string[] }
export type ResultField = 'water' | 'oxygen' | 'temperature' | 'germination';
export type ResultRow = Partial<Record<ResultField, boolean>>;
export type WaterLevel = 'none' | 'little' | 'suitable' | 'excess';
export type ChallengeFactor = 'water' | 'oxygen' | 'temperature' | 'allMet';
export interface ChallengeConfig { water: WaterLevel; oxygen: boolean; temperature: 5 | 15 | 25 | 40 | 70 }
export interface ChallengeRun {
  id: string; testedAt: string; config: ChallengeConfig; germinated: boolean; slow: boolean;
  limitingFactors: ChallengeFactor[]; selectedFactors: ChallengeFactor[]; checked: boolean; explained: boolean;
}
export interface TeacherSettings { hintsEnabled: boolean; scoreEnabled: boolean; allowedModes: 'both' | Mode; maxMembers: number; discussionCountdown: boolean }
export interface Session {
  id: string; mode: Mode; name: string; className: string; members: Member[]; roleRotation: number; turnIndex: number;
  createdAt: string; updatedAt: string; screen: Screen; step: number; completedSteps: number[];
  hypothesis: number | null; prediction: TubeId[]; predictionMade?: boolean; setupTube?: TubeId; tubes: Record<TubeId, TubeState>; day: number;
  experimentStartedAt?: string; maxDay?: number; inspectedTubes?: TubeId[]; observationTube?: TubeId;
  observations: Partial<Record<TubeId, boolean>>; results: Partial<Record<TubeId, ResultRow>>;
  resultsCheck?: { correct: number; total: number; focus?: { tubeId: TubeId; field: ResultField } };
  predictionComparison?: boolean;
  explanationAnswers: Record<string, string>; conclusion: string[]; hintsUsed: number;
  analysisIndex?: number; analysisReviewed?: string[]; analysisFirstAnswers?: Record<string, string>;
  conclusionChecked?: boolean; conclusionAttempts?: number; challengeConfig?: ChallengeConfig; challengeRuns?: ChallengeRun[];
  completedAt?: string; resultCode?: string; reflectionReviewed?: boolean;
  scores: { hypothesis: number; setup: number; observation: number; results: number; analysis: number; conclusion: number; bonus: number };
}
export interface ClassRecord { code: string; name: string; className: string; mode: Mode; score: number; bonus: number; tp: string; members: number; completedAt: string; addedAt: string }
export interface AppState { version: 1; session: Session | null; settings: TeacherSettings; soundEnabled: boolean; classRecords: ClassRecord[]; teacherPin: string }
export const defaultSettings: TeacherSettings = { hintsEnabled: true, scoreEnabled: true, allowedModes: 'both', maxMembers: 5, discussionCountdown: true };
export const roles = ['Ketua Eksperimen', 'Pengendali Bahan Maya', 'Pemerhati', 'Pencatat', 'Pembentang'];
export function assignRoles(members: Member[], rotation = 0): Member[] {
  const assigned = members.map(member => ({ ...member, roles: [] as string[] }));
  if (!assigned.length) return assigned;
  roles.forEach((role, i) => assigned[(i + rotation) % assigned.length].roles.push(role));
  return assigned;
}
export function createSession(mode: Mode, name: string, className: string, memberNames: string[]): Session {
  const now = new Date().toISOString();
  const emptyTube = (id: TubeId): TubeState => ({ id, materials: [], location: 'bench', waterAvailable: false, oxygenAvailable: true, temperatureC: 25, validated: false, attempts: 0, hintLevel: 0 });
  const tubes: Record<TubeId, TubeState> = { A: emptyTube('A'), B: emptyTube('B'), C: emptyTube('C'), D: emptyTube('D') };
  return { id: crypto.randomUUID(), mode, name: name.trim(), className: className.trim(), members: assignRoles(memberNames.map((name, i) => ({ id: `member-${i}`, name: name.trim(), roles: [], contributions: [] }))), roleRotation: 0, turnIndex: 0, createdAt: now, updatedAt: now, screen: mode === 'group' ? 'roles' : 'ready', step: 0, completedSteps: [], hypothesis: null, prediction: [], tubes, day: 1, observations: {}, results: {}, explanationAnswers: {}, conclusion: [], hintsUsed: 0, scores: { hypothesis: 0, setup: 0, observation: 0, results: 0, analysis: 0, conclusion: 0, bonus: 0 } };
}
// Educational seed example. These thresholds are not universal across species.
export function canGerminate(tube: TubeState): boolean { return tube.materials.includes('seed') && tube.waterAvailable && tube.oxygenAvailable && tube.temperatureC >= 15 && tube.temperatureC <= 35; }
