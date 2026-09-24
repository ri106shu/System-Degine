import Card from '../ui/Card';

function ProgressRow({ label, completed, total, percentage }) {
  const hasContent = total > 0;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <p className="text-sm font-medium text-[#16181D] dark:text-[#E9EAEC]">{label}</p>
        <p className="font-mono text-sm text-[var(--color-text-secondary)]">
          {hasContent ? `${completed} / ${total}` : 'Not started'}
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
        <div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: `${hasContent ? percentage : 0}%` }} />
      </div>
    </div>
  );
}

export default function OverallPreparation({ overall }) {
  const { completedTopics, totalTopics, completedQuestions, totalQuestions, percentage } = overall;
  const topicPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : null;
  const questionPct = totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : null;

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">Overall preparation</h3>
        <p className="font-mono text-2xl font-semibold text-[var(--color-accent)]">
          {percentage === null ? '\u2014' : `${percentage}%`}
        </p>
      </div>
      <div className="flex flex-col gap-4">
        <ProgressRow label="Topics" completed={completedTopics} total={totalTopics} percentage={topicPct} />
        <ProgressRow label="Questions" completed={completedQuestions} total={totalQuestions} percentage={questionPct} />
      </div>
    </Card>
  );
}
