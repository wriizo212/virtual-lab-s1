import { useState } from 'react';
import { Megaphone, Square } from 'lucide-react';
import { useLab } from '../state/LabContext';
import { screenScript, speak, stopSpeaking } from '../domain/speech';
export function SpeakButton() {
  const { state } = useLab();
  const [speaking, setSpeaking] = useState(false);
  function toggle() {
    if (speaking) { stopSpeaking(); setSpeaking(false); return; }
    if (speak(screenScript(state.session?.screen), () => setSpeaking(false))) setSpeaking(true);
  }
  return <button className={`icon-button${speaking ? ' speaking' : ''}`} aria-label={speaking ? 'Berhenti baca arahan' : 'Baca arahan'} aria-pressed={speaking} title="Baca arahan dengan suara" onClick={toggle}>{speaking ? <Square size={20}/> : <Megaphone size={20}/>}</button>;
}
