import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FileText, Layers, Network, BookOpen, CircleHelp, Search, Eye, Pencil, Trash2 } from 'lucide-react';
import {
  fetchAdminNotes,
  fetchAdminNoteStats,
  fetchAdminNoteDetail,
  deleteAdminNote,
  clearAdminNoteDetail,
} from '../../features/adminNotes/adminNotesSlice';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import AdminNoteEditModal from '../../components/admin/AdminNoteEditModal';

const MODULE_LABELS = { lld: 'LLD', hld: 'HLD' };
const TYPE_LABELS = { topic: 'Theory', question: 'Question' };

const formatDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

function StatCard({ icon: Icon, label, value }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-[var(--color-text-faint)]">
        <Icon size={15} aria-hidden="true" />
        <p className="text-xs font-medium">{label}</p>
      </div>
      <p className="mt-1.5 font-mono text-2xl font-semibold text-[#16181D] dark:text-[#E9EAEC]">{value}</p>
    </Card>
  );
}

function NoteDetailModal({ open, note, loading, onClose, onEdit, onDelete }) {
  return (
    <Modal open={open} title="Note detail" onClose={onClose}>
      {loading || !note ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-faint)]">User</p>
            <p className="text-sm text-[#16181D] dark:text-[#E9EAEC]">{note.user?.name}</p>
            <p className="text-xs text-[var(--color-text-faint)]">{note.user?.email}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-[var(--color-text-faint)]">Module</p>
              <p className="text-[#16181D] dark:text-[#E9EAEC]">{MODULE_LABELS[note.module] || note.module}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-faint)]">Type</p>
              <p className="text-[#16181D] dark:text-[#E9EAEC]">{TYPE_LABELS[note.targetType]}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-[var(--color-text-faint)]">Related {note.targetType === 'topic' ? 'Topic' : 'Question'}</p>
              <p className="text-[#16181D] dark:text-[#E9EAEC]">{note.targetLabel}</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-faint)]">{note.title}</p>
            <div className="mt-1 max-h-[35vh] overflow-y-auto whitespace-pre-wrap rounded-lg bg-[var(--color-surface-2)] p-3 text-sm text-[var(--color-text-secondary)]">
              {note.content || 'No content written yet.'}
            </div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-text-faint)]">
            <span>Created: {formatDateTime(note.createdAt)}</span>
            <span>Updated: {formatDateTime(note.updatedAt)}</span>
            {note.lastEditedByAdmin && <span>Last corrected by: {note.lastEditedByAdmin.name}</span>}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onDelete(note)}>
              <Trash2 size={15} aria-hidden="true" />
              Delete Note
            </Button>
            <Button variant="secondary" onClick={() => onEdit(note)}>
              <Pencil size={15} aria-hidden="true" />
              Edit Note
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function AdminNotesPage() {
  const dispatch = useDispatch();
  const { notes, total, page, totalPages, listStatus, stats, detail, detailStatus } = useSelector((s) => s.adminNotes);

  const [module, setModule] = useState('all');
  const [type, setType] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [sort, setSort] = useState('updatedAt_desc');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const filterParams = { module, type, dateRange, sort, search: search || undefined };

  useEffect(() => {
    const handle = setTimeout(() => {
      dispatch(fetchAdminNotes({ ...filterParams, page: currentPage, limit: 20 }));
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, module, type, dateRange, sort, search, currentPage]);

  useEffect(() => {
    dispatch(fetchAdminNoteStats());
  }, [dispatch]);

  const filterKey = `${module}-${type}-${dateRange}-${sort}-${search}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setCurrentPage(1);
  }

  const openDetail = (note) => {
    setDetailOpen(true);
    dispatch(fetchAdminNoteDetail(note._id));
  };
  const closeDetail = () => {
    setDetailOpen(false);
    dispatch(clearAdminNoteDetail());
  };
  const openEdit = (note) => {
    setDetailOpen(false);
    setEditingNote(note);
  };
  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await dispatch(deleteAdminNote(pendingDelete._id));
    setPendingDelete(null);
    closeDetail();
  };

  const loading = listStatus === 'loading' || listStatus === 'idle';
  const hasActiveFilters = module !== 'all' || type !== 'all' || dateRange !== 'all' || search;

  return (
    <div>
      <h2 className="mb-1 text-xl font-semibold text-[#16181D] dark:text-[#E9EAEC]">User Notes</h2>
      <p className="mb-5 text-sm text-[var(--color-text-secondary)]">Review and manage notes created by InterviewForge users.</p>

      {stats && (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard icon={FileText} label="Total notes" value={stats.totalNotes} />
          <StatCard icon={Layers} label="LLD notes" value={stats.lldNotes} />
          <StatCard icon={Network} label="HLD notes" value={stats.hldNotes} />
          <StatCard icon={BookOpen} label="Theory notes" value={stats.theoryNotes} />
          <StatCard icon={CircleHelp} label="Question notes" value={stats.questionNotes} />
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <Input
            label="Search"
            placeholder="Search notes, users, topics, questions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select label="Module" value={module} onChange={(e) => setModule(e.target.value)}>
          <option value="all">All</option>
          <option value="lld">LLD</option>
          <option value="hld">HLD</option>
        </Select>
        <Select label="Type" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="all">All</option>
          <option value="topic">Theory</option>
          <option value="question">Questions</option>
        </Select>
        <Select label="Date" value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
          <option value="all">All time</option>
          <option value="today">Today</option>
          <option value="7d">7 days</option>
          <option value="30d">30 days</option>
          <option value="90d">90 days</option>
        </Select>
        <Select label="Sort" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="updatedAt_desc">Recently updated</option>
          <option value="createdAt_desc">Recently created</option>
          <option value="title_asc">A-Z</option>
        </Select>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : listStatus === 'failed' ? (
        <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
          <p className="text-sm text-[var(--color-text-secondary)]">Unable to load notes.</p>
          <Button onClick={() => dispatch(fetchAdminNotes({ ...filterParams, page: currentPage, limit: 20 }))}>Retry</Button>
        </div>
      ) : notes.length === 0 ? (
        <EmptyState icon={Search} title={hasActiveFilters ? 'No notes match the selected filters.' : 'No user notes yet.'} />
      ) : (
        <>
          <p className="mb-2 text-xs text-[var(--color-text-faint)]">
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
          </p>
          <div className="overflow-x-auto">
            <div className="flex min-w-[760px] flex-col gap-2">
              {notes.map((n) => (
                <Card key={n._id} className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">{n.user?.name || 'Unknown user'}</p>
                      <span className="rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-accent)]">
                        {MODULE_LABELS[n.module]}
                      </span>
                      <span className="rounded-full bg-[var(--color-surface-2)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-faint)]">
                        {TYPE_LABELS[n.targetType]}
                      </span>
                      {n.lastEditedByAdmin && (
                        <span className="rounded-full bg-[var(--color-surface-2)] px-2 py-0.5 text-[10px] text-[var(--color-text-faint)]">
                          Admin-corrected
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-sm text-[#16181D] dark:text-[#E9EAEC]">{n.title}</p>
                    <p className="mt-0.5 truncate text-xs text-[var(--color-text-faint)]">
                      {n.targetType === 'topic' ? 'Topic' : 'Question'}: {n.targetLabel} · Updated {formatDateTime(n.updatedAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button variant="secondary" size="sm" onClick={() => openDetail(n)}>
                      <Eye size={14} aria-hidden="true" />
                      View
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => openEdit(n)}>
                      <Pencil size={14} aria-hidden="true" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setPendingDelete(n)}>
                      <Trash2 size={14} aria-hidden="true" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
          {totalPages > 1 && (
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
        </>
      )}

      <NoteDetailModal
        open={detailOpen}
        note={detailStatus === 'succeeded' ? detail : null}
        loading={detailStatus === 'loading'}
        onClose={closeDetail}
        onEdit={openEdit}
        onDelete={setPendingDelete}
      />

      {editingNote && <AdminNoteEditModal open={Boolean(editingNote)} note={editingNote} onClose={() => setEditingNote(null)} />}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete User Note?"
        message={`You're about to delete this note created by ${pendingDelete?.user?.name || 'this user'} ("${pendingDelete?.title}"). This note will no longer be visible to the user.`}
        confirmLabel="Delete Note"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
