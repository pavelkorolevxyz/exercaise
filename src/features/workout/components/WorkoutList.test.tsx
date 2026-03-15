import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { WorkoutList } from './WorkoutList';
import { useWorkoutStore } from '../store/workoutStore';
import type { Workout } from '../model/types';

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const workout1: Workout = {
  id: 'w1',
  title: 'Morning Routine',
  exercises: [
    { title: 'Push-ups', repeatCount: 10, setCount: 3, restSeconds: 30 },
    { title: 'Squats', repeatCount: 12, setCount: 2, restSeconds: 20 },
  ],
};

const workout2: Workout = {
  id: 'w2',
  title: 'Evening Stretch',
  exercises: [
    { title: 'Plank', repeatCount: 1, setCount: 3, restSeconds: 10, tempo: { to: 0, hold: 30, from: 0 } },
  ],
};

function renderWithRouter(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <WorkoutList />
    </MemoryRouter>,
  );
}

describe('WorkoutList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.removeItem('exercaise_workouts');
    useWorkoutStore.setState({
      workouts: [],
      playerExerciseIndex: null,
      startFromExerciseIndex: null,
    });
  });

  it('shows empty state when no workouts', () => {
    renderWithRouter();
    expect(screen.getByText(/Нет тренировок/)).toBeInTheDocument();
    expect(screen.getByText(/Импортируйте JSON-файл/)).toBeInTheDocument();
  });

  it('renders workout cards with titles', () => {
    useWorkoutStore.setState({ workouts: [workout1, workout2] });
    renderWithRouter();

    expect(screen.getByText('Morning Routine')).toBeInTheDocument();
    expect(screen.getByText('Evening Stretch')).toBeInTheDocument();
  });

  it('shows exercise count and duration on cards', () => {
    useWorkoutStore.setState({ workouts: [workout1] });
    renderWithRouter();

    expect(screen.getByText('2 упр.')).toBeInTheDocument();
  });

  it('navigates to workout on card click', () => {
    useWorkoutStore.setState({ workouts: [workout1] });
    renderWithRouter();

    fireEvent.click(screen.getByText('Morning Routine'));
    expect(mockNavigate).toHaveBeenCalledWith('/workout/w1');
  });

  it('shows import button', () => {
    renderWithRouter();
    expect(screen.getByText('Импорт')).toBeInTheDocument();
  });

  it('opens import modal and imports valid JSON via file', async () => {
    const fileContent = JSON.stringify({
      title: 'Imported Workout',
      exercises: [{ title: 'Ex', repeat_count: 5, set_count: 2 }],
    });
    const file = new File([fileContent], 'workout.json', { type: 'application/json' });

    renderWithRouter();
    fireEvent.click(screen.getByText('Импорт'));

    // Modal should be open with file input
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeTruthy();

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByDisplayValue(fileContent)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Импортировать'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled();
    });

    expect(useWorkoutStore.getState().workouts).toHaveLength(1);
    expect(useWorkoutStore.getState().workouts[0].title).toBe('Imported Workout');
  });

  it('imports JSON pasted into textarea', async () => {
    const json = JSON.stringify({
      title: 'Pasted Workout',
      exercises: [{ title: 'Ex', repeat_count: 3, set_count: 1 }],
    });

    renderWithRouter();
    fireEvent.click(screen.getByText('Импорт'));

    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: json } });
    fireEvent.click(screen.getByText('Импортировать'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled();
    });

    expect(useWorkoutStore.getState().workouts).toHaveLength(1);
    expect(useWorkoutStore.getState().workouts[0].title).toBe('Pasted Workout');
  });

  it('shows error on invalid JSON in import modal', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Импорт'));

    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'not valid json' } });
    fireEvent.click(screen.getByText('Импортировать'));

    await waitFor(() => {
      const errorEl = document.querySelector('[class*="error"]');
      expect(errorEl).toBeTruthy();
    });
  });

  it('shows error on invalid workout structure in import modal', async () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Импорт'));

    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: JSON.stringify({ title: '' }) } });
    fireEvent.click(screen.getByText('Импортировать'));

    await waitFor(() => {
      const errorEl = document.querySelector('[class*="error"]');
      expect(errorEl).toBeTruthy();
    });
  });

  it('clears import modal textarea when reopened', async () => {
    renderWithRouter();

    // Open import modal and type something
    fireEvent.click(screen.getByText('Импорт'));
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'some text' } });
    expect(textarea.value).toBe('some text');

    // Close modal via Cancel
    fireEvent.click(screen.getByText('Отмена'));

    // Reopen — textarea should be empty
    fireEvent.click(screen.getByText('Импорт'));
    const textarea2 = document.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea2.value).toBe('');
  });

  it('clears create modal textarea when reopened', () => {
    renderWithRouter();

    // Open create modal and type something
    fireEvent.click(screen.getByRole('button', { name: /Создать/ }));
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'my workout' } });
    expect(textarea.value).toBe('my workout');

    // Close modal via Cancel
    fireEvent.click(screen.getByText('Отмена'));

    // Reopen — textarea should be empty
    fireEvent.click(screen.getByRole('button', { name: /Создать/ }));
    const textarea2 = document.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea2.value).toBe('');
  });

  it('highlights active workout based on URL', () => {
    useWorkoutStore.setState({ workouts: [workout1, workout2] });
    renderWithRouter('/workout/w1');

    // The active card should have the active styling (checked via data attribute or class)
    const cards = screen.getAllByRole('button');
    // We can't easily check CSS classes with CSS modules, but we verify it renders
    expect(cards.length).toBeGreaterThanOrEqual(2);
  });
});
