import { useId, useState, type ReactNode } from 'react';
import {
  ArrowUpRight,
  BookOpen,
  ChevronDown,
  Compass,
  Facebook,
  HelpCircle,
  Instagram,
  Mail,
  MessageSquare,
  Phone,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { __, _n, sprintf } from '@wordpress/i18n';
import { reveal } from '@/lib/reveal';
import { useSite } from '@/site/context';

type FooterSectionProps = {
  title: string;
  /** Open on first render (phones). Wide screens always show every list. */
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
};

/** A footer column: an accordion on phones and tablets, a plain column on desktop. */
const FooterSection = ({ title, defaultOpen = false, className = '', children }: FooterSectionProps) => {
  const [open, setOpen] = useState(defaultOpen);
  const panel = useId();

  return (
    <section className={`border-b border-white/10 lg:border-0 ${className}`}>
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panel}
          onClick={() => setOpen((value) => !value)}
          className="flex w-full items-center justify-between py-4 text-left text-xs font-bold uppercase tracking-wider text-gold transition-colors hover:text-white lg:pointer-events-none lg:cursor-default lg:pb-5 lg:pt-0 lg:hover:text-gold"
        >
          <span>{title}</span>
          <span
            aria-hidden
            className={`flex h-7 w-7 items-center justify-center rounded-full border border-white/15 text-gold transition-transform duration-500 ease-[var(--stz-ease)] lg:hidden ${open ? 'rotate-180 bg-white/10' : ''}`}
          >
            <ChevronDown className="h-4 w-4" />
          </span>
        </button>
      </h3>
      <div id={panel} data-open={open} className="stz-collapse stz-collapse--lg-open">
        <div>
          <div className="pb-5 lg:pb-0">{children}</div>
        </div>
      </div>
    </section>
  );
};

const linkClass = 'group/link inline-flex items-center gap-1.5 text-sm text-mist transition-colors duration-300 hover:text-white';

