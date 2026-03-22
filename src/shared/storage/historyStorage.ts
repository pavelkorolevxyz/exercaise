export interface WorkoutRecord {
  completedAt: string;
  workoutId: string;
  workoutTitle: string;
  durationSeconds: number;
}

const STORAGE_KEY = 'exercaise_history';

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function isValidRecord(r: unknown): r is WorkoutRecord {
  if (typeof r !== 'object' || r === null) return false;
  const obj = r as Record<string, unknown>;
  return (
    typeof obj.completedAt === 'string' &&
    typeof obj.workoutId === 'string' &&
    typeof obj.workoutTitle === 'string' &&
    isFiniteNumber(obj.durationSeconds) && obj.durationSeconds >= 0
  );
}

export function loadHistory(): WorkoutRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const valid = parsed.filter(isValidRecord);
    const dropped = parsed.length - valid.length;
    if (dropped > 0) {
      console.warn(`[exercaise] ${dropped} записей истории отфильтровано из localStorage (невалидная схема)`);
    }
    return valid;
  } catch {
    return [];
  }
}

export function saveHistory(records: WorkoutRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export const HISTORY_CHANGED_EVENT = 'exercaise:history-changed';

export function addRecord(record: WorkoutRecord): WorkoutRecord[] {
  const existing = loadHistory();
  const updated = [record, ...existing];
  saveHistory(updated);
  window.dispatchEvent(new Event(HISTORY_CHANGED_EVENT));
  return updated;
}

/** Create or update a record matched by completedAt */
export function upsertRecord(record: WorkoutRecord): void {
  const existing = loadHistory();
  const idx = existing.findIndex((r) => r.completedAt === record.completedAt);
  if (idx >= 0) {
    existing[idx] = record;
  } else {
    existing.unshift(record);
  }
  saveHistory(existing);
  window.dispatchEvent(new Event(HISTORY_CHANGED_EVENT));
}

/** Format a date as YYYY-MM-DD in local timezone */
export function toLocalDateStr(isoString: string): string {
  const d = new Date(isoString);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Format a date as YYYY-MM in local timezone */
export function toLocalMonthKey(isoString: string): string {
  const d = new Date(isoString);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** Aggregate workout records by day (local timezone), returning Map<YYYY-MM-DD, totalSeconds> */
export function aggregateByDay(records: WorkoutRecord[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const r of records) {
    const day = toLocalDateStr(r.completedAt);
    map.set(day, (map.get(day) ?? 0) + r.durationSeconds);
  }
  return map;
}
