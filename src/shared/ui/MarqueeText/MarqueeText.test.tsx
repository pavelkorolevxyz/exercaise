import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MarqueeText } from './MarqueeText';

// ResizeObserver mock
class MockResizeObserver {
  cb: ResizeObserverCallback;
  constructor(cb: ResizeObserverCallback) {
    this.cb = cb;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', MockResizeObserver);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('MarqueeText', () => {
  it('renders children text', () => {
    render(<MarqueeText>Hello World</MarqueeText>);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('applies custom className to container', () => {
    const { container } = render(<MarqueeText className="custom">Text</MarqueeText>);
    expect(container.firstChild).toHaveClass('custom');
  });

  it('does not scroll when text fits', () => {
    render(<MarqueeText>Short</MarqueeText>);
    const span = screen.getByText('Short');
    expect(span.className).not.toContain('scrolling');
  });
});
