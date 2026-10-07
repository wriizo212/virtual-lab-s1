let audio:AudioContext|undefined;
type Cue='drop'|'correct'|'wrong'|'complete'|'win'|'pour'|'day';
export function playCue(kind:Cue) {
  try {
    audio??=new AudioContext();void audio.resume();
    const context=audio,time=context.currentTime;
    const tone=(frequency:number,at:number,duration:number,type:OscillatorType,volume:number)=>{
      const oscillator=context.createOscillator(),gain=context.createGain();
      oscillator.type=type;oscillator.frequency.setValueAtTime(frequency,time+at);
      gain.gain.setValueAtTime(volume,time+at);gain.gain.exponentialRampToValueAtTime(.001,time+at+duration);
      oscillator.connect(gain);gain.connect(context.destination);oscillator.start(time+at);oscillator.stop(time+at+duration);
    };
    if(kind==='win'){tone(523.25,0,.28,'sine',.045);tone(659.25,.13,.28,'sine',.045);tone(783.99,.26,.5,'sine',.05);return;}
    if(kind==='day'){tone(392,0,.09,'triangle',.02);return;}
    if(kind==='pour'){tone(310,0,.1,'triangle',.035);tone(250,.06,.14,'triangle',.028);return;}
    const oscillator=context.createOscillator(),gain=context.createGain();
    const duration=kind==='complete'?.4:.12;
    oscillator.frequency.setValueAtTime(kind==='wrong'?180:kind==='drop'?420:660,time);
    if(kind==='complete')oscillator.frequency.exponentialRampToValueAtTime(990,time+.25);
    gain.gain.setValueAtTime(.04,time);gain.gain.exponentialRampToValueAtTime(.001,time+duration);
    oscillator.connect(gain);gain.connect(context.destination);oscillator.start(time);oscillator.stop(time+duration);
  } catch { /* Sound is optional on browsers without Web Audio. */ }
}
