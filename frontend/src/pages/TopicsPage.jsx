import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router';
import { Search, Layers, Plus } from 'lucide-react';
import { fetchTopics, deleteTopic } from '../features/topics/topicSlice';
import { fetchTopicProgress, setTopicProgress } from '../features/progress/progressSlice';
import { fetchNotes } from '../features/notes/notesSlice';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import ModuleToggle from '../components/ui/ModuleToggle';
import TopicRow from '../components/topics/TopicRow';
import AddTopicModal from '../components/topics/AddTopicModal';
import NoteEditorModal from '../components/notes/NoteEditorModal';
import toast from 'react-hot-toast';
import { cn } from '../utils/cn';

// Pedagogical order for LLD; HLD defines its own vocabulary once seeded, so
// unrecognized categories just render after these, in first-seen order —
// never hidden.
const CATEGORY_ORDER = [
  'OOP',
  'UML',
  'SOLID',
  'Creational Patterns',
  'Structural Patterns',
  'Behavioral Patterns',
  'Design Concepts',
  'LLD Problems',
  'Interview Problems',
];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export default function TopicsPage() {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeModule = searchParams.get('module') === 'hld' ? 'hld' : 'lld';

  const { items, status } = useSelector((state) => state.topics);
  const progress = useSelector((state) => state.progress.topics);
  const notesByTarget = useSelector((state) => state.notes.byTarget);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState(null);
  const [category, setCategory] = useState('');
  const [addOpen, setAddOpen] = useState(searchParams.get('add') === 'true');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [noteTarget, setNoteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchTopics({ module: activeModule }));
  }, [activeModule, dispatch]);

  useEffect(() => {
    dispatch(fetchTopicProgress());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchNotes({}));
  }, [dispatch]);

  const availableCategories = useMemo(
    () => [...new Set(items.map((t) => t.category))].sort(
      (a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b)
    ),
    [items]
  );

  const grouped = useMemo(() => {
    const filtered = items.filter((t) => {
      const matchesSearch = t.name.toLowerCase().includes(search.trim().toLowerCase());
      const matchesDifficulty = !difficulty || t.difficulty === difficulty;
      const matchesCategory = !category || t.category === category;
      return matchesSearch && matchesDifficulty && matchesCategory;
    });
    const byCategory = {};
    const seenOrder = [];
    for (const topic of filtered) {
      if (!byCategory[topic.category]) seenOrder.push(topic.category);
      (byCategory[topic.category] ||= []).push(topic);
    }
    const orderedCategories = [
      ...CATEGORY_ORDER.filter((c) => byCategory[c]),
      ...seenOrder.filter((c) => !CATEGORY_ORDER.includes(c)),
    ];
    return orderedCategories.map((category) => ({ category, topics: byCategory[category] }));
  }, [items, search, difficulty, category]);

  const totalShown = grouped.reduce((sum, g) => sum + g.topics.length, 0);

  const handleSetStatus = (topicId, newStatus) => {
    dispatch(setTopicProgress({ topicId, status: newStatus })).then((result) => {
      if (setTopicProgress.rejected.match(result)) {
        toast.error(result.payload || 'Could not update progress');
      }
    });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await dispatch(deleteTopic(deleteTarget._id));
    setDeleting(false);
    if (deleteTopic.fulfilled.match(result)) {
      toast.success(`"${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
    } else {
      toast.error(result.payload || 'Could not delete topic');
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#16181D] dark:text-[#E9EAEC]">Topics</h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {items.length} {activeModule.toUpperCase()} topics.
          </p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus size={16} aria-hidden="true" />
          Add topic
        </Button>
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <ModuleToggle
          value={activeModule}
          onChange={(m) => setSearchParams({ module: m })}
          options={['lld', 'hld']}
          labels={{ lld: 'LLD', hld: 'HLD' }}
        />
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full max-w-xs">
            <Input placeholder="Search topics…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="w-full max-w-[180px]">
            <Select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
              <option value="">All categories</option>
              {availableCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
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
        </div>
      </div>

      {status === 'loading' && (
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}

      {status === 'failed' && (
        <EmptyState icon={Layers} title="Couldn't load topics" description="Check that the API is running and reachable, then refresh." />
      )}

      {status === 'succeeded' && totalShown === 0 && items.length === 0 && (
        <EmptyState
          icon={Layers}
          title={activeModule === 'hld' ? 'HLD topics are coming soon' : 'No topics yet'}
          description={
            activeModule === 'hld'
              ? "Nothing seeded here yet \u2014 add your own below, or check back once HLD content ships."
              : 'Add your first topic to get started.'
          }
          action={
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus size={16} aria-hidden="true" />
              Add topic
            </Button>
          }
        />
      )}

      {status === 'succeeded' && totalShown === 0 && items.length > 0 && (
        <EmptyState icon={Search} title="No topics match" description="Try a different search or clear the difficulty filter." />
      )}

      {status === 'succeeded' && totalShown > 0 && (
        <div className="flex flex-col gap-6">
          {grouped.map(({ category, topics }) => (
            <div key={category}>
              <div className="mb-2 flex items-baseline justify-between">
                <h3 className="text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">{category}</h3>
                <span className="font-mono text-xs text-[var(--color-text-faint)]">{topics.length}</span>
              </div>
              <Card className="overflow-hidden">
                {topics.map((topic) => (
                  <TopicRow
                    key={topic._id}
                    topic={topic}
                    status={progress[topic._id]?.status}
                    currentUserId={user?._id}
                    onSetStatus={handleSetStatus}
                    onRequestDelete={setDeleteTarget}
                    hasNote={Boolean(notesByTarget[`topic:${topic._id}`])}
                    onOpenNote={setNoteTarget}
                  />
                ))}
              </Card>
            </div>
          ))}
        </div>
      )}

      <AddTopicModal open={addOpen} onClose={() => setAddOpen(false)} defaultModule={activeModule} />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete topic?"
        message="This will remove the topic from your personal topic collection and affect related questions."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
      />

      {noteTarget && (
        <NoteEditorModal
          open={Boolean(noteTarget)}
          target={{ targetType: 'topic', targetId: noteTarget._id, defaultTitle: noteTarget.name }}
          existingNote={notesByTarget[`topic:${noteTarget._id}`] || null}
          onClose={() => setNoteTarget(null)}
        />
      )}
    </div>
  );
}
