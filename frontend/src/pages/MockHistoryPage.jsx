import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { ClipboardList, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchHistory, deleteMock } from '../features/mock/mockSlice';
import { ROUTES } from '../app/constants';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const MODULE_LABELS = { lld: 'LLD', hld: 'HLD', mixed: 'LLD + HLD' };
const STATUS_LABELS = { completed: 'Completed', abandoned: 'Abandoned', in_progress: 'In progress' };
const STATUS_STYLES = {
  completed: 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
  abandoned: 'bg-[var(--color-text-faint)]/15 text-[var(--color-text-faint)]',
  in_progress: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]',
};

const formatDuration = (seconds) => {
  if (!seconds) return '0m';
  const m = Math.round(seconds / 60);
  return `${m}m`;
};

const formatDate = (iso) => {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  if (sameDay) return `Today, ${time}`;
  return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${time}`;
};

export default function MockHistoryPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { history, historyStatus, historyTotal, historyPage, historyTotalPages } = useSelector((s) => s.mock);

  const [search, setSearch] = useState('');
  const [mode, setMode] = useState('all');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => {
      dispatch(fetchHistory({ page, limit: 10, mode, type, status, search: search || undefined }));
    }, 300); // debounce search typing rather than a request per keystroke
    return () => clearTimeout(handle);
  }, [dispatch, page, mode, type, status, search]);

  // Any filter change should return to page 1 — a stale page number from a
  // previous, larger result set would otherwise show an empty page. Done
  // during render (React's documented pattern for "adjusting state when a
  // prop changes"), matching MockConfigModal's count re-clamp, rather than
  // an extra effect-triggered render.
  const filterKey = `${mode}-${type}-${status}-${search}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const handleDelete = async () => {
    if (!pendingDeleteId) return;
    setDeleting(true);
    await dispatch(deleteMock(pendingDeleteId));
    setDeleting(false);
    setPendingDeleteId(null);
  };

  const loading = historyStatus === 'loading' || historyStatus === 'idle';

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="mb-1 text-xl font-semibold text-[#16181D] dark:text-[#E9EAEC]">Mock interview history</h2>
      <p className="mb-5 text-sm text-[var(--color-text-secondary)]">
        Every mock you've started, real and saved — {historyTotal} total.
      </p>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input
            label="Search"
            placeholder="Search by topic or question title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select label="Module" value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="all">All</option>
          <option value="lld">LLD</option>
          <option value="hld">HLD</option>
          <option value="mixed">LLD + HLD</option>
        </Select>
        <Select label="Type" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="all">All</option>
          <option value="topic">Topic</option>
          <option value="question">Question</option>
        </Select>
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All</option>
          <option value="completed">Completed</option>
          <option value="abandoned">Abandoned</option>
          <option value="in_progress">In progress</option>
        </Select>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : history.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No mock interviews yet"
          description="Start one from Mock Interview and it'll show up here, with your real answers and timing saved."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {history.map((mock) => {
            const isTopic = mock.type === 'topic';
            const items = isTopic ? mock.topicPrompts : mock.questions;
            const answeredCount = items.filter((it) => it.itemStatus === 'completed' || it.itemStatus === 'timed_out').length;
            return (
              <Card key={mock._id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">
                      {MODULE_LABELS[mock.mode]} {isTopic ? 'Topic Interview' : 'Question Interview'}
                    </p>
                    <p className="text-xs text-[var(--color-text-faint)]">{mock.difficulty}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLES[mock.status]}`}>
                    {STATUS_LABELS[mock.status]}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-[var(--color-text-secondary)]">
                  <span>
                    {answeredCount} / {items.length} questions
                  </span>
                  <span>{formatDuration(mock.totalTimeSpentSeconds)}</span>
                </div>
                <p className="mt-1 text-xs text-[var(--color-text-faint)]">{formatDate(mock.createdAt)}</p>

                <div className="mt-3 flex items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={() => navigate(ROUTES.MOCK_HISTORY_DETAIL(mock._id))}>
                    View details
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setPendingDeleteId(mock._id)}>
                    <Trash2 size={14} aria-hidden="true" />
                    Delete
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && historyTotalPages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={historyPage <= 1}>
            <ChevronLeft size={14} aria-hidden="true" />
          </Button>
          <span className="text-xs text-[var(--color-text-faint)]">
            Page {historyPage} of {historyTotalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.min(historyTotalPages, p + 1))}
            disabled={historyPage >= historyTotalPages}
          >
            <ChevronRight size={14} aria-hidden="true" />
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDeleteId)}
        title="Delete this mock interview?"
        message="This permanently removes the saved answers and timing for this interview. This can't be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setPendingDeleteId(null)}
        loading={deleting}
      />
    </div>
  );
}
