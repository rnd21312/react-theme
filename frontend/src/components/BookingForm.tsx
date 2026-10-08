import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Send, X } from 'lucide-react';
import { __, sprintf } from '@wordpress/i18n';
import { formatDate } from '@/lib/format';
import { api, PublicApiError } from '@/lib/publicApi';
import type { ContactChannel, Departure, PricingPlan, QuoteResponse, TourDetail } from '@/lib/types';
import { useSite } from '@/site/context';
import { Modal } from './overlays/Modal';

export type BookingSelection = {
  tour: TourDetail;
  departure: Departure;
  plan: PricingPlan;
  pax: number;
  extras: { id: string; qty: number }[];
  quote: QuoteResponse;
};

/** sessionStorage key used to hand the e-mail to the success page without putting it in the URL. */
export const BOOKING_EMAIL_KEY = 'stz_booking_email';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+?[\d\s().-]{6,40}$/;

const inputClass =
  'w-full rounded-xl border border-sand bg-white p-3 text-sm text-ink focus:border-forest focus:outline-none aria-[invalid=true]:border-clay';
const labelClass = 'mb-1 block text-xs font-bold uppercase tracking-wider text-forest';

type TurnstileApi = {
  render: (el: HTMLElement, options: { sitekey: string; callback: (token: string) => void; 'expired-callback': () => void }) => string;
  remove: (id: string) => void;
};

/** Cloudflare Turnstile widget; only mounted when a site key is configured. */
const TurnstileWidget = ({ siteKey, onToken }: { siteKey: string; onToken: (token: string) => void }) => {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let widget = '';
    let cancelled = false;

    const mount = () => {
      const api = (window as unknown as { turnstile?: TurnstileApi }).turnstile;
      if (cancelled || !api || !host.current) return;
      widget = api.render(host.current, { sitekey: siteKey, callback: onToken, 'expired-callback': () => onToken('') });
    };

    if ((window as unknown as { turnstile?: TurnstileApi }).turnstile) {
      mount();
    } else {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.onload = mount;
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      const api = (window as unknown as { turnstile?: TurnstileApi }).turnstile;
      if (widget && api) api.remove(widget);
    };
  }, [siteKey, onToken]);

  return <div ref={host} />;
};

type BookingFormProps = { selection: BookingSelection; onClose: () => void };

