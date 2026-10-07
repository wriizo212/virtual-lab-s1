import { playCue } from '../sound';

// Ephemeral celebration helpers: device vibration, the confetti overlay event
// and a one-call convenience wrapper. Everything degrades gracefully.
let pending: 'normal' | 'big' | null = null;
export function buzz(pattern: number | number[]) {
  try { if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(pattern); } catch { /* unsupported */ }
}
export function launchConfetti(intensity: 'normal' | 'big' = 'normal') {
  // Queue it too: a launch that happens before the overlay mounts (e.g. the
  // app boots straight into the final screen) must still be seen.
  pending = intensity;
  try { window.dispatchEvent(new CustomEvent('vlab:confetti', { detail: { intensity } })); } catch { /* no window */ }
}
export function consumePendingConfetti(): 'normal' | 'big' | null {
  const value = pending; pending = null; return value;
}
export function celebrate(soundEnabled: boolean, options: { cue?: 'win' | 'correct'; confetti?: 'normal' | 'big' | false; vibrate?: number[] | false } = {}) {
  const { cue, confetti = 'normal', vibrate = [16, 50, 16] } = options;
  if (soundEnabled && cue) playCue(cue);
  if (confetti) launchConfetti(confetti);
  if (vibrate) buzz(vibrate);
}
