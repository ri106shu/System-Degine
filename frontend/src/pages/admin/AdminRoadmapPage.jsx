import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  Copy,
  Power,
  Moon,
  RefreshCw,
} from 'lucide-react';
import {
  fetchAdminRoadmap,
  createRoadmap,
  updateRoadmap,
  toggleRoadmapActive,
  duplicateRoadmap,
  createWeek,
  updateWeek,
  deleteWeek,
  moveWeek,
  createDay,
  updateDay,
  deleteDay,
  moveDay,
} from '../../features/adminRoadmap/adminRoadmapSlice';
import { fetchTopics } from '../../features/topics/topicSlice';
import { fetchQuestions } from '../../features/questions/questionSlice';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Modal from '../../components/ui/Modal';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const MODULE_LABELS = { lld: 'LLD', hld: 'HLD' };

// ---------------------------------------------------------------- Modals --

function RoadmapFormModal({ open, module, initial, onClose, onSubmit, submitting }) {
  const emptyForm = { title: `${MODULE_LABELS[module]} Interview Roadmap`, description: '', isActive: true };
  const [form, setForm] = useState(initial || emptyForm);
  const identity = `${open}-${initial?._id || 'new'}`;
  const [prevIdentity, setPrevIdentity] = useState(identity);
  if (identity !== prevIdentity) {
    setPrevIdentity(identity);
    setForm(initial || emptyForm);
  }

  return (
    <Modal open={open} title={initial ? 'Edit roadmap' : `Create ${MODULE_LABELS[module]} roadmap`} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(form);
        }}
        className="flex flex-col gap-4"
      >
        <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <Textarea label="Description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <p className="text-xs text-[var(--color-text-faint)]">
          Module is locked to <strong>{MODULE_LABELS[module]}</strong> — a roadmap can't be moved to a different module after creation.
        </p>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : initial ? 'Save changes' : 'Create roadmap'}
        </Button>
      </form>
    </Modal>
  );
}

