import { AnimatePresence, motion } from 'framer-motion';
import Button from './Button';

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', onConfirm, onCancel, loading }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            aria-hidden="true"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirm-dialog-title"
              className="w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xl"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.15 }}
            >
              <h2 id="confirm-dialog-title" className="text-base font-semibold text-[#16181D] dark:text-[#E9EAEC]">
                {title}
              </h2>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{message}</p>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={onCancel} disabled={loading}>
                  Cancel
                </Button>
                <Button variant="danger" size="sm" onClick={onConfirm} loading={loading}>
                  {confirmLabel}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
