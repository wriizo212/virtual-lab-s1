// Offline voice narration for the current step (Web Speech API — uses the
// device voices; nothing is fetched from the network).
const scripts: Record<string, string> = {
  default: 'Selamat datang ke Virtual Lab Sains Tingkatan satu. Pilih individu atau kumpulan untuk memulakan penyiasatan.',
  roles: 'Agihkan peranan setiap ahli kumpulan sebelum meneruskan.',
  ready: 'Tekan butang Mulakan penyiasatan apabila anda sudah bersedia.',
  hypothesis: 'Apakah yang anda jangkakan? Pilih satu hipotesis tentang syarat percambahan.',
  prediction: 'Ramalkan tabung manakah akan bercambah selepas lima hari.',
  setup: 'Sediakan empat tabung mengikut protokol. Seret bahan ke dalam tabung yang betul.',
  setupComplete: 'Semak penyediaan anda, kemudian mulakan eksperimen.',
  simulation: 'Perhatikan perubahan pada setiap tabung selama lima hari simulasi.',
  observation: 'Rekod pemerhatian anda untuk setiap tabung dengan teliti.',
  results: 'Lengkapkan jadual keputusan enam belas sel, kemudian semak jawapan.',
  comparison: 'Bandingkan ramalan awal anda dengan keputusan eksperimen.',
  explanation: 'Jawab empat soalan analisis dan fikirkan sebabnya.',
  conclusion: 'Bina kesimpulan daripada tiga syarat percambahan yang telah diuji.',
  challenge: 'Cuba cabaran: ubah satu faktor dan perhatikan kesannya.',
  final: 'Tahniah! Penyiasatan anda selesai. Anda boleh mencetak sijil.',
  report: 'Ini laporan lengkap penyiasatan anda.',
};
export function screenScript(screen?: string): string {
  return (screen && scripts[screen]) || scripts.default;
}
export function speak(text: string, onDone: () => void): boolean {
  try {
    const synth = window.speechSynthesis;
    if (!synth || typeof SpeechSynthesisUtterance === 'undefined') return false;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ms-MY'; utterance.rate = .95;
    utterance.onend = onDone; utterance.onerror = onDone;
    synth.speak(utterance);
    return true;
  } catch { return false; }
}
export function stopSpeaking() {
  try { window.speechSynthesis?.cancel(); } catch { /* unsupported */ }
}
