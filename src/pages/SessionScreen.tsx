import { useLab } from '../state/LabContext';
import { RoleAssignment } from '../components/RoleAssignment';
import { Ready } from './Ready';
import { Hypothesis } from './Hypothesis';
import { Prediction } from './Prediction';
import { Setup } from './Setup';
import { SetupComplete } from './SetupComplete';
import { Simulation } from './Simulation';
import { Observation } from './Observation';
import { Results } from './Results';
import { Comparison } from './Comparison';
import { Explanation } from './Explanation';
import { Conclusion } from './Conclusion';
import { Challenge } from './Challenge';
import { FinalResults } from './FinalResults';
import { FinalReport } from './FinalReport';
import { readyForAnalysis } from '../domain/learning';
export function SessionScreen({ onHome }: { onHome: () => void }) {
  const { state } = useLab();
  switch (state.session?.screen) {
    case 'roles': return <RoleAssignment/>;
    case 'hypothesis': return <Hypothesis/>;
    case 'prediction': return <Prediction/>;
    case 'setup': return <Setup/>;
    case 'setupComplete': return <SetupComplete/>;
    case 'simulation': return state.session.experimentStartedAt ? <Simulation/> : <SetupComplete/>;
    case 'observation': return state.session.maxDay === 5 ? <Observation/> : state.session.experimentStartedAt ? <Simulation/> : <SetupComplete/>;
    case 'results': return state.session.completedSteps.includes(4) ? <Results/> : state.session.maxDay === 5 ? <Observation/> : <SetupComplete/>;
    case 'comparison': return state.session.resultsCheck?.correct === 16 ? <Comparison/> : <Results/>;
    case 'explanation': return readyForAnalysis(state.session) ? <Explanation/> : <Comparison/>;
    case 'conclusion': return state.session.completedSteps.includes(6) ? <Conclusion/> : <Explanation/>;
    case 'challenge': return state.session.completedSteps.includes(7) ? <Challenge/> : <Conclusion/>;
    case 'final': return state.session.completedAt ? <FinalResults/> : <Challenge/>;
    case 'report': return state.session.completedAt ? <FinalReport/> : <Challenge/>;
    default: return <Ready onHome={onHome}/>;
  }
}
