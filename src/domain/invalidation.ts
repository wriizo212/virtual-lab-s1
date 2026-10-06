import type { Session } from './model';
export function clearLearningEvidence(session:Session):Session {
  return { ...session,explanationAnswers:{},analysisIndex:0,analysisReviewed:[],analysisFirstAnswers:{},conclusion:[],conclusionChecked:false,conclusionAttempts:0,
    challengeConfig:undefined,challengeRuns:[],completedAt:undefined,resultCode:undefined,reflectionReviewed:false,
    members:session.members.map(member=>({...member,contributions:[]})),
    scores:{...session.scores,hypothesis:0,analysis:0,conclusion:0,bonus:0} };
}
