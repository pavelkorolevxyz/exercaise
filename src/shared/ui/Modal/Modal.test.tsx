import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalActions } from './Modal';

describe('Modal', () => {
  it('returns null when open is false', () => {
    const { container } = render(
      <Modal open={false} onClose={vi.fn()}>
        <p>Content</p>
      </Modal>,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders children when open is true', () => {
    render(
      <Modal open={true} onClose={vi.fn()}>
        <p>Hello modal</p>
      </Modal>,
    );
    expect(screen.getByText('Hello modal')).toBeInTheDocument();
  });

  it('has role="dialog" and aria-modal="true"', () => {
    render(
      <Modal open={true} onClose={vi.fn()}>
        <p>Content</p>
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    render(
      <Modal open={true} onClose={onClose}>
        <p>Content</p>
      </Modal>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when overlay is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal open={true} onClose={onClose}>
        <p>Content</p>
      </Modal>,
    );
    const overlay = screen.getByRole('dialog').parentElement!;
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does NOT call onClose when inner content is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal open={true} onClose={onClose}>
        <p>Inner content</p>
      </Modal>,
    );
    fireEvent.click(screen.getByText('Inner content'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('traps focus: Tab from last focusable element wraps to first', () => {
    render(
      <Modal open={true} onClose={vi.fn()}>
        <button>First</button>
        <button>Last</button>
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    const lastBtn = screen.getByText('Last');
    lastBtn.focus();
    expect(document.activeElement).toBe(lastBtn);

    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(document.activeElement).toBe(screen.getByText('First'));
  });

  it('traps focus: Shift+Tab from first focusable element wraps to last', () => {
    render(
      <Modal open={true} onClose={vi.fn()}>
        <button>First</button>
        <button>Last</button>
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    const firstBtn = screen.getByText('First');
    firstBtn.focus();
    expect(document.activeElement).toBe(firstBtn);

    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(screen.getByText('Last'));
  });

  it('focus trap does nothing when there are no focusable elements', () => {
    render(
      <Modal open={true} onClose={vi.fn()}>
        <p>No focusable elements here</p>
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    // Should not throw
    fireEvent.keyDown(dialog, { key: 'Tab' });
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
  });

  it('applies tall class when tall prop is true', () => {
    render(
      <Modal open={true} onClose={vi.fn()} tall>
        <p>Content</p>
      </Modal>,
    );
    expect(screen.getByRole('dialog')).toHaveClass('tall');
  });

  it('applies wide class when size="wide"', () => {
    render(
      <Modal open={true} onClose={vi.fn()} size="wide">
        <p>Content</p>
      </Modal>,
    );
    expect(screen.getByRole('dialog')).toHaveClass('wide');
  });
});

describe('ModalHeader', () => {
  it('renders children', () => {
    render(<ModalHeader><span>Header content</span></ModalHeader>);
    expect(screen.getByText('Header content')).toBeInTheDocument();
  });
});

describe('ModalTitle', () => {
  it('renders children', () => {
    render(<ModalTitle>My Title</ModalTitle>);
    expect(screen.getByText('My Title')).toBeInTheDocument();
  });
});

describe('ModalBody', () => {
  it('renders children', () => {
    render(<ModalBody><p>Body text</p></ModalBody>);
    expect(screen.getByText('Body text')).toBeInTheDocument();
  });
});

describe('ModalActions', () => {
  it('renders children', () => {
    render(
      <ModalActions>
        <button>Save</button>
        <button>Cancel</button>
      </ModalActions>,
    );
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });
});
