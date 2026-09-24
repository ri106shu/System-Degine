import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Pencil, Trash2, RotateCcw, Search } from 'lucide-react';
import {
  fetchAdminTopics,
  createAdminTopic,
  updateAdminTopic,
  deleteAdminTopic,
  restoreAdminTopic,
} from '../../features/adminTopics/adminTopicsSlice';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Modal from '../../components/ui/Modal';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import DifficultyBadge from '../../components/ui/DifficultyBadge';

const MODULE_LABELS = { lld: 'LLD', hld: 'HLD' };
const emptyForm = { name: '', description: '', category: '', difficulty: 'Medium', module: 'lld', order: 0 };

function TopicFormModal({ open, initial, onClose, onSubmit, submitting }) {
  const [form, setForm] = useState(initial || emptyForm);

  // Resets the form to the target topic (or a blank one) whenever the modal
  // opens on a different target — keyed on the modal's own open+id identity
  // during render rather than a useEffect, matching the pattern used
  // elsewhere in this app for "adjust state when a prop changes."
  const identity = `${open}-${initial?._id || 'new'}`;
  const [prevIdentity, setPrevIdentity] = useState(identity);
  if (identity !== prevIdentity) {
    setPrevIdentity(identity);
    setForm(initial || emptyForm);
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Modal open={open} title={initial ? 'Edit topic' : 'Add topic'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Module" value={form.module} onChange={(e) => setForm({ ...form, module: e.target.value })}>
            <option value="lld">LLD</option>
            <option value="hld">HLD</option>
          </Select>
          <Select label="Difficulty" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </Select>
        </div>
        <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
        <Textarea label="Description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <Input
          label="Display order"
          type="number"
          value={form.order}
          onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
        />
        <Button type="submit" disabled={submitting} className="mt-1">
          {submitting ? 'Saving…' : initial ? 'Save changes' : 'Create topic'}
        </Button>
      </form>
    </Modal>
  );
}

export default function AdminTopicsPage() {
  const dispatch = useDispatch();
  const { topics, total, page, totalPages, status } = useSelector((s) => s.adminTopics);

  const [module, setModule] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => {
      dispatch(fetchAdminTopics({ module, status: statusFilter, search: search || undefined, page: currentPage, limit: 20 }));
    }, 300);
    return () => clearTimeout(handle);
  }, [dispatch, module, statusFilter, search, currentPage]);

  const filterKey = `${module}-${statusFilter}-${search}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setCurrentPage(1);
  }

  const openCreate = () => {
    setEditingTopic(null);
    setFormOpen(true);
  };
  const openEdit = (topic) => {
    setEditingTopic(topic);
    setFormOpen(true);
  };

  const handleFormSubmit = async (form) => {
    setSaving(true);
    const result = editingTopic
      ? await dispatch(updateAdminTopic({ id: editingTopic._id, payload: form }))
      : await dispatch(createAdminTopic(form));
    setSaving(false);
    if (!result.error) setFormOpen(false);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await dispatch(deleteAdminTopic(pendingDelete._id));
    setPendingDelete(null);
  };

  const loading = status === 'loading' || status === 'idle';

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[#16181D] dark:text-[#E9EAEC]">Topics</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">{total} topics across LLD and HLD.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} aria-hidden="true" />
          Add topic
        </Button>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input label="Search" placeholder="Search by name, category…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select label="Module" value={module} onChange={(e) => setModule(e.target.value)}>
          <option value="all">All</option>
          <option value="lld">LLD</option>
          <option value="hld">HLD</option>
        </Select>
        <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="active">Active</option>
          <option value="inactive">Deleted</option>
          <option value="all">All</option>
        </Select>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : topics.length === 0 ? (
        <EmptyState icon={Search} title="No topics found" description="No topics match this search and filter." />
      ) : (
        <div className="flex flex-col gap-2">
          {topics.map((t) => (
            <Card key={t._id} className={`flex items-center justify-between gap-4 p-4 ${!t.isActive ? 'opacity-60' : ''}`}>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-accent)]">
                    {MODULE_LABELS[t.moduleId?.slug]}
                  </span>
                  <p className="truncate text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">{t.name}</p>
                  <DifficultyBadge difficulty={t.difficulty} />
                  {!t.isActive && (
                    <span className="rounded-full bg-[var(--color-danger-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-danger)]">
                      Deleted
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate text-xs text-[var(--color-text-faint)]">{t.category}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {t.isActive ? (
                  <>
                    <Button variant="secondary" size="sm" onClick={() => openEdit(t)}>
                      <Pencil size={14} aria-hidden="true" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setPendingDelete(t)}>
                      <Trash2 size={14} aria-hidden="true" />
                    </Button>
                  </>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => dispatch(restoreAdminTopic(t._id))}>
                    <RotateCcw size={14} aria-hidden="true" />
                    Restore
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
            Previous
          </Button>
          <span className="text-xs text-[var(--color-text-faint)]">
            Page {page} of {totalPages}
          </span>
          <Button variant="secondary" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
            Next
          </Button>
        </div>
      )}

      <TopicFormModal open={formOpen} initial={editingTopic} onClose={() => setFormOpen(false)} onSubmit={handleFormSubmit} submitting={saving} />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this topic?"
        message={`"${pendingDelete?.name}" and any questions attached to it will be hidden from users. This can be undone from the Deleted filter.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
