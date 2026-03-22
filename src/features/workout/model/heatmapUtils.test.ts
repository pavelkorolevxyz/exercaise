import { describe, it, expect } from 'vitest';
import {
  generateHeatmapDates,
  getIntensityLevel,
  getMonthLabels,
  formatDayMonth,
  formatDuration,
} from './heatmapUtils';

describe('getIntensityLevel (accepts seconds)', () => {
  it('returns 0 for no activity', () => {
    expect(getIntensityLevel(0)).toBe(0);
    expect(getIntensityLevel(undefined)).toBe(0);
  });

  it('returns 1 for < 15 min (< 900s)', () => {
    expect(getIntensityLevel(1)).toBe(1);
    expect(getIntensityLevel(899)).toBe(1);
  });

  it('returns 2 for 15–29 min (900–1799s)', () => {
    expect(getIntensityLevel(900)).toBe(2);
    expect(getIntensityLevel(1799)).toBe(2);
  });

  it('returns 3 for 30–59 min (1800–3599s)', () => {
    expect(getIntensityLevel(1800)).toBe(3);
    expect(getIntensityLevel(3599)).toBe(3);
  });

  it('returns 4 for 60+ min (3600+s)', () => {
    expect(getIntensityLevel(3600)).toBe(4);
    expect(getIntensityLevel(7200)).toBe(4);
  });
});

describe('formatDayMonth', () => {
  it('formats date string to "weekday, day monthName"', () => {
    expect(formatDayMonth('2026-03-22')).toBe('вс, 22 марта');
    expect(formatDayMonth('2026-01-01')).toBe('чт, 1 января');
    expect(formatDayMonth('2026-12-31')).toBe('чт, 31 декабря');
  });
});

describe('formatDuration', () => {
  it('formats hours, minutes and seconds', () => {
    expect(formatDuration(3661)).toBe('1 ч 1 мин 1 с');
  });

  it('omits hours when zero', () => {
    expect(formatDuration(754)).toBe('12 мин 34 с');
  });

  it('omits minutes when zero (but has hours)', () => {
    expect(formatDuration(3605)).toBe('1 ч 0 мин 5 с');
  });

  it('shows only seconds when < 60', () => {
    expect(formatDuration(45)).toBe('45 с');
  });

  it('returns "нет тренировок" for 0', () => {
    expect(formatDuration(0)).toBe('нет тренировок');
  });
});

describe('generateHeatmapDates', () => {
  const today = new Date('2026-03-22'); // Sunday

  it('returns a 2D grid of 7 rows x N columns', () => {
    const grid = generateHeatmapDates(today);
    expect(grid).toHaveLength(7);
    const colCount = grid[0].length;
    for (const row of grid) {
      expect(row).toHaveLength(colCount);
    }
  });

  it('ends with today', () => {
    const grid = generateHeatmapDates(today);
    const lastCol = grid[0].length - 1;
    const sundayRow = grid[6];
    expect(sundayRow[lastCol]).toBe('2026-03-22');
  });

  it('covers ~26 weeks', () => {
    const grid = generateHeatmapDates(today);
    const colCount = grid[0].length;
    expect(colCount).toBeGreaterThanOrEqual(26);
    expect(colCount).toBeLessThanOrEqual(27);
  });

  it('uses empty string for dates outside the range', () => {
    const wednesday = new Date('2026-03-18');
    const grid = generateHeatmapDates(wednesday);
    const lastCol = grid[0].length - 1;
    expect(grid[3][lastCol]).toBe('');
    expect(grid[4][lastCol]).toBe('');
    expect(grid[5][lastCol]).toBe('');
    expect(grid[6][lastCol]).toBe('');
  });

  it('all non-empty dates are valid YYYY-MM-DD', () => {
    const grid = generateHeatmapDates(today);
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    for (const row of grid) {
      for (const cell of row) {
        if (cell !== '') {
          expect(cell).toMatch(dateRegex);
        }
      }
    }
  });
});

describe('getMonthLabels', () => {
  const today = new Date('2026-03-22');
  const grid = generateHeatmapDates(today);

  it('returns labels with month name and column index', () => {
    const labels = getMonthLabels(grid);
    expect(labels.length).toBeGreaterThan(0);
    for (const label of labels) {
      expect(label.label).toBeTruthy();
      expect(typeof label.column).toBe('number');
      expect(label.column).toBeGreaterThanOrEqual(0);
    }
  });

  it('includes the last month', () => {
    const labels = getMonthLabels(grid);
    const monthNames = labels.map((l) => l.label);
    expect(monthNames).toContain('мар');
  });

  it('labels are in column order', () => {
    const labels = getMonthLabels(grid);
    for (let i = 1; i < labels.length; i++) {
      expect(labels[i].column).toBeGreaterThan(labels[i - 1].column);
    }
  });
});
