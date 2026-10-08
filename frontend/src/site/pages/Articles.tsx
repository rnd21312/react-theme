import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { ArrowDownAZ, ArrowRight, Clock, Compass, RotateCcw, Search, Tag, X } from 'lucide-react';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Layout } from '@/components/layout/Layout';
import { PageBanner } from '@/components/PageBanner';
import { Container, Eyebrow, Img } from '@/components/primitives';
import { api, toQueryString } from '@/lib/publicApi';
import { reveal, stagger } from '@/lib/reveal';
import type {
  Article,
  ArticleSort,
  ArticlesPayload,
  ArticlesQuery,
  ArticlesResponse,
  ArticleTerm,
  SiteData,
} from '@/lib/types';
import { useSite } from '@/site/context';

const PER_PAGE = 9;
const SORTS: ArticleSort[] = ['newest', 'oldest', 'title_asc', 'title_desc'];

/* ------------------------------------------------------------------ Cards */

type ArticleCardProps = { article: Article; delay?: number };

export const ArticleCard = ({ article, delay = 0 }: ArticleCardProps) => (
  <a
    href={article.url}
    {...reveal(delay)}
    className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-sand bg-white shadow-xs transition-all duration-500 hover:-translate-y-1 hover:shadow-xl"
  >
    <div>
      <div className="relative h-48 overflow-hidden">
        <Img
          image={article.image}
          alt={article.title}
          className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-forest backdrop-blur-xs">
          {article.category}
        </span>
      </div>
      <div className="p-5">
        <div className="mb-1.5 flex items-center gap-1 text-[11px] text-muted-soft">
          <Clock className="h-3 w-3" aria-hidden />
          <span>{sprintf(__('%d min read', 'suntourz'), article.read_minutes)}</span>
          <span aria-hidden>•</span>
          <span>{article.date}</span>
        </div>
        <h2 className="font-serif-editorial line-clamp-2 text-lg font-bold leading-snug text-ink transition-colors group-hover:text-forest">
          {article.title}
        </h2>
        <p className="mt-2 line-clamp-3 text-xs font-light leading-relaxed text-muted">
          {article.excerpt}
        </p>
      </div>
    </div>
    <div className="p-5 pt-0">
      <div className="flex items-center justify-between border-t border-sand/70 pt-3 text-[11px]">
        <span className="max-w-[160px] truncate text-muted-soft">
          {article.author.split(',')[0]}
        </span>
        <span className="flex items-center gap-1 font-semibold text-forest transition-transform duration-300 group-hover:translate-x-0.5">
          {__('Read', 'suntourz')} <ArrowRight className="h-3 w-3 text-gold" aria-hidden />
        </span>
      </div>
    </div>
  </a>
);

/** Larger first card of the unfiltered first page. */
const LeadCard = ({ article }: { article: Article }) => (
  <a
    href={article.url}
    {...reveal()}
    className="group grid overflow-hidden rounded-2xl border border-sand bg-white shadow-xs transition-all duration-500 hover:shadow-xl md:grid-cols-2"
  >
    <div className="relative h-60 overflow-hidden md:h-full md:min-h-[320px]">
      <Img
        image={article.image}
        alt={article.title}
        eager
        sizes="(min-width: 1024px) 40vw, 100vw"
        className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      <span className="absolute left-4 top-4 rounded-full border border-gold/40 bg-forest px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
        {__('Featured Edition', 'suntourz')}
      </span>
    </div>
    <div className="flex flex-col justify-center p-6 sm:p-8">
      <span className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
        {article.category}
      </span>
      <h2 className="font-serif-editorial text-2xl font-bold leading-snug text-ink transition-colors group-hover:text-forest sm:text-3xl">
        {article.title}
      </h2>
      <p className="mt-3 line-clamp-4 text-sm font-light leading-relaxed text-muted">
        {article.excerpt}
      </p>
      <div className="mt-5 flex items-center justify-between border-t border-sand pt-4 text-xs">
        <span className="flex items-center gap-1.5 text-muted-soft">
          <Clock className="h-3.5 w-3.5 text-gold" aria-hidden />
          {sprintf(__('%d min read', 'suntourz'), article.read_minutes)} • {article.date}
        </span>
        <span className="flex items-center gap-1 font-semibold text-forest transition-transform duration-300 group-hover:translate-x-1">
          {__('Read Guide', 'suntourz')}{' '}
          <ArrowRight className="h-3.5 w-3.5 text-gold" aria-hidden />
        </span>
      </div>
    </div>
  </a>
);

