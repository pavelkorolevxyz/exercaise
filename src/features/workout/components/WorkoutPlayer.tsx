import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { Play, Pause, Square, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Check, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';
import { usePlayerState, getReadingSeconds } from '../model/usePlayerState';
import type { Workout } from '../model/types';
import { Button, IconButton } from '../../../shared/ui';
import { pluralize } from '../../../shared/i18n/pluralize';
import * as sound from '../../../shared/sound/SoundCue';
import { useWakeLock } from '../../../shared/hooks/useWakeLock';
import { COMPLETION_PHRASES } from './completionPhrases';
import styles from './WorkoutPlayer.module.css';

const RING_R = 125;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R;

export function WorkoutPlayer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const workout = useWorkoutStore((s) => s.workouts.find((w) => w.id === id));

  if (!workout) {
    return (
      <div className={styles.stage}>
        <div className={styles.empty}>
          <div className={styles.emptyTitle}>Тренировка не найдена</div>
          <Button variant="secondary" size="sm" onClick={() => navigate('/')}>
            Назад
          </Button>
        </div>
      </div>
    );
  }

  return <PlayerView workout={workout} />;
}

function KaraokeText({ text, totalSeconds, isPaused }: { text: string; totalSeconds: number; isPaused: boolean }) {
  const words = text.split(/\s+/);
  const INITIAL_DELAY = 1.0;
  const lastWordTime = Math.max(INITIAL_DELAY, totalSeconds - 0.6);
  const step = words.length > 1 ? (lastWordTime - INITIAL_DELAY) / (words.length - 1) : 0;
  return (
    <div
      className={styles.readingKaraoke}
      style={{ '--karaoke-play-state': isPaused ? 'paused' : 'running' } as React.CSSProperties}
    >
      {words.map((word, i) => (
        <span
          key={i}
          className={styles.karaokeWord}
          style={{ animationDelay: `${INITIAL_DELAY + i * step}s` }}
        >
          {word}{' '}
        </span>
      ))}
    </div>
  );
}

