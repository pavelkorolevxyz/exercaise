import { useEffect, useRef } from 'react';
import { Card } from '../../../shared/ui';
import type { Exercise } from '../model/types';
import styles from './ExerciseList.module.css';

interface ExerciseListProps {
  exercises: Exercise[];
  currentIndex?: number;
  onExerciseClick?: (index: number) => void;
}

export function ExerciseList({ exercises, currentIndex, onExerciseClick }: ExerciseListProps) {
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (currentIndex !== undefined && itemRefs.current[currentIndex]) {
      itemRefs.current[currentIndex]!.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    }
  }, [currentIndex]);

  return (
    <div className={styles.list}>
      {exercises.map((ex, i) => {
        const isDone = currentIndex !== undefined && i < currentIndex;
        const isCurrent = currentIndex !== undefined && i === currentIndex;

        return (
          <div key={i} ref={(el: HTMLDivElement | null) => { itemRefs.current[i] = el; }}>
            <Card
              as={onExerciseClick ? 'button' : 'div'}
              interactive={!!onExerciseClick}
              active={isCurrent}
              className={isDone ? styles.itemDone : undefined}
              onClick={() => onExerciseClick?.(i)}
            >
              <div className={styles.row}>
                <div className={styles.indicator}>
                  <div className={`${styles.num} ${isCurrent ? styles.numCurrent : isDone ? styles.numDone : ''}`}>{i + 1}</div>
                </div>
                <div className={styles.body}>
                  <div className={styles.title}>{ex.title}</div>
                  <div className={styles.details}>
                    <span className={styles.params} title="Подходы × повторения">{ex.setCount}×{ex.repeatCount}</span>
                    {ex.restSeconds > 0 && (
                      <span className={styles.meta} title="Отдых между подходами">{ex.restSeconds}с</span>
                    )}
                    {ex.tempo && (
                      <span className={styles.tempo} title="Темп: движение – задержка – возврат (сек)">
                        {ex.tempo.to}-{ex.tempo.hold}-{ex.tempo.from}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
