import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  loadHistory,
  saveHistory,
  addRecord,
  upsertRecord,
  aggregateByDay,
  toLocalDateStr,
  toLocalMonthKey,
  HISTORY_CHANGED_EVENT,
  type WorkoutRecord,
} from './historyStorage';

const STORAGE_KEY = 'exercaise_history';

function makeRecord(overrides: Partial<WorkoutRecord> = {}): WorkoutRecord {
  return {
    completedAt: '2026-03-22T10:00:00.000Z',
    workoutId: 'w1',
    workoutTitle: 'Test Workout',
    durationSeconds: 600,
    ...overrides,
  };
}

describe('historyStorage', () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  // ── loadHistory ──

  it('returns empty array when nothing stored', () => {
    expect(loadHistory()).toEqual([]);
  });

  it('loads valid records from localStorage', () => {
    const records = [makeRecord()];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    expect(loadHistory()).toEqual(records);
  });

  it('filters out invalid records', () => {
    const data = [
      makeRecord(),
      { completedAt: 123, workoutId: 'bad' }, // invalid
      { bad: true }, // invalid
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    const result = loadHistory();
    expect(result).toHaveLength(1);
    expect(result[0].workoutId).toBe('w1');
  });

  it('returns empty array for non-array JSON', () => {
    localStorage.setItem(STORAGE_KEY, '"not an array"');
    expect(loadHistory()).toEqual([]);
  });

  it('returns empty array for malformed JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{broken');
    expect(loadHistory()).toEqual([]);
  });

  it('filters records with negative durationSeconds', () => {
    const data = [makeRecord({ durationSeconds: -1 })];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    expect(loadHistory()).toEqual([]);
  });

  it('filters records with NaN durationSeconds', () => {
    const data = [makeRecord({ durationSeconds: NaN })];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    expect(loadHistory()).toEqual([]);
  });

  it('filters records with missing fields', () => {
    const data = [{ completedAt: '2026-03-22T10:00:00.000Z', workoutId: 'w1' }]; // missing title+duration
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    expect(loadHistory()).toEqual([]);
  });

  // ── saveHistory ──

  it('saves records to localStorage', () => {
    const records = [makeRecord()];
    saveHistory(records);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(records);
  });

  // ── addRecord ──

  it('adds a record to existing history', () => {
    const existing = [makeRecord({ workoutId: 'w1' })];
    saveHistory(existing);

    const newRecord = makeRecord({ workoutId: 'w2', workoutTitle: 'Another' });
    const result = addRecord(newRecord);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(newRecord);
    expect(result[1]).toEqual(existing[0]);
  });

  it('adds a record to empty history', () => {
    const record = makeRecord();
    const result = addRecord(record);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(record);
  });

  it('persists added record to localStorage', () => {
    addRecord(makeRecord());
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored).toHaveLength(1);
  });

  it('dispatches history-changed event on addRecord', () => {
    const handler = vi.fn();
    window.addEventListener(HISTORY_CHANGED_EVENT, handler);
    addRecord(makeRecord());
    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener(HISTORY_CHANGED_EVENT, handler);
  });

  // ── upsertRecord ──

  it('creates new record if completedAt not found', () => {
    const record = makeRecord({ completedAt: '2026-03-22T10:00:00.000Z' });
    upsertRecord(record);
    expect(loadHistory()).toHaveLength(1);
  });

  it('updates existing record matched by completedAt', () => {
    const record = makeRecord({ completedAt: '2026-03-22T10:00:00.000Z', durationSeconds: 10 });
    upsertRecord(record);
    upsertRecord({ ...record, durationSeconds: 60 });
    const history = loadHistory();
    expect(history).toHaveLength(1);
    expect(history[0].durationSeconds).toBe(60);
  });

  it('dispatches history-changed event', () => {
    const handler = vi.fn();
    window.addEventListener(HISTORY_CHANGED_EVENT, handler);
    upsertRecord(makeRecord());
    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener(HISTORY_CHANGED_EVENT, handler);
  });

  it('does not touch other records when upserting', () => {
    addRecord(makeRecord({ completedAt: '2026-03-21T10:00:00.000Z' }));
    upsertRecord(makeRecord({ completedAt: '2026-03-22T10:00:00.000Z', durationSeconds: 30 }));
    expect(loadHistory()).toHaveLength(2);
  });

  // ── toLocalDateStr ──

  it('converts UTC ISO string to local date', () => {
    // Midnight UTC = same day in UTC+ timezones, previous day in UTC- timezones
    // We just verify it uses local Date methods (not string slicing)
    const iso = '2026-06-15T10:00:00.000Z';
    const d = new Date(iso);
    const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    expect(toLocalDateStr(iso)).toBe(expected);
  });

  it('toLocalDateStr differs from UTC slice for late-night UTC times in positive offsets', () => {
    // 2026-03-21T23:30:00.000Z — in UTC it's March 21, but in UTC+3 it's March 22
    const iso = '2026-03-21T23:30:00.000Z';
    const utcDay = iso.slice(0, 10); // '2026-03-21'
    const localDay = toLocalDateStr(iso);
    const d = new Date(iso);
    // If local timezone offset makes this cross midnight, they should differ
    if (d.getDate() !== 21) {
      expect(localDay).not.toBe(utcDay);
    } else {
      expect(localDay).toBe(utcDay);
    }
  });

  // ── toLocalMonthKey ──

  it('converts UTC ISO string to local month key', () => {
    const iso = '2026-06-15T10:00:00.000Z';
    const d = new Date(iso);
    const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    expect(toLocalMonthKey(iso)).toBe(expected);
  });

  it('toLocalMonthKey handles month boundary correctly', () => {
    // Last hour of Jan 31 UTC — in UTC+ timezones this is Feb 1
    const iso = '2026-01-31T23:30:00.000Z';
    const d = new Date(iso);
    const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    expect(toLocalMonthKey(iso)).toBe(expected);
  });

  // ── aggregateByDay ──

  it('aggregates duration by day in seconds', () => {
    const records = [
      makeRecord({ completedAt: '2026-03-22T08:00:00.000Z', durationSeconds: 600 }),
      makeRecord({ completedAt: '2026-03-22T18:00:00.000Z', durationSeconds: 1200 }),
      makeRecord({ completedAt: '2026-03-21T10:00:00.000Z', durationSeconds: 300 }),
    ];
    const map = aggregateByDay(records);
    expect(map.get('2026-03-22')).toBe(1800);
    expect(map.get('2026-03-21')).toBe(300);
  });

  it('uses local date for aggregation, not UTC', () => {
    // A record at 23:30 UTC — in UTC+ timezones this is the next day
    const records = [
      makeRecord({ completedAt: '2026-03-21T23:30:00.000Z', durationSeconds: 100 }),
    ];
    const map = aggregateByDay(records);
    const localDay = toLocalDateStr('2026-03-21T23:30:00.000Z');
    expect(map.get(localDay)).toBe(100);
  });

  it('returns empty map for empty records', () => {
    expect(aggregateByDay([])).toEqual(new Map());
  });
});
