import { useEffect, useRef, useState, ElementType } from 'react';

type RevealType = 'up' | 'down' | 'left' | 'right' | 'zoom' | 'fade';

interface RevealProps {
  children: React.ReactNode;
  /** Animation style applied to this element */
  type?: RevealType;
  /** Extra ms before the visible class is added (for manual stagger) */
  delay?: number;
  /** Render as this HTML tag instead of a wrapper div */
  as?: ElementType;
  className?: string;
  style?: React.CSSProperties;
  /** Apply reveal-stagger to children instead of a directional reveal */
  stagger?: boolean;
}

export default function Reveal({
  children,
  type = 'up',
  delay = 0,
  as: Tag = 'div',
  className = '',
  style,
  stagger = false,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        if (delay > 0) {
          setTimeout(() => setVisible(true), delay);
        } else {
          setVisible(true);
        }
        observer.unobserve(el);
      },
      { rootMargin: '0px 0px -48px 0px', threshold: 0.06 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  const revealClass = stagger ? 'reveal-stagger' : `reveal-${type}`;

  return (
    <Tag
      ref={ref as any}
      className={`${revealClass}${visible ? ' is-visible' : ''} ${className}`.trim()}
      style={style}
    >
      {children}
    </Tag>
  );
}
