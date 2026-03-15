import { describe, it, expect, beforeEach } from 'vitest';
import { useWorkoutStore } from './workoutStore';

describe('workoutStore', () => {
  beforeEach(() => {
    localStorage.removeItem('exercaise_workouts');
    useWorkoutStore.setState({
      workouts: [],
      playerExerciseIndex: null,
      startFromExerciseIndex: null,
    });
  });

  it('starts with empty workouts', () => {
    expect(useWorkoutStore.getState().workouts).toEqual([]);
  });

  it('loadFromStorage loads workouts from localStorage', () => {
    const workouts = [{ id: 'w1', title: 'Test', exercises: [{ title: 'Ex', repeatCount: 5, setCount: 2, restSeconds: 30 }] }];
    localStorage.setItem('exercaise_workouts', JSON.stringify(workouts));

    useWorkoutStore.getState().loadFromStorage();
    expect(useWorkoutStore.getState().workouts).toEqual(workouts);
  });

  it('importFromJson parses and stores a workout', () => {
    const json = JSON.stringify({
      title: 'Imported',
      exercises: [{ title: 'Ex', repeat_count: 5, set_count: 2 }],
    });

    const workout = useWorkoutStore.getState().importFromJson(json);

    expect(workout.title).toBe('Imported');
    expect(workout.id).toBeTruthy();
    expect(workout.exercises[0].repeatCount).toBe(5);
    expect(useWorkoutStore.getState().workouts).toHaveLength(1);
  });

  it('importFromJson throws on invalid JSON string', () => {
    expect(() => useWorkoutStore.getState().importFromJson('not json'))
      .toThrow();
  });

  it('importFromJson throws on invalid workout structure', () => {
    expect(() => useWorkoutStore.getState().importFromJson('{"title":""}'))
      .toThrow();
  });

  it('importFromFile parses a file and stores workout', async () => {
    const content = JSON.stringify({
      title: 'File Import',
      exercises: [{ title: 'Ex', repeat_count: 3, set_count: 1 }],
    });
    const file = new File([content], 'workout.json', { type: 'application/json' });

    const workout = await useWorkoutStore.getState().importFromFile(file);

    expect(workout.title).toBe('File Import');
    expect(useWorkoutStore.getState().workouts).toHaveLength(1);
  });

  it('remove deletes a workout by id', () => {
    const json = JSON.stringify({
      title: 'ToRemove',
      exercises: [{ title: 'Ex', repeat_count: 1, set_count: 1 }],
    });
    const workout = useWorkoutStore.getState().importFromJson(json);
    expect(useWorkoutStore.getState().workouts).toHaveLength(1);

    useWorkoutStore.getState().remove(workout.id);
    expect(useWorkoutStore.getState().workouts).toHaveLength(0);
  });

  it('setPlayerExerciseIndex updates the index', () => {
    useWorkoutStore.getState().setPlayerExerciseIndex(2);
    expect(useWorkoutStore.getState().playerExerciseIndex).toBe(2);

    useWorkoutStore.getState().setPlayerExerciseIndex(null);
    expect(useWorkoutStore.getState().playerExerciseIndex).toBeNull();
  });

  it('setStartFromExerciseIndex updates the index', () => {
    useWorkoutStore.getState().setStartFromExerciseIndex(1);
    expect(useWorkoutStore.getState().startFromExerciseIndex).toBe(1);
  });

  it('loadFromStorage seeds default workouts when localStorage is empty', () => {
    useWorkoutStore.getState().loadFromStorage();
    expect(useWorkoutStore.getState().workouts.length).toBeGreaterThan(0);
  });

  it('toggleFullscreen toggles isFullscreen', () => {
    expect(useWorkoutStore.getState().isFullscreen).toBe(false);

    useWorkoutStore.getState().toggleFullscreen();
    expect(useWorkoutStore.getState().isFullscreen).toBe(true);

    useWorkoutStore.getState().toggleFullscreen();
    expect(useWorkoutStore.getState().isFullscreen).toBe(false);
  });

  it('setFullscreen sets isFullscreen', () => {
    useWorkoutStore.getState().setFullscreen(true);
    expect(useWorkoutStore.getState().isFullscreen).toBe(true);

    useWorkoutStore.getState().setFullscreen(false);
    expect(useWorkoutStore.getState().isFullscreen).toBe(false);
  });

  it('setExerciseDrawerOpen updates exerciseDrawerOpen', () => {
    useWorkoutStore.getState().setExerciseDrawerOpen(true);
    expect(useWorkoutStore.getState().exerciseDrawerOpen).toBe(true);

    useWorkoutStore.getState().setExerciseDrawerOpen(false);
    expect(useWorkoutStore.getState().exerciseDrawerOpen).toBe(false);
  });

  it('addWorkout adds a workout to state and storage', () => {
    const workout = {
      id: 'test-add-1',
      title: 'Added Workout',
      exercises: [{ title: 'Push-up', repeatCount: 10, setCount: 3, restSeconds: 30 }],
    };

    useWorkoutStore.getState().addWorkout(workout);

    expect(useWorkoutStore.getState().workouts).toHaveLength(1);
    expect(useWorkoutStore.getState().workouts[0]).toEqual(workout);

    const stored = JSON.parse(localStorage.getItem('exercaise_workouts') || '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe('test-add-1');
  });

});