const CardSkeleton = () => (
  <div
    className="animate-pulse overflow-hidden rounded-2xl border border-sand bg-white"
    aria-hidden
  >
    <div className="h-48 bg-sand-soft" />
    <div className="space-y-3 p-5">
      <div className="h-3 w-1/3 rounded bg-sand-soft" />
      <div className="h-5 w-4/5 rounded bg-sand-soft" />
      <div className="h-3 w-full rounded bg-sand-soft" />
      <div className="h-3 w-2/3 rounded bg-sand-soft" />
    </div>
  </div>
);

/* ------------------------------------------------------------------ URL state */

const parseSearch = (search: string): ArticlesQuery => {
  const params = new URLSearchParams(search);
  const sort = params.get('sort') as ArticleSort | null;
  const page = Number(params.get('page'));

  return {
    search: params.get('q') ?? undefined,
    category: params.get('category') ?? undefined,
    tag: params.get('tag') ?? undefined,
    sort: sort && SORTS.includes(sort) && sort !== 'newest' ? sort : undefined,
    page: Number.isInteger(page) && page > 1 ? page : undefined,
  };
};

const compact = (query: ArticlesQuery): ArticlesQuery =>
  Object.fromEntries(
    Object.entries(query).filter(
      ([, value]) => value !== undefined && value !== '' && value !== 'newest',
    ),
  ) as ArticlesQuery;

const asQuery = (value: unknown): ArticlesQuery =>
  value && !Array.isArray(value) ? (value as ArticlesQuery) : {};

/** Page numbers around the current one, with gaps shown as null. */
const pageList = (current: number, total: number): (number | null)[] => {
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);

  return sorted.flatMap((n, i) => (i > 0 && n - (sorted[i - 1] ?? 0) > 1 ? [null, n] : [n]));
};

/* ------------------------------------------------------------------ Page */

const sortLabels: Record<ArticleSort, string> = {
  newest: __('Newest first', 'suntourz'),
  oldest: __('Oldest first', 'suntourz'),
  title_asc: __('Title: A → Z', 'suntourz'),
  title_desc: __('Title: Z → A', 'suntourz'),
};

