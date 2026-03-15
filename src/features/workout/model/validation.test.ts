import { describe, it, expect } from 'vitest';
import { validateWorkoutJson, ValidationError } from './validation';

const validWorkout = {
  title: 'Test Workout',
  exercises: [
    { title: 'Push-ups', repeat_count: 10, set_count: 3 },
  ],
};

describe('validateWorkoutJson', () => {
  it('returns data for valid workout JSON', () => {
    const result = validateWorkoutJson(validWorkout);
    expect(result).toEqual(validWorkout);
  });

  it('accepts optional fields', () => {
    const data = {
      title: 'W',
      exercises: [
        {
          title: 'Ex',
          description: 'desc',
          repeat_count: 5,
          set_count: 2,
          rest_seconds: 30,
          tempo: { to: 2, hold: 1, from: 2 },
        },
      ],
    };
    expect(validateWorkoutJson(data)).toEqual(data);
  });

  it('throws ValidationError for non-object input', () => {
    expect(() => validateWorkoutJson(null)).toThrow(ValidationError);
    expect(() => validateWorkoutJson('string')).toThrow(ValidationError);
    expect(() => validateWorkoutJson(42)).toThrow(ValidationError);
  });

  it('throws ValidationError when title is missing', () => {
    expect(() => validateWorkoutJson({ exercises: [{ title: 'a', repeat_count: 1, set_count: 1 }] }))
      .toThrow(ValidationError);
  });

  it('throws ValidationError when title is empty', () => {
    expect(() => validateWorkoutJson({ title: '  ', exercises: [{ title: 'a', repeat_count: 1, set_count: 1 }] }))
      .toThrow(ValidationError);
  });

  it('throws ValidationError when exercises is empty', () => {
    expect(() => validateWorkoutJson({ title: 'W', exercises: [] }))
      .toThrow(ValidationError);
  });

  it('throws ValidationError when exercises is not array', () => {
    expect(() => validateWorkoutJson({ title: 'W', exercises: 'nope' }))
      .toThrow(ValidationError);
  });

  it('throws ValidationError for exercise without title', () => {
    expect(() => validateWorkoutJson({
      title: 'W',
      exercises: [{ repeat_count: 1, set_count: 1 }],
    })).toThrow(ValidationError);
  });

  it('throws ValidationError when exercise item is not an object', () => {
    expect(() => validateWorkoutJson({
      title: 'W',
      exercises: [null],
    })).toThrow(ValidationError);
  });

  it('throws ValidationError when repeat_count < 1', () => {
    expect(() => validateWorkoutJson({
      title: 'W',
      exercises: [{ title: 'Ex', repeat_count: 0, set_count: 1 }],
    })).toThrow(ValidationError);
  });

  it('throws ValidationError when set_count < 1', () => {
    expect(() => validateWorkoutJson({
      title: 'W',
      exercises: [{ title: 'Ex', repeat_count: 1, set_count: 0 }],
    })).toThrow(ValidationError);
  });

  it('throws ValidationError when rest_seconds is negative', () => {
    expect(() => validateWorkoutJson({
      title: 'W',
      exercises: [{ title: 'Ex', repeat_count: 1, set_count: 1, rest_seconds: -1 }],
    })).toThrow(ValidationError);
  });

  it('throws ValidationError when tempo is not an object', () => {
    expect(() => validateWorkoutJson({
      title: 'W',
      exercises: [{ title: 'Ex', repeat_count: 1, set_count: 1, tempo: 5 }],
    })).toThrow(ValidationError);
  });

  it('throws ValidationError when tempo field is negative', () => {
    expect(() => validateWorkoutJson({
      title: 'W',
      exercises: [{ title: 'Ex', repeat_count: 1, set_count: 1, tempo: { to: -1 } }],
    })).toThrow(ValidationError);
  });

  it('throws ValidationError when repeat_count is not integer', () => {
    expect(() => validateWorkoutJson({
      title: 'W',
      exercises: [{ title: 'Ex', repeat_count: 1.5, set_count: 1 }],
    })).toThrow(ValidationError);
  });

  it('throws ValidationError when set_count is not integer', () => {
    expect(() => validateWorkoutJson({
      title: 'W',
      exercises: [{ title: 'Ex', repeat_count: 1, set_count: 2.5 }],
    })).toThrow(ValidationError);
  });

  it('validates multiple exercises and reports correct index', () => {
    expect(() => validateWorkoutJson({
      title: 'W',
      exercises: [
        { title: 'Good', repeat_count: 1, set_count: 1 },
        { title: '', repeat_count: 1, set_count: 1 },
      ],
    })).toThrow(/exercises\[1\]/);
  });
});

describe('ValidationError', () => {
  it('has correct name property', () => {
    const err = new ValidationError('msg');
    expect(err.name).toBe('ValidationError');
    expect(err.message).toBe('msg');
    expect(err).toBeInstanceOf(Error);
  });
});
