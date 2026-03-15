import type { WorkoutDto } from './types';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateWorkoutJson(data: unknown): WorkoutDto {
  if (typeof data !== 'object' || data === null) {
    throw new ValidationError('JSON должен быть объектом');
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.title !== 'string' || obj.title.trim() === '') {
    throw new ValidationError('Поле "title" обязательно и должно быть строкой');
  }

  if (!Array.isArray(obj.exercises) || obj.exercises.length === 0) {
    throw new ValidationError('Поле "exercises" должно быть непустым массивом');
  }

  for (let i = 0; i < obj.exercises.length; i++) {
    const rawExercise = obj.exercises[i];
    const prefix = `exercises[${i}]`;

    if (typeof rawExercise !== 'object' || rawExercise === null) {
      throw new ValidationError(`${prefix} должен быть объектом`);
    }

    const ex = rawExercise as Record<string, unknown>;

    if (typeof ex.title !== 'string' || ex.title.trim() === '') {
      throw new ValidationError(`${prefix}.title обязательно`);
    }
    if (typeof ex.repeat_count !== 'number' || !Number.isInteger(ex.repeat_count) || ex.repeat_count < 1) {
      throw new ValidationError(`${prefix}.repeat_count должен быть целым числом >= 1`);
    }
    if (typeof ex.set_count !== 'number' || !Number.isInteger(ex.set_count) || ex.set_count < 1) {
      throw new ValidationError(`${prefix}.set_count должен быть целым числом >= 1`);
    }

    if (typeof ex.description !== 'undefined' && typeof ex.description !== 'string') {
      throw new ValidationError(`${prefix}.description должен быть строкой`);
    }

    if (
      typeof ex.rest_seconds !== 'undefined'
      && (typeof ex.rest_seconds !== 'number' || !Number.isFinite(ex.rest_seconds) || ex.rest_seconds < 0)
    ) {
      throw new ValidationError(`${prefix}.rest_seconds должен быть >= 0`);
    }

    if (typeof ex.tempo !== 'undefined') {
      if (typeof ex.tempo !== 'object' || ex.tempo === null) {
        throw new ValidationError(`${prefix}.tempo должен быть объектом`);
      }

      const tempo = ex.tempo as Record<string, unknown>;
      const tempoFields: Array<'to' | 'hold' | 'from'> = ['to', 'hold', 'from'];

      for (const field of tempoFields) {
        const value = tempo[field];
        if (
          typeof value !== 'undefined'
          && (typeof value !== 'number' || !Number.isFinite(value) || value < 0)
        ) {
          throw new ValidationError(`${prefix}.tempo.${field} должен быть >= 0`);
        }
      }
    }
  }

  return data as WorkoutDto;
}
