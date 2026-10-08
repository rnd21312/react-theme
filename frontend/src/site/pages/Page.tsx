import { ArrowRight, Compass, MessageSquare, Phone } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Layout } from '@/components/layout/Layout';
import { Container, Eyebrow, Img } from '@/components/primitives';
import { TourCard } from '@/components/TourCard';
import { reveal, stagger } from '@/lib/reveal';
import type { PagePayload, SiteData } from '@/lib/types';
import { useSite } from '@/site/context';

/** The "talk to us" card beside the content: every channel keeps the visitor on a clear path. */
const HelpCard = () => {
  const { data, contact, openPlanTrip } = useSite();
  const waHref = contact.whatsapp ? `https://wa.me/${contact.whatsapp}` : '';

  return (
    <aside {...reveal(120)} className="relative overflow-hidden rounded-2xl bg-forest p-6 text-white shadow-lg lg:sticky lg:top-28">
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-gold/10 blur-2xl" aria-hidden />
      <Compass className="mb-3 h-6 w-6 text-gold" aria-hidden />
      <h2 className="font-serif-editorial text-xl font-bold">{__('Talk to a Thailand specialist', 'suntourz')}</h2>
      <p className="mt-2 text-sm font-light leading-relaxed text-white/80">
        {contact.response ? `${__('We usually reply', 'suntourz')} ${contact.response}.` : __('Tell us what you have in mind and we will design the route.', 'suntourz')}
      </p>

      <button
        type="button"
        onClick={() => openPlanTrip()}
        className="stz-press mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-cream px-5 py-3 text-xs font-semibold uppercase tracking-wider text-forest hover:bg-sand-soft"
      >
        {__('Plan My Trip', 'suntourz')}
        <ArrowRight className="h-3.5 w-3.5 text-gold" aria-hidden />
      </button>

      {(waHref || contact.phone) && (
        <div className="mt-4 space-y-2 border-t border-white/15 pt-4 text-sm">
          {waHref && (
            <a href={waHref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-white/85 transition-colors hover:text-white">
              <MessageSquare className="h-4 w-4 text-whatsapp" aria-hidden />
              {__('Chat on WhatsApp', 'suntourz')}
            </a>
          )}
          {contact.phone && (
            <a href={`tel:${contact.phone}`} className="flex items-center gap-2.5 text-white/85 transition-colors hover:text-white">
              <Phone className="h-4 w-4 text-gold" aria-hidden />
              <span className="font-mono">{contact.phone}</span>
            </a>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-white/15 pt-4 text-xs text-white/70">
        <a href={data.site.toursUrl} className="hover:text-white">{__('Browse tours', 'suntourz')}</a>
        <a href={data.site.blogUrl} className="hover:text-white">{__('Travel guide', 'suntourz')}</a>
      </div>
    </aside>
  );
};

/** Generic WordPress page (About, Contact, Terms…). `content` is WordPress's own the_content() output. */
const Page = ({ data }: { data: SiteData }) => {
  const page = data.payload as unknown as PagePayload;
  const tours = page.tours ?? [];

  return (
    <Layout bareTop>
      <header className="relative overflow-hidden border-b border-sand bg-sand-soft/60 pb-10 pt-4 sm:pb-14">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold/10 blur-3xl" aria-hidden />
        <Container>
          <Breadcrumbs className="mb-6 mt-4" />
          <Eyebrow>{data.site.name}</Eyebrow>
          <h1 className="font-serif-editorial max-w-4xl text-3xl font-bold tracking-tight text-ink sm:text-5xl">{page.title}</h1>
        </Container>
      </header>

      <Container className="grid gap-10 py-10 sm:py-14 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-14">
        <div className="min-w-0">
          {page.image && <Img src={page.image} alt="" eager sizes="(min-width: 1024px) 60vw, 100vw" className="mb-8 aspect-[16/8] w-full rounded-3xl object-cover shadow-lg" />}
          <div {...reveal()} className="stz-prose" dangerouslySetInnerHTML={{ __html: page.content }} />
        </div>
        <HelpCard />
      </Container>

      {tours.length > 0 && (
        <section aria-labelledby="stz-page-tours" className="border-t border-sand bg-sand-soft/50 py-14 sm:py-20">
          <Container>
            <div {...reveal()} className="mb-8 flex flex-col justify-between gap-4 sm:mb-10 md:flex-row md:items-end">
              <div>
                <Eyebrow>{__('Ready to go?', 'suntourz')}</Eyebrow>
                <h2 id="stz-page-tours" className="font-serif-editorial text-2xl font-bold tracking-tight text-ink sm:text-3xl">{__('Our most-loved Thailand tours', 'suntourz')}</h2>
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
    </Layout>
  );
};

export default Page;
