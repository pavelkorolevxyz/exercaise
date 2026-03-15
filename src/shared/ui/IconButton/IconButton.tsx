import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './IconButton.module.css';

type IconButtonSize = 'sm' | 'md' | 'lg';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: IconButtonSize;
  danger?: boolean;
  children: ReactNode;
}

export function IconButton({
  size = 'md',
  danger = false,
  className,
  children,
  ...props
}: IconButtonProps) {
  const cls = [
    styles.iconButton,
    styles[size],
    danger && styles.danger,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}
