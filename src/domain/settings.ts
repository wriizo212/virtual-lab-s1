import { defaultSettings, type TeacherSettings } from './model';
export function normalizeSettings(raw:Partial<TeacherSettings>):TeacherSettings {
  return {
    hintsEnabled:typeof raw.hintsEnabled==='boolean'?raw.hintsEnabled:defaultSettings.hintsEnabled,
    scoreEnabled:typeof raw.scoreEnabled==='boolean'?raw.scoreEnabled:defaultSettings.scoreEnabled,
    discussionCountdown:typeof raw.discussionCountdown==='boolean'?raw.discussionCountdown:defaultSettings.discussionCountdown,
    allowedModes:['both','individual','group'].includes(raw.allowedModes??'')?raw.allowedModes!:defaultSettings.allowedModes,
    maxMembers:Number.isInteger(raw.maxMembers)?Math.max(2,Math.min(5,raw.maxMembers!)):defaultSettings.maxMembers,
  };
}
