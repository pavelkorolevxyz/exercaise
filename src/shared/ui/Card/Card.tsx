import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Card.module.css';

interface CardProps extends HTMLAttributes<HTMLElement> {
  interactive?: boolean;
  active?: boolean;
  as?: 'div' | 'button';
  children: ReactNode;
}

export function Card({
  interactive = false,
  active = false,
  as: Tag = 'div',
  className,
  children,
  ...props
}: CardProps) {
  const cls = [
    styles.card,
    interactive && styles.interactive,
    active && styles.active,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag
      className={cls}
      {...(Tag === 'button' ? { type: 'button' } : {})}
      {...(props as Record<string, unknown>)}
    >
      {children}
    </Tag>
  );
}
