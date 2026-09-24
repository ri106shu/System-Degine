import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router';
import { FileText, Search, Layers, Network, BookOpen, CircleHelp, Plus } from 'lucide-react';
import { fetchNotes, fetchNoteDetail, deleteNote, clearNoteDetail } from '../features/notes/notesSlice';
import { ROUTES } from '../app/constants';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import NoteCard from '../components/notes/NoteCard';
import NoteDetailModal from '../components/notes/NoteDetailModal';
import NoteEditorModal from '../components/notes/NoteEditorModal';

const MODULE_LABELS = { lld: 'LLD', hld: 'HLD' };
const TYPE_LABELS = { topic: 'Theory', question: 'Questions' };

const EMPTY_MESSAGES = {
  'lld-topic': { title: 'No LLD theory notes yet.', description: 'Study an LLD topic and save your notes here.' },
  'lld-question': { title: 'No LLD question notes yet.', description: 'Solve a question and save your approach here.' },
  'hld-topic': { title: 'No HLD theory notes yet.', description: 'Study an HLD topic and save your notes here.' },
  'hld-question': { title: 'No HLD question notes yet.', description: 'Solve a question and save your approach here.' },
};

export default function NotesPage() {
  const dispatch = useDispatch();
  const { notes, status, detail, detailStatus } = useSelector((s) => s.notes);

  const [search, setSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState('all'); // 'all' | 'lld' | 'hld'
  const [selectedType, setSelectedType] = useState('all'); // 'all' | 'topic' | 'question'
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => {
    const handle = setTimeout(() => {
      dispatch(fetchNotes({ search: search || undefined }));
    }, 300);
    return () => clearTimeout(handle);
  }, [dispatch, search]);

  const loading = status === 'loading' || status === 'idle';

  // Tree counts, computed from whatever the current search has already
  // returned — clicking a branch narrows what's shown, it doesn't issue a
  // new request, since the full (search-filtered) set is already local.
  const counts = { lld: { topic: 0, question: 0 }, hld: { topic: 0, question: 0 } };
  for (const n of notes) {
    if (counts[n.module]) counts[n.module][n.targetType] += 1;
  }

  const visibleNotes = notes.filter((n) => {
    const matchesModule = selectedModule === 'all' || n.module === selectedModule;
    const matchesType = selectedType === 'all' || n.targetType === selectedType;
    return matchesModule && matchesType;
  });

  const selectBranch = (module, type) => {
    setSelectedModule(module);
    setSelectedType(type);
  };

  const openDetail = (note) => {
    setDetailOpen(true);
    dispatch(fetchNoteDetail(note._id));
  };
  const closeDetail = () => {
    setDetailOpen(false);
    dispatch(clearNoteDetail());
  };
  const openEdit = (note) => {
    setDetailOpen(false);
    setEditingNote(note);
  };
  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await dispatch(deleteNote(pendingDelete._id));
    setPendingDelete(null);
    closeDetail();
  };

  const TREE_ITEMS = [
    { module: 'lld', type: 'topic', label: `${MODULE_LABELS.lld} \u00b7 ${TYPE_LABELS.topic}`, count: counts.lld.topic },
    { module: 'lld', type: 'question', label: `${MODULE_LABELS.lld} \u00b7 ${TYPE_LABELS.question}`, count: counts.lld.question },
    { module: 'hld', type: 'topic', label: `${MODULE_LABELS.hld} \u00b7 ${TYPE_LABELS.topic}`, count: counts.hld.topic },
    { module: 'hld', type: 'question', label: `${MODULE_LABELS.hld} \u00b7 ${TYPE_LABELS.question}`, count: counts.hld.question },
  ];

  // Grouped-by-section rendering when viewing "All", so the LLD/HLD >
  // Theory/Questions hierarchy is visible even without narrowing the tree.
  const sections =
    selectedModule === 'all' && selectedType === 'all'
      ? ['lld', 'hld'].flatMap((mod) =>
          ['topic', 'question'].map((type) => ({ module: mod, type, notes: notes.filter((n) => n.module === mod && n.targetType === type) }))
        )
      : [{ module: selectedModule, type: selectedType, notes: visibleNotes }];

  return (
    <div>
      <h2 className="mb-1 text-xl font-semibold text-[#16181D] dark:text-[#E9EAEC]">Notes</h2>
      <p className="mb-5 text-sm text-[var(--color-text-secondary)]">Your personal study notes, organized by module and type.</p>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input label="Search notes" placeholder="Search notes, topics, questions…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {['all', 'lld', 'hld'].map((m) => (
            <Button
              key={m}
              variant={selectedModule === m && (m === 'all' ? selectedType === 'all' : true) ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => selectBranch(m, m === selectedModule ? selectedType : 'all')}
            >
              {m === 'all' ? 'All' : MODULE_LABELS[m]}
            </Button>
          ))}
        </div>
      </div>

      {/* Mobile: dropdown tree; Desktop: sidebar tree */}
      <div className="mb-4 md:hidden">
        <Select
          label="Browse"
          value={`${selectedModule}:${selectedType}`}
          onChange={(e) => {
            const [m, t] = e.target.value.split(':');
            selectBranch(m, t);
          }}
        >
          <option value="all:all">All notes</option>
          {TREE_ITEMS.map((item) => (
            <option key={`${item.module}:${item.type}`} value={`${item.module}:${item.type}`}>
              {item.label} ({item.count})
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-6 md:flex-row">
        <nav className="hidden w-52 shrink-0 md:block">
          <ul className="flex flex-col gap-0.5">
            <li>
              <button
                type="button"
                onClick={() => selectBranch('all', 'all')}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm ${
                  selectedModule === 'all' && selectedType === 'all'
                    ? 'bg-[var(--color-accent-soft)] font-medium text-[var(--color-accent)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]'
                }`}
              >
                <FileText size={15} aria-hidden="true" />
                All notes
              </button>
            </li>
            {['lld', 'hld'].map((mod) => (
              <li key={mod} className="mt-2">
                <button
                  type="button"
                  onClick={() => selectBranch(mod, 'all')}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm font-medium ${
                    selectedModule === mod && selectedType === 'all'
                      ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                      : 'text-[#16181D] dark:text-[#E9EAEC] hover:bg-[var(--color-surface-2)]'
                  }`}
                >
                  {mod === 'lld' ? <Layers size={15} aria-hidden="true" /> : <Network size={15} aria-hidden="true" />}
                  {MODULE_LABELS[mod]}
                </button>
                <ul className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-[var(--color-border)] pl-2">
                  {['topic', 'question'].map((type) => (
                    <li key={type}>
                      <button
                        type="button"
                        onClick={() => selectBranch(mod, type)}
                        className={`flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1 text-left text-xs ${
                          selectedModule === mod && selectedType === type
                            ? 'bg-[var(--color-accent-soft)] font-medium text-[var(--color-accent)]'
                            : 'text-[var(--color-text-faint)] hover:bg-[var(--color-surface-2)]'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          {type === 'topic' ? <BookOpen size={12} aria-hidden="true" /> : <CircleHelp size={12} aria-hidden="true" />}
                          {TYPE_LABELS[type]}
                        </span>
                        <span className="font-mono">{counts[mod][type]}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 flex-1">
          {loading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : status === 'failed' ? (
            <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
              <p className="text-sm text-[var(--color-text-secondary)]">Unable to load notes.</p>
              <Button onClick={() => dispatch(fetchNotes({ search: search || undefined }))}>Retry</Button>
            </div>
          ) : notes.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No notes yet"
              description="Start studying a topic or question and save your notes here."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Link to={ROUTES.TOPICS}>
                    <Button variant="secondary">
                      <Plus size={15} aria-hidden="true" />
                      Explore Topics
                    </Button>
                  </Link>
                  <Link to={ROUTES.QUESTIONS}>
                    <Button variant="secondary">
                      <Plus size={15} aria-hidden="true" />
                      Explore Questions
                    </Button>
                  </Link>
                </div>
              }
            />
          ) : visibleNotes.length === 0 && !(selectedModule === 'all' && selectedType === 'all') ? (
            <EmptyState
              icon={Search}
              title={EMPTY_MESSAGES[`${selectedModule}-${selectedType}`]?.title || 'No notes match this view.'}
              description={EMPTY_MESSAGES[`${selectedModule}-${selectedType}`]?.description}
            />
          ) : (
            <div className="flex flex-col gap-6">
              {sections.map((section) => (
                <div key={`${section.module}-${section.type}`}>
                  <div className="mb-2 flex items-baseline justify-between">
                    <h3 className="text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">
                      {`${MODULE_LABELS[section.module]} \u00b7 ${TYPE_LABELS[section.type]}`}
                    </h3>
                    <span className="font-mono text-xs text-[var(--color-text-faint)]">{section.notes.length}</span>
                  </div>
                  {section.notes.length === 0 ? (
                    <p className="text-sm text-[var(--color-text-faint)]">{EMPTY_MESSAGES[`${section.module}-${section.type}`]?.title}</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {section.notes.map((note) => (
                        <NoteCard key={note._id} note={note} onOpen={openDetail} onEdit={openEdit} onDelete={setPendingDelete} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <NoteDetailModal
        open={detailOpen}
        note={detailStatus === 'succeeded' ? detail : null}
        onClose={closeDetail}
        onEdit={openEdit}
        onDelete={setPendingDelete}
      />

      {editingNote && <NoteEditorModal open={Boolean(editingNote)} existingNote={editingNote} onClose={() => setEditingNote(null)} />}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this note?"
        message="This action cannot be undone. The related topic or question is not affected — only the note itself is removed."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
