import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, Compass, Heart, HelpCircle, Mail, Menu, MessageSquare, Phone, Search, Send, X } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import { useWishlist } from '@/lib/wishlist';
import type { MenuItem } from '@/lib/types';
import { useSite, type ContactTab } from '@/site/context';

type NavItem = {
  key: string;
  label: string;
  href?: string;
  onClick?: () => void;
  badge?: string;
  children?: { key: string; label: string; href: string }[];
};

type HeaderProps = {
  /** Pages without a hero image use the solid header from the start. */
  solid: boolean;
};

const fromMenu = (items: MenuItem[]): NavItem[] =>
  items.map((item) => ({
    key: String(item.id),
    label: item.label,
    href: item.url,
    children: item.children.map((child) => ({ key: String(child.id), label: child.label, href: child.url })),
  }));

export const Header = ({ solid }: HeaderProps) => {
  const { data, contact, openPlanTrip, openContact, openWishlist } = useSite();
  const saved = useWishlist().length;
  const brand = data.content.brand;

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const compact = scrolled || solid;
  // Logo on a light header, or its white version on the transparent one (one upload is used for both).
  const logo = compact ? (brand?.logo_image || brand?.logo_image_white) : (brand?.logo_image_white || brand?.logo_image);
  const showTopBar = !compact;

  const contactAction = (tab: ContactTab) => () => {
    setMobileOpen(false);
    openContact(tab);
  };

  const trimSlash = (url: string) => url.replace(/[#?].*$/, '').replace(/\/+$/, '');

  // The "Tours" entry of a custom menu gets the destinations as a dropdown, so every destination page is one click away.
  const withDestinations = (items: NavItem[]): NavItem[] =>
    items.map((item) =>
      item.href && trimSlash(item.href) === trimSlash(data.site.toursUrl) && (item.children?.length ?? 0) === 0 && data.destinations.length > 0
        ? { ...item, children: data.destinations.map((d) => ({ key: `dest-${d.id}`, label: d.name, href: d.url })) }
        : item,
    );

  const nav: NavItem[] =
    data.menus.primary.length > 0
      ? withDestinations(fromMenu(data.menus.primary))
      : [
          { key: 'home', label: __('Home', 'suntourz'), href: data.site.url },
          { key: 'tours', label: __('Tours', 'suntourz'), href: data.site.toursUrl, badge: __('Featured', 'suntourz') },
          {
            key: 'destinations',
            label: __('Destinations', 'suntourz'),
            href: `${data.site.url}#destinations`,
            children: data.destinations.map((d) => ({ key: String(d.id), label: d.name, href: d.url })),
          },
          { key: 'experiences', label: __('Experiences', 'suntourz'), href: `${data.site.url}#experiences` },
          { key: 'guide', label: __('Blog & Guide', 'suntourz'), href: data.site.blogUrl },
          { key: 'about', label: __('About Us', 'suntourz'), onClick: contactAction('about') },
          { key: 'contact', label: __('Contact Us', 'suntourz'), onClick: contactAction('contact') },
        ];

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const term = query.trim();
    window.location.href = term ? `${data.site.toursUrl}?search=${encodeURIComponent(term)}` : data.site.toursUrl;
  };

  const linkClass = `relative py-1 text-sm font-semibold tracking-wide transition-colors duration-300 hover:text-gold after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-gold after:transition-transform after:duration-500 after:ease-[var(--stz-ease)] hover:after:scale-x-100 ${
    compact ? 'text-ink' : 'text-white/95'
  }`;
  const iconButton = `rounded-full p-2 transition-colors ${compact ? 'text-ink hover:bg-sand-soft' : 'text-white/90 hover:bg-white/15'}`;

  const waHref = contact.whatsapp ? `https://wa.me/${contact.whatsapp}` : '';

  return (
    <>
      {showTopBar && (
        <div
          className="fixed left-0 right-0 z-50 border-b border-white/10 bg-forest-deep py-1.5 text-xs text-white/80"
          style={{ top: 'var(--stz-admin-offset)' }}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="no-scrollbar flex items-center gap-4 overflow-x-auto sm:gap-6">
              {contact.phone && (
                <a
                  href={`tel:${contact.phone}`}
                  className="flex items-center gap-1.5 whitespace-nowrap font-medium transition-colors hover:text-gold"
                >
                  <Phone className="h-3 w-3 text-gold" aria-hidden />
                  <span>
                    {__('Call Us:', 'suntourz')} <strong className="font-mono text-white">{contact.phone}</strong>
                  </span>
                </a>
              )}
              {waHref && (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden items-center gap-1.5 whitespace-nowrap transition-colors hover:text-whatsapp sm:flex"
                >
                  <MessageSquare className="h-3 w-3 text-whatsapp" aria-hidden />
                  <span>WhatsApp</span>
                </a>
              )}
              {contact.telegram && (
                <a
                  href={`https://t.me/${contact.telegram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden items-center gap-1.5 whitespace-nowrap transition-colors hover:text-telegram md:flex"
                >
                  <Send className="h-3 w-3 text-telegram" aria-hidden />
                  <span>Telegram</span>
                </a>
              )}
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="hidden items-center gap-1.5 whitespace-nowrap transition-colors hover:text-gold lg:flex"
                >
                  <Mail className="h-3 w-3 text-gold" aria-hidden />
                  <span>{contact.email}</span>
                </a>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-3 text-[11px] sm:gap-5">
              <button type="button" onClick={() => openContact('faq')} className="flex items-center gap-1 transition-colors hover:text-white">
                <HelpCircle className="h-3 w-3 text-gold" aria-hidden />
                <span className="hidden sm:inline">{__('FAQs & Help', 'suntourz')}</span>
              </button>
              <button type="button" onClick={() => openContact('policy')} className="hidden transition-colors hover:text-white sm:inline">
                {__('Cancellation Policy', 'suntourz')}
              </button>
              {brand?.top_bar_label && (
                <>
                  <div className="hidden h-3 w-px bg-white/20 sm:block" />
                  <span className="hidden text-white/60 md:inline">{brand.top_bar_label}</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <header
        className={`fixed left-0 right-0 z-40 transition-all duration-300 ${
          compact
            ? 'border-b border-sand bg-cream/95 py-3 shadow-xs backdrop-blur-md'
            : 'bg-gradient-to-b from-black/70 via-black/40 to-transparent py-4 text-white'
        }`}
        style={{ top: compact ? 'var(--stz-admin-offset)' : 'calc(var(--stz-admin-offset) + 31px)' }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href={data.site.url} className="group flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-gold">
            {logo ? (
              <img src={logo} alt={data.site.name} className="h-10 w-auto max-w-[180px] object-contain sm:h-11 sm:max-w-[220px]" />
            ) : (
              <>
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl shadow-xs transition-colors ${
                  compact ? 'bg-forest text-gold' : 'bg-white/15 text-sand-soft backdrop-blur-xs'
                }`}
              >
                <Compass className="h-5 w-5 transition-transform duration-700 group-hover:rotate-45" aria-hidden />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className={`font-friendly text-xl font-extrabold tracking-tight ${compact ? 'text-forest' : 'text-white'}`}>
                    {data.site.name}
                  </span>
                  {brand?.badge && (
                    <span className="rounded-full border border-gold/50 bg-gold/25 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold">
                      {brand.badge}
                    </span>
                  )}
                </div>
                {brand?.tagline && (
                  <p className={`text-[10px] font-medium tracking-wider ${compact ? 'text-muted' : 'text-white/80'}`}>{brand.tagline}</p>
                )}
              </div>
              </>
            )}
          </a>

          <nav aria-label={__('Primary', 'suntourz')} className="hidden items-center gap-6 lg:flex xl:gap-8">
            {nav.map((item) =>
              item.children && item.children.length > 0 ? (
                <div
                  key={item.key}
                  className="relative"
                  onMouseEnter={() => setOpenMenu(item.key)}
                  onMouseLeave={() => setOpenMenu(null)}
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) setOpenMenu(null);
                  }}
                >
                  <a
                    href={item.href}
                    aria-haspopup="true"
                    aria-expanded={openMenu === item.key}
                    onKeyDown={(event) => event.key === 'Escape' && setOpenMenu(null)}
                    onFocus={() => setOpenMenu(item.key)}
                    className={`flex items-center gap-1 ${linkClass}`}
                  >
                    {item.label}
                    <span className="text-xs" aria-hidden>▾</span>
                  </a>
                  {openMenu === item.key && (
                    <div className="absolute left-0 top-full w-64 pt-2">
                      <div className="rounded-xl border border-sand bg-cream px-1 py-2 text-ink shadow-xl">
                        {item.children.map((child) => (
                          <a
                            key={child.key}
                            href={child.href}
                            className="flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors hover:bg-sand-soft hover:text-forest"
                          >
                            <span>{child.label}</span>
                            <span className="text-[11px] font-normal text-muted-soft">{__('View Tours →', 'suntourz')}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : item.onClick ? (
                <button key={item.key} type="button" onClick={item.onClick} className={linkClass}>
                  {item.label}
                </button>
              ) : (
                <a key={item.key} href={item.href} className={`flex items-center gap-1.5 ${linkClass}`}>
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="rounded-full bg-gold/20 px-1.5 text-[10px] font-bold text-gold">{item.badge}</span>
                  )}
                </a>
              ),
            )}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button type="button" onClick={() => setSearchOpen(!searchOpen)} aria-label={__('Search tours and destinations', 'suntourz')} aria-expanded={searchOpen} className={iconButton}>
              <Search className="h-4 w-4" aria-hidden />
            </button>

            <button type="button" onClick={openWishlist} aria-label={__('Saved journeys', 'suntourz')} className={`relative ${iconButton}`}>
              <Heart className="h-4 w-4" aria-hidden />
              {saved > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[9px] font-bold text-forest">
                  {saved}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => openPlanTrip()}
              className="group relative hidden overflow-hidden rounded-full border border-gold/40 bg-forest px-4 py-2.5 text-xs font-semibold tracking-wide text-white transition-all duration-300 hover:bg-forest-soft hover:shadow-md sm:block sm:px-5 sm:text-sm"
            >
              <span className="relative z-10 flex items-center gap-1.5">
                <span>{__('Plan My Trip', 'suntourz')}</span>
                <ArrowRight className="h-3.5 w-3.5 text-gold transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={__('Toggle navigation menu', 'suntourz')}
              aria-expanded={mobileOpen}
              className={`rounded-lg p-2 transition-colors lg:hidden ${compact ? 'text-ink hover:bg-sand-soft' : 'text-white hover:bg-white/15'}`}
            >
              {mobileOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
            </button>
          </div>
        </div>

        {searchOpen && (
          <form onSubmit={submitSearch} role="search" className="border-t border-sand bg-cream px-4 py-4 text-ink shadow-md">
            <div className="mx-auto flex max-w-3xl items-center gap-3">
              <Search className="h-5 w-5 text-muted-soft" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={__('Search Thailand tours, islands, Phuket, Bangkok, luxury villas...', 'suntourz')}
                aria-label={__('Search tours', 'suntourz')}
                className="w-full bg-transparent text-sm placeholder:text-muted-soft focus:outline-none sm:text-base"
                autoFocus
              />
              <button type="submit" className="rounded-full bg-forest px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-forest-soft">
                {__('Search', 'suntourz')}
              </button>
              <button type="button" onClick={() => setSearchOpen(false)} aria-label={__('Close search', 'suntourz')} className="p-1 text-sm text-muted-soft hover:text-ink">
                ✕
              </button>
            </div>
          </form>
        )}
      </header>

      {mobileOpen && (
        <div className="stz-fade-in fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={__('Navigation menu', 'suntourz')}
            onClick={(event) => event.stopPropagation()}
            className="stz-drawer-in fixed bottom-0 right-0 top-0 flex w-full max-w-xs flex-col justify-between overflow-y-auto bg-cream p-6 shadow-2xl"
          >
            <div>
              <div className="flex items-center justify-between border-b border-sand pb-5">
                <div>
                  <span className="font-friendly text-xl font-extrabold tracking-tight text-forest">{data.site.name}</span>
                  {brand?.tagline && <p className="text-[10px] tracking-wider text-muted-soft">{brand.tagline}</p>}
                </div>
                <button type="button" onClick={() => setMobileOpen(false)} aria-label={__('Close menu', 'suntourz')} className="rounded-full p-2 text-ink hover:bg-sand-soft">
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>

              {(contact.phone || waHref || contact.telegram) && (
                <div className="mt-4 space-y-2 rounded-xl border border-sand bg-white p-3">
                  {contact.phone && (
                    <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 text-xs font-bold text-forest hover:text-gold">
                      <Phone className="h-3.5 w-3.5 text-gold" aria-hidden />
                      <span>
                        {__('Call', 'suntourz')} {contact.phone}
                      </span>
                    </a>
                  )}
                  <div className="flex items-center gap-2 border-t border-sand/60 pt-1">
                    {waHref && (
                      <a href={waHref} target="_blank" rel="noopener noreferrer" className="flex-1 rounded-lg bg-whatsapp/10 py-1.5 text-center text-xs font-semibold text-whatsapp hover:bg-whatsapp/20">
                        WhatsApp
                      </a>
                    )}
                    {contact.telegram && (
                      <a href={`https://t.me/${contact.telegram}`} target="_blank" rel="noopener noreferrer" className="flex-1 rounded-lg bg-telegram/10 py-1.5 text-center text-xs font-semibold text-telegram hover:bg-telegram/20">
                        Telegram
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-4 flex flex-col gap-2">
                {nav.map((item) => (
                  <div key={item.key}>
                    {item.onClick ? (
                      <button type="button" onClick={item.onClick} className="w-full border-b border-sand/60 py-2 text-left text-sm font-semibold text-ink hover:text-gold">
                        {item.label}
                      </button>
                    ) : (
                      <a href={item.href} onClick={() => setMobileOpen(false)} className="block border-b border-sand/60 py-2 text-sm font-semibold text-ink hover:text-gold">
                        {item.label}
                      </a>
                    )}
                    {item.children?.map((child) => (
                      <a key={child.key} href={child.href} onClick={() => setMobileOpen(false)} className="block border-b border-sand/40 py-1.5 pl-4 text-xs text-muted hover:text-gold">
                        {child.label}
                      </a>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-sand pt-6">
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  openPlanTrip();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-forest py-3.5 text-sm font-semibold text-white shadow-md hover:bg-forest-soft"
              >
                <span>{__('Plan My Trip', 'suntourz')}</span>
                <ArrowRight className="h-4 w-4 text-gold" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
