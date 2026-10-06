import { describe, expect, it } from 'vitest';
import { createSession, canGerminate, type TubeId } from './model';
import { editMaterial, getHint, isSetupCorrect, placeTube, recipes, setupMember, tubeIds, updateTube, validateTube } from './experiment';
describe('apparatus preparation', () => {
  for (const id of tubeIds) it(`validates ${id} only after all required materials and placement`, () => {
    let tube = createSession('individual', 'Ali', '1A', []).tubes[id];
    for (const material of recipes[id].required) tube = editMaterial(tube, material).tube;
    expect(isSetupCorrect(tube)).toBe(false);
    tube = placeTube(tube, recipes[id].location);
    expect(isSetupCorrect(tube)).toBe(true);
    expect(validateTube(tube).validated).toBe(true);
    expect(canGerminate(tube)).toBe(id === 'A');
    expect(isSetupCorrect(editMaterial(tube, id === 'C' ? 'dryCotton' : 'water').tube)).toBe(false);
  });
  it('rejects floating oil before liquid and removes oil when liquid is removed', () => {
    const empty = createSession('individual', 'Ali', '1A', []).tubes.C;
    expect(editMaterial(empty, 'oil').changed).toBe(false);
    let tube = editMaterial(empty, 'cooledBoiledWater').tube;
    tube = editMaterial(tube, 'oil').tube; expect(tube.oxygenAvailable).toBe(false);
    tube = editMaterial(tube, 'cooledBoiledWater', true).tube;
    expect(tube.materials).toEqual([]); expect(tube.oxygenAvailable).toBe(true); expect(tube.waterAvailable).toBe(false);
  });
  it('prevents duplicate material and invalidates prior validation after editing', () => {
    let tube = createSession('individual', 'Ali', '1A', []).tubes.B;
    tube = editMaterial(tube, 'seed').tube; tube = editMaterial(tube, 'dryCotton').tube;
    tube = validateTube(placeTube(tube, 'bench')); expect(tube.validated).toBe(true);
    expect(editMaterial(tube, 'seed').tube).toBe(tube);
    expect(editMaterial(tube, 'dryCotton', true).tube.validated).toBe(false);
    expect(placeTube(tube, 'fridge').temperatureC).toBe(5);
  });
  it('requires attempts between progressively clearer hints and caps hint counts', () => {
    let tube = createSession('individual', 'Ali', '1A', []).tubes.A;
    let hint = getHint(tube); expect(hint.counted).toBe(true); tube = hint.tube;
    expect(getHint(tube).counted).toBe(false);
    tube = validateTube(tube); hint = getHint(tube); tube = hint.tube; expect(tube.hintLevel).toBe(2);
    expect(getHint(tube).counted).toBe(false);
    tube = validateTube(tube); tube = getHint(tube).tube;
    expect(tube.hintLevel).toBe(3); expect(getHint(tube).counted).toBe(false);
  });
  it('scores 8 only for complete setup and revokes completion on edit', () => {
    let session = createSession('individual', 'Ali', '1A', []);
    for (const id of tubeIds) {
      let tube = session.tubes[id]; for (const material of recipes[id].required) tube = editMaterial(tube, material).tube;
      session = updateTube(session, validateTube(placeTube(tube, recipes[id].location)));
    }
    expect(session.scores.setup).toBe(8); expect(session.completedSteps).toContain(2);
    session = updateTube(session, editMaterial(session.tubes.D, 'wetCotton', true).tube);
    expect(session.scores.setup).toBe(6); expect(session.completedSteps).not.toContain(2);
  });
  it('rotates tube handling from the assigned operator to other group members', () => {
    const session = createSession('group', 'Tunas', '1A', ['Ali', 'Siti', 'Mei']);
    expect((['A','B','C'] as TubeId[]).map(id => setupMember(session, id).name)).toEqual(['Siti','Mei','Ali']);
  });
});