function PlayerView({ workout }: { workout: Workout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    state,
    currentExercise,
    totalReps,
    totalSets,
    ringProgress,
    tempoLabel,
    hasTempo: exerciseHasTempo,
    actions,
  } = usePlayerState(workout);

  const setPlayerIndex = useWorkoutStore((s) => s.setPlayerExerciseIndex);
  const startFromIndex = useWorkoutStore((s) => s.startFromExerciseIndex);
  const setStartFrom = useWorkoutStore((s) => s.setStartFromExerciseIndex);

  const requestedIndex = useMemo(() => {
    const from = new URLSearchParams(location.search).get('from');
    if (from === null) return null;
    const parsed = Number.parseInt(from, 10);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed >= workout.exercises.length) {
      return null;
    }
    return parsed;
  }, [location.search, workout.exercises.length]);

  const exercise = currentExercise;
  const tempo = exercise?.tempo;
  const ringOffset = RING_CIRCUMFERENCE * (1 - ringProgress);

  const phaseStyle = state.phase === 'rest'
    ? { '--phase-color': 'var(--violet)', '--phase-color-g': 'var(--violet-g)' } as React.CSSProperties
    : undefined;


  // Detect ring reset (progress drops significantly) to disable CSS transition
  const prevProgressRef = useRef(0);
  const isRingResetting = prevProgressRef.current > 0.5 && ringProgress < 0.1;
  prevProgressRef.current = ringProgress;

  const [isMuted, setIsMuted] = useState(() => !sound.getSettings().enabled);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      sound.configure({ enabled: prev });
      return !prev;
    });
  }, []);

  const [completionPhrase, setCompletionPhrase] = useState(
    () => COMPLETION_PHRASES[Math.floor(Math.random() * COMPLETION_PHRASES.length)],
  );
  useEffect(() => {
    if (state.phase === 'complete') {
      setCompletionPhrase(COMPLETION_PHRASES[Math.floor(Math.random() * COMPLETION_PHRASES.length)]);
    }
  }, [state.phase]);

  const phaseLabel =
    state.phase === 'rest' ? 'ОТДЫХ' : state.phase === 'exercise' ? (tempoLabel ?? 'ВЫПОЛНЯЙ').toUpperCase() : null;

  // Sync current exercise index to store for the exercise panel
  const activeIndex = state.phase === 'exercise' || state.phase === 'rest' || state.phase === 'reading' || state.phase === 'countdown'
    ? state.exerciseIndex
    : state.phase === 'complete'
      ? workout.exercises.length
      : null;

  useEffect(() => {
    setPlayerIndex(activeIndex);
    return () => setPlayerIndex(null);
  }, [activeIndex, setPlayerIndex]);

  const exerciseProgress = (
    <div className={`${styles.progressRow} ${styles.exerciseProgressRow}`}>
      <div className={styles.progressTop}>
        <span className={styles.progressLabel}>Упражнение</span>
        <span className={styles.progressCount}>
          {activeIndex !== null && activeIndex < workout.exercises.length ? activeIndex + 1 : workout.exercises.length} / {workout.exercises.length}
        </span>
      </div>
      <div className={styles.setDots}>
        {workout.exercises.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Упражнение ${i + 1}: ${workout.exercises[i].title}`}
            className={`${styles.exSegment} ${
              activeIndex !== null && i < activeIndex ? styles.exSegmentDone :
              activeIndex !== null && i === activeIndex ? styles.exSegmentActive : ''
            }`}
            onClick={() => { sound.warmup(); actions.goToExercise(i); }}
          />
        ))}
      </div>
    </div>
  );

  const isFullscreen = useWorkoutStore((s) => s.isFullscreen);
  const setFullscreen = useWorkoutStore((s) => s.setFullscreen);

  const [isCompact, setIsCompact] = useState(() => window.innerHeight < 600);
  useEffect(() => {
    const mq = window.matchMedia('(max-height: 599px)');
    setIsCompact(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsCompact(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const hasPointer = window.matchMedia('(pointer: fine)').matches;
  const canFullscreen = hasPointer
    && (typeof document.documentElement.requestFullscreen === 'function'
      || typeof (document.documentElement as HTMLElement & { webkitRequestFullscreen?: unknown }).webkitRequestFullscreen === 'function');

  const handleToggleFullscreen = useCallback(() => {
    const el = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
      mozRequestFullScreen?: () => Promise<void>;
    };
    if (!document.fullscreenElement) {
      const req = el.requestFullscreen?.() ?? el.webkitRequestFullscreen?.() ?? el.mozRequestFullScreen?.();
      if (req) req.catch((err: unknown) => console.warn('Fullscreen failed:', err));
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  // Sync store state with browser fullscreen changes (e.g. user presses Esc in browser)
  useEffect(() => {
    const onFsChange = () => {
      setFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [setFullscreen]);

  useWakeLock();

  // Mount-only: start workout once and clean up on unmount.
  // Dependencies are intentionally omitted — re-running would restart the workout.
  useEffect(() => {
    if (startFromIndex !== null) {
      const idx = startFromIndex;
      setStartFrom(null);
      actions.startFromExercise(idx);
    } else if (requestedIndex !== null) {
      actions.startFromExercise(requestedIndex);
    } else {
      actions.start();
    }
    return () => {
      actions.stop();
      if (document.fullscreenElement) document.exitFullscreen();
      setFullscreen(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const didMountRef = useRef(false);

  const goToExercise = actions.goToExercise;

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    if (requestedIndex !== null) {
      goToExercise(requestedIndex);
    }
  }, [requestedIndex, goToExercise, location.key]);

  const playerControls = (
    <div className={styles.controls}>
      <div className={styles.navGroup}>
        <IconButton size="lg" aria-label="Предыдущее упражнение" title="Предыдущее упражнение (Shift+←)" onClick={actions.prevExercise}><ChevronsLeft size={24} fill="currentColor" /></IconButton>
        <IconButton size="lg" aria-label="Предыдущий подход" title="Предыдущий подход (←)" onClick={actions.prevSet}><ChevronLeft size={24} fill="currentColor" /></IconButton>
        <button
          className={`${styles.ctrlMain} ${state.isPaused ? styles.ctrlPaused : ''}`}
          onClick={actions.togglePause}
          aria-label={state.isPaused ? 'Продолжить' : 'Пауза'}
          title="Пауза / Продолжить (Пробел)"
        >
          {state.isPaused ? <Play size={28} fill="currentColor" /> : <Pause size={28} fill="currentColor" />}
        </button>
        <IconButton size="lg" aria-label="Следующий подход" title="Следующий подход (→)" onClick={actions.nextSet}><ChevronRight size={24} fill="currentColor" /></IconButton>
        <IconButton size="lg" aria-label="Следующее упражнение" title="Следующее упражнение (Shift+→)" onClick={actions.nextExercise}><ChevronsRight size={24} fill="currentColor" /></IconButton>
      </div>
      <div className={styles.utilGroup}>
        <IconButton size="lg" className={isMuted ? styles.ctrlMuted : undefined} aria-label={isMuted ? 'Включить звук' : 'Выключить звук'} title={isMuted ? 'Включить звук (M)' : 'Выключить звук (M)'} onClick={toggleMute}>{isMuted ? <VolumeX size={20} fill="currentColor" /> : <Volume2 size={20} fill="currentColor" />}</IconButton>
        {canFullscreen && (
          <IconButton size="lg" aria-label={isFullscreen ? 'Выйти из полноэкранного режима' : 'Полноэкранный режим'} title={isFullscreen ? 'Выйти из полноэкранного режима (F)' : 'Полноэкранный режим (F)'} onClick={handleToggleFullscreen}>{isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}</IconButton>
        )}
        <IconButton size="lg" danger aria-label="Остановить" title="Остановить (Esc)" onClick={() => navigate(`/workout/${workout.id}`)}><Square size={18} fill="currentColor" /></IconButton>
      </div>
    </div>
  );

  // Keyboard hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          actions.togglePause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (e.shiftKey) {
            actions.prevExercise();
          } else {
            actions.prevSet();
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (e.shiftKey) {
            actions.nextExercise();
          } else {
            actions.nextSet();
          }
          break;
        case 'KeyF':
          e.preventDefault();
          handleToggleFullscreen();
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'Escape':
          // Don't handle Escape when in browser fullscreen — browser handles it
          if (!isFullscreen) {
            e.preventDefault();
            navigate(`/workout/${workout.id}`);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions, isFullscreen, handleToggleFullscreen, navigate, workout.id, toggleMute]);

  if (state.phase === 'reading' || state.phase === 'countdown') {
    return (
      <div className={`${styles.stage} ${isFullscreen ? styles.fullscreen : ''}`}>
        {isFullscreen && (
          <button
            className={styles.fsExitBtn}
            onClick={handleToggleFullscreen}
            aria-label="Выйти из полноэкранного режима"
            title="Выйти из полноэкранного режима (F)"
          >
            <Minimize size={24} />
          </button>
        )}
        <div className={styles.readingScreen}>
          <div className={styles.readingContent}>
            <div className={styles.readingTitle}>{exercise?.title}</div>
            {exercise?.description && (
              <KaraokeText
                key={state.exerciseIndex}
                text={exercise.description}
                totalSeconds={getReadingSeconds(exercise.description)}
                isPaused={state.isPaused || state.phase === 'countdown'}
              />
            )}
            <div className={`${styles.countdownNumber} ${state.phase === 'countdown' ? styles.countdownActive : ''}`}>
              {state.phase === 'countdown' ? state.countdownSecondsLeft : 3}
            </div>
          </div>
          {!isFullscreen && (
            <>
            {exerciseProgress}
            {playerControls}
            </>
          )}
        </div>
        {isFullscreen && state.isPaused && (
          <button
            className={styles.pauseOverlay}
            onClick={actions.togglePause}
            aria-label="Продолжить"
          >
            <Play size={64} fill="currentColor" />
            <span className={styles.pauseOverlayLabel}>ПАУЗА</span>
          </button>
        )}
      </div>
    );
  }

  if (state.phase === 'complete') {
    return (
      <div className={`${styles.stage} ${isFullscreen ? styles.fullscreen : ''}`}>
        <div className={styles.completeScreen}>
          <div className={styles.completeCenter}>
            <div className={styles.heroIcon}><Check size={48} strokeWidth={3} /></div>
            <div className={styles.heroTitle}>{completionPhrase[0]}</div>
            <div className={styles.heroSub}>{completionPhrase[1]}</div>
          </div>
          <div className={styles.heroFooter}>
            <Button size="lg" fullWidth onClick={() => navigate('/')}>
              К тренировкам
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const viewBox = RING_R * 2 + 30;
  const center = viewBox / 2;

  const phaseIndicator = state.phase === 'rest' ? (
    <div className={`${styles.phase} ${styles.phaseRest}`}>ОТДЫХ</div>
  ) : state.phase === 'exercise' && exerciseHasTempo && tempo ? (
    <div className={styles.tempoPhases}>
      {(['to', 'hold', 'from'] as const).filter((tp) => tempo[tp] > 0).map((tp) => (
        <span
          key={tp}
          className={`${styles.tempoPhaseItem} ${state.tempoPhase === tp ? styles.tempoPhaseActive : ''}`}
        >
          {tp === 'to' ? 'Вперёд' : tp === 'hold' ? (tempo.to === 0 && tempo.from === 0 ? 'Работаем' : 'Задержись') : 'Назад'}
        </span>
      ))}
    </div>
  ) : state.phase === 'exercise' ? (
    <div className={`${styles.phase} ${styles.phaseEx}`}>{phaseLabel}</div>
  ) : null;

  const ringOnly = (
    <>
      {phaseIndicator}
      <div className={styles.ringWrap}>
        <svg viewBox={`0 0 ${viewBox} ${viewBox}`}>
          <circle className={styles.ringBg} cx={center} cy={center} r={RING_R} />
          <circle
            className={styles.ringFill}
            cx={center}
            cy={center}
            r={RING_R}
            style={{
              strokeDasharray: RING_CIRCUMFERENCE,
              strokeDashoffset: ringOffset,
              stroke: 'var(--phase-color, var(--lime))',
              transition: isRingResetting
                ? 'none'
                : `stroke-dashoffset var(--duration-normal) ease, stroke var(--duration-normal) ease`,
            }}
          />
        </svg>
        <div className={styles.ringInner}>
          {state.phase === 'exercise' ? (
            <>
              <div className={styles.ringNum}>
                {exerciseHasTempo ? state.tempoSecondsLeft : state.repIndex + 1}
              </div>
              <div className={styles.ringLabel}>
                {exerciseHasTempo
                  ? 'СЕКУНД'
                  : pluralize(state.repIndex + 1, 'повторение', 'повторения', 'повторений')}
              </div>
            </>
          ) : (
            <>
              <div className={styles.ringNumRest}>{state.restSecondsLeft}</div>
              <div className={styles.ringLabel}>СЕКУНД</div>
            </>
          )}
        </div>
      </div>
    </>
  );


  const progressSection = state.phase === 'exercise' && (
    <>
      {totalSets > 1 && (
        <div className={styles.progressRow}>
          <div className={styles.progressTop}>
            <span className={styles.progressLabel}>Подход</span>
            <span className={styles.progressCount}>{state.setIndex + 1} / {totalSets}</span>
          </div>
          <div className={styles.setDots}>
            {Array.from({ length: totalSets }, (_, i) => (
              <div
                key={i}
                className={`${styles.setDot} ${
                  i < state.setIndex
                    ? styles.setDotDone
                    : i === state.setIndex
                      ? styles.setDotActive
                      : ''
                }`}
              />
            ))}
          </div>
        </div>
      )}
      {totalReps > 1 && (
        <div className={styles.progressRow}>
          <div className={styles.progressTop}>
            <span className={styles.progressLabel}>Повторение</span>
            <span className={styles.progressCount}>{state.repIndex + 1} / {totalReps}</span>
          </div>
          <div className={styles.setDots}>
            {Array.from({ length: totalReps }, (_, i) => (
              <div
                key={i}
                className={`${styles.setDot} ${
                  i < state.repIndex
                    ? styles.setDotDone
                    : i === state.repIndex
                      ? styles.setDotActive
                      : ''
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );

  if (isFullscreen) {
    return (
      <div className={`${styles.stage} ${styles.fullscreen}`}>
        <button
          className={styles.fsExitBtn}
          onClick={handleToggleFullscreen}
          aria-label="Выйти из полноэкранного режима"
          title="Выйти из полноэкранного режима (F)"
        >
          <Minimize size={24} />
        </button>
        <div className={styles.player} style={phaseStyle}>
          {/* Top: exercise name + description */}
          <div className={styles.header}>
            <div className={styles.exName}>{exercise.title}</div>
            {exercise.description && (
              <div className={styles.exDesc}>{exercise.description}</div>
            )}
          </div>

          {/* Middle: ring or compact bar depending on screen height */}
          <div className={styles.centerGroup}>
            {isCompact ? (
              <div className={styles.barView}>
                {phaseIndicator}
                <div className={state.phase === 'rest' ? styles.barNumRest : styles.barNum}>
                  {state.phase === 'exercise'
                    ? (exerciseHasTempo ? state.tempoSecondsLeft : state.repIndex + 1)
                    : state.restSecondsLeft}
                </div>
                <div className={styles.barLabel}>
                  {state.phase === 'exercise'
                    ? (exerciseHasTempo
                      ? 'СЕКУНД'
                      : pluralize(state.repIndex + 1, 'повторение', 'повторения', 'повторений'))
                    : 'СЕКУНД'}
                </div>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{
                      width: `${ringProgress * 100}%`,
                      transition: isRingResetting ? 'none' : 'width var(--duration-normal) ease',
                    }}
                  />
                </div>
              </div>
            ) : ringOnly}
          </div>

          {/* Bottom: progress */}
          <div className={styles.bottomSection}>
            {progressSection}
          </div>
        </div>
        {state.isPaused && (
          <button
            className={styles.pauseOverlay}
            onClick={actions.togglePause}
            aria-label="Продолжить"
          >
            <Play size={64} fill="currentColor" />
            <span className={styles.pauseOverlayLabel}>ПАУЗА</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={styles.stage}>
      <div className={styles.player} style={phaseStyle}>
        {/* Header: name + description (fixed height area) */}
        <div className={styles.header}>

          <div className={styles.exName}>{exercise.title}</div>
          {exercise.description && (
            <div className={styles.exDesc}>{exercise.description}</div>
          )}
        </div>

        {/* Phase + Ring or compact bar */}
        <div className={styles.centerGroup}>
          {isCompact ? (
            <div className={styles.barView}>
              {phaseIndicator}
              <div className={state.phase === 'rest' ? styles.barNumRest : styles.barNum}>
                {state.phase === 'exercise'
                  ? (exerciseHasTempo ? state.tempoSecondsLeft : state.repIndex + 1)
                  : state.restSecondsLeft}
              </div>
              <div className={styles.barLabel}>
                {state.phase === 'exercise'
                  ? (exerciseHasTempo
                    ? 'СЕКУНД'
                    : pluralize(state.repIndex + 1, 'повторение', 'повторения', 'повторений'))
                  : 'СЕКУНД'}
              </div>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{
                    width: `${ringProgress * 100}%`,
                    transition: isRingResetting ? 'none' : 'width var(--duration-normal) ease',
                  }}
                />
              </div>
            </div>
          ) : ringOnly}
        </div>

        <div className={styles.bottomSection}>
          {exerciseProgress}
          {progressSection}
          {playerControls}
        </div>
      </div>
    </div>
  );
}
