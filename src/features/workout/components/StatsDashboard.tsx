import { useMemo, useState, useEffect, useCallback } from 'react';
import { loadHistory, HISTORY_CHANGED_EVENT } from '../../../shared/storage/historyStorage';
import { pluralize } from '../../../shared/i18n/pluralize';
import { getIntensityLevel, formatDuration } from '../model/heatmapUtils';
import {
  computeTotalWorkouts,
  computeTotalTime,
  formatTotalTime,
  computeCurrentStreak,
  computeBestStreak,
  aggregateByWeek,
  aggregateByMonth,
  type ChartEntry,
} from '../model/statsUtils';
import { Heatmap } from './Heatmap';
import styles from './StatsDashboard.module.css';

const BAR_COLORS: Record<number, string> = {
  0: 'var(--surface-2)',
  1: 'rgba(200, 255, 0, 0.20)',
  2: 'rgba(200, 255, 0, 0.40)',
  3: 'rgba(200, 255, 0, 0.65)',
  4: 'rgba(200, 255, 0, 0.90)',
};

interface BarTooltipState {
  text: string;
  x: number;
  y: number;
}

function BarChart({ data, testId }: { data: ChartEntry[]; testId: string }) {
  const max = Math.max(...data.map((d) => d.minutes), 1);
  const [tooltip, setTooltip] = useState<BarTooltipState | null>(null);

  const handleMouseEnter = useCallback((e: React.MouseEvent, entry: ChartEntry) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      text: `${entry.label} — ${formatDuration(entry.totalSeconds)}`,
      x: rect.left + rect.width / 2,
      y: rect.top - 4,
    });
  }, []);

  const handleMouseLeave = useCallback(() => setTooltip(null), []);

  return (
    <div className={styles.chart} data-testid={testId}>
      {data.map((d, i) => {
        const level = getIntensityLevel(d.totalSeconds);
        return (
          <div
            key={i}
            className={styles.barRow}
            onMouseEnter={(e) => handleMouseEnter(e, d)}
            onMouseLeave={handleMouseLeave}
          >
            <div className={styles.barLabel}>{d.label}</div>
            <div className={styles.barArea}>
              <div
                className={d.minutes > 0 ? styles.bar : styles.barEmpty}
                style={d.minutes > 0 ? {
                  '--bar-pct': `${(d.minutes / max) * 100}%`,
                  background: BAR_COLORS[level],
                } as React.CSSProperties : undefined}
                data-testid="bar"
              />
            </div>
            <div className={styles.barValue}>{d.minutes > 0 ? d.minutes : ''}</div>
          </div>
        );
      })}
      {tooltip && (
        <div role="tooltip" className={styles.tooltip} style={{ left: tooltip.x, top: tooltip.y }}>
          {tooltip.text}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ value, label }: { value: string; label: string }) {
  return (
    <div className={styles.summaryCard}>
      <div className={styles.summaryValue}>{value}</div>
      <div className={styles.summaryLabel}>{label}</div>
    </div>
  );
}

export function StatsDashboard() {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const handler = () => setVersion((v) => v + 1);
    window.addEventListener(HISTORY_CHANGED_EVENT, handler);
    return () => window.removeEventListener(HISTORY_CHANGED_EVENT, handler);
  }, []);

  const stats = useMemo(() => {
    const records = loadHistory();
    const totalWorkouts = computeTotalWorkouts(records);
    const totalTime = computeTotalTime(records);
    const currentStreak = computeCurrentStreak(records);
    const bestStreak = computeBestStreak(records);
    const weekly = aggregateByWeek(records);
    const monthly = aggregateByMonth(records);
    return { totalWorkouts, totalTime, currentStreak, bestStreak, weekly, monthly };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  const streakSuffix = (n: number) => ` ${pluralize(n, 'день', 'дня', 'дней')}`;

  return (
    <div className={styles.dashboard}>
      {/* Summary cards */}
      <div className={styles.summaryRow}>
        <SummaryCard value={String(stats.totalWorkouts)} label="Тренировок" />
        <SummaryCard value={formatTotalTime(stats.totalTime)} label="Общее время" />
        <SummaryCard
          value={stats.currentStreak + streakSuffix(stats.currentStreak)}
          label="Текущая серия"
        />
        <SummaryCard
          value={stats.bestStreak + streakSuffix(stats.bestStreak)}
          label="Лучшая серия"
        />
      </div>

      {/* Heatmap */}
      <Heatmap />

      {/* Weekly chart */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>По неделям (мин)</div>
        <BarChart data={stats.weekly} testId="weeklyChart" />
      </div>

      {/* Monthly chart */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>По месяцам (мин)</div>
        <BarChart data={stats.monthly} testId="monthlyChart" />
      </div>
    </div>
  );
}