const ArticlesBody = ({ payload }: { payload: ArticlesPayload }) => {
  const { data, openPlanTrip } = useSite();
  const preset = useMemo(() => asQuery(payload.preset), [payload.preset]);
  const categories = payload.categories ?? [];
  const tags = payload.tags ?? [];
  const recent = payload.recent ?? [];
  const copy = payload.content as {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    banner_image?: string;
  };

  const [filters, setFilters] = useState<ArticlesQuery>(() =>
    compact({ ...asQuery(payload.filters), ...preset }),
  );
  const [result, setResult] = useState<ArticlesResponse | null>(payload.result);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const first = useRef(payload.result !== null);
  const typing = useRef(false);
  const top = useRef<HTMLDivElement>(null);

  const locked = (key: keyof ArticlesQuery) => key in preset;

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
          .articles(filters, PER_PAGE, controller.signal)
          .then(setResult)
          .catch((error: unknown) => {
            if (!(error instanceof DOMException && error.name === 'AbortError')) setFailed(true);
          })
          .finally(() => setLoading(false));
      },
      typing.current ? 320 : 0,
    );

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [filters]);

  const writeUrl = useCallback(
    (next: ArticlesQuery, replace: boolean) => {
      const owned = {
        q: next.search,
        category: locked('category') ? undefined : next.category,
        tag: locked('tag') ? undefined : next.tag,
        sort: next.sort,
        page: next.page,
      };
      const qs = toQueryString(owned);
      const url = `${window.location.pathname}${qs ? `?${qs}` : ''}`;
      if (replace) window.history.replaceState(null, '', url);
      else window.history.pushState(null, '', url);
    },
    // `preset` never changes for a page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    const onPop = () => {
      typing.current = false;
      setFilters(compact({ ...parseSearch(window.location.search), ...preset }));
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [preset]);

  const change = (
    patch: Partial<ArticlesQuery>,
    options: { typing?: boolean; scroll?: boolean } = {},
  ) => {
    typing.current = options.typing ?? false;
    const next = compact({ ...filters, page: undefined, ...patch, ...preset });
    setFilters(next);
    writeUrl(next, options.typing ?? false);
    if (options.scroll) top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const reset = () => {
    typing.current = false;
    const next = compact(preset);
    setFilters(next);
    writeUrl(next, false);
  };

  /** Term links keep a real URL (crawlable) but filter in place on the blog index. */
  const termLink =
    (key: 'category' | 'tag', term: ArticleTerm) => (event: MouseEvent<HTMLAnchorElement>) => {
      if (locked(key) || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0)
        return;
      event.preventDefault();
      change({ [key]: filters[key] === term.slug ? undefined : term.slug }, { scroll: true });
    };

  const hasFilters = Boolean(
    filters.search ||
    filters.sort ||
    (!locked('category') && filters.category) ||
    (!locked('tag') && filters.tag),
  );
  const items = result?.items ?? [];
  const total = result?.total ?? 0;
  const page = result?.page ?? 1;
  const totalPages = result?.total_pages ?? 1;
  const showLead =
    page === 1 && !hasFilters && !locked('category') && !locked('tag') && items.length > 3;
  const gridItems = showLead ? items.slice(1) : items;
  const from = total === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const to = Math.min(total, page * PER_PAGE);

  const activeCategory = categories.find((c) => c.slug === filters.category);
  const activeTag = tags.find((t) => t.slug === filters.tag);

  const heading = payload.heading || copy.title || __('Travel Guide', 'suntourz');
  const intro = payload.intro || copy.subtitle;

  const chip = (active: boolean) =>
    `whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-300 ${
      active
        ? 'border-forest bg-forest text-white shadow-sm'
        : 'border-sand bg-white text-ink hover:border-forest/40 hover:bg-sand-soft'
    }`;

  const banner = copy.banner_image ?? '';

  return (
    <>
      {banner && (
        <div className="mb-10">
          <PageBanner
            eyebrow={copy.eyebrow ?? __('Editorial Journal', 'suntourz')}
            title={heading}
            subtitle={intro}
            image={banner}
          />
        </div>
      )}
      <Container className="pb-20">
        {!banner && (
          <div className="mb-8 max-w-3xl sm:mb-10">
            <Eyebrow>{copy.eyebrow ?? __('Editorial Journal', 'suntourz')}</Eyebrow>
            <h1 className="font-serif-editorial text-3xl font-bold tracking-tight text-ink sm:text-4xl md:text-5xl">
              {heading}
            </h1>
            {intro && <p className="mt-3 text-base font-light text-muted sm:text-lg">{intro}</p>}
          </div>
        )}

        {/* Toolbar: search + sort */}
        <div
          ref={top}
          className="scroll-mt-28 rounded-2xl border border-sand bg-white p-3 shadow-xs sm:p-4"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <form
              role="search"
              onSubmit={(event) => event.preventDefault()}
              className="relative flex-1"
            >
              <label htmlFor="stz-a-search" className="sr-only">
                {__('Search articles', 'suntourz')}
              </label>
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-soft"
                aria-hidden
              />
              <input
                id="stz-a-search"
                type="search"
                value={filters.search ?? ''}
                onChange={(event) => change({ search: event.target.value }, { typing: true })}
                placeholder={__('Search guides, islands, seasons, food…', 'suntourz')}
                className="w-full rounded-xl border border-sand bg-cream py-3 pl-11 pr-10 text-sm text-ink transition-colors focus:border-forest focus:outline-none"
              />
              {filters.search && (
                <button
                  type="button"
                  onClick={() => change({ search: undefined })}
                  aria-label={__('Clear search', 'suntourz')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-soft hover:bg-sand hover:text-ink"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              )}
            </form>

            <div className="relative md:w-60">
              <label htmlFor="stz-a-sort" className="sr-only">
                {__('Sort articles', 'suntourz')}
              </label>
              <ArrowDownAZ
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-forest"
                aria-hidden
              />
              <select
                id="stz-a-sort"
                value={filters.sort ?? 'newest'}
                onChange={(event) => change({ sort: event.target.value as ArticleSort })}
                className="w-full cursor-pointer appearance-none rounded-xl border border-sand bg-cream py-3 pl-11 pr-4 text-sm font-medium text-ink focus:border-forest focus:outline-none"
              >
                {SORTS.map((sort) => (
                  <option key={sort} value={sort}>
                    {sortLabels[sort]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Phones and tablets: category chips (the sidebar list is desktop only). */}
          {categories.length > 0 && (
            <div
              className="no-scrollbar -mx-3 mt-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:-mx-4 sm:px-4 lg:hidden"
              role="group"
              aria-label={__('Categories', 'suntourz')}
            >
              {!locked('category') && (
                <button
                  type="button"
                  aria-pressed={!filters.category}
                  onClick={() => change({ category: undefined })}
                  className={chip(!filters.category)}
                >
                  {__('All', 'suntourz')}
                </button>
              )}
              {categories.map((category) => (
                <a
                  key={category.id}
                  href={category.url}
                  onClick={termLink('category', category)}
                  aria-current={filters.category === category.slug ? 'true' : undefined}
                  className={chip(filters.category === category.slug)}
                >
                  {category.name} <span className="opacity-60">{category.count}</span>
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
          <div className="min-w-0">
            {/* Result summary + active filters */}
            <div
              className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted"
              aria-live="polite"
            >
              <span>
                {total > 0
                  ? sprintf(
                      __('Showing %1$s–%2$s of %3$s', 'suntourz'),
                      String(from),
                      String(to),
                      sprintf(_n('%d article', '%d articles', total, 'suntourz'), total),
                    )
                  : __('No articles found', 'suntourz')}
              </span>
              {filters.search && (
                <button
                  type="button"
                  onClick={() => change({ search: undefined })}
                  className="inline-flex items-center gap-1.5 rounded-full bg-forest/5 px-3 py-1 font-medium text-forest hover:bg-forest/10"
                >
                  “{filters.search}” <X className="h-3 w-3" aria-hidden />
                </button>
              )}
              {!locked('category') && activeCategory && (
                <button
                  type="button"
                  onClick={() => change({ category: undefined })}
                  className="inline-flex items-center gap-1.5 rounded-full bg-forest/5 px-3 py-1 font-medium text-forest hover:bg-forest/10"
                >
                  {activeCategory.name} <X className="h-3 w-3" aria-hidden />
                </button>
              )}
              {!locked('tag') && activeTag && (
                <button
                  type="button"
                  onClick={() => change({ tag: undefined })}
                  className="inline-flex items-center gap-1.5 rounded-full bg-forest/5 px-3 py-1 font-medium text-forest hover:bg-forest/10"
                >
                  #{activeTag.name} <X className="h-3 w-3" aria-hidden />
                </button>
              )}
              {hasFilters && (
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-1 text-muted-soft transition-colors hover:text-forest"
                >
                  <RotateCcw className="h-3 w-3" aria-hidden />
                  {__('Reset filters', 'suntourz')}
                </button>
              )}
            </div>

            <div
              className={`transition-opacity duration-300 ${loading ? 'opacity-50' : ''}`}
              aria-busy={loading}
            >
              {failed ? (
                <div className="rounded-2xl border border-sand bg-white p-8 py-16 text-center">
                  <p className="font-serif-editorial text-lg text-ink">
                    {__('We could not load the articles.', 'suntourz')}
                  </p>
                  <button
                    type="button"
                    onClick={() => change({})}
                    className="mt-6 rounded-full bg-forest px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white"
                  >
                    {__('Try again', 'suntourz')}
                  </button>
                </div>
              ) : loading && items.length === 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {Array.from({ length: 4 }, (_, i) => (
                    <CardSkeleton key={i} />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="rounded-2xl border border-sand bg-white p-8 py-16 text-center">
                  <p className="font-serif-editorial text-lg text-ink">
                    {__('No articles matched your search.', 'suntourz')}
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    {__('Try another word, or browse every guide.', 'suntourz')}
                  </p>
                  <button
                    type="button"
                    onClick={reset}
                    className="mt-6 rounded-full bg-forest px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white"
                  >
                    {__('Show all articles', 'suntourz')}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {showLead && items[0] && <LeadCard article={items[0]} />}
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {gridItems.map((article, index) => (
                      <ArticleCard key={article.id} article={article} delay={stagger(index % 2)} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <nav
                aria-label={__('Article pages', 'suntourz')}
                className="mt-12 flex flex-wrap items-center justify-center gap-2"
              >
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => change({ page: page - 1 }, { scroll: true })}
                  className="rounded-full border border-sand bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-forest transition-colors hover:bg-sand-soft disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {__('Previous', 'suntourz')}
                </button>
                {pageList(page, totalPages).map((n, index) =>
                  n === null ? (
                    <span key={`gap-${index}`} className="px-1 text-muted-soft" aria-hidden>
                      …
                    </span>
                  ) : (
                    <button
                      key={n}
                      type="button"
                      aria-current={n === page ? 'page' : undefined}
                      aria-label={sprintf(__('Page %d', 'suntourz'), n)}
                      onClick={() => change({ page: n }, { scroll: true })}
                      className={`h-10 w-10 rounded-full text-xs font-semibold transition-all duration-300 ${n === page ? 'bg-forest text-white shadow-md' : 'border border-sand bg-white text-ink hover:bg-sand-soft'}`}
                    >
                      {n}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => change({ page: page + 1 }, { scroll: true })}
                  className="rounded-full border border-sand bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-forest transition-colors hover:bg-sand-soft disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {__('Next', 'suntourz')}
                </button>
              </nav>
            )}
          </div>

          {/* Sidebar */}
          <aside
            aria-label={__('Guide sidebar', 'suntourz')}
            className="space-y-6 lg:sticky lg:top-28 lg:self-start"
          >
            {categories.length > 0 && (
              <section
                {...reveal()}
                className="hidden rounded-2xl border border-sand bg-white p-6 shadow-xs lg:block"
              >
                <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-forest">
                  {__('Categories', 'suntourz')}
                </h2>
                <ul className="space-y-1">
                  {categories.map((category) => {
                    const active = filters.category === category.slug;

                    return (
                      <li key={category.id}>
                        <a
                          href={category.url}
                          onClick={termLink('category', category)}
                          aria-current={active ? 'true' : undefined}
                          className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors duration-300 ${active ? 'bg-forest font-semibold text-white' : 'text-ink hover:bg-sand-soft'}`}
                        >
                          <span>{category.name}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${active ? 'bg-white/15 text-white' : 'bg-cream text-muted'}`}
                          >
                            {category.count}
                          </span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {recent.length > 0 && (
              <section
                {...reveal(80)}
                className="rounded-2xl border border-sand bg-white p-6 shadow-xs"
              >
                <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-forest">
                  {__('Latest guides', 'suntourz')}
                </h2>
                <ul className="space-y-4">
                  {recent.map((article) => (
                    <li key={article.id}>
                      <a href={article.url} className="group flex items-center gap-3">
                        <Img
                          image={article.image}
                          alt=""
                          className="h-16 w-16 shrink-0 rounded-xl object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <span className="min-w-0">
                          <span className="line-clamp-2 text-sm font-semibold leading-snug text-ink transition-colors group-hover:text-forest">
                            {article.title}
                          </span>
                          <span className="mt-1 block text-[11px] text-muted-soft">
                            {article.date}
                          </span>
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {tags.length > 0 && (
              <section
                {...reveal(120)}
                className="rounded-2xl border border-sand bg-white p-6 shadow-xs"
              >
                <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-forest">
                  <Tag className="h-3.5 w-3.5 text-gold" aria-hidden />
                  {__('Popular topics', 'suntourz')}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <a
                      key={tag.id}
                      href={tag.url}
                      onClick={termLink('tag', tag)}
                      className={`rounded-full border px-3 py-1.5 text-xs transition-colors duration-300 ${filters.tag === tag.slug ? 'border-forest bg-forest text-white' : 'border-sand bg-cream text-ink hover:border-forest/40'}`}
                    >
                      #{tag.name}
                    </a>
                  ))}
                </div>
              </section>
            )}

            <section
              {...reveal(160)}
              className="relative overflow-hidden rounded-2xl bg-forest p-6 text-white shadow-lg"
            >
              <div
                className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gold/10 blur-2xl"
                aria-hidden
              />
              <Compass className="mb-3 h-6 w-6 text-gold" aria-hidden />
              <h2 className="font-serif-editorial text-xl font-bold">
                {__('Planning your Thailand trip?', 'suntourz')}
              </h2>
              <p className="mt-2 text-sm font-light leading-relaxed text-white/80">
                {__(
                  'Tell us how you like to travel and a specialist will design the route for you.',
                  'suntourz',
                )}
              </p>
              <button
                type="button"
                onClick={() => openPlanTrip()}
                className="stz-press mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-cream px-5 py-3 text-xs font-semibold uppercase tracking-wider text-forest hover:bg-sand-soft"
              >
                {__('Plan My Trip', 'suntourz')}
                <ArrowRight className="h-3.5 w-3.5 text-gold" aria-hidden />
              </button>
              <a
                href={data.site.toursUrl}
                className="mt-3 block text-center text-xs font-medium text-white/70 underline-offset-4 hover:text-white hover:underline"
              >
                {__('or browse our tours', 'suntourz')}
              </a>
            </section>
          </aside>
        </div>
      </Container>
    </>
  );
};

const Articles = ({ data }: { data: SiteData }) => {
  const payload = data.payload as unknown as ArticlesPayload;

  return (
    <Layout bareTop={Boolean((payload.content as { banner_image?: string }).banner_image)}>
      <ArticlesBody payload={payload} />
    </Layout>
  );
};

export default Articles;
