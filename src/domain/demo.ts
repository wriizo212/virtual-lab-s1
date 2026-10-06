import { createSession } from './model';
import { recipes, tubeIds, deriveConditions } from './experiment';
import { expectedResult } from './simulation';
import { analysisQuestions, finishSession } from './learning';
// Separate example data; never written to the active pupil session.
export function exampleReport() {
  const session = createSession('individual', 'Contoh murid', '1 Bestari', []);
  for (const id of tubeIds) {
    session.tubes[id] = deriveConditions({...session.tubes[id], materials:[...recipes[id].required], location:recipes[id].location, placementConfirmed:true, validated:true, attempts:1});
    session.observations[id] = id === 'A';
    session.results[id] = expectedResult(session.tubes[id]);
  }
  session.hypothesis=1; session.prediction=['A']; session.predictionMade=true;
  session.completedSteps=[0,1,2,3,4,5,6,7]; session.day=5; session.maxDay=5;
  session.explanationAnswers=Object.fromEntries(analysisQuestions.map(q=>[q.id,q.answer]));
  session.analysisFirstAnswers={...session.explanationAnswers}; session.analysisReviewed=analysisQuestions.map(q=>q.id);
  session.conclusion=['AIR','OKSIGEN','SUHU']; session.conclusionChecked=true; session.conclusionAttempts=1;
  session.scores={hypothesis:2,setup:8,observation:4,results:8,analysis:4,conclusion:4,bonus:0};
  return {...finishSession(session),resultCode:'CONTOH-SAHAJA'};
}
