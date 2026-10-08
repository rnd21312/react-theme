import { useEffect, useRef, type ReactNode } from 'react';

type ModalProps = {
  onClose: () => void;
  /** Accessible name of the dialog. */
  label: string;
  /** "drawer" slides in from the right; "dialog" is centered; "sheet" is a bottom sheet on phones and a dialog from md up. */
  variant?: 'dialog' | 'drawer' | 'sheet';
  /** Classes for the panel (width, background…). */
  className?: string;
  children: ReactNode;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input:not([type="hidden"]), select, [tabindex]:not([tabindex="-1"])';

/** Accessible overlay: Escape closes, focus is trapped and restored, page scroll is locked. */
export const Modal = ({ onClose, label, variant = 'dialog', className = '', children }: ModalProps) => {
  const panel = useRef<HTMLDivElement>(null);
  // Callers pass inline arrows; keep the latest one without re-running the focus/scroll effect.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeRef.current();
        return;
      }
      if (event.key !== 'Tab' || !panel.current) return;

      const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);

  const drawer = variant === 'drawer';
  const sheet = variant === 'sheet';

  const wrapper = drawer
    ? 'overflow-hidden'
    : sheet
      ? 'flex items-end justify-center overflow-hidden md:items-center md:p-6'
      : 'flex items-center justify-center overflow-y-auto p-3 sm:p-6';
  const panelClass = drawer
    ? 'stz-drawer-in absolute inset-y-0 right-0 flex w-screen max-w-md flex-col'
    : sheet
      ? 'stz-sheet-in relative w-full'
      : 'stz-pop-in relative my-auto w-full';

  return (
    <div
      className={`stz-fade-in fixed inset-0 z-[55] bg-black/70 backdrop-blur-sm ${wrapper}`}
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={`${panelClass} focus:outline-none ${className}`}
      >
        {children}
      </div>
    </div>
  );
};
