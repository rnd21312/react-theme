import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  CalendarDays,
  Check,
  Gem,
  Heart,
  Landmark,
  Mail,
  MapPin,
  MessageCircle,
  Mountain,
  Phone,
  Send,
  ShieldCheck,
  Ship,
  Sparkles,
  UserRound,
  X,
  type LucideIcon,
} from 'lucide-react';
import { __, sprintf } from '@wordpress/i18n';
import { api, PublicApiError } from '@/lib/publicApi';
import type { TripRequestInput } from '@/lib/types';
import { useSite, type PlanTripOptions } from '@/site/context';

type TripPlannerFormProps = {
  options?: PlanTripOptions;
  /** Shows the close button (popup). Omitted on the full-page version. */
  onClose?: () => void;
};

const STEPS = 4;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^[\d\s+().-]{6,40}$/;
const DRAFT_KEY = 'stz-trip-draft-v1';

type ContactVia = 'whatsapp' | 'phone' | 'line' | 'email';

/** Icon for a travel style, picked from keywords in its (editable) label. */
const styleIcon = (label: string): LucideIcon => {
  const text = label.toLowerCase();
  if (/(island|yacht|sea|beach)/.test(text)) return Ship;
  if (/(cultur|heritage|temple|history)/.test(text)) return Landmark;
  if (/(romantic|honeymoon|anniversary)/.test(text)) return Heart;
  if (/(adventure|active|jungle|rainforest|trek)/.test(text)) return Mountain;
  if (/(boutique|luxury|villa)/.test(text)) return Gem;
  return Sparkles;
};

const inputClass =
  'w-full rounded-xl border border-sand bg-white px-4 py-3 text-sm text-ink transition-colors placeholder:text-muted-soft focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/10 aria-[invalid=true]:border-clay';
const labelClass = 'mb-2 block text-xs font-bold uppercase tracking-wider text-forest';

/* ------------------------------------------------------------------ Choices */

type ChoiceProps = { active: boolean; onClick: () => void; icon?: ReactNode; children: ReactNode; multi?: boolean };

