import { Link } from 'react-router';
import { Mic, Target, Code2 } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { ROUTES } from '../../app/constants';

const STATUS_LABELS = { in_progress: 'In progress', abandoned: 'Abandoned' };

export default function MockPerformance({ mocks }) {
  const { lld, hld, mixed, byType, averageScore, recent } = mocks;

  return (
    <Card className="p-5">
      <h3 className="mb-4 text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">Mock performance</h3>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="font-mono text-lg font-semibold text-[#16181D] dark:text-[#E9EAEC]">{lld}</p>
          <p className="text-xs text-[var(--color-text-faint)]">LLD mocks</p>
        </div>
        <div>
          <p className="font-mono text-lg font-semibold text-[#16181D] dark:text-[#E9EAEC]">{hld}</p>
          <p className="text-xs text-[var(--color-text-faint)]">HLD mocks</p>
        </div>
        <div>
          <p className="font-mono text-lg font-semibold text-[#16181D] dark:text-[#E9EAEC]">{mixed}</p>
          <p className="text-xs text-[var(--color-text-faint)]">LLD + HLD mocks</p>
        </div>
      </div>

      {byType && (byType.topic > 0 || byType.question > 0) && (
        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-[var(--color-border)] pt-3 text-center">
          <div>
            <p className="flex items-center justify-center gap-1 font-mono text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">
              <Target size={12} className="text-[var(--color-text-faint)]" aria-hidden="true" />
              {byType.topic}
            </p>
            <p className="text-xs text-[var(--color-text-faint)]">Topic interviews</p>
          </div>
          <div>
            <p className="flex items-center justify-center gap-1 font-mono text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">
              <Code2 size={12} className="text-[var(--color-text-faint)]" aria-hidden="true" />
              {byType.question}
            </p>
            <p className="text-xs text-[var(--color-text-faint)]">Question interviews</p>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border)] pt-3">
        <p className="text-sm text-[var(--color-text-secondary)]">Average score</p>
        <p className="font-mono text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">
          {averageScore === null ? '—' : `${averageScore}%`}
        </p>
      </div>

      {(!recent || recent.length === 0) ? (
        <div className="mt-4 flex flex-col items-start gap-2">
          <p className="text-sm text-[var(--color-text-secondary)]">No mock interviews completed yet.</p>
          <Link to={ROUTES.MOCK_INTERVIEW}>
            <Button size="sm">
              <Mic size={14} aria-hidden="true" />
              Start your first mock
            </Button>
          </Link>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-1.5">
          {recent.slice(0, 3).map((m) => (
            <Link
              key={m.id}
              to={m.status === 'in_progress' ? ROUTES.MOCK_SESSION(m.id) : ROUTES.MOCK_HISTORY_DETAIL(m.id)}
              className="flex items-center justify-between rounded-lg px-1 py-1 text-sm hover:bg-[var(--color-surface-2)]"
            >
              <span className="text-[#16181D] dark:text-[#E9EAEC]">
                {m.mode === 'lld' ? 'LLD' : m.mode === 'hld' ? 'HLD' : 'LLD + HLD'}{' '}
                {m.type === 'topic' ? 'Topics' : 'Questions'} · {m.questionCount}
              </span>
              <span className="text-xs text-[var(--color-text-faint)]">
                {STATUS_LABELS[m.status] || (m.totalScore === null ? 'Not scored yet' : `${m.totalScore}%`)}
              </span>
            </Link>
          ))}
          <Link to={ROUTES.MOCK_HISTORY} className="mt-1 text-xs font-medium text-[var(--color-accent)]">
            View all history
          </Link>
          <Link to={ROUTES.MOCK_INTERVIEW} className="mt-2">
            <Button variant="secondary" size="sm">
              Start another mock
            </Button>
          </Link>
        </div>
      )}
    </Card>
  );
}
