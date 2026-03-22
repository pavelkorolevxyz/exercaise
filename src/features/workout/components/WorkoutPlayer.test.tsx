import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import { fireEvent, render, screen } from '@testing-library/react';
import { WorkoutPlayer } from './WorkoutPlayer';
import { COMPLETION_PHRASES } from './completionPhrases';
import { useWorkoutStore } from '../store/workoutStore';
import type { Workout } from '../model/types';
import * as historyStorage from '../../../shared/storage/historyStorage';

// ── Mocked usePlayerState (for the original rerender-dedup test) ──

const mockUsePlayerState = vi.fn();

vi.mock('../model/usePlayerState', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;
  return {
    ...actual,
    usePlayerState: (...args: unknown[]) => mockUsePlayerState(...args),
  };
});

// ── Mock history storage ──

vi.mock('../../../shared/storage/historyStorage', () => ({
  upsertRecord: vi.fn(),
}));

// ── Mock sound cues ──

vi.mock('../../../shared/sound/SoundCue', () => ({
  repTick: vi.fn(),
  tempoPhase: vi.fn(),
  restStart: vi.fn(),
  exerciseStart: vi.fn(),
  workoutComplete: vi.fn(),
  cancelPending: vi.fn(),
  setComplete: vi.fn(),
  secondTick: vi.fn(),
  configure: vi.fn(),
  getSettings: vi.fn(() => ({ enabled: true, volume: 1.0, preset: 'classic' })),
}));

// ── Fixtures ──

const workout: Workout = {
  id: 'w1',
  title: 'Test workout',
  exercises: [
    { title: 'Push-ups', repeatCount: 10, setCount: 3, restSeconds: 30 },
    {
      title: 'Squats',
      description: 'A description for reading phase that is long enough to trigger reading',
      repeatCount: 12,
      setCount: 2,
      restSeconds: 20,
    },
  ],
};

// ── Helpers ──

function mockPlayerState(overrides: Record<string, unknown> = {}) {
  const defaults = {
    state: {
      phase: 'exercise',
      exerciseIndex: 0,
      setIndex: 0,
      repIndex: 0,
      tempoPhase: 'to',
      tempoSecondsLeft: 1,
      restSecondsLeft: 0,
      readingSecondsLeft: 0,
      countdownSecondsLeft: 0,
      isPaused: false,
    },
    currentExercise: workout.exercises[0],
    totalReps: 10,
    totalSets: 3,
    ringProgress: 0.4,
    tempoLabel: null,
    hasTempo: false,
    elapsedSecondsRef: { current: 0 },
    sessionStartRef: { current: '2026-03-22T10:00:00.000Z' },
    actions: {
      start: vi.fn(),
      stop: vi.fn(),
      startFromExercise: vi.fn(),
      togglePause: vi.fn(),
      skip: vi.fn(),
      prevExercise: vi.fn(),
      nextExercise: vi.fn(),
      prevSet: vi.fn(),
      nextSet: vi.fn(),
      goToExercise: vi.fn(),
    },
  };
  const merged = {
    ...defaults,
    ...overrides,
    state: { ...defaults.state, ...(overrides.state as Record<string, unknown> ?? {}) },
    actions: { ...defaults.actions, ...(overrides.actions as Record<string, unknown> ?? {}) },
  };
  mockUsePlayerState.mockReturnValue(merged);
  return merged;
}

