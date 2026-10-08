import {
  createContext,
  lazy,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Check } from 'lucide-react';
import { formatMoney } from '@/lib/format';
import type { Contact, Currency, SiteData } from '@/lib/types';

const PlanMyTripModal = lazy(() => import('@/components/overlays/PlanMyTripModal'));
const ContactInfoModal = lazy(() => import('@/components/overlays/ContactInfoModal'));
const WishlistDrawer = lazy(() => import('@/components/overlays/WishlistDrawer'));

export type PlanTripOptions = {
  destination?: string;
  /** Tours the guest is interested in (e.g. the saved shortlist). */
  tourIds?: number[];
  notes?: string;
};

export type ContactTab = 'contact' | 'faq' | 'policy' | 'about';

type SiteContextValue = {
  data: SiteData;
  contact: Contact;
  currency: Currency;
  openPlanTrip: (options?: PlanTripOptions) => void;
  openContact: (tab?: ContactTab) => void;
  openWishlist: () => void;
  toast: (message: string) => void;
  money: (minor: number) => string;
};

const FALLBACK_CURRENCY: Currency = {
  code: 'THB',
  symbol: '฿',
  position: 'before',
  decimals: 0,
  thousand_separator: ',',
  decimal_separator: '.',
  minor_unit: 100,
};

const SiteContext = createContext<SiteContextValue | null>(null);

export const useSite = (): SiteContextValue => {
  const value = useContext(SiteContext);
  if (!value) throw new Error('useSite must be used inside <SiteProvider>');
  return value;
};

type SiteProviderProps = { data: SiteData; children: ReactNode };

/** Shares site data and owns the popups/drawers/toast that any page can open. */
export const SiteProvider = ({ data, children }: SiteProviderProps) => {
  const [plan, setPlan] = useState<PlanTripOptions | null>(null);
  const [contactTab, setContactTab] = useState<ContactTab | null>(null);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<number>(0);

  const currency = data.currency ?? FALLBACK_CURRENCY;

  const toast = useCallback((text: string) => {
    setMessage(text);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMessage(null), 3000);
  }, []);

  const openPlanTrip = useCallback((options?: PlanTripOptions) => setPlan(options ?? {}), []);
  const openContact = useCallback((tab: ContactTab = 'contact') => setContactTab(tab), []);
  const openWishlist = useCallback(() => setWishlistOpen(true), []);

  // Deep link: /#plan-my-trip opens the trip designer.
  useEffect(() => {
    if (window.location.hash === '#plan-my-trip') setPlan({});
  }, []);

  const value = useMemo<SiteContextValue>(
    () => ({
      data,
      contact: data.contact,
      currency,
      openPlanTrip,
      openContact,
      openWishlist,
      toast,
      money: (minor) => formatMoney(minor, currency),
    }),
    [data, currency, openPlanTrip, openContact, openWishlist, toast],
  );

  return (
    <SiteContext.Provider value={value}>
      {children}

      {message && (
        <div
          role="status"
          className="fixed right-4 z-[60] flex items-center gap-2.5 rounded-xl border border-gold/50 bg-forest px-4 py-3 text-xs font-medium text-white shadow-xl sm:right-8"
          style={{ top: 'calc(5rem + var(--stz-admin-offset))' }}
        >
          <Check className="h-4 w-4 text-gold" aria-hidden />
          <span>{message}</span>
        </div>
      )}

      <Suspense fallback={null}>
        {plan && <PlanMyTripModal options={plan} onClose={() => setPlan(null)} />}
        {contactTab && <ContactInfoModal defaultTab={contactTab} onClose={() => setContactTab(null)} />}
        {wishlistOpen && <WishlistDrawer onClose={() => setWishlistOpen(false)} />}
      </Suspense>
    </SiteContext.Provider>
  );
};
