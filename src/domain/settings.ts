import { defaultSettings, type TeacherSettings } from './model';
export const defaultTeacherPin = '1234';
export function normalizeTeacherPin(raw: unknown): string {
  return typeof raw === 'string' && /^\d{4,6}$/.test(raw) ? raw : defaultTeacherPin;
}
export async function sha256Hex(text: string): Promise<string> {
  if (!globalThis.crypto?.subtle) return '';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('');
}
// Optional build-time teacher lock (VITE_VLAB_PIN_HASH via .env.local); the app
// only ever carries the SHA-256 hash, never the PIN itself. Production builds
// only: dev servers and unit tests must never inherit a stray .env.local
// (their suites log in with the 1234 default).
export function bakedTeacherPinHash(): string {
  if (!import.meta.env.PROD) return '';
  return String(import.meta.env.VITE_VLAB_PIN_HASH ?? '').toLowerCase();
}
export async function verifyTeacherPin(pin: string, storedPin: string, baked: string = bakedTeacherPinHash()): Promise<boolean> {
  if (/^[0-9a-f]{64}$/.test(baked)) {
    if (storedPin !== defaultTeacherPin && pin === storedPin) return true;
    return (await sha256Hex(pin)) === baked;
  }
  return pin === storedPin;
}
export function normalizeSettings(raw:Partial<TeacherSettings>):TeacherSettings {
  return {
    hintsEnabled:typeof raw.hintsEnabled==='boolean'?raw.hintsEnabled:defaultSettings.hintsEnabled,
    scoreEnabled:typeof raw.scoreEnabled==='boolean'?raw.scoreEnabled:defaultSettings.scoreEnabled,
    discussionCountdown:typeof raw.discussionCountdown==='boolean'?raw.discussionCountdown:defaultSettings.discussionCountdown,
    allowedModes:['both','individual','group'].includes(raw.allowedModes??'')?raw.allowedModes!:defaultSettings.allowedModes,
    maxMembers:Number.isInteger(raw.maxMembers)?Math.max(2,Math.min(5,raw.maxMembers!)):defaultSettings.maxMembers,
  };
}
