import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Heatmap } from './Heatmap';
import * as historyStorage from '../../../shared/storage/historyStorage';
import { HISTORY_CHANGED_EVENT } from '../../../shared/storage/historyStorage';

vi.mock('../../../shared/storage/historyStorage', () => ({
  loadHistory: vi.fn(),
  aggregateByDay: vi.fn(),
  HISTORY_CHANGED_EVENT: 'exercaise:history-changed',
}));

describe('Heatmap', () => {
  beforeEach(() => {
    vi.mocked(historyStorage.loadHistory).mockReturnValue([]);
    vi.mocked(historyStorage.aggregateByDay).mockReturnValue(new Map());
  });

  it('renders the heatmap grid', () => {
    const { container } = render(<Heatmap />);
    expect(container.querySelector('[class*="grid"]')).toBeInTheDocument();
  });

  it('calls loadHistory and aggregateByDay on mount', () => {
    render(<Heatmap />);
    expect(historyStorage.loadHistory).toHaveBeenCalled();
    expect(historyStorage.aggregateByDay).toHaveBeenCalled();
  });

  it('applies intensity level to cells based on data', () => {
    const today = new Date().toISOString().slice(0, 10);
    vi.mocked(historyStorage.aggregateByDay).mockReturnValue(
      new Map([[today, 2700]]), // 45 min = level 3
    );
    const { container } = render(<Heatmap />);
    const level3Cells = container.querySelectorAll('[data-level="3"]');
    expect(level3Cells.length).toBeGreaterThanOrEqual(1);
  });

  it('re-reads history when history-changed event fires', () => {
    const today = new Date().toISOString().slice(0, 10);

    vi.mocked(historyStorage.loadHistory).mockReturnValue([]);
    vi.mocked(historyStorage.aggregateByDay).mockReturnValue(new Map());
    const { container } = render(<Heatmap />);

    const level3Before = container.querySelectorAll('[data-level="3"]').length;

    vi.mocked(historyStorage.aggregateByDay).mockReturnValue(new Map([[today, 2700]]));

    act(() => {
      window.dispatchEvent(new Event(HISTORY_CHANGED_EVENT));
    });

    const level3After = container.querySelectorAll('[data-level="3"]').length;
    expect(level3After).toBeGreaterThan(level3Before);
  });

  it('shows tooltip with human-readable date and duration on hover', () => {
    const today = new Date().toISOString().slice(0, 10);
    vi.mocked(historyStorage.aggregateByDay).mockReturnValue(
      new Map([[today, 1830]]), // 30 min 30 sec
    );
    const { container } = render(<Heatmap />);
    const cell = container.querySelector(`[data-date="${today}"]`);
    expect(cell).toBeTruthy();

    fireEvent.mouseEnter(cell!);
    const tip = screen.getByRole('tooltip');
    expect(tip).toBeInTheDocument();
    expect(tip.textContent).toContain('30 мин 30 с');

    fireEvent.mouseLeave(cell!);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows "нет тренировок" in tooltip for days without activity', () => {
    vi.mocked(historyStorage.aggregateByDay).mockReturnValue(new Map());
    const { container } = render(<Heatmap />);
    // Pick any cell
    const cell = container.querySelector('[data-date]');
    expect(cell).toBeTruthy();

    fireEvent.mouseEnter(cell!);
    const tip = screen.getByRole('tooltip');
    expect(tip.textContent).toContain('нет тренировок');
  });
});