function renderPlayer(path = '/workout/w1/play') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/workout/:id/play" element={<WorkoutPlayer />} />
        <Route path="/workout/:id" element={<div data-testid="ready-screen">Ready</div>} />
        <Route path="/" element={<div data-testid="home">Home</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('WorkoutPlayer', () => {
  beforeEach(() => {
    mockUsePlayerState.mockReset();
    useWorkoutStore.setState({
      workouts: [workout],
      playerExerciseIndex: null,
      startFromExerciseIndex: null,
      isFullscreen: false,
    });
  });

  // ── Original rerender-dedup test ──

  it('does not repeatedly jump to the same exercise on rerender', () => {
    const goToExercise = vi.fn();

    mockPlayerState({
      state: { exerciseIndex: 1 },
      currentExercise: workout.exercises[1],
      totalReps: 12,
      totalSets: 2,
      actions: { goToExercise },
    });

    const tree = (
      <MemoryRouter initialEntries={['/workout/w1/play?from=1']}>
        <Routes>
          <Route path="/workout/:id/play" element={<WorkoutPlayer />} />
        </Routes>
      </MemoryRouter>
    );

    const { rerender } = render(tree);
    rerender(tree);

    expect(goToExercise).not.toHaveBeenCalled();
  });

  // ── Not found ──

  it('shows "not found" for missing workout', () => {
    mockPlayerState();
    renderPlayer('/workout/missing/play');
    expect(screen.getByText('Тренировка не найдена')).toBeInTheDocument();
    expect(screen.getByText('Назад')).toBeInTheDocument();
  });

  // ── Exercise phase rendering ──

  it('renders exercise title during exercise phase', () => {
    mockPlayerState();
    renderPlayer();
    expect(screen.getByText('Push-ups')).toBeInTheDocument();
  });

  it('shows ВЫПОЛНЯЙ phase label when no tempo label', () => {
    mockPlayerState({ tempoLabel: null });
    renderPlayer();
    expect(screen.getByText('ВЫПОЛНЯЙ')).toBeInTheDocument();
  });

  it('shows tempo label in uppercase when provided', () => {
    mockPlayerState({ tempoLabel: 'Вперёд' });
    renderPlayer();
    expect(screen.getByText('ВПЕРЁД')).toBeInTheDocument();
  });

  it('shows sets and reps progress during exercise', () => {
    mockPlayerState();
    renderPlayer();
    expect(screen.getByText('Подход')).toBeInTheDocument();
    expect(screen.getByText(/1 \/ 3/)).toBeInTheDocument();
    expect(screen.getByText('Повторение')).toBeInTheDocument();
    expect(screen.getByText(/1 \/ 10/)).toBeInTheDocument();
  });

  it('hides sets row when totalSets is 1', () => {
    mockPlayerState({ totalSets: 1 });
    renderPlayer();
    expect(screen.queryByText('Подход')).not.toBeInTheDocument();
  });

  it('hides reps row when totalReps is 1', () => {
    mockPlayerState({ totalReps: 1 });
    renderPlayer();
    expect(screen.queryByText('Повторение')).not.toBeInTheDocument();
  });

  // ── Rest phase ──

  it('shows rest countdown in ring during rest phase', () => {
    mockPlayerState({ state: { phase: 'rest', restSecondsLeft: 15 } });
    renderPlayer();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('ОТДЫХ')).toBeInTheDocument();
  });

  // ── Reading phase ──

  it('shows reading screen with karaoke description', () => {
    mockPlayerState({
      state: { phase: 'reading', exerciseIndex: 1, readingSecondsLeft: 5 },
      currentExercise: workout.exercises[1],
    });
    const { container } = renderPlayer();
    expect(screen.getByText('Squats')).toBeInTheDocument();
    // Karaoke splits words into separate spans
    expect(document.body.textContent).toContain('A description for reading phase');

    // Each word is a separate span with staggered animation-delay
    const words = workout.exercises[1].description!.split(/\s+/);
    const spans = container.querySelectorAll<HTMLSpanElement>('[class*="karaokeWord"]');
    expect(spans).toHaveLength(words.length);
    // First word has a non-zero delay (not instant)
    const firstDelay = parseFloat(spans[0].style.animationDelay);
    expect(firstDelay).toBeGreaterThan(0);
    // Delays increase monotonically
    for (let i = 1; i < spans.length; i++) {
      const prev = parseFloat(spans[i - 1].style.animationDelay);
      const curr = parseFloat(spans[i].style.animationDelay);
      expect(curr).toBeGreaterThan(prev);
    }
  });

  it('pauses karaoke animation when isPaused is true', () => {
    mockPlayerState({
      state: { phase: 'reading', exerciseIndex: 1, readingSecondsLeft: 5, isPaused: true },
      currentExercise: workout.exercises[1],
    });
    const { container } = renderPlayer();
    const karaokeDiv = container.querySelector<HTMLDivElement>('[class*="readingKaraoke"]');
    expect(karaokeDiv!.style.getPropertyValue('--karaoke-play-state')).toBe('paused');
  });

  // ── Countdown phase ──

  it('shows countdown number on reading screen with exercise title', () => {
    mockPlayerState({
      state: { phase: 'countdown', exerciseIndex: 1, countdownSecondsLeft: 3 },
      currentExercise: workout.exercises[1],
    });
    const { container } = renderPlayer();
    expect(screen.getByText('Squats')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    const countdownNumber = container.querySelector('[class*="countdownNumber"]');
    expect(countdownNumber).toBeInTheDocument();
    // Uses the reading screen layout
    expect(container.querySelector('[class*="readingScreen"]')).toBeInTheDocument();
  });

  it('shows countdown number 1 before exercise starts', () => {
    mockPlayerState({
      state: { phase: 'countdown', exerciseIndex: 0, countdownSecondsLeft: 1 },
    });
    renderPlayer();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  // ── Complete phase ──

  it('shows completion screen with a motivational phrase', () => {
    mockPlayerState({ state: { phase: 'complete' } });
    const { container } = renderPlayer();
    const heroTitle = container.querySelector('.heroTitle');
    const heroSub = container.querySelector('.heroSub');
    expect(heroTitle).toBeInTheDocument();
    expect(heroSub).toBeInTheDocument();
    const match = COMPLETION_PHRASES.find(
      ([title, sub]) => title === heroTitle!.textContent && sub === heroSub!.textContent,
    );
    expect(match).toBeDefined();
  });

  // ── Keyboard hotkeys ──

  it('toggles pause on Space key', () => {
    const { actions } = mockPlayerState();
    renderPlayer();

    fireEvent.keyDown(window, { code: 'Space' });
    expect(actions.togglePause).toHaveBeenCalledTimes(1);
  });

  it('navigates next exercise on Shift+ArrowRight', () => {
    const { actions } = mockPlayerState();
    renderPlayer();

    fireEvent.keyDown(window, { code: 'ArrowRight', shiftKey: true });
    expect(actions.nextExercise).toHaveBeenCalledTimes(1);
  });

  it('navigates prev exercise on Shift+ArrowLeft', () => {
    const { actions } = mockPlayerState();
    renderPlayer();

    fireEvent.keyDown(window, { code: 'ArrowLeft', shiftKey: true });
    expect(actions.prevExercise).toHaveBeenCalledTimes(1);
  });

  it('navigates next set on ArrowRight', () => {
    const { actions } = mockPlayerState();
    renderPlayer();

    fireEvent.keyDown(window, { code: 'ArrowRight' });
    expect(actions.nextSet).toHaveBeenCalledTimes(1);
  });

  it('navigates prev set on ArrowLeft', () => {
    const { actions } = mockPlayerState();
    renderPlayer();

    fireEvent.keyDown(window, { code: 'ArrowLeft' });
    expect(actions.prevSet).toHaveBeenCalledTimes(1);
  });

  it('navigates back on Escape when not fullscreen', () => {
    mockPlayerState();
    renderPlayer();

    fireEvent.keyDown(window, { code: 'Escape' });
    expect(screen.getByTestId('ready-screen')).toBeInTheDocument();
  });

  it('does not handle Escape when fullscreen', () => {
    useWorkoutStore.setState({ isFullscreen: true });
    mockPlayerState();
    renderPlayer();

    fireEvent.keyDown(window, { code: 'Escape' });
    // Should still be on the player (not navigated away)
    expect(screen.queryByTestId('ready-screen')).not.toBeInTheDocument();
  });

  // ── Controls visibility ──

  it('shows controls when not fullscreen', () => {
    mockPlayerState();
    const { container } = renderPlayer();
    expect(container.querySelector('[class*="controls"]')).toBeTruthy();
  });

  it('hides controls when fullscreen', () => {
    useWorkoutStore.setState({ isFullscreen: true });
    mockPlayerState();
    const { container } = renderPlayer();
    expect(container.querySelector('[class*="controls"]')).toBeNull();
  });

  // ── Pause button UI ──

  it('shows paused style on main control when isPaused', () => {
    mockPlayerState({ state: { isPaused: true } });
    const { container } = renderPlayer();
    const ctrlMain = container.querySelector('[class*="ctrlMain"]');
    expect(ctrlMain?.className).toContain('ctrlPaused');
  });

  it('does not show paused style when not paused', () => {
    mockPlayerState({ state: { isPaused: false } });
    const { container } = renderPlayer();
    const ctrlMain = container.querySelector('[class*="ctrlMain"]');
    expect(ctrlMain?.className).not.toContain('ctrlPaused');
  });

  // ── Stop button ──

  it('clicking stop button navigates back', () => {
    mockPlayerState();
    const { container } = renderPlayer();
    const dangerBtn = container.querySelector('[class*="danger"]');
    expect(dangerBtn).toBeTruthy();

    fireEvent.click(dangerBtn!);
    expect(screen.getByTestId('ready-screen')).toBeInTheDocument();
  });

  // ── startFromExerciseIndex ──

  it('calls startFromExercise when startFromExerciseIndex is set', () => {
    useWorkoutStore.setState({ startFromExerciseIndex: 1 });
    const { actions } = mockPlayerState();
    renderPlayer();
    expect(actions.startFromExercise).toHaveBeenCalledWith(1);
  });

  it('calls start when no startFrom index', () => {
    const { actions } = mockPlayerState();
    renderPlayer();
    expect(actions.start).toHaveBeenCalled();
  });

  // ── ?from= query param ──

  it('calls startFromExercise with ?from= param', () => {
    const { actions } = mockPlayerState();
    renderPlayer('/workout/w1/play?from=1');
    expect(actions.startFromExercise).toHaveBeenCalledWith(1);
  });

  // ── History recording via tick interval ──

  it('calls upsertRecord after 1s when elapsed > 0', () => {
    vi.useFakeTimers();
    vi.mocked(historyStorage.upsertRecord).mockClear();
    const sessionStart = '2026-03-22T12:00:00.000Z';
    mockPlayerState({
      elapsedSecondsRef: { current: 5 },
      sessionStartRef: { current: sessionStart },
    });
    renderPlayer();

    vi.advanceTimersByTime(1000);
    expect(historyStorage.upsertRecord).toHaveBeenCalledTimes(1);
    const record = vi.mocked(historyStorage.upsertRecord).mock.calls[0][0];
    expect(record.workoutId).toBe('w1');
    expect(record.workoutTitle).toBe('Test workout');
    expect(record.durationSeconds).toBe(5);
    expect(record.completedAt).toBe(sessionStart);
    vi.useRealTimers();
  });

  it('does not call upsertRecord when elapsed is 0', () => {
    vi.useFakeTimers();
    vi.mocked(historyStorage.upsertRecord).mockClear();
    mockPlayerState({ elapsedSecondsRef: { current: 0 } });
    renderPlayer();

    vi.advanceTimersByTime(1000);
    expect(historyStorage.upsertRecord).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('does not call upsertRecord when sessionStart is empty', () => {
    vi.useFakeTimers();
    vi.mocked(historyStorage.upsertRecord).mockClear();
    mockPlayerState({
      elapsedSecondsRef: { current: 5 },
      sessionStartRef: { current: '' },
    });
    renderPlayer();

    vi.advanceTimersByTime(1000);
    expect(historyStorage.upsertRecord).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('skips upsert if elapsed unchanged since last save', () => {
    vi.useFakeTimers();
    vi.mocked(historyStorage.upsertRecord).mockClear();
    const ref = { current: 10 };
    mockPlayerState({ elapsedSecondsRef: ref });
    renderPlayer();

    vi.advanceTimersByTime(1000);
    expect(historyStorage.upsertRecord).toHaveBeenCalledTimes(1);

    // Same value — should not call again
    vi.advanceTimersByTime(1000);
    expect(historyStorage.upsertRecord).toHaveBeenCalledTimes(1);

    // Value changes — should call
    ref.current = 11;
    vi.advanceTimersByTime(1000);
    expect(historyStorage.upsertRecord).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('creates separate records when session changes (re-start)', () => {
    vi.useFakeTimers();
    vi.mocked(historyStorage.upsertRecord).mockClear();
    const sessionRef = { current: '2026-03-22T10:00:00.000Z' };
    const elapsedRef = { current: 5 };
    mockPlayerState({ elapsedSecondsRef: elapsedRef, sessionStartRef: sessionRef });
    renderPlayer();

    vi.advanceTimersByTime(1000);
    expect(historyStorage.upsertRecord).toHaveBeenCalledTimes(1);
    expect(vi.mocked(historyStorage.upsertRecord).mock.calls[0][0].completedAt).toBe('2026-03-22T10:00:00.000Z');

    // Simulate re-start: new session, elapsed reset
    sessionRef.current = '2026-03-22T10:05:00.000Z';
    elapsedRef.current = 3;
    vi.advanceTimersByTime(1000);
    expect(historyStorage.upsertRecord).toHaveBeenCalledTimes(2);
    expect(vi.mocked(historyStorage.upsertRecord).mock.calls[1][0].completedAt).toBe('2026-03-22T10:05:00.000Z');
    expect(vi.mocked(historyStorage.upsertRecord).mock.calls[1][0].durationSeconds).toBe(3);
    vi.useRealTimers();
  });
});
