import type { ReactNode } from 'react';
import { Layout } from '@/components/layout/Layout';
import { DestinationsSection } from '@/components/sections/DestinationsSection';
import { FeaturedTours } from '@/components/sections/FeaturedTours';
import { Hero } from '@/components/sections/Hero';
import {
  ExperiencesSection,
  FinalCTA,
  LovedByTravelers,
  TravelGuideSection,
  VisualJourney,
  WhySuntourz,
} from '@/components/sections/StorySections';
import { TourFinder } from '@/components/sections/TourFinder';
import type { HomePayload, SiteData } from '@/lib/types';

/** Default order; the editor (Settings → Home content → Sections) can reorder or hide any of them. */
const DEFAULT_ORDER = ['featured', 'destinations', 'why', 'experiences', 'finder', 'guide', 'reviews', 'gallery', 'final_cta'];

const Home = ({ data }: { data: SiteData }) => {
  const home = data.payload as unknown as HomePayload;
  const { content } = home;

  const sections: Record<string, ReactNode> = {
    featured: <FeaturedTours tours={home.featured} total={home.toursTotal} copy={content.featured} />,
    destinations: <DestinationsSection destinations={home.destinations} copy={content.destinations} />,
    why: <WhySuntourz copy={content.why} />,
    experiences: <ExperiencesSection styles={home.styles} copy={content.experiences} />,
    finder: (
      <TourFinder mode="home" initial={home.finder} initialFilters={{}} destinations={home.destinations} styles={home.styles} copy={content.finder} />
    ),
    guide: <TravelGuideSection articles={home.articles} copy={content.guide} />,
    reviews: <LovedByTravelers copy={content.reviews} reviews={home.reviews.items} overall={home.reviews.overall} />,
    gallery: <VisualJourney copy={content.gallery} />,
    final_cta: <FinalCTA copy={content.final_cta} />,
  };

  // Saved order first (hidden ones skipped), then any section the saved list does not mention yet.
  const saved = (content.sections ?? []).filter((item) => item.id in sections);
  const known = new Set(saved.map((item) => item.id));
  const layout = [...saved, ...DEFAULT_ORDER.filter((id) => !known.has(id)).map((id) => ({ id, enabled: true }))];

  return (
    <Layout hero>
      <Hero hero={content.hero} destinations={home.destinations} />
      {layout.filter((item) => item.enabled).map((item) => (
        <div key={item.id}>{sections[item.id]}</div>
      ))}
    </Layout>
  );
};

export default Home;
