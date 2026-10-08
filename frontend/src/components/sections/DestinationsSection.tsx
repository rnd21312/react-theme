import { useState } from 'react';
import { ArrowRight, Calendar, Clock, Sparkles, X } from 'lucide-react';
import { __, sprintf } from '@wordpress/i18n';
import { reveal, stagger } from '@/lib/reveal';
import type { Destination, SiteContent } from '@/lib/types';
import { useSite } from '@/site/context';
import { Modal } from '../overlays/Modal';
import { Container, Img, SectionHeader } from '../primitives';

/** Editorial mosaic: the card at each position of a 6-card pattern. */
const SLOTS = [
  { span: 'lg:col-span-7', height: 'h-[380px] sm:h-[460px]', label: '' },
  { span: 'lg:col-span-5', height: 'h-[380px] sm:h-[460px]', label: '' },
  { span: 'lg:col-span-4', height: 'h-[320px] sm:h-[360px]', label: '' },
  { span: 'lg:col-span-4', height: 'h-[320px] sm:h-[360px]', label: '' },
  { span: 'lg:col-span-4', height: 'h-[320px] sm:h-[360px]', label: '' },
  { span: 'lg:col-span-12', height: 'h-[280px] sm:h-[340px]', label: '' },
] as const;

type CardProps = { destination: Destination; slot: number; onOpen: () => void };

