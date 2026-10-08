import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Search, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { __, sprintf } from '@wordpress/i18n';
import { api, toQueryString } from '@/lib/publicApi';
import { stagger } from '@/lib/reveal';
import type { Destination, SiteContent, ToursQuery, ToursResponse, TravelStyle } from '@/lib/types';
import { useSite } from '@/site/context';
import { Container, SectionHeader } from '../primitives';
import { TourCard } from '../TourCard';

type Sort = NonNullable<ToursQuery['sort']>;

const DURATIONS = [
  { key: '', min: undefined, max: undefined },
  { key: 'lt7', min: undefined, max: 6 },
  { key: '7-9', min: 7, max: 9 },
  { key: '10+', min: 10, max: undefined },
] as const;

const durationKey = (q: ToursQuery): string =>
  DURATIONS.find((d) => d.min === q.duration_min && d.max === q.duration_max)?.key ?? '';

/** Query-string parameters the page owns (everything else in the URL is left alone). */
const URL_KEYS: (keyof ToursQuery)[] = [
  'search',
  'destination',
  'style',
  'month',
  'duration_min',
  'duration_max',
  'price_max',
  'pax',
  'discount',
  'last_minute',
  'special_offer',
  'sort',
  'page',
];

const parseSearch = (search: string): ToursQuery => {
  const params = new URLSearchParams(search);
  const text = (key: string) => params.get(key) ?? undefined;
  const number = (key: string) => {
    const value = Number(params.get(key));
    return Number.isInteger(value) && value > 0 ? value : undefined;
  };
  const flag = (key: string) => (params.get(key) === '1' ? true : undefined);
  const sort = text('sort') as Sort | undefined;

  return {
    search: text('search'),
    destination: text('destination'),
    style: text('style'),
    month: /^\d{4}-(0[1-9]|1[0-2])$/.test(text('month') ?? '') ? text('month') : undefined,
    duration_min: number('duration_min'),
    duration_max: number('duration_max'),
    price_max: number('price_max'),
    pax: number('pax'),
    discount: flag('discount'),
    last_minute: flag('last_minute'),
    special_offer: flag('special_offer'),
    sort,
    page: number('page'),
  };
};

/** Removes empty values so equal filters serialize identically. */
const compact = (query: ToursQuery): ToursQuery =>
  Object.fromEntries(Object.entries(query).filter(([, v]) => v !== undefined && v !== '' && v !== false)) as ToursQuery;

type TourFinderProps = {
  mode: 'home' | 'archive';
  initial: ToursResponse | null;
  initialFilters: ToursQuery;
  destinations: Destination[];
  styles: TravelStyle[];
  /** Filters fixed by the page (e.g. a destination page) — hidden from the form and always applied. */
  locked?: ToursQuery;
  copy?: SiteContent['finder'];
};

