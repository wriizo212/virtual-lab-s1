import { defaultSettings, type AppState } from '../domain/model';
import { tubeIds } from '../domain/experiment';
import { defaultTeacherPin, normalizeSettings, normalizeTeacherPin } from '../domain/settings';
export const STORAGE_KEY = 'sci1-germination:v1';
export interface SessionRepository { load(): AppState; save(state: AppState): void; clear(): void }
export const initialState = (): AppState => ({ version: 1, session: null, settings: { ...defaultSettings }, soundEnabled: false, classRecords: [], teacherPin: defaultTeacherPin });
// Replace this adapter with a remote repository when a class dashboard is introduced.
export const localRepository: SessionRepository = {
  load() {
    try { const raw = localStorage.getItem(STORAGE_KEY); if (!raw) return initialState(); const data = JSON.parse(raw) as AppState;
      if (data.version !== 1 || !data.settings || (data.session && (!Array.isArray(data.session.members) || !data.session.tubes || !['individual', 'group'].includes(data.session.mode)))) return initialState();
      if (data.session) {
        if (!tubeIds.every(id => Array.isArray(data.session!.tubes[id]?.materials))) return initialState();
        data.session.setupTube ??= 'A';
        data.session.predictionMade ??= data.session.prediction.length > 0;
        data.session.maxDay ??= 1;
        data.session.inspectedTubes ??= [];
        data.session.analysisIndex ??= 0;
        data.session.analysisReviewed ??= [];
        data.session.analysisFirstAnswers ??= {};
        data.session.challengeRuns ??= [];
      }
      if (!Array.isArray(data.classRecords)) data.classRecords = [];
      else data.classRecords = data.classRecords.filter(record => record && typeof record.code === 'string' && typeof record.name === 'string' && typeof record.className === 'string');
      data.teacherPin = normalizeTeacherPin(data.teacherPin);
      return { ...initialState(), ...data, settings: normalizeSettings(data.settings) };
    } catch { return initialState(); }
  },
  save(state) { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); },
  clear() { localStorage.removeItem(STORAGE_KEY); },
};
