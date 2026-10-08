import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowRight, Calendar, ChevronDown, Clock, Compass, MapPin, Sparkles, Users } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import { intro } from '@/lib/reveal';
import { toQueryString } from '@/lib/publicApi';
import type { Destination, SiteContent } from '@/lib/types';
import { useSite } from '@/site/context';
import { Img } from '../primitives';

type HeroProps = { hero: SiteContent['hero']; destinations: Destination[] };

/** Duration choice → min/max days for the tours filter. */
const DURATIONS: Record<string, { min?: number; max?: number }> = {
  '5-7': { min: 5, max: 7 },
  '7-10': { min: 7, max: 10 },
  '10-14': { min: 10, max: 14 },
  '14+': { min: 14 },
};

/** Traveller choice → seats that must be free on the departure. */
const TRAVELERS: Record<string, number> = { '1': 1, '2': 2, '3-4': 4, '5+': 5 };

/** Next 12 months as { value: "2026-11", label: "November 2026" }. */
const upcomingMonths = (locale: string): { value: string; label: string }[] => {
  const now = new Date();

  return Array.from({ length: 12 }, (_, i) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1));
    return {
      value: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`,
      label: new Intl.DateTimeFormat(locale.replace('_', '-'), { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date),
    };
  });
};

type BarFieldProps = { id: string; label: string; icon: ReactNode; last?: boolean; grow?: boolean; children: ReactNode };

/** One cell of the search bar: icon, small label and a native select with its own chevron. */
const BarField = ({ id, label, icon, last = false, grow = false, children }: BarFieldProps) => (
  <div
    className={`group relative flex min-w-0 items-center gap-3 rounded-2xl px-3 py-2 transition-colors sm:px-4 sm:py-2.5 duration-300 hover:bg-sand-soft/80 lg:rounded-full lg:py-2 ${grow ? 'lg:flex-[1.35]' : 'lg:flex-1'} ${
      last ? '' : 'border-b border-sand/70 sm:border-b-0 lg:after:absolute lg:after:-right-px lg:after:top-1/4 lg:after:h-1/2 lg:after:w-px lg:after:bg-sand'
    }`}
  >
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest/5 text-forest transition-colors duration-300 group-hover:bg-forest group-hover:text-gold">
      {icon}
    </span>
    <div className="relative min-w-0 flex-1">
      <label htmlFor={id} className="block truncate text-[10px] font-bold uppercase tracking-widest text-muted-soft">{label}</label>
      {children}
      <ChevronDown className="pointer-events-none absolute bottom-0.5 right-0 h-4 w-4 text-muted-soft transition-transform duration-300 group-focus-within:rotate-180" aria-hidden />
    </div>
  </div>
);

const select = 'block w-full cursor-pointer appearance-none truncate bg-transparent pr-6 text-sm font-semibold text-ink focus:outline-none';

const TripPlannerBar = ({ destinations }: { destinations: Destination[] }) => {
  const { data } = useSite();
  const months = useMemo(() => upcomingMonths(data.site.locale), [data.site.locale]);
  const [destination, setDestination] = useState('');
  const [month, setMonth] = useState('');
  const [duration, setDuration] = useState('');
  const [travelers, setTravelers] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const query = toQueryString({
      destination,
      month,
      duration_min: DURATIONS[duration]?.min,
      duration_max: DURATIONS[duration]?.max,
      pax: TRAVELERS[travelers],
    });
    window.location.href = query ? `${data.site.toursUrl}?${query}` : data.site.toursUrl;
  };

  return (
    <form
      onSubmit={submit}
      aria-label={__('Find a tour', 'suntourz')}
      className="mx-auto w-full max-w-6xl rounded-[1.75rem] border border-white/50 bg-cream/95 p-2 text-ink shadow-[0_30px_80px_-20px_rgba(0,0,0,0.55)] backdrop-blur-xl lg:rounded-full lg:p-2.5"
    >
      <div className="grid grid-cols-1 gap-x-1 gap-y-0.5 sm:grid-cols-2 lg:flex lg:items-center lg:gap-0">
        <BarField id="stz-bar-dest" label={__('Where do you want to go?', 'suntourz')} icon={<MapPin className="h-4 w-4" aria-hidden />} grow>
          <select id="stz-bar-dest" value={destination} onChange={(e) => setDestination(e.target.value)} className={select}>
            <option value="">{__('All Thailand Highlights', 'suntourz')}</option>
            {destinations.map((d) => (
              <option key={d.id} value={d.slug}>{d.name}</option>
            ))}
          </select>
        </BarField>

        <BarField id="stz-bar-month" label={__('Travel dates', 'suntourz')} icon={<Calendar className="h-4 w-4" aria-hidden />}>
          <select id="stz-bar-month" value={month} onChange={(e) => setMonth(e.target.value)} className={select}>
            <option value="">{__('Any month', 'suntourz')}</option>
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </BarField>

        <BarField id="stz-bar-duration" label={__('Duration', 'suntourz')} icon={<Clock className="h-4 w-4" aria-hidden />}>
          <select id="stz-bar-duration" value={duration} onChange={(e) => setDuration(e.target.value)} className={select}>
            <option value="">{__('Any duration', 'suntourz')}</option>
            <option value="5-7">{__('5 – 7 Days (Short Escape)', 'suntourz')}</option>
            <option value="7-10">{__('7 – 10 Days (Recommended)', 'suntourz')}</option>
            <option value="10-14">{__('10 – 14 Days (Comprehensive)', 'suntourz')}</option>
            <option value="14+">{__('2+ Weeks (Grand Journey)', 'suntourz')}</option>
          </select>
        </BarField>

        <BarField id="stz-bar-pax" label={__('Travelers', 'suntourz')} icon={<Users className="h-4 w-4" aria-hidden />} last>
          <select id="stz-bar-pax" value={travelers} onChange={(e) => setTravelers(e.target.value)} className={select}>
            <option value="">{__('Any group size', 'suntourz')}</option>
            <option value="1">{__('1 Traveler (Solo)', 'suntourz')}</option>
            <option value="2">{__('2 Travelers (Couple)', 'suntourz')}</option>
            <option value="3-4">{__('Family (3 – 4 Guests)', 'suntourz')}</option>
            <option value="5+">{__('Private Group (5+ Guests)', 'suntourz')}</option>
          </select>
        </BarField>

        <button
          type="submit"
          className="stz-press group mt-1.5 flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-gold/40 bg-forest px-7 py-4 text-sm font-semibold tracking-wide text-white shadow-md hover:bg-forest-soft hover:shadow-lg sm:col-span-2 lg:mt-0 lg:ml-2 lg:rounded-full lg:py-3.5"
        >
          <span>{__('Find My Trip', 'suntourz')}</span>
          <ArrowRight className="h-4 w-4 text-gold transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
        </button>
      </div>
    </form>
  );
};

export const Hero = ({ hero, destinations }: HeroProps) => {
  const { data, openPlanTrip } = useSite();

  return (
    <section className="relative flex min-h-[100svh] flex-col justify-between overflow-hidden pb-6 pt-24 sm:pb-14 sm:pt-28">
      <div className="absolute inset-x-0 -top-[12%] z-0 h-[124%]">
        <div className="stz-parallax h-full w-full">
          <Img src={hero.image} alt={hero.image_alt} eager sizes="100vw" className="stz-kenburns h-full w-full object-cover object-center" />
        </div>
      </div>
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-forest/95 via-forest/40 to-black/60" />
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />

      <div className="relative z-10 mx-auto my-auto max-w-7xl px-4 pt-8 text-center sm:px-6 sm:pt-20 lg:px-8">
        <div style={intro(120)} className="stz-intro mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-cream backdrop-blur-md sm:mb-8">
          <Sparkles className="h-3.5 w-3.5 text-gold" aria-hidden />
          <span className="text-[11px] font-semibold uppercase tracking-[0.25em] sm:text-xs">{hero.eyebrow}</span>
        </div>

        <h1 style={intro(240)} className="stz-intro font-serif-editorial mx-auto max-w-5xl text-4xl font-bold leading-[1.08] tracking-tight text-white drop-shadow-sm sm:text-6xl md:text-7xl lg:text-8xl">
          {hero.title} <br className="hidden sm:inline" />
          <span className="font-light italic text-blush">{hero.title_accent}</span>
        </h1>

        <p style={intro(380)} className="stz-intro mx-auto mt-4 max-w-2xl text-base font-light leading-relaxed text-white/90 sm:mt-8 sm:text-xl md:text-2xl">{hero.subtitle}</p>

        <div style={intro(500)} className="stz-intro mt-6 grid grid-cols-2 items-center justify-center gap-3 sm:mt-10 sm:flex sm:flex-row sm:gap-4">
          <a
            href={data.site.toursUrl}
            className="stz-press group flex w-full items-center justify-center gap-2 rounded-full bg-cream px-4 py-3.5 text-sm font-semibold tracking-wide text-forest shadow-xl hover:bg-sand-soft hover:shadow-2xl sm:w-auto sm:px-8 sm:py-4 sm:text-base"
          >
            <span>{__('Explore Thailand', 'suntourz')}</span>
            <ArrowRight className="hidden h-4 w-4 text-gold transition-transform duration-300 group-hover:translate-x-1 sm:block" aria-hidden />
          </a>
          <button
            type="button"
            onClick={() => openPlanTrip()}
            className="stz-press flex w-full items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-3.5 text-sm font-semibold tracking-wide text-white backdrop-blur-md hover:bg-white/20 sm:w-auto sm:px-8 sm:py-4 sm:text-base"
          >
            <Compass className="h-4 w-4 text-gold" aria-hidden />
            <span>{__('Plan My Trip', 'suntourz')}</span>
          </button>
        </div>

        <div style={intro(620)} className="stz-intro mt-8 hidden items-center justify-center gap-8 text-xs font-medium uppercase tracking-widest text-white/75 sm:mt-12 md:flex">
          {hero.cues.map((cue) => (
            <span key={cue} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              {cue}
            </span>
          ))}
        </div>
      </div>

      <div style={intro(760)} className="stz-intro relative z-20 mt-6 px-4 sm:mt-10 sm:px-6 lg:px-8">
        <TripPlannerBar destinations={destinations} />
      </div>
    </section>
  );
};
