import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Exercise, Workout } from './types';
import * as sound from '../../../shared/sound/SoundCue';

export type Phase = 'reading' | 'countdown' | 'exercise' | 'rest' | 'complete';
export type TempoPhase = 'to' | 'hold' | 'from';

export interface PlayerState {
  phase: Phase;
  exerciseIndex: number;
  setIndex: number;
  repIndex: number;
  tempoPhase: TempoPhase | null;
  tempoSecondsLeft: number;
  restSecondsLeft: number;
  readingSecondsLeft: number;
  countdownSecondsLeft: number;
  isPaused: boolean;
}

function getTempoLabel(phase: TempoPhase, exercise?: Exercise): string {
  if (phase === 'to') return 'Вперёд';
  if (phase === 'from') return 'Назад';
  const isStatic = exercise?.tempo && exercise.tempo.to === 0 && exercise.tempo.from === 0;
  return isStatic ? 'Работаем' : 'Задержись';
}

const RING_COMPLETE_DELAY = 400;

export function getReadingSeconds(description?: string): number {
  if (!description || description.length === 0) return 0;
  return Math.max(4, Math.min(20, Math.ceil(description.length / 15)));
}

function getTempoSeconds(exercise: Exercise, phase: TempoPhase): number {
  if (!exercise.tempo) return phase === 'hold' ? 0 : 1;
  return exercise.tempo[phase] ?? (phase === 'hold' ? 0 : 1);
}

function hasTempo(exercise: Exercise): boolean {
  return !!exercise.tempo;
}

function nextTempoPhase(current: TempoPhase): TempoPhase | null {
  switch (current) {
    case 'to': return 'hold';
    case 'hold': return 'from';
    case 'from': return null;
  }
}

