import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { RotateCcw } from 'lucide-react';
import { updateTiming, resetTiming } from '../../features/timing/timingSlice';
import Card from '../ui/Card';

const DIFFICULTIES = ['easy', 'medium', 'hard'];
const DIFFICULTY_LABELS = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

function DurationField({ module, type, difficulty, tier }) {
  const dispatch = useDispatch();
  const [value, setValue] = useState(tier.selected);
  const [saving, setSaving] = useState(false);

  // Re-sync the field if the underlying data changes from elsewhere (e.g.
  // a reset) — done during render, matching the same pattern used for the
  // mock config modal's count re-clamp, not in a useEffect.
  const [lastSelected, setLastSelected] = useState(tier.selected);
  if (tier.selected !== lastSelected) {
    setLastSelected(tier.selected);
    setValue(tier.selected);
  }

  const commit = async () => {
    const minutes = Number(value);
    if (!Number.isFinite(minutes) || minutes < tier.min || minutes > tier.max) {
      setValue(tier.selected); // revert to the last known-good value
      return;
    }
    if (minutes === tier.selected) return;
    setSaving(true);
    await dispatch(updateTiming({ module, type, difficulty, durationMinutes: minutes }));
    setSaving(false);
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-[var(--color-text-secondary)]">{DIFFICULTY_LABELS[difficulty]}</span>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={tier.min}
            max={tier.max}
            value={value}
            disabled={saving}
            onChange={(e) => setValue(e.target.value)}
            onBlur={commit}
            className="h-8 w-16 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-right text-sm text-[#16181D] dark:text-[#E9EAEC] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40"
            aria-label={`${DIFFICULTY_LABELS[difficulty]} duration in minutes`}
          />
          <span className="text-xs text-[var(--color-text-faint)]">min</span>
        </div>
        {tier.isCustom && <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" title="Customized" />}
      </div>
    </div>
  );
}

function ModuleTimingCard({ module, moduleLabel, moduleData, sourceNote }) {
  const dispatch = useDispatch();

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">{moduleLabel}</h4>
        <button
          type="button"
          onClick={() => dispatch(resetTiming(module))}
          className="flex items-center gap-1 text-xs text-[var(--color-text-faint)] hover:text-[var(--color-text-secondary)]"
        >
          <RotateCcw size={12} aria-hidden="true" />
          Reset to default
        </button>
      </div>
      {sourceNote && <p className="mb-4 text-xs text-[var(--color-text-faint)]">{sourceNote}</p>}

      <div className="mb-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-faint)]">Topic interview</p>
        <div className="flex flex-col gap-2">
          {DIFFICULTIES.map((d) => (
            <DurationField key={d} module={module} type="topic" difficulty={d} tier={moduleData.topic[d]} />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-faint)]">Question interview</p>
        <div className="flex flex-col gap-2">
          {DIFFICULTIES.map((d) => (
            <DurationField key={d} module={module} type="question" difficulty={d} tier={moduleData.question[d]} />
          ))}
        </div>
      </div>
    </Card>
  );
}

export default function MockTimingSettings({ timing }) {
  if (!timing) return null;

  return (
    <div>
      <p className="mb-1 text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">Mock interview timing</p>
      <p className="mb-4 text-xs text-[var(--color-text-faint)]">
        Each value is validated against its allowed range on save. The dot marks a value you've customized away
        from the default.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ModuleTimingCard
          module="lld"
          moduleLabel="LLD"
          moduleData={timing.lld}
          sourceNote="Based on a typical LLD interview time guide — a general guide, not a guaranteed rule for any specific company."
        />
        <ModuleTimingCard module="hld" moduleLabel="HLD" moduleData={timing.hld} sourceNote="HLD timing is fully customizable — not based on any specific source." />
      </div>
    </div>
  );
}