/** Large tap target used for single and multiple choices. */
const Choice = ({ active, onClick, icon, children, multi = false }: ChoiceProps) => (
  <button
    type="button"
    role={multi ? 'checkbox' : 'radio'}
    aria-checked={active}
    onClick={onClick}
    className={`stz-press group flex min-h-[3.25rem] items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all duration-300 ${
      active
        ? 'border-forest bg-forest text-white shadow-md'
        : 'border-sand bg-white text-ink hover:border-forest/40 hover:bg-white hover:shadow-sm'
    }`}
  >
    {icon && (
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-300 ${active ? 'bg-white/15 text-gold' : 'bg-cream text-forest'}`}>
        {icon}
      </span>
    )}
    <span className="min-w-0 flex-1 leading-snug">{children}</span>
    <span
      aria-hidden
      className={`flex h-5 w-5 shrink-0 items-center justify-center transition-all duration-300 ${multi ? 'rounded-md' : 'rounded-full'} ${
        active ? 'scale-100 bg-gold text-forest' : 'scale-90 border border-sand bg-transparent text-transparent'
      }`}
    >
      <Check className="h-3 w-3" />
    </span>
  </button>
);

type PillProps = { active: boolean; onClick: () => void; children: ReactNode };

/** Compact option for short lists (months, durations, budgets). */
const Pill = ({ active, onClick, children }: PillProps) => (
  <button
    type="button"
    role="radio"
    aria-checked={active}
    onClick={onClick}
    className={`stz-press rounded-full border px-4 py-2.5 text-left text-xs font-semibold transition-all duration-300 sm:text-sm ${
      active ? 'border-forest bg-forest text-white shadow-md' : 'border-sand bg-white text-ink hover:border-forest/40'
    }`}
  >
    {children}
  </button>
);

const Group = ({ id, label, hint, children }: { id: string; label: string; hint?: string; children: ReactNode }) => (
  <div role="group" aria-labelledby={id}>
    <span id={id} className={labelClass}>{label}</span>
    {hint && <p className="-mt-1 mb-2.5 text-xs text-muted-soft">{hint}</p>}
    {children}
  </div>
);

/* ------------------------------------------------------------------ Component */

const readDraft = (): { form: Partial<TripRequestInput>; step: number } | null => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as { form: Partial<TripRequestInput>; step: number }) : null;
  } catch {
    return null;
  }
};

const writeDraft = (value: { form: TripRequestInput; step: number } | null) => {
  try {
    if (value) localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...value, form: { ...value.form, website: '' } }));
    else localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Storage can be blocked; the form simply works without a saved draft.
  }
};

export const TripPlannerForm = ({ options = {}, onClose }: TripPlannerFormProps) => {
  const { data, contact } = useSite();
  const planner = data.content.planner;
  const heading = useRef<HTMLHeadingElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const modal = Boolean(onClose);

  const first = (list: string[] | undefined, fallback = '') => list?.[0] ?? fallback;
  // A draft is only restored for a plain "Plan my trip" open, never when a tour or destination started it.
  const fresh = Boolean(options.destination || options.notes || options.tourIds?.length);
  const draft = useMemo(() => (fresh ? null : readDraft()), [fresh]);

  const [step, setStep] = useState(() => Math.min(Math.max(draft?.step ?? 1, 1), STEPS));
  const [form, setForm] = useState<TripRequestInput>(() => ({
    destination: options.destination ?? first(planner?.destinations),
    style: first(planner?.styles),
    season: first(planner?.seasons),
    duration: planner?.durations?.[1] ?? first(planner?.durations),
    travelers: first(planner?.travelers),
    hotel: first(planner?.hotels),
    budget: planner?.budgets?.[1] ?? first(planner?.budgets),
    interests: (planner?.interests ?? []).slice(0, 2),
    name: '',
    email: '',
    phone: '',
    notes: options.notes ?? '',
    tour_ids: options.tourIds ?? [],
    website: '',
    ...(draft?.form ?? {}),
  }));
  const [via, setVia] = useState<ContactVia>(contact.whatsapp ? 'whatsapp' : 'phone');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState('');
  const [done, setDone] = useState<{ reference: string; responseTime: string } | null>(null);

  useEffect(() => {
    if (!done) writeDraft({ form, step });
  }, [form, step, done]);

  const set = <K extends keyof TripRequestInput>(key: K, value: TripRequestInput[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const toggleInterest = (interest: string) =>
    set('interests', form.interests.includes(interest) ? form.interests.filter((i) => i !== interest) : [...form.interests, interest]);

  const validate = (): Record<string, string> => {
    const found: Record<string, string> = {};
    const phone = form.phone.trim();
    const email = form.email.trim();
    if (form.name.trim().length < 2) found.name = __('Please enter your full name.', 'suntourz');
    if (email !== '' && !EMAIL.test(email)) found.email = __('Please enter a valid email address.', 'suntourz');
    if (phone !== '' && !PHONE.test(phone)) found.phone = __('Please enter a valid phone number.', 'suntourz');
    if (phone === '' && email === '') found.phone = __('Please leave a phone / WhatsApp number or an email so we can reach you.', 'suntourz');
    return found;
  };

  const go = (next: number) => {
    setStep(next);
    requestAnimationFrame(() => {
      body.current?.scrollTo({ top: 0 });
      heading.current?.focus({ preventScroll: true });
    });
  };

  const viaLabel: Record<ContactVia, string> = {
    whatsapp: 'WhatsApp',
    phone: __('Phone call', 'suntourz'),
    line: 'LINE',
    email: __('Email', 'suntourz'),
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (step < STEPS) return go(step + 1);

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    setFailure('');
    try {
      const notes = [`[${sprintf(__('Preferred contact: %s', 'suntourz'), viaLabel[via])}]`, form.notes.trim()].filter(Boolean).join('\n');
      const result = await api.postTripRequest({
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        notes,
      });
      writeDraft(null);
      setDone({ reference: result.reference, responseTime: result.response_time });
    } catch (error) {
      if (error instanceof PublicApiError && Object.keys(error.fieldErrors).length > 0) {
        setErrors(error.fieldErrors);
      } else {
        setFailure(error instanceof Error ? error.message : __('Something went wrong. Please try again.', 'suntourz'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!planner) {
    return <p className="p-8 text-sm text-muted">{__('The trip designer is not available right now. Please contact us directly.', 'suntourz')}</p>;
  }

  const stepMeta: { label: string; icon: LucideIcon; value: string }[] = [
    { label: __('Journey', 'suntourz'), icon: MapPin, value: [form.destination, form.style].filter(Boolean).join(' · ') },
    { label: __('Timing & group', 'suntourz'), icon: CalendarDays, value: [form.season, form.duration, form.travelers].filter(Boolean).join(' · ') },
    { label: __('Stay & interests', 'suntourz'), icon: BedDouble, value: [form.hotel, form.budget].filter(Boolean).join(' · ') },
    { label: __('Your details', 'suntourz'), icon: UserRound, value: form.name.trim() },
  ];
  const current = stepMeta[step - 1] ?? stepMeta[0]!;
  const waHref = contact.whatsapp ? `https://wa.me/${contact.whatsapp}` : '';

  const fieldError = (key: string) => errors[key];
  const errorText = (key: string) =>
    fieldError(key) ? (
      <p className="mt-1.5 text-xs text-clay" role="alert">
        {fieldError(key)}
      </p>
    ) : null;

  const viaOptions: { key: ContactVia; label: string; icon: LucideIcon }[] = [
    ...(contact.whatsapp ? [{ key: 'whatsapp' as const, label: 'WhatsApp', icon: MessageCircle }] : []),
    { key: 'phone', label: __('Phone call', 'suntourz'), icon: Phone },
    ...(contact.line ? [{ key: 'line' as const, label: 'LINE', icon: MessageCircle }] : []),
    { key: 'email', label: __('Email', 'suntourz'), icon: Mail },
  ];

  const rail = (
    <aside className="relative hidden w-[300px] shrink-0 flex-col justify-between overflow-hidden bg-forest p-8 text-white md:flex">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gold/10 blur-3xl" aria-hidden />
      <div className="relative">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold" aria-hidden />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">{planner.eyebrow}</span>
        </div>
        <p className="font-serif-editorial text-2xl font-bold leading-tight">{planner.title}</p>
        <p className="mt-2 text-xs font-light leading-relaxed text-white/70">{planner.subtitle}</p>

        <ol className="mt-8 space-y-1">
          {stepMeta.map((item, index) => {
            const number = index + 1;
            const complete = Boolean(done) || number < step;
            const active = !done && number === step;
            const Icon = item.icon;

            return (
              <li key={item.label}>
                <button
                  type="button"
                  disabled={done !== null || number > step}
                  onClick={() => go(number)}
                  aria-current={active ? 'step' : undefined}
                  className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors duration-300 ${active ? 'bg-white/10' : complete ? 'hover:bg-white/5' : 'opacity-60'} disabled:cursor-default`}
                >
                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-all duration-500 ${
                      complete ? 'border-gold bg-gold text-forest' : active ? 'border-gold text-gold' : 'border-white/25 text-white/60'
                    }`}
                  >
                    {complete ? <Check className="h-4 w-4" aria-hidden /> : <Icon className="h-4 w-4" aria-hidden />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{item.label}</span>
                    {(complete || active) && item.value && <span className="mt-0.5 block truncate text-xs text-white/60">{item.value}</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="relative mt-8 space-y-3 text-xs text-white/70">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
          <span>{__('Free and with no obligation. Nothing is charged online.', 'suntourz')}</span>
        </div>
        {contact.response && <p className="pl-6">{sprintf(__('We usually reply %s.', 'suntourz'), contact.response)}</p>}
        {(waHref || contact.phone) && (
          <div className="flex flex-wrap gap-2 pt-1">
            {waHref && (
              <a href={waHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 font-semibold text-white transition-colors hover:bg-white/20">
                <MessageCircle className="h-3.5 w-3.5 text-whatsapp" aria-hidden />WhatsApp
              </a>
            )}
            {contact.phone && (
              <a href={`tel:${contact.phone}`} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 font-semibold text-white transition-colors hover:bg-white/20">
                <Phone className="h-3.5 w-3.5 text-gold" aria-hidden />{contact.phone}
              </a>
            )}
          </div>
        )}
      </div>
    </aside>
  );

  const mobileHeader = (
    <div className="relative shrink-0 bg-forest px-5 pb-4 pt-5 text-white md:hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-gold" aria-hidden />
            <span className="truncate text-[10px] font-bold uppercase tracking-[0.2em] text-gold">{planner.eyebrow}</span>
          </div>
          <p className="font-serif-editorial text-lg font-bold leading-tight">{done ? __('Request received', 'suntourz') : current.label}</p>
          {!done && <p className="mt-0.5 text-xs text-white/70">{sprintf(__('Step %1$d of %2$d', 'suntourz'), step, STEPS)}</p>}
        </div>
        {onClose && (
          <button type="button" onClick={onClose} aria-label={__('Close trip designer', 'suntourz')} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20">
            <X className="h-5 w-5" aria-hidden />
          </button>
        )}
      </div>
      <div className="mt-4 flex gap-1.5" role="progressbar" aria-valuemin={0} aria-valuemax={STEPS} aria-valuenow={done ? STEPS : step} aria-label={__('Progress', 'suntourz')}>
        {Array.from({ length: STEPS }, (_, index) => (
          <span key={index} className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
            <span className={`block h-full rounded-full bg-gold transition-transform duration-700 ease-[var(--stz-ease)] ${done || index < step ? 'translate-x-0' : '-translate-x-full'}`} />
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <div
      className={`flex flex-col overflow-hidden bg-cream shadow-2xl md:flex-row ${
        modal
          ? 'max-h-[100dvh] min-h-[min(100dvh,640px)] rounded-t-3xl md:max-h-[90vh] md:min-h-[600px] md:rounded-3xl'
          : 'min-h-[620px] rounded-3xl border border-sand'
      }`}
    >
      {rail}

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        {mobileHeader}

        {onClose && (
          <button type="button" onClick={onClose} aria-label={__('Close trip designer', 'suntourz')} className="absolute right-5 top-5 z-10 hidden h-10 w-10 items-center justify-center rounded-full border border-sand bg-white text-ink transition-colors hover:bg-sand-soft md:flex">
            <X className="h-5 w-5" aria-hidden />
          </button>
        )}

        {done ? (
          <div ref={body} className="min-h-0 flex-1 overflow-y-auto px-5 py-8 sm:px-10 sm:py-12" role="status">
            <div className="stz-pop-in mx-auto max-w-lg text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-forest text-gold shadow-lg">
                <Check className="h-8 w-8" aria-hidden />
              </div>
              <h2 ref={heading} tabIndex={-1} className="font-serif-editorial mt-5 text-2xl font-bold text-forest focus:outline-none sm:text-3xl">{__('Your Journey Request is Received', 'suntourz')}</h2>
              <p className="mt-3 text-sm font-light leading-relaxed text-muted">
                {sprintf(__('Thank you, %1$s. Your Thailand specialist will review your preferences and contact you %2$s by %3$s with a tailored itinerary.', 'suntourz'), form.name.trim() || __('Traveler', 'suntourz'), done.responseTime, viaLabel[via])}
              </p>

              <dl className="mt-6 space-y-2 rounded-2xl border border-sand bg-white p-5 text-left text-sm">
                <div className="flex justify-between gap-4"><dt className="text-muted-soft">{__('Reference ID:', 'suntourz')}</dt><dd className="font-mono font-bold text-forest">{done.reference}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-muted-soft">{__('Destination:', 'suntourz')}</dt><dd className="text-right font-semibold">{form.destination}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-muted-soft">{__('Duration:', 'suntourz')}</dt><dd className="text-right font-semibold">{form.duration}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-muted-soft">{__('Travelers:', 'suntourz')}</dt><dd className="text-right font-semibold">{form.travelers}</dd></div>
              </dl>

              <ol className="mt-6 space-y-3 text-left text-sm text-muted">
                {[__('We read your wishes and check availability.', 'suntourz'), sprintf(__('A specialist contacts you by %s.', 'suntourz'), viaLabel[via]), __('You receive a proposal — adjust it until it is perfect.', 'suntourz')].map((text, index) => (
                  <li key={text} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-forest/10 text-xs font-bold text-forest">{index + 1}</span>
                    <span className="pt-0.5">{text}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
                {waHref && (
                  <a
                    href={`${waHref}?text=${encodeURIComponent(sprintf(__('Hello! My trip request reference is %s.', 'suntourz'), done.reference))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="stz-press inline-flex items-center justify-center gap-2 rounded-full bg-whatsapp px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white hover:opacity-90"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden />
                    {__('Message us on WhatsApp', 'suntourz')}
                  </a>
                )}
                {onClose ? (
                  <button type="button" onClick={onClose} className="stz-press rounded-full bg-forest px-8 py-3 text-xs font-semibold uppercase tracking-wider text-white hover:bg-forest-soft">
                    {__('Return to Website', 'suntourz')}
                  </button>
                ) : (
                  <a href={data.site.url} className="stz-press rounded-full bg-forest px-8 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white hover:bg-forest-soft">
                    {__('Return to Website', 'suntourz')}
                  </a>
                )}
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={(event) => void onSubmit(event)} noValidate className="flex min-h-0 flex-1 flex-col">
            <div ref={body} className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-10 sm:py-9">
              <div key={step} className="stz-step-in mx-auto max-w-2xl">
                <div className="mb-6 pr-12">
                  <p className="mb-1 hidden text-[11px] font-bold uppercase tracking-[0.2em] text-gold-dark md:block">{sprintf(__('Step %1$d of %2$d', 'suntourz'), step, STEPS)}</p>
                  <h2 ref={heading} tabIndex={-1} className="font-serif-editorial text-2xl font-bold text-ink focus:outline-none sm:text-3xl">
                    {[__('Where would you like to go?', 'suntourz'), __('When and who is travelling?', 'suntourz'), __('How would you like to stay?', 'suntourz'), __('How can we reach you?', 'suntourz')][step - 1]}
                  </h2>
                  <p className="mt-1.5 text-sm font-light text-muted">
                    {
                      [
                        __('Choose a destination and the style of trip that feels like you.', 'suntourz'),
                        __('Tell us your timing, trip length and group size.', 'suntourz'),
                        __('Comfort level, budget and the experiences you care about.', 'suntourz'),
                        __('Leave your details and we will prepare a tailored proposal.', 'suntourz'),
                      ][step - 1]
                    }
                  </p>
                </div>

                {step === 1 && (
                  <div className="space-y-7">
                    <Group id="stz-plan-dest" label={__('Destination', 'suntourz')}>
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" role="radiogroup" aria-labelledby="stz-plan-dest">
                        {planner.destinations.map((destination) => (
                          <Choice key={destination} active={form.destination === destination} onClick={() => set('destination', destination)} icon={<MapPin className="h-4 w-4" aria-hidden />}>
                            {destination}
                          </Choice>
                        ))}
                      </div>
                    </Group>
                    <Group id="stz-plan-style" label={__('Travel style', 'suntourz')}>
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" role="radiogroup" aria-labelledby="stz-plan-style">
                        {planner.styles.map((style) => {
                          const Icon = styleIcon(style);
                          return (
                            <Choice key={style} active={form.style === style} onClick={() => set('style', style)} icon={<Icon className="h-4 w-4" aria-hidden />}>
                              {style}
                            </Choice>
                          );
                        })}
                      </div>
                    </Group>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-7">
                    <Group id="stz-plan-season" label={__('When are you planning to travel?', 'suntourz')}>
                      <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="stz-plan-season">
                        {planner.seasons.map((season) => (
                          <Pill key={season} active={form.season === season} onClick={() => set('season', season)}>{season}</Pill>
                        ))}
                      </div>
                    </Group>
                    <Group id="stz-plan-duration" label={__('Trip Duration', 'suntourz')}>
                      <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="stz-plan-duration">
                        {planner.durations.map((duration) => (
                          <Pill key={duration} active={form.duration === duration} onClick={() => set('duration', duration)}>{duration}</Pill>
                        ))}
                      </div>
                    </Group>
                    <Group id="stz-plan-travelers" label={__('Number of Travelers', 'suntourz')}>
                      <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="stz-plan-travelers">
                        {planner.travelers.map((travelers) => (
                          <Pill key={travelers} active={form.travelers === travelers} onClick={() => set('travelers', travelers)}>{travelers}</Pill>
                        ))}
                      </div>
                    </Group>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-7">
                    <Group id="stz-plan-hotel" label={__('Accommodation Standard', 'suntourz')}>
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" role="radiogroup" aria-labelledby="stz-plan-hotel">
                        {planner.hotels.map((hotel) => (
                          <Choice key={hotel} active={form.hotel === hotel} onClick={() => set('hotel', hotel)} icon={<BedDouble className="h-4 w-4" aria-hidden />}>
                            {hotel}
                          </Choice>
                        ))}
                      </div>
                    </Group>
                    <Group id="stz-plan-budget" label={__('Budget', 'suntourz')}>
                      <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="stz-plan-budget">
                        {planner.budgets.map((budget) => (
                          <Pill key={budget} active={form.budget === budget} onClick={() => set('budget', budget)}>{budget}</Pill>
                        ))}
                      </div>
                    </Group>
                    <Group id="stz-plan-interests" label={__('Special Experiences & Inclusions', 'suntourz')} hint={__('Select all that apply.', 'suntourz')}>
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {planner.interests.map((interest) => (
                          <Choice key={interest} multi active={form.interests.includes(interest)} onClick={() => toggleInterest(interest)}>
                            {interest}
                          </Choice>
                        ))}
                      </div>
                    </Group>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-5">
                    <div className="flex items-start gap-3 rounded-2xl border border-sand bg-white p-4 text-sm text-muted">
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                      <p>
                        {sprintf(__('You are designing a journey to %1$s for %2$s (%3$s).', 'suntourz'), form.destination, form.travelers, form.duration)}
                        {form.tour_ids.length > 0 && (
                          <span className="mt-1 block font-medium text-forest">{sprintf(__('Including %d tour(s) from your shortlist.', 'suntourz'), form.tour_ids.length)}</span>
                        )}
                      </p>
                    </div>

                    <div>
                      <label htmlFor="stz-plan-name" className={labelClass}>{__('Full Name *', 'suntourz')}</label>
                      <input id="stz-plan-name" type="text" required autoComplete="name" value={form.name} aria-invalid={!!fieldError('name')} onChange={(e) => set('name', e.target.value)} className={inputClass} />
                      {errorText('name')}
                    </div>

                    <div>
                      <label htmlFor="stz-plan-phone" className={labelClass}>{__('WhatsApp / Phone', 'suntourz')}</label>
                      <input id="stz-plan-phone" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} aria-invalid={!!fieldError('phone')} onChange={(e) => set('phone', e.target.value)} placeholder="+44 7911 123456" className={inputClass} />
                      {errorText('phone')}
                    </div>

                    <div>
                      <label htmlFor="stz-plan-email" className={labelClass}>{__('Email (optional)', 'suntourz')}</label>
                      <input id="stz-plan-email" type="email" inputMode="email" autoComplete="email" value={form.email} aria-invalid={!!fieldError('email')} onChange={(e) => set('email', e.target.value)} className={inputClass} />
                      {errorText('email')}
                    </div>

                    <Group id="stz-plan-via" label={__('Best way to reach you', 'suntourz')}>
                      <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="stz-plan-via">
                        {viaOptions.map(({ key, label, icon: Icon }) => (
                          <button
                            key={key}
                            type="button"
                            role="radio"
                            aria-checked={via === key}
                            onClick={() => setVia(key)}
                            className={`stz-press inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-semibold transition-all duration-300 sm:text-sm ${via === key ? 'border-forest bg-forest text-white shadow-md' : 'border-sand bg-white text-ink hover:border-forest/40'}`}
                          >
                            <Icon className={`h-4 w-4 ${via === key ? 'text-gold' : 'text-forest'}`} aria-hidden />
                            {label}
                          </button>
                        ))}
                      </div>
                    </Group>

                    <div>
                      <label htmlFor="stz-plan-notes" className={labelClass}>{__('Specific Notes or Wishes', 'suntourz')}</label>
                      <textarea id="stz-plan-notes" rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder={__('Any celebration, dietary preferences, or specific islands you have dreamed of visiting...', 'suntourz')} className={inputClass} />
                    </div>

                    {/* Honeypot: invisible to people, tempting to bots. */}
                    <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                      <label>
                        Website
                        <input type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set('website', e.target.value)} />
                      </label>
                    </div>

                    {failure && (
                      <p role="alert" className="rounded-xl border border-clay/30 bg-clay/5 p-3 text-sm text-clay">
                        {failure}
                        {contact.phone && <> {sprintf(__('You can also call us on %s.', 'suntourz'), contact.phone)}</>}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-sand bg-cream/95 px-5 py-4 backdrop-blur sm:px-10" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
              {step > 1 ? (
                <button type="button" onClick={() => go(step - 1)} className="stz-press flex items-center gap-2 rounded-full border border-sand bg-white px-5 py-3 text-xs font-semibold uppercase tracking-wider text-ink hover:bg-sand-soft">
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                  <span>{__('Back', 'suntourz')}</span>
                </button>
              ) : (
                <span className="hidden text-xs text-muted-soft sm:block">{__('Takes about a minute', 'suntourz')}</span>
              )}

              <button
                type="submit"
                disabled={submitting}
                className={`stz-press group ml-auto flex items-center gap-2 rounded-full bg-forest px-7 py-3.5 text-xs font-semibold uppercase tracking-wider text-white shadow-md hover:bg-forest-soft hover:shadow-lg sm:text-sm ${submitting ? 'cursor-not-allowed opacity-70' : ''}`}
              >
                {step === STEPS ? (
                  <>
                    <span className="sm:hidden">{submitting ? __('Sending…', 'suntourz') : __('Send request', 'suntourz')}</span>
                    <span className="hidden sm:inline">{submitting ? __('Submitting Inquiry...', 'suntourz') : __('Submit My Trip Request', 'suntourz')}</span>
                    <Send className="h-4 w-4 text-gold" aria-hidden />
                  </>
                ) : (
                  <>
                    <span>{__('Next Step', 'suntourz')}</span>
                    <ArrowRight className="h-4 w-4 text-gold transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
