import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Eye, Trash2, ListX, Mic, CheckCircle2, Clock3, XCircle } from 'lucide-react';
import {
  fetchAdminMockInterviews,
  fetchAdminMockInterviewSummary,
  fetchAdminMockInterviewDetail,
  deleteAdminMockInterview,
  deleteAllAdminMockInterviews,
  clearDetail,
} from '../../features/adminMockInterviews/adminMockInterviewsSlice';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import DifficultyBadge from '../../components/ui/DifficultyBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const MODULE_LABELS = { lld: 'LLD', hld: 'HLD', mixed: 'Mixed' };
const STATUS_LABELS = { completed: 'Completed', in_progress: 'In Progress', abandoned: 'Abandoned' };
const STATUS_COLORS = {
  completed: 'text-[var(--color-success)] bg-[var(--color-success-soft)]',
  in_progress: 'text-[var(--color-accent)] bg-[var(--color-accent-soft)]',
  abandoned: 'text-[var(--color-text-faint)] bg-[var(--color-surface-2)]',
};

const formatDuration = (seconds) => {
  if (!seconds) return '0s';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};
const formatDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

function SummaryCard({ icon: Icon, label, value, tone }) {
  return (
    <Card className="p-4">
      <div className={`flex items-center gap-2 ${tone || 'text-[var(--color-text-faint)]'}`}>
        <Icon size={15} aria-hidden="true" />
        <p className="text-xs font-medium">{label}</p>
      </div>
      <p className="mt-1.5 font-mono text-2xl font-semibold text-[#16181D] dark:text-[#E9EAEC]">{value}</p>
    </Card>
  );
}

