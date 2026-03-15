import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { App } from './App';
import { useWorkoutStore } from './features/workout/store/workoutStore';
import type { Workout } from './features/workout/model/types';

// Mock sound cues
vi.mock('./shared/sound/SoundCue', () => ({
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
  warmup: vi.fn(),
}));

const workout: Workout = {
  id: 'w1',
  title: 'Test Workout',
  exercises: [
    { title: 'Push-ups', repeatCount: 10, setCount: 3, restSeconds: 30 },
    { title: 'Squats', repeatCount: 12, setCount: 2, restSeconds: 20 },
  ],
};

/** Put workout(s) into localStorage so App.loadFromStorage() picks them up */
function seedStorage(workouts: Workout[]) {
  localStorage.setItem('exercaise_workouts', JSON.stringify(workouts));
}

function renderApp(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <App />
    </MemoryRouter>,
  );
}

describe('App routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.removeItem('exercaise_workouts');
    useWorkoutStore.setState({
      workouts: [],
      playerExerciseIndex: null,
      startFromExerciseIndex: null,
      isFullscreen: false,
    });
  });

  it('shows placeholder on index route', () => {
    renderApp('/');
    expect(screen.getByText('Выберите тренировку')).toBeInTheDocument();
  });

  it('shows workout list sidebar on index route', () => {
    renderApp('/');
    expect(screen.getByText(/exerc/)).toBeInTheDocument();
    expect(screen.getByText('Импорт')).toBeInTheDocument();
  });

  it('renders exercise panel and start button for /workout/:id', () => {
    seedStorage([workout]);
    const { container } = renderApp('/workout/w1');

    // Title appears in both WorkoutList card and ExercisePanel — check the panel specifically
    const panelTitle = container.querySelector('[class*="epTitle"]');
    expect(panelTitle).toBeTruthy();
    expect(panelTitle!.textContent).toBe('Test Workout');
    expect(screen.getAllByText('Начать').length).toBeGreaterThanOrEqual(1);
  });

  it('shows exercise list for selected workout', () => {
    seedStorage([workout]);
    renderApp('/workout/w1');

    expect(screen.getByText('Push-ups')).toBeInTheDocument();
    expect(screen.getByText('Squats')).toBeInTheDocument();
  });

  it('renders nothing in exercise panel for invalid workout id', () => {
    seedStorage([workout]);
    const { container } = renderApp('/workout/nonexistent');

    // ExercisePanel returns null for missing workout — no panel title
    const panelTitle = container.querySelector('[class*="epTitle"]');
    expect(panelTitle).toBeNull();
  });

  it('renders WorkoutPlayer at /workout/:id/play', () => {
    seedStorage([workout]);
    const { container } = renderApp('/workout/w1/play');

    // Player stage is rendered (exercise name appears in both panel and player)
    const playerStage = container.querySelector('[class*="stage"]');
    expect(playerStage).toBeTruthy();
    expect(screen.getAllByText('Push-ups').length).toBeGreaterThanOrEqual(1);
  });

  it('shows "not found" in player for invalid workout id', () => {
    renderApp('/workout/invalid/play');

    expect(screen.getByText('Тренировка не найдена')).toBeInTheDocument();
  });

  it('loads workouts from storage on mount', () => {
    seedStorage([{ id: 'stored1', title: 'Stored Workout', exercises: [{ title: 'Ex', repeatCount: 10, setCount: 3, restSeconds: 30 }] }]);

    renderApp('/');

    expect(screen.getByText('Stored Workout')).toBeInTheDocument();
  });

  it('delete button removes workout and navigates home', () => {
    seedStorage([workout]);
    const { container } = renderApp('/workout/w1');

    const deleteBtn = container.querySelector('[aria-label="Удалить"]');
    expect(deleteBtn).toBeTruthy();

    fireEvent.click(deleteBtn!);

    expect(useWorkoutStore.getState().workouts).toHaveLength(0);
  });
});