export const Footer = () => {
  const { data, contact, openContact, openPlanTrip } = useSite();
  const brand = data.content.brand;
  const waHref = contact.whatsapp ? `https://wa.me/${contact.whatsapp}` : '';
  const company = contact.company || data.site.name;
  const supportLinks = data.menus.footer;
  const logo = brand?.logo_image_white || brand?.logo_image;

  const contactCard =
    'group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-mist transition-all duration-300 hover:border-gold/40 hover:bg-white/10 hover:text-white';

  return (
    <footer id="footer-contact" className="border-t border-white/10 bg-forest-night pb-10 pt-14 text-sand lg:pt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-x-10 gap-y-0 lg:grid-cols-12 lg:gap-y-14">
          <div {...reveal()} className="space-y-4 pb-8 lg:col-span-5 lg:pb-0 lg:pr-8">
            <a href={data.site.url} className="inline-flex items-center gap-2.5">
              {logo ? (
                <img src={logo} alt={data.site.name} className="h-11 w-auto max-w-[240px] object-contain" />
              ) : (
                <>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-gold shadow-xs">
                  <Compass className="h-5 w-5" aria-hidden />
                </span>
                <span className="font-friendly text-2xl font-extrabold tracking-tight text-white">{data.site.name}</span>
                {brand?.badge && (
                  <span className="rounded-full border border-gold/40 bg-gold/20 px-2 py-0.5 text-[10px] font-bold uppercase text-gold">{brand.badge}</span>
                )}
                </>
              )}
            </a>

            {brand?.footer_pitch && <p className="max-w-md text-sm font-normal leading-relaxed text-[#A9B2AD]">{brand.footer_pitch}</p>}

            {brand?.license_title && (
              <div className="max-w-md space-y-1.5 rounded-xl border border-white/10 bg-white/5 p-3.5 text-xs text-mist">
                <div className="flex items-center gap-2 font-semibold text-white">
                  <ShieldCheck className="h-4 w-4 text-gold" aria-hidden />
                  <span>{brand.license_title}</span>
                </div>
                <p className="text-[11px] leading-snug text-muted-soft">{brand.license_note}</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => openPlanTrip()}
              className="stz-press group inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-gold hover:bg-gold hover:text-forest"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              <span>{__('Custom Trip Planner', 'suntourz')}</span>
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
            </button>
          </div>

          <FooterSection title={sprintf(__('Contact %s', 'suntourz'), company)} defaultOpen className="border-t lg:col-span-7">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className={contactCard}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400"><Phone className="h-4 w-4" aria-hidden /></span>
                  <span className="min-w-0">
                    <span className="block text-[10px] font-semibold uppercase text-muted-soft">{__('Phone Inquiries', 'suntourz')}</span>
                    <span className="block truncate font-mono text-sm font-bold text-white group-hover:text-gold">{contact.phone}</span>
                  </span>
                </a>
              )}
              {waHref && (
                <a href={waHref} target="_blank" rel="noopener noreferrer" className={contactCard}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-whatsapp/20 text-whatsapp"><MessageSquare className="h-4 w-4" aria-hidden /></span>
                  <span className="min-w-0">
                    <span className="block text-[10px] font-semibold uppercase text-muted-soft">{__('WhatsApp Concierge', 'suntourz')}</span>
                    <span className="block truncate text-sm font-semibold text-white group-hover:text-whatsapp">{__('Chat on WhatsApp', 'suntourz')}</span>
                  </span>
                </a>
              )}
              {contact.telegram && (
                <a href={`https://t.me/${contact.telegram}`} target="_blank" rel="noopener noreferrer" className={contactCard}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-telegram/20 text-telegram"><Send className="h-4 w-4" aria-hidden /></span>
                  <span className="min-w-0">
                    <span className="block text-[10px] font-semibold uppercase text-muted-soft">{__('Telegram Channel', 'suntourz')}</span>
                    <span className="block truncate text-sm font-semibold text-white group-hover:text-telegram">@{contact.telegram}</span>
                  </span>
                </a>
              )}
              {contact.email && (
                <a href={`mailto:${contact.email}`} className={contactCard}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold/20 text-gold"><Mail className="h-4 w-4" aria-hidden /></span>
                  <span className="min-w-0">
                    <span className="block text-[10px] font-semibold uppercase text-muted-soft">{__('Email Desk', 'suntourz')}</span>
                    <span className="block truncate text-sm font-semibold text-white group-hover:text-gold">{contact.email}</span>
                  </span>
                </a>
              )}
            </div>
            {contact.response && <p className="mt-4 text-xs text-muted-soft">{sprintf(__('We usually reply %s.', 'suntourz'), contact.response)}</p>}
          </FooterSection>

          <div className="lg:col-span-12">
            <div className="grid grid-cols-1 lg:grid-cols-4 lg:gap-10 lg:border-t lg:border-white/10 lg:pt-12">
              <FooterSection title={__('Destinations', 'suntourz')}>
                <ul className="space-y-3">
                  {data.destinations.map((destination) => (
                    <li key={destination.id}>
                      <a href={destination.url} className={linkClass}>{destination.name}</a>
                    </li>
                  ))}
                  <li>
                    <a href={data.site.toursUrl} className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold hover:underline">{__('All tours', 'suntourz')}</a>
                  </li>
                </ul>
              </FooterSection>

              <FooterSection title={__('Top Tours', 'suntourz')}>
                <ul className="space-y-3.5">
                  {data.topTours.map((tour) => (
                    <li key={tour.id}>
                      <a href={tour.url} className="block text-sm font-medium text-mist transition-colors duration-300 hover:text-white">{tour.title}</a>
                      <span className="text-[11px] text-muted-soft">
                        {sprintf(_n('%d day', '%d days', tour.duration_days, 'suntourz'), tour.duration_days)}
                        {tour.destination ? ` · ${tour.destination}` : ''}
                      </span>
                    </li>
                  ))}
                  {data.topTours.length === 0 && (
                    <li>
                      <a href={data.site.toursUrl} className={linkClass}>{__('Browse all tours', 'suntourz')}</a>
                    </li>
                  )}
                </ul>
              </FooterSection>

              <FooterSection title={__('Experiences', 'suntourz')}>
                <ul className="space-y-3">
                  {data.styles.map((style) => (
                    <li key={style.id}>
                      <a href={style.url} className={linkClass}>{style.name}</a>
                    </li>
                  ))}
                  <li>
                    <a href={data.site.blogUrl} className={linkClass}>
                      <BookOpen className="h-3.5 w-3.5 text-gold" aria-hidden />
                      <span>{__('Travel Guide & Blog', 'suntourz')}</span>
                    </a>
                  </li>
                </ul>
              </FooterSection>

              <FooterSection title={__('Customer Support', 'suntourz')}>
                <ul className="space-y-3">
                  {supportLinks.length > 0 ? (
                    supportLinks.map((item) => (
                      <li key={item.id}>
                        <a href={item.url} className={linkClass}>{item.label}</a>
                      </li>
                    ))
                  ) : (
                    <>
                      <li>
                        <button type="button" onClick={() => openContact('faq')} className={linkClass}>
                          <HelpCircle className="h-3.5 w-3.5 text-gold" aria-hidden />
                          <span>{__('Help Center & FAQs', 'suntourz')}</span>
                        </button>
                      </li>
                      <li>
                        <button type="button" onClick={() => openContact('policy')} className={linkClass}>
                          <RotateCcw className="h-3.5 w-3.5 text-gold" aria-hidden />
                          <span>{__('Refund & Cancellation', 'suntourz')}</span>
                        </button>
                      </li>
                      <li>
                        <button type="button" onClick={() => openContact('about')} className={linkClass}>
                          <span>{__('About Us', 'suntourz')}</span>
                        </button>
                      </li>
                      <li>
                        <button type="button" onClick={() => openContact('contact')} className={linkClass}>
                          <span>{__('Contact Us', 'suntourz')}</span>
                        </button>
                      </li>
                    </>
                  )}
                </ul>
              </FooterSection>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-muted-soft sm:flex-row lg:mt-12">
          <div className="text-center sm:text-left">
            {brand?.copyright || `© ${new Date().getFullYear()} ${company}. ${__('All rights reserved.', 'suntourz')}`}
          </div>
          <div className="flex items-center gap-5">
            {waHref && (
              <a href={waHref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-white/70 transition-colors hover:text-whatsapp">
                <MessageSquare className="h-4 w-4" aria-hidden />
                <span>WhatsApp</span>
              </a>
            )}
            {contact.telegram && (
              <a href={`https://t.me/${contact.telegram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-white/70 transition-colors hover:text-telegram">
                <Send className="h-4 w-4" aria-hidden />
                <span>Telegram</span>
              </a>
            )}
            {contact.instagram && (
              <a href={contact.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-white/70 transition-colors hover:text-gold">
                <Instagram className="h-4 w-4" aria-hidden />
              </a>
            )}
            {contact.facebook && (
              <a href={contact.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-white/70 transition-colors hover:text-gold">
                <Facebook className="h-4 w-4" aria-hidden />
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
