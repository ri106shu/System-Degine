import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router';
import { Search, ListChecks, Plus } from 'lucide-react';
import { fetchQuestions, deleteQuestion } from '../features/questions/questionSlice';
import { fetchQuestionProgress, setQuestionProgress } from '../features/progress/progressSlice';
import { fetchNotes } from '../features/notes/notesSlice';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import ModuleToggle from '../components/ui/ModuleToggle';
import QuestionCard from '../components/questions/QuestionCard';
import AddQuestionModal from '../components/questions/AddQuestionModal';
import NoteEditorModal from '../components/notes/NoteEditorModal';
import toast from 'react-hot-toast';
import { cn } from '../utils/cn';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const STATUS_FILTERS = [
  { value: 'not_started', label: 'Not solved' },
  { value: 'in_progress', label: 'Attempted' },
  { value: 'completed', label: 'Completed' },
];

export default function QuestionsPage() {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeModule = searchParams.get('module') === 'hld' ? 'hld' : 'lld';

  const { items, status } = useSelector((state) => state.questions);
  const progress = useSelector((state) => state.progress.questions);
  const notesByTarget = useSelector((state) => state.notes.byTarget);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [addOpen, setAddOpen] = useState(searchParams.get('add') === 'true');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [noteTarget, setNoteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchQuestions({ module: activeModule }));
  }, [activeModule, dispatch]);

  useEffect(() => {
    dispatch(fetchQuestionProgress());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchNotes({}));
  }, [dispatch]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch =
        !q || item.title.toLowerCase().includes(q) || item.tags?.some((t) => t.toLowerCase().includes(q));
      const matchesDifficulty = !difficulty || item.difficulty === difficulty;
      const itemStatus = progress[item._id]?.status || 'not_started';
      const matchesStatus = !statusFilter || itemStatus === statusFilter;
      return matchesSearch && matchesDifficulty && matchesStatus;
    });
  }, [items, search, difficulty, statusFilter, progress]);

  const handleSetStatus = (questionId, newStatus) => {
    dispatch(setQuestionProgress({ questionId, status: newStatus })).then((result) => {
      if (setQuestionProgress.rejected.match(result)) {
        toast.error(result.payload || 'Could not update progress');
      }
    });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await dispatch(deleteQuestion(deleteTarget._id));
    setDeleting(false);
    if (deleteQuestion.fulfilled.match(result)) {
      toast.success(`"${deleteTarget.title}" deleted`);
      setDeleteTarget(null);
    } else {
      toast.error(result.payload || 'Could not delete question');
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#16181D] dark:text-[#E9EAEC]">Questions</h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {items.length} {activeModule.toUpperCase()} questions.
          </p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus size={16} aria-hidden="true" />
          Add question
        </Button>
      </div>

      <div className="mb-5 flex flex-col gap-3">
        <ModuleToggle
          value={activeModule}
          onChange={(m) => setSearchParams({ module: m })}
          options={['lld', 'hld']}
          labels={{ lld: 'LLD', hld: 'HLD' }}
        />
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full max-w-xs">
            <Input placeholder="Search by title or tag…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setDifficulty(null)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium',
                !difficulty
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                  : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]'
              )}
            >
              All
            </button>
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(d === difficulty ? null : d)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium',
                  difficulty === d
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]'
                )}
              >
                {d}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            {STATUS_FILTERS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value === statusFilter ? null : value)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium',
                  statusFilter === value
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {status === 'loading' && (
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )}

      {status === 'failed' && (
        <EmptyState icon={ListChecks} title="Couldn't load questions" description="Check that the API is running and reachable, then refresh." />
      )}

      {status === 'succeeded' && filtered.length === 0 && items.length === 0 && (
        <EmptyState
          icon={ListChecks}
          title={activeModule === 'hld' ? 'HLD questions are coming soon' : 'No questions yet'}
          description={
            activeModule === 'hld'
              ? "Nothing seeded here yet \u2014 add your own below, or check back once HLD content ships."
              : 'Add your first question to get started.'
          }
          action={
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus size={16} aria-hidden="true" />
              Add question
            </Button>
          }
        />
      )}

      {status === 'succeeded' && filtered.length === 0 && items.length > 0 && (
        <EmptyState icon={Search} title="No questions match" description="Try different filters." />
      )}

      {status === 'succeeded' && filtered.length > 0 && (
        <div className="flex flex-col gap-3">
          {filtered.map((question) => (
            <QuestionCard
              key={question._id}
              question={question}
              status={progress[question._id]?.status}
              currentUserId={user?._id}
              onSetStatus={handleSetStatus}
              onRequestDelete={setDeleteTarget}
              hasNote={Boolean(notesByTarget[`question:${question._id}`])}
              onOpenNote={setNoteTarget}
            />
          ))}
        </div>
      )}

      <AddQuestionModal open={addOpen} onClose={() => setAddOpen(false)} defaultModule={activeModule} />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete question?"
        message="This removes the question from your active question bank. Past mock interviews that used it are not affected."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
      />

      {noteTarget && (
        <NoteEditorModal
          open={Boolean(noteTarget)}
          target={{ targetType: 'question', targetId: noteTarget._id, defaultTitle: noteTarget.title }}
          existingNote={notesByTarget[`question:${noteTarget._id}`] || null}
          onClose={() => setNoteTarget(null)}
        />
      )}
    </div>
  );
}
