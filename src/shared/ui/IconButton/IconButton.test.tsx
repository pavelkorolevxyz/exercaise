import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('renders children', () => {
    render(<IconButton>X</IconButton>);
    expect(screen.getByRole('button', { name: 'X' })).toBeInTheDocument();
  });

  it('applies default size class', () => {
    const { container } = render(<IconButton>X</IconButton>);
    expect(container.firstChild).toHaveClass('md');
  });

  it('applies custom size', () => {
    const { container } = render(<IconButton size="lg">X</IconButton>);
    expect(container.firstChild).toHaveClass('lg');
  });

  it('applies danger class when danger=true', () => {
    const { container } = render(<IconButton danger>X</IconButton>);
    expect(container.firstChild).toHaveClass('danger');
  });

  it('does not apply danger class by default', () => {
    const { container } = render(<IconButton>X</IconButton>);
    expect(container.firstChild).not.toHaveClass('danger');
  });

  it('merges custom className', () => {
    const { container } = render(<IconButton className="extra">X</IconButton>);
    expect(container.firstChild).toHaveClass('extra');
  });

  it('calls onClick', async () => {
    const onClick = vi.fn();
    render(<IconButton onClick={onClick}>X</IconButton>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('can be disabled', () => {
    render(<IconButton disabled>X</IconButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
