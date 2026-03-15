import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('applies variant class', () => {
    const { container } = render(<Button variant="secondary">Btn</Button>);
    expect(container.firstChild).toHaveClass('secondary');
  });

  it('applies size class', () => {
    const { container } = render(<Button size="lg">Btn</Button>);
    expect(container.firstChild).toHaveClass('lg');
  });

  it('applies fullWidth class', () => {
    const { container } = render(<Button fullWidth>Btn</Button>);
    expect(container.firstChild).toHaveClass('fullWidth');
  });

  it('applies default variant and size', () => {
    const { container } = render(<Button>Btn</Button>);
    expect(container.firstChild).toHaveClass('primary');
    expect(container.firstChild).toHaveClass('md');
  });

  it('merges custom className', () => {
    const { container } = render(<Button className="custom">Btn</Button>);
    expect(container.firstChild).toHaveClass('custom');
  });

  it('calls onClick handler', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('can be disabled', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('passes through native button props', () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });
});