export const BookingForm = ({ selection, onClose }: BookingFormProps) => {
  const { data, contact, money } = useSite();
  const { tour, departure, plan, pax, extras, quote } = selection;

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    channel: 'phone' as ContactChannel,
    handle: '',
    message: '',
    terms: false,
    website: '',
  });
  const [token, setToken] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState('');
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false); // double-submit guard that works before React re-renders

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));

  const validate = (): Record<string, string> => {
    const found: Record<string, string> = {};
    if (form.name.trim().length < 2) found.name = __('Please enter your full name.', 'suntourz');
    if (!EMAIL.test(form.email.trim())) found.email = __('Please enter a valid email address.', 'suntourz');
    if (!PHONE.test(form.phone.trim())) found.phone = __('Please enter a valid phone number with country code.', 'suntourz');
    if ((form.channel === 'whatsapp' || form.channel === 'line') && form.handle.trim() === '') {
      found.contact_handle = form.channel === 'whatsapp' ? __('Please enter your WhatsApp number.', 'suntourz') : __('Please enter your LINE ID.', 'suntourz');
    }
    if (!form.terms) found.terms = __('Please accept the booking terms to continue.', 'suntourz');
    return found;
  };

  const blur = (key: string) => {
    const found = validate();
    setErrors((current) => {
      const next = { ...current };
      if (found[key]) next[key] = found[key];
      else delete next[key];
      return next;
    });
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting.current) return;

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    submitting.current = true;
    setBusy(true);
    setFailure('');
    try {
      const result = await api.postBooking({
        departure_id: departure.id,
        plan_id: plan.id,
        pax,
        extras,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        contact_channel: form.channel,
        contact_handle: form.handle.trim(),
        message: form.message.trim(),
        terms: form.terms,
        website: form.website,
        turnstile_token: token,
      });

      try {
        sessionStorage.setItem(BOOKING_EMAIL_KEY, form.email.trim());
      } catch {
        // The success page then asks for the e-mail instead.
      }
      window.location.href = `${data.site.bookingSuccessUrl}${data.site.bookingSuccessUrl.includes('?') ? '&' : '?'}code=${encodeURIComponent(result.code)}`;
    } catch (error) {
      submitting.current = false;
      setBusy(false);
      if (error instanceof PublicApiError && Object.keys(error.fieldErrors).length > 0) {
        setErrors(error.fieldErrors);
        setFailure(error.message);
      } else {
        setFailure(error instanceof Error ? error.message : __('Something went wrong. Please try again.', 'suntourz'));
      }
    }
  };

  const error = (key: string) =>
    errors[key] ? (
      <p id={`stz-bk-${key}-err`} className="mt-1 text-xs text-clay" role="alert">
        {errors[key]}
      </p>
    ) : null;
  const aria = (key: string) => ({ 'aria-invalid': !!errors[key], 'aria-describedby': errors[key] ? `stz-bk-${key}-err` : undefined });

  const locale = data.site.locale;
  const dates = `${formatDate(departure.start_date, locale)} – ${formatDate(departure.end_date, locale)}`;

  return (
    <Modal onClose={onClose} label={__('Request booking', 'suntourz')} className="max-w-2xl">
      <div className="overflow-hidden rounded-3xl border border-sand bg-cream shadow-2xl">
        <div className="flex items-start justify-between bg-forest p-6 text-white">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">{__('Booking request', 'suntourz')}</p>
            <h2 className="font-serif-editorial text-xl font-bold sm:text-2xl">{tour.title}</h2>
            <p className="mt-1 text-xs text-white/80">
              {dates} · {plan.label} · {sprintf(__('%d travellers', 'suntourz'), pax)}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label={__('Close', 'suntourz')} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <form onSubmit={(e) => void onSubmit(e)} noValidate className="max-h-[70vh] space-y-4 overflow-y-auto p-6">
          <div className="flex items-center justify-between rounded-xl border border-sand bg-white p-3.5">
            <span className="text-sm text-muted">{__('Estimated total', 'suntourz')}</span>
            <span className="font-serif-editorial text-2xl font-bold text-forest">{money(quote.total)}</span>
          </div>
          <p className="text-xs text-muted">{__('No payment is taken online. We contact you to confirm your seats and arrange payment.', 'suntourz')}</p>

          <div>
            <label htmlFor="stz-bk-name" className={labelClass}>{__('Full name *', 'suntourz')}</label>
            <input id="stz-bk-name" autoComplete="name" value={form.name} onChange={(e) => set('name', e.target.value)} onBlur={() => blur('name')} className={inputClass} {...aria('name')} />
            {error('name')}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="stz-bk-email" className={labelClass}>{__('Email *', 'suntourz')}</label>
              <input id="stz-bk-email" type="email" autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} onBlur={() => blur('email')} className={inputClass} {...aria('email')} />
              {error('email')}
            </div>
            <div>
              <label htmlFor="stz-bk-phone" className={labelClass}>{__('Phone (with country code) *', 'suntourz')}</label>
              <input id="stz-bk-phone" type="tel" autoComplete="tel" placeholder="+66 81 234 5678" value={form.phone} onChange={(e) => set('phone', e.target.value)} onBlur={() => blur('phone')} className={inputClass} {...aria('phone')} />
              {error('phone')}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="stz-bk-channel" className={labelClass}>{__('How should we contact you? *', 'suntourz')}</label>
              <select id="stz-bk-channel" value={form.channel} onChange={(e) => set('channel', e.target.value as ContactChannel)} className={inputClass}>
                <option value="phone">{__('Phone call', 'suntourz')}</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="line">LINE</option>
                <option value="email">{__('Email', 'suntourz')}</option>
              </select>
            </div>
            {(form.channel === 'whatsapp' || form.channel === 'line') && (
              <div>
                <label htmlFor="stz-bk-handle" className={labelClass}>{form.channel === 'whatsapp' ? __('WhatsApp number *', 'suntourz') : __('LINE ID *', 'suntourz')}</label>
                <input id="stz-bk-handle" value={form.handle} onChange={(e) => set('handle', e.target.value)} onBlur={() => blur('contact_handle')} className={inputClass} {...aria('contact_handle')} />
                {error('contact_handle')}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="stz-bk-message" className={labelClass}>{__('Message (optional)', 'suntourz')}</label>
            <textarea id="stz-bk-message" rows={3} value={form.message} onChange={(e) => set('message', e.target.value)} placeholder={__('Dietary needs, celebrations, questions…', 'suntourz')} className={inputClass} />
          </div>

          {data.booking.terms && (
            <details className="rounded-xl border border-sand bg-white p-3 text-xs text-muted">
              <summary className="cursor-pointer font-semibold text-forest">{__('Booking terms & cancellation', 'suntourz')}</summary>
              <p className="mt-2 whitespace-pre-line">{data.booking.terms}</p>
            </details>
          )}

          <div>
            <label className="flex cursor-pointer items-start gap-2 text-sm text-ink">
              <input type="checkbox" checked={form.terms} onChange={(e) => set('terms', e.target.checked)} onBlur={() => blur('terms')} className="mt-1 h-4 w-4 accent-forest" {...aria('terms')} />
              <span>{__('I have read and accept the booking terms and understand this is a request, not a confirmed booking.', 'suntourz')}</span>
            </label>
            {error('terms')}
          </div>

          <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label>
              Website
              <input type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set('website', e.target.value)} />
            </label>
          </div>

          {data.booking.turnstileKey && <TurnstileWidget siteKey={data.booking.turnstileKey} onToken={setToken} />}

          {Object.entries(errors).filter(([key]) => !['name', 'email', 'phone', 'contact_handle', 'terms'].includes(key)).map(([key, message]) => (
            <p key={key} role="alert" className="rounded-xl border border-clay/30 bg-clay/5 p-3 text-sm text-clay">{message}</p>
          ))}
          {failure && Object.keys(errors).length === 0 && (
            <p role="alert" className="rounded-xl border border-clay/30 bg-clay/5 p-3 text-sm text-clay">
              {failure}
              {contact.phone && <> {sprintf(__('You can also call us on %s.', 'suntourz'), contact.phone)}</>}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-forest py-3.5 text-sm font-semibold uppercase tracking-wider text-white shadow-md hover:bg-forest-soft disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span>{busy ? __('Sending your request…', 'suntourz') : __('Send booking request', 'suntourz')}</span>
            <Send className="h-4 w-4 text-gold" aria-hidden />
          </button>
        </form>
      </div>
    </Modal>
  );
};
