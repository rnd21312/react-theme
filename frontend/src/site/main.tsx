import { lazy, StrictMode, Suspense, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { configureApi } from '@/lib/publicApi';
import type { PageName, SiteData } from '@/lib/types';
import { readSiteData } from '@/lib/wp-data';
import '@/styles/site.css';
import { SiteProvider } from './context';

type PageProps = { data: SiteData };

// One chunk per page.
const pages: Partial<Record<PageName, () => Promise<{ default: ComponentType<PageProps> }>>> = {
  Home: () => import('./pages/Home'),
  ToursArchive: () => import('./pages/ToursArchive'),
  TourSingle: () => import('./pages/TourSingle'),
  Page: () => import('./pages/Page'),
  Articles: () => import('./pages/Articles'),
  Article: () => import('./pages/Article'),
  PlanMyTrip: () => import('./pages/PlanMyTrip'),
  BookingSuccess: () => import('./pages/BookingSuccess'),
  NotFound: () => import('./pages/NotFound'),
};

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/** Lifts the splash screen once the page is painted: fonts and the hero picture are given a moment so nothing pops in. */
const lift = async (container: HTMLElement, fallback: ChildNode[]) => {
  const hero = container.querySelector<HTMLImageElement>('img[fetchpriority="high"]');
  const fonts = 'fonts' in document ? document.fonts.ready.then(() => undefined) : Promise.resolve();
  const picture = hero && !hero.complete ? new Promise<void>((resolve) => {
    hero.addEventListener('load', () => resolve(), { once: true });
    hero.addEventListener('error', () => resolve(), { once: true });
  }) : Promise.resolve();

  await Promise.race([Promise.all([fonts, picture]), wait(1400)]);

  // Next frame: the browser has laid out the React tree before the splash starts fading.
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

  fallback.forEach((node) => node.remove());
  document.documentElement.classList.add('stz-ready');
  try {
    sessionStorage.setItem('stz-seen', '1');
  } catch {
    // Private mode: the full splash simply shows again next time.
  }
  window.setTimeout(() => document.getElementById('stz-splash')?.remove(), 900);
};

/** Fetches a page when the pointer rests on its link, so the click feels instant. */
const prefetchOnIntent = () => {
  const seen = new Set<string>();
  let timer = 0;

  const prefetch = (event: Event) => {
    const link = (event.target as Element | null)?.closest?.('a[href]');
    if (!(link instanceof HTMLAnchorElement)) return;
    if (link.origin !== window.location.origin || link.target === '_blank' || link.hasAttribute('download')) return;
    if (link.pathname.startsWith('/wp-admin') || link.pathname.startsWith('/wp-login')) return;

    const url = link.href.split('#')[0] ?? '';
    if (!url || url === window.location.href.split('#')[0] || seen.has(url)) return;

    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      seen.add(url);
      const hint = document.createElement('link');
      hint.rel = 'prefetch';
      hint.href = url;
      document.head.appendChild(hint);
    }, 90);
  };

  document.addEventListener('pointerover', prefetch, { passive: true });
  document.addEventListener('touchstart', prefetch, { passive: true });
  document.addEventListener('pointerout', () => window.clearTimeout(timer), { passive: true });
};

const mount = () => {
  const rootEl = document.getElementById('stz-root');
  if (!rootEl) return;

  const name = (rootEl.dataset.page ?? 'NotFound') as PageName;
  const loader = pages[name] ?? pages.NotFound;
  if (!loader) return;

  const data = readSiteData(name);
  configureApi(data.site.restUrl);
  const Page = lazy(loader);

  // createRoot (not hydrate): the PHP fallback markup is replaced, not reconciled.
  // React renders into its own element next to the fallback. The fallback stays in the DOM (hidden
  // from view, still readable by crawlers and screen readers) until the page has painted, then goes.
  const fallback = Array.from(rootEl.childNodes);
  const container = document.createElement('div');
  rootEl.appendChild(container);
  createRoot(container).render(
    <StrictMode>
      <SiteProvider data={data}>
        <Suspense fallback={null}>
          <Page data={data} />
        </Suspense>
      </SiteProvider>
    </StrictMode>,
  );

  const observer = new MutationObserver(() => {
    if (container.childNodes.length > 0) {
      observer.disconnect();
      void lift(container, fallback);
    }
  });
  observer.observe(container, { childList: true });

  prefetchOnIntent();
};

mount();
