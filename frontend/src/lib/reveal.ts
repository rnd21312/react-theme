import type { CSSProperties } from 'react';

export type RevealVariant = 'up' | 'fade' | 'scale' | 'left' | 'right';

let observer: IntersectionObserver | null = null;

const getObserver = (): IntersectionObserver | null => {
  if (observer || typeof IntersectionObserver === 'undefined') return observer;

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.setAttribute('data-in', '');
        observer?.unobserve(entry.target);
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
  );

  return observer;
};

const observe = (node: HTMLElement | null) => {
  if (!node) return;

  const io = getObserver();
  if (!io) {
    node.setAttribute('data-in', '');
    return;
  }

  io.observe(node);
  return () => io.unobserve(node);
};

/**
 * Spread onto any element to reveal it when it scrolls into view.
 * `delay` (ms) staggers siblings; see stagger().
 */
export const reveal = (delay = 0, variant: RevealVariant = 'up') => ({
  'data-reveal': variant,
  style: delay > 0 ? ({ '--d': `${delay}ms` } as CSSProperties) : undefined,
  ref: observe,
});

/** Stagger for grid children: 0, 90, 180… capped so late items do not wait long. */
export const stagger = (index: number, step = 90, max = 5): number => Math.min(index, max) * step;

/** Delay style for the first-screen `.stz-intro` choreography. */
export const intro = (delay: number): CSSProperties => ({ '--d': `${delay}ms` }) as CSSProperties;
