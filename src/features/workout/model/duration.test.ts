import { describe, it, expect } from 'vitest';
import { estimateDurationMinutes } from './duration';
import type { Exercise } from './types';

describe('estimateDurationMinutes', () => {
  it('returns 0 for empty exercises array', () => {
    expect(estimateDurationMinutes([])).toBe(0);
  });

  it('calculates duration for exercise without tempo', () => {
    const exercises: Exercise[] = [
      { title: 'Push-ups', repeatCount: 10, setCount: 3, restSeconds: 30 },
    ];
    // tempoSeconds = (1 + 0 + 1) = 2 (defaults when no tempo)
    // setTime = 10 * 2 = 20
    // total = (20 + 30) * 3 = 150 seconds = 2.5 -> rounds to 3
    expect(estimateDurationMinutes(exercises)).toBe(3);
  });

  it('calculates duration with explicit tempo', () => {
    const exercises: Exercise[] = [
      {
        title: 'Squats',
        repeatCount: 5,
        setCount: 2,
        restSeconds: 60,
        tempo: { to: 3, hold: 1, from: 2 },
      },
    ];
    // tempoSeconds = 3 + 1 + 2 = 6
    // setTime = 5 * 6 = 30
    // total = (30 + 60) * 2 = 180 seconds = 3
    expect(estimateDurationMinutes(exercises)).toBe(3);
  });

  it('sums duration of multiple exercises', () => {
    const exercises: Exercise[] = [
      { title: 'A', repeatCount: 10, setCount: 1, restSeconds: 0 },
      { title: 'B', repeatCount: 10, setCount: 1, restSeconds: 0 },
    ];
    // Each: tempoSeconds=2, setTime=20, total=(20+0)*1=20
    // Sum = 40 seconds -> rounds to 1
    expect(estimateDurationMinutes(exercises)).toBe(1);
  });

  it('handles zero rest seconds', () => {
    const exercises: Exercise[] = [
      { title: 'Ex', repeatCount: 6, setCount: 2, restSeconds: 0, tempo: { to: 2, hold: 0, from: 2 } },
    ];
    // tempoSeconds = 4, setTime = 24, total = (24+0)*2 = 48 -> 1
    expect(estimateDurationMinutes(exercises)).toBe(1);
  });

  it('handles tempo with partial values (zero phases)', () => {
    const exercises: Exercise[] = [
      { title: 'Plank', repeatCount: 1, setCount: 3, restSeconds: 10, tempo: { to: 0, hold: 30, from: 0 } },
    ];
    // tempoSeconds = 0 + 30 + 0 = 30
    // setTime = 1 * 30 = 30
    // total = (30 + 10) * 3 = 120 -> 2
    expect(estimateDurationMinutes(exercises)).toBe(2);
  });

  it('rounds to nearest minute', () => {
    const exercises: Exercise[] = [
      { title: 'Ex', repeatCount: 1, setCount: 1, restSeconds: 0 },
    ];
    // tempoSeconds=2, setTime=2, total=2 -> 2/60 = 0.033 -> rounds to 0
    expect(estimateDurationMinutes(exercises)).toBe(0);
  });
});
