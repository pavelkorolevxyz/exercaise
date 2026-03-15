import { describe, it, expect, vi, afterEach } from 'vitest';
import { pickRandomWorkout, surpriseWorkouts } from './surpriseWorkouts';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('surpriseWorkouts', () => {
  it('each surprise workout has a title and non-empty exercises array', () => {
    for (const workout of surpriseWorkouts) {
      expect(workout.title).toBeTruthy();
      expect(Array.isArray(workout.exercises)).toBe(true);
      expect(workout.exercises.length).toBeGreaterThan(0);
    }
  });
});

describe('pickRandomWorkout', () => {
  it('returns a Workout with id, title, and exercises', () => {
    const result = pickRandomWorkout([]);
    expect(result).toHaveProperty('id');
    expect(typeof result.id).toBe('string');
    expect(result.id.length).toBeGreaterThan(0);
    expect(result).toHaveProperty('title');
    expect(typeof result.title).toBe('string');
    expect(result).toHaveProperty('exercises');
    expect(Array.isArray(result.exercises)).toBe(true);
    expect(result.exercises.length).toBeGreaterThan(0);
  });

  it('filters out workouts whose titles are in existingTitles', () => {
    const allTitlesExceptFirst = surpriseWorkouts.slice(1).map(w => w.title);

    vi.spyOn(Math, 'random').mockReturnValue(0);

    const result = pickRandomWorkout(allTitlesExceptFirst);
    expect(result.title).toBe(surpriseWorkouts[0].title);
  });

  it('falls back to full pool when all titles are already used', () => {
    const allTitles = surpriseWorkouts.map(w => w.title);

    vi.spyOn(Math, 'random').mockReturnValue(0);

    const result = pickRandomWorkout(allTitles);
    expect(result.title).toBe(surpriseWorkouts[0].title);
    expect(result.exercises).toBe(surpriseWorkouts[0].exercises);
  });

  it('returns different workouts from the non-existing pool depending on Math.random', () => {
    const existingTitles = [surpriseWorkouts[0].title];
    const available = surpriseWorkouts.filter(w => w.title !== existingTitles[0]);

    vi.spyOn(Math, 'random').mockReturnValue(0);
    const first = pickRandomWorkout(existingTitles);
    expect(first.title).toBe(available[0].title);

    vi.mocked(Math.random).mockReturnValue(
      (available.length - 1) / available.length,
    );
    const last = pickRandomWorkout(existingTitles);
    expect(last.title).toBe(available[available.length - 1].title);

    expect(first.title).not.toBe(last.title);
  });
});
