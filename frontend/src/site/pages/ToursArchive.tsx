import { Layout } from '@/components/layout/Layout';
import { PageBanner } from '@/components/PageBanner';
import { Container, Eyebrow } from '@/components/primitives';
import { TourFinder } from '@/components/sections/TourFinder';
import type { ArchivePayload, SiteData, ToursQuery } from '@/lib/types';
import { __ } from '@wordpress/i18n';

const ToursArchive = ({ data }: { data: SiteData }) => {
  const page = data.payload as unknown as ArchivePayload;

  // PHP encodes empty maps as [] — normalize before use.
  const asQuery = (value: unknown): ToursQuery => (value && !Array.isArray(value) ? (value as ToursQuery) : {});

  // The main archive uses the editable copy/banner; destination and style pages keep their own term title.
  const isMain = Object.keys(asQuery(page.preset)).length === 0;
  const copy = isMain && page.page && !Array.isArray(page.page) ? page.page : undefined;
  const title = copy?.title || page.heading;
  const intro = isMain ? copy?.subtitle || page.intro : page.intro;
  const eyebrow = copy?.eyebrow || __('Tour Collection', 'suntourz');
  const banner = isMain ? copy?.banner_image : '';

  return (
    <Layout bareTop={Boolean(banner)}>
      {banner ? (
        <div className="mb-10">
          <PageBanner eyebrow={eyebrow} title={title} subtitle={intro} image={banner} />
        </div>
      ) : (
        <Container className="pb-10">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="font-serif-editorial text-3xl font-bold tracking-tight text-ink sm:text-4xl md:text-5xl">{title}</h1>
          {intro && <p className="mt-3 max-w-2xl text-base font-light text-muted sm:text-lg">{intro}</p>}
        </Container>
      )}
      <TourFinder
        mode="archive"
        initial={page.result}
        initialFilters={asQuery(page.filters)}
        locked={asQuery(page.preset)}
        destinations={page.destinations}
        styles={page.styles}
      />
    </Layout>
  );
};

export default ToursArchive;
