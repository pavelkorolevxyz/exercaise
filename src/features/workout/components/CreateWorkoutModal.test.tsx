import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CreateWorkoutModal } from './CreateWorkoutModal';
import { useWorkoutStore } from '../store/workoutStore';
import type { Workout } from '../model/types';

vi.mock('../model/surpriseWorkouts', () => ({
  pickRandomWorkout: vi.fn(() => mockSurpriseWorkout),
}));

const mockSurpriseWorkout: Workout = {
  id: 'surprise-1',
  title: 'Surprise Workout',
  exercises: [
    { title: 'Exercise 1', repeatCount: 10, setCount: 3, restSeconds: 30 },
  ],
};

describe('CreateWorkoutModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.removeItem('exercaise_workouts');
    useWorkoutStore.setState({ workouts: [] });
    vi.stubGlobal('open', vi.fn());
  });

  it('renders title "Создать тренировку"', () => {
    render(<CreateWorkoutModal onClose={vi.fn()} />);
    expect(screen.getByText('Создать тренировку')).toBeInTheDocument();
  });

  it('renders textarea with placeholder', () => {
    render(<CreateWorkoutModal onClose={vi.fn()} />);
    const textarea = screen.getByPlaceholderText(
      'Опишите тренировку, например: разминка для шеи и плеч на 10 минут',
    );
    expect(textarea).toBeInTheDocument();
    expect(textarea.tagName).toBe('TEXTAREA');
  });

  it('submit button is disabled when textarea is empty', () => {
    render(<CreateWorkoutModal onClose={vi.fn()} />);
    const submitButton = screen.getByRole('button', { name: /Создать в ChatGPT/ });
    expect(submitButton).toBeDisabled();
  });

  it('submit button becomes enabled after typing', () => {
    render(<CreateWorkoutModal onClose={vi.fn()} />);
    const textarea = screen.getByPlaceholderText(/Опишите тренировку/);
    fireEvent.change(textarea, { target: { value: 'разминка' } });
    const submitButton = screen.getByRole('button', { name: /Создать в ChatGPT/ });
    expect(submitButton).not.toBeDisabled();
  });

  it('clicking submit opens window.open with correct URL and calls onClose', () => {
    const onClose = vi.fn();
    render(<CreateWorkoutModal onClose={onClose} />);

    const textarea = screen.getByPlaceholderText(/Опишите тренировку/);
    fireEvent.change(textarea, { target: { value: 'разминка для шеи' } });

    const submitButton = screen.getByRole('button', { name: /Создать в ChatGPT/ });
    fireEvent.click(submitButton);

    expect(window.open).toHaveBeenCalledTimes(1);
    const url = (window.open as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain('https://chatgpt.com/?q=');
    expect(url).toContain(encodeURIComponent('разминка для шеи'));
    expect(window.open).toHaveBeenCalledWith(
      expect.any(String),
      '_blank',
      'noopener,noreferrer',
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Enter key in textarea triggers submit when text present', () => {
    const onClose = vi.fn();
    render(<CreateWorkoutModal onClose={onClose} />);

    const textarea = screen.getByPlaceholderText(/Опишите тренировку/);
    fireEvent.change(textarea, { target: { value: 'тренировка' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

    expect(window.open).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Shift+Enter does NOT trigger submit', () => {
    const onClose = vi.fn();
    render(<CreateWorkoutModal onClose={onClose} />);

    const textarea = screen.getByPlaceholderText(/Опишите тренировку/);
    fireEvent.change(textarea, { target: { value: 'тренировка' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

    expect(window.open).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('empty textarea does not trigger submit on Enter', () => {
    const onClose = vi.fn();
    render(<CreateWorkoutModal onClose={onClose} />);

    const textarea = screen.getByPlaceholderText(/Опишите тренировку/);
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

    expect(window.open).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('clicking "Удиви меня" calls onSurprise with a workout', () => {
    const onSurprise = vi.fn();
    render(<CreateWorkoutModal onClose={vi.fn()} onSurprise={onSurprise} />);

    const surpriseButton = screen.getByRole('button', { name: /Удиви меня/ });
    fireEvent.click(surpriseButton);

    expect(onSurprise).toHaveBeenCalledTimes(1);
    expect(onSurprise).toHaveBeenCalledWith(mockSurpriseWorkout);
  });

  it('clicking "Отмена" calls onClose', () => {
    const onClose = vi.fn();
    render(<CreateWorkoutModal onClose={onClose} />);

    const cancelButton = screen.getByRole('button', { name: 'Отмена' });
    fireEvent.click(cancelButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('onSurprise is optional — no crash when not provided', () => {
    render(<CreateWorkoutModal onClose={vi.fn()} />);

    const surpriseButton = screen.getByRole('button', { name: /Удиви меня/ });
    expect(() => fireEvent.click(surpriseButton)).not.toThrow();
  });
});