function WeekFormModal({ open, initial, onClose, onSubmit, submitting }) {
  const emptyForm = { weekNumber: '', title: '', description: '', order: '' };
  const [form, setForm] = useState(initial || emptyForm);
  const identity = `${open}-${initial?._id || 'new'}`;
  const [prevIdentity, setPrevIdentity] = useState(identity);
  if (identity !== prevIdentity) {
    setPrevIdentity(identity);
    setForm(initial ? { ...initial } : emptyForm);
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { title: form.title, description: form.description };
    if (form.weekNumber !== '') payload.weekNumber = Number(form.weekNumber);
    if (form.order !== '') payload.order = Number(form.order);
    onSubmit(payload);
  };

  return (
    <Modal open={open} title={initial ? 'Edit week' : 'Add week'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <Textarea label="Description" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        {initial && (
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Week number"
              type="number"
              value={form.weekNumber}
              onChange={(e) => setForm({ ...form, weekNumber: e.target.value })}
            />
            <Input label="Display order" type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
          </div>
        )}
        {initial && (
          <p className="text-xs text-[var(--color-text-faint)]">
            Changing the week number to one already in use will be rejected — use the ↑/↓ buttons to swap two weeks' positions instead.
          </p>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : initial ? 'Save changes' : 'Create week'}
        </Button>
      </form>
    </Modal>
  );
}

function MultiSelect({ label, options, selectedIds, onChange }) {
  const toggle = (id) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((s) => s !== id) : [...selectedIds, id]);
  };
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-[var(--color-text-secondary)]">{label}</p>
      <div className="max-h-36 overflow-y-auto rounded-lg border border-[var(--color-border)] p-2">
        {options.length === 0 ? (
          <p className="p-1 text-xs text-[var(--color-text-faint)]">None available for this module yet.</p>
        ) : (
          options.map((opt) => (
            <label key={opt._id} className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-[var(--color-surface-2)]">
              <input type="checkbox" checked={selectedIds.includes(opt._id)} onChange={() => toggle(opt._id)} />
              <span className="text-[#16181D] dark:text-[#E9EAEC]">{opt.name || opt.title}</span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}

function DayFormModal({ open, initial, topicOptions, questionOptions, onClose, onSubmit, submitting }) {
  const emptyForm = { dayNumber: '', title: '', focus: '', time: '', dayType: 'study', notes: '', order: '', topicIds: [], questionIds: [] };
  const toForm = (d) =>
    d
      ? {
          ...d,
          topicIds: (d.topicIds || []).map((t) => t._id || t),
          questionIds: (d.questionIds || []).map((q) => q._id || q),
        }
      : emptyForm;
  const [form, setForm] = useState(toForm(initial));
  const identity = `${open}-${initial?._id || 'new'}`;
  const [prevIdentity, setPrevIdentity] = useState(identity);
  if (identity !== prevIdentity) {
    setPrevIdentity(identity);
    setForm(toForm(initial));
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      title: form.title,
      focus: form.focus,
      time: form.time,
      dayType: form.dayType,
      notes: form.notes,
      topicIds: form.topicIds,
      questionIds: form.questionIds,
    };
    if (form.dayNumber !== '') payload.dayNumber = Number(form.dayNumber);
    if (form.order !== '') payload.order = Number(form.order);
    onSubmit(payload);
  };

  return (
    <Modal open={open} title={initial ? 'Edit day' : 'Add day'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Day type" value={form.dayType} onChange={(e) => setForm({ ...form, dayType: e.target.value })}>
            <option value="study">Study</option>
            <option value="rest">Rest</option>
          </Select>
          <Input label="Time" placeholder="e.g. 2 hours" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
        </div>
        <Input label="Focus" value={form.focus} onChange={(e) => setForm({ ...form, focus: e.target.value })} />
        <Textarea label="Notes" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        {form.dayType === 'study' && (
          <>
            <MultiSelect
              label="Topics"
              options={topicOptions}
              selectedIds={form.topicIds}
              onChange={(ids) => setForm({ ...form, topicIds: ids })}
            />
            <MultiSelect
              label="Questions"
              options={questionOptions}
              selectedIds={form.questionIds}
              onChange={(ids) => setForm({ ...form, questionIds: ids })}
            />
          </>
        )}
        {initial && (
          <div className="grid grid-cols-2 gap-3">
            <Input label="Day number" type="number" value={form.dayNumber} onChange={(e) => setForm({ ...form, dayNumber: e.target.value })} />
            <Input label="Display order" type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
          </div>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : initial ? 'Save changes' : 'Create day'}
        </Button>
      </form>
    </Modal>
  );
}

// ------------------------------------------------------------- Day card --

function DayCard({ day, isFirst, isLast, onEdit, onDelete, onMove }) {
  const isRest = day.dayType === 'rest';
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${
        isRest ? 'border-dashed border-[var(--color-border)] bg-[var(--color-surface-2)]' : 'border-[var(--color-border)] bg-[var(--color-surface)]'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[var(--color-text-faint)]">Day {day.dayNumber}</span>
          {isRest && (
            <span className="flex items-center gap-1 rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-faint)]">
              <Moon size={10} aria-hidden="true" />
              Rest
            </span>
          )}
        </div>
        <p className="truncate text-sm font-medium text-[#16181D] dark:text-[#E9EAEC]">{day.title}</p>
        {(day.focus || day.time) && (
          <p className="truncate text-xs text-[var(--color-text-faint)]">
            {day.focus}
            {day.focus && day.time && ' · '}
            {day.time}
          </p>
        )}
        {(day.topicIds?.length > 0 || day.questionIds?.length > 0) && (
          <p className="mt-0.5 truncate text-xs text-[var(--color-accent)]">
            {day.topicIds?.length || 0} topic{day.topicIds?.length === 1 ? '' : 's'} · {day.questionIds?.length || 0} question
            {day.questionIds?.length === 1 ? '' : 's'}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="sm" disabled={isFirst} onClick={() => onMove(day._id, 'up')} aria-label="Move day up">
          <ArrowUp size={13} aria-hidden="true" />
        </Button>
        <Button variant="ghost" size="sm" disabled={isLast} onClick={() => onMove(day._id, 'down')} aria-label="Move day down">
          <ArrowDown size={13} aria-hidden="true" />
        </Button>
        <Button variant="secondary" size="sm" onClick={() => onEdit(day)}>
          <Pencil size={13} aria-hidden="true" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(day)}>
          <Trash2 size={13} aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------ Week card --

function WeekCard({ week, isFirst, isLast, onEditWeek, onDeleteWeek, onMoveWeek, onAddDay, onEditDay, onDeleteDay, onMoveDay }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <Card className="overflow-hidden p-0">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((e) => !e)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded((ex) => !ex);
          }
        }}
        className="flex w-full cursor-pointer items-center justify-between gap-3 p-4 text-left"
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
          <div>
            <p className="text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">
              Week {week.weekNumber} — {week.title}
            </p>
            <p className="text-xs text-[var(--color-text-faint)]">{week.days.length} days</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" disabled={isFirst} onClick={() => onMoveWeek(week._id, 'up')} aria-label="Move week up">
            <ArrowUp size={14} aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="sm" disabled={isLast} onClick={() => onMoveWeek(week._id, 'down')} aria-label="Move week down">
            <ArrowDown size={14} aria-hidden="true" />
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onEditWeek(week)}>
            <Pencil size={14} aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDeleteWeek(week)}>
            <Trash2 size={14} aria-hidden="true" />
          </Button>
        </div>
      </div>
      {expanded && (
        <div className="flex flex-col gap-2 border-t border-[var(--color-border)] p-4">
          {week.days.map((day, i) => (
            <DayCard
              key={day._id}
              day={day}
              isFirst={i === 0}
              isLast={i === week.days.length - 1}
              onEdit={(d) => onEditDay(week, d)}
              onDelete={(d) => onDeleteDay(week, d)}
              onMove={onMoveDay}
            />
          ))}
          <Button variant="secondary" size="sm" className="mt-1 self-start" onClick={() => onAddDay(week)}>
            <Plus size={14} aria-hidden="true" />
            Add day
          </Button>
        </div>
      )}
    </Card>
  );
}

// ------------------------------------------------------------- Page ------

export default function AdminRoadmapPage({ module }) {
  const dispatch = useDispatch();
  const { roadmap, weeks, stats, status } = useSelector((s) => s.adminRoadmap);
  const topicOptions = useSelector((s) => s.topics.items);
  const questionOptions = useSelector((s) => s.questions.items);

  const [roadmapModalOpen, setRoadmapModalOpen] = useState(false);
  const [weekModal, setWeekModal] = useState(null);
  const [dayModal, setDayModal] = useState(null);
  const [pendingDeleteWeek, setPendingDeleteWeek] = useState(null);
  const [pendingDeleteDay, setPendingDeleteDay] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchAdminRoadmap(module));
    dispatch(fetchTopics({ module }));
    dispatch(fetchQuestions({ module }));
  }, [dispatch, module]);

  const loading = status === 'loading' || status === 'idle';

  const handleCreateOrEditRoadmap = async (form) => {
    setSaving(true);
    const result = roadmap
      ? await dispatch(updateRoadmap({ id: roadmap._id, payload: form }))
      : await dispatch(createRoadmap({ moduleSlug: module, payload: form }));
    setSaving(false);
    if (!result.error) setRoadmapModalOpen(false);
  };

  const handleWeekSubmit = async (payload) => {
    setSaving(true);
    const result = weekModal.week
      ? await dispatch(updateWeek({ weekId: weekModal.week._id, payload }))
      : await dispatch(createWeek({ roadmapId: roadmap._id, payload }));
    setSaving(false);
    if (!result.error) setWeekModal(null);
  };

  const handleDaySubmit = async (payload) => {
    setSaving(true);
    const result = dayModal.day
      ? await dispatch(updateDay({ dayId: dayModal.day._id, payload }))
      : await dispatch(createDay({ weekId: dayModal.week._id, payload }));
    setSaving(false);
    if (!result.error) setDayModal(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <EmptyState
        icon={RefreshCw}
        title="Unable to load roadmap"
        description="Something went wrong fetching this roadmap."
        action={<Button onClick={() => dispatch(fetchAdminRoadmap(module))}>Retry</Button>}
      />
    );
  }

  if (!roadmap) {
    return (
      <>
        <EmptyState
          icon={Plus}
          title={`No ${MODULE_LABELS[module]} roadmap exists yet.`}
          description="Create one to start building out weeks and days."
          action={<Button onClick={() => setRoadmapModalOpen(true)}>+ Create {MODULE_LABELS[module]} roadmap</Button>}
        />
        <RoadmapFormModal
          open={roadmapModalOpen}
          module={module}
          initial={null}
          onClose={() => setRoadmapModalOpen(false)}
          onSubmit={handleCreateOrEditRoadmap}
          submitting={saving}
        />
      </>
    );
  }

  return (
    <div>
      <Card className="mb-5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-[#16181D] dark:text-[#E9EAEC]">{roadmap.title}</h2>
            {roadmap.description && <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">{roadmap.description}</p>}
            {!roadmap.isActive && (
              <span className="mt-1.5 inline-block rounded-full bg-[var(--color-danger-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-danger)]">
                Inactive
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setRoadmapModalOpen(true)}>
              <Pencil size={14} aria-hidden="true" />
              Edit roadmap
            </Button>
            <Button variant="secondary" size="sm" onClick={() => dispatch(duplicateRoadmap({ id: roadmap._id }))}>
              <Copy size={14} aria-hidden="true" />
              Duplicate
            </Button>
            <Button variant="secondary" size="sm" onClick={() => dispatch(toggleRoadmapActive({ id: roadmap._id, isActive: !roadmap.isActive }))}>
              <Power size={14} aria-hidden="true" />
              {roadmap.isActive ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <p className="font-mono text-lg font-semibold text-[#16181D] dark:text-[#E9EAEC]">{stats.totalWeeks}</p>
            <p className="text-xs text-[var(--color-text-faint)]">Weeks</p>
          </div>
          <div>
            <p className="font-mono text-lg font-semibold text-[#16181D] dark:text-[#E9EAEC]">{stats.totalDays}</p>
            <p className="text-xs text-[var(--color-text-faint)]">Days</p>
          </div>
          <div>
            <p className="font-mono text-lg font-semibold text-[#16181D] dark:text-[#E9EAEC]">{stats.studyDays}</p>
            <p className="text-xs text-[var(--color-text-faint)]">Study days</p>
          </div>
          <div>
            <p className="font-mono text-lg font-semibold text-[#16181D] dark:text-[#E9EAEC]">{stats.restDays}</p>
            <p className="text-xs text-[var(--color-text-faint)]">Rest days</p>
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-3">
        {weeks.map((week, i) => (
          <WeekCard
            key={week._id}
            week={week}
            isFirst={i === 0}
            isLast={i === weeks.length - 1}
            onEditWeek={(w) => setWeekModal({ week: w })}
            onDeleteWeek={(w) => setPendingDeleteWeek(w)}
            onMoveWeek={(weekId, direction) => dispatch(moveWeek({ weekId, direction }))}
            onAddDay={(w) => setDayModal({ week: w, day: null })}
            onEditDay={(w, d) => setDayModal({ week: w, day: d })}
            onDeleteDay={(w, d) => setPendingDeleteDay({ week: w, day: d })}
            onMoveDay={(dayId, direction) => dispatch(moveDay({ dayId, direction }))}
          />
        ))}
      </div>

      <Button variant="secondary" className="mt-4" onClick={() => setWeekModal({ week: null })}>
        <Plus size={16} aria-hidden="true" />
        Add week
      </Button>

      <RoadmapFormModal
        open={roadmapModalOpen}
        module={module}
        initial={roadmap}
        onClose={() => setRoadmapModalOpen(false)}
        onSubmit={handleCreateOrEditRoadmap}
        submitting={saving}
      />
      {weekModal && (
        <WeekFormModal open={Boolean(weekModal)} initial={weekModal.week} onClose={() => setWeekModal(null)} onSubmit={handleWeekSubmit} submitting={saving} />
      )}
      {dayModal && (
        <DayFormModal
          open={Boolean(dayModal)}
          initial={dayModal.day}
          topicOptions={topicOptions}
          questionOptions={questionOptions}
          onClose={() => setDayModal(null)}
          onSubmit={handleDaySubmit}
          submitting={saving}
        />
      )}

      <ConfirmDialog
        open={Boolean(pendingDeleteWeek)}
        title={`Delete Week ${pendingDeleteWeek?.weekNumber}?`}
        message="This will also remove every day belonging to this week. Later weeks will be renumbered to close the gap."
        confirmLabel="Delete week"
        onConfirm={async () => {
          await dispatch(deleteWeek({ weekId: pendingDeleteWeek._id }));
          setPendingDeleteWeek(null);
        }}
        onCancel={() => setPendingDeleteWeek(null)}
      />
      <ConfirmDialog
        open={Boolean(pendingDeleteDay)}
        title={`Delete Day ${pendingDeleteDay?.day?.dayNumber}?`}
        message="Later days will be renumbered to close the gap."
        confirmLabel="Delete day"
        onConfirm={async () => {
          await dispatch(deleteDay({ dayId: pendingDeleteDay.day._id }));
          setPendingDeleteDay(null);
        }}
        onCancel={() => setPendingDeleteDay(null)}
      />
    </div>
  );
}
