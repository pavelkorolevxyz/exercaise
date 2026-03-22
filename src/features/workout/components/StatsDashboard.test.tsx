import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StatsDashboard } from './StatsDashboard';
import * as historyStorage from '../../../shared/storage/historyStorage';
import type { WorkoutRecord } from '../../../shared/storage/historyStorage';

vi.mock('../../../shared/storage/historyStorage', async (importOriginal) => {
  const actual = await importOriginal<typeof historyStorage>();
  return {
    ...actual,
    loadHistory: vi.fn(),
    aggregateByDay: vi.fn(),
  };
});

function makeRecord(date: string, duration = 600): WorkoutRecord {
  return {
    completedAt: `${date}T10:00:00.000Z`,
    workoutId: 'w1',
    workoutTitle: 'Test',
    durationSeconds: duration,
  };
}

describe('StatsDashboard', () => {
  beforeEach(() => {
    vi.mocked(historyStorage.loadHistory).mockReturnValue([]);
    vi.mocked(historyStorage.aggregateByDay).mockReturnValue(new Map());
  });

  it('renders summary cards with labels', () => {
    render(<StatsDashboard />);
    expect(screen.getByText('Тренировок')).toBeInTheDocument();
    expect(screen.getByText('Общее время')).toBeInTheDocument();
    expect(screen.getByText('Текущая серия')).toBeInTheDocument();
    expect(screen.getByText('Лучшая серия')).toBeInTheDocument();
  });

  it('renders correct values from history', () => {
    vi.mocked(historyStorage.loadHistory).mockReturnValue([
      makeRecord('2026-03-22', 3660),
      makeRecord('2026-03-21', 1800),
    ]);
    render(<StatsDashboard />);
    expect(screen.getByText('2')).toBeInTheDocument(); // total workouts
    expect(screen.getByText('1 ч 31 мин 0 с')).toBeInTheDocument(); // total time
  });

  it('renders heatmap', () => {
    const { container } = render(<StatsDashboard />);
    expect(container.querySelector('[class*="heatmap"]')).toBeInTheDocument();
  });

  it('renders weekly chart with 6 bars', () => {
    const { container } = render(<StatsDashboard />);
    const weeklyChart = container.querySelector('[data-testid="weeklyChart"]');
    expect(weeklyChart).toBeInTheDocument();
    const bars = weeklyChart!.querySelectorAll('[data-testid="bar"]');
    expect(bars).toHaveLength(6);
  });

  it('renders monthly chart with 6 bars', () => {
    const { container } = render(<StatsDashboard />);
    const monthlyChart = container.querySelector('[data-testid="monthlyChart"]');
    expect(monthlyChart).toBeInTheDocument();
    const bars = monthlyChart!.querySelectorAll('[data-testid="bar"]');
    expect(bars).toHaveLength(6);
  });

  it('shows zero state gracefully', () => {
    render(<StatsDashboard />);
    expect(screen.getByText('0')).toBeInTheDocument(); // total workouts
    expect(screen.getByText('0 с')).toBeInTheDocument(); // total time
  });

  it('shows tooltip with full duration on bar hover', () => {
    vi.mocked(historyStorage.loadHistory).mockReturnValue([
      makeRecord('2026-03-22', 1830), // 30 min 30 sec
    ]);
    const { container } = render(<StatsDashboard />);
    const weeklyChart = container.querySelector('[data-testid="weeklyChart"]');
    // Find the last barRow (current week)
    const barRows = weeklyChart!.querySelectorAll('[class*="barRow"]');
    const lastBar = barRows[barRows.length - 1];

    fireEvent.mouseEnter(lastBar);
    const tip = screen.getByRole('tooltip');
    expect(tip.textContent).toContain('30 мин 30 с');

    fireEvent.mouseLeave(lastBar);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
