import type { ReactNode } from 'react';
import { Compass, Star } from 'lucide-react';
import type { ImageData } from '@/lib/types';
import { reveal } from '@/lib/reveal';

/* ---- Image ---- */

type ImgProps = {
  /** A WordPress image (with srcset) … */
  image?: ImageData | null;
  /** … or a plain URL (editorial defaults). */
  src?: string;
  alt?: string;
  className?: string;
  /** Above-the-fold images load eagerly; everything else is lazy. */
  eager?: boolean;
  sizes?: string;
};

const UNSPLASH_WIDTHS = [480, 768, 1200, 1800, 2400];

/** Unsplash resizes on the fly, so editorial defaults get a real srcset instead of one 2400px file. */
const unsplashSrcSet = (url: string): string | undefined => {
  if (!url.includes('images.unsplash.com') || !/[?&]w=\d+/.test(url)) return undefined;

  return UNSPLASH_WIDTHS.map((width) => `${url.replace(/([?&])w=\d+/, `$1w=${width}`)} ${width}w`).join(', ');
};

export const Img = ({ image, src, alt, className = '', eager = false, sizes }: ImgProps) => {
  const url = image?.url ?? src;
  if (!url) {
    // No picture yet: a branded block instead of a grey hole.
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-forest-soft via-forest to-forest-deep ${className}`} aria-hidden>
        <Compass className="h-10 w-10 text-gold/40" strokeWidth={1.25} />
      </div>
    );
  }

  const srcSet = image?.srcset || (image ? undefined : unsplashSrcSet(url));

  return (
    <img
      src={url}
      srcSet={srcSet}
      sizes={srcSet ? (sizes ?? '(min-width: 1024px) 33vw, 100vw') : undefined}
      width={image?.width || undefined}
      height={image?.height || undefined}
      alt={alt ?? image?.alt ?? ''}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={eager ? 'high' : undefined}
      referrerPolicy="no-referrer"
      className={className}
    />
  );
};

/* ---- Section headings ---- */

type EyebrowProps = { children: ReactNode; light?: boolean; centered?: boolean };

export const Eyebrow = ({ children, light = false, centered = false }: EyebrowProps) => (
  <div className={`mb-3 flex items-center gap-2 ${centered ? 'justify-center' : ''}`}>
    <span className="h-px w-6 bg-gold" />
    <span
      className={`text-xs font-semibold uppercase tracking-[0.25em] ${light ? 'text-gold' : 'text-forest'}`}
    >
      {children}
    </span>
    {centered && <span className="h-px w-6 bg-gold" />}
  </div>
);

type SectionHeaderProps = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  centered?: boolean;
  light?: boolean;
  /** Content aligned to the right on wide screens (links, arrows). */
  aside?: ReactNode;
};

export const SectionHeader = ({ eyebrow, title, subtitle, centered, light, aside }: SectionHeaderProps) => (
  <div
    {...reveal()}
    className={
      centered
        ? 'mx-auto mb-16 max-w-3xl text-center sm:mb-20'
        : 'mb-12 flex flex-col justify-between gap-6 sm:mb-16 md:flex-row md:items-end'
    }
  >
    <div className={centered ? '' : 'max-w-3xl'}>
      {eyebrow && (
        <Eyebrow light={light} centered={centered}>
          {eyebrow}
        </Eyebrow>
      )}
      {title && (
        <h2
          className={`font-serif-editorial text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl ${
            light ? 'text-white' : 'text-ink'
          }`}
        >
          {title}
        </h2>
      )}
      {subtitle && (
        <p
          className={`mt-3 max-w-xl text-base font-light sm:text-lg ${centered ? 'mx-auto' : ''} ${
            light ? 'text-white/70' : 'text-muted'
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
    {aside}
  </div>
);

/* ---- Rating ---- */

type StarsProps = { value: number; className?: string };

/** Filled gold stars (rounded to the nearest whole star). */
export const Stars = ({ value, className = 'h-4 w-4' }: StarsProps) => (
  <span className="flex items-center gap-1" role="img" aria-label={`${value} out of 5`}>
    {Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        aria-hidden
        className={`${className} ${i < Math.round(value) ? 'fill-gold text-gold' : 'text-mist'}`}
      />
    ))}
  </span>
);

/** Max-width content wrapper shared by every section. */
export const Container = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>
);

/** Initials avatar (reviewers have no photo). */
export const Initials = ({ name }: { name: string }) => {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <span
      aria-hidden
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-sand bg-forest text-sm font-semibold text-gold"
    >
      {letters}
    </span>
  );
};
