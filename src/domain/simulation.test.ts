import { describe, expect, it } from 'vitest';
import { createSession } from './model';
import { editMaterial, getHint, placeTube, recipes, tubeIds, updateTube, validateTube } from './experiment';
import { advanceDay, canStartExperiment, checkResults, editResult, expectedResult, finishObservations, germinationStage, observationsComplete, predictionMatches, recordObservation, resultFields, startExperiment } from './simulation';
function prepared() {
  let session = createSession('individual', 'Aina', '1A', []);
  session = { ...session, hypothesis: 1, predictionMade: true, prediction: ['A'], completedSteps: [0,1] };
  for (const id of tubeIds) {
    let tube = session.tubes[id]; for (const material of recipes[id].required) tube = editMaterial(tube, material).tube;
    session = updateTube(session, validateTube(placeTube(tube, recipes[id].location)));
  }
  return session;
}
describe('simulation evidence and learning gates', () => {
  it('requires completed setup and learner input before start', () => {
    const empty = createSession('individual', 'Aina', '1A', []); expect(startExperiment(empty)).toBe(empty);
    expect(advanceDay(empty)).toBe(empty); expect(canStartExperiment(prepared())).toBe(true);
    const invalid = prepared(); invalid.tubes.C.materials = ['seed', 'water', 'oil'];
    expect(canStartExperiment(invalid)).toBe(false);
  });
  it('reaches days sequentially, allows review, caps day and resumes without resetting', () => {
    let session = startExperiment(prepared()); expect(session.day).toBe(1); expect(advanceDay(session,5)).toBe(session);
    for (let i = 0; i < 4; i++) session = advanceDay(session);
    expect(session.day).toBe(5); expect(session.completedSteps).toContain(3);
    expect(advanceDay(session).day).toBe(5);
    session = advanceDay(session,2); expect(session.maxDay).toBe(5);
    expect(startExperiment(session).day).toBe(2);
  });
  it('uses state, rather than tube label, for growth and oxygen outcome', () => {
    const session = prepared(); expect([1,2,3,4,5].map(day => germinationStage(session.tubes.A,day))).toEqual([0,1,2,3,4]);
    for (const id of ['B','C','D'] as const) expect(germinationStage(session.tubes[id],5)).toBe(0);
    const altered = { ...session.tubes.B, materials: ['seed','wetCotton'] as typeof session.tubes.B.materials };
    expect(germinationStage(altered,5)).toBe(4);
    expect(expectedResult(session.tubes.C)).toEqual({ water:true,oxygen:false,temperature:true,germination:false });
  });
  it('requires day five and four inspections, preserving incorrect observations for later reflection', () => {
    let session = startExperiment(prepared()); expect(recordObservation(session,'A',true)).toBe(session);
    for (let i=0;i<4;i++) session=advanceDay(session);
    expect(observationsComplete(session)).toBe(false);
    for (const id of tubeIds) session=recordObservation(session,id,false);
    expect(observationsComplete(session)).toBe(true);
    session=finishObservations(session); expect(session.scores.observation).toBe(3); expect(session.screen).toBe('results');
  });
  it('checks 16 cells with one focus hint, and resets check on edits', () => {
    let session=startExperiment(prepared()); for(let i=0;i<4;i++) session=advanceDay(session);
    for(const id of tubeIds) session=recordObservation(session,id,id==='A'); session=finishObservations(session);
    expect(checkResults(session)).toBe(session);
    for(const id of tubeIds) for(const field of resultFields) session=editResult(session,id,field,expectedResult(session.tubes[id])[field]);
    session=editResult(session,'C','oxygen',true); session=checkResults(session);
    expect(session.resultsCheck).toEqual({correct:15,total:16,focus:{tubeId:'C',field:'oxygen'}});
    expect(session.scores.results).toBe(7.5); expect(session.completedSteps).not.toContain(5);
    session=editResult(session,'C','oxygen',false); expect(session.resultsCheck).toBeUndefined();
    session=checkResults(session); expect(session.scores.results).toBe(8); expect(session.completedSteps).toContain(5);
  });
  it('physical setup changes invalidate downstream evidence but a hint leaves it intact', () => {
    let session=startExperiment(prepared()); for(let i=0;i<4;i++) session=advanceDay(session);
    session=recordObservation(session,'A',true);
    const hinted=updateTube(session,getHint(session.tubes.A).tube);
    expect(hinted.experimentStartedAt).toBe(session.experimentStartedAt); expect(hinted.observations.A).toBe(true);
    const edited=updateTube(session,editMaterial(session.tubes.D,'wetCotton',true).tube);
    expect(edited.experimentStartedAt).toBeUndefined(); expect(edited.day).toBe(1); expect(edited.observations).toEqual({}); expect(edited.completedSteps).toEqual([0,1]);
  });
  it('compares original prediction as a set and accepts none without penalizing it', () => {
    const session=prepared(); expect(predictionMatches(session)).toBe(true);
    expect(predictionMatches({...session,prediction:['A','C']})).toBe(false);
    expect(predictionMatches({...session,prediction:[]})).toBe(false);
  });
});
