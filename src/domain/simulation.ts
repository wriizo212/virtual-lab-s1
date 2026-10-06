import { canGerminate, type ResultField, type ResultRow, type Session, type TubeId, type TubeState } from './model';
import { deriveConditions, isSetupCorrect, tubeIds } from './experiment';
import { clearLearningEvidence } from './invalidation';
export const resultFields: ResultField[] = ['water', 'oxygen', 'temperature', 'germination'];
export const resultLabels: Record<ResultField, string> = { water: 'Air', oxygen: 'Udara (oksigen)', temperature: 'Suhu sesuai', germination: 'Percambahan' };
export function germinationStage(tube: TubeState, day: number): number {
  const conditions = deriveConditions(tube);
  return canGerminate(conditions) ? Math.max(0, Math.min(4, Math.trunc(day) - 1)) : 0;
}
export function expectedResult(tube: TubeState): Required<ResultRow> {
  const conditions = deriveConditions(tube);
  return { water: conditions.waterAvailable, oxygen: conditions.oxygenAvailable, temperature: conditions.temperatureC >= 15 && conditions.temperatureC <= 35, germination: germinationStage(tube, 5) >= 2 };
}
export function canStartExperiment(session: Session): boolean {
  return session.hypothesis !== null && !!session.predictionMade && session.completedSteps.includes(1) && tubeIds.every(id => session.tubes[id].validated && isSetupCorrect(session.tubes[id]));
}
export function startExperiment(session: Session): Session {
  if (!canStartExperiment(session)) return session;
  if (session.experimentStartedAt) return { ...session, screen: 'simulation', step: 3 };
  return { ...session, experimentStartedAt: new Date().toISOString(), day: 1, maxDay: 1, screen: 'simulation', step: 3 };
}
export function advanceDay(session: Session, day = session.day + 1): Session {
  if (!session.experimentStartedAt) return session;
  const nextDay = Math.max(1, Math.min(5, Math.trunc(day)));
  // New days must be reached sequentially; earlier days may be revisited.
  if (nextDay > (session.maxDay ?? 1) + 1) return session;
  const maxDay = Math.max(session.maxDay ?? 1, nextDay);
  return { ...session, day: nextDay, maxDay, completedSteps: maxDay === 5 ? [...new Set([...session.completedSteps, 3])] : session.completedSteps };
}
export function observationsComplete(session: Session): boolean {
  return session.maxDay === 5 && tubeIds.every(id => session.inspectedTubes?.includes(id) && typeof session.observations[id] === 'boolean');
}
export function recordObservation(session: Session, id: TubeId, value: boolean): Session {
  if (session.maxDay !== 5) return session;
  if (session.observations[id] === value && session.inspectedTubes?.includes(id)) return session;
  const cleared=clearLearningEvidence(session);
  return { ...cleared, observations: { ...session.observations, [id]: value }, inspectedTubes: [...new Set([...(session.inspectedTubes ?? []), id])], completedSteps: session.completedSteps.filter(step => step < 4), scores: { ...cleared.scores, observation: 0, results: 0 }, resultsCheck: undefined, predictionComparison: undefined };
}
export function finishObservations(session: Session): Session {
  if (!observationsComplete(session)) return session;
  const score = tubeIds.filter(id => session.observations[id] === expectedResult(session.tubes[id]).germination).length;
  return { ...session, screen: 'results', step: 5, scores: { ...session.scores, observation: score }, completedSteps: [...new Set([...session.completedSteps, 4])] };
}
export function resultsComplete(session: Session): boolean {
  return tubeIds.every(id => resultFields.every(field => typeof session.results[id]?.[field] === 'boolean'));
}
export function editResult(session: Session, id: TubeId, field: ResultField, value: boolean): Session {
  if (session.results[id]?.[field]===value) return session;
  const cleared=clearLearningEvidence(session);
  return { ...cleared, results: { ...session.results, [id]: { ...session.results[id], [field]: value } }, resultsCheck: undefined, predictionComparison: undefined, scores: { ...cleared.scores, results: 0 }, completedSteps: session.completedSteps.filter(step => step < 5) };
}
export function checkResults(session: Session): Session {
  if (!resultsComplete(session) || !session.completedSteps.includes(4)) return session;
  let correct = 0; let focus: { tubeId: TubeId; field: ResultField } | undefined;
  for (const id of tubeIds) for (const field of resultFields) {
    if (session.results[id]?.[field] === expectedResult(session.tubes[id])[field]) correct++;
    else focus ??= { tubeId: id, field };
  }
  return { ...session, resultsCheck: { correct, total: 16, focus }, scores: { ...session.scores, results: correct / 2 }, completedSteps: correct === 16 ? [...new Set([...session.completedSteps, 5])] : session.completedSteps.filter(step => step < 5) };
}
export function predictionMatches(session: Session): boolean {
  const actual = tubeIds.filter(id => expectedResult(session.tubes[id]).germination);
  return session.prediction.length === actual.length && actual.every(id => session.prediction.includes(id));
}