function DetailModal({ open, detail, loading, onClose }) {
  return (
    <Modal open={open} title="Interview details" onClose={onClose}>
      {loading || !detail ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-faint)]">User</p>
            <p className="text-sm text-[#16181D] dark:text-[#E9EAEC]">{detail.user ? `${detail.user.name} · ${detail.user.email}` : 'Unknown'}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-[var(--color-text-faint)]">Module</p>
              <p className="text-[#16181D] dark:text-[#E9EAEC]">{MODULE_LABELS[detail.mode]}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-faint)]">Type</p>
              <p className="text-[#16181D] dark:text-[#E9EAEC]">{detail.type === 'topic' ? 'Topic Interview' : 'Design Question'}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-faint)]">Difficulty</p>
              <p className="text-[#16181D] dark:text-[#E9EAEC]">{detail.difficulty}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-faint)]">Status</p>
              <p className="text-[#16181D] dark:text-[#E9EAEC]">{STATUS_LABELS[detail.status]}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-faint)]">Started</p>
              <p className="text-[#16181D] dark:text-[#E9EAEC]">{formatDateTime(detail.startedAt)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-faint)]">Ended</p>
              <p className="text-[#16181D] dark:text-[#E9EAEC]">{formatDateTime(detail.completedAt || detail.abandonedAt)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-faint)]">Duration</p>
              <p className="text-[#16181D] dark:text-[#E9EAEC]">{formatDuration(detail.totalTimeSpentSeconds)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-faint)]">Score</p>
              {/* Never fabricated: this app has no scoring mechanism yet, so
                  totalScore is always null — shown honestly rather than
                  inventing a number. */}
              <p className="text-[#16181D] dark:text-[#E9EAEC]">{detail.totalScore ?? 'Not scored'}</p>
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-faint)]">
              {detail.itemCount} item{detail.itemCount === 1 ? '' : 's'} · Topics covered
            </p>
            <div className="flex flex-wrap gap-1.5">
              {detail.topicsCovered.map((t) => (
                <span key={t} className="rounded-full bg-[var(--color-surface-2)] px-2 py-0.5 text-xs text-[var(--color-text-secondary)]">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-faint)]">Difficulty distribution</p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Easy {detail.difficultyBreakdown.Easy} · Medium {detail.difficultyBreakdown.Medium} · Hard {detail.difficultyBreakdown.Hard}
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function AdminMockInterviewsPage() {
  const dispatch = useDispatch();
  const { interviews, total, page, totalPages, listStatus, summary, detail, detailStatus } = useSelector((s) => s.adminMockInterviews);

  const [module, setModule] = useState('all');
  const [status, setStatus] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [detailOpen, setDetailOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const filterParams = { module, status, difficulty, dateRange, search: search || undefined, sort };

  useEffect(() => {
    const handle = setTimeout(() => {
      dispatch(fetchAdminMockInterviews({ ...filterParams, page: currentPage, limit: 20 }));
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, module, status, difficulty, dateRange, search, sort, currentPage]);

  useEffect(() => {
    dispatch(fetchAdminMockInterviewSummary({ module, difficulty, dateRange }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, module, difficulty, dateRange]);

  const filterKey = `${module}-${status}-${difficulty}-${dateRange}-${search}-${sort}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setCurrentPage(1);
  }

  const openDetail = (id) => {
    setDetailOpen(true);
    dispatch(fetchAdminMockInterviewDetail(id));
  };
  const closeDetail = () => {
    setDetailOpen(false);
    dispatch(clearDetail());
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await dispatch(deleteAdminMockInterview(pendingDelete._id));
    if (detailOpen) setDetailOpen(false);
    setPendingDelete(null);
  };

  const confirmDeleteAll = async () => {
    setBulkDeleting(true);
    await dispatch(deleteAllAdminMockInterviews(filterParams));
    setCurrentPage(1);
    await Promise.all([
      dispatch(fetchAdminMockInterviews({ ...filterParams, page: 1, limit: 20 })),
      dispatch(fetchAdminMockInterviewSummary({ module, difficulty, dateRange })),
    ]);
    setBulkDeleting(false);
    setDeleteAllOpen(false);
  };

  const loading = listStatus === 'loading' || listStatus === 'idle';
  const hasActiveFilters = module !== 'all' || status !== 'all' || difficulty !== 'all' || dateRange !== 'all' || search;

  return (
    <div>
      <h2 className="mb-1 text-xl font-semibold text-[#16181D] dark:text-[#E9EAEC]">Mock Interview Monitoring</h2>
      <p className="mb-5 text-sm text-[var(--color-text-secondary)]">Monitor interview activity across the platform.</p>

      {summary && (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          <SummaryCard icon={Mic} label="Total" value={summary.total} />
          <SummaryCard icon={CheckCircle2} label="Completed" value={summary.completed} tone="text-[var(--color-success)]" />
          <SummaryCard icon={Clock3} label="In progress" value={summary.inProgress} tone="text-[var(--color-accent)]" />
          <SummaryCard icon={XCircle} label="Abandoned" value={summary.abandoned} />
          <SummaryCard icon={Clock3} label="Avg duration" value={formatDuration(summary.avgDurationSeconds)} />
          <SummaryCard icon={CheckCircle2} label="Completion rate" value={`${summary.completionRate}%`} />
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <Input label="Search" placeholder="Search by user name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select label="Module" value={module} onChange={(e) => setModule(e.target.value)}>
          <option value="all">All</option>
          <option value="lld">LLD</option>
          <option value="hld">HLD</option>
          <option value="mixed">Mixed</option>
        </Select>
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All</option>
          <option value="completed">Completed</option>
          <option value="in_progress">In Progress</option>
          <option value="abandoned">Abandoned</option>
        </Select>
        <Select label="Difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="all">All</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
          <option value="Mixed">Mixed</option>
        </Select>
        <Select label="Date" value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
          <option value="all">All time</option>
          <option value="today">Today</option>
          <option value="7d">7 days</option>
          <option value="30d">30 days</option>
        </Select>
        <Select label="Sort" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="duration">Duration</option>
          <option value="status">Status</option>
        </Select>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : listStatus === 'failed' ? (
        <EmptyState
          icon={XCircle}
          title="Unable to load mock interviews"
          description="Something went wrong fetching this data."
          action={<Button onClick={() => dispatch(fetchAdminMockInterviews({ ...filterParams, page: currentPage, limit: 20 }))}>Retry</Button>}
        />
      ) : interviews.length === 0 ? (
        <EmptyState icon={Search} title={hasActiveFilters ? 'No mock interviews match the selected filters.' : 'No mock interviews found.'} />
      ) : (
        <>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs text-[var(--color-text-faint)]">
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
            </p>
            <Button variant="ghost" size="sm" onClick={() => setDeleteAllOpen(true)} disabled={total === 0}>
              <ListX size={14} aria-hidden="true" />
              Delete all
            </Button>
          </div>
          <div className="overflow-x-auto">
            <div className="flex min-w-[760px] flex-col gap-2">
              {interviews.map((m) => (
                <Card key={m._id} className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">{m.user?.name || 'Unknown user'}</p>
                      <span className="rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-accent)]">
                        {MODULE_LABELS[m.mode]}
                      </span>
                      <DifficultyBadge difficulty={m.difficulty} />
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_COLORS[m.status]}`}>
                        {STATUS_LABELS[m.status]}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-[var(--color-text-faint)]">
                      {m.user?.email} · {m.itemCount} item{m.itemCount === 1 ? '' : 's'} · {formatDuration(m.durationSeconds)} ·{' '}
                      {formatDateTime(m.startedAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => openDetail(m._id)}>
                      <Eye size={14} aria-hidden="true" />
                      View
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setPendingDelete(m)} aria-label="Delete mock interview">
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

      <DetailModal open={detailOpen} detail={detail} loading={detailStatus === 'loading'} onClose={closeDetail} />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this mock interview?"
        message={`This permanently removes ${pendingDelete?.user?.name || 'this user'}'s ${MODULE_LABELS[pendingDelete?.mode] || ''} mock interview — it will also disappear from their own Mock History, since it's the same record. This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <ConfirmDialog
        open={deleteAllOpen}
        title={`Delete all ${total} matching mock interview${total === 1 ? '' : 's'}?`}
        message={
          hasActiveFilters
            ? `This permanently deletes every mock interview matching your current filters — ${total} interview${total === 1 ? '' : 's'} across potentially multiple users. Each one also disappears from that user's own Mock History. This cannot be undone.`
            : `This permanently deletes ALL ${total} mock interviews on the platform, across every user. Each one also disappears from that user's own Mock History. This cannot be undone.`
        }
        confirmLabel={bulkDeleting ? 'Deleting…' : 'Delete all'}
        onConfirm={confirmDeleteAll}
        onCancel={() => setDeleteAllOpen(false)}
        loading={bulkDeleting}
      />
    </div>
  );
}
