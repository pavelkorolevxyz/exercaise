import type { Exercise, ExerciseTempo, Workout, WorkoutDto, ExerciseDtoItem } from './types';

function mapTempo(dto?: { to?: number; hold?: number; from?: number }): ExerciseTempo {
  return {
    to: dto?.to ?? 1,
    hold: dto?.hold ?? 0,
    from: dto?.from ?? 1,
  };
}

function mapExercise(dto: ExerciseDtoItem): Exercise {
  return {
    title: dto.title,
    description: dto.description,
    repeatCount: dto.repeat_count,
    setCount: dto.set_count,
    restSeconds: dto.rest_seconds ?? 60,
    tempo: mapTempo(dto.tempo),
  };
}

export function mapWorkoutDto(dto: WorkoutDto, id: string): Workout {
  return {
    id,
    title: dto.title,
    exercises: dto.exercises.map(mapExercise),
  };
}

function unmapExercise(exercise: Exercise): ExerciseDtoItem {
  const dto: ExerciseDtoItem = {
    title: exercise.title,
    repeat_count: exercise.repeatCount,
    set_count: exercise.setCount,
    rest_seconds: exercise.restSeconds,
  };
  if (exercise.description) dto.description = exercise.description;
  if (exercise.tempo) dto.tempo = { ...exercise.tempo };
  return dto;
}

export function unmapWorkout(workout: Workout): WorkoutDto {
  return {
    title: workout.title,
    exercises: workout.exercises.map(unmapExercise),
  };
}
