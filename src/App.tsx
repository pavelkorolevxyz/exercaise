import { useEffect, useState } from 'react';
import { Routes, Route, Outlet, useParams, useNavigate, useLocation } from 'react-router';
import { ArrowLeft, Dumbbell, Play, Pencil, Trash2 } from 'lucide-react';
import { useWorkoutStore } from './features/workout/store/workoutStore';
import { warmup as warmupSound } from './shared/sound/SoundCue';
import { WorkoutList } from './features/workout/components/WorkoutList';
import { ExerciseList } from './features/workout/components/ExerciseList';
import { EditWorkoutModal } from './features/workout/components/EditWorkoutModal';
import { WorkoutPlayer } from './features/workout/components/WorkoutPlayer';
import { Button, MarqueeText } from './shared/ui';
import { useScrollIndicators } from './shared/hooks/useScrollIndicators';
import { DesignSystem } from './pages/DesignSystem';
import styles from './App.module.css';

function ExercisePanel() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const workout = useWorkoutStore((s) => s.workouts.find((w) => w.id === id));
  const playerIndex = useWorkoutStore((s) => s.playerExerciseIndex);
  const setStartFrom = useWorkoutStore((s) => s.setStartFromExerciseIndex);
  const remove = useWorkoutStore((s) => s.remove);
  const exerciseDrawerOpen = useWorkoutStore((s) => s.exerciseDrawerOpen);
  const setExerciseDrawerOpen = useWorkoutStore((s) => s.setExerciseDrawerOpen);
  const isPlaying = location.pathname.endsWith('/play');
  const [showEditModal, setShowEditModal] = useState(false);

  const scrollRef = useScrollIndicators();

  if (!workout) return null;

  const handleExerciseClick = (index: number) => {
    warmupSound();
    setExerciseDrawerOpen(false);
    if (isPlaying) {
      navigate(`/workout/${id}/play?from=${index}`, { state: Date.now() });
    } else {
      setStartFrom(index);
      navigate(`/workout/${id}/play`);
    }
  };

  const handleBackClick = () => {
    if (isPlaying && exerciseDrawerOpen) {
      setExerciseDrawerOpen(false);
    } else {
      navigate('/');
    }
  };

  return (
    <>
      {exerciseDrawerOpen && isPlaying && (
        <div className={styles.epBackdrop} onClick={() => setExerciseDrawerOpen(false)} />
      )}
      <div
        className={styles.exercisePanel}
        data-panel="exercises"
        data-drawer-open={exerciseDrawerOpen || undefined}
      >
        <div className={styles.epHeader} data-panel-header>
          <button
            className={styles.epBack}
            onClick={handleBackClick}
            aria-label={isPlaying ? 'Закрыть список' : 'Назад к списку'}
            data-back
          >
            <ArrowLeft size={20} />
          </button>
          <MarqueeText className={styles.epTitle}>{workout.title}</MarqueeText>
          <button
            className={styles.epAction}
            onClick={() => setShowEditModal(true)}
            aria-label="Редактировать"
          >
            <Pencil size={16} />
          </button>
          <button
            className={`${styles.epAction} ${styles.epActionDanger}`}
            onClick={() => { remove(workout.id); navigate('/'); }}
            aria-label="Удалить"
          >
            <Trash2 size={16} />
          </button>
        </div>
        <div className={styles.epScroll} data-panel-scroll ref={scrollRef}>
          <ExerciseList
            exercises={workout.exercises}
            currentIndex={isPlaying ? playerIndex ?? undefined : undefined}
            onExerciseClick={handleExerciseClick}
          />
        </div>
        {!isPlaying && (
          <div className={styles.epFooter}>
            <Button size="lg" fullWidth onClick={() => { warmupSound(); navigate(`/workout/${id}/play`); }}>
              Начать
            </Button>
          </div>
        )}
      </div>
      {showEditModal && (
        <EditWorkoutModal
          workout={workout}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </>
  );
}

function WorkoutReadyScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div className={styles.mainArea}>
      <div className={styles.placeholder}>
        <Button size="lg" onClick={() => { warmupSound(); navigate(`/workout/${id}/play`); }}>
          <Play size={20} fill="currentColor" /> Начать
        </Button>
      </div>
    </div>
  );
}

function WorkoutLayout() {
  const location = useLocation();
  const isPlay = location.pathname.endsWith('/play');
  const isWorkout = /\/workout\//.test(location.pathname);
  const route = isPlay ? 'play' : isWorkout ? 'workout' : 'home';

  return (
    <div className={styles.app} data-layout="app" data-route={route}>
      <WorkoutList />
      <Outlet />
    </div>
  );
}

export function App() {
  const loadFromStorage = useWorkoutStore((s) => s.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <Routes>
      <Route path="/design-system" element={<DesignSystem />} />

      <Route element={<WorkoutLayout />}>
        <Route
          index
          element={
            <div className={styles.placeholder}>
              <div className={styles.placeholderIcon}><Dumbbell size={64} /></div>
              <div className={styles.placeholderText}>Выберите тренировку</div>
            </div>
          }
        />
        <Route
          path="/workout/:id"
          element={
            <>
              <ExercisePanel />
              <WorkoutReadyScreen />
            </>
          }
        />
        <Route
          path="/workout/:id/play"
          element={
            <>
              <ExercisePanel />
              <WorkoutPlayer />
            </>
          }
        />
      </Route>
    </Routes>
  );
}
