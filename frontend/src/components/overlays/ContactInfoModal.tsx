import { useState } from 'react';
import { CheckCircle2, ChevronDown, Clock, ExternalLink, HelpCircle, Mail, MapPin, MessageSquare, Phone, RotateCcw, Send, ShieldCheck, X } from 'lucide-react';
import { __ } from '@wordpress/i18n';
import { useSite, type ContactTab } from '@/site/context';
import { Modal } from './Modal';

type ContactInfoModalProps = { defaultTab: ContactTab; onClose: () => void };

const TONE: Record<string, string> = {
  good: 'text-emerald-700',
  warn: 'text-amber-700',
  alert: 'text-orange-700',
  bad: 'text-rose-700',
};

const ContactInfoModal = ({ defaultTab, onClose }: ContactInfoModalProps) => {
  const { data, contact, openPlanTrip } = useSite();
  const support = data.content.support;
  const [tab, setTab] = useState<ContactTab>(defaultTab);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const company = contact.company || data.site.name;
  const waHref = contact.whatsapp ? `https://wa.me/${contact.whatsapp}` : '';

  const tabs: { id: ContactTab; label: string; icon: typeof Phone }[] = [
    { id: 'contact', label: __('Contact & Direct Desks', 'suntourz'), icon: Phone },
    { id: 'faq', label: __('FAQs', 'suntourz'), icon: HelpCircle },
    { id: 'policy', label: __('Refund & Cancellation', 'suntourz'), icon: RotateCcw },
    { id: 'about', label: __('About', 'suntourz') + ' ' + company, icon: ShieldCheck },
  ];

  const card = 'group block rounded-xl border border-sand bg-white p-4 shadow-xs transition-all hover:shadow-md';

  return (
    <Modal onClose={onClose} label={__('Contact, FAQs and policies', 'suntourz')} className="max-w-4xl">
      <div className="flex max-h-[92vh] flex-col overflow-hidden rounded-2xl border border-sand bg-cream shadow-2xl">
        <div className="flex items-center justify-between border-b border-gold/30 bg-forest p-5 text-white sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/40 bg-gold/20 text-gold">
              <Phone className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-friendly text-xl font-bold uppercase tracking-wider text-white">{company} {__('Concierge', 'suntourz')}</span>
                <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-forest">{__('24/7 Active', 'suntourz')}</span>
              </div>
              <p className="text-xs text-white/70">{__('Official contact desk, guest assistance & policies', 'suntourz')}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label={__('Close dialog', 'suntourz')} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div role="tablist" className="no-scrollbar flex items-center gap-2 overflow-x-auto border-b border-sand bg-white px-4 sm:gap-4 sm:px-6">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`stz-contact-tab-${id}`}
              aria-selected={tab === id}
              aria-controls="stz-contact-panel"
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3.5 text-xs font-semibold transition-all sm:text-sm ${
                tab === id ? 'border-forest text-forest' : 'border-transparent text-muted-soft hover:text-ink'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div role="tabpanel" id="stz-contact-panel" aria-labelledby={`stz-contact-tab-${tab}`} className="flex-1 space-y-6 overflow-y-auto p-5 text-ink sm:p-7">
          {tab === 'contact' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} className={`${card} hover:border-gold`}>
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 transition-transform group-hover:scale-110"><Phone className="h-4 w-4" aria-hidden /></div>
                    <div className="text-[11px] font-semibold uppercase text-muted-soft">{__('Phone Support', 'suntourz')}</div>
                    <div className="mt-0.5 font-mono text-sm font-bold text-forest">{contact.phone}</div>
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600"><span>{__('Direct Call', 'suntourz')}</span><ExternalLink className="h-3 w-3" aria-hidden /></div>
                  </a>
                )}
                {waHref && (
                  <a href={waHref} target="_blank" rel="noopener noreferrer" className={`${card} hover:border-whatsapp`}>
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-whatsapp/10 text-whatsapp transition-transform group-hover:scale-110"><MessageSquare className="h-4 w-4" aria-hidden /></div>
                    <div className="text-[11px] font-semibold uppercase text-muted-soft">{__('WhatsApp Concierge', 'suntourz')}</div>
                    <div className="mt-0.5 text-sm font-bold text-forest">{__('Chat on WhatsApp', 'suntourz')}</div>
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-whatsapp"><span>{__('Instant Reply', 'suntourz')}</span><ExternalLink className="h-3 w-3" aria-hidden /></div>
                  </a>
                )}
                {contact.telegram && (
                  <a href={`https://t.me/${contact.telegram}`} target="_blank" rel="noopener noreferrer" className={`${card} hover:border-telegram`}>
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-telegram/10 text-telegram transition-transform group-hover:scale-110"><Send className="h-4 w-4" aria-hidden /></div>
                    <div className="text-[11px] font-semibold uppercase text-muted-soft">{__('Telegram Channel', 'suntourz')}</div>
                    <div className="mt-0.5 text-sm font-bold text-forest">@{contact.telegram}</div>
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-telegram"><span>{__('Updates & Chat', 'suntourz')}</span><ExternalLink className="h-3 w-3" aria-hidden /></div>
                  </a>
                )}
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className={`${card} hover:border-gold`}>
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700 transition-transform group-hover:scale-110"><Mail className="h-4 w-4" aria-hidden /></div>
                    <div className="text-[11px] font-semibold uppercase text-muted-soft">{__('Official Email', 'suntourz')}</div>
                    <div className="mt-0.5 truncate text-xs font-bold text-forest sm:text-sm">{contact.email}</div>
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-700"><span>{__('Send Message', 'suntourz')}</span><ExternalLink className="h-3 w-3" aria-hidden /></div>
                  </a>
                )}
              </div>

              {support && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-3 rounded-xl border border-sand bg-white p-5">
                    <div className="flex items-center gap-2 text-sm font-bold text-forest"><MapPin className="h-4 w-4 text-gold" aria-hidden /><span>{support.address_title}</span></div>
                    <p className="text-xs leading-relaxed text-muted">{support.address}<br />{support.license_line}</p>
                    <div className="flex items-center gap-2 border-t border-sand/60 pt-1 text-xs font-medium text-forest"><Clock className="h-3.5 w-3.5 text-muted-soft" aria-hidden /><span>{support.hours}</span></div>
                  </div>
                  <div className="space-y-3 rounded-xl border border-sand bg-white p-5">
                    <div className="flex items-center gap-2 text-sm font-bold text-forest"><Clock className="h-4 w-4 text-gold" aria-hidden /><span>{support.promise_title}</span></div>
                    <p className="text-xs leading-relaxed text-muted">“{support.promise}”</p>
                    <div className="flex items-center gap-2 border-t border-sand/60 pt-1 text-xs font-medium text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden /><span>{support.guarantee}</span></div>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    openPlanTrip();
                  }}
                  className="flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white shadow-md transition-all hover:bg-forest-soft hover:shadow-lg sm:text-sm"
                >
                  <span>{__('Custom Trip Inquiry', 'suntourz')}</span>
                  <Send className="h-4 w-4 text-gold" aria-hidden />
                </button>
              </div>
            </div>
          )}

          {tab === 'faq' && support && (
            <div className="space-y-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-soft">{__('Frequently Asked Questions', 'suntourz')}</div>
              {support.faqs.map((faq, index) => (
                <div key={faq.q} className="overflow-hidden rounded-xl border border-sand bg-white">
                  <h3>
                    <button
                      type="button"
                      aria-expanded={openFaq === index}
                      onClick={() => setOpenFaq(openFaq === index ? null : index)}
                      className="flex w-full items-center justify-between gap-4 p-4 text-left text-sm font-semibold text-forest transition-colors hover:bg-[#FDFBF9] sm:p-5 sm:text-base"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown className={`h-4 w-4 shrink-0 text-muted-soft transition-transform duration-200 ${openFaq === index ? 'rotate-180 text-forest' : ''}`} aria-hidden />
                    </button>
                  </h3>
                  {openFaq === index && (
                    <div className="border-t border-sand/60 px-4 pb-4 pt-3 text-xs leading-relaxed text-muted sm:px-5 sm:pb-5 sm:text-sm">{faq.a}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === 'policy' && support && (
            <div className="space-y-5 text-xs leading-relaxed text-muted sm:text-sm">
              <div className="space-y-4 rounded-xl border border-sand bg-white p-5">
                <div className="flex items-center justify-between gap-3 border-b border-sand pb-3">
                  <h3 className="text-base font-bold text-forest">{support.policy.title}</h3>
                  <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">{support.policy.effective}</span>
                </div>
                <p>{support.policy.intro}</p>
                <div className="overflow-x-auto rounded-lg border border-sand">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-sand bg-cream font-bold text-forest">
                      <tr>
                        <th className="p-3">{__('Notice Before Tour Date', 'suntourz')}</th>
                        <th className="p-3">{__('Refund Eligibility', 'suntourz')}</th>
                        <th className="p-3">{__('Rescheduling', 'suntourz')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sand">
                      {support.policy.rows.map((row) => (
                        <tr key={row.notice} className="bg-white">
                          <td className="p-3 font-semibold text-forest">{row.notice}</td>
                          <td className={`p-3 font-bold ${TONE[row.tone] ?? ''}`}>{row.refund}</td>
                          <td className="p-3 text-muted">{row.reschedule}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="space-y-2 pt-2">
                  <h4 className="font-bold text-forest">{support.policy.weather_title}</h4>
                  <p>{support.policy.weather}</p>
                </div>
                <div className="space-y-1 rounded-lg border border-sand bg-cream p-3.5 text-xs">
                  <span className="font-bold text-forest">{support.policy.how_to_title}</span>
                  {contact.email && <div>{__('Email:', 'suntourz')} <a href={`mailto:${contact.email}`} className="font-semibold text-emerald-700 underline">{contact.email}</a></div>}
                  {contact.phone && <div>{__('WhatsApp/Phone:', 'suntourz')} <span className="font-mono font-semibold text-forest">{contact.phone}</span></div>}
                  <div className="text-[11px] text-muted-soft">{support.policy.how_to_note}</div>
                </div>
              </div>
            </div>
          )}

          {tab === 'about' && support && (
            <div className="space-y-4 text-xs leading-relaxed text-muted sm:text-sm">
              <div className="space-y-4 rounded-xl border border-sand bg-white p-5 sm:p-6">
                <h3 className="font-friendly text-lg font-bold text-forest">{support.about.title}</h3>
                {support.about.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                <div className="grid grid-cols-1 gap-3 border-t border-sand pt-3 sm:grid-cols-3">
                  {support.about.badges.map((badge) => (
                    <div key={badge.title} className="rounded-lg border border-sand bg-cream p-3">
                      <div className="text-sm font-bold text-forest">{badge.title}</div>
                      <div className="text-[11px] text-muted-soft">{badge.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-sand bg-cream px-6 py-4 text-xs text-muted-soft sm:flex-row">
          <span>© {new Date().getFullYear()} {company}</span>
          <button type="button" onClick={onClose} className="rounded-full border border-sand bg-white px-4 py-2 font-semibold text-ink transition-colors hover:bg-sand-soft">
            {__('Close', 'suntourz')}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ContactInfoModal;
