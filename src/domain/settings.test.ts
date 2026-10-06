import { describe,it,expect } from 'vitest';
import { normalizeSettings } from './settings';
import { defaultSettings } from './model';
import { exampleReport } from './demo';
describe('teacher configuration',()=>{
  it('normalizes old and corrupt settings without invalid group sizes',()=>{
    expect(normalizeSettings({})).toEqual(defaultSettings);
    expect(normalizeSettings({maxMembers:1})).toMatchObject({maxMembers:2});
    expect(normalizeSettings({maxMembers:99})).toMatchObject({maxMembers:5});
    expect(normalizeSettings({maxMembers:NaN,allowedModes:'invalid' as never,scoreEnabled:'false' as never})).toEqual(defaultSettings);
  });
  it('creates a separate complete example report each time',()=>{
    const a=exampleReport(),b=exampleReport();expect(a.id).not.toBe(b.id);expect(a.completedAt).toBeTruthy();expect(a.scores.analysis).toBe(4);expect(a.conclusion).toEqual(['AIR','OKSIGEN','SUHU']);
  });
});
