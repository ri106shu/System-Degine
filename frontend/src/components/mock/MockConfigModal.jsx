import { useState } from 'react';
import Modal from '../ui/Modal';
import Select from '../ui/Select';
import Button from '../ui/Button';

const MODE_LABELS = { lld: 'LLD', hld: 'HLD', mixed: 'LLD + HLD' };
const DIFFICULTY_KEYS = { Easy: 'easy', Medium: 'medium', Hard: 'hard' };

// Standard tiers, capped at what's actually achievable — never forces a
// minimum of 5. maxEligible itself is always included as the top option so
// "use everything I've got" is always selectable, even off-tier.
const countOptionsFor = (maxEligible) => {
  const tiers = [1, 3, 5, 10, 15, 20].filter((n) => n <= maxEligible);
  if (tiers[tiers.length - 1] !== maxEligible) tiers.push(maxEligible);
  return tiers;
};

const formatMinutes = (totalMinutes) => {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

// The exact recommended/allowed range only makes sense for one specific
// module + difficulty (section 11/12 of the brief) — when either is
// "mixed," there's no single range, so callers fall back to the averaged
// estimate instead.
const singleTierFor = (timing, mode, type, difficulty) => {
  if (!timing || mode === 'mixed' || difficulty === 'Mixed') return null;
  return timing[mode]?.[type]?.[DIFFICULTY_KEYS[difficulty]] || null;
};

// Average per-item seconds across every module/difficulty combination in
// play — an honest estimate for mixed mode or mixed difficulty, where the
// actual mock's real total (computed from the specific items randomly
// selected) can only be known after creation. The created-mock view shows
// that real number; this is deliberately labeled as an estimate, not exact.
const estimateSecondsPerItem = (timing, mode, type, difficulty) => {
  if (!timing) return null;
  const modules = mode === 'mixed' ? ['lld', 'hld'] : [mode];
  const difficulties = difficulty === 'Mixed' ? ['easy', 'medium', 'hard'] : [DIFFICULTY_KEYS[difficulty]];
  const values = [];
  for (const m of modules) {
    for (const d of difficulties) {
      const tier = timing[m]?.[type]?.[d];
      if (tier) values.push(tier.selected * 60);
    }
  }
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
};

export default function MockConfigModal({ open, mode, type = 'question', maxEligible, timing, onClose, onSubmit, submitting }) {
  const isTopic = type === 'topic';
  const countOptions = countOptionsFor(Math.max(maxEligible, 1));
  const [difficulty, setDifficulty] = useState('Mixed');
  const [questionCount, setQuestionCount] = useState(countOptions[countOptions.length - 1]);
  const [durationMode, setDurationMode] = useState('auto');
  const [customMinutes, setCustomMinutes] = useState(isTopic ? 5 : 45);

  // Re-clamp the selected count whenever the modal (re)opens with a
  // different eligible pool. Done during render (React's documented
  // pattern for "adjusting state when a prop changes"), not in a
  // useEffect, which would cost an extra render cycle for no benefit here.
  const openKey = `${open}-${type}-${maxEligible}`;
  const [prevOpenKey, setPrevOpenKey] = useState(openKey);
  if (open && openKey !== prevOpenKey) {
    setPrevOpenKey(openKey);
    setQuestionCount(countOptions[countOptions.length - 1]);
  } else if (!open && openKey !== prevOpenKey) {
    setPrevOpenKey(openKey);
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      mode,
      type,
      difficulty,
      questionCount: Number(questionCount),
      durationMode,
      customDurationMinutes: durationMode === 'custom' ? Number(customMinutes) : undefined,
    });
  };

  const singleTier = singleTierFor(timing, mode, type, difficulty);
  const perItemSeconds = durationMode === 'custom' ? Number(customMinutes) * 60 : estimateSecondsPerItem(timing, mode, type, difficulty);
  const estimatedTotalMinutes = perItemSeconds != null ? (perItemSeconds * Number(questionCount)) / 60 : null;

  return (
    <Modal open={open} title={isTopic ? 'Configure topic interview' : 'Configure question interview'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <p className="mb-1.5 text-sm font-medium text-[#16181D] dark:text-[#E9EAEC]">Interview type</p>
          <p className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm text-[var(--color-text-secondary)]">
            {MODE_LABELS[mode]} {isTopic ? 'Topic Interview' : 'Question Interview'} — set from the tab you had open
          </p>
        </div>

        <Select label="Difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="Mixed">All</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </Select>

        <Select
          label={isTopic ? 'Number of topics' : 'Number of questions'}
          value={questionCount}
          onChange={(e) => setQuestionCount(e.target.value)}
          hint={`${maxEligible} eligible ${isTopic ? 'topic' : 'question'}${maxEligible === 1 ? '' : 's'} right now.`}
        >
          {countOptions.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </Select>

        <div>
          <p className="mb-1.5 text-sm font-medium text-[#16181D] dark:text-[#E9EAEC]">Timing</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDurationMode('auto')}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${durationMode === 'auto' ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]'}`}
            >
              Automatic
            </button>
            <button
              type="button"
              onClick={() => setDurationMode('custom')}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${durationMode === 'custom' ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]'}`}
            >
              Custom
            </button>
          </div>

          {durationMode === 'auto' && singleTier && (
            <p className="mt-2 text-xs text-[var(--color-text-faint)]">
              Recommended: {singleTier.default} min per {isTopic ? 'topic' : 'question'} · Allowed range: {singleTier.min}–{singleTier.max} min
              {singleTier.isCustom ? ' (using your customized setting)' : ''}
            </p>
          )}
          {durationMode === 'auto' && !singleTier && perItemSeconds != null && (
            <p className="mt-2 text-xs text-[var(--color-text-faint)]">
              Each item uses its own difficulty and module's configured time (edit these in Settings).
            </p>
          )}

          {durationMode === 'custom' && (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={180}
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                className="h-9 w-20 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-sm text-[#16181D] dark:text-[#E9EAEC] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40"
                aria-label="Custom minutes per item"
              />
              <span className="text-xs text-[var(--color-text-faint)]">min, applied to every {isTopic ? 'topic' : 'question'}</span>
            </div>
          )}
        </div>

        {estimatedTotalMinutes != null && (
          <div className="rounded-lg bg-[var(--color-surface-2)] px-3 py-2">
            <p className="text-xs text-[var(--color-text-faint)]">Estimated total duration</p>
            <p className="font-mono text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">{formatMinutes(estimatedTotalMinutes)}</p>
          </div>
        )}

        <Button type="submit" disabled={submitting} className="mt-2">
          {submitting ? 'Starting…' : 'Start interview'}
        </Button>
      </form>
    </Modal>
  );
}
