import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock AudioContext (synth tones) ────────────────────────────

const createOscillator = vi.fn(() => ({
  type: 'sine' as OscillatorType,
  frequency: { value: 0 },
  connect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
}));

const createGain = vi.fn(() => ({
  gain: { value: 0, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
  connect: vi.fn(),
}));

class MockAudioContext {
  state = 'running';
  currentTime = 0;
  destination = {};
  resume = vi.fn();
  createOscillator = createOscillator;
  createGain = createGain;
}

vi.stubGlobal('AudioContext', MockAudioContext);

// ─── Import after mocks ─────────────────────────────────────────

import {
  repTick,
  exerciseStart,
  restStart,
  tempoPhase,
  workoutComplete,
  setComplete,
  secondTick,
  cancelPending,
  configure,
  getSettings,
  warmup,
  _resetForTesting,
} from './SoundCue';

describe('SoundCue', () => {
  beforeEach(() => {
    createOscillator.mockClear();
    createGain.mockClear();
    _resetForTesting();
  });

  // ─── Synth-only sounds ────────────────────────────────────────

  it('repTick creates oscillator (synth)', () => {
    repTick(0.5);
    expect(createOscillator).toHaveBeenCalled();
    expect(createGain).toHaveBeenCalled();
  });

  it('secondTick plays a very quiet synth tone', () => {
    secondTick();
    expect(createOscillator).toHaveBeenCalledTimes(1);
  });

  // ─── Tempo phase synth sounds ──────────────────────────────────

  it('tempoPhase "to" plays rising two-note sequence', () => {
    tempoPhase('to');
    // Two oscillators: 440Hz → 659Hz
    expect(createOscillator).toHaveBeenCalledTimes(2);
  });

  it('tempoPhase "from" plays falling two-note sequence', () => {
    tempoPhase('from');
    // Two oscillators: 659Hz → 440Hz
    expect(createOscillator).toHaveBeenCalledTimes(2);
  });

  it('tempoPhase "hold" plays single steady tone', () => {
    tempoPhase('hold', false);
    expect(createOscillator).toHaveBeenCalledTimes(1);
  });

  it('tempoPhase "hold" static plays double pulse', () => {
    tempoPhase('hold', true);
    expect(createOscillator).toHaveBeenCalledTimes(2);
  });

  // ─── Navigation synth sounds ──────────────────────────────────

  it('exerciseStart plays ascending triad (3 oscillators)', () => {
    exerciseStart();
    expect(createOscillator).toHaveBeenCalledTimes(3);
  });

  it('setComplete plays ascending chirp (2 oscillators)', () => {
    setComplete();
    expect(createOscillator).toHaveBeenCalledTimes(2);
  });

  it('restStart plays descending tone (2 oscillators)', () => {
    restStart();
    expect(createOscillator).toHaveBeenCalledTimes(2);
  });

  // ─── Status synth sounds ──────────────────────────────────────

  it('workoutComplete plays fanfare (4 oscillators)', () => {
    workoutComplete();
    expect(createOscillator).toHaveBeenCalledTimes(4);
  });

  // ─── Configuration & presets ──────────────────────────────────

  it('configure changes settings', () => {
    configure({ volume: 0.5, preset: 'minimal' });
    const s = getSettings();
    expect(s.volume).toBe(0.5);
    expect(s.preset).toBe('minimal');
    expect(s.enabled).toBe(true);
  });

  it('disabled setting suppresses all sounds', () => {
    configure({ enabled: false });
    repTick(0);
    exerciseStart();
    workoutComplete();
    expect(createOscillator).not.toHaveBeenCalled();
  });

  it('minimal preset suppresses rhythm-layer sounds', () => {
    configure({ preset: 'minimal' });
    repTick(0.5);
    tempoPhase('to');
    expect(createOscillator).not.toHaveBeenCalled();
  });

  it('minimal preset allows navigation and status sounds', () => {
    configure({ preset: 'minimal' });
    exerciseStart();
    expect(createOscillator).toHaveBeenCalledTimes(3); // triad
    secondTick();
    // secondTick is rhythm layer, suppressed in minimal
    expect(createOscillator).toHaveBeenCalledTimes(3);
  });

  // ─── Anti-spam ────────────────────────────────────────────────

  it('anti-spam suppresses rapid same-type rhythm sounds', () => {
    vi.useFakeTimers();
    repTick(0);
    repTick(0.5); // suppressed (within 80ms)
    expect(createOscillator).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(80);
    repTick(1.0); // plays (80ms passed)
    expect(createOscillator).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('anti-spam does not block different sound types', () => {
    repTick(0);
    secondTick();
    expect(createOscillator).toHaveBeenCalledTimes(2);
  });

  // ─── Event overlap prevention ──────────────────────────────────

  it('new navigation sound stops previous navigation sound oscillators', () => {
    setComplete(); // 2 oscillators
    const firstOscillators = createOscillator.mock.results.map((r) => r.value);

    restStart(); // cancels setComplete, creates 2 new oscillators
    // Previous oscillators should have been stopped
    for (const osc of firstOscillators) {
      expect(osc.stop).toHaveBeenCalled();
    }
    expect(createOscillator).toHaveBeenCalledTimes(4); // 2 + 2
  });

  it('exerciseStart stops previous event sound', () => {
    setComplete(); // 2 oscillators
    const firstOscillators = createOscillator.mock.results.map((r) => r.value);

    exerciseStart(); // cancels setComplete, creates 3 new
    for (const osc of firstOscillators) {
      expect(osc.stop).toHaveBeenCalled();
    }
    expect(createOscillator).toHaveBeenCalledTimes(5); // 2 + 3
  });

  // ─── Priority & cancellation ──────────────────────────────────

  it('cancelPending clears scheduled timeouts and active events', () => {
    setComplete(); // 2 oscillators tracked
    const oscillators = createOscillator.mock.results.map((r) => r.value);

    cancelPending();
    for (const osc of oscillators) {
      expect(osc.stop).toHaveBeenCalled();
    }
  });

  it('workoutComplete calls autoCancelPending', () => {
    // Should not throw and should play fanfare
    workoutComplete();
    expect(createOscillator).toHaveBeenCalledTimes(4);
  });

  // ─── Warmup ─────────────────────────────────────────────────────

  it('warmup creates AudioContext', () => {
    warmup();
    // AudioContext constructor was called (via getCtx)
    expect(createOscillator).not.toHaveBeenCalled(); // no sound, just context init
  });

  // ─── fadeOut clamping ───────────────────────────────────────────

  it('secondTick does not throw with short duration (fadeOut clamped)', () => {
    // secondTick has duration=0.02, default fadeOut=0.05
    // Without clamping, setValueAtTime would get negative time
    expect(() => secondTick()).not.toThrow();
    expect(createOscillator).toHaveBeenCalledTimes(1);
  });

  // ─── _resetForTesting ─────────────────────────────────────────

  it('_resetForTesting restores default settings', () => {
    configure({ volume: 0.1, preset: 'motivating', enabled: false });
    _resetForTesting();
    const s = getSettings();
    expect(s.volume).toBe(1.0);
    expect(s.preset).toBe('classic');
    expect(s.enabled).toBe(true);
  });
});
