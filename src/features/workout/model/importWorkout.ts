import { validateWorkoutJson } from './validation';
import { mapWorkoutDto } from './mappers';
import type { Workout } from './types';

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function importWorkout(jsonText: string): Workout {
  const data: unknown = JSON.parse(jsonText);
  const dto = validateWorkoutJson(data);
  return mapWorkoutDto(dto, generateId());
}
