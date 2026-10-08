import { useState, type FormEvent } from 'react';
import { CheckCircle2, Quote, Star } from 'lucide-react';
import { __, sprintf } from '@wordpress/i18n';
import { api, PublicApiError } from '@/lib/publicApi';
import type { Review, ReviewInput, ReviewsResponse } from '@/lib/types';
import { Initials, Stars } from './primitives';

type TourReviewsProps = { tourId: number; initial: ReviewsResponse };

const EMPTY: ReviewInput = { name: '', email: '', country: '', rating: 0, review: '', website: '' };

const inputClass =
  'w-full rounded-xl border border-sand bg-white p-3 text-sm text-ink focus:border-forest focus:outline-none aria-[invalid=true]:border-clay';

const ReviewItem = ({ review }: { review: Review }) => (
  <figure className="rounded-2xl border border-sand bg-white p-6 shadow-xs">
    <div className="mb-3 flex items-center justify-between">
      <Stars value={review.rating} />
      <span className="font-mono text-[10px] text-muted-soft">{review.date}</span>
    </div>
    <blockquote className="font-serif-editorial text-base italic leading-relaxed text-ink">
      <Quote className="mb-1 h-4 w-4 text-gold/60" aria-hidden />“{review.review}”
    </blockquote>
    <figcaption className="mt-4 flex items-center gap-3 border-t border-sand pt-4">
      <Initials name={review.name} />
      <div>
        <div className="flex items-center gap-1.5 text-sm font-bold text-ink">
          <span>{review.name}</span>
          {review.verified && <CheckCircle2 className="h-3.5 w-3.5 text-forest" aria-label={__('Verified guest', 'suntourz')} />}
        </div>
        {review.country && <p className="text-xs text-muted-soft">{review.country}</p>}
      </div>
    </figcaption>
  </figure>
);

