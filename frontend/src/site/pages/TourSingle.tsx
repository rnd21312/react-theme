import { Bus, Check, Clock, Coffee, Compass, Hotel, MapPin, Moon, Sparkles, Star, Utensils, X } from 'lucide-react';
import { __, _n, sprintf } from '@wordpress/i18n';
import { ArrowRight } from 'lucide-react';
import { BookingCard } from '@/components/BookingCard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Layout } from '@/components/layout/Layout';
import { Container, Eyebrow, Img } from '@/components/primitives';
import { TourCard } from '@/components/TourCard';
import { TourReviews } from '@/components/TourReviews';
import { reveal, stagger } from '@/lib/reveal';
import type { ItineraryItem, SiteData, TourCard as TourCardData, TourPayload } from '@/lib/types';
import { useSite } from '@/site/context';

const ITEM_ICONS: Record<ItineraryItem['type'], typeof Clock> = {
  transfer: Bus,
  meal: Utensils,
  activity: Compass,
  rest: Moon,
  free: Coffee,
  stay: Hotel,
};

const badgeClass = (type: string) =>
  type === 'few_seats' || type === 'last_minute'
    ? 'bg-clay text-white'
    : type === 'sold_out'
      ? 'bg-ink/80 text-white'
      : 'bg-gold text-forest';

/** Closing section: more tours (same destination / style first) so a visitor is never at a dead end. */
const MoreTours = ({ tours, destination }: { tours: TourCardData[]; destination?: string }) => {
  const { data } = useSite();
  if (tours.length === 0) return null;

  return (
    <section aria-labelledby="stz-more-tours" className="border-t border-sand bg-sand-soft/50 py-16 sm:py-24">
      <Container>
        <div {...reveal()} className="mb-10 flex flex-col justify-between gap-5 sm:mb-12 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <Eyebrow>{__('Keep exploring', 'suntourz')}</Eyebrow>
            <h2 id="stz-more-tours" className="font-serif-editorial text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              {destination ? sprintf(__('More tours in %s and beyond', 'suntourz'), destination) : __('More Thailand tours you may like', 'suntourz')}
            </h2>
            <p className="mt-3 text-base font-light text-muted">{__('Handpicked journeys with the same care, dates and clear pricing.', 'suntourz')}</p>
          </div>
          <a href={data.site.toursUrl} className="group inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-forest transition-colors hover:text-gold">
            <span>{__('View all tours', 'suntourz')}</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
          </a>
        </div>
        <div className={`grid grid-cols-1 gap-8 md:grid-cols-2 ${tours.length >= 3 ? 'lg:grid-cols-3' : ''}`}>
          {tours.map((tour, index) => (
            <TourCard key={tour.id} tour={tour} delay={stagger(index)} />
          ))}
        </div>
      </Container>
    </section>
  );
};

