import { describe, it, expect, beforeEach } from 'vitest';
import { loadWorkouts, saveWorkouts, addWorkout, removeWorkout } from './workoutStorage';
import type { Workout } from '../../features/workout/model/types';

const STORAGE_KEY = 'exercaise_workouts';

const workout1: Workout = {
  id: 'w1',
  title: 'Workout 1',
  exercises: [{ title: 'Ex1', repeatCount: 10, setCount: 3, restSeconds: 60, tempo: { to: 1, hold: 0, from: 1 } }],
};

const workout2: Workout = {
  id: 'w2',
  title: 'Workout 2',
  exercises: [{ title: 'Ex2', repeatCount: 5, setCount: 2, restSeconds: 30 }],
};

describe('workoutStorage', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  describe('loadWorkouts', () => {
    it('returns empty array when storage is empty', () => {
      expect(loadWorkouts()).toEqual([]);
    });

    it('returns parsed workouts from storage', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([workout1]));
      expect(loadWorkouts()).toEqual([workout1]);
    });

    it('returns empty array on invalid JSON', () => {
      localStorage.setItem(STORAGE_KEY, 'not json');
      expect(loadWorkouts()).toEqual([]);
    });
  });

  describe('saveWorkouts', () => {
    it('saves workouts to localStorage', () => {
      saveWorkouts([workout1, workout2]);
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored).toEqual([workout1, workout2]);
    });
  });

  describe('addWorkout', () => {
    it('adds a new workout', () => {
      const result = addWorkout(workout1);
      expect(result).toEqual([workout1]);
    });

    it('replaces workout with same id', () => {
      addWorkout(workout1);
      const updated = { ...workout1, title: 'Updated' };
      const result = addWorkout(updated);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Updated');
    });

    it('appends without removing others', () => {
      addWorkout(workout1);
      const result = addWorkout(workout2);
      expect(result).toHaveLength(2);
    });
  });

  describe('removeWorkout', () => {
    it('removes workout by id', () => {
      addWorkout(workout1);
      addWorkout(workout2);
      const result = removeWorkout('w1');
      expect(result).toEqual([workout2]);
    });

    it('returns empty array when removing last workout', () => {
      addWorkout(workout1);
      const result = removeWorkout('w1');
      expect(result).toEqual([]);
    });

    it('does nothing when id not found', () => {
      addWorkout(workout1);
      const result = removeWorkout('nonexistent');
      expect(result).toEqual([workout1]);
    });
  });

  describe('tempo validation', () => {
    it('loads workouts with valid tempo', () => {
      const workouts = [{ id: 'tw', title: 'Tempo', exercises: [{ title: 'Ex', repeatCount: 5, setCount: 2, restSeconds: 30, tempo: { to: 2, hold: 1, from: 2 } }] }];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
      expect(loadWorkouts()).toEqual(workouts);
    });

    it('loads workouts without tempo', () => {
      const workouts = [{ id: 'nt', title: 'NoTempo', exercises: [{ title: 'Ex', repeatCount: 5, setCount: 2, restSeconds: 30 }] }];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
      expect(loadWorkouts()).toEqual(workouts);
    });

    it('filters out workouts with invalid tempo', () => {
      const invalid = [{ id: 'bad', title: 'Bad', exercises: [{ title: 'Ex', repeatCount: 5, setCount: 2, restSeconds: 30, tempo: { to: 'nope', hold: 0, from: 0 } }] }];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(invalid));
      expect(loadWorkouts()).toEqual([]);
    });

    it('filters out workouts with negative tempo values', () => {
      const invalid = [{ id: 'neg', title: 'Neg', exercises: [{ title: 'Ex', repeatCount: 5, setCount: 2, restSeconds: 30, tempo: { to: -1, hold: 0, from: 0 } }] }];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(invalid));
      expect(loadWorkouts()).toEqual([]);
    });
  });
});
