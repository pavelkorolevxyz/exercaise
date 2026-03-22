import { useMemo, useState, useCallback, useEffect } from 'react';
import { loadHistory, aggregateByDay, HISTORY_CHANGED_EVENT } from '../../../shared/storage/historyStorage';
import { generateHeatmapDates, getIntensityLevel, formatDayMonth, formatDuration } from '../model/heatmapUtils';
import styles from './Heatmap.module.css';

interface TooltipState {
  text: string;
  x: number;
  y: number;
}

export function Heatmap() {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const handler = () => setVersion((v) => v + 1);
    window.addEventListener(HISTORY_CHANGED_EVENT, handler);
    return () => window.removeEventListener(HISTORY_CHANGED_EVENT, handler);
  }, []);

  const data = useMemo(() => {
    const history = loadHistory();
    return aggregateByDay(history);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  const grid = useMemo(() => generateHeatmapDates(), []);

  // Flatten grid (stored as rows) into column-first order for CSS grid
  const cells = useMemo(() => {
    const result: string[] = [];
    const cols = grid[0].length;
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < 7; row++) {
        result.push(grid[row][col]);
      }
    }
    return result;
  }, [grid]);

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>, date: string, seconds: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      text: `${formatDayMonth(date)} — ${formatDuration(seconds)}`,
      x: rect.left + rect.width / 2,
      y: rect.top - 4,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  return (
    <div className={styles.heatmap}>
      <div className={styles.grid}>
        {cells.map((date, i) => {
          if (!date) {
            return <div key={i} className={styles.cellEmpty} />;
          }
          const seconds = data.get(date) ?? 0;
          const level = getIntensityLevel(seconds);
          return (
            <div
              key={date}
              className={styles.cell}
              data-level={level}
              data-date={date}
              onMouseEnter={(e) => handleMouseEnter(e, date, seconds)}
              onMouseLeave={handleMouseLeave}
            />
          );
        })}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          role="tooltip"
          className={styles.tooltip}
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
