const WEEKS = 26;

export const MONTH_NAMES = [
  'янв', 'фев', 'мар', 'апр', 'май', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
];

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Day of week: Mon=0 .. Sun=6 */
function dayOfWeek(d: Date): number {
  return (d.getDay() + 6) % 7; // JS getDay: Sun=0, convert to Mon=0
}

/**
 * Generate a grid of dates for the heatmap.
 * Returns 7 rows (Mon..Sun) x N columns (weeks).
 * Empty strings for cells outside the date range.
 */
export function generateHeatmapDates(today = new Date()): string[][] {
  const todayDow = dayOfWeek(today);

  // End date = today, start from the Monday of the first week
  // Total days we want: WEEKS * 7 days before the end of this week
  // Last column ends on today's week (possibly partial)
  const totalCols = WEEKS + 1; // 26 full weeks + current partial week
  const totalDays = (totalCols - 1) * 7 + todayDow + 1;

  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - totalDays + 1);

  const grid: string[][] = Array.from({ length: 7 }, () => Array(totalCols).fill(''));

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const col = Math.floor(i / 7);
    const row = i % 7;
    grid[row][col] = formatDate(d);
  }

  return grid;
}

/** Intensity level from total seconds: 0 (none), 1 (<15m), 2 (15–30m), 3 (30–60m), 4 (60m+) */
export function getIntensityLevel(seconds: number | undefined): number {
  if (!seconds || seconds <= 0) return 0;
  if (seconds < 900) return 1;   // < 15 min
  if (seconds < 1800) return 2;  // 15–30 min
  if (seconds < 3600) return 3;  // 30–60 min
  return 4;                      // 60+ min
}

export const MONTHS_NOMINATIVE = [
  'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
  'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь',
];

export const MONTHS_GENITIVE = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

const WEEKDAYS_SHORT = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

/** "YYYY-MM-DD" → "вс, 22 марта" */
export function formatDayMonth(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const wd = WEEKDAYS_SHORT[d.getDay()];
  const month = d.getMonth();
  const day = d.getDate();
  return `${wd}, ${day} ${MONTHS_GENITIVE[month]}`;
}

/** Seconds → "1 ч 15 мин 30 с", or "нет тренировок" for 0 */
export function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return 'нет тренировок';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h} ч`);
  if (h > 0 || m > 0) parts.push(`${m} мин`);
  parts.push(`${s} с`);
  return parts.join(' ');
}

export interface MonthLabel {
  label: string;
  column: number;
}

/**
 * Extract month labels from the first row (Monday) of the grid.
 * Returns one label per month at the column where it first appears.
 */
export function getMonthLabels(grid: string[][]): MonthLabel[] {
  const labels: MonthLabel[] = [];
  let lastMonth = -1;

  const cols = grid[0].length;
  for (let col = 0; col < cols; col++) {
    // Find the first non-empty cell in this column
    let dateStr = '';
    for (let row = 0; row < 7; row++) {
      if (grid[row][col]) {
        dateStr = grid[row][col];
        break;
      }
    }
    if (!dateStr) continue;

    const month = parseInt(dateStr.slice(5, 7), 10) - 1;
    if (month !== lastMonth) {
      labels.push({ label: MONTH_NAMES[month], column: col });
      lastMonth = month;
    }
  }

  return labels;
}
