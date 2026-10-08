import { ArrowRight, Check, Clock, Compass, Heart, MapPin, Plane, Star } from 'lucide-react';
import { __, _n, sprintf } from '@wordpress/i18n';
import { formatDate } from '@/lib/format';
import type { Badge, TourCard as TourCardData } from '@/lib/types';
import { reveal } from '@/lib/reveal';
import { useWishlist, wishlist } from '@/lib/wishlist';
import { useSite } from '@/site/context';
import { Img } from './primitives';

const badgeClass = (type: Badge['type']): string => {
  switch (type) {
    case 'few_seats':
    case 'last_minute':
      return 'bg-clay text-white border border-white/20';
    case 'special_offer':
      return 'bg-cream text-forest border border-forest/20';
    case 'sold_out':
      return 'bg-ink/80 text-white border border-white/20';
    default:
      return 'bg-forest text-cream border border-gold/50';
  }
};

type TourCardProps = {
  tour: TourCardData;
  /** "wide" spans two columns on large screens (first featured tour). */
  variant?: 'standard' | 'wide';
  /** Body text: the excerpt (featured) or the key inclusions (catalogue). */
  detail?: 'excerpt' | 'inclusions';
  /** Reveal delay (ms) so a row of cards enters one after another. */
  delay?: number;
};

export const WishlistButton = ({ tour }: { tour: TourCardData }) => {
  const saved = useWishlist().includes(tour.id);
  const { toast } = useSite();

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? __('Remove from wishlist', 'suntourz') : __('Save to wishlist', 'suntourz')}
      onClick={() =>
        toast(
          wishlist.toggle(tour.id)
            ? sprintf(__('Saved "%s" to your wishlist', 'suntourz'), tour.title)
            : sprintf(__('Removed "%s" from saved journeys', 'suntourz'), tour.title),
        )
      }
      className={`flex h-9 w-9 items-center justify-center rounded-full shadow-md backdrop-blur-md transition-all duration-300 ${
        saved ? 'bg-forest text-gold' : 'bg-white/80 text-ink hover:bg-white hover:text-red-500'
      }`}
    >
      <Heart className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} aria-hidden />
    </button>
  );
};

export const TourCard = ({ tour, variant = 'standard', detail = 'excerpt', delay = 0 }: TourCardProps) => {
  const { data, money } = useSite();
  const wide = variant === 'wide';
  const destination = tour.destinations.map((d) => d.name).join(' · ');
  const style = tour.styles[0]?.name;
  const next = tour.next_departure;

  return (
    <article
      {...reveal(delay)}
      className={`group flex flex-col overflow-hidden rounded-2xl border border-sand bg-white shadow-xs transition-all duration-500 hover:-translate-y-1 hover:shadow-xl ${
        wide ? 'lg:col-span-2 lg:flex-row' : 'justify-between'
      }`}
    >
      <div
        className={`relative overflow-hidden ${wide ? 'min-h-[340px] sm:min-h-[400px] lg:w-7/12' : 'h-64 sm:h-72'}`}
      >
        <a href={tour.url} tabIndex={-1} aria-hidden className="absolute inset-0">
          <Img
            image={tour.image}
            alt={tour.title}
            sizes={wide ? '(min-width: 1024px) 60vw, 100vw' : undefined}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </a>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        {tour.badges.length > 0 && (
          <div className="absolute left-4 top-4 flex flex-col items-start gap-1.5">
            {tour.badges.slice(0, 2).map((badge) => (
              <span
                key={badge.type}
                className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] shadow-md backdrop-blur-xs sm:text-xs ${badgeClass(badge.type)}`}
              >
                {badge.label}
              </span>
            ))}
          </div>
        )}

        <div className="absolute right-4 top-4">
          <WishlistButton tour={tour} />
        </div>

        {tour.rating.count > 0 && (
          <div className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md">
            <Star className="h-3.5 w-3.5 fill-gold text-gold" aria-hidden />
            <span>{tour.rating.average.toFixed(1)}</span>
            <span className="text-white/60">({tour.rating.count})</span>
          </div>
        )}
      </div>

      <div className={`flex flex-1 flex-col justify-between p-6 ${wide ? 'sm:p-7 lg:w-5/12' : ''}`}>
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-3 text-xs font-medium text-muted">
            {destination && (
              <span className="flex items-center gap-1 text-forest">
                <MapPin className="h-3.5 w-3.5 text-gold" aria-hidden />
                {destination}
              </span>
            )}
            {destination && <span aria-hidden>•</span>}
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {sprintf(_n('%d Day', '%d Days', tour.duration_days, 'suntourz'), tour.duration_days)}
            </span>
          </div>

          <h3 className="font-serif-editorial text-xl font-bold leading-snug text-ink transition-colors group-hover:text-forest sm:text-2xl">
            <a href={tour.url}>{tour.title}</a>
          </h3>

          {tour.meeting_point && (
            <div className="mt-2.5 flex items-center gap-1.5 text-xs text-muted">
              <Plane className="h-3.5 w-3.5 shrink-0 text-muted-soft" aria-hidden />
              <span className="truncate">
                {__('Departs:', 'suntourz')} {tour.meeting_point}
              </span>
            </div>
          )}

          {style && (
            <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-ink">
              <Compass className="h-3.5 w-3.5 shrink-0 text-forest/70" aria-hidden />
              <span className="truncate">{style}</span>
            </div>
          )}

          {detail === 'excerpt' && tour.excerpt && (
            <p className="mt-3 line-clamp-3 text-sm font-light leading-relaxed text-muted">{tour.excerpt}</p>
          )}

          {detail === 'inclusions' && tour.includes_preview.length > 0 && (
            <div className="mt-4 space-y-1.5 border-t border-sand/70 pt-3">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-muted-soft">
                {__('Key Inclusions:', 'suntourz')}
              </span>
              {tour.includes_preview.map((item) => (
                <div key={item} className="flex items-start gap-2 text-xs text-muted">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest" aria-hidden />
                  <span className="line-clamp-1">{item}</span>
                </div>
              ))}
            </div>
          )}

          {next && (
            <p className="mt-3 text-xs text-muted">
              <span className="font-semibold text-forest">{__('Next departure:', 'suntourz')}</span>{' '}
              {formatDate(next.start_date, data.site.locale, { day: 'numeric', month: 'short' })}
            </p>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-sand pt-5">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-widest text-muted-soft">
              {__('From', 'suntourz')}
            </span>
            {tour.price_from !== null ? (
              <div className="flex flex-wrap items-baseline gap-x-1.5">
                <span className="font-serif-editorial text-2xl font-bold text-forest sm:text-3xl">
                  {money(tour.price_from)}
                </span>
                {tour.price_from_regular !== null && (
                  <span className="text-sm text-muted-soft line-through">{money(tour.price_from_regular)}</span>
                )}
                {tour.price_from_plan && <span className="text-xs text-muted-soft">/ {tour.price_from_plan}</span>}
              </div>
            ) : (
              <span className="text-sm font-semibold text-muted">{__('On request', 'suntourz')}</span>
            )}
          </div>

          <a
            href={tour.url}
            className="group/btn inline-flex items-center gap-2 rounded-full bg-forest px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-xs transition-all duration-300 hover:bg-forest-soft hover:shadow-md"
          >
            <span>{__('View Tour', 'suntourz')}</span>
            <ArrowRight
              className="h-3.5 w-3.5 text-gold transition-transform group-hover/btn:translate-x-0.5"
              aria-hidden
            />
          </a>
        </div>
      </div>
    </article>
  );
};
