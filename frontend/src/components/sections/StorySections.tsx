import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  Headphones,
  MapPin,
  Quote,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { __, sprintf } from '@wordpress/i18n';
import type { Article, Rating, Review, SiteContent, TravelStyle } from '@/lib/types';
import { reveal, stagger } from '@/lib/reveal';
import { useSite } from '@/site/context';
import { Container, Eyebrow, Img, Initials, SectionHeader, Stars } from '../primitives';

/* ------------------------------------------------------------------ Why Suntourz */

const PILLAR_ICONS: Record<string, LucideIcon> = {
  compass: Compass,
  sparkles: Sparkles,
  sliders: SlidersHorizontal,
  'map-pin': MapPin,
  headphones: Headphones,
  shield: ShieldCheck,
};

export const WhySuntourz = ({ copy }: { copy: SiteContent['why'] }) => (
  <section id="why-us" className="bg-cream py-24 sm:py-32">
    <Container>
      <SectionHeader centered eyebrow={copy.eyebrow} title={copy.title} subtitle={copy.subtitle} />
      <div className="grid grid-cols-1 gap-8 sm:gap-10 md:grid-cols-2 lg:grid-cols-3">
        {copy.pillars.map((pillar, index) => {
          const Icon = PILLAR_ICONS[pillar.icon] ?? Compass;
          return (
            <div
              key={pillar.title}
              {...reveal(stagger(index))}
              className="group flex flex-col justify-between rounded-2xl border border-sand bg-white p-8 transition-all duration-500 hover:-translate-y-1 hover:border-gold/50 hover:shadow-xl"
            >
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-sand bg-cream text-forest transition-all duration-300 group-hover:bg-forest group-hover:text-gold">
                    <Icon className="h-5 w-5 stroke-[1.5]" aria-hidden />
                  </div>
                  <span className="font-mono text-xs font-medium tracking-wider text-muted-soft">{String(index + 1).padStart(2, '0')}</span>
                </div>
                <h3 className="font-serif-editorial mb-3 text-xl font-bold text-ink transition-colors group-hover:text-forest">{pillar.title}</h3>
                <p className="text-sm font-light leading-relaxed text-muted">{pillar.description}</p>
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-sand/60 pt-4 text-[11px] font-medium uppercase tracking-widest text-muted-soft">
                <span>{__('Suntourz Standard', 'suntourz')}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              </div>
            </div>
          );
        })}
      </div>
    </Container>
  </section>
);

/* -------------------------------------------------------------------- Experiences */

