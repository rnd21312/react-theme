import { __ } from '@wordpress/i18n';
import { Layout } from '@/components/layout/Layout';
import { Container } from '@/components/primitives';
import type { SiteData } from '@/lib/types';

const NotFound = ({ data }: { data: SiteData }) => (
  <Layout>
    <Container className="py-24 text-center">
      <p className="text-sm uppercase tracking-widest text-gold-dark">404</p>
      <h1 className="font-serif-editorial mt-2 text-4xl font-bold text-forest">{__('Page not found', 'suntourz')}</h1>
      <p className="mx-auto mt-3 max-w-md text-muted">{__('The page you are looking for has moved or no longer exists.', 'suntourz')}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <a href={data.site.url} className="rounded-full bg-forest px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white hover:bg-forest-soft">
          {__('Back to home', 'suntourz')}
        </a>
        <a href={data.site.toursUrl} className="rounded-full border border-forest/30 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-forest hover:bg-white">
          {__('Browse tours', 'suntourz')}
        </a>
      </div>
    </Container>
  </Layout>
);

export default NotFound;
