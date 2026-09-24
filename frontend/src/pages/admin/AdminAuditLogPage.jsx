import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ScrollText, Plus, Pencil, Trash2, RotateCcw, ArrowUpDown, Sparkles } from 'lucide-react';
import { fetchAdminAuditLog } from '../../features/adminAuditLog/adminAuditLogSlice';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';

const TARGET_TYPE_LABELS = {
  topic: 'Topic',
  question: 'Question',
  roadmap: 'Roadmap',
  roadmapWeek: 'Roadmap Week',
  roadmapDay: 'Roadmap Day',
  topicPrompt: 'Topic Prompt',
  mockInterview: 'Mock Interview',
};

const VERB_ICONS = { created: Plus, updated: Pencil, deleted: Trash2, restored: RotateCcw, reordered: ArrowUpDown };

const iconForAction = (action) => {
  for (const [verb, Icon] of Object.entries(VERB_ICONS)) {
    if (action.startsWith(`ADMIN_${verb.toUpperCase()}_`)) return Icon;
  }
  return Sparkles; // duplicated, bulk-deleted, activated/deactivated, and anything else
};

const formatDateTime = (iso) =>
  new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function AdminAuditLogPage() {
  const dispatch = useDispatch();
  const { entries, total, page, totalPages, status } = useSelector((s) => s.adminAuditLog);

  const [targetType, setTargetType] = useState('all');
  const [verb, setVerb] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    dispatch(fetchAdminAuditLog({ targetType, verb, dateRange, page: currentPage, limit: 20 }));
  }, [dispatch, targetType, verb, dateRange, currentPage]);

  const filterKey = `${targetType}-${verb}-${dateRange}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setCurrentPage(1);
  }

  const loading = status === 'loading' || status === 'idle';
  const hasActiveFilters = targetType !== 'all' || verb !== 'all' || dateRange !== 'all';

  return (
    <div>
      <h2 className="mb-1 text-xl font-semibold text-[#16181D] dark:text-[#E9EAEC]">Audit Log</h2>
      <p className="mb-5 text-sm text-[var(--color-text-secondary)]">
        A record of administrative actions across the platform — {total} entr{total === 1 ? 'y' : 'ies'}.
      </p>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Select label="Resource" value={targetType} onChange={(e) => setTargetType(e.target.value)}>
          <option value="all">All</option>
          {Object.entries(TARGET_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select label="Action" value={verb} onChange={(e) => setVerb(e.target.value)}>
          <option value="all">All</option>
          <option value="created">Created</option>
          <option value="updated">Updated</option>
          <option value="deleted">Deleted</option>
          <option value="restored">Restored</option>
          <option value="reordered">Reordered</option>
          <option value="other">Other</option>
        </Select>
        <Select label="Date" value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
          <option value="all">All time</option>
          <option value="today">Today</option>
          <option value="7d">7 days</option>
          <option value="30d">30 days</option>
          <option value="90d">90 days</option>
        </Select>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : status === 'failed' ? (
        <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
          <p className="text-sm text-[var(--color-text-secondary)]">Unable to load the audit log.</p>
          <Button onClick={() => dispatch(fetchAdminAuditLog({ targetType, verb, dateRange, page: currentPage, limit: 20 }))}>Retry</Button>
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title={hasActiveFilters ? 'No administrative activity matches the selected filters.' : 'No administrative activity yet.'}
        />
      ) : (
        <>
          <p className="mb-2 text-xs text-[var(--color-text-faint)]">
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
          </p>
          <div className="flex flex-col gap-2">
            {entries.map((e) => {
              const Icon = iconForAction(e.action);
              return (
                <Card key={e.id} className="flex items-start gap-3 p-4">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-2)]">
                    <Icon size={14} className="text-[var(--color-text-faint)]" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-[#16181D] dark:text-[#E9EAEC]">{e.description}</p>
                    <p className="mt-0.5 text-xs text-[var(--color-text-faint)]">
                      {e.adminEmail} · {TARGET_TYPE_LABELS[e.targetType] || e.targetType} · {formatDateTime(e.timestamp)}
                    </p>
                  </div>
                </Card>
              );
            })}
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
    </div>
  );
}
