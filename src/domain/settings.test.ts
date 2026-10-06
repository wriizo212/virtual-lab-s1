import { describe,it,expect } from 'vitest';
import { bakedTeacherPinHash, normalizeSettings, normalizeTeacherPin, sha256Hex, verifyTeacherPin } from './settings';
import { defaultSettings } from './model';
import { exampleReport } from './demo';
describe('teacher configuration',()=>{
  it('normalizes old and corrupt settings without invalid group sizes',()=>{
    expect(normalizeSettings({})).toEqual(defaultSettings);
    expect(normalizeSettings({maxMembers:1})).toMatchObject({maxMembers:2});
    expect(normalizeSettings({maxMembers:99})).toMatchObject({maxMembers:5});
    expect(normalizeSettings({maxMembers:NaN,allowedModes:'invalid' as never,scoreEnabled:'false' as never})).toEqual(defaultSettings);
  });
  it('normalizes the teacher PIN and keeps the 1234 default',()=>{
    expect(normalizeTeacherPin('5678')).toBe('5678');
    expect(normalizeTeacherPin('123456')).toBe('123456');
    expect(normalizeTeacherPin('12')).toBe('1234');
    expect(normalizeTeacherPin('abcd')).toBe('1234');
    expect(normalizeTeacherPin(undefined)).toBe('1234');
  });
  it('verifies teacher PINs against the device pin and an optional baked lock',async()=>{
    expect(bakedTeacherPinHash()).toBe('');
    expect(await verifyTeacherPin('1234','1234')).toBe(true);
    expect(await verifyTeacherPin('1234','2468')).toBe(false);
    expect(await verifyTeacherPin('2468','2468')).toBe(true);
    const baked=await sha256Hex('919293');
    expect(baked).toMatch(/^[0-9a-f]{64}$/);
    expect(await verifyTeacherPin('919293','1234',baked)).toBe(true);
    expect(await verifyTeacherPin('1234','1234',baked)).toBe(false);
    expect(await verifyTeacherPin('2468','2468',baked)).toBe(true);
    expect(await verifyTeacherPin('1111','2468',baked)).toBe(false);
  });
  it('creates a separate complete example report each time',()=>{
    const a=exampleReport(),b=exampleReport();expect(a.id).not.toBe(b.id);expect(a.completedAt).toBeTruthy();expect(a.scores.analysis).toBe(4);expect(a.conclusion).toEqual(['AIR','OKSIGEN','SUHU']);
  });
});
