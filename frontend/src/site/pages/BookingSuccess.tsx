import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, Copy, MessageSquare } from 'lucide-react';
import { __, sprintf } from '@wordpress/i18n';
import { BOOKING_EMAIL_KEY } from '@/components/BookingForm';
import { Layout } from '@/components/layout/Layout';
import { Container } from '@/components/primitives';
import { formatDate, formatMoney } from '@/lib/format';
import { api } from '@/lib/publicApi';
import type { BookingSummary } from '@/lib/types';
import { useSite } from '@/site/context';

const readEmail = (): string => {
  try {
    return sessionStorage.getItem(BOOKING_EMAIL_KEY) ?? '';
  } catch {
    return '';
  }
};

const Body = () => {
  const { data, contact, toast } = useSite();
  const code = (new URLSearchParams(window.location.search).get('code') ?? '').toUpperCase();
  const [email, setEmail] = useState(readEmail);
  const [summary, setSummary] = useState<BookingSummary | null>(null);
  const [loading, setLoading] = useState(Boolean(code && email));
  const [notFound, setNotFound] = useState(false);

  const load = (address: string) => {
    setLoading(true);
    setNotFound(false);
    api
      .bookingSummary(code, address)
      .then(setSummary)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (code && email) load(email);
    // Only on first render: later lookups come from the form below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lookup = (event: FormEvent) => {
    event.preventDefault();
    try {
      sessionStorage.setItem(BOOKING_EMAIL_KEY, email.trim());
    } catch {
      // ignore
    }
    load(email.trim());
  };

  const copy = () => {
    void navigator.clipboard?.writeText(code).then(() => toast(__('Booking code copied', 'suntourz')));
  };

  if (!code) {
    return (
      <Container className="max-w-xl py-20 text-center">
        <h1 className="font-serif-editorial text-3xl font-bold text-forest">{__('No booking selected', 'suntourz')}</h1>
        <a href={data.site.toursUrl} className="mt-6 inline-block rounded-full bg-forest px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white">
          {__('Browse tours', 'suntourz')}
        </a>
      </Container>
    );
  }

  const waText = sprintf(__('Hello! My booking code is %s.', 'suntourz'), code);
  const row = 'flex justify-between gap-4 border-b border-sand/70 py-2 text-sm';

  return (
    <Container className="max-w-2xl pb-20">
      <div className="rounded-3xl border border-sand bg-white p-8 text-center shadow-lg sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-forest text-gold shadow-lg">
          <CheckCircle2 className="h-8 w-8" aria-hidden />
        </div>
        <h1 className="font-serif-editorial mt-5 text-3xl font-bold text-forest">{__('Thank you — your request was received', 'suntourz')}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm font-light text-muted">
          {sprintf(__('This is not a confirmation yet. We will contact you %s to confirm your seats and arrange payment.', 'suntourz'), summary?.response_time ?? contact.response ?? __('shortly', 'suntourz'))}
        </p>

        <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-gold/50 bg-cream px-6 py-3">
          <div className="text-left">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-muted-soft">{__('Booking code', 'suntourz')}</span>
            <span className="font-mono text-2xl font-bold tracking-wider text-forest">{code}</span>
          </div>
          <button type="button" onClick={copy} aria-label={__('Copy booking code', 'suntourz')} className="rounded-full border border-sand p-2 text-forest hover:bg-white">
            <Copy className="h-4 w-4" aria-hidden />
          </button>
        </div>

        {loading && <p className="mt-6 text-sm text-muted">{__('Loading your booking…', 'suntourz')}</p>}

        {summary && (
          <dl className="mt-8 text-left">
            <div className={row}><dt className="text-muted">{__('Tour', 'suntourz')}</dt><dd className="text-right font-semibold text-ink"><a href={summary.tour.url} className="underline">{summary.tour.title}</a></dd></div>
            <div className={row}><dt className="text-muted">{__('Dates', 'suntourz')}</dt><dd className="font-semibold text-ink">{formatDate(summary.start_date, data.site.locale)} – {formatDate(summary.end_date, data.site.locale)}</dd></div>
            <div className={row}><dt className="text-muted">{__('Plan', 'suntourz')}</dt><dd className="font-semibold text-ink">{summary.plan}</dd></div>
            <div className={row}><dt className="text-muted">{__('Travellers', 'suntourz')}</dt><dd className="font-semibold text-ink">{summary.pax}</dd></div>
            <div className={row}><dt className="text-muted">{__('Estimated total', 'suntourz')}</dt><dd className="font-serif-editorial text-lg font-bold text-forest">{formatMoney(summary.total, summary.currency)}</dd></div>
          </dl>
        )}

        {!summary && !loading && (
          <form onSubmit={lookup} className="mx-auto mt-8 max-w-sm space-y-3 text-left">
            <label htmlFor="stz-success-email" className="block text-xs font-bold uppercase tracking-wider text-forest">
              {__('Enter the email you booked with to see your summary', 'suntourz')}
            </label>
            <input id="stz-success-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-sand p-3 text-sm focus:border-forest focus:outline-none" />
            {notFound && <p role="alert" className="text-xs text-clay">{__('We could not find a booking with that code and email.', 'suntourz')}</p>}
            <button type="submit" className="rounded-full bg-forest px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-forest-soft">{__('Show my booking', 'suntourz')}</button>
          </form>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {contact.whatsapp && (
            <a href={`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-full bg-whatsapp px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white hover:opacity-90">
              <MessageSquare className="h-4 w-4" aria-hidden />
              {__('Chat on WhatsApp', 'suntourz')}
            </a>
          )}
          <a href={data.site.url} className="rounded-full border border-forest/30 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-forest hover:bg-cream">{__('Back to home', 'suntourz')}</a>
        </div>
      </div>
    </Container>
  );
};

const BookingSuccess = () => (
  <Layout>
    <Body />
  </Layout>
);

export default BookingSuccess;
