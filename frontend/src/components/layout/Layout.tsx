import type { ReactNode } from 'react';
import { ArrowRight, Compass, Heart } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import { useWishlist } from '@/lib/wishlist';
import { Breadcrumbs } from '../Breadcrumbs';
import { Container } from '../primitives';
import { useSite } from '@/site/context';
import { Footer } from './Footer';
import { Header } from './Header';

type LayoutProps = {
  children: ReactNode;
  /** Replaces the default mobile bar (e.g. "Book this tour" on a tour page). */
  mobileBar?: ReactNode;
  /** Home has a full-bleed hero under a transparent header; other pages start with a solid one. */
  hero?: boolean;
  /** Pages with their own full-bleed header (tour, article) draw the breadcrumbs themselves. */
  bareTop?: boolean;
};

const MobileStickyCTA = () => {
  const { openPlanTrip, openWishlist } = useSite();
  const saved = useWishlist().length;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-sand bg-cream/95 px-4 py-3 shadow-2xl backdrop-blur-md md:hidden">
      <button
        type="button"
        onClick={openWishlist}
        aria-label={__('View saved shortlist', 'suntourz')}
        className="relative shrink-0 rounded-full border border-sand bg-white p-3 text-ink"
      >
        <Heart className="h-4 w-4" aria-hidden />
        {saved > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[9px] font-bold text-forest">
            {saved}
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={() => openPlanTrip()}
        className="flex flex-1 items-center justify-center gap-2 rounded-full border border-gold/30 bg-forest px-5 py-3.5 text-sm font-semibold text-white shadow-lg active:bg-forest-soft"
      >
        <Compass className="h-4 w-4 text-gold" aria-hidden />
        <span>{__('Plan My Trip', 'suntourz')}</span>
        <ArrowRight className="h-4 w-4 text-gold" aria-hidden />
      </button>
    </div>
  );
};

export const Layout = ({ children, hero = false, mobileBar, bareTop = false }: LayoutProps) => (
  <div className="flex min-h-screen flex-col bg-cream text-ink antialiased">
    <a
      href="#stz-main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-forest focus:px-4 focus:py-2 focus:text-white"
    >
      {__('Skip to content', 'suntourz')}
    </a>
    <Header solid={!hero} />
    <main id="stz-main" className={`flex-1 ${hero ? '' : 'pt-24 sm:pt-28'}`}>
      {!hero && !bareTop && (
        <Container className="pb-5 pt-4 sm:pt-5">
          <Breadcrumbs />
        </Container>
      )}
      {children}
    </main>
    <Footer />
    {mobileBar ?? <MobileStickyCTA />}
    {/* Room for the sticky mobile bar so it never covers the footer. */}
    <div className="h-16 md:hidden" aria-hidden />
  </div>
);
