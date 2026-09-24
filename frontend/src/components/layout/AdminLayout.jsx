import { useState } from 'react';
import { Outlet } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import Topbar from './Topbar';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const title = usePageTitle();

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-base)]">
      <aside className="hidden w-64 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] md:block">
        <AdminSidebar />
      </aside>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              className="fixed inset-y-0 left-0 z-50 w-72 bg-[var(--color-surface)] shadow-xl md:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.2 }}
              role="dialog"
              aria-modal="true"
              aria-label="Admin navigation menu"
            >
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="absolute right-3 top-4 rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]"
                aria-label="Close navigation menu"
              >
                <X size={18} />
              </button>
              <AdminSidebar onNavigate={() => setDrawerOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setDrawerOpen(true)} title={title} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