export const ExperiencesSection = ({ styles, copy }: { styles: TravelStyle[]; copy: SiteContent['experiences'] }) => {
  if (styles.length === 0) return null;

  return (
    <section id="experiences" className="border-t border-sand bg-sand-soft/40 py-20 sm:py-28">
      <Container>
        <SectionHeader
          {...copy}
          aside={
            <div className="hidden text-xs font-semibold uppercase tracking-widest text-muted-soft md:block">
              {sprintf(__('%d Signature Categories', 'suntourz'), styles.length)}
            </div>
          }
        />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {styles.map((style, index) => (
            <a
              key={style.id}
              href={style.url}
              {...reveal(stagger(index))}
              className="group relative flex h-80 flex-col justify-end overflow-hidden rounded-2xl border border-sand p-6 shadow-xs transition-all duration-500 hover:shadow-xl sm:h-96"
            >
              <Img image={style.image} alt={style.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10 transition-colors group-hover:from-black/90" />

              <div className="relative z-10 mb-auto flex items-center justify-between">
                {style.category ? (
                  <span className="rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-white/90 backdrop-blur-md">
                    {style.category}
                  </span>
                ) : (
                  <span />
                )}
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all duration-300 group-hover:bg-gold group-hover:text-forest">
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                </div>
              </div>

              <div className="relative z-10 text-white">
                {style.location && <span className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-gold">{style.location}</span>}
                <h3 className="font-serif-editorial mb-2 text-xl font-bold transition-colors group-hover:text-blush sm:text-2xl">{style.name}</h3>
                {style.description && <p className="line-clamp-2 text-xs font-light leading-relaxed text-white/80 sm:text-sm">{style.description}</p>}
                <div className="mt-3 flex items-center justify-between border-t border-white/20 pt-3 text-[10px] uppercase tracking-wider text-white/60">
                  <span>{style.duration}</span>
                  <span className="font-semibold text-gold">{__('View Journeys →', 'suntourz')}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </Container>
    </section>
  );
};

/* ------------------------------------------------------------------ Travel guide */

export const TravelGuideSection = ({ articles, copy }: { articles: Article[]; copy: SiteContent['guide'] }) => {
  const { data } = useSite();
  const lead = articles[0];
  if (!lead) return null;
  const rest = articles.slice(1);

  return (
    <section id="guide" className="border-t border-sand bg-sand-soft/50 py-20 sm:py-28">
      <Container>
        <SectionHeader
          {...copy}
          aside={
            <a href={data.site.blogUrl} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-forest hover:text-gold">
              <BookOpen className="h-4 w-4 text-gold" aria-hidden />
              <span>{copy.badge}</span>
            </a>
          }
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
          <a
            href={lead.url}
            {...reveal()}
            className="group flex flex-col overflow-hidden rounded-2xl border border-sand bg-white shadow-xs transition-all duration-500 hover:shadow-xl lg:sticky lg:top-28 lg:col-span-5"
          >
            <div>
              <div className="relative h-64 overflow-hidden sm:h-72">
                <Img image={lead.image} alt={lead.title} className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute left-4 top-4">
                  <span className="rounded-full border border-gold/40 bg-forest px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-xs">
                    {__('Featured Edition', 'suntourz')}
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 flex items-center gap-2 text-xs text-white">
                  <Clock className="h-3.5 w-3.5 text-gold" aria-hidden />
                  <span>{sprintf(__('%d min read', 'suntourz'), lead.read_minutes)}</span>
                </div>
              </div>
              <div className="p-6 sm:p-8">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-gold">{lead.category}</span>
                <h3 className="font-serif-editorial text-2xl font-bold leading-snug text-ink transition-colors group-hover:text-forest sm:text-3xl">{lead.title}</h3>
                <p className="mt-3 text-sm font-light leading-relaxed text-muted">{lead.excerpt}</p>
              </div>
            </div>
            <div className="p-6 pt-0 sm:p-8 sm:pt-0">
              <div className="flex items-center justify-between border-t border-sand pt-4 text-xs">
                <span className="font-medium text-muted-soft">{lead.author}</span>
                <span className="flex items-center gap-1 font-semibold text-forest transition-transform group-hover:translate-x-1">
                  {__('Read Guide', 'suntourz')} <ArrowRight className="h-3.5 w-3.5 text-gold" aria-hidden />
                </span>
              </div>
            </div>
          </a>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:col-span-7">
            {rest.map((article, index) => (
              <a
                key={article.id}
                href={article.url}
                {...reveal(stagger(index))}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-sand bg-white shadow-xs transition-all duration-300 hover:shadow-lg"
              >
                <div>
                  <div className="relative h-44 overflow-hidden">
                    <Img image={article.image} alt={article.title} className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    <div className="absolute left-3 top-3">
                      <span className="rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-forest backdrop-blur-xs">{article.category}</span>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="mb-1.5 flex items-center gap-1 text-[11px] text-muted-soft">
                      <Clock className="h-3 w-3" aria-hidden />
                      <span>{sprintf(__('%d min read', 'suntourz'), article.read_minutes)}</span>
                    </div>
                    <h3 className="font-serif-editorial line-clamp-2 text-lg font-bold leading-snug text-ink transition-colors group-hover:text-forest">{article.title}</h3>
                    <p className="mt-2 line-clamp-2 text-xs font-light leading-relaxed text-muted">{article.excerpt}</p>
                  </div>
                </div>
                <div className="p-5 pt-0">
                  <div className="flex items-center justify-between border-t border-sand/70 pt-3 text-[11px]">
                    <span className="max-w-[130px] truncate text-muted-soft">{article.author.split(',')[0]}</span>
                    <span className="flex items-center gap-1 font-semibold text-forest transition-transform group-hover:translate-x-0.5">
                      {__('Read', 'suntourz')} <ArrowRight className="h-3 w-3 text-gold" aria-hidden />
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
};

/* ----------------------------------------------------------------------- Reviews */

type Testimonial = {
  id: string;
  name: string;
  country: string;
  tour: string;
  tourUrl?: string;
  rating: number;
  review: string;
  avatar?: string;
  date: string;
  verified: boolean;
};

type LovedProps = { copy: SiteContent['reviews']; reviews: Review[]; overall: Rating };

export const LovedByTravelers = ({ copy, reviews, overall }: LovedProps) => {
  // Real approved reviews win; the curated testimonials only fill in until there are at least two.
  const real = reviews.length >= 2;
  const items: Testimonial[] = real
    ? reviews.map((r) => ({
        id: `r${r.id}`,
        name: r.name,
        country: r.country,
        tour: r.tour.title,
        tourUrl: r.tour.url,
        rating: r.rating,
        review: r.review,
        date: r.date,
        verified: r.verified,
      }))
    : copy.fallback.map((t) => ({ ...t, verified: true }));

  const stats =
    overall.count > 0
      ? [
          { value: `${overall.average.toFixed(2)} / 5.0`, label: __('Average Guest Rating', 'suntourz') },
          { value: String(overall.count), label: __('Guest Reviews', 'suntourz') },
          copy.stats[2] ?? { value: '', label: '' },
        ]
      : copy.stats;

  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  /** Index of the card closest to the centre of the carousel (phones only; on desktop it is a grid). */
  const syncActive = useCallback(() => {
    const el = track.current;
    if (!el || el.scrollWidth <= el.clientWidth + 2) return;
    const centre = el.scrollLeft + el.clientWidth / 2;
    let best = 0;
    let distance = Infinity;
    Array.from(el.children).forEach((child, index) => {
      const card = child as HTMLElement;
      const delta = Math.abs(card.offsetLeft + card.offsetWidth / 2 - centre);
      if (delta < distance) {
        distance = delta;
        best = index;
      }
    });
    setActive(best);
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(syncActive);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('scroll', onScroll);
    };
  }, [syncActive]);

  const go = (index: number) => {
    const el = track.current;
    const card = el?.children[Math.max(0, Math.min(items.length - 1, index))] as HTMLElement | undefined;
    if (!el || !card) return;
    el.scrollTo({ left: card.offsetLeft - (el.clientWidth - card.offsetWidth) / 2, behavior: 'smooth' });
  };

  const arrow =
    'flex h-10 w-10 items-center justify-center rounded-full border border-sand bg-white text-forest shadow-xs transition-all duration-300 hover:border-gold hover:bg-forest hover:text-gold disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-forest';

  return (
    <section id="reviews" className="overflow-hidden bg-cream py-24 sm:py-32">
      <Container>
        <SectionHeader centered eyebrow={copy.eyebrow} title={copy.title} subtitle={copy.subtitle} />

        {/* Phones: swipeable carousel. md and up: two-column grid. */}
        <div
          ref={track}
          tabIndex={0}
          aria-label={__('Guest reviews', 'suntourz')}
          className="stz-snap no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-2 md:gap-8 md:overflow-visible md:px-0 md:pb-0"
        >
          {items.map((t, index) => (
            <figure
              key={t.id}
              {...reveal(stagger(index))}
              className="relative flex w-[86%] shrink-0 flex-col justify-between rounded-2xl border border-sand bg-white p-6 shadow-xs transition-all duration-500 hover:-translate-y-1 hover:shadow-lg sm:w-[70%] sm:p-8 md:w-auto"
            >
              <div>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-2 sm:mb-6">
                  <Stars value={t.rating} />
                  {t.tour && (
                    <span className="rounded-full border border-sand bg-cream px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-forest">
                      {t.tourUrl ? <a href={t.tourUrl}>{t.tour}</a> : t.tour}
                    </span>
                  )}
                </div>
                <blockquote className="font-serif-editorial mb-6 text-base font-normal italic leading-relaxed text-ink sm:text-lg">
                  <Quote className="mb-2 h-5 w-5 text-gold/60" aria-hidden />“{t.review}”
                </blockquote>
              </div>
              <figcaption className="flex items-center justify-between gap-3 border-t border-sand pt-5 sm:pt-6">
                <div className="flex min-w-0 items-center gap-3">
                  {t.avatar ? (
                    <Img src={t.avatar} alt="" className="h-11 w-11 rounded-full border border-sand object-cover" />
                  ) : (
                    <Initials name={t.name} />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-ink">
                      <span className="truncate">{t.name}</span>
                      {t.verified && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-forest" aria-label={__('Verified guest', 'suntourz')} />}
                    </div>
                    <p className="truncate text-xs text-muted-soft">{t.country}</p>
                  </div>
                </div>
                <span className="shrink-0 font-mono text-[10px] text-muted-soft">{t.date}</span>
              </figcaption>
            </figure>
          ))}
        </div>

        {items.length > 1 && (
          <div className="mt-6 flex items-center justify-center gap-4 md:hidden">
            <button type="button" onClick={() => go(active - 1)} disabled={active === 0} aria-label={__('Previous review', 'suntourz')} className={arrow}>
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <div className="flex items-center gap-2" role="tablist" aria-label={__('Choose a review', 'suntourz')}>
              {items.map((t, index) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={index === active}
                  aria-label={sprintf(__('Review %d', 'suntourz'), index + 1)}
                  onClick={() => go(index)}
                  className={`h-2 rounded-full transition-all duration-500 ${index === active ? 'w-6 bg-forest' : 'w-2 bg-sand hover:bg-mist'}`}
                />
              ))}
            </div>
            <button type="button" onClick={() => go(active + 1)} disabled={active === items.length - 1} aria-label={__('Next review', 'suntourz')} className={arrow}>
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        )}

        <div {...reveal()} className="mt-14 grid grid-cols-1 gap-8 border-t border-sand pt-10 text-center sm:mt-16 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-16">
          {stats.map((stat, index) => (
            <div key={stat.label} className="flex items-center justify-center gap-8 sm:gap-16">
              {index > 0 && <div className="hidden h-10 w-px bg-sand sm:block" />}
              <div>
                <span className="font-serif-editorial block text-2xl font-bold text-forest sm:text-3xl">{stat.value}</span>
                <span className="text-xs uppercase tracking-widest text-muted-soft">{stat.label}</span>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

/* ------------------------------------------------------------------------ Gallery */

/**
 * Pinned horizontal gallery: while the section is on screen, vertical scrolling slides the photos
 * to the left. When the last photo is reached the section lets go and the page continues.
 * With reduced motion it is a plain swipeable row instead.
 */
export const VisualJourney = ({ copy }: { copy: SiteContent['gallery'] }) => {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const distance = useRef(0);
  const [travel, setTravel] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  /** Slides the track to the scroll position; no React state, so scrolling stays smooth. */
  const paint = useCallback(() => {
    const el = section.current;
    const strip = track.current;
    if (!el || !strip || distance.current <= 0) return;

    const progress = Math.min(1, Math.max(0, -el.getBoundingClientRect().top / distance.current));
    strip.style.transform = `translate3d(${-progress * distance.current}px,0,0)`;
    if (bar.current) bar.current.style.transform = `scaleX(${progress})`;
  }, []);

  useEffect(() => {
    const strip = track.current;
    if (!strip || reduced) {
      distance.current = 0;
      setTravel(0);
      if (strip) strip.style.transform = '';
      return;
    }

    const measure = () => {
      const next = Math.max(0, Math.round(strip.scrollWidth - window.innerWidth));
      distance.current = next;
      setTravel(next);
      paint();
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(strip);
    window.addEventListener('resize', measure);

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(paint);
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', onScroll);
    };
  }, [paint, reduced, copy.items.length]);

  const pinned = travel > 0 && !reduced;

  /** Arrows move the page by about one photo, which in turn slides the gallery. */
  const step = (direction: -1 | 1) => {
    const el = section.current;
    if (!el) return;

    if (!pinned) {
      track.current?.parentElement?.scrollBy({ left: direction * 400, behavior: 'smooth' });
      return;
    }

    const top = el.getBoundingClientRect().top + window.scrollY;
    const current = Math.min(distance.current, Math.max(0, window.scrollY - top));
    const target = Math.min(distance.current, Math.max(0, current + direction * 420));
    window.scrollTo({ top: top + target, behavior: 'smooth' });
  };

  const arrow = 'flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white transition-colors hover:bg-white/15';

  return (
    <section
      id="gallery"
      ref={section}
      className="bg-forest text-white"
      style={pinned ? { height: `calc(100svh + ${travel}px)` } : undefined}
    >
      <div className={pinned ? 'sticky top-0 flex h-[100svh] flex-col justify-center overflow-clip pb-24 pt-24 sm:py-24' : 'overflow-hidden py-20 sm:py-28'}>
        <Container className="w-full mb-6 flex flex-col justify-between gap-6 sm:mb-10 md:flex-row md:items-end">
          <div>
            <Eyebrow light>{copy.eyebrow ?? ''}</Eyebrow>
            <h2 className="font-serif-editorial text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">{copy.title}</h2>
            <p className="mt-3 hidden max-w-xl text-base font-light text-white/70 sm:block sm:text-lg">{copy.subtitle}</p>
          </div>
          <div className="hidden items-center gap-3 sm:flex">
            <button type="button" onClick={() => step(-1)} aria-label={__('Scroll left in gallery', 'suntourz')} className={arrow}>
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button type="button" onClick={() => step(1)} aria-label={__('Scroll right in gallery', 'suntourz')} className={arrow}>
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </Container>

        <div className={pinned ? '' : 'stz-snap no-scrollbar overflow-x-auto scroll-smooth'} tabIndex={pinned ? undefined : 0} aria-label={__('Photo gallery', 'suntourz')}>
          <div ref={track} className="flex w-max gap-4 px-4 py-4 will-change-transform sm:gap-6 sm:px-8 lg:px-12">
            {copy.items.map((item) => (
              <figure key={item.title} className="group relative h-[22rem] w-72 shrink-0 overflow-hidden rounded-2xl border border-white/10 shadow-xl sm:h-[26rem] sm:w-[22rem]">
                <Img src={item.image} alt={item.title} className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/10 transition-colors group-hover:from-black/90" />
                <div className="absolute left-4 top-4">
                  <span className="rounded-full border border-white/20 bg-black/50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/90 backdrop-blur-md">{item.category}</span>
                </div>
                <figcaption className="absolute bottom-6 left-6 right-6 text-white">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-widest text-gold">{item.location}</span>
                  <span className="font-serif-editorial text-xl font-bold">{item.title}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>

        <Container className="w-full mt-6 sm:mt-8">
          {pinned && (
            <span className="mb-4 block h-px w-full overflow-hidden bg-white/15" aria-hidden>
              <span ref={bar} className="block h-full origin-left bg-gold" style={{ transform: 'scaleX(0)' }} />
            </span>
          )}
          <div className="flex items-center justify-between gap-4 text-xs text-white/50">
            <span>{pinned ? __('Keep scrolling to explore Thailand’s visual tapestry', 'suntourz') : __('Swipe or use the arrows to explore Thailand’s visual tapestry', 'suntourz')}</span>
            <div className="flex shrink-0 items-center gap-2">
              <Camera className="h-4 w-4 text-gold" aria-hidden />
              <span>{copy.footnote}</span>
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
};

/* --------------------------------------------------------------------- Final CTA */

export const FinalCTA = ({ copy }: { copy: SiteContent['final_cta'] }) => {
  const { data, openPlanTrip } = useSite();

  return (
    <section className="relative overflow-hidden py-28 sm:py-36">
      <div className="absolute inset-0 z-0">
        <Img src={copy.image} alt={copy.image_alt} sizes="100vw" className="h-full w-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest via-forest/70 to-forest/60" />
      </div>

      <div {...reveal(0, 'fade')} className="relative z-10 mx-auto max-w-4xl px-4 text-center text-white sm:px-6 lg:px-8">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-cream backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-gold" aria-hidden />
          <span className="text-[11px] font-semibold uppercase tracking-[0.25em]">{copy.eyebrow}</span>
        </div>

        <h2 className="font-serif-editorial text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
          {copy.title} <br />
          <span className="font-light italic text-blush">{copy.title_accent}</span>
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-base font-light leading-relaxed text-white/90 sm:text-xl">{copy.subtitle}</p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            type="button"
            onClick={() => openPlanTrip()}
            className="group flex w-full items-center justify-center gap-2 rounded-full bg-cream px-8 py-4 text-sm font-semibold tracking-wide text-forest shadow-xl transition-all duration-300 hover:bg-sand-soft hover:shadow-2xl sm:w-auto sm:text-base"
          >
            <span>{__('Plan My Trip', 'suntourz')}</span>
            <ArrowRight className="h-4 w-4 text-gold transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
          </button>
          <a
            href={data.site.toursUrl}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-8 py-4 text-sm font-semibold tracking-wide text-white backdrop-blur-md transition-all duration-300 hover:bg-white/20 sm:w-auto sm:text-base"
          >
            <Compass className="h-4 w-4 text-gold" aria-hidden />
            <span>{__('Explore Tours', 'suntourz')}</span>
          </a>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs font-medium uppercase tracking-widest text-white/70">
          {copy.cues.map((cue, index) => (
            <span key={cue} className="flex items-center gap-8">
              {index > 0 && <span aria-hidden>•</span>}
              {cue}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
