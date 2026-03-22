import { describe, it, expect } from 'vitest';
import type { WorkoutRecord } from '../../../shared/storage/historyStorage';
import { toLocalDateStr } from '../../../shared/storage/historyStorage';
import {
  computeTotalWorkouts,
  computeTotalTime,
  formatTotalTime,
  computeCurrentStreak,
  computeBestStreak,
  aggregateByWeek,
  aggregateByMonth,
} from './statsUtils';

function makeRecord(overrides: Partial<WorkoutRecord> = {}): WorkoutRecord {
  return {
    completedAt: '2026-03-22T10:00:00.000Z',
    workoutId: 'w1',
    workoutTitle: 'Test',
    durationSeconds: 600,
    ...overrides,
  };
}

function recordOnDate(date: string, duration = 600): WorkoutRecord {
  return makeRecord({ completedAt: `${date}T10:00:00.000Z`, durationSeconds: duration });
}

describe('computeTotalWorkouts', () => {
  it('returns 0 for empty', () => {
    expect(computeTotalWorkouts([])).toBe(0);
  });

  it('returns count of records', () => {
    expect(computeTotalWorkouts([makeRecord(), makeRecord()])).toBe(2);
  });
});

describe('computeTotalTime', () => {
  it('returns 0 for empty', () => {
    expect(computeTotalTime([])).toBe(0);
  });

  it('sums durationSeconds', () => {
    expect(computeTotalTime([
      makeRecord({ durationSeconds: 100 }),
      makeRecord({ durationSeconds: 200 }),
    ])).toBe(300);
  });
});

describe('formatTotalTime', () => {
  it('returns "0 с" for 0', () => {
    expect(formatTotalTime(0)).toBe('0 с');
  });

  it('shows minutes and seconds when < 1 hour', () => {
    expect(formatTotalTime(305)).toBe('5 мин 5 с');
  });

  it('shows hours, minutes and seconds', () => {
    expect(formatTotalTime(3661)).toBe('1 ч 1 мин 1 с');
  });

  it('shows 0 minutes with hours', () => {
    expect(formatTotalTime(3600)).toBe('1 ч 0 мин 0 с');
  });

  it('handles large values', () => {
    expect(formatTotalTime(90061)).toBe('25 ч 1 мин 1 с');
  });

  it('shows only seconds when < 1 min', () => {
    expect(formatTotalTime(45)).toBe('45 с');
  });
});

describe('computeCurrentStreak', () => {
  const today = new Date('2026-03-22');

  it('returns 0 for empty', () => {
    expect(computeCurrentStreak([], today)).toBe(0);
  });

  it('returns 1 for workout only today', () => {
    expect(computeCurrentStreak([recordOnDate('2026-03-22')], today)).toBe(1);
  });

  it('returns 2 for today + yesterday', () => {
    expect(computeCurrentStreak([
      recordOnDate('2026-03-22'),
      recordOnDate('2026-03-21'),
    ], today)).toBe(2);
  });

  it('starts from yesterday if today has no workout', () => {
    expect(computeCurrentStreak([
      recordOnDate('2026-03-21'),
      recordOnDate('2026-03-20'),
    ], today)).toBe(2);
  });

  it('returns 0 if gap before yesterday', () => {
    expect(computeCurrentStreak([
      recordOnDate('2026-03-19'),
    ], today)).toBe(0);
  });

  it('gap in the middle breaks streak', () => {
    expect(computeCurrentStreak([
      recordOnDate('2026-03-22'),
      recordOnDate('2026-03-21'),
      // gap on 20th
      recordOnDate('2026-03-19'),
      recordOnDate('2026-03-18'),
    ], today)).toBe(2);
  });

  it('multiple records same day count as 1', () => {
    expect(computeCurrentStreak([
      recordOnDate('2026-03-22'),
      recordOnDate('2026-03-22'),
      recordOnDate('2026-03-21'),
    ], today)).toBe(2);
  });

  it('uses local date, not UTC, for streak calculation', () => {
    // 2026-03-21T23:30:00Z — in UTC+ timezones this is March 22 local
    const lateUtc = '2026-03-21T23:30:00.000Z';
    const localDay = toLocalDateStr(lateUtc);
    const todayLocal = new Date(lateUtc);

    // If local timezone shifts this to March 22, streak should count on that day
    const records = [makeRecord({ completedAt: lateUtc })];
    const streak = computeCurrentStreak(records, todayLocal);
    expect(streak).toBe(1);
    // Verify the day used matches local interpretation
    expect(localDay).toBe(`${todayLocal.getFullYear()}-${String(todayLocal.getMonth() + 1).padStart(2, '0')}-${String(todayLocal.getDate()).padStart(2, '0')}`);
  });
});

