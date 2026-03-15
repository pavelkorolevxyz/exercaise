import { describe, it, expect } from 'vitest';
import { mapWorkoutDto } from './mappers';
import type { WorkoutDto } from './types';

describe('mapWorkoutDto', () => {
  it('maps a full DTO with all fields', () => {
    const dto: WorkoutDto = {
      title: 'My Workout',
      exercises: [
        {
          title: 'Squats',
          description: 'Deep squats',
          repeat_count: 12,
          set_count: 4,
          rest_seconds: 90,
          tempo: { to: 3, hold: 1, from: 2 },
        },
      ],
    };

    const result = mapWorkoutDto(dto, 'test-id');

    expect(result).toEqual({
      id: 'test-id',
      title: 'My Workout',
      exercises: [
        {
          title: 'Squats',
          description: 'Deep squats',
          repeatCount: 12,
          setCount: 4,
          restSeconds: 90,
          tempo: { to: 3, hold: 1, from: 2 },
        },
      ],
    });
  });

  it('applies default values for optional fields', () => {
    const dto: WorkoutDto = {
      title: 'Minimal',
      exercises: [
        { title: 'Ex', repeat_count: 5, set_count: 2 },
      ],
    };

    const result = mapWorkoutDto(dto, 'id-2');

    expect(result.exercises[0].restSeconds).toBe(60);
    expect(result.exercises[0].tempo).toEqual({ to: 1, hold: 0, from: 1 });
  });

  it('applies defaults for partial tempo', () => {
    const dto: WorkoutDto = {
      title: 'Partial Tempo',
      exercises: [
        { title: 'Ex', repeat_count: 1, set_count: 1, tempo: { to: 5 } },
      ],
    };

    const result = mapWorkoutDto(dto, 'id-3');

    expect(result.exercises[0].tempo).toEqual({ to: 5, hold: 0, from: 1 });
  });

  it('maps multiple exercises', () => {
    const dto: WorkoutDto = {
      title: 'Multi',
      exercises: [
        { title: 'A', repeat_count: 1, set_count: 1 },
        { title: 'B', repeat_count: 2, set_count: 2 },
      ],
    };

    const result = mapWorkoutDto(dto, 'id-4');

    expect(result.exercises).toHaveLength(2);
    expect(result.exercises[0].title).toBe('A');
    expect(result.exercises[1].title).toBe('B');
  });
});
