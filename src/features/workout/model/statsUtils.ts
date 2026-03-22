import type { WorkoutRecord } from '../../../shared/storage/historyStorage';
import { toLocalDateStr, toLocalMonthKey } from '../../../shared/storage/historyStorage';
import { MONTHS_GENITIVE, MONTHS_NOMINATIVE } from './heatmapUtils';

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function uniqueDays(records: WorkoutRecord[]): Set<string> {
  return new Set(records.map((r) => toLocalDateStr(r.completedAt)));
}

// ── Summary stats ──

export function computeTotalWorkouts(records: WorkoutRecord[]): number {
  return records.length;
}

export function computeTotalTime(records: WorkoutRecord[]): number {
  return records.reduce((sum, r) => sum + r.durationSeconds, 0);
}

export function formatTotalTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h} ч ${m} мин ${s} с`;
  if (m > 0) return `${m} мин ${s} с`;
  return `${s} с`;
}

// ── Streaks ──

export function computeCurrentStreak(records: WorkoutRecord[], today = new Date()): number {
  const days = uniqueDays(records);
  if (days.size === 0) return 0;

  let d = today;
  // If today has no workout, start from yesterday
  if (!days.has(toDateStr(d))) {
    d = addDays(d, -1);
    if (!days.has(toDateStr(d))) return 0;
  }

  let streak = 0;
  while (days.has(toDateStr(d))) {
    streak++;
    d = addDays(d, -1);
  }
  return streak;
}

export function computeBestStreak(records: WorkoutRecord[]): number {
  const days = uniqueDays(records);
  if (days.size === 0) return 0;

  const sorted = [...days].sort();
  let best = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) {
      current++;
      if (current > best) best = current;
    } else {
      current = 1;
    }
  }
  return best;
}

// ── Aggregations ──

/** Monday of the week containing `d` */
function mondayOf(d: Date): Date {
  const r = new Date(d);
  const dow = (r.getDay() + 6) % 7; // Mon=0..Sun=6
  r.setDate(r.getDate() - dow);
  return r;
}

export interface ChartEntry {
  label: string;
  minutes: number;
  totalSeconds: number;
}

export function aggregateByWeek(records: WorkoutRecord[], today = new Date()): ChartEntry[] {
  const COUNT = 6;
  const monday = mondayOf(today);

  // Build week start dates (oldest first)
  const weeks: Date[] = [];
  for (let i = COUNT - 1; i >= 0; i--) {
    weeks.push(addDays(monday, -i * 7));
  }

  // Build a map: YYYY-MM-DD → total seconds
  const dayMap = new Map<string, number>();
  for (const r of records) {
    const day = toLocalDateStr(r.completedAt);
    dayMap.set(day, (dayMap.get(day) ?? 0) + r.durationSeconds);
  }

  return weeks.map((weekStart) => {
    let totalSec = 0;
    for (let d = 0; d < 7; d++) {
      const day = toDateStr(addDays(weekStart, d));
      totalSec += dayMap.get(day) ?? 0;
    }
    const day = weekStart.getDate();
    const mon = MONTHS_GENITIVE[weekStart.getMonth()];
    return { label: `${day} ${mon}`, minutes: Math.ceil(totalSec / 60), totalSeconds: totalSec };
  });
}

export function aggregateByMonth(records: WorkoutRecord[], today = new Date()): ChartEntry[] {
  const COUNT = 6;

  // Build month keys oldest first
  const months: { key: string; label: string }[] = [];
  for (let i = COUNT - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months.push({ key, label: MONTHS_NOMINATIVE[d.getMonth()] });
  }

  // Build a map: YYYY-MM → total seconds
  const monthMap = new Map<string, number>();
  for (const r of records) {
    const key = toLocalMonthKey(r.completedAt);
    monthMap.set(key, (monthMap.get(key) ?? 0) + r.durationSeconds);
  }

  return months.map(({ key, label }) => ({
    label,
    minutes: Math.ceil((monthMap.get(key) ?? 0) / 60),
    totalSeconds: monthMap.get(key) ?? 0,
  }));
}
