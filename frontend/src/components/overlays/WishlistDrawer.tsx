import { useEffect, useState } from 'react';
import { ArrowRight, Heart, Trash2, X } from 'lucide-react';
import { __, _n, sprintf } from '@wordpress/i18n';
import { api } from '@/lib/publicApi';
import type { TourCard } from '@/lib/types';
import { useWishlist, wishlist } from '@/lib/wishlist';
import { useSite } from '@/site/context';
import { Img } from '../primitives';
import { Modal } from './Modal';

type WishlistDrawerProps = { onClose: () => void };

const WishlistDrawer = ({ onClose }: WishlistDrawerProps) => {
  const ids = useWishlist();
  const { money, openPlanTrip, toast } = useSite();
  const [tours, setTours] = useState<TourCard[]>([]);
  const [loading, setLoading] = useState(ids.length > 0);
  const [failed, setFailed] = useState(false);

  // Load the saved tours (the list itself only stores ids in this browser).
  useEffect(() => {
    if (ids.length === 0) {
      setTours([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    api
      .tours({ include: ids, per_page: 50 }, controller.signal)
      .then((response) => {
        setTours(response.items);
        setFailed(false);
        // Forget tours that were unpublished meanwhile.
        const known = new Set(response.items.map((tour) => tour.id));
        ids.filter((id) => !known.has(id)).forEach((id) => wishlist.remove(id));
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) setFailed(true);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when the set of ids changes
  }, [ids.join(',')]);

  const visible = tours.filter((tour) => ids.includes(tour.id));

  const requestQuote = () => {
    onClose();
    openPlanTrip({
      tourIds: visible.map((tour) => tour.id),
      notes: sprintf(
        _n('Shortlist of %d tour: %s', 'Shortlist of %d tours: %s', visible.length, 'suntourz'),
        visible.length,
        visible.map((tour) => tour.title).join(', '),
      ),
    });
  };

  return (
    <Modal onClose={onClose} label={__('Saved journeys', 'suntourz')} variant="drawer" className="border-l border-sand bg-cream shadow-2xl">
      <div className="flex items-center justify-between border-b border-sand bg-white p-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-gold">
            <Heart className="h-4 w-4 fill-current" aria-hidden />
          </div>
          <div>
            <h2 className="font-serif-editorial text-base font-bold text-forest">
              {sprintf(__('Saved Journeys (%d)', 'suntourz'), ids.length)}
            </h2>
            <p className="text-[11px] text-muted-soft">{__('Curate your dream Thailand itinerary', 'suntourz')}</p>
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label={__('Close saved wishlist', 'suntourz')} className="rounded-full p-2 text-muted-soft hover:bg-cream hover:text-ink">
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        {ids.length === 0 ? (
          <div className="space-y-3 py-16 text-center text-muted-soft">
            <Heart className="mx-auto h-10 w-10 stroke-1 text-[#D1C7BC]" aria-hidden />
            <p className="text-sm font-medium text-ink">{__('No journeys saved yet', 'suntourz')}</p>
            <p className="mx-auto max-w-xs text-xs">
              {__('Click the heart icon on any tour to save it to your personal shortlist.', 'suntourz')}
            </p>
          </div>
        ) : loading && visible.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">{__('Loading your saved journeys…', 'suntourz')}</p>
        ) : failed ? (
          <p className="py-10 text-center text-sm text-clay">{__('Could not load your saved journeys. Please try again.', 'suntourz')}</p>
        ) : (
          visible.map((tour) => (
            <div key={tour.id} className="group relative flex gap-3 rounded-xl border border-sand bg-white p-3.5">
              <Img image={tour.image} alt={tour.title} className="h-20 w-20 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0 flex-1 pr-6">
                <span className="block truncate text-[10px] font-bold uppercase tracking-wider text-muted-soft">
                  {tour.destinations.map((d) => d.name).join(' · ')}
                </span>
                <a href={tour.url} className="block truncate font-serif-editorial text-sm font-bold text-ink hover:text-forest">
                  {tour.title}
                </a>
                <p className="mt-0.5 text-xs text-muted">
                  {sprintf(_n('%d Day', '%d Days', tour.duration_days, 'suntourz'), tour.duration_days)}
                </p>
                {tour.price_from !== null && (
                  <div className="mt-1.5 text-xs font-bold text-forest">
                    {__('From', 'suntourz')} {money(tour.price_from)}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  wishlist.remove(tour.id);
                  toast(__('Journey removed from wishlist', 'suntourz'));
                }}
                title={__('Remove from wishlist', 'suntourz')}
                aria-label={sprintf(__('Remove %s from wishlist', 'suntourz'), tour.title)}
                className="absolute right-3 top-3 p-1 text-muted-soft hover:text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          ))
        )}
      </div>

      {visible.length > 0 && (
        <div className="space-y-3 border-t border-sand bg-white p-6">
          <button
            type="button"
            onClick={requestQuote}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-forest py-3 text-xs font-semibold uppercase tracking-wider text-white shadow-md hover:bg-forest-soft"
          >
            <span>{__('Request Custom Quote for Shortlist', 'suntourz')}</span>
            <ArrowRight className="h-4 w-4 text-gold" aria-hidden />
          </button>
        </div>
      )}
    </Modal>
  );
};

export default WishlistDrawer;
