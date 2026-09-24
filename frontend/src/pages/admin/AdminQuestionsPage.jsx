import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Pencil, Trash2, RotateCcw, Search } from 'lucide-react';
import {
  fetchAdminQuestions,
  createAdminQuestion,
  updateAdminQuestion,
  deleteAdminQuestion,
  restoreAdminQuestion,
} from '../../features/adminQuestions/adminQuestionsSlice';
import { fetchTopics } from '../../features/topics/topicSlice';
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
const TYPES = ['Design Pattern', 'LLD Problem', 'Case Study'];
const emptyForm = { title: '', description: '', difficulty: 'Medium', type: 'Design Pattern', expectedTime: 30, topicId: '', module: 'lld', tags: '' };

function QuestionFormModal({ open, initial, topicOptions, onClose, onSubmit, submitting }) {
  const toForm = (q) =>
    q
      ? { ...q, topicId: q.topicId?._id || q.topicId, module: q.moduleId?.slug || q.module, tags: (q.tags || []).join(', ') }
      : emptyForm;
  const [form, setForm] = useState(toForm(initial));

  const identity = `${open}-${initial?._id || 'new'}`;
  const [prevIdentity, setPrevIdentity] = useState(identity);
  if (identity !== prevIdentity) {
    setPrevIdentity(identity);
    setForm(toForm(initial));
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean) });
  };

  const filteredTopics = topicOptions.filter((t) => (t.moduleId?.slug || t.module) === form.module);

  return (
    <Modal open={open} title={initial ? 'Edit question' : 'Add question'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Module" value={form.module} onChange={(e) => setForm({ ...form, module: e.target.value, topicId: '' })}>
            <option value="lld">LLD</option>
            <option value="hld">HLD</option>
          </Select>
          <Select label="Topic" value={form.topicId} onChange={(e) => setForm({ ...form, topicId: e.target.value })} required>
            <option value="">Select a topic…</option>
            {filteredTopics.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select label="Difficulty" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </Select>
          <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
        <Input
          label="Expected time (minutes)"
          type="number"
          value={form.expectedTime}
          onChange={(e) => setForm({ ...form, expectedTime: Number(e.target.value) })}
          required
        />
        <Textarea label="Description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <Input label="Tags (comma-separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
        <Button type="submit" disabled={submitting} className="mt-1">
          {submitting ? 'Saving…' : initial ? 'Save changes' : 'Create question'}
        </Button>
      </form>
    </Modal>
  );
}

export default function AdminQuestionsPage() {
  const dispatch = useDispatch();
  const { questions, total, page, totalPages, status } = useSelector((s) => s.adminQuestions);
  const topicOptions = useSelector((s) => s.topics.items);

  const [module, setModule] = useState('all');
  const [difficulty, setDifficulty] = useState('');
  const [type, setType] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchTopics({}));
  }, [dispatch]);

  useEffect(() => {
    const handle = setTimeout(() => {
      dispatch(
        fetchAdminQuestions({
          module,
          status: statusFilter,
          difficulty: difficulty || undefined,
          type: type || undefined,
          search: search || undefined,
          page: currentPage,
          limit: 20,
        })
      );
    }, 300);
    return () => clearTimeout(handle);
  }, [dispatch, module, statusFilter, difficulty, type, search, currentPage]);

  const filterKey = `${module}-${statusFilter}-${difficulty}-${type}-${search}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setCurrentPage(1);
  }

  const openCreate = () => {
    setEditingQuestion(null);
    setFormOpen(true);
  };
  const openEdit = (q) => {
    setEditingQuestion(q);
    setFormOpen(true);
  };

  const handleFormSubmit = async (form) => {
    setSaving(true);
    const result = editingQuestion
      ? await dispatch(updateAdminQuestion({ id: editingQuestion._id, payload: form }))
      : await dispatch(createAdminQuestion(form));
    setSaving(false);
    if (!result.error) setFormOpen(false);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await dispatch(deleteAdminQuestion(pendingDelete._id));
    setPendingDelete(null);
  };

  const loading = status === 'loading' || status === 'idle';

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[#16181D] dark:text-[#E9EAEC]">Questions</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">{total} machine-coding questions.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} aria-hidden="true" />
          Add question
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <Input label="Search" placeholder="Search by title…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select label="Module" value={module} onChange={(e) => setModule(e.target.value)}>
          <option value="all">All</option>
          <option value="lld">LLD</option>
          <option value="hld">HLD</option>
        </Select>
        <Select label="Difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="">All</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </Select>
        <Select label="Type" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
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
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : questions.length === 0 ? (
        <EmptyState icon={Search} title="No questions found" description="No questions match this search and filter." />
      ) : (
        <div className="flex flex-col gap-2">
          {questions.map((q) => (
            <Card key={q._id} className={`flex items-center justify-between gap-4 p-4 ${!q.isActive ? 'opacity-60' : ''}`}>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-accent)]">
                    {MODULE_LABELS[q.moduleId?.slug]}
                  </span>
                  <p className="truncate text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">{q.title}</p>
                  <DifficultyBadge difficulty={q.difficulty} />
                  {!q.isActive && (
                    <span className="rounded-full bg-[var(--color-danger-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-danger)]">
                      Deleted
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate text-xs text-[var(--color-text-faint)]">
                  Topic: {q.topicId?.name || 'Unknown'} · {q.type}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {q.isActive ? (
                  <>
                    <Button variant="secondary" size="sm" onClick={() => openEdit(q)}>
                      <Pencil size={14} aria-hidden="true" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setPendingDelete(q)}>
                      <Trash2 size={14} aria-hidden="true" />
                    </Button>
                  </>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => dispatch(restoreAdminQuestion(q._id))}>
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

      <QuestionFormModal
        open={formOpen}
        initial={editingQuestion}
        topicOptions={topicOptions}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        submitting={saving}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this question?"
        message={`"${pendingDelete?.title}" will be hidden from users. This can be undone from the Deleted filter.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