export const TourFinder = ({ mode, initial, initialFilters, destinations, styles, locked = {}, copy }: TourFinderProps) => {
  const { data, currency } = useSite();
  const archive = mode === 'archive';
  const perPage = archive ? 9 : 6;

  const [filters, setFilters] = useState<ToursQuery>(() => compact(initialFilters));
  const [result, setResult] = useState<ToursResponse | null>(initial);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const first = useRef(initial !== null);
  const typing = useRef(false);

  // Fetch whenever the filters change (the server-rendered first result is reused on mount).
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(
      () => {
        setLoading(true);
        setFailed(false);
        api
          .tours({ ...filters, ...locked, per_page: perPage }, controller.signal)
          .then(setResult)
          .catch((error: unknown) => {
            if (!(error instanceof DOMException && error.name === 'AbortError')) setFailed(true);
          })
          .finally(() => setLoading(false));
      },
      typing.current ? 300 : 0,
    );

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
    // `locked` is constant for the page; filters drive the request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, perPage]);

  // Archive: keep the address bar in sync and honour the back button.
  const writeUrl = useCallback(
    (next: ToursQuery, replace: boolean) => {
      if (!archive) return;
      const owned = URL_KEYS.filter((key) => !(key in locked));
      const qs = toQueryString(Object.fromEntries(owned.map((key) => [key, next[key]])));
      const url = `${window.location.pathname}${qs ? `?${qs}` : ''}`;
      if (replace) window.history.replaceState(null, '', url);
      else window.history.pushState(null, '', url);
    },
    [archive, locked],
  );

  useEffect(() => {
    if (!archive) return;
    const onPop = () => {
      typing.current = false;
      setFilters(compact(parseSearch(window.location.search)));
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [archive]);

  const change = (patch: Partial<ToursQuery>, options: { typing?: boolean } = {}) => {
    typing.current = options.typing ?? false;
    const next = compact({ ...filters, page: undefined, ...patch });
    setFilters(next);
    writeUrl(next, options.typing ?? false);
  };

  const reset = () => {
    typing.current = false;
    setFilters({});
    writeUrl({}, false);
  };

  const hasFilters = Object.keys(filters).some((k) => k !== 'sort' || filters.sort !== 'recommended');
  const showing = result?.items.length ?? 0;
  const total = result?.total ?? 0;
  const minor = currency.minor_unit;

  const viewAll = useMemo(() => {
    const qs = toQueryString({ ...filters, page: undefined });
    return qs ? `${data.site.toursUrl}?${qs}` : data.site.toursUrl;
  }, [filters, data.site.toursUrl]);

  const selectClass =
    'w-full rounded-xl border border-sand bg-cream px-3 py-2 text-xs text-ink focus:border-forest focus:outline-none sm:text-sm';
  const labelClass = 'mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-muted-soft';

  const months = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1));
      return {
        value: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`,
        label: new Intl.DateTimeFormat(data.site.locale.replace('_', '-'), { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date),
      };
    });
  }, [data.site.locale]);

  const body = (
    <>
      <div className={`mb-10 rounded-2xl border border-sand bg-white p-5 shadow-xs sm:p-6 ${panelOpen ? '' : 'max-lg:hidden'}`}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label htmlFor="stz-f-search" className={labelClass}>{__('Search Journeys', 'suntourz')}</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-soft" aria-hidden />
              <input
                id="stz-f-search"
                type="search"
                value={filters.search ?? ''}
                onChange={(e) => change({ search: e.target.value }, { typing: true })}
                placeholder={__('e.g. Maya Bay, Villa...', 'suntourz')}
                className="w-full rounded-xl border border-sand bg-cream py-2 pl-9 pr-3 text-xs text-ink focus:border-forest focus:outline-none sm:text-sm"
              />
            </div>
          </div>

          {!('destination' in locked) && (
            <div>
              <label htmlFor="stz-f-dest" className={labelClass}>{__('Destination', 'suntourz')}</label>
              <select id="stz-f-dest" value={filters.destination ?? ''} onChange={(e) => change({ destination: e.target.value })} className={selectClass}>
                <option value="">{__('All Destinations', 'suntourz')}</option>
                {destinations.map((d) => (
                  <option key={d.id} value={d.slug}>{d.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="stz-f-duration" className={labelClass}>{__('Duration', 'suntourz')}</label>
            <select
              id="stz-f-duration"
              value={durationKey(filters)}
              onChange={(e) => {
                const choice = DURATIONS.find((d) => d.key === e.target.value);
                change({ duration_min: choice?.min, duration_max: choice?.max });
              }}
              className={selectClass}
            >
              <option value="">{__('Any Duration', 'suntourz')}</option>
              <option value="lt7">{__('Under 7 Days', 'suntourz')}</option>
              <option value="7-9">{__('7 – 9 Days', 'suntourz')}</option>
              <option value="10+">{__('10+ Days', 'suntourz')}</option>
            </select>
          </div>

          {!('style' in locked) && (
            <div>
              <label htmlFor="stz-f-style" className={labelClass}>{__('Travel Style', 'suntourz')}</label>
              <select id="stz-f-style" value={filters.style ?? ''} onChange={(e) => change({ style: e.target.value })} className={selectClass}>
                <option value="">{__('All Styles', 'suntourz')}</option>
                {styles.map((s) => (
                  <option key={s.id} value={s.slug}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="stz-f-sort" className={labelClass}>{__('Sort By', 'suntourz')}</label>
            <select id="stz-f-sort" value={filters.sort ?? 'recommended'} onChange={(e) => change({ sort: e.target.value as Sort })} className={selectClass}>
              <option value="recommended">{__('Curated & Featured', 'suntourz')}</option>
              <option value="price_asc">{__('Price: Low to High', 'suntourz')}</option>
              <option value="price_desc">{__('Price: High to Low', 'suntourz')}</option>
              <option value="date_asc">{__('Next Departure', 'suntourz')}</option>
              <option value="duration_asc">{__('Duration: Shortest First', 'suntourz')}</option>
              <option value="newest">{__('Newest', 'suntourz')}</option>
            </select>
          </div>
        </div>

        {archive && (
          <div className="mt-4 grid grid-cols-1 gap-4 border-t border-sand/60 pt-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label htmlFor="stz-f-month" className={labelClass}>{__('Travel Month', 'suntourz')}</label>
              <select id="stz-f-month" value={filters.month ?? ''} onChange={(e) => change({ month: e.target.value })} className={selectClass}>
                <option value="">{__('Any Month', 'suntourz')}</option>
                {months.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="stz-f-price" className={labelClass}>{sprintf(__('Max price (%s)', 'suntourz'), currency.symbol)}</label>
              <input
                id="stz-f-price"
                type="number"
                min={0}
                inputMode="numeric"
                value={filters.price_max ? Math.round(filters.price_max / minor) : ''}
                onChange={(e) => change({ price_max: e.target.value ? Math.round(Number(e.target.value) * minor) : undefined }, { typing: true })}
                placeholder={__('No limit', 'suntourz')}
                className={selectClass}
              />
            </div>
            <div>
              <label htmlFor="stz-f-pax" className={labelClass}>{__('Travelers', 'suntourz')}</label>
              <select id="stz-f-pax" value={filters.pax ?? ''} onChange={(e) => change({ pax: e.target.value ? Number(e.target.value) : undefined })} className={selectClass}>
                <option value="">{__('Any group size', 'suntourz')}</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="4">3 – 4</option>
                <option value="5">5+</option>
              </select>
            </div>
            <fieldset className="flex flex-wrap items-end gap-x-5 gap-y-2 sm:col-span-2">
              <legend className="sr-only">{__('Offers', 'suntourz')}</legend>
              {(
                [
                  ['discount', __('On sale', 'suntourz')],
                  ['last_minute', __('Last minute', 'suntourz')],
                  ['special_offer', __('Special offers', 'suntourz')],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex cursor-pointer items-center gap-2 text-xs font-medium text-ink">
                  <input type="checkbox" checked={Boolean(filters[key])} onChange={(e) => change({ [key]: e.target.checked || undefined })} className="h-4 w-4 accent-forest" />
                  {label}
                </label>
              ))}
            </fieldset>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-sand/60 pt-4 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {!('destination' in locked) && destinations.length > 0 && (
              <>
                <span className="text-[11px] font-medium text-muted-soft">{__('Quick Filter:', 'suntourz')}</span>
                {destinations.slice(0, 4).map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    aria-pressed={filters.destination === d.slug}
                    onClick={() => change({ destination: filters.destination === d.slug ? undefined : d.slug })}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      filters.destination === d.slug ? 'bg-forest text-white' : 'bg-cream text-ink hover:bg-sand'
                    }`}
                  >
                    {d.name}
                  </button>
                ))}
              </>
            )}
          </div>
          <span className="text-xs text-muted-soft" aria-live="polite">
            {sprintf(__('Showing %1$s of %2$s journeys', 'suntourz'), String(showing), String(total))}
          </span>
        </div>
      </div>

      <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'} aria-busy={loading}>
        {failed ? (
          <div className="rounded-2xl border border-sand bg-white p-8 py-16 text-center">
            <p className="font-serif-editorial text-lg text-ink">{__('We could not load the tours.', 'suntourz')}</p>
            <button type="button" onClick={() => change({})} className="mt-6 rounded-full bg-forest px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white">
              {__('Try again', 'suntourz')}
            </button>
          </div>
        ) : result && result.items.length === 0 ? (
          <div className="rounded-2xl border border-sand bg-white p-8 py-20 text-center">
            <p className="font-serif-editorial text-lg text-ink">{__('No journeys matched your exact filter combination.', 'suntourz')}</p>
            <p className="mt-2 text-sm text-muted">{__('Try adjusting your destination or duration criteria, or speak with our custom itinerary planner.', 'suntourz')}</p>
            <button type="button" onClick={reset} className="mt-6 rounded-full bg-forest px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white">
              {__('Reset All Filters', 'suntourz')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {result?.items.map((tour, index) => <TourCard key={tour.id} tour={tour} detail="inclusions" delay={stagger(index % 3)} />)}
          </div>
        )}
      </div>

      {archive && result && result.total_pages > 1 && (
        <nav aria-label={__('Tour pages', 'suntourz')} className="mt-12 flex items-center justify-center gap-4">
          <button
            type="button"
            disabled={result.page <= 1}
            onClick={() => {
              change({ page: result.page - 1 });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="rounded-full border border-sand bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-forest hover:bg-sand-soft disabled:cursor-not-allowed disabled:opacity-40"
          >
            {__('Previous', 'suntourz')}
          </button>
          <span className="text-xs text-muted">{sprintf(__('Page %1$d of %2$d', 'suntourz'), result.page, result.total_pages)}</span>
          <button
            type="button"
            disabled={result.page >= result.total_pages}
            onClick={() => {
              change({ page: result.page + 1 });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="rounded-full border border-sand bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-forest hover:bg-sand-soft disabled:cursor-not-allowed disabled:opacity-40"
          >
            {__('Next', 'suntourz')}
          </button>
        </nav>
      )}

      {!archive && result && result.total > result.items.length && (
        <div className="mt-12 text-center">
          <a href={viewAll} className="group inline-flex items-center gap-2 rounded-full bg-forest px-7 py-3.5 text-xs font-semibold uppercase tracking-wider text-white shadow-md hover:bg-forest-soft">
            <span>{sprintf(__('View all %d tours', 'suntourz'), result.total)}</span>
            <ArrowRight className="h-4 w-4 text-gold transition-transform group-hover:translate-x-1" aria-hidden />
          </a>
        </div>
      )}
    </>
  );

  const controls = (
    <div className="flex items-center gap-3">
      <button
        type="button"
        aria-expanded={panelOpen}
        onClick={() => setPanelOpen(!panelOpen)}
        className="flex items-center gap-2 rounded-full border border-sand bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-forest lg:hidden"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
        <span>{__('Filters', 'suntourz')}</span>
      </button>
      {hasFilters && (
        <button type="button" onClick={reset} className="flex items-center gap-1 text-xs text-muted-soft transition-colors hover:text-forest">
          <RotateCcw className="h-3 w-3" aria-hidden />
          <span>{__('Reset filters', 'suntourz')}</span>
        </button>
      )}
    </div>
  );

  return (
    <section id="tours" className={archive ? 'pb-20 sm:pb-28' : 'bg-cream py-20 sm:py-28'}>
      <Container>
        {archive ? (
          <div className="mb-6 flex justify-end">{controls}</div>
        ) : (
          <SectionHeader {...copy} aside={controls} />
        )}
        {body}
      </Container>
    </section>
  );
};
