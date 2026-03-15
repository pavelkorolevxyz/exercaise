// ─── Event Map ───────────────────────────────────────────────────
//
// Event              │ Layer       │ Source │ When
// ──────────────────┼─────────────┼────────┼──────────────────────
// repTick           │ rhythm      │ synth  │ Start of each rep ('to' phase)
// tempoPhase        │ rhythm      │ synth  │ Transition between tempo phases
// exerciseStart     │ navigation  │ synth  │ Reading phase starts (next exercise)
// setComplete       │ navigation  │ synth  │ All reps in a set done
// restStart         │ navigation  │ synth  │ Rest period begins
// secondTick        │ rhythm      │ synth  │ Every second of active timer
// workoutComplete   │ status      │ synth  │ All exercises finished

// ─── Types & Configuration ───────────────────────────────────────

export type SoundPreset = 'minimal' | 'classic' | 'motivating';

export interface SoundSettings {
  enabled: boolean;
  volume: number; // 0..1
  preset: SoundPreset;
}

type SoundLayer = 'rhythm' | 'navigation' | 'status';
type SoundPriority = 1 | 2 | 3;

interface PresetConfig {
  rhythm: boolean;
  navigation: boolean;
  status: boolean;
  volumeScale: number;
}

const PRESETS: Record<SoundPreset, PresetConfig> = {
  minimal: { rhythm: false, navigation: true, status: true, volumeScale: 0.7 },
  classic: { rhythm: true, navigation: true, status: true, volumeScale: 1.0 },
  motivating: { rhythm: true, navigation: true, status: true, volumeScale: 1.2 },
};

const DEFAULT_SETTINGS: SoundSettings = {
  enabled: true,
  volume: 1.0,
  preset: 'classic',
};

let settings: SoundSettings = { ...DEFAULT_SETTINGS };

export function configure(s: Partial<SoundSettings>): void {
  settings = { ...settings, ...s };
}

export function getSettings(): SoundSettings {
  return { ...settings };
}

// ─── AudioContext Engine (synth tones) ───────────────────────────

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

/** Call on first user gesture to unlock audio playback. */
export function warmup() {
  getCtx();
}

interface ToneOptions {
  freq: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
  fadeOut?: number;
}

function effectiveGain(baseGain: number): number {
  const preset = PRESETS[settings.preset];
  return baseGain * settings.volume * preset.volumeScale;
}

function playTone(opts: ToneOptions) {
  if (!settings.enabled) return;
  const ac = getCtx();
  const osc = ac.createOscillator();
  const gainNode = ac.createGain();

  osc.type = opts.type ?? 'sine';
  osc.frequency.value = opts.freq;
  const g = effectiveGain(opts.gain ?? 0.3);
  gainNode.gain.value = g;

  const fadeOut = Math.min(opts.fadeOut ?? 0.05, opts.duration);
  gainNode.gain.setValueAtTime(g, ac.currentTime + opts.duration - fadeOut);
  gainNode.gain.linearRampToValueAtTime(0, ac.currentTime + opts.duration);

  osc.connect(gainNode);
  gainNode.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + opts.duration);
}

// ─── Event sound overlap prevention ──────────────────────────────
// Navigation/status sounds cancel the previous event sequence
// (analogous to the old voice overlap prevention with mp3 clips).

const activeEventNodes: OscillatorNode[] = [];

function cancelActiveEvent() {
  for (const osc of activeEventNodes) {
    try { osc.stop(); } catch { /* already stopped */ }
  }
  activeEventNodes.length = 0;
}

/** Schedule a sequence of tones. If trackNodes is true, oscillators are tracked for cancellation. */
function scheduleSequence(notes: Array<ToneOptions & { delay?: number }>, trackNodes: boolean) {
  if (!settings.enabled) return;
  const ac = getCtx();

  for (const note of notes) {
    const osc = ac.createOscillator();
    const gainNode = ac.createGain();

    osc.type = note.type ?? 'sine';
    osc.frequency.value = note.freq;
    const g = effectiveGain(note.gain ?? 0.3);
    const start = ac.currentTime + (note.delay ?? 0);
    const end = start + note.duration;
    const fadeOut = Math.min(note.fadeOut ?? 0.03, note.duration);

    gainNode.gain.value = 0;
    gainNode.gain.setValueAtTime(g, start);
    gainNode.gain.setValueAtTime(g, end - fadeOut);
    gainNode.gain.linearRampToValueAtTime(0, end);

    osc.connect(gainNode);
    gainNode.connect(ac.destination);
    osc.start(start);
    osc.stop(end);

    if (trackNodes) activeEventNodes.push(osc);
  }
}

/** Play a sequence of tones with scheduled delays (all via AudioContext). */
function playSequence(notes: Array<ToneOptions & { delay?: number }>) {
  scheduleSequence(notes, false);
}

/** Play an event sequence, cancelling any previous one. */
function playEventSequence(notes: Array<ToneOptions & { delay?: number }>) {
  cancelActiveEvent();
  scheduleSequence(notes, true);
}

// ─── Scheduler ───────────────────────────────────────────────────

const pendingTimeouts: ReturnType<typeof setTimeout>[] = [];
const lastPlayTime = new Map<string, number>();

const MIN_INTERVALS: Record<string, number> = {
  repTick: 80,
  tempoPhase: 60,
};

const SOUND_PRIORITY: Record<string, SoundPriority> = {
  repTick: 1,
  tempoPhase: 1,
  exerciseStart: 2,
  setComplete: 2,
  restStart: 2,
  secondTick: 1,
  workoutComplete: 3,
};

