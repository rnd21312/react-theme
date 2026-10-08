import { useSyncExternalStore } from 'react';

/** Same storage key as the original landing page. Stores tour post ids. */
const KEY = 'suntourz_wishlist';

const read = (): number[] => {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(parsed)
      ? [...new Set(parsed.filter((id): id is number => Number.isInteger(id) && id > 0))]
      : [];
  } catch {
    return [];
  }
};

let current: number[] = read();
const listeners = new Set<() => void>();

const commit = (next: number[]) => {
  current = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage may be blocked (private mode): the list still works for this page view.
  }
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);

  // Keep several open tabs in sync.
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY) {
      current = read();
      listener();
    }
  };
  window.addEventListener('storage', onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
};

export const wishlist = {
  /** Toggles a tour and returns whether it is now saved. */
  toggle: (id: number): boolean => {
    const saved = current.includes(id);
    commit(saved ? current.filter((x) => x !== id) : [...current, id]);
    return !saved;
  },
  remove: (id: number) => commit(current.filter((x) => x !== id)),
};

/** Reactive list of saved tour ids. */
export const useWishlist = (): number[] =>
  useSyncExternalStore(subscribe, () => current, () => []);
