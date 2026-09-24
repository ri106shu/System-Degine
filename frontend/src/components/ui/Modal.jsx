import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

export default function Modal({ open, title, onClose, children }) {
  // Locks the page behind the modal so scrolling never lands on two
  // independently-scrollable regions at once (the page and the modal) —
  // exactly the ambiguity that let the modal's own header scroll out of
  // view in the first place.
  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="fixed inset-0 z-50 flex items-start justify-center px-4 py-8 sm:items-center">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              className="flex max-h-[85vh] w-full max-w-md flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.15 }}
            >
              {/* Header stays put; only the body below scrolls. A long form
                  (like the roadmap day editor) can never scroll the title
                  or close button out of view. */}
              <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] p-5 pb-4">
                <h2 id="modal-title" className="text-base font-semibold text-[#16181D] dark:text-[#E9EAEC]">
                  {title}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-[var(--color-text-faint)] hover:bg-[var(--color-surface-2)]"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="overflow-y-auto p-5">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