const TourBody = ({ payload }: { payload: TourPayload }) => {
  const { tour, reviews } = payload;
  const { data, openPlanTrip } = useSite();
  const destinationLinks = tour.destinations.map((d) => ({ ...d, url: data.destinations.find((item) => item.slug === d.slug)?.url }));

  return (
    <>
      <header className="relative -mt-24 h-[62vh] min-h-[440px] w-full overflow-hidden sm:-mt-28">
        <Img image={tour.image} alt={tour.title} eager sizes="100vw" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/40" />
        <Container className="absolute inset-x-0 bottom-0 pb-10 text-white">
          <Breadcrumbs light className="mb-4" />
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {tour.badges.map((badge) => (
              <span key={badge.type} className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeClass(badge.type)}`}>
                {badge.label}
              </span>
            ))}
            {tour.styles.map((style) => (
              <a key={style.id} href={`${data.site.toursUrl}?style=${style.slug}`} className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] uppercase tracking-wider backdrop-blur-xs hover:bg-white/30">
                {style.name}
              </a>
            ))}
            {tour.rating.count > 0 && (
              <a href="#reviews" className="ml-auto flex items-center gap-1 text-xs text-gold">
                <Star className="h-4 w-4 fill-current" aria-hidden />
                <span className="font-bold">{tour.rating.average.toFixed(1)}</span>
                <span className="text-white/70">({sprintf(_n('%d review', '%d reviews', tour.rating.count, 'suntourz'), tour.rating.count)})</span>
              </a>
            )}
          </div>
          <h1 className="font-serif-editorial max-w-4xl text-3xl font-bold sm:text-5xl">{tour.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/90 sm:text-sm">
            {destinationLinks.length > 0 && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-gold" aria-hidden />
                {destinationLinks.map((d, index) => (
                  <span key={d.id}>
                    {index > 0 && ' · '}
                    {d.url ? <a href={d.url} className="underline-offset-4 hover:underline">{d.name}</a> : d.name}
                  </span>
                ))}
              </span>
            )}
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-gold" aria-hidden />{sprintf(_n('%d Day', '%d Days', tour.duration_days, 'suntourz'), tour.duration_days)}</span>
            {tour.meeting_point.name && (
              <span className="flex items-center gap-1"><Compass className="h-3.5 w-3.5 text-gold" aria-hidden />{__('Meeting point:', 'suntourz')} {tour.meeting_point.name}</span>
            )}
          </div>
        </Container>
      </header>

      <Container className="grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-12">
          {tour.content && (
            <section aria-labelledby="stz-overview">
              <h2 id="stz-overview" className="font-serif-editorial mb-4 text-2xl font-bold text-ink">{__('Overview', 'suntourz')}</h2>
              <div className="stz-prose" dangerouslySetInnerHTML={{ __html: tour.content }} />
            </section>
          )}

          {tour.highlights.length > 0 && (
            <section aria-labelledby="stz-highlights">
              <h2 id="stz-highlights" className="font-serif-editorial mb-4 text-2xl font-bold text-ink">{__('Key Experience Highlights', 'suntourz')}</h2>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {tour.highlights.map((highlight) => (
                  <li key={highlight} className="flex items-start gap-2.5 rounded-xl border border-sand bg-white p-3">
                    <Star className="mt-0.5 h-4 w-4 shrink-0 fill-gold text-gold" aria-hidden />
                    <span className="text-sm font-medium text-ink">{highlight}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {tour.itinerary.length > 0 && (
            <section aria-labelledby="stz-itinerary">
              <h2 id="stz-itinerary" className="font-serif-editorial mb-1 text-2xl font-bold text-ink">{__('Curated Day-by-Day Journey', 'suntourz')}</h2>
              <p className="mb-5 text-sm font-light text-muted">{sprintf(_n('%d day of discovery', '%d days of discovery', tour.itinerary.length, 'suntourz'), tour.itinerary.length)}</p>
              <ol className="relative space-y-4 before:absolute before:bottom-4 before:left-3.5 before:top-4 before:w-0.5 before:bg-sand">
                {tour.itinerary.map((day, index) => (
                  <li key={day.day} className="relative pl-10">
                    <div className="absolute left-0 top-0.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-forest text-xs font-bold text-gold shadow-xs">{day.day}</div>
                    <details open={index === 0} className="group rounded-xl border border-sand bg-white shadow-2xs">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-4 sm:p-5">
                        <h3 className="text-base font-bold text-ink">{sprintf(__('Day %d', 'suntourz'), day.day)}{day.title ? `: ${day.title}` : ''}</h3>
                        <span aria-hidden className="text-muted-soft transition-transform group-open:rotate-180">▾</span>
                      </summary>
                      <div className="space-y-3 border-t border-sand/70 px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
                        {day.description && <p className="text-sm font-light leading-relaxed text-muted">{day.description}</p>}
                        {day.items.length > 0 && (
                          <ul className="space-y-2">
                            {day.items.map((item, itemIndex) => {
                              const Icon = ITEM_ICONS[item.type] ?? Compass;
                              return (
                                <li key={itemIndex} className="flex items-start gap-3 text-sm">
                                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cream text-forest"><Icon className="h-3.5 w-3.5" aria-hidden /></span>
                                  <span className="text-ink">
                                    {item.time && <span className="mr-2 font-mono text-xs text-muted-soft">{item.time}</span>}
                                    {item.title}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    </details>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {(tour.includes.length > 0 || tour.excludes.length > 0) && (
            <section aria-labelledby="stz-includes" className="grid gap-6 sm:grid-cols-2">
              <h2 id="stz-includes" className="sr-only">{__('What is included', 'suntourz')}</h2>
              {tour.includes.length > 0 && (
                <div>
                  <h3 className="font-serif-editorial mb-3 text-xl font-bold text-ink">{__('Included', 'suntourz')}</h3>
                  <ul className="space-y-2">
                    {tour.includes.map((item) => (
                      <li key={item} className="flex items-start gap-3 rounded-xl border border-sand bg-white p-3.5 text-sm text-ink">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest/10"><Check className="h-3.5 w-3.5 text-forest" aria-hidden /></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {tour.excludes.length > 0 && (
                <div>
                  <h3 className="font-serif-editorial mb-3 text-xl font-bold text-ink">{__('Not included', 'suntourz')}</h3>
                  <ul className="space-y-2">
                    {tour.excludes.map((item) => (
                      <li key={item} className="flex items-start gap-3 rounded-xl border border-sand bg-white p-3.5 text-sm text-muted">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-clay/10"><X className="h-3.5 w-3.5 text-clay" aria-hidden /></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {tour.gallery.length > 0 && (
            <section aria-labelledby="stz-gallery">
              <h2 id="stz-gallery" className="font-serif-editorial mb-4 text-2xl font-bold text-ink">{__('Gallery', 'suntourz')}</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {tour.gallery.map((image) => (
                  <Img key={image.id} image={image} sizes="(min-width: 640px) 25vw, 50vw" className="aspect-[4/3] w-full rounded-xl border border-sand object-cover" />
                ))}
              </div>
            </section>
          )}

          {(tour.meeting_point.name || tour.meeting_point.address) && (
            <section aria-labelledby="stz-meeting" className="rounded-2xl border border-sand bg-white p-6">
              <h2 id="stz-meeting" className="font-serif-editorial mb-2 text-xl font-bold text-ink">{__('Meeting point', 'suntourz')}</h2>
              <p className="flex items-start gap-2 text-sm text-muted">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                <span>
                  <strong className="text-ink">{tour.meeting_point.name}</strong>
                  {tour.meeting_point.address && <><br />{tour.meeting_point.address}</>}
                </span>
              </p>
              {tour.meeting_point.lat !== null && tour.meeting_point.lng !== null && (
                <a
                  className="mt-3 inline-block text-xs font-semibold text-forest underline"
                  href={`https://www.openstreetmap.org/?mlat=${tour.meeting_point.lat}&mlon=${tour.meeting_point.lng}#map=15/${tour.meeting_point.lat}/${tour.meeting_point.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {__('View on map', 'suntourz')}
                </a>
              )}
            </section>
          )}

          <TourReviews tourId={tour.id} initial={reviews} />

          <section className="rounded-2xl border border-sand bg-white p-6 shadow-2xs">
            <h2 className="font-serif-editorial mb-1 text-lg font-bold text-forest">{__('Want to adapt this journey?', 'suntourz')}</h2>
            <p className="text-sm font-light text-muted">{__('Our Thailand specialists will tailor dates, stays and pacing around you.', 'suntourz')}</p>
            <button
              type="button"
              onClick={() => openPlanTrip({ tourIds: [tour.id], destination: tour.destinations[0]?.name, notes: sprintf(__('I would like to customise "%s".', 'suntourz'), tour.title) })}
              className="mt-4 flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-forest-soft"
            >
              <Sparkles className="h-3.5 w-3.5 text-gold" aria-hidden />
              {__('Customize this tour', 'suntourz')}
            </button>
          </section>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start" aria-label={__('Booking', 'suntourz')}>
          <BookingCard tour={tour} />
        </aside>
      </Container>

      <MoreTours tours={payload.related ?? []} destination={tour.destinations[0]?.name} />
    </>
  );
};

const BookBar = ({ price }: { price: number | null }) => {
  const { money } = useSite();

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-sand bg-cream/95 px-4 py-3 shadow-2xl backdrop-blur-md md:hidden">
      <div>
        <span className="block text-[10px] font-bold uppercase tracking-widest text-muted-soft">{__('From', 'suntourz')}</span>
        <span className="font-serif-editorial text-xl font-bold text-forest">{price !== null ? money(price) : __('On request', 'suntourz')}</span>
      </div>
      <a href="#booking" className="rounded-full border border-gold/30 bg-forest px-6 py-3 text-sm font-semibold text-white shadow-lg">
        {__('Book this tour', 'suntourz')}
      </a>
    </div>
  );
};

const TourSingle = ({ data }: { data: SiteData }) => {
  const payload = data.payload as unknown as TourPayload;

  return (
    <Layout bareTop mobileBar={<BookBar price={payload.tour.price_from} />}>
      <TourBody payload={payload} />
    </Layout>
  );
};

export default TourSingle;
