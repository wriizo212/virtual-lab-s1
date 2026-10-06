import { describe,expect,it } from 'vitest';
import { createSession } from './model';
import { editMaterial,placeTube,recipes,tubeIds,updateTube,validateTube } from './experiment';
import { advanceDay,checkResults,editResult,expectedResult,finishObservations,recordObservation,resultFields,startExperiment } from './simulation';
import { analysisQuestions,checkAnalysis,checkChallenge,checkConclusion,conclusionSlots,defaultChallenge,editAnalysis,evaluateChallenge,finishSession,isConclusionCorrect,mainScore,pbdSuggestion,placeConclusionWord,selectChallengeFactor,setPredictionComparison,testChallenge,toggleContribution } from './learning';
function ready() {
  let s=createSession('individual','Aina','1A',[]);
  s={...s,hypothesis:1,predictionMade:true,prediction:['A','C'],completedSteps:[0,1]};
  for(const id of tubeIds) {let tube=s.tubes[id];for(const material of recipes[id].required)tube=editMaterial(tube,material).tube;s=updateTube(s,validateTube(placeTube(tube,recipes[id].location)));}
  s=startExperiment(s);for(let i=0;i<4;i++)s=advanceDay(s);
  for(const id of tubeIds)s=recordObservation(s,id,id==='A');s=finishObservations(s);
  for(const id of tubeIds)for(const field of resultFields)s=editResult(s,id,field,expectedResult(s.tubes[id])[field]);
  return setPredictionComparison(checkResults(s),false);
}
function coreComplete() {
  let s=ready();for(const q of analysisQuestions){s=editAnalysis(s,q.id,q.answer);s=checkAnalysis(s,q.id);}
  for(const [slot,word] of ['AIR','OKSIGEN','SUHU'].entries())s=placeConclusionWord(s,word,slot);
  return checkConclusion(s);
}
describe('explain, conclude, challenge and report',()=>{
  it('requires comparison and records first analysis answers independently of corrections',()=>{
    const blank=createSession('individual','Aina','1A',[]);expect(checkAnalysis(blank,'water')).toBe(blank);
    let s=ready();s=checkAnalysis(editAnalysis(s,'water','0'),'water');expect(s.scores.analysis).toBe(0);
    s=checkAnalysis(editAnalysis(s,'water','1'),'water');expect(s.analysisFirstAnswers?.water).toBe('0');expect(s.explanationAnswers.water).toBe('1');expect(s.scores.analysis).toBe(0);
    for(const q of analysisQuestions.slice(1))s=checkAnalysis(editAnalysis(s,q.id,q.answer),q.id);
    expect(s.scores.analysis).toBe(3);expect(s.completedSteps).toContain(6);
  });
  it('moves and swaps tokens without duplicates, accepts AIR/OKSIGEN in either order',()=>{
    let s=ready();s=placeConclusionWord(s,'AIR',0);s=placeConclusionWord(s,'OKSIGEN',1);s=placeConclusionWord(s,'SUHU',2);
    s=placeConclusionWord(s,'AIR',1);expect(conclusionSlots(s)).toEqual(['OKSIGEN','AIR','SUHU']);expect(isConclusionCorrect(s)).toBe(true);
    s=placeConclusionWord(s,'SUHU',0);expect(conclusionSlots(s)).toEqual(['SUHU','AIR','OKSIGEN']);expect(isConclusionCorrect(s)).toBe(false);
    expect(placeConclusionWord(s,'CAHAYA',0)).toBe(s);
  });
  it('awards conclusion once, and rejects a complete sentence before analysis',()=>{
    let s=ready();for(const [slot,word]of ['AIR','OKSIGEN','SUHU'].entries())s=placeConclusionWord(s,word,slot);
    expect(checkConclusion(s)).toBe(s);s=coreComplete();expect(s.scores.conclusion).toBe(4);expect(checkConclusion(s)).toBe(s);
  });
  it.each([
    [{water:'suitable',oxygen:true,temperature:25},true,false,['allMet']],
    [{water:'suitable',oxygen:true,temperature:15},true,true,['temperature']],
    [{water:'none',oxygen:true,temperature:25},false,false,['water']],
    [{water:'little',oxygen:true,temperature:25},false,false,['water']],
    [{water:'excess',oxygen:true,temperature:25},false,false,['water','oxygen']],
    [{water:'suitable',oxygen:false,temperature:25},false,false,['oxygen']],
    [{water:'suitable',oxygen:true,temperature:5},false,false,['temperature']],
    [{water:'suitable',oxygen:true,temperature:40},false,false,['temperature']],
    [{water:'none',oxygen:false,temperature:70},false,false,['water','oxygen','temperature']],
  ] as const)('simulates educational challenge conditions %j',(config,germinated,slow,factors)=>{
    expect(evaluateChallenge({...config})).toEqual({germinated,slow,limitingFactors:[...factors]});
  });
  it('caps bonus at two, preserves tested conditions and requires current draft to be tested',()=>{
    let s=testChallenge(coreComplete());s=selectChallengeFactor(s,'allMet');s=checkChallenge(s);expect(s.scores.bonus).toBe(2);
    s=checkChallenge(s);expect(s.scores.bonus).toBe(2);
    s={...s,challengeConfig:{...defaultChallenge,temperature:70}};const old=s.challengeRuns?.at(-1);
    expect(old?.config.temperature).toBe(25);expect(checkChallenge(s)).toBe(s);
    s=testChallenge(s);s=selectChallengeFactor(s,'temperature');s=checkChallenge(s);expect(s.scores.bonus).toBe(2);expect(s.challengeRuns?.at(-1)?.explained).toBe(true);
    for(let i=0;i<25;i++)s=testChallenge(s);expect(s.challengeRuns).toHaveLength(20);
  });
  it('computes 30-point main score separately from bonus and creates stable completion metadata',()=>{
    const incomplete=ready();expect(finishSession(incomplete)).toBe(incomplete);
    let s=finishSession(coreComplete());expect(mainScore(s)).toBe(30);expect(s.resultCode).toMatch(/^SCI1-GERM-[A-F0-9]{7}$/);
    expect(finishSession(s).resultCode).toBe(s.resultCode);expect(finishSession(s).completedAt).toBe(s.completedAt);
    s=selectChallengeFactor(testChallenge(s),'allMet');s=finishSession(checkChallenge(s));expect(mainScore(s)).toBe(30);expect(s.scores.bonus).toBe(2);
  });
  it('invalidates completion, challenges and all later scoring after editing evidence',()=>{
    let s=finishSession(coreComplete());s=checkChallenge(selectChallengeFactor(testChallenge(s),'allMet'));
    const changed=editResult(s,'C','oxygen',true);expect(changed.completedAt).toBeUndefined();expect(changed.scores.bonus).toBe(0);expect(changed.challengeRuns).toEqual([]);expect(changed.analysisFirstAnswers).toEqual({});
    const physical=updateTube(s,editMaterial(s.tubes.D,'wetCotton',true).tube);expect(physical.scores.hypothesis).toBe(0);expect(physical.completedAt).toBeUndefined();expect(physical.challengeRuns).toEqual([]);
    const analysis=editAnalysis(s,'water','0');expect(analysis.conclusionChecked).toBe(false);expect(analysis.completedAt).toBeUndefined();expect(analysis.scores.bonus).toBe(0);
  });
  it('treats contribution checkboxes as reflection, without scoring penalties',()=>{
    const group=createSession('group','Tunas','1A',['Ali','Siti']);const changed=toggleContribution(group,group.members[0].id,'Membina eksperimen');
    expect(changed.members[0].contributions).toEqual(['Membina eksperimen']);expect(changed.scores).toEqual(group.scores);
    expect(toggleContribution(changed,group.members[0].id,'Membina eksperimen').members[0].contributions).toEqual([]);
  });
  it('suggests TP from explanation and transfer evidence rather than total score alone',()=>{
    let s=coreComplete();expect(pbdSuggestion(s).tp).toBe('TP4');s=checkChallenge(selectChallengeFactor(testChallenge(s),'allMet'));
    expect(pbdSuggestion(s).tp).toBe('TP5');expect(pbdSuggestion({...s,scores:{...s.scores,hypothesis:0,observation:0}}).tp).toBe('TP5');
  });
});
