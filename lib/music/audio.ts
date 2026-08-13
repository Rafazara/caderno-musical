import type { Note } from "@/lib/music/notes";
import { pitch } from "@/lib/music/notes";

export const DEFAULT_AUDIO_PROFILE = {
  id: "default",
  attack: 0.022,
  decay: 0.16,
  sustain: 0.1,
  release: 0.14,
  masterGain: 0.15,
  noteDuration: 0.78,
  gaps: { comparison: 0.56, scale: 0.48, reference: 0.72 },
  harmonics: [
    { type: "triangle" as OscillatorType, ratio: 1, level: 1 },
    { type: "sine" as OscillatorType, ratio: 2, level: 0.065 },
  ],
} as const;
export const AUDIO_TIMING = {
  note: DEFAULT_AUDIO_PROFILE.noteDuration,
  gap: DEFAULT_AUDIO_PROFILE.gaps.comparison,
  attack: DEFAULT_AUDIO_PROFILE.attack,
  release: DEFAULT_AUDIO_PROFILE.release,
} as const;
export type AudioPlayerState = "idle" | "playing" | "unavailable";
export type PlaybackPolicy = "replace" | "overlap";
export type ScheduledTone = { note: Note; startTime: number; duration: number; gain?: number };
export type IntervalPlayback = {
  root: Note;
  target: Note;
  semitoneDistance: number;
  direction: "ascending" | "descending";
  playbackMode: "melodicAscending" | "melodicDescending" | "harmonic";
};
export function frequencyOf(note: Note): number {
  const midi = 60 + pitch(note);
  return 440 * 2 ** ((midi - 69) / 12);
}
export function scheduleNotes(
  notes: Note[],
  gap: number = AUDIO_TIMING.gap,
  duration: number = AUDIO_TIMING.note,
): ScheduledTone[] {
  return notes.map((note, index) => ({
    note,
    startTime: index * gap,
    duration,
  }));
}

class WebAudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private active = new Set<OscillatorNode>();
  private listeners = new Set<() => void>();
  private generation = 0;
  volume = 0.62;
  muted = false;
  state: AudioPlayerState = "idle";
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  snapshot = () => this.state;
  private publish(state: AudioPlayerState) {
    if (this.state === state) return;
    this.state = state;
    this.listeners.forEach((listener) => listener());
  }
  configure(volume: number, muted: boolean) {
    this.volume = Math.max(
      0,
      Math.min(1, Number.isFinite(volume) ? volume : 0.62),
    );
    this.muted = muted;
    if (this.master && this.context)
      this.master.gain.setTargetAtTime(
        muted ? 0 : this.volume,
        this.context.currentTime,
        0.025,
      );
  }
  private async ready() {
    if (typeof window === "undefined") throw new Error("audio-unavailable");
    const AudioCtor =
      window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtor) {
      this.publish("unavailable");
      throw new Error("audio-unavailable");
    }
    this.context ??= new AudioCtor();
    if (!this.master) {
      this.master = this.context.createGain();
      this.master.connect(this.context.destination);
    }
    this.configure(this.volume, this.muted);
    if (this.context.state === "suspended") await this.context.resume();
    if (this.context.state !== "running") {
      this.publish("unavailable");
      throw new Error("audio-unavailable");
    }
    return this.context;
  }
  async unlock() {
    try {
      await this.ready();
      this.publish("idle");
      return true;
    } catch {
      this.publish("unavailable");
      return false;
    }
  }
  async play(sequence: ScheduledTone[], policy: PlaybackPolicy = "replace") {
    if (policy === "replace") this.stop();
    const token = ++this.generation;
    const ctx = await this.ready();
    const start = ctx.currentTime + 0.04;
    const created: OscillatorNode[] = [];
    this.publish("playing");
    let remaining = 0;
    for (const tone of sequence) {
      const at = start + Math.max(0, tone.startTime);
      const duration = Math.max(0.08, tone.duration);
      const end = at + duration;
      const envelope = ctx.createGain();
      envelope.gain.setValueAtTime(0.0001, at);
      envelope.gain.exponentialRampToValueAtTime(
        DEFAULT_AUDIO_PROFILE.masterGain * (tone.gain ?? 1),
        at + DEFAULT_AUDIO_PROFILE.attack,
      );
      envelope.gain.exponentialRampToValueAtTime(
        DEFAULT_AUDIO_PROFILE.sustain,
        at + Math.min(DEFAULT_AUDIO_PROFILE.decay, duration * 0.4),
      );
      envelope.gain.exponentialRampToValueAtTime(
        0.0001,
        end + DEFAULT_AUDIO_PROFILE.release,
      );
      envelope.connect(this.master!);
      for (const partial of DEFAULT_AUDIO_PROFILE.harmonics) {
        const oscillator = ctx.createOscillator();
        const partialGain = ctx.createGain();
        oscillator.type = partial.type;
        oscillator.frequency.setValueAtTime(
          frequencyOf(tone.note) * partial.ratio,
          at,
        );
        partialGain.gain.value = partial.level;
        oscillator.connect(partialGain).connect(envelope);
        oscillator.start(at);
        oscillator.stop(end + DEFAULT_AUDIO_PROFILE.release + 0.025);
        remaining++;
        oscillator.onended = () => {
          this.active.delete(oscillator);
          remaining--;
          if (!remaining && token === this.generation) this.publish("idle");
        };
        this.active.add(oscillator);
        created.push(oscillator);
      }
    }
    return () => this.stopNodes(created, token);
  }
  private stopNodes(nodes: OscillatorNode[], token: number) {
    for (const oscillator of nodes) {
      try {
        oscillator.stop();
      } catch {
        /* encerrado */
      }
      this.active.delete(oscillator);
    }
    if (token === this.generation) this.publish("idle");
  }
  stop() {
    this.generation++;
    for (const oscillator of this.active) {
      try {
        oscillator.stop();
      } catch {
        /* encerrado */
      }
    }
    this.active.clear();
    this.publish("idle");
  }
  async handleVisibility(hidden: boolean) {
    if (hidden) {
      this.stop();
      if (this.context?.state === "running")
        await this.context.suspend().catch(() => undefined);
    }
  }
}
export const audioEngine = new WebAudioEngine();
function launch(sequence: ScheduledTone[]) {
  let cancel = () => {};
  let cancelled = false;
  void audioEngine
    .play(sequence, "replace")
    .then((stop) => {
      if (cancelled) stop();
      else cancel = stop;
    })
    .catch(() => {});
  return () => {
    cancelled = true;
    cancel();
  };
}
export function playScheduled(sequence:ScheduledTone[]){return launch(sequence);}
export function playNote(
  note: Note,
  duration: number = AUDIO_TIMING.note,
  delay = 0,
) {
  return launch([{ note, startTime: delay, duration }]);
}
export function playNoteLine(notes: Note[], gap: number = AUDIO_TIMING.gap) {
  return launch(scheduleNotes(notes, gap));
}
export function intervalSchedule(playback:IntervalPlayback):ScheduledTone[]{const duration=DEFAULT_AUDIO_PROFILE.noteDuration;if(playback.playbackMode==='harmonic')return[{note:playback.root,startTime:0,duration,gain:.68},{note:playback.target,startTime:0,duration,gain:.68}];const notes=playback.playbackMode==='melodicDescending'?[playback.target,playback.root]:[playback.root,playback.target];return scheduleNotes(notes,DEFAULT_AUDIO_PROFILE.gaps.comparison,duration);}
export function playInterval(playback:IntervalPlayback){return launch(intervalSchedule(playback));}
export function voiceGain(voices:number){return voices<=1?1:voices===2?.68:voices===3?.54:Math.max(.34,.54*Math.sqrt(3/voices));}
export function chordSchedule(notes:Note[],mode:"together"|"up"|"down"="together"):ScheduledTone[]{const ordered=mode==="down"?[...notes].reverse():notes;const gain=voiceGain(mode==="together"?notes.length:1);return ordered.map((value,index)=>({note:value,startTime:mode==="together"?0:index*DEFAULT_AUDIO_PROFILE.gaps.comparison,duration:DEFAULT_AUDIO_PROFILE.noteDuration,gain}));}
export function playChord(notes:Note[],mode:"together"|"up"|"down"="together"){return launch(chordSchedule(notes,mode));}
export type ChordSequenceItem={notes:Note[];start:number;duration:number};
export function chordProgressionSchedule(items:ChordSequenceItem[]):ScheduledTone[]{return items.flatMap(item=>item.notes.map(note=>({note,startTime:item.start,duration:item.duration,gain:voiceGain(item.notes.length)})));}
export function playChordProgression(items:ChordSequenceItem[]){return launch(chordProgressionSchedule(items));}
