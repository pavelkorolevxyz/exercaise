import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlayerState } from './usePlayerState';
import type { Workout } from './types';

// Mock sound cues (AudioContext not available in jsdom)
vi.mock('../../../shared/sound/SoundCue', () => ({
  repTick: vi.fn(),
  exerciseStart: vi.fn(),
  restStart: vi.fn(),
  tempoPhase: vi.fn(),
  workoutComplete: vi.fn(),
  cancelPending: vi.fn(),
  setComplete: vi.fn(),
  secondTick: vi.fn(),
  configure: vi.fn(),
  getSettings: vi.fn(),
  _resetForTesting: vi.fn(),
}));

const simpleWorkout: Workout = {
  id: 'w1',
  title: 'Test Workout',
  exercises: [
    {
      title: 'Push-ups',
      repeatCount: 2,
      setCount: 1,
      restSeconds: 5,
      tempo: { to: 1, hold: 0, from: 1 },
    },
  ],
};

const multiExerciseWorkout: Workout = {
  id: 'w2',
  title: 'Multi Exercise',
  exercises: [
    {
      title: 'Exercise A',
      repeatCount: 1,
      setCount: 1,
      restSeconds: 2,
      tempo: { to: 1, hold: 0, from: 1 },
    },
    {
      title: 'Exercise B',
      repeatCount: 1,
      setCount: 1,
      restSeconds: 2,
      tempo: { to: 1, hold: 0, from: 1 },
    },
  ],
};

const multiSetWorkout: Workout = {
  id: 'w3',
  title: 'Multi Set',
  exercises: [
    {
      title: 'Squats',
      repeatCount: 1,
      setCount: 2,
      restSeconds: 2,
      tempo: { to: 1, hold: 0, from: 1 },
    },
  ],
};

const readingWorkout: Workout = {
  id: 'w4',
  title: 'Reading Workout',
  exercises: [
    {
      title: 'Plank',
      description: 'Держи корпус ровно и не опускай таз.',
      repeatCount: 1,
      setCount: 1,
      restSeconds: 0,
      tempo: { to: 1, hold: 0, from: 1 },
    },
  ],
};

