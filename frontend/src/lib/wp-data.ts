import type { PageName, SiteData } from './types';

const EMPTY: SiteData = {
  page: 'NotFound',
  site: {
    name: 'Suntourz',
    description: '',
    url: '/',
    toursUrl: '/tours/',
    blogUrl: '/blog/',
    planUrl: '/',
    bookingSuccessUrl: '/booking/success/',
    restUrl: '/wp-json/',
    locale: 'en_US',
    pluginActive: false,
  },
  menus: { primary: [], footer: [] },
  contact: {},
  booking: { turnstileKey: '', terms: '' },
  content: {},
  currency: null,
  destinations: [],
  styles: [],
  breadcrumbs: [],
  topTours: [],
  payload: {},
};

/** Reads the JSON payload the PHP template prints before the mount node. */
export const readSiteData = (page: PageName): SiteData => {
  const node = document.getElementById('stz-data');
  if (!node?.textContent) return { ...EMPTY, page };

  try {
    const parsed = JSON.parse(node.textContent) as Partial<SiteData>;
    // PHP encodes empty maps as [] — keep the shapes the components expect.
    return {
      ...EMPTY,
      ...parsed,
      contact: Array.isArray(parsed.contact) ? {} : (parsed.contact ?? {}),
      content: Array.isArray(parsed.content) ? {} : (parsed.content ?? {}),
      page,
    };
  } catch {
    return { ...EMPTY, page };
  }
};
