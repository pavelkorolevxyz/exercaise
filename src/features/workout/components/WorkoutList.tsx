import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Info, Sparkles } from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';
import { estimateDurationMinutes } from '../model/duration';
import { Button, Card, Modal, ModalHeader, ModalTitle, ModalBody, ModalActions } from '../../../shared/ui';
import { useScrollIndicators } from '../../../shared/hooks/useScrollIndicators';
import type { Workout } from '../model/types';
import { CreateWorkoutModal } from './CreateWorkoutModal';
import { ImportModal } from './ImportModal';
import styles from './WorkoutList.module.css';

function WorkoutCard({
  workout,
  isActive,
  onSelect,
}: {
  workout: Workout;
  isActive: boolean;
  onSelect: () => void;
}) {
  const minutes = estimateDurationMinutes(workout.exercises);
  return (
    <Card as="button" interactive active={isActive} onClick={onSelect}>
      <div className={styles.cardTop}>
        <div className={styles.cardName}>{workout.title}</div>
      </div>
      <div className={styles.cardMeta}>
        <span className={styles.cardStat} title="Количество упражнений">{workout.exercises.length} упр.</span>
        <span className={styles.cardStat} title="Примерная длительность">{minutes}'</span>
      </div>
    </Card>
  );
}

export function WorkoutList() {
  const workouts = useWorkoutStore((s) => s.workouts);
  const importFromJson = useWorkoutStore((s) => s.importFromJson);
  const addWorkout = useWorkoutStore((s) => s.addWorkout);
  const navigate = useNavigate();
  const location = useLocation();
  const activeId = location.pathname.match(/\/workout\/([^/]+)/)?.[1];
  const isPlaying = location.pathname.endsWith('/play');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const scrollRef = useScrollIndicators();

  const handleImport = (json: string) => {
    const workout = importFromJson(json);
    navigate(`/workout/${workout.id}`);
    setShowImportModal(false);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.logo}>
          exerc<span>ai</span>se
        </div>
        <button
          className={styles.headerAction}
          aria-label="О приложении"
          onClick={() => setShowInfoModal(true)}
        >
          <Info size={16} />
        </button>
      </div>

      <div className={styles.scroll} ref={scrollRef}>
        {workouts.length === 0 && (
          <div className={styles.empty}>
            Нет тренировок.<br />Импортируйте JSON-файл.
          </div>
        )}
        {workouts.map((w) => (
          <WorkoutCard
            key={w.id}
            workout={w}
            isActive={w.id === activeId}
            onSelect={() => navigate(`/workout/${w.id}${isPlaying && w.id === activeId ? '/play' : ''}`)}
          />
        ))}
      </div>

      <div className={styles.footer}>
        <div className={styles.footerButtons}>
          <Button variant="dashed" size="sm" fullWidth onClick={() => setShowImportModal(true)}>
            Импорт
          </Button>
          <Button variant="dashed" size="sm" fullWidth onClick={() => setShowCreateModal(true)}>
            <Sparkles size={16} /> Создать
          </Button>
        </div>
      </div>

      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImport={handleImport}
        />
      )}
      <Modal open={showInfoModal} onClose={() => setShowInfoModal(false)}>
        <ModalHeader>
          <ModalTitle>О приложении</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className={styles.aboutText}>
            <p>
              <strong>exerc<span className={styles.aboutAi}>ai</span>se</strong> — плеер тренировок.
            </p>
            <p>
              Любое упражнение описывается простой схемой: название,
              количество повторений и подходов, темп выполнения (фазы движения
              и задержки между ними), отдых между подходами. Приседания, планка,
              дыхательная гимнастика — всё укладывается в один и тот же формат.
            </p>
            <p>
              С помощью нейросетей (ChatGPT, Claude и др.) можно сгенерировать
              тренировку под любой запрос:
            </p>
            <ul>
              <li>Под конкретную проблему — боль в спине, осанка, растяжка</li>
              <li>Под состояние здоровья — после травмы, при ограничениях</li>
              <li>С любым инвентарём — коврик, гантели, резинки, фитбол</li>
              <li>В любых условиях — дома, в офисе со стулом и столом, на улице</li>
              <li>Любой сложности и длительности — от 5 минут до часа</li>
            </ul>
            <p>
              Просто опишите, что вам нужно, и AI составит тренировку
              в формате JSON — останется только импортировать её в приложение.
            </p>
          </div>
        </ModalBody>
        <ModalActions>
          <Button onClick={() => setShowInfoModal(false)}>Закрыть</Button>
        </ModalActions>
      </Modal>

      {showCreateModal && (
        <CreateWorkoutModal
          onClose={() => setShowCreateModal(false)}
          onSurprise={(workout) => {
            addWorkout(workout);
            navigate(`/workout/${workout.id}`);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}