const SOUND_LAYER: Record<string, SoundLayer> = {
  repTick: 'rhythm',
  tempoPhase: 'rhythm',
  exerciseStart: 'navigation',
  setComplete: 'navigation',
  restStart: 'navigation',
  secondTick: 'rhythm',
  workoutComplete: 'status',
};

function canPlay(name: string): boolean {
  if (!settings.enabled) return false;

  const preset = PRESETS[settings.preset];
  const layer = SOUND_LAYER[name];
  if (layer && !preset[layer]) return false;

  const minInterval = MIN_INTERVALS[name];
  if (minInterval) {
    const last = lastPlayTime.get(name) ?? 0;
    if (Date.now() - last < minInterval) return false;
  }

  return true;
}

function markPlayed(name: string) {
  lastPlayTime.set(name, Date.now());
}

function autoCancelPending(name: string) {
  const priority = SOUND_PRIORITY[name] ?? 1;
  if (priority >= 3) {
    cancelPending();
  }
}

/** Cancel all scheduled sound timeouts and active event sounds. */
export function cancelPending() {
  pendingTimeouts.forEach(clearTimeout);
  pendingTimeouts.length = 0;
  cancelActiveEvent();
}

/** Reset all internal state (for testing). */
export function _resetForTesting() {
  cancelPending();
  lastPlayTime.clear();
  settings = { ...DEFAULT_SETTINGS };
  ctx = null;
}

// ─── Rhythm Layer (frequent, short signals) ──────────────────────

/** Subtle tick on every second of active timer. */
export function secondTick() {
  if (!canPlay('secondTick')) return;
  markPlayed('secondTick');
  playTone({ freq: 500, duration: 0.02, type: 'sine', gain: 0.04 });
}

/** Rep tick — short synth click, pitch rises with progress (0..1). */
export function repTick(progress: number) {
  if (!canPlay('repTick')) return;
  markPlayed('repTick');
  const freq = 350 + progress * 200; // 350 Hz → 550 Hz
  playTone({ freq, duration: 0.08, type: 'triangle', gain: 0.15 });
}

/** Tempo phase transition — synth cue for each phase. */
export function tempoPhase(phase: 'to' | 'hold' | 'from', isStatic?: boolean) {
  if (!canPlay('tempoPhase')) return;
  markPlayed('tempoPhase');

  if (phase === 'to') {
    // Rising two-note: "go forward" (E4 → A4)
    playSequence([
      { freq: 330, duration: 0.08, type: 'triangle', gain: 0.2 },
      { freq: 440, duration: 0.1, type: 'triangle', gain: 0.25, delay: 0.09 },
    ]);
  } else if (phase === 'from') {
    // Falling two-note: "go back" (A4 → E4)
    playSequence([
      { freq: 440, duration: 0.08, type: 'triangle', gain: 0.2 },
      { freq: 330, duration: 0.1, type: 'triangle', gain: 0.25, delay: 0.09 },
    ]);
  } else if (isStatic) {
    // Double pulse: "keep working" (G4)
    playSequence([
      { freq: 392, duration: 0.06, type: 'triangle', gain: 0.2 },
      { freq: 392, duration: 0.06, type: 'triangle', gain: 0.2, delay: 0.1 },
    ]);
  } else {
    // Steady tone: "hold" (F4)
    playTone({ freq: 349, duration: 0.15, type: 'sine', gain: 0.2 });
  }
}

// ─── Navigation Layer (phase transitions) ────────────────────────

/** Exercise start — ascending triad at reading phase start. */
export function exerciseStart() {
  if (!canPlay('exerciseStart')) return;
  markPlayed('exerciseStart');
  // E4 → G4 → A4 ascending triad
  playEventSequence([
    { freq: 330, duration: 0.1, type: 'sine', gain: 0.25 },
    { freq: 392, duration: 0.1, type: 'sine', gain: 0.25, delay: 0.12 },
    { freq: 440, duration: 0.15, type: 'sine', gain: 0.3, delay: 0.24 },
  ]);
}

/** Set complete — quick ascending chirp. */
export function setComplete() {
  if (!canPlay('setComplete')) return;
  markPlayed('setComplete');
  // A4 → C5 ascending chirp
  playEventSequence([
    { freq: 440, duration: 0.08, type: 'sine', gain: 0.2 },
    { freq: 523, duration: 0.12, type: 'sine', gain: 0.25, delay: 0.1 },
  ]);
}

/** Rest start — gentle descending tone. */
export function restStart() {
  if (!canPlay('restStart')) return;
  markPlayed('restStart');
  // E4 → C4 gentle descending
  playEventSequence([
    { freq: 330, duration: 0.12, type: 'sine', gain: 0.2 },
    { freq: 262, duration: 0.15, type: 'sine', gain: 0.15, delay: 0.14 },
  ]);
}

// ─── Status Layer (state changes, highest priority) ──────────────

/** Workout complete — triumphant ascending fanfare. */
export function workoutComplete() {
  if (!canPlay('workoutComplete')) return;
  markPlayed('workoutComplete');
  autoCancelPending('workoutComplete');
  // E4 → G4 → A4 → C5 victory arpeggio
  playEventSequence([
    { freq: 330, duration: 0.12, type: 'sine', gain: 0.25 },
    { freq: 392, duration: 0.12, type: 'sine', gain: 0.25, delay: 0.14 },
    { freq: 440, duration: 0.12, type: 'sine', gain: 0.3, delay: 0.28 },
    { freq: 523, duration: 0.25, type: 'sine', gain: 0.35, delay: 0.42 },
  ]);
}

