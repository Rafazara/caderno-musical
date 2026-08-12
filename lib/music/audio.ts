import type { Note } from "@/lib/music/notes";
import { pitch } from "@/lib/music/notes";

/** Frequência em temperamento igual, com Lá4 = 440 Hz. */
export function frequencyOf(note: Note): number {
  const midi = 60 + pitch(note); // Dó4 = MIDI 60
  return 440 * 2 ** ((midi - 69) / 12);
}

let context: AudioContext | null = null;

function audioContext(): AudioContext {
  context ??= new AudioContext();
  return context;
}

/**
 * Sintetizador deliberadamente isolado da interface. O oscilador principal e
 * um harmônico suave passam por um envelope curto, fácil de trocar por samples.
 */
export function playNote(note: Note, duration = 0.85, delay = 0): () => void {
  const ctx = audioContext();
  void ctx.resume();
  const start = ctx.currentTime + delay;
  const end = start + duration;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.2, start + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  gain.connect(ctx.destination);

  const oscillators = [
    { type: "triangle" as OscillatorType, ratio: 1, level: 1 },
    { type: "sine" as OscillatorType, ratio: 2, level: 0.1 },
  ].map(({ type, ratio, level }) => {
    const oscillator = ctx.createOscillator();
    const partial = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequencyOf(note) * ratio, start);
    partial.gain.value = level;
    oscillator.connect(partial).connect(gain);
    oscillator.start(start);
    oscillator.stop(end + 0.03);
    return oscillator;
  });

  return () => {
    for (const oscillator of oscillators) {
      try { oscillator.stop(); } catch { /* already stopped */ }
    }
  };
}

export function playNoteLine(notes: Note[], gap = 0.62): () => void {
  const stops = notes.map((note, index) => playNote(note, 0.78, index * gap));
  return () => stops.forEach((stop) => stop());
}
