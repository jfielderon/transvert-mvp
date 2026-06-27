export function speakLocalPhrase(text: string, language = 'es-ES') {
  const phrase = String(text || '').trim();
  if (!phrase) return false;

  try {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
    const Utterance = typeof window !== 'undefined' ? window.SpeechSynthesisUtterance : undefined;
    if (!synth || !Utterance) return false;

    synth.cancel();
    const utterance = new Utterance(phrase);
    utterance.lang = language;
    utterance.rate = 0.86;
    utterance.pitch = 1;
    synth.speak(utterance);
    return true;
  } catch {
    return false;
  }
}
