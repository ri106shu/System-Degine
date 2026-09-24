import Card from '../ui/Card';

function ModuleColumn({ label, section }) {
  const { topics, questions, mocks, averageMockScore } = section;
  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">{label}</p>
      <dl className="flex flex-col gap-2.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-[var(--color-text-secondary)]">Topics</dt>
          <dd className="font-mono text-[#16181D] dark:text-[#E9EAEC]">
            {topics.total > 0 ? `${topics.completed} / ${topics.total}` : 'Not started'}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-[var(--color-text-secondary)]">Topic progress</dt>
          <dd className="font-mono text-[#16181D] dark:text-[#E9EAEC]">
            {topics.percentage === null ? '\u2014' : `${topics.percentage}%`}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-[var(--color-text-secondary)]">Questions</dt>
          <dd className="font-mono text-[#16181D] dark:text-[#E9EAEC]">
            {questions.total > 0 ? `${questions.completed} / ${questions.total}` : 'Not started'}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-[var(--color-text-secondary)]">Question progress</dt>
          <dd className="font-mono text-[#16181D] dark:text-[#E9EAEC]">
            {questions.percentage === null ? '\u2014' : `${questions.percentage}%`}
          </dd>
        </div>
        <div className="flex justify-between border-t border-[var(--color-border)] pt-2.5">
          <dt className="text-[var(--color-text-secondary)]">Mocks</dt>
          <dd className="font-mono text-[#16181D] dark:text-[#E9EAEC]">{mocks || 'None yet'}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-[var(--color-text-secondary)]">Average mock score</dt>
          <dd className="font-mono text-[#16181D] dark:text-[#E9EAEC]">
            {averageMockScore === null ? '\u2014' : `${averageMockScore}%`}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export default function ModuleComparison({ lld, hld }) {
  return (
    <Card className="p-5">
      <h3 className="mb-4 text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">LLD vs HLD</h3>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <ModuleColumn label="LLD" section={lld} />
        <ModuleColumn label="HLD" section={hld} />
      </div>
    </Card>
  );
}
