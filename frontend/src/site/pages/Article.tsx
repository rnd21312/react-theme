import { ArrowRight, Calendar, Clock, User } from 'lucide-react';
import { __, sprintf } from '@wordpress/i18n';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Layout } from '@/components/layout/Layout';
import { Container, Eyebrow, Img } from '@/components/primitives';
import { TourCard } from '@/components/TourCard';
import { reveal, stagger } from '@/lib/reveal';
import type { ArticlePayload, SiteData } from '@/lib/types';
import { useSite } from '@/site/context';
import { ArticleCard } from './Articles';

const ArticleBody = ({ payload }: { payload: ArticlePayload }) => {
  const { article, related, tours = [] } = payload;
  const { data, openPlanTrip } = useSite();

  return (
    <>
      <header className="relative -mt-24 h-[52vh] min-h-[360px] overflow-hidden bg-forest sm:-mt-28">
        {article.image && <Img image={article.image} alt={article.title} eager sizes="100vw" className="h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/30" />
        <Container className="absolute inset-x-0 bottom-0 max-w-4xl pb-8 text-white">
          <Breadcrumbs light className="mb-4" />
          <span className="mb-3 inline-block rounded-full bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-forest">{article.category}</span>
          <h1 className="font-serif-editorial text-3xl font-bold sm:text-5xl">{article.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-white/80">
            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-gold" aria-hidden />{sprintf(__('%d min read', 'suntourz'), article.read_minutes)}</span>
            <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-gold" aria-hidden />{article.date}</span>
          </div>
        </Container>
      </header>

      <Container className="max-w-3xl py-12">
        <div className="flex items-center justify-between border-b border-sand pb-4 text-xs text-muted-soft">
          <span className="flex items-center gap-1.5 font-medium text-ink"><User className="h-3.5 w-3.5 text-forest" aria-hidden />{article.author}</span>
          <a href={data.site.blogUrl} className="text-forest underline">{__('All articles', 'suntourz')}</a>
        </div>

        {article.excerpt && <p className="font-serif-editorial mt-6 text-lg italic leading-relaxed text-ink sm:text-xl">“{article.excerpt}”</p>}
        <div className="stz-prose mt-6" dangerouslySetInnerHTML={{ __html: article.content ?? '' }} />

        <div className="mt-10 rounded-2xl border border-sand bg-white p-6 shadow-2xs">
          <h2 className="font-serif-editorial mb-1 text-sm font-bold uppercase tracking-wider text-forest">{__('Need personalized guidance on this topic?', 'suntourz')}</h2>
          <p className="text-xs font-light text-muted sm:text-sm">{__('Our travel specialists will map out your route, weather window, and private boat timings directly.', 'suntourz')}</p>
          <button type="button" onClick={() => openPlanTrip({ notes: sprintf(__('I read "%s" and would like advice.', 'suntourz'), article.title) })} className="mt-4 rounded-full bg-forest px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-forest-soft">
            {__('Consult a Specialist', 'suntourz')}
          </button>
        </div>
      </Container>

      {tours.length > 0 && (
        <section aria-labelledby="stz-article-tours" className="border-t border-sand bg-sand-soft/50 py-14 sm:py-20">
          <Container>
            <div {...reveal()} className="mb-8 flex flex-col justify-between gap-4 sm:mb-10 md:flex-row md:items-end">
              <div>
                <Eyebrow>{__('Ready to go?', 'suntourz')}</Eyebrow>
                <h2 id="stz-article-tours" className="font-serif-editorial text-2xl font-bold tracking-tight text-ink sm:text-3xl">{__('Tours that bring this guide to life', 'suntourz')}</h2>
              </div>
              <a href={data.site.toursUrl} className="group inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-forest transition-colors hover:text-gold">
                <span>{__('View all tours', 'suntourz')}</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
              </a>
            </div>
            <div className={`grid grid-cols-1 gap-8 md:grid-cols-2 ${tours.length >= 3 ? 'lg:grid-cols-3' : ''}`}>
              {tours.map((tour, index) => <TourCard key={tour.id} tour={tour} delay={stagger(index)} />)}
            </div>
          </Container>
        </section>
      )}

      {related.length > 0 && (
        <Container className="py-16 sm:py-20">
          <h2 className="font-serif-editorial mb-6 text-2xl font-bold text-ink">{__('Keep reading', 'suntourz')}</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.slice(0, 3).map((item, index) => <ArticleCard key={item.id} article={item} delay={stagger(index)} />)}
          </div>
        </Container>
      )}
    </>
  );
};

const Article = ({ data }: { data: SiteData }) => (
  <Layout bareTop>
    <ArticleBody payload={data.payload as unknown as ArticlePayload} />
  </Layout>
);

export default Article;
