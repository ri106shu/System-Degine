import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { CircleCheck, CircleX, Clock } from 'lucide-react';
import { fetchHistoryDetail } from '../features/mock/mockSlice';
import { ROUTES } from '../app/constants';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import PageLoader from '../components/ui/PageLoader';

const MODULE_LABELS = { lld: 'LLD', hld: 'HLD' };
const STATUS_LABELS = { completed: 'Completed', abandoned: 'Abandoned', in_progress: 'In progress' };

const formatDuration = (seconds) => {
  if (!seconds) return '0s';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

export default function MockResultPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { historyDetail: mock, historyDetailStatus: status } = useSelector((s) => s.mock);

  useEffect(() => {
    dispatch(fetchHistoryDetail(sessionId));
  }, [dispatch, sessionId]);

  if (status === 'loading' || status === 'idle') return <PageLoader />;

  if (status === 'failed' || !mock) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <p className="text-sm text-[var(--color-text-secondary)]">This mock interview couldn't be found.</p>
        <Link to={ROUTES.MOCK_HISTORY} className="mt-3 inline-block text-sm font-medium text-[var(--color-accent)]">
          View mock history
        </Link>
      </div>
    );
  }

  const isTopic = mock.type === 'topic';
  const items = isTopic ? mock.topicPrompts : mock.questions;
  const abandoned = mock.status === 'abandoned';
  const answeredCount = items.filter((it) => it.itemStatus === 'completed' || it.itemStatus === 'timed_out').length;

  return (
    <div className="mx-auto max-w-2xl">
      <div className={`mb-5 flex items-center gap-2 ${abandoned ? 'text-[var(--color-text-faint)]' : 'text-[var(--color-success)]'}`}>
        {abandoned ? <CircleX size={20} aria-hidden="true" /> : <CircleCheck size={20} aria-hidden="true" />}
        <h2 className="text-xl font-semibold text-[#16181D] dark:text-[#E9EAEC]">
          {abandoned ? 'Interview abandoned' : 'Interview complete'}
        </h2>
      </div>

      <Card className="mb-5 p-4">
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <p className="text-[var(--color-text-faint)]">Type</p>
            <p className="font-medium text-[#16181D] dark:text-[#E9EAEC]">
              {MODULE_LABELS[mock.mode] || 'LLD + HLD'} {isTopic ? 'Topics' : 'Questions'}
            </p>
          </div>
          <div>
            <p className="text-[var(--color-text-faint)]">Status</p>
            <p className="font-medium text-[#16181D] dark:text-[#E9EAEC]">{STATUS_LABELS[mock.status]}</p>
          </div>
          <div>
            <p className="text-[var(--color-text-faint)]">Answered</p>
            <p className="font-medium text-[#16181D] dark:text-[#E9EAEC]">
              {answeredCount} / {items.length}
            </p>
          </div>
          <div>
            <p className="text-[var(--color-text-faint)]">Time spent</p>
            <p className="font-medium text-[#16181D] dark:text-[#E9EAEC]">{formatDuration(mock.totalTimeSpentSeconds)}</p>
          </div>
        </div>
      </Card>

      {mock.totalScore == null && (
        <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
          Scoring isn't built yet, so there's no grade here — this is a real, saved record of what you answered and
          how long each item took, not a placeholder.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {items.map((item, i) => {
          const label = isTopic ? item.topicSnapshot : item.titleSnapshot;
          const body = isTopic ? item.promptSnapshot : `Topic: ${item.topicSnapshot}`;
          return (
            <div key={i} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-accent)]">
                    {MODULE_LABELS[item.moduleSnapshot]}
                  </span>
                  <p className="text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">{label}</p>
                </div>
                {item.itemStatus === 'timed_out' && (
                  <span className="rounded-full bg-[var(--color-danger)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-danger)]">
                    Timed out
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">{body}</p>
              <p className="mt-2 flex items-center gap-1 text-xs text-[var(--color-text-faint)]">
                <Clock size={12} aria-hidden="true" />
                {formatDuration(item.timeSpentSeconds)} spent · {item.difficultySnapshot}
              </p>
              {item.answer ? (
                <p className="mt-2 whitespace-pre-wrap rounded-lg bg-[var(--color-surface-2)] p-3 text-sm text-[var(--color-text-secondary)]">
                  {item.answer}
                </p>
              ) : (
                <p className="mt-2 text-xs italic text-[var(--color-text-faint)]">No answer submitted.</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex gap-3">
        <Button variant="secondary" onClick={() => navigate(ROUTES.MOCK_INTERVIEW)}>
          Back to Mock Interview
        </Button>
        <Button variant="secondary" onClick={() => navigate(ROUTES.MOCK_HISTORY)}>
          View all history
        </Button>
      </div>
    </div>
  );
}
