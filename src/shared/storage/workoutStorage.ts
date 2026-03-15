import type { Workout } from '../../features/workout/model/types';

const STORAGE_KEY = 'exercaise_workouts';

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function isValidTempo(t: unknown): boolean {
  if (typeof t !== 'object' || t === null) return false;
  const obj = t as Record<string, unknown>;
  return (
    isFiniteNumber(obj.to) && obj.to >= 0 &&
    isFiniteNumber(obj.hold) && obj.hold >= 0 &&
    isFiniteNumber(obj.from) && obj.from >= 0
  );
}

function isValidExercise(e: unknown): boolean {
  if (typeof e !== 'object' || e === null) return false;
  const obj = e as Record<string, unknown>;
  return (
    typeof obj.title === 'string' &&
    isFiniteNumber(obj.repeatCount) && obj.repeatCount >= 1 &&
    isFiniteNumber(obj.setCount) && obj.setCount >= 1 &&
    isFiniteNumber(obj.restSeconds) && obj.restSeconds >= 0 &&
    (obj.tempo === undefined || isValidTempo(obj.tempo))
  );
}

function isValidWorkout(w: unknown): w is Workout {
  if (typeof w !== 'object' || w === null) return false;
  const obj = w as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    Array.isArray(obj.exercises) &&
    obj.exercises.length > 0 &&
    obj.exercises.every(isValidExercise)
  );
}

export function hasStoredWorkouts(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

export function loadOrSeedWorkouts(defaults: Workout[]): Workout[] {
  if (!hasStoredWorkouts()) {
    saveWorkouts(defaults);
    return [...defaults];
  }
  return loadWorkouts();
}

export function loadWorkouts(): Workout[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const valid = parsed.filter(isValidWorkout);
    const dropped = parsed.length - valid.length;
    if (dropped > 0) {
      console.warn(`[exercaise] ${dropped} тренировок отфильтровано из localStorage (невалидная схема)`);
    }
    return valid;
  } catch {
    return [];
  }
}

export function saveWorkouts(workouts: Workout[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
}

export function addWorkout(workout: Workout, current?: Workout[]): Workout[] {
  const existing = current ?? loadWorkouts();
  const updated = [workout, ...existing.filter(w => w.id !== workout.id)];
  saveWorkouts(updated);
  return updated;
}

export function removeWorkout(id: string, current?: Workout[]): Workout[] {
  const existing = current ?? loadWorkouts();
  const updated = existing.filter(w => w.id !== id);
  saveWorkouts(updated);
  return updated;
}

export function updateWorkout(id: string, workout: Workout, current?: Workout[]): Workout[] {
  const existing = current ?? loadWorkouts();
  const updated = existing.map(w => w.id === id ? workout : w);
  saveWorkouts(updated);
  return updated;
}
