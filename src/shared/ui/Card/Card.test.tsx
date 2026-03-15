import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Card } from './Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders as div by default', () => {
    const { container } = render(<Card>Content</Card>);
    expect(container.firstChild!.nodeName).toBe('DIV');
  });

  it('renders as button when as="button"', () => {
    render(<Card as="button">Clickable</Card>);
    expect(screen.getByRole('button', { name: 'Clickable' })).toBeInTheDocument();
  });

  it('applies interactive class', () => {
    const { container } = render(<Card interactive>Content</Card>);
    expect(container.firstChild).toHaveClass('interactive');
  });

  it('applies active class', () => {
    const { container } = render(<Card active>Content</Card>);
    expect(container.firstChild).toHaveClass('active');
  });

  it('does not apply interactive/active classes by default', () => {
    const { container } = render(<Card>Content</Card>);
    expect(container.firstChild).not.toHaveClass('interactive');
    expect(container.firstChild).not.toHaveClass('active');
  });

  it('merges custom className', () => {
    const { container } = render(<Card className="custom">Content</Card>);
    expect(container.firstChild).toHaveClass('custom');
    expect(container.firstChild).toHaveClass('card');
  });

  it('handles click events', async () => {
    const onClick = vi.fn();
    render(<Card onClick={onClick}>Click</Card>);
    await userEvent.click(screen.getByText('Click'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