const DestinationCard = ({ destination, slot, onOpen }: CardProps) => {
  const layout = SLOTS[slot % SLOTS.length]!;
  const large = slot % SLOTS.length < 2;
  const panoramic = slot % SLOTS.length === 5;

  return (
    <button
      type="button"
      onClick={onOpen}
      {...reveal(stagger(slot), 'scale')}
      aria-label={sprintf(__('Explore %s', 'suntourz'), destination.name)}
      className={`group relative overflow-hidden rounded-2xl text-left shadow-md transition-all duration-700 hover:shadow-2xl ${layout.span} ${layout.height}`}
    >
      <Img
        image={destination.image}
        alt={destination.name}
        className={`h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105 ${panoramic ? 'absolute inset-0' : ''}`}
      />
      <div
        className={`absolute inset-0 ${
          panoramic
            ? 'bg-gradient-to-t from-black/90 via-black/40 to-transparent sm:bg-gradient-to-r sm:from-black/85 sm:via-black/35 sm:to-transparent'
            : 'bg-gradient-to-t from-black/85 via-black/35 to-black/10'
        }`}
      />

      {(large || panoramic) && destination.vibe && (
        <div className="absolute right-5 top-5 z-10">
          <span className="rounded-full border border-white/30 bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md">
            {destination.vibe}
          </span>
        </div>
      )}

      <div className={`z-10 text-white ${panoramic ? 'relative flex h-full max-w-2xl flex-col justify-end p-6 sm:p-8' : 'absolute bottom-6 left-6 right-6'}`}>
        {destination.eyebrow && (
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">{destination.eyebrow}</span>
        )}
        <h3 className={`font-serif-editorial mb-1.5 mt-1 font-bold ${large ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'}`}>{destination.name}</h3>
        {destination.tagline && (
          <p className={`font-light leading-relaxed text-white/90 ${large || panoramic ? 'max-w-xl text-sm sm:text-base' : 'line-clamp-2 text-xs sm:text-sm'}`}>
            {destination.tagline}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-white/20 pt-3 text-xs">
          {slot % SLOTS.length === 0 ? (
            <div className="flex flex-wrap gap-2">
              {destination.highlights.slice(0, 2).map((highlight) => (
                <span key={highlight} className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] text-white/80 backdrop-blur-xs">
                  {highlight}
                </span>
              ))}
            </div>
          ) : slot % SLOTS.length === 1 ? (
            destination.best_season && <span className="text-white/80">{__('Best:', 'suntourz')} {destination.best_season}</span>
          ) : (
            destination.ideal_stay && <span className="text-white/75">{destination.ideal_stay}</span>
          )}
          <span className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider text-gold transition-transform group-hover:translate-x-1">
            <span>{large ? __('Explore Tours', 'suntourz') : __('View', 'suntourz')}</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </span>
        </div>
      </div>
    </button>
  );
};

const DestinationModal = ({ destination, onClose }: { destination: Destination; onClose: () => void }) => {
  const { openPlanTrip } = useSite();

  return (
    <Modal onClose={onClose} label={destination.name} className="max-w-2xl">
      <div className="overflow-hidden rounded-3xl border border-sand bg-cream shadow-2xl">
        <div className="relative h-64 w-full">
          <Img image={destination.image} alt={destination.name} eager className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <button type="button" onClick={onClose} aria-label={__('Close destination modal', 'suntourz')} className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60">
            <X className="h-5 w-5" aria-hidden />
          </button>
          <div className="absolute bottom-6 left-6 right-6 text-white">
            {destination.vibe && <span className="mb-2 inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest backdrop-blur-xs">{destination.vibe}</span>}
            <h2 className="font-serif-editorial text-3xl font-bold">{destination.name}</h2>
            {destination.tagline && <p className="mt-1 text-xs font-light text-white/90 sm:text-sm">{destination.tagline}</p>}
          </div>
        </div>

        <div className="space-y-6 p-6 sm:p-8">
          {destination.description && <p className="text-sm font-light leading-relaxed text-muted">{destination.description}</p>}

          {(destination.best_season || destination.ideal_stay) && (
            <div className="grid grid-cols-2 gap-4 text-xs">
              {destination.best_season && (
                <div className="rounded-xl border border-sand bg-white p-3.5">
                  <div className="mb-1 flex items-center gap-1.5 font-semibold text-forest"><Calendar className="h-3.5 w-3.5 text-gold" aria-hidden /><span>{__('Best Season', 'suntourz')}</span></div>
                  <span className="text-muted">{destination.best_season}</span>
                </div>
              )}
              {destination.ideal_stay && (
                <div className="rounded-xl border border-sand bg-white p-3.5">
                  <div className="mb-1 flex items-center gap-1.5 font-semibold text-forest"><Clock className="h-3.5 w-3.5 text-gold" aria-hidden /><span>{__('Ideal Duration', 'suntourz')}</span></div>
                  <span className="text-muted">{destination.ideal_stay}</span>
                </div>
              )}
            </div>
          )}

          {destination.highlights.length > 0 && (
            <div>
              <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-forest">{__('Curated Highlights', 'suntourz')}</h3>
              <div className="flex flex-wrap gap-2">
                {destination.highlights.map((highlight) => (
                  <span key={highlight} className="rounded-full border border-sand bg-white px-3 py-1.5 text-xs text-ink">{highlight}</span>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-sand pt-4 sm:flex-row">
            <a href={destination.url} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-forest py-3 text-xs font-semibold uppercase tracking-wider text-white hover:bg-forest-soft">
              <span>{sprintf(__('View %s Tours', 'suntourz'), destination.name)}</span>
              <ArrowRight className="h-4 w-4 text-gold" aria-hidden />
            </a>
            <button
              type="button"
              onClick={() => {
                onClose();
                openPlanTrip({ destination: destination.name });
              }}
              className="flex items-center justify-center gap-2 rounded-full border border-forest/30 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-forest hover:bg-white"
            >
              <Sparkles className="h-3.5 w-3.5 text-gold" aria-hidden />
              {__('Custom Plan', 'suntourz')}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

type DestinationsSectionProps = { destinations: Destination[]; copy: SiteContent['destinations'] };

export const DestinationsSection = ({ destinations, copy }: DestinationsSectionProps) => {
  const [selected, setSelected] = useState<Destination | null>(null);
  const shown = destinations.slice(0, 6);
  if (shown.length === 0) return null;

  return (
    <section id="destinations" className="border-y border-sand bg-sand-soft/60 py-20 sm:py-28">
      <Container>
        <SectionHeader {...copy} />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-12">
          {shown.map((destination, index) => (
            <DestinationCard key={destination.id} destination={destination} slot={index} onOpen={() => setSelected(destination)} />
          ))}
        </div>
      </Container>
      {selected && <DestinationModal destination={selected} onClose={() => setSelected(null)} />}
    </section>
  );
};