describe('computeBestStreak', () => {
  it('returns 0 for empty', () => {
    expect(computeBestStreak([])).toBe(0);
  });

  it('returns 1 for single record', () => {
    expect(computeBestStreak([recordOnDate('2026-03-22')])).toBe(1);
  });

  it('returns 3 for three consecutive days', () => {
    expect(computeBestStreak([
      recordOnDate('2026-03-20'),
      recordOnDate('2026-03-21'),
      recordOnDate('2026-03-22'),
    ])).toBe(3);
  });

  it('returns longest of multiple streaks', () => {
    expect(computeBestStreak([
      // streak of 2
      recordOnDate('2026-03-10'),
      recordOnDate('2026-03-11'),
      // gap
      // streak of 3
      recordOnDate('2026-03-20'),
      recordOnDate('2026-03-21'),
      recordOnDate('2026-03-22'),
    ])).toBe(3);
  });

  it('all records on same day returns 1', () => {
    expect(computeBestStreak([
      recordOnDate('2026-03-22'),
      recordOnDate('2026-03-22'),
    ])).toBe(1);
  });
});

describe('aggregateByWeek', () => {
  const today = new Date('2026-03-22'); // Sunday

  it('returns 6 entries for empty records', () => {
    const result = aggregateByWeek([], today);
    expect(result).toHaveLength(6);
    expect(result.every((w) => w.minutes === 0)).toBe(true);
  });

  it('each entry has a label', () => {
    const result = aggregateByWeek([], today);
    for (const w of result) {
      expect(w.label).toBeTruthy();
    }
  });

  it('aggregates minutes into correct week', () => {
    const records = [
      recordOnDate('2026-03-22', 1800), // 30 min, this week (Mon 16 - Sun 22)
      recordOnDate('2026-03-16', 600),   // 10 min, same week
    ];
    const result = aggregateByWeek(records, today);
    const lastWeek = result[result.length - 1];
    expect(lastWeek.minutes).toBe(40); // (1800 + 600) / 60
  });

  it('records in previous week go to previous bucket', () => {
    const records = [
      recordOnDate('2026-03-15', 600), // Sunday of prev week (Mon 9 - Sun 15)
    ];
    const result = aggregateByWeek(records, today);
    const prevWeek = result[result.length - 2];
    expect(prevWeek.minutes).toBe(10);
    const lastWeek = result[result.length - 1];
    expect(lastWeek.minutes).toBe(0);
  });
});

describe('aggregateByMonth', () => {
  const today = new Date('2026-03-22');

  it('returns 6 entries for empty records', () => {
    const result = aggregateByMonth([], today);
    expect(result).toHaveLength(6);
    expect(result.every((m) => m.minutes === 0)).toBe(true);
  });

  it('each entry has a label', () => {
    const result = aggregateByMonth([], today);
    for (const m of result) {
      expect(m.label).toBeTruthy();
    }
  });

  it('last entry is current month', () => {
    const result = aggregateByMonth([], today);
    expect(result[result.length - 1].label).toBe('март');
  });

  it('aggregates into correct month', () => {
    const records = [
      recordOnDate('2026-03-22', 1800),
      recordOnDate('2026-03-01', 600),
      recordOnDate('2026-02-15', 1200),
    ];
    const result = aggregateByMonth(records, today);
    expect(result[result.length - 1].minutes).toBe(40); // Mar
    expect(result[result.length - 2].minutes).toBe(20); // Feb
  });

  it('uses local date for month aggregation', () => {
    // Late UTC time that may cross month boundary in local timezone
    const lateUtc = '2026-02-28T23:30:00.000Z';
    const localDate = new Date(lateUtc);
    const localMonth = localDate.getMonth(); // 0-based

    const records = [makeRecord({ completedAt: lateUtc, durationSeconds: 600 })];
    // Use a "today" in the same local month as the record
    const result = aggregateByMonth(records, localDate);
    const lastEntry = result[result.length - 1];
    expect(lastEntry.minutes).toBe(10); // 600s = 10min

    // The month label should match the local month, not UTC
    const expectedMonthIdx = localMonth;
    const MONTHS_NOMINATIVE = [
      'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
      'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь',
    ];
    expect(lastEntry.label).toBe(MONTHS_NOMINATIVE[expectedMonthIdx]);
  });
});

describe('aggregateByWeek — local timezone', () => {
  it('uses local date for week aggregation', () => {
    // Late UTC time that crosses day boundary in UTC+ timezones
    const lateUtc = '2026-03-21T23:30:00.000Z';
    const localDate = new Date(lateUtc);

    const records = [makeRecord({ completedAt: lateUtc, durationSeconds: 600 })];
    const result = aggregateByWeek(records, localDate);

    // Find the week bucket that contains the local day
    const totalMinutes = result.reduce((sum, w) => sum + w.minutes, 0);
    expect(totalMinutes).toBe(10); // 600s = 10min, should appear somewhere
  });
});