/** Helper to advance timers and flush all pending microtasks/timeouts */
function advanceAndFlush(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

/** Advance past startExercise's 300ms setTimeout to reach exercise phase */
function advancePastStart() {
  advanceAndFlush(500); // 300ms setTimeout + buffer
}

describe('usePlayerState', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with exercise phase', () => {
    const { result } = renderHook(() => usePlayerState(simpleWorkout));

    expect(result.current.state.phase).toBe('exercise');
    expect(result.current.state.exerciseIndex).toBe(0);
    expect(result.current.state.isPaused).toBe(false);
    expect(result.current.currentExercise).toBe(simpleWorkout.exercises[0]);
  });

  it('returns correct computed values', () => {
    const { result } = renderHook(() => usePlayerState(simpleWorkout));

    expect(result.current.totalReps).toBe(2);
    expect(result.current.totalSets).toBe(1);
    expect(result.current.hasTempo).toBe(true);
  });

  it('start transitions directly to exercise', () => {
    const { result } = renderHook(() => usePlayerState(simpleWorkout));

    act(() => {
      result.current.actions.start();
    });

    advancePastStart();
    expect(result.current.state.phase).toBe('exercise');
  });

  it('togglePause pauses and resumes during exercise', () => {
    const { result } = renderHook(() => usePlayerState(simpleWorkout));

    act(() => { result.current.actions.start(); });
    advancePastStart();

    expect(result.current.state.phase).toBe('exercise');

    // Pause
    act(() => { result.current.actions.togglePause(); });
    expect(result.current.state.isPaused).toBe(true);

    // Resume — should recreate tempo timer
    act(() => { result.current.actions.togglePause(); });
    expect(result.current.state.isPaused).toBe(false);

    // Timer should continue ticking
    advanceAndFlush(1000);
    expect(result.current.state.tempoSecondsLeft).toBe(0);
  });

  it('togglePause during rest pauses and resumes rest timer', () => {
    const { result } = renderHook(() => usePlayerState(multiSetWorkout));

    act(() => { result.current.actions.start(); });
    advancePastStart();

    // Skip to rest
    act(() => { result.current.actions.skip(); });
    expect(result.current.state.phase).toBe('rest');
    const restBefore = result.current.state.restSecondsLeft;

    // Pause
    act(() => { result.current.actions.togglePause(); });
    expect(result.current.state.isPaused).toBe(true);

    // Timer should NOT tick while paused
    advanceAndFlush(1000);
    expect(result.current.state.restSecondsLeft).toBe(restBefore);

    // Resume — should recreate rest timer
    act(() => { result.current.actions.togglePause(); });
    expect(result.current.state.isPaused).toBe(false);

    // Timer should tick again
    advanceAndFlush(1000);
    expect(result.current.state.restSecondsLeft).toBe(restBefore - 1);
  });

  it('togglePause pauses and resumes during reading phase', () => {
    const { result } = renderHook(() => usePlayerState(readingWorkout));

    act(() => { result.current.actions.start(); });

    expect(result.current.state.phase).toBe('reading');
    const readingBefore = result.current.state.readingSecondsLeft;
    expect(readingBefore).toBeGreaterThan(0);

    act(() => { result.current.actions.togglePause(); });
    expect(result.current.state.isPaused).toBe(true);

    advanceAndFlush(1000);
    expect(result.current.state.readingSecondsLeft).toBe(readingBefore);

    act(() => { result.current.actions.togglePause(); });
    expect(result.current.state.isPaused).toBe(false);

    advanceAndFlush(1000);
    expect(result.current.state.readingSecondsLeft).toBe(readingBefore - 1);
  });

  it('togglePause is ignored after workout completion', () => {
    const { result } = renderHook(() => usePlayerState(simpleWorkout));

    act(() => { result.current.actions.start(); });
    advancePastStart();

    act(() => { result.current.actions.nextExercise(); });
    expect(result.current.state.phase).toBe('complete');
    expect(result.current.state.isPaused).toBe(false);

    act(() => { result.current.actions.togglePause(); });
    expect(result.current.state.phase).toBe('complete');
    expect(result.current.state.isPaused).toBe(false);
  });

  it('resume after pause ticks exactly once per second (exercise)', () => {
    const longTempo: Workout = {
      id: 'dp',
      title: 'Double-tick check',
      exercises: [{
        title: 'Ex',
        repeatCount: 1,
        setCount: 1,
        restSeconds: 0,
        tempo: { to: 5, hold: 0, from: 1 },
      }],
    };
    const { result } = renderHook(() => usePlayerState(longTempo));

    act(() => { result.current.actions.start(); });
    advancePastStart();

    expect(result.current.state.tempoSecondsLeft).toBe(5);

    // Pause then resume
    act(() => { result.current.actions.togglePause(); });
    act(() => { result.current.actions.togglePause(); });

    // After 1 second, should decrement by exactly 1 (not 2)
    advanceAndFlush(1000);
    expect(result.current.state.tempoSecondsLeft).toBe(4);

    advanceAndFlush(1000);
    expect(result.current.state.tempoSecondsLeft).toBe(3);
  });

  it('resume after pause ticks exactly once per second (rest)', () => {
    const restWorkout: Workout = {
      id: 'dpr',
      title: 'Double-tick rest check',
      exercises: [{
        title: 'Ex',
        repeatCount: 1,
        setCount: 2,
        restSeconds: 5,
        tempo: { to: 1, hold: 0, from: 1 },
      }],
    };
    const { result } = renderHook(() => usePlayerState(restWorkout));

    act(() => { result.current.actions.start(); });
    advancePastStart();

    // Skip to rest
    act(() => { result.current.actions.skip(); });
    expect(result.current.state.phase).toBe('rest');
    expect(result.current.state.restSecondsLeft).toBe(5);

    // Pause then resume
    act(() => { result.current.actions.togglePause(); });
    act(() => { result.current.actions.togglePause(); });

    // After 1 second, should decrement by exactly 1
    advanceAndFlush(1000);
    expect(result.current.state.restSecondsLeft).toBe(4);

    advanceAndFlush(1000);
    expect(result.current.state.restSecondsLeft).toBe(3);
  });

  it('resume after pause ticks exactly once per second (reading)', () => {
    const { result } = renderHook(() => usePlayerState(readingWorkout));

    act(() => { result.current.actions.start(); });
    expect(result.current.state.phase).toBe('reading');
    const readingBefore = result.current.state.readingSecondsLeft;
    expect(readingBefore).toBeGreaterThanOrEqual(3);

    // Pause then resume
    act(() => { result.current.actions.togglePause(); });
    act(() => { result.current.actions.togglePause(); });

    // After 1 second, should decrement by exactly 1
    advanceAndFlush(1000);
    expect(result.current.state.readingSecondsLeft).toBe(readingBefore - 1);

    advanceAndFlush(1000);
    expect(result.current.state.readingSecondsLeft).toBe(readingBefore - 2);
  });

  it('nextExercise skips to next exercise', () => {
    const { result } = renderHook(() => usePlayerState(multiExerciseWorkout));

    act(() => { result.current.actions.start(); });
    advancePastStart();

    expect(result.current.state.exerciseIndex).toBe(0);

    act(() => { result.current.actions.nextExercise(); });
    advanceAndFlush(500);

    expect(result.current.state.exerciseIndex).toBe(1);
  });

  it('nextExercise on last exercise completes workout', () => {
    const { result } = renderHook(() => usePlayerState(simpleWorkout));

    act(() => { result.current.actions.start(); });
    advancePastStart();

    act(() => { result.current.actions.nextExercise(); });

    expect(result.current.state.phase).toBe('complete');
  });

  it('prevExercise goes to previous exercise', () => {
    const { result } = renderHook(() => usePlayerState(multiExerciseWorkout));

    act(() => { result.current.actions.start(); });
    advancePastStart();

    act(() => { result.current.actions.nextExercise(); });
    advanceAndFlush(500);
    expect(result.current.state.exerciseIndex).toBe(1);

    act(() => { result.current.actions.prevExercise(); });
    advanceAndFlush(500);
    expect(result.current.state.exerciseIndex).toBe(0);
  });

  it('prevExercise at index 0 stays at index 0', () => {
    const { result } = renderHook(() => usePlayerState(simpleWorkout));

    act(() => { result.current.actions.start(); });
    advancePastStart();

    act(() => { result.current.actions.prevExercise(); });
    advanceAndFlush(500);
    expect(result.current.state.exerciseIndex).toBe(0);
  });

  it('goToExercise navigates to specific index', () => {
    const { result } = renderHook(() => usePlayerState(multiExerciseWorkout));

    act(() => { result.current.actions.start(); });
    advancePastStart();

    act(() => { result.current.actions.goToExercise(1); });
    advanceAndFlush(500);
    expect(result.current.state.exerciseIndex).toBe(1);
  });

  it('goToExercise ignores out of range index', () => {
    const { result } = renderHook(() => usePlayerState(simpleWorkout));

    act(() => { result.current.actions.start(); });
    advancePastStart();

    act(() => { result.current.actions.goToExercise(99); });
    expect(result.current.state.exerciseIndex).toBe(0);

    act(() => { result.current.actions.goToExercise(-1); });
    expect(result.current.state.exerciseIndex).toBe(0);
  });

  it('skip during exercise goes to rest or next', () => {
    const { result } = renderHook(() => usePlayerState(multiSetWorkout));

    act(() => { result.current.actions.start(); });
    advancePastStart();

    expect(result.current.state.phase).toBe('exercise');

    act(() => { result.current.actions.skip(); });
    expect(result.current.state.phase).toBe('rest');
  });

  it('skip during rest advances to next phase', () => {
    const { result } = renderHook(() => usePlayerState(multiSetWorkout));

    act(() => { result.current.actions.start(); });
    advancePastStart();

    // Skip exercise to get to rest
    act(() => { result.current.actions.skip(); });
    expect(result.current.state.phase).toBe('rest');

    // Skip rest to next set
    act(() => { result.current.actions.skip(); });
    advanceAndFlush(500);
    expect(result.current.state.phase).toBe('exercise');
  });

  it('skip exercise on last exercise of last set completes workout', () => {
    const singleWorkout: Workout = {
      id: 's',
      title: 'Single',
      exercises: [{ title: 'Only', repeatCount: 1, setCount: 1, restSeconds: 0, tempo: { to: 2, hold: 0, from: 2 } }],
    };
    const { result } = renderHook(() => usePlayerState(singleWorkout));

    act(() => { result.current.actions.start(); });
    advancePastStart();

    act(() => { result.current.actions.skip(); });
    expect(result.current.state.phase).toBe('complete');
  });

  it('skip exercise goes to rest before next exercise', () => {
    const { result } = renderHook(() => usePlayerState(multiExerciseWorkout));

    act(() => { result.current.actions.start(); });
    advancePastStart();

    // Skip exercise A — should rest before exercise B
    act(() => { result.current.actions.skip(); });
    expect(result.current.state.phase).toBe('rest');
  });

  it('skip rest on last set goes to next exercise', () => {
    const { result } = renderHook(() => usePlayerState(multiExerciseWorkout));

    act(() => { result.current.actions.start(); });
    advancePastStart();

    // Skip exercise to rest
    act(() => { result.current.actions.skip(); });
    expect(result.current.state.phase).toBe('rest');

    // Skip rest — should go to next exercise
    act(() => { result.current.actions.skip(); });
    advanceAndFlush(500);
    expect(result.current.state.exerciseIndex).toBe(1);
  });

  it('skip rest on last exercise completes workout', () => {
    const w: Workout = {
      id: 'x',
      title: 'X',
      exercises: [{ title: 'Ex', repeatCount: 1, setCount: 1, restSeconds: 10, tempo: { to: 1, hold: 0, from: 1 } }],
    };
    const { result } = renderHook(() => usePlayerState(w));

    act(() => { result.current.actions.start(); });
    advancePastStart();

    // Let tempo finish naturally: to(1s) → hold(skip) → from(1s)
    advanceAndFlush(1000); // to phase done
    advanceAndFlush(500);  // RING_COMPLETE_DELAY + skip hold
    advanceAndFlush(1000); // from phase done
    advanceAndFlush(500);  // completeRep → last set done → complete

    // completeRep(0,0,0): nextRep=1 >= repeatCount=1 → nextSet=1 >= setCount=1 → nextEx=1 >= length=1 → complete
    expect(result.current.state.phase).toBe('complete');
  });

  it('nextExerciseData returns correct data', () => {
    const { result } = renderHook(() => usePlayerState(multiExerciseWorkout));

    expect(result.current.nextExerciseData).toBe(multiExerciseWorkout.exercises[1]);
  });

  it('nextExerciseData is null for last exercise', () => {
    const singleWorkout: Workout = {
      id: 's',
      title: 'Single',
      exercises: [{ title: 'Only', repeatCount: 1, setCount: 1, restSeconds: 0 }],
    };
    const { result } = renderHook(() => usePlayerState(singleWorkout));

    expect(result.current.nextExerciseData).toBeNull();
  });

  it('startFromExercise starts at given exercise', () => {
    const { result } = renderHook(() => usePlayerState(multiExerciseWorkout));

    act(() => {
      result.current.actions.startFromExercise(1);
    });

    advancePastStart();
    expect(result.current.state.phase).toBe('exercise');
    expect(result.current.state.exerciseIndex).toBe(1);
  });

  it('tempoLabel returns correct label during exercise', () => {
    const { result } = renderHook(() => usePlayerState(simpleWorkout));

    act(() => { result.current.actions.start(); });
    advancePastStart();

    expect(result.current.state.phase).toBe('exercise');
    expect(result.current.tempoLabel).toBeTruthy();
  });

  it('ringProgress is 0 initially', () => {
    const { result } = renderHook(() => usePlayerState(simpleWorkout));

    expect(result.current.ringProgress).toBe(0);
  });

  it('ringProgress > 0 during exercise phase', () => {
    const w: Workout = {
      id: 'rp',
      title: 'Ring',
      exercises: [{ title: 'Ex', repeatCount: 1, setCount: 1, restSeconds: 10, tempo: { to: 2, hold: 0, from: 2 } }],
    };
    const { result } = renderHook(() => usePlayerState(w));

    act(() => { result.current.actions.start(); });
    advancePastStart();

    expect(result.current.state.phase).toBe('exercise');
    advanceAndFlush(1000); // 1 second elapsed in "to" phase (2 total)
    expect(result.current.ringProgress).toBeGreaterThan(0);
    expect(result.current.ringProgress).toBeLessThan(1);
  });

  it('ringProgress during rest phase', () => {
    const { result } = renderHook(() => usePlayerState(multiSetWorkout));

    act(() => { result.current.actions.start(); });
    advancePastStart();

    // Skip to rest
    act(() => { result.current.actions.skip(); });
    expect(result.current.state.phase).toBe('rest');

    // Wait a second to get some progress
    advanceAndFlush(1000);
    expect(result.current.ringProgress).toBeGreaterThan(0);
  });

  it('tempo timer ticks through to→hold→from and completes rep', () => {
    const tempoWorkout: Workout = {
      id: 'tw',
      title: 'Tempo',
      exercises: [{
        title: 'Slow',
        repeatCount: 1,
        setCount: 1,
        restSeconds: 0,
        tempo: { to: 1, hold: 1, from: 1 },
      }],
    };
    const { result } = renderHook(() => usePlayerState(tempoWorkout));

    act(() => { result.current.actions.start(); });
    advancePastStart();

    expect(result.current.state.phase).toBe('exercise');
    expect(result.current.state.tempoPhase).toBe('to');

    // to phase: 1 second
    advanceAndFlush(1000);
    advanceAndFlush(500); // RING_COMPLETE_DELAY
    expect(result.current.state.tempoPhase).toBe('hold');

    // hold phase: 1 second
    advanceAndFlush(1000);
    advanceAndFlush(500);
    expect(result.current.state.tempoPhase).toBe('from');

    // from phase: 1 second → complete
    advanceAndFlush(1000);
    advanceAndFlush(500);
    expect(result.current.state.phase).toBe('complete');
  });

  it('rest timer ticks down and transitions to next set', () => {
    const shortRest: Workout = {
      id: 'sr',
      title: 'Short Rest',
      exercises: [{
        title: 'Ex',
        repeatCount: 1,
        setCount: 2,
        restSeconds: 3,
        tempo: { to: 1, hold: 0, from: 1 },
      }],
    };
    const { result } = renderHook(() => usePlayerState(shortRest));

    act(() => { result.current.actions.start(); });
    advancePastStart();

    // Skip to rest
    act(() => { result.current.actions.skip(); });
    expect(result.current.state.phase).toBe('rest');
    expect(result.current.state.restSecondsLeft).toBe(3);

    // Tick rest
    advanceAndFlush(1000);
    expect(result.current.state.restSecondsLeft).toBe(2);
    advanceAndFlush(1000);
    expect(result.current.state.restSecondsLeft).toBe(1);
    advanceAndFlush(1000);
    // Rest done, should transition to next set
    advanceAndFlush(500); // RING_COMPLETE_DELAY
    expect(result.current.state.phase).toBe('exercise');
  });

  it('rest between exercises transitions to next exercise', () => {
    const { result } = renderHook(() => usePlayerState(multiExerciseWorkout));

    act(() => { result.current.actions.start(); });
    advancePastStart();

    // Complete exercise A reps naturally: to(1s), hold(skip), from(1s)
    advanceAndFlush(1000); // to done
    advanceAndFlush(500);  // RING_COMPLETE_DELAY, hold skipped (0s)
    advanceAndFlush(1000); // from done
    advanceAndFlush(500);  // completeRep → only 1 set → rest before next ex

    expect(result.current.state.phase).toBe('rest');

    // Let rest finish (2 seconds)
    advanceAndFlush(1000);
    advanceAndFlush(1000);
    advanceAndFlush(500); // RING_COMPLETE_DELAY → startExercise

    advanceAndFlush(500); // startExercise 300ms delay
    expect(result.current.state.exerciseIndex).toBe(1);
    expect(result.current.state.phase).toBe('exercise');
  });

  it('full workout flows through multiple reps to completion', () => {
    const twoRepWorkout: Workout = {
      id: 'tr',
      title: 'Two Reps',
      exercises: [{
        title: 'Ex',
        repeatCount: 2,
        setCount: 1,
        restSeconds: 0,
        tempo: { to: 1, hold: 0, from: 1 },
      }],
    };
    const { result } = renderHook(() => usePlayerState(twoRepWorkout));

    act(() => { result.current.actions.start(); });
    advancePastStart();

    // Rep 1: to(1s) → hold(skip) → from(1s) → completeRep → next rep
    advanceAndFlush(1000); // to done
    advanceAndFlush(500);  // → hold (skipped, 0s) → from
    advanceAndFlush(1000); // from done
    advanceAndFlush(500);  // completeRep → rep 2

    expect(result.current.state.repIndex).toBe(1);

    // Rep 2: to(1s) → hold(skip) → from(1s) → completeRep → workout done
    advanceAndFlush(1000); // to done
    advanceAndFlush(500);  // → hold (skipped) → from
    advanceAndFlush(1000); // from done
    advanceAndFlush(500);  // completeRep → complete

    expect(result.current.state.phase).toBe('complete');
  });

  it('exercise without tempo uses default timing', () => {
    const noTempoWorkout: Workout = {
      id: 'nt',
      title: 'No Tempo',
      exercises: [{
        title: 'Basic',
        repeatCount: 1,
        setCount: 1,
        restSeconds: 0,
        // No tempo field
      }],
    };
    const { result } = renderHook(() => usePlayerState(noTempoWorkout));

    expect(result.current.hasTempo).toBe(false);

    act(() => { result.current.actions.start(); });
    advancePastStart();

    expect(result.current.state.phase).toBe('exercise');

    // Default: to=1, hold=0, from=1
    advanceAndFlush(1000);
    advanceAndFlush(500);
    advanceAndFlush(1000);
    advanceAndFlush(500);

    expect(result.current.state.phase).toBe('complete');
  });

  it('pause during rest and resume works through to completion', () => {
    const { result } = renderHook(() => usePlayerState(multiSetWorkout));

    act(() => { result.current.actions.start(); });
    advancePastStart();

    // Skip to rest
    act(() => { result.current.actions.skip(); });
    expect(result.current.state.phase).toBe('rest');

    // Let 1 second pass
    advanceAndFlush(1000);

    // Pause
    act(() => { result.current.actions.togglePause(); });
    expect(result.current.state.isPaused).toBe(true);

    // Resume
    act(() => { result.current.actions.togglePause(); });
    expect(result.current.state.isPaused).toBe(false);

    // Let rest finish
    advanceAndFlush(1000); // rest should complete
    advanceAndFlush(500);  // RING_COMPLETE_DELAY → next set
    advanceAndFlush(500);

    expect(result.current.state.phase).toBe('exercise');
  });

  it('tempoSecondsLeft decrements during exercise', () => {
    const longTempo: Workout = {
      id: 'lt',
      title: 'Long Tempo',
      exercises: [{
        title: 'Slow',
        repeatCount: 1,
        setCount: 1,
        restSeconds: 0,
        tempo: { to: 3, hold: 0, from: 1 },
      }],
    };
    const { result } = renderHook(() => usePlayerState(longTempo));

    act(() => { result.current.actions.start(); });
    advancePastStart();

    expect(result.current.state.tempoSecondsLeft).toBe(3);

    advanceAndFlush(1000);
    expect(result.current.state.tempoSecondsLeft).toBe(2);

    advanceAndFlush(1000);
    expect(result.current.state.tempoSecondsLeft).toBe(1);
  });

  it('multi-set workout with rest between sets completes', () => {
    const w: Workout = {
      id: 'ms',
      title: 'Multi',
      exercises: [{
        title: 'Ex',
        repeatCount: 1,
        setCount: 2,
        restSeconds: 1,
        tempo: { to: 1, hold: 0, from: 1 },
      }],
    };
    const { result } = renderHook(() => usePlayerState(w));

    act(() => { result.current.actions.start(); });
    advancePastStart();

    // Set 1: to(1s) → from(1s) → rest(1s) → set 2: to(1s) → from(1s) → complete
    advanceAndFlush(1000); // to done
    advanceAndFlush(500);  // → from
    advanceAndFlush(1000); // from done
    advanceAndFlush(500);  // → rest

    expect(result.current.state.phase).toBe('rest');

    advanceAndFlush(1000); // rest done
    advanceAndFlush(500);  // → set 2

    advanceAndFlush(500);  // startTempoPhase delay

    expect(result.current.state.phase).toBe('exercise');

    advanceAndFlush(1000); // to done
    advanceAndFlush(500);  // → from
    advanceAndFlush(1000); // from done
    advanceAndFlush(500);  // → complete

    expect(result.current.state.phase).toBe('complete');
  });

  it('zero rest seconds skips rest entirely', () => {
    const noRest: Workout = {
      id: 'nr',
      title: 'No Rest',
      exercises: [{
        title: 'Ex',
        repeatCount: 1,
        setCount: 2,
        restSeconds: 0,
        tempo: { to: 1, hold: 0, from: 1 },
      }],
    };
    const { result } = renderHook(() => usePlayerState(noRest));

    act(() => { result.current.actions.start(); });
    advancePastStart();

    // Set 1: to(1s) → from(1s) → no rest → set 2 immediately
    advanceAndFlush(1000);
    advanceAndFlush(500);
    advanceAndFlush(1000);
    advanceAndFlush(500);

    // Should go directly to set 2 without rest phase
    expect(result.current.state.phase).toBe('exercise');
  });

  it('stop action clears the timer', () => {
    const { result } = renderHook(() => usePlayerState(simpleWorkout));

    act(() => { result.current.actions.start(); });
    advancePastStart();

    const tempoSecsBefore = result.current.state.tempoSecondsLeft;

    act(() => { result.current.actions.stop(); });

    // Timer should be stopped — advancing shouldn't change state
    advanceAndFlush(5000);
    expect(result.current.state.tempoSecondsLeft).toBe(tempoSecsBefore);
  });

  // ─── Sound event tests ──────────────────────────────────────────

  it('secondTick plays on each timer tick during exercise', async () => {
    const sound = await import('../../../shared/sound/SoundCue');
    const longTempo: Workout = {
      id: 'st',
      title: 'SecondTick',
      exercises: [{
        title: 'Ex',
        repeatCount: 1,
        setCount: 1,
        restSeconds: 0,
        tempo: { to: 3, hold: 0, from: 1 },
      }],
    };
    const { result } = renderHook(() => usePlayerState(longTempo));

    act(() => { result.current.actions.start(); });
    advancePastStart();

    vi.mocked(sound.secondTick).mockClear();

    // 3 second 'to' phase: tick at -1s, tick at -1s, then transition (no tick)
    advanceAndFlush(1000); // 3→2 (tick)
    advanceAndFlush(1000); // 2→1 (tick)
    expect(sound.secondTick).toHaveBeenCalledTimes(2);
  });

  it('secondTick plays on every second during rest', async () => {
    const sound = await import('../../../shared/sound/SoundCue');
    const restW: Workout = {
      id: 'str',
      title: 'SecondTickRest',
      exercises: [{
        title: 'Ex',
        repeatCount: 1,
        setCount: 2,
        restSeconds: 5,
        tempo: { to: 1, hold: 0, from: 1 },
      }],
    };
    const { result } = renderHook(() => usePlayerState(restW));

    act(() => { result.current.actions.start(); });
    advancePastStart();

    // Skip to rest
    act(() => { result.current.actions.skip(); });
    expect(result.current.state.phase).toBe('rest');

    vi.mocked(sound.secondTick).mockClear();

    advanceAndFlush(1000);
    expect(sound.secondTick).toHaveBeenCalledTimes(1);

    advanceAndFlush(1000);
    expect(sound.secondTick).toHaveBeenCalledTimes(2);
  });

  it('set completion triggers setComplete sound', async () => {
    const sound = await import('../../../shared/sound/SoundCue');
    const { result } = renderHook(() => usePlayerState(multiSetWorkout));

    act(() => { result.current.actions.start(); });
    advancePastStart();

    vi.mocked(sound.setComplete).mockClear();

    // Complete first set: to(1s) → hold(skip) → from(1s) → completeRep → set done
    advanceAndFlush(1000); // to done
    advanceAndFlush(500);  // RING_COMPLETE_DELAY + skip hold → from
    advanceAndFlush(1000); // from done
    advanceAndFlush(500);  // completeRep → set complete → rest

    expect(sound.setComplete).toHaveBeenCalledTimes(1);
  });

  it('workout completion does not trigger setComplete', async () => {
    const sound = await import('../../../shared/sound/SoundCue');
    const singleWorkout: Workout = {
      id: 'sc',
      title: 'Single',
      exercises: [{ title: 'Ex', repeatCount: 1, setCount: 1, restSeconds: 0, tempo: { to: 1, hold: 0, from: 1 } }],
    };
    const { result } = renderHook(() => usePlayerState(singleWorkout));

    act(() => { result.current.actions.start(); });
    advancePastStart();

    vi.mocked(sound.setComplete).mockClear();
    vi.mocked(sound.workoutComplete).mockClear();

    // Complete the only set: to(1s) → from(1s) → complete
    advanceAndFlush(1000);
    advanceAndFlush(500);
    advanceAndFlush(1000);
    advanceAndFlush(500);

    expect(result.current.state.phase).toBe('complete');
    expect(sound.workoutComplete).toHaveBeenCalledTimes(1);
    expect(sound.setComplete).not.toHaveBeenCalled();
  });

  it('exerciseStart plays at reading phase during automatic flow', async () => {
    const sound = await import('../../../shared/sound/SoundCue');
    // Two exercises: A has no description, B has description
    const w: Workout = {
      id: 'af',
      title: 'Auto Flow',
      exercises: [
        { title: 'A', repeatCount: 1, setCount: 1, restSeconds: 1, tempo: { to: 1, hold: 0, from: 1 } },
        { title: 'B', description: 'Описание B для чтения', repeatCount: 1, setCount: 1, restSeconds: 0, tempo: { to: 1, hold: 0, from: 1 } },
      ],
    };
    const { result } = renderHook(() => usePlayerState(w));

    act(() => { result.current.actions.start(); });
    advancePastStart();

    vi.mocked(sound.exerciseStart).mockClear();

    // Complete exercise A naturally: to(1s) → from(1s) → rest(1s) → exercise B
    advanceAndFlush(1000); // to
    advanceAndFlush(500);  // RING_COMPLETE_DELAY
    advanceAndFlush(1000); // from
    advanceAndFlush(500);  // completeRep → rest
    advanceAndFlush(1000); // rest done
    advanceAndFlush(500);  // RING_COMPLETE_DELAY → startExercise(1) automatic

    expect(result.current.state.phase).toBe('reading');
    expect(sound.exerciseStart).toHaveBeenCalledTimes(1);
  });

  it('exerciseStart does not play when start() begins workout', async () => {
    const sound = await import('../../../shared/sound/SoundCue');
    const { result } = renderHook(() => usePlayerState(readingWorkout));

    vi.mocked(sound.exerciseStart).mockClear();

    act(() => { result.current.actions.start(); });
    expect(result.current.state.phase).toBe('reading');
    expect(sound.exerciseStart).not.toHaveBeenCalled();
  });

  it('zero-duration tempo phases do not trigger tempoPhase sound', async () => {
    const sound = await import('../../../shared/sound/SoundCue');
    // hold=0 means hold phase is skipped — no "Держи" voice
    const noHold: Workout = {
      id: 'nh',
      title: 'No Hold',
      exercises: [{
        title: 'Ex',
        repeatCount: 1,
        setCount: 1,
        restSeconds: 0,
        tempo: { to: 1, hold: 0, from: 1 },
      }],
    };
    const { result } = renderHook(() => usePlayerState(noHold));

    act(() => { result.current.actions.start(); });
    advancePastStart();

    // tempoPhase('to') was already called during advancePastStart
    vi.mocked(sound.tempoPhase).mockClear();

    // to finishes → hold is skipped (0s) → from starts
    advanceAndFlush(1000); // to done
    advanceAndFlush(500);  // RING_COMPLETE_DELAY → skip hold → from

    // tempoPhase should have been called for 'from', but NOT 'hold'
    const calls = vi.mocked(sound.tempoPhase).mock.calls.map(c => c[0]);
    expect(calls).not.toContain('hold');
    expect(calls).toContain('from');
  });

  it('exerciseStart is not called for exercises without description', async () => {
    const sound = await import('../../../shared/sound/SoundCue');
    const { result } = renderHook(() => usePlayerState(simpleWorkout));

    vi.mocked(sound.exerciseStart).mockClear();

    act(() => { result.current.actions.start(); });
    advancePastStart();

    // simpleWorkout has no description → no reading phase → no exerciseStart
    expect(sound.exerciseStart).not.toHaveBeenCalled();
  });

  it('setComplete and restStart are called back-to-back on set completion', async () => {
    const sound = await import('../../../shared/sound/SoundCue');
    const { result } = renderHook(() => usePlayerState(multiSetWorkout));

    act(() => { result.current.actions.start(); });
    advancePastStart();

    const callOrder: string[] = [];
    vi.mocked(sound.setComplete).mockImplementation(() => { callOrder.push('setComplete'); });
    vi.mocked(sound.restStart).mockImplementation(() => { callOrder.push('restStart'); });

    // Complete first set: to(1s) → hold(skip) → from(1s) → completeRep → set done → rest
    advanceAndFlush(1000); // to done
    advanceAndFlush(500);  // RING_COMPLETE_DELAY + skip hold → from
    advanceAndFlush(1000); // from done
    advanceAndFlush(500);  // completeRep → setComplete + restStart

    expect(callOrder).toEqual(['setComplete', 'restStart']);
  });

  it('setComplete fires before next exerciseStart when rest=0 (automatic flow)', async () => {
    const sound = await import('../../../shared/sound/SoundCue');
    const noRestMulti: Workout = {
      id: 'nrm',
      title: 'No Rest Multi',
      exercises: [
        { title: 'A', repeatCount: 1, setCount: 1, restSeconds: 0, tempo: { to: 1, hold: 0, from: 1 } },
        { title: 'B', description: 'Описание упражнения B для чтения', repeatCount: 1, setCount: 1, restSeconds: 0, tempo: { to: 1, hold: 0, from: 1 } },
      ],
    };
    const { result } = renderHook(() => usePlayerState(noRestMulti));

    act(() => { result.current.actions.start(); });
    advancePastStart();

    const callOrder: string[] = [];
    vi.mocked(sound.setComplete).mockImplementation(() => { callOrder.push('setComplete'); });
    vi.mocked(sound.exerciseStart).mockImplementation(() => { callOrder.push('exerciseStart'); });

    // Complete exercise A: to(1s) → from(1s) → completeRep → setComplete → rest=0 → startExercise
    advanceAndFlush(1000); // to done
    advanceAndFlush(500);  // RING_COMPLETE_DELAY
    advanceAndFlush(1000); // from done
    advanceAndFlush(500);  // completeRep → setComplete + rest(0) → safeTimeout(0)

    // rest=0 skips rest, uses safeTimeout(0) to call startExercise
    // Exercise B has description → reading phase → exerciseStart sound
    advanceAndFlush(100);  // flush safeTimeout(0) → startExercise → exerciseStart

    expect(callOrder).toEqual(['setComplete', 'exerciseStart']);
  });

  it('exerciseStart does not play on manual navigation', async () => {
    const sound = await import('../../../shared/sound/SoundCue');
    const workout: Workout = {
      id: 'mn',
      title: 'Manual Nav',
      exercises: [
        { title: 'A', description: 'Описание A', repeatCount: 1, setCount: 1, restSeconds: 0, tempo: { to: 1, hold: 0, from: 1 } },
        { title: 'B', description: 'Описание B', repeatCount: 1, setCount: 1, restSeconds: 0, tempo: { to: 1, hold: 0, from: 1 } },
      ],
    };
    const { result } = renderHook(() => usePlayerState(workout));

    act(() => { result.current.actions.start(); });
    // exerciseStart fires for automatic start of exercise with description
    vi.mocked(sound.exerciseStart).mockClear();

    // Manual forward
    act(() => { result.current.actions.nextExercise(); });
    advanceAndFlush(500);
    expect(sound.exerciseStart).not.toHaveBeenCalled();

    // Manual back
    act(() => { result.current.actions.prevExercise(); });
    advanceAndFlush(500);
    expect(sound.exerciseStart).not.toHaveBeenCalled();

    // goToExercise
    act(() => { result.current.actions.goToExercise(1); });
    advanceAndFlush(500);
    expect(sound.exerciseStart).not.toHaveBeenCalled();
  });

  it('exerciseStart does not play on startFromExercise', async () => {
    const sound = await import('../../../shared/sound/SoundCue');
    const workout: Workout = {
      id: 'sf',
      title: 'StartFrom',
      exercises: [
        { title: 'A', description: 'Описание A', repeatCount: 1, setCount: 1, restSeconds: 0, tempo: { to: 1, hold: 0, from: 1 } },
        { title: 'B', description: 'Описание B', repeatCount: 1, setCount: 1, restSeconds: 0, tempo: { to: 1, hold: 0, from: 1 } },
      ],
    };
    const { result } = renderHook(() => usePlayerState(workout));

    vi.mocked(sound.exerciseStart).mockClear();

    act(() => { result.current.actions.startFromExercise(1); });
    expect(result.current.state.phase).toBe('reading');
    expect(sound.exerciseStart).not.toHaveBeenCalled();
  });

  it('exerciseStart does not play on skip from rest to next exercise', async () => {
    const sound = await import('../../../shared/sound/SoundCue');
    const workout: Workout = {
      id: 'sr',
      title: 'Skip Rest',
      exercises: [
        { title: 'A', repeatCount: 1, setCount: 1, restSeconds: 5, tempo: { to: 1, hold: 0, from: 1 } },
        { title: 'B', description: 'Описание B', repeatCount: 1, setCount: 1, restSeconds: 0, tempo: { to: 1, hold: 0, from: 1 } },
      ],
    };
    const { result } = renderHook(() => usePlayerState(workout));

    act(() => { result.current.actions.start(); });
    advancePastStart();

    // Skip exercise to get to rest
    act(() => { result.current.actions.skip(); });
    expect(result.current.state.phase).toBe('rest');

    vi.mocked(sound.exerciseStart).mockClear();

    // Skip rest — goes to next exercise
    act(() => { result.current.actions.skip(); });
    advanceAndFlush(500);
    expect(result.current.state.exerciseIndex).toBe(1);
    expect(sound.exerciseStart).not.toHaveBeenCalled();
  });

  it('exerciseStart does not play on nextSet crossing to next exercise', async () => {
    const sound = await import('../../../shared/sound/SoundCue');
    const workout: Workout = {
      id: 'ns',
      title: 'NextSet Cross',
      exercises: [
        { title: 'A', repeatCount: 1, setCount: 1, restSeconds: 0, tempo: { to: 1, hold: 0, from: 1 } },
        { title: 'B', description: 'Описание B', repeatCount: 1, setCount: 1, restSeconds: 0, tempo: { to: 1, hold: 0, from: 1 } },
      ],
    };
    const { result } = renderHook(() => usePlayerState(workout));

    act(() => { result.current.actions.start(); });
    advancePastStart();

    vi.mocked(sound.exerciseStart).mockClear();

    // nextSet on last set → goes to next exercise
    act(() => { result.current.actions.nextSet(); });
    advanceAndFlush(500);
    expect(result.current.state.exerciseIndex).toBe(1);
    expect(sound.exerciseStart).not.toHaveBeenCalled();
  });

  it('exerciseStart does not play on prevSet going to previous exercise', async () => {
    const sound = await import('../../../shared/sound/SoundCue');
    const workout: Workout = {
      id: 'ps',
      title: 'PrevSet Cross',
      exercises: [
        { title: 'A', description: 'Описание A', repeatCount: 1, setCount: 1, restSeconds: 2, tempo: { to: 1, hold: 0, from: 1 } },
        { title: 'B', description: 'Описание B', repeatCount: 1, setCount: 1, restSeconds: 0, tempo: { to: 1, hold: 0, from: 1 } },
      ],
    };
    const { result } = renderHook(() => usePlayerState(workout));

    // Start at exercise B via reading phase
    act(() => { result.current.actions.startFromExercise(1); });
    expect(result.current.state.phase).toBe('reading');

    vi.mocked(sound.exerciseStart).mockClear();

    // prevSet during reading → goes to previous exercise
    act(() => { result.current.actions.prevSet(); });
    advanceAndFlush(500);
    expect(result.current.state.exerciseIndex).toBe(0);
    expect(sound.exerciseStart).not.toHaveBeenCalled();
  });

  // ─── elapsedSecondsRef tests ─────────────────────────────────────

  it('elapsedSecondsRef starts at 0', () => {
    const { result } = renderHook(() => usePlayerState(simpleWorkout));
    expect(result.current.elapsedSecondsRef.current).toBe(0);
  });

  it('elapsedSecondsRef increments each second during exercise', () => {
    const longTempo: Workout = {
      id: 'el',
      title: 'Elapsed',
      exercises: [{
        title: 'Ex',
        repeatCount: 1,
        setCount: 1,
        restSeconds: 0,
        tempo: { to: 5, hold: 0, from: 1 },
      }],
    };
    const { result } = renderHook(() => usePlayerState(longTempo));

    act(() => { result.current.actions.start(); });
    advancePastStart();

    const before = result.current.elapsedSecondsRef.current;
    advanceAndFlush(1000);
    expect(result.current.elapsedSecondsRef.current).toBe(before + 1);
    advanceAndFlush(1000);
    expect(result.current.elapsedSecondsRef.current).toBe(before + 2);
  });

  it('elapsedSecondsRef does not increment while paused', () => {
    const longTempo: Workout = {
      id: 'elp',
      title: 'Elapsed Paused',
      exercises: [{
        title: 'Ex',
        repeatCount: 1,
        setCount: 1,
        restSeconds: 0,
        tempo: { to: 10, hold: 0, from: 1 },
      }],
    };
    const { result } = renderHook(() => usePlayerState(longTempo));

    act(() => { result.current.actions.start(); });
    advancePastStart();

    advanceAndFlush(2000); // 2 ticks
    const afterTicks = result.current.elapsedSecondsRef.current;

    act(() => { result.current.actions.togglePause(); });
    advanceAndFlush(3000); // paused — no increment
    expect(result.current.elapsedSecondsRef.current).toBe(afterTicks);

    act(() => { result.current.actions.togglePause(); });
    advanceAndFlush(1000); // resumed — 1 more tick
    expect(result.current.elapsedSecondsRef.current).toBe(afterTicks + 1);
  });

  it('elapsedSecondsRef resets on start', () => {
    const { result } = renderHook(() => usePlayerState(simpleWorkout));

    act(() => { result.current.actions.start(); });
    advancePastStart();
    advanceAndFlush(1000);
    expect(result.current.elapsedSecondsRef.current).toBeGreaterThan(0);

    act(() => { result.current.actions.start(); });
    expect(result.current.elapsedSecondsRef.current).toBe(0);
  });

  it('elapsedSecondsRef resets on startFromExercise', () => {
    const { result } = renderHook(() => usePlayerState(multiExerciseWorkout));

    act(() => { result.current.actions.start(); });
    advancePastStart();
    advanceAndFlush(1000);
    expect(result.current.elapsedSecondsRef.current).toBeGreaterThan(0);

    act(() => { result.current.actions.startFromExercise(1); });
    expect(result.current.elapsedSecondsRef.current).toBe(0);
  });

  it('elapsedSecondsRef increments during rest phase', () => {
    const { result } = renderHook(() => usePlayerState(multiSetWorkout));

    act(() => { result.current.actions.start(); });
    advancePastStart();

    // Skip to rest
    act(() => { result.current.actions.skip(); });
    expect(result.current.state.phase).toBe('rest');

    const before = result.current.elapsedSecondsRef.current;
    advanceAndFlush(1000);
    expect(result.current.elapsedSecondsRef.current).toBe(before + 1);
  });

  it('elapsedSecondsRef does not increment during countdown phase', () => {
    const withDesc: Workout = {
      id: 'cd',
      title: 'Countdown test',
      exercises: [{
        title: 'Ex',
        description: 'A long enough description to trigger reading phase for sure here',
        repeatCount: 1,
        setCount: 1,
        restSeconds: 0,
        tempo: { to: 5, hold: 0, from: 1 },
      }],
    };
    const { result } = renderHook(() => usePlayerState(withDesc));

    act(() => { result.current.actions.start(); });

    // Should be in reading phase
    expect(result.current.state.phase).toBe('reading');
    const afterStart = result.current.elapsedSecondsRef.current;

    // Advance through reading phase ticks
    advanceAndFlush(2000);
    expect(result.current.elapsedSecondsRef.current).toBe(afterStart);
  });

  // ─── sessionStartRef tests ─────────────────────────────────────

  it('sessionStartRef is empty before start', () => {
    const { result } = renderHook(() => usePlayerState(simpleWorkout));
    expect(result.current.sessionStartRef.current).toBe('');
  });

  it('sessionStartRef is set on start', () => {
    const { result } = renderHook(() => usePlayerState(simpleWorkout));
    act(() => { result.current.actions.start(); });
    expect(result.current.sessionStartRef.current).not.toBe('');
    expect(result.current.sessionStartRef.current).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('sessionStartRef changes on re-start', () => {
    vi.spyOn(Date.prototype, 'toISOString')
      .mockReturnValueOnce('2026-03-22T10:00:00.000Z')
      .mockReturnValueOnce('2026-03-22T10:05:00.000Z');

    const { result } = renderHook(() => usePlayerState(simpleWorkout));
    act(() => { result.current.actions.start(); });
    const first = result.current.sessionStartRef.current;

    act(() => { result.current.actions.start(); });
    const second = result.current.sessionStartRef.current;

    expect(first).not.toBe(second);
    vi.restoreAllMocks();
  });

  it('sessionStartRef resets on startFromExercise', () => {
    vi.spyOn(Date.prototype, 'toISOString')
      .mockReturnValueOnce('2026-03-22T10:00:00.000Z')
      .mockReturnValueOnce('2026-03-22T10:05:00.000Z');

    const { result } = renderHook(() => usePlayerState(multiExerciseWorkout));
    act(() => { result.current.actions.start(); });
    const first = result.current.sessionStartRef.current;

    act(() => { result.current.actions.startFromExercise(1); });
    const second = result.current.sessionStartRef.current;

    expect(first).not.toBe(second);
    vi.restoreAllMocks();
  });

  it('tempoPhase passes isStatic=true for static exercises', async () => {
    const sound = await import('../../../shared/sound/SoundCue');
    const staticWorkout: Workout = {
      id: 'st',
      title: 'Static',
      exercises: [{
        title: 'Plank',
        repeatCount: 1,
        setCount: 1,
        restSeconds: 0,
        tempo: { to: 0, hold: 3, from: 0 },
      }],
    };
    const { result } = renderHook(() => usePlayerState(staticWorkout));

    vi.mocked(sound.tempoPhase).mockClear();

    act(() => { result.current.actions.start(); });
    advancePastStart();

    // to=0 (skipped), hold=3 (plays), from=0 (skipped)
    expect(sound.tempoPhase).toHaveBeenCalledWith('hold', true);
  });
});
