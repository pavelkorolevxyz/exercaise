import type { Exercise } from './types';

export function estimateDurationMinutes(exercises: Exercise[]): number {
  let total = 0;

  for (const ex of exercises) {
    const tempoSeconds = (ex.tempo?.to ?? 1) + (ex.tempo?.hold ?? 0) + (ex.tempo?.from ?? 1);
    const setTime = ex.repeatCount * tempoSeconds;
    total += (setTime + ex.restSeconds) * ex.setCount;
  }

  return Math.round(total / 60);
}
