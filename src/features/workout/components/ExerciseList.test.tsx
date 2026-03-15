import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExerciseList } from './ExerciseList';
import type { Exercise } from '../model/types';

const exercises: Exercise[] = [
  { title: 'Push-ups', repeatCount: 10, setCount: 3, restSeconds: 60, tempo: { to: 2, hold: 1, from: 2 } },
  { title: 'Squats', repeatCount: 15, setCount: 4, restSeconds: 0 },
  { title: 'Plank', repeatCount: 1, setCount: 2, restSeconds: 30, tempo: { to: 1, hold: 0, from: 1 } },
];

describe('ExerciseList', () => {
  it('renders all exercises', () => {
    render(<ExerciseList exercises={exercises} />);

    expect(screen.getByText('Push-ups')).toBeInTheDocument();
    expect(screen.getByText('Squats')).toBeInTheDocument();
    expect(screen.getByText('Plank')).toBeInTheDocument();
  });

  it('displays exercise parameters (sets x reps)', () => {
    render(<ExerciseList exercises={exercises} />);

    expect(screen.getByText('3×10')).toBeInTheDocument();
    expect(screen.getByText('4×15')).toBeInTheDocument();
  });

  it('displays rest seconds when > 0', () => {
    render(<ExerciseList exercises={exercises} />);

    expect(screen.getByText('60с')).toBeInTheDocument();
    expect(screen.getByText('30с')).toBeInTheDocument();
  });

  it('does not display rest seconds when 0', () => {
    render(<ExerciseList exercises={exercises} />);

    // Squats has restSeconds: 0, should not render "0с"
    expect(screen.queryByText('0с')).not.toBeInTheDocument();
  });

  it('displays tempo when present', () => {
    render(<ExerciseList exercises={exercises} />);

    expect(screen.getByText('2-1-2')).toBeInTheDocument();
    expect(screen.getByText('1-0-1')).toBeInTheDocument();
  });

  it('shows numbered indicators', () => {
    render(<ExerciseList exercises={exercises} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('highlights current exercise', () => {
    render(<ExerciseList exercises={exercises} currentIndex={1} />);

    // The current exercise number should have the numCurrent class
    const squatsNum = screen.getByText('2');
    expect(squatsNum).toHaveClass('numCurrent');
  });

  it('highlights completed exercise numbers with done style', () => {
    render(<ExerciseList exercises={exercises} currentIndex={2} />);

    // Completed exercises show numbers with numDone class
    expect(screen.getByText('1')).toHaveClass('numDone');
    expect(screen.getByText('2')).toHaveClass('numDone');
    // Current exercise should not have numDone
    expect(screen.getByText('3')).not.toHaveClass('numDone');
  });

  it('calls onExerciseClick when clicked', async () => {
    const onClick = vi.fn();
    render(<ExerciseList exercises={exercises} onExerciseClick={onClick} />);

    await userEvent.click(screen.getByText('Squats'));
    expect(onClick).toHaveBeenCalledWith(1);
  });

  it('does not crash without optional props', () => {
    render(<ExerciseList exercises={exercises} />);
    expect(screen.getByText('Push-ups')).toBeInTheDocument();
  });
});
