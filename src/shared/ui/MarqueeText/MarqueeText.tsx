import { useEffect, useRef, useState, type ReactNode } from 'react';
import styles from './MarqueeText.module.css';

interface MarqueeTextProps {
  children: ReactNode;
  className?: string;
}

export function MarqueeText({ children, className }: MarqueeTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const text = textRef.current;
    if (!container || !text) return;

    const check = () => {
      const overflow = text.scrollWidth > container.clientWidth;
      setShouldScroll(overflow);
      if (overflow) {
        const distance = text.scrollWidth - container.clientWidth;
        container.style.setProperty('--marquee-offset', `${-distance}px`);
        // Scale duration with distance: ~40px/s
        container.style.setProperty('--marquee-duration', `${Math.max(3, distance / 40 + 2)}s`);
      }
    };

    check();
    const observer = new ResizeObserver(check);
    observer.observe(container);
    return () => observer.disconnect();
  }, [children]);

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${className || ''}`}
    >
      <span
        ref={textRef}
        className={`${styles.text} ${shouldScroll ? styles.scrolling : ''}`}
      >
        {children}
      </span>
    </div>
  );
}
