import { describe, expect, it } from 'vitest';
import { assignRoles, canGerminate, createSession, roles } from './model';
describe('session and collaboration', () => {
 it('creates an individual without group members or exposed answers', () => { const s = createSession('individual',' Ali ','1 A',[]); expect(s.name).toBe('Ali'); expect(s.members).toEqual([]); expect(s.hypothesis).toBeNull(); expect(s.screen).toBe('ready'); expect(Object.keys(s.tubes)).toHaveLength(4); });
 for (const count of [2,3,4,5]) it(`distributes all five roles fairly across ${count} members`, () => { const s = createSession('group','Tunas','1 A',Array.from({length:count},(_,i)=>`Ahli ${i}`)); expect(s.members.flatMap(m=>m.roles).sort()).toEqual([...roles].sort()); expect(s.members.every(m=>m.roles.length>0)).toBe(true); const rotated = assignRoles(s.members,1); expect(rotated[1].roles).toContain('Ketua Eksperimen'); expect(rotated.map(m=>m.name)).toEqual(s.members.map(m=>m.name)); });
 it('uses seed, water, oxygen and temperature state for germination', () => { const tube = createSession('individual','Ali','1A',[]).tubes.A; tube.materials=['seed']; tube.waterAvailable=true; expect(canGerminate(tube)).toBe(true); tube.oxygenAvailable=false; expect(canGerminate(tube)).toBe(false); tube.oxygenAvailable=true; tube.temperatureC=5; expect(canGerminate(tube)).toBe(false); });
});
