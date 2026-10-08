import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, Heart, Minus, MessageSquare, Plus, Puzzle, Send, Users } from 'lucide-react';
import { __, _n, sprintf } from '@wordpress/i18n';
import { formatDate } from '@/lib/format';
import { api } from '@/lib/publicApi';
import type { QuoteResponse, TourDetail } from '@/lib/types';
import { useWishlist, wishlist } from '@/lib/wishlist';
import { useSite } from '@/site/context';
import { BookingForm, type BookingSelection } from './BookingForm';

type BookingCardProps = { tour: TourDetail };

const stepper = 'flex h-7 w-7 items-center justify-center rounded-full border border-sand text-forest hover:bg-sand-soft disabled:opacity-40';

/** Departure / plan / travellers / extras picker with a server-priced live total, then the booking request form. */
export const BookingCard = ({ tour }: BookingCardProps) => {
  const { data, contact, money, openPlanTrip, toast } = useSite();
  const saved = useWishlist().includes(tour.id);
  const locale = data.site.locale;

  const departures = tour.departures;
  const [departureId, setDepartureId] = useState<number | null>(departures.find((d) => d.bookable)?.id ?? null);
  const [planId, setPlanId] = useState<string | null>(tour.pricing.plans[0]?.id ?? null);
  const [pax, setPax] = useState<number>(tour.pricing.plans[0]?.pax ?? 1);
  const [extras, setExtras] = useState<Record<string, number>>({});
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [pricing, setPricing] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const departure = useMemo(() => departures.find((d) => d.id === departureId) ?? null, [departures, departureId]);
  const plan = tour.pricing.plans.find((p) => p.id === planId) ?? null;
  const maxPax = plan ? (plan.extra_person_price ? (plan.max_pax ?? plan.pax) : plan.pax) : 1;

  const range = (d: { start_date: string; end_date: string }) =>
    `${formatDate(d.start_date, locale, { day: 'numeric', month: 'short' })} – ${formatDate(d.end_date, locale, { day: 'numeric', month: 'short', year: 'numeric' })}`;

  const chosenExtras = useMemo(
    () => Object.entries(extras).filter(([, qty]) => qty > 0).map(([id, qty]) => ({ id, qty })),
    [extras],
  );

  // Price on the server whenever the selection changes — the browser never computes a total itself.
  useEffect(() => {
    if (!departure?.bookable || !plan) {
      setQuote(null);
      return;
    }

    const controller = new AbortController();
    setPricing(true);
    const timer = window.setTimeout(() => {
      api
        .quote({ departure_id: departure.id, plan_id: plan.id, pax, extras: chosenExtras }, controller.signal)
        .then(setQuote)
        .catch((error: unknown) => {
          if (!(error instanceof DOMException && error.name === 'AbortError')) setQuote(null);
        })
        .finally(() => setPricing(false));
    }, 200);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [departure, plan, pax, chosenExtras]);

  const choosePlan = (id: string) => {
    const next = tour.pricing.plans.find((p) => p.id === id);
    setPlanId(id);
    setPax(next?.pax ?? 1);
    setExtras({});
  };

  const setExtra = (id: string, qty: number) => setExtras((current) => ({ ...current, [id]: Math.max(0, qty) }));

  const selection: BookingSelection | null =
    departure && plan && quote?.ok ? { tour, departure, plan, pax, extras: chosenExtras, quote } : null;

  const askConcierge = () =>
    openPlanTrip({
      tourIds: [tour.id],
      destination: tour.destinations[0]?.name,
      notes: sprintf(__('I am interested in "%s".', 'suntourz'), tour.title),
    });

  return (
    <div id="booking" className="space-y-5 rounded-2xl border border-sand bg-white p-6 shadow-lg">
      <div className="flex items-end justify-between gap-3">
        <div>
          <span className="block text-[10px] font-bold uppercase tracking-widest text-muted-soft">{__('From', 'suntourz')}</span>
          {tour.price_from !== null ? (
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-serif-editorial text-3xl font-bold text-forest">{money(tour.price_from)}</span>
              {tour.price_from_regular !== null && <span className="text-sm text-muted-soft line-through">{money(tour.price_from_regular)}</span>}
            </div>
          ) : (
            <span className="text-lg font-semibold text-muted">{__('On request', 'suntourz')}</span>
          )}
          {tour.price_from_plan && <span className="text-xs text-muted-soft">{sprintf(__('per %s plan', 'suntourz'), tour.price_from_plan)}</span>}
        </div>
        <button
          type="button"
          aria-pressed={saved}
          aria-label={saved ? __('Remove from wishlist', 'suntourz') : __('Save to wishlist', 'suntourz')}
          onClick={() => toast(wishlist.toggle(tour.id) ? sprintf(__('Saved "%s" to your wishlist', 'suntourz'), tour.title) : __('Journey removed from wishlist', 'suntourz'))}
          className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${saved ? 'border-forest bg-forest text-gold' : 'border-sand text-ink hover:text-red-500'}`}
        >
          <Heart className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} aria-hidden />
        </button>
      </div>

      {departures.length > 0 ? (
        <fieldset>
          <legend className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-forest">
            <CalendarDays className="h-3.5 w-3.5 text-gold" aria-hidden />
            {__('Choose a departure', 'suntourz')}
          </legend>
          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {departures.map((d) => {
              const selected = d.id === departureId;
              return (
                <label
                  key={d.id}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 text-sm transition-colors ${
                    !d.bookable ? 'cursor-not-allowed border-sand bg-sand-soft/50 opacity-60' : selected ? 'border-forest bg-forest/5' : 'border-sand hover:border-forest/50'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <input type="radio" name="stz-departure" disabled={!d.bookable} checked={selected} onChange={() => setDepartureId(d.id)} className="h-4 w-4 accent-forest" />
                    <span>
                      <span className="block font-semibold text-ink">{range(d)}</span>
                      {d.note && <span className="block text-xs text-muted-soft">{d.note}</span>}
                    </span>
                  </span>
                  <span className={`shrink-0 text-xs font-medium ${!d.bookable ? 'text-muted-soft' : d.seats_left <= 4 ? 'text-clay' : 'text-emerald-700'}`}>
                    {!d.bookable ? (d.status === 'closed' ? __('Closed', 'suntourz') : __('Sold out', 'suntourz')) : sprintf(_n('%d seat left', '%d seats left', d.seats_left, 'suntourz'), d.seats_left)}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : (
        <p className="rounded-xl bg-sand-soft p-3 text-sm text-muted">{__('No dates are scheduled yet. Ask us about private departures.', 'suntourz')}</p>
      )}

      {tour.pricing.plans.length > 0 && (
        <fieldset>
          <legend className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-forest">
            <Users className="h-3.5 w-3.5 text-gold" aria-hidden />
            {__('Choose a plan', 'suntourz')}
          </legend>
          <div className="space-y-2">
            {tour.pricing.plans.map((p) => {
              const price = departure?.prices[p.id] ?? { price: p.price, sale_price: p.sale_price, effective: p.sale_price ?? p.price };
              const selected = p.id === planId;
              return (
                <label key={p.id} className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 text-sm transition-colors ${selected ? 'border-forest bg-forest/5' : 'border-sand hover:border-forest/50'}`}>
                  <span className="flex items-center gap-3">
                    <input type="radio" name="stz-plan" checked={selected} onChange={() => choosePlan(p.id)} className="h-4 w-4 accent-forest" />
                    <span>
                      <span className="block font-semibold text-ink">{p.label}</span>
                      <span className="block text-xs text-muted-soft">
                        {p.extra_person_price ? sprintf(__('%1$d–%2$d travellers', 'suntourz'), p.pax, p.max_pax ?? p.pax) : sprintf(_n('%d traveller', '%d travellers', p.pax, 'suntourz'), p.pax)}
                      </span>
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block font-bold text-forest">{money(price.effective)}</span>
                    {price.sale_price !== null && <span className="block text-xs text-muted-soft line-through">{money(price.price)}</span>}
                  </span>
                </label>
              );
            })}
          </div>

          {plan && maxPax > plan.pax && (
            <div className="mt-3 flex items-center justify-between rounded-xl bg-sand-soft p-3 text-sm">
              <span className="text-muted">
                {__('Travellers', 'suntourz')}
                <span className="block text-xs text-muted-soft">{sprintf(__('+%s each above %d', 'suntourz'), money(plan.extra_person_price ?? 0), plan.pax)}</span>
              </span>
              <span className="flex items-center gap-3">
                <button type="button" className={stepper} aria-label={__('Fewer travellers', 'suntourz')} disabled={pax <= plan.pax} onClick={() => setPax(pax - 1)}><Minus className="h-3.5 w-3.5" aria-hidden /></button>
                <span className="w-5 text-center font-bold text-forest" aria-live="polite">{pax}</span>
                <button type="button" className={stepper} aria-label={__('More travellers', 'suntourz')} disabled={pax >= maxPax} onClick={() => setPax(pax + 1)}><Plus className="h-3.5 w-3.5" aria-hidden /></button>
              </span>
            </div>
          )}
        </fieldset>
      )}

      {tour.extras.length > 0 && (
        <fieldset>
          <legend className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-forest">
            <Puzzle className="h-3.5 w-3.5 text-gold" aria-hidden />
            {__('Optional extras', 'suntourz')}
          </legend>
          <div className="space-y-2">
            {tour.extras.map((extra) => {
              const qty = extras[extra.id] ?? 0;
              const cap = Math.min(extra.max_qty ?? 99, extra.unit === 'per_person' ? pax : 99);
              return (
                <div key={extra.id} className="flex items-center justify-between gap-3 rounded-xl border border-sand p-3 text-sm">
                  <span>
                    <span className="block font-semibold text-ink">{extra.label}</span>
                    <span className="block text-xs text-muted-soft">
                      {money(extra.price)} · {extra.unit === 'per_person' ? __('per person', 'suntourz') : __('per booking', 'suntourz')}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <button type="button" className={stepper} aria-label={sprintf(__('Fewer %s', 'suntourz'), extra.label)} disabled={qty <= 0} onClick={() => setExtra(extra.id, qty - 1)}><Minus className="h-3.5 w-3.5" aria-hidden /></button>
                    <span className="w-4 text-center font-bold text-forest">{qty}</span>
                    <button type="button" className={stepper} aria-label={sprintf(__('More %s', 'suntourz'), extra.label)} disabled={qty >= cap} onClick={() => setExtra(extra.id, qty + 1)}><Plus className="h-3.5 w-3.5" aria-hidden /></button>
                  </span>
                </div>
              );
            })}
          </div>
        </fieldset>
      )}

      <div aria-live="polite" className="rounded-xl bg-sand-soft p-3 text-sm">
        {quote && quote.ok ? (
          <div className="space-y-1">
            {quote.lines.map((line, index) => (
              <div key={index} className="flex justify-between gap-3 text-xs text-muted">
                <span>{line.label}{line.qty > 1 ? ` × ${line.qty}` : ''}</span>
                <span>{money(line.amount)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-sand pt-2">
              <span className="font-semibold text-ink">{__('Total', 'suntourz')}</span>
              <span className={`font-serif-editorial text-2xl font-bold text-forest ${pricing ? 'opacity-50' : ''}`}>{money(quote.total)}</span>
            </div>
          </div>
        ) : quote && !quote.ok ? (
          <ul className="space-y-1 text-xs text-clay">{quote.errors.map((error) => <li key={error.field + error.code}>{error.message}</li>)}</ul>
        ) : (
          <span className="text-xs text-muted">{departure?.bookable ? __('Calculating your price…', 'suntourz') : __('Choose an available departure to see your price.', 'suntourz')}</span>
        )}
      </div>

      {departures.some((d) => d.bookable) ? (
        <button
          type="button"
          disabled={!selection || pricing}
          onClick={() => setFormOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-forest py-3.5 text-sm font-semibold uppercase tracking-wider text-white shadow-md transition-all hover:bg-forest-soft hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span>{__('Request booking', 'suntourz')}</span>
          <Send className="h-4 w-4 text-gold" aria-hidden />
        </button>
      ) : (
        <button type="button" onClick={askConcierge} className="flex w-full items-center justify-center gap-2 rounded-full bg-forest py-3.5 text-sm font-semibold uppercase tracking-wider text-white hover:bg-forest-soft">
          {__('Ask about other dates', 'suntourz')}
        </button>
      )}

      {contact.whatsapp && (
        <a
          href={`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(sprintf(__('Hello! I would like to know more about "%s".', 'suntourz'), tour.title))}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-full border border-whatsapp/40 py-3 text-xs font-semibold text-whatsapp transition-colors hover:bg-whatsapp/10"
        >
          <MessageSquare className="h-4 w-4" aria-hidden />
          {__('Ask on WhatsApp', 'suntourz')}
        </a>
      )}

      <ul className="space-y-1.5 border-t border-sand pt-4 text-xs text-muted">
        <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-forest" aria-hidden />{__('No payment online — we confirm by phone', 'suntourz')}</li>
        {contact.response && <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-forest" aria-hidden />{sprintf(__('We reply %s', 'suntourz'), contact.response)}</li>}
      </ul>

      {formOpen && selection && <BookingForm selection={selection} onClose={() => setFormOpen(false)} />}
    </div>
  );
};