const ReviewForm = ({ tourId }: { tourId: number }) => {
  const [form, setForm] = useState<ReviewInput>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [failure, setFailure] = useState('');

  const set = <K extends keyof ReviewInput>(key: K, value: ReviewInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const found: Record<string, string> = {};
    if (form.name.trim().length < 2) found.name = __('Please enter your name.', 'suntourz');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) found.email = __('Please enter a valid email address.', 'suntourz');
    if (form.rating < 1) found.rating = __('Please choose a rating.', 'suntourz');
    if (form.review.trim().length < 20) found.review = __('Please tell us a little more (at least 20 characters).', 'suntourz');
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    setFailure('');
    try {
      const response = await api.postReview(tourId, form);
      setMessage(response.message);
      setForm(EMPTY);
    } catch (error) {
      if (error instanceof PublicApiError && Object.keys(error.fieldErrors).length > 0) setErrors(error.fieldErrors);
      else setFailure(error instanceof Error ? error.message : __('Something went wrong. Please try again.', 'suntourz'));
    } finally {
      setBusy(false);
    }
  };

  if (message) {
    return (
      <div role="status" className="flex items-start gap-3 rounded-2xl bg-forest p-6 text-white">
        <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-gold" aria-hidden />
        <div>
          <h4 className="text-sm font-bold">{__('Review received', 'suntourz')}</h4>
          <p className="text-xs text-white/80">{message}</p>
        </div>
      </div>
    );
  }

  const error = (key: string) =>
    errors[key] ? (
      <p className="mt-1 text-xs text-clay" role="alert">
        {errors[key]}
      </p>
    ) : null;
  const label = 'mb-1 block text-xs font-bold uppercase tracking-wider text-forest';

  return (
    <form onSubmit={(e) => void onSubmit(e)} noValidate className="space-y-4 rounded-2xl border border-sand bg-cream p-6">
      <h3 className="font-serif-editorial text-lg font-bold text-forest">{__('Share your experience', 'suntourz')}</h3>

      <fieldset>
        <legend className={label}>{__('Your rating *', 'suntourz')}</legend>
        <div className="flex items-center gap-1" role="radiogroup" aria-invalid={!!errors.rating}>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={form.rating === value}
              aria-label={sprintf(__('%d out of 5', 'suntourz'), value)}
              onClick={() => set('rating', value)}
              className="rounded p-0.5 focus-visible:outline-2 focus-visible:outline-forest"
            >
              <Star className={`h-7 w-7 transition-colors ${value <= form.rating ? 'fill-gold text-gold' : 'text-mist hover:text-gold'}`} aria-hidden />
            </button>
          ))}
        </div>
        {error('rating')}
      </fieldset>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="stz-rv-name" className={label}>{__('Name *', 'suntourz')}</label>
          <input id="stz-rv-name" value={form.name} autoComplete="name" aria-invalid={!!errors.name} onChange={(e) => set('name', e.target.value)} className={inputClass} />
          {error('name')}
        </div>
        <div>
          <label htmlFor="stz-rv-email" className={label}>{__('Email * (not published)', 'suntourz')}</label>
          <input id="stz-rv-email" type="email" value={form.email} autoComplete="email" aria-invalid={!!errors.email} onChange={(e) => set('email', e.target.value)} className={inputClass} />
          {error('email')}
        </div>
      </div>

      <div>
        <label htmlFor="stz-rv-country" className={label}>{__('Where are you from?', 'suntourz')}</label>
        <input id="stz-rv-country" value={form.country} autoComplete="country-name" onChange={(e) => set('country', e.target.value)} placeholder={__('e.g. London, United Kingdom', 'suntourz')} className={inputClass} />
      </div>

      <div>
        <label htmlFor="stz-rv-text" className={label}>{__('Your review *', 'suntourz')}</label>
        <textarea id="stz-rv-text" rows={4} value={form.review} aria-invalid={!!errors.review} onChange={(e) => set('review', e.target.value)} className={inputClass} />
        {error('review')}
      </div>

      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set('website', e.target.value)} />
        </label>
      </div>

      {failure && <p role="alert" className="rounded-xl border border-clay/30 bg-clay/5 p-3 text-sm text-clay">{failure}</p>}

      <button type="submit" disabled={busy} className="rounded-full bg-forest px-7 py-3 text-xs font-semibold uppercase tracking-wider text-white shadow-md hover:bg-forest-soft disabled:cursor-not-allowed disabled:opacity-70">
        {busy ? __('Sending…', 'suntourz') : __('Submit review', 'suntourz')}
      </button>
      <p className="text-[11px] text-muted-soft">{__('Reviews are checked by our team before they appear.', 'suntourz')}</p>
    </form>
  );
};

export const TourReviews = ({ tourId, initial }: TourReviewsProps) => {
  const [list, setList] = useState<ReviewsResponse>(initial);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const more = async () => {
    setLoading(true);
    try {
      const next = await api.reviews(tourId, page + 1);
      setList((current) => ({ ...next, items: [...current.items, ...next.items] }));
      setPage(page + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="reviews" aria-labelledby="stz-reviews-title" className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="stz-reviews-title" className="font-serif-editorial text-2xl font-bold text-ink">
          {__('Guest reviews', 'suntourz')}
        </h2>
        {list.stats.count > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Stars value={list.stats.average} />
            <span className="font-bold text-forest">{list.stats.average.toFixed(1)}</span>
            <span>({sprintf(__('%d reviews', 'suntourz'), list.stats.count)})</span>
          </div>
        )}
      </div>

      {list.items.length === 0 ? (
        <p className="text-sm text-muted">{__('No reviews yet — be the first to share your experience.', 'suntourz')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {list.items.map((review) => <ReviewItem key={review.id} review={review} />)}
        </div>
      )}

      {page < list.total_pages && (
        <button type="button" onClick={() => void more()} disabled={loading} className="rounded-full border border-forest/30 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-forest hover:bg-white disabled:opacity-60">
          {loading ? __('Loading…', 'suntourz') : __('Show more reviews', 'suntourz')}
        </button>
      )}

      <ReviewForm tourId={tourId} />
    </section>
  );
};
