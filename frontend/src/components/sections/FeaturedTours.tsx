import { ArrowRight } from 'lucide-react';
import { __, sprintf } from '@wordpress/i18n';
import type { SiteContent, TourCard as TourCardData } from '@/lib/types';
import { stagger } from '@/lib/reveal';
import { useSite } from '@/site/context';
import { Container, SectionHeader } from '../primitives';
import { TourCard } from '../TourCard';

type FeaturedToursProps = { tours: TourCardData[]; total: number; copy: SiteContent['featured'] };

export const FeaturedTours = ({ tours, total, copy }: FeaturedToursProps) => {
  const { data } = useSite();
  if (tours.length === 0) return null;
  // The lead card spans two columns only when that still fills every row of the 3-column grid.
  const hasWideLead = (tours.length - 1) % 3 === 1;

  return (
    <section id="featured-tours" className="bg-cream py-20 sm:py-28">
      <Container>
        <SectionHeader
          {...copy}
          aside={
            <a
              href={data.site.toursUrl}
              className="group inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-forest transition-colors hover:text-gold"
            >
              <span>{sprintf(__('Explore All Journeys (%d)', 'suntourz'), total)}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
            </a>
          }
        />

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {tours.map((tour, index) => (
            <TourCard key={tour.id} tour={tour} variant={hasWideLead && index === 0 ? 'wide' : 'standard'} delay={stagger(index)} />
          ))}
        </div>
      </Container>
    </section>
  );
};