export function usePlayerState(workout: Workout) {
  const exercises = workout.exercises;

  const [state, setState] = useState<PlayerState>({
    phase: 'exercise',
    exerciseIndex: 0,
    setIndex: 0,
    repIndex: 0,
    tempoPhase: null,
    tempoSecondsLeft: 0,
    restSecondsLeft: 0,
    readingSecondsLeft: 0,
    countdownSecondsLeft: 0,
    isPaused: false,
  });

  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; });

  const elapsedSecondsRef = useRef(0);
  const sessionStartRef = useRef('');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const generationRef = useRef(0);
  const startTempoPhaseRef = useRef<(exIdx: number, setIdx: number, repIdx: number, tp: TempoPhase) => void>(() => {});
  const completeRepRef = useRef<(exIdx: number, setIdx: number, repIdx: number) => void>(() => {});
  const startRestRef = useRef<(currentExIdx: number, nextSetIdx: number, nextExIdx?: number) => void>(() => {});
  const startExerciseRef = useRef<(exIdx: number, silent?: boolean) => void>(() => {});
  const startCountdownBeforeExerciseRef = useRef<(exIdx: number) => void>(() => {});

  const currentExercise = exercises[state.exerciseIndex];

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      generationRef.current += 1;
      sound.cancelPending();
    };
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    generationRef.current += 1;
  }, []);

  const safeTimeout = useCallback((fn: () => void, ms: number) => {
    const gen = generationRef.current;
    setTimeout(() => {
      if (generationRef.current === gen) fn();
    }, ms);
  }, []);

  /** Create an interval that decrements a state field each second, calling onZero when it reaches 0 */
  const startCountdown = useCallback((config: {
    field: 'tempoSecondsLeft' | 'restSecondsLeft' | 'readingSecondsLeft' | 'countdownSecondsLeft';
    onZero: (state: PlayerState) => void;
    tickSound?: boolean;
  }) => {
    timerRef.current = setInterval(() => {
      const current = stateRef.current;
      if (current.phase === 'exercise' || current.phase === 'rest') {
        elapsedSecondsRef.current += 1;
      }
      if (current[config.field] <= 1) {
        clearTimer();
        setState((s) => ({ ...s, [config.field]: 0 }));
        config.onZero(current);
      } else {
        if (config.tickSound) sound.secondTick();
        setState((s) => ({ ...s, [config.field]: s[config.field] - 1 }));
      }
    }, 1000);
  }, [clearTimer]);

  const startTempoPhase = useCallback(
    (exIdx: number, setIdx: number, repIdx: number, tp: TempoPhase) => {
      clearTimer();
      const ex = exercises[exIdx];
      const seconds = getTempoSeconds(ex, tp);

      if (seconds <= 0) {
        const next = nextTempoPhase(tp);
        if (next) {
          safeTimeout(() => startTempoPhaseRef.current(exIdx, setIdx, repIdx, next), 0);
        } else {
          safeTimeout(() => completeRepRef.current(exIdx, setIdx, repIdx), 0);
        }
        return;
      }

      if (hasTempo(ex)) {
        const isStatic = ex.tempo!.to === 0 && ex.tempo!.from === 0;
        sound.tempoPhase(tp, isStatic);
      } else if (tp === 'to') {
        sound.repTick(repIdx / Math.max(1, ex.repeatCount - 1));
      }

      setState((s) => ({
        ...s,
        phase: 'exercise',
        exerciseIndex: exIdx,
        setIndex: setIdx,
        repIndex: repIdx,
        tempoPhase: tp,
        tempoSecondsLeft: seconds,
        isPaused: false,
      }));

      startCountdown({
        field: 'tempoSecondsLeft',
        tickSound: true,
        onZero: () => {
          const next = nextTempoPhase(tp);
          if (next) {
            safeTimeout(() => startTempoPhaseRef.current(exIdx, setIdx, repIdx, next), RING_COMPLETE_DELAY);
          } else {
            safeTimeout(() => completeRepRef.current(exIdx, setIdx, repIdx), RING_COMPLETE_DELAY);
          }
        },
      });
    },
    [exercises, clearTimer, safeTimeout, startCountdown],
  );

  useEffect(() => { startTempoPhaseRef.current = startTempoPhase; }, [startTempoPhase]);

  const completeRep = useCallback(
    (exIdx: number, setIdx: number, repIdx: number) => {
      const ex = exercises[exIdx];
      const nextRep = repIdx + 1;

      if (nextRep < ex.repeatCount) {
        startTempoPhaseRef.current(exIdx, setIdx, nextRep, 'to');
      } else {
        const nextSet = setIdx + 1;
        if (nextSet < ex.setCount) {
          sound.setComplete();
          startRestRef.current(exIdx, nextSet);
        } else {
          const nextEx = exIdx + 1;
          if (nextEx < exercises.length) {
            sound.setComplete();
            startRestRef.current(exIdx, -1, nextEx);
          } else {
            clearTimer();
            sound.workoutComplete();
            setState((s) => ({ ...s, phase: 'complete' }));
          }
        }
      }
    },
    [exercises, clearTimer],
  );

  useEffect(() => { completeRepRef.current = completeRep; }, [completeRep]);

  const startRest = useCallback(
    (currentExIdx: number, nextSetIdx: number, nextExIdx?: number) => {
      clearTimer();
      const ex = exercises[currentExIdx];
      const restSec = ex.restSeconds;

      if (restSec <= 0) {
        if (nextExIdx !== undefined) {
          safeTimeout(() => startExerciseRef.current(nextExIdx), 0);
        } else {
          safeTimeout(() => startTempoPhaseRef.current(currentExIdx, nextSetIdx, 0, 'to'), 0);
        }
        return;
      }

      sound.restStart();

      setState((s) => ({
        ...s,
        phase: 'rest',
        restSecondsLeft: restSec,
        isPaused: false,
        exerciseIndex: currentExIdx,
        setIndex: nextSetIdx >= 0 ? nextSetIdx - 1 : s.setIndex,
      }));

      startCountdown({
        field: 'restSecondsLeft',
        tickSound: true,
        onZero: () => {
          if (nextExIdx !== undefined) {
            safeTimeout(() => startExerciseRef.current(nextExIdx), RING_COMPLETE_DELAY);
          } else {
            safeTimeout(() => startTempoPhaseRef.current(currentExIdx, nextSetIdx, 0, 'to'), RING_COMPLETE_DELAY);
          }
        },
      });
    },
    [exercises, clearTimer, safeTimeout, startCountdown],
  );

  useEffect(() => { startRestRef.current = startRest; }, [startRest]);

  const COUNTDOWN_SECONDS = 3;

  const startCountdownBeforeExercise = useCallback(
    (exIdx: number) => {
      clearTimer();
      sound.secondTick();
      setState((s) => ({
        ...s,
        phase: 'countdown',
        exerciseIndex: exIdx,
        setIndex: 0,
        repIndex: 0,
        countdownSecondsLeft: COUNTDOWN_SECONDS,
        isPaused: false,
      }));

      startCountdown({
        field: 'countdownSecondsLeft',
        tickSound: true,
        onZero: () => {
          safeTimeout(() => startTempoPhaseRef.current(exIdx, 0, 0, 'to'), 0);
        },
      });
    },
    [clearTimer, safeTimeout, startCountdown],
  );

  useEffect(() => { startCountdownBeforeExerciseRef.current = startCountdownBeforeExercise; }, [startCountdownBeforeExercise]);

  const startExercise = useCallback(
    (exIdx: number, silent = false) => {
      const ex = exercises[exIdx];
      const readingSecs = getReadingSeconds(ex.description);

      if (readingSecs > 0) {
        clearTimer();
        if (!silent) sound.exerciseStart();
        setState((s) => ({
          ...s,
          phase: 'reading',
          exerciseIndex: exIdx,
          setIndex: 0,
          repIndex: 0,
          readingSecondsLeft: readingSecs,
          isPaused: false,
        }));

        startCountdown({
          field: 'readingSecondsLeft',
          onZero: () => {
            safeTimeout(() => startCountdownBeforeExerciseRef.current(exIdx), 0);
          },
        });
      } else {
        setState((s) => ({
          ...s,
          exerciseIndex: exIdx,
          setIndex: 0,
          repIndex: 0,
          tempoPhase: 'to',
        }));
        safeTimeout(() => startTempoPhaseRef.current(exIdx, 0, 0, 'to'), 300);
      }
    },
    [exercises, clearTimer, safeTimeout, startCountdown],
  );

  useEffect(() => { startExerciseRef.current = startExercise; }, [startExercise]);

  // Public actions
  const startFromExercise = useCallback((fromIndex: number) => {
    clearTimer();
    elapsedSecondsRef.current = 0;
    sessionStartRef.current = new Date().toISOString();
    startExerciseRef.current(fromIndex, true);
  }, [clearTimer]);

  const start = useCallback(() => {
    startFromExercise(0);
  }, [startFromExercise]);

  /** Resume the timer for the current phase after a pause */
  const resumeTimer = useCallback((prev: PlayerState) => {
    // Guard: clear orphaned interval from React StrictMode double-invocation
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (prev.phase === 'reading') {
      startCountdown({
        field: 'readingSecondsLeft',
        onZero: (p) => {
          safeTimeout(() => startCountdownBeforeExerciseRef.current(p.exerciseIndex), 0);
        },
      });
    } else if (prev.phase === 'countdown') {
      startCountdown({
        field: 'countdownSecondsLeft',
        tickSound: true,
        onZero: (p) => {
          safeTimeout(() => startTempoPhaseRef.current(p.exerciseIndex, 0, 0, 'to'), 0);
        },
      });
    } else if (prev.phase === 'exercise' && prev.tempoPhase) {
      startCountdown({
        field: 'tempoSecondsLeft',
        tickSound: true,
        onZero: (p) => {
          const next = nextTempoPhase(p.tempoPhase!);
          if (next) {
            safeTimeout(() => startTempoPhaseRef.current(p.exerciseIndex, p.setIndex, p.repIndex, next), 0);
          } else {
            safeTimeout(() => completeRepRef.current(p.exerciseIndex, p.setIndex, p.repIndex), 0);
          }
        },
      });
    } else if (prev.phase === 'rest') {
      startCountdown({
        field: 'restSecondsLeft',
        tickSound: true,
        onZero: (p) => {
          const ex = exercises[p.exerciseIndex];
          const nextSet = p.setIndex + 1;
          if (nextSet < ex.setCount) {
            safeTimeout(() => startTempoPhaseRef.current(p.exerciseIndex, nextSet, 0, 'to'), 0);
          } else {
            const nextEx = p.exerciseIndex + 1;
            if (nextEx < exercises.length) {
              safeTimeout(() => startExerciseRef.current(nextEx), 0);
            } else {
              sound.workoutComplete();
              setState((s) => ({ ...s, phase: 'complete', restSecondsLeft: 0 }));
            }
          }
        },
      });
    }
  }, [exercises, startCountdown, safeTimeout]);

  const togglePause = useCallback(() => {
    const prev = stateRef.current;
    if (prev.phase === 'complete') return;
    if (prev.isPaused) {
      setState((s) => ({ ...s, isPaused: false }));
      resumeTimer(prev);
    } else {
      clearTimer();
      setState((s) => ({ ...s, isPaused: true }));
    }
  }, [clearTimer, resumeTimer]);

  const skip = useCallback(() => {
    clearTimer();

    const { exerciseIndex: exIdx, setIndex: setIdx, phase } = stateRef.current;
    const ex = exercises[exIdx];

    if (phase === 'reading' || phase === 'countdown') {
      startTempoPhaseRef.current(exIdx, 0, 0, 'to');
    } else if (phase === 'exercise') {
      const nextSet = setIdx + 1;
      if (nextSet < ex.setCount) {
        startRestRef.current(exIdx, nextSet);
      } else {
        const nextEx = exIdx + 1;
        if (nextEx < exercises.length) {
          startRestRef.current(exIdx, -1, nextEx);
        } else {
          sound.workoutComplete();
          setState((s) => ({ ...s, phase: 'complete' }));
        }
      }
    } else if (phase === 'rest') {
      const nextSet = setIdx + 1;
      if (nextSet < ex.setCount) {
        startTempoPhaseRef.current(exIdx, nextSet, 0, 'to');
      } else {
        const nextEx = exIdx + 1;
        if (nextEx < exercises.length) {
          startExerciseRef.current(nextEx, true);
        } else {
          sound.workoutComplete();
          setState((s) => ({ ...s, phase: 'complete' }));
        }
      }
    }
  }, [exercises, clearTimer]);

  const prevExercise = useCallback(() => {
    clearTimer();
    const prevIdx = Math.max(0, stateRef.current.exerciseIndex - 1);
    startExerciseRef.current(prevIdx, true);
  }, [clearTimer]);

  const nextExercise = useCallback(() => {
    clearTimer();
    const nextIdx = stateRef.current.exerciseIndex + 1;
    if (nextIdx < exercises.length) {
      startExerciseRef.current(nextIdx, true);
    } else {
      sound.workoutComplete();
      setState((s) => ({ ...s, phase: 'complete' }));
    }
  }, [exercises.length, clearTimer]);

  const prevSet = useCallback(() => {
    const { exerciseIndex: exIdx, setIndex: setIdx, phase } = stateRef.current;
    if (phase === 'reading' || phase === 'countdown') {
      if (exIdx > 0) {
        clearTimer();
        startExerciseRef.current(exIdx - 1, true);
      }
      return;
    }
    clearTimer();
    if (setIdx > 0) {
      startTempoPhaseRef.current(exIdx, setIdx - 1, 0, 'to');
    } else {
      startExerciseRef.current(exIdx, true);
    }
  }, [clearTimer]);

  const nextSet = useCallback(() => {
    clearTimer();
    const { exerciseIndex: exIdx, setIndex: setIdx, phase } = stateRef.current;
    if (phase === 'reading' || phase === 'countdown') {
      startTempoPhaseRef.current(exIdx, 0, 0, 'to');
      return;
    }
    const ex = exercises[exIdx];
    const nextSetIdx = setIdx + 1;
    if (nextSetIdx < ex.setCount) {
      startTempoPhaseRef.current(exIdx, nextSetIdx, 0, 'to');
    } else {
      const nextEx = exIdx + 1;
      if (nextEx < exercises.length) {
        startExerciseRef.current(nextEx, true);
      } else {
        sound.workoutComplete();
        setState((s) => ({ ...s, phase: 'complete' }));
      }
    }
  }, [exercises, clearTimer]);

  const goToExercise = useCallback((index: number) => {
    if (index >= 0 && index < exercises.length) {
      clearTimer();
      startExerciseRef.current(index, true);
    }
  }, [exercises.length, clearTimer]);

  // Computed values
  const totalReps = currentExercise?.repeatCount ?? 0;
  const totalSets = currentExercise?.setCount ?? 0;
  const ringProgress = useMemo(() => {
    if (state.phase === 'exercise' && state.tempoPhase && currentExercise) {
      const totalTempoTime =
        getTempoSeconds(currentExercise, 'to') +
        getTempoSeconds(currentExercise, 'hold') +
        getTempoSeconds(currentExercise, 'from');
      const phases: TempoPhase[] = ['to', 'hold', 'from'];
      const currentPhaseIdx = phases.indexOf(state.tempoPhase);
      let elapsed = 0;
      for (let i = 0; i < currentPhaseIdx; i++) {
        elapsed += getTempoSeconds(currentExercise, phases[i]);
      }
      const currentPhaseDuration = getTempoSeconds(currentExercise, state.tempoPhase);
      elapsed += currentPhaseDuration - state.tempoSecondsLeft;
      return totalTempoTime > 0 ? elapsed / totalTempoTime : 0;
    }
    if (state.phase === 'rest' && currentExercise) {
      return 1 - state.restSecondsLeft / currentExercise.restSeconds;
    }
    return 0;
  }, [state.phase, state.tempoPhase, state.tempoSecondsLeft, state.restSecondsLeft, currentExercise]);

  return {
    state,
    currentExercise,
    totalReps,
    totalSets,
    ringProgress,
    elapsedSecondsRef,
    sessionStartRef,
    tempoLabel: state.tempoPhase ? getTempoLabel(state.tempoPhase, currentExercise) : null,
    hasTempo: currentExercise ? hasTempo(currentExercise) : false,
    nextExerciseData:
      state.exerciseIndex + 1 < exercises.length
        ? exercises[state.exerciseIndex + 1]
        : null,
    actions: useMemo(() => ({
      start,
      stop: clearTimer,
      startFromExercise,
      togglePause,
      skip,
      prevExercise,
      nextExercise,
      prevSet,
      nextSet,
      goToExercise,
    }), [start, clearTimer, startFromExercise, togglePause, skip, prevExercise, nextExercise, prevSet, nextSet, goToExercise]),
  };
}
