let audio:AudioContext|undefined;
export function playCue(kind:'drop'|'correct'|'wrong'|'complete') {
  try {
    audio??=new AudioContext();void audio.resume();
    const oscillator=audio.createOscillator(),gain=audio.createGain();
    const time=audio.currentTime,duration=kind==='complete'?.4:.12;
    oscillator.frequency.setValueAtTime(kind==='wrong'?180:kind==='drop'?420:660,time);
    if(kind==='complete')oscillator.frequency.exponentialRampToValueAtTime(990,time+.25);
    gain.gain.setValueAtTime(.04,time);gain.gain.exponentialRampToValueAtTime(.001,time+duration);
    oscillator.connect(gain);gain.connect(audio.destination);oscillator.start(time);oscillator.stop(time+duration);
  } catch { /* Sound is optional on browsers without Web Audio. */ }
}
