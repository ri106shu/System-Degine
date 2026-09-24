import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { Search, ClipboardList, Target, Code2, PlayCircle } from 'lucide-react';
import { fetchEligible, createMock, fetchInProgressMock, abandonMock } from '../features/mock/mockSlice';
import { fetchTiming } from '../features/timing/timingSlice';
import { ROUTES } from '../app/constants';
import ModuleToggle from '../components/ui/ModuleToggle';
import QuestionCard from '../components/questions/QuestionCard';
import TopicPromptCard from '../components/mock/TopicPromptCard';
import MockConfigModal from '../components/mock/MockConfigModal';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Card from '../components/ui/Card';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const MODE_LABELS = { lld: 'LLD', hld: 'HLD', mixed: 'LLD + HLD' };
const MODULE_LABELS = { lld: 'LLD', hld: 'HLD' };

// section is the URL-facing name (kept stable -- existing bookmarks/links to
// ?section=topics / ?section=questions keep working); type is what the API
// and mock creation actually key off. They're two names for the same
// concept on purpose: the URL reads naturally, the backend reads precisely.
const SECTION_TO_TYPE = { topics: 'topic', questions: 'question' };

const groupByModule = (items, getModule) => {
  const groups = { lld: [], hld: [] };
  items.forEach((item) => {
    const mod = getModule(item);
    if (groups[mod]) groups[mod].push(item);
  });
  return groups;
};

export default function MockInterviewPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = ['lld', 'hld', 'mixed'].includes(searchParams.get('mode')) ? searchParams.get('mode') : 'lld';
  const section = searchParams.get('section') === 'questions' ? 'questions' : 'topics';
  const type = SECTION_TO_TYPE[section];
  const isTopic = type === 'topic';

  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [configOpen, setConfigOpen] = useState(false);

  // Reset filters when the mode/section changes — done during render (React's
  // documented pattern for "adjusting state when a prop changes"), not in a
  // useEffect, which would cost an extra render cycle for no benefit here.
  const modeSectionKey = `${mode}-${section}`;
  const [prevModeSectionKey, setPrevModeSectionKey] = useState(modeSectionKey);
  if (modeSectionKey !== prevModeSectionKey) {
    setPrevModeSectionKey(modeSectionKey);
    setSearch('');
    setDifficultyFilter('');
  }

  const { eligible, eligibleStatus, createStatus, inProgressMock } = useSelector((s) => s.mock);
  const { data: timing, status: timingStatus } = useSelector((s) => s.timing);
  // Guards against a stale response from the previous {mode,type} landing
  // after the user has already switched — without this, a slow topic-type
  // response arriving after switching to questions would render as if it
  // were question data, since both share the `eligible` slot.
  const eligibleMatchesCurrent = eligible?.mode === mode && eligible?.type === type;

  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  const [abandoning, setAbandoning] = useState(false);

  useEffect(() => {
    dispatch(fetchInProgressMock());
  }, [dispatch]);

  const handleAbandonResume = async () => {
    if (!inProgressMock) return;
    setAbandoning(true);
    await dispatch(abandonMock(inProgressMock._id));
    setAbandoning(false);
    setShowAbandonConfirm(false);
  };

  useEffect(() => {
    dispatch(fetchEligible({ mode, type }));
  }, [dispatch, mode, type]);

  useEffect(() => {
    if (timingStatus === 'idle') dispatch(fetchTiming());
  }, [dispatch, timingStatus]);

  const setMode = (m) => setSearchParams((prev) => { const next = new URLSearchParams(prev); next.set('mode', m); return next; });
  const setSection = (s) => setSearchParams((prev) => { const next = new URLSearchParams(prev); next.set('section', s); return next; });

  const baseTopics = useMemo(() => (eligibleMatchesCurrent ? eligible?.topics : null) || [], [eligible, eligibleMatchesCurrent]);
  const baseQuestions = useMemo(() => (eligibleMatchesCurrent ? eligible?.questions : null) || [], [eligible, eligibleMatchesCurrent]);

  const filteredTopics = useMemo(() => {
    let list = baseTopics;
    if (search) list = list.filter((t) => t.name.toLowerCase().includes(search.trim().toLowerCase()));
    if (difficultyFilter) list = list.filter((t) => t.difficulty === difficultyFilter);
    return list;
  }, [baseTopics, search, difficultyFilter]);

  const filteredQuestions = useMemo(() => {
    let list = baseQuestions;
    if (search) list = list.filter((q) => q.title.toLowerCase().includes(search.trim().toLowerCase()));
    if (difficultyFilter) list = list.filter((q) => q.difficulty === difficultyFilter);
    return list;
  }, [baseQuestions, search, difficultyFilter]);

  const handleCreateMock = async (config) => {
    const result = await dispatch(createMock(config));
    if (createMock.fulfilled.match(result)) {
      setConfigOpen(false);
      navigate(ROUTES.MOCK_SESSION(result.payload._id));
    }
  };

  // The count that actually gates Start/the modal — genuinely tied to
  // whichever section is active, not always the question count. This is
  // the specific fix for "Topics tab, Start Mock still builds a question
  // mock": eligibleCount and handleCreateMock's config.type both come from
  // the active section, never from a fixed default.
  const eligibleCount = isTopic
    ? (eligibleMatchesCurrent ? eligible?.eligibleTopics : 0) || 0
    : (eligibleMatchesCurrent ? eligible?.eligibleQuestions : 0) || 0;
  const isMixed = mode === 'mixed';
  const isLoading = eligibleStatus === 'loading' || eligibleStatus === 'idle' || !eligibleMatchesCurrent;

  const renderTopicsSection = () => {
    if (baseTopics.length === 0) {
      return (
        <EmptyState
          icon={ClipboardList}
          title="No completed topics with an interview prompt yet"
          description="Complete a topic to make it available for a topic interview."
          action={
            <Link to={`${ROUTES.TOPICS}?module=${mode === 'hld' ? 'hld' : 'lld'}`}>
              <Button size="sm">Go to Topics</Button>
            </Link>
          }
        />
      );
    }
    if (filteredTopics.length === 0) {
      return <EmptyState icon={Search} title="No topics match" description="Try a different search or clear the difficulty filter." />;
    }
    if (isMixed) {
      const grouped = groupByModule(filteredTopics, (t) => t.module);
      return (
        <div className="flex flex-col gap-5">
          {['lld', 'hld'].map((mod) => (
            <div key={mod}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-faint)]">
                {MODULE_LABELS[mod]} TOPICS
              </p>
              {grouped[mod].length === 0 ? (
                <p className="rounded-lg border border-dashed border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-text-faint)]">
                  No completed {MODULE_LABELS[mod]} content yet — mixed mode will use what's completed elsewhere.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {grouped[mod].map((t) => (
                    <TopicPromptCard key={t._id} topic={t} moduleBadge={MODULE_LABELS[mod]} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-2">
        {filteredTopics.map((t) => (
          <TopicPromptCard key={t._id} topic={t} />
        ))}
      </div>
    );
  };

  const renderQuestionsSection = () => {
    if (baseQuestions.length === 0) {
      return (
        <EmptyState
          icon={ClipboardList}
          title="No completed questions available"
          description="Complete a question to make it available for mock interviews."
          action={
            <Link to={`${ROUTES.QUESTIONS}?module=${mode === 'hld' ? 'hld' : 'lld'}`}>
              <Button size="sm">Go to Questions</Button>
            </Link>
          }
        />
      );
    }
    if (filteredQuestions.length === 0) {
      return <EmptyState icon={Search} title="No questions match" description="Try a different search or clear the difficulty filter." />;
    }
    if (isMixed) {
      const grouped = groupByModule(filteredQuestions, (q) => q.module);
      return (
        <div className="flex flex-col gap-5">
          {['lld', 'hld'].map((mod) => (
            <div key={mod}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-faint)]">
                {MODULE_LABELS[mod]} QUESTIONS
              </p>
              {grouped[mod].length === 0 ? (
                <p className="rounded-lg border border-dashed border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-text-faint)]">
                  No completed {MODULE_LABELS[mod]} content yet — mixed mode will use what's completed elsewhere.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {grouped[mod].map((q) => (
                    <QuestionCard key={q._id} question={q} status="completed" readOnly moduleBadge={MODULE_LABELS[mod]} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-2">
        {filteredQuestions.map((q) => (
          <QuestionCard key={q._id} question={q} status="completed" readOnly />
        ))}
      </div>
    );
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-[#16181D] dark:text-[#E9EAEC]">Mock Interview</h2>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
        Practice with topics and questions you've actually completed.
      </p>

      {inProgressMock && (
        <Card className="mt-4 flex flex-wrap items-center justify-between gap-3 border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)] p-4">
          <div>
            <p className="text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">You have an unfinished interview</p>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {MODE_LABELS[inProgressMock.mode]} {inProgressMock.type === 'topic' ? 'Topic' : 'Question'} Interview · Question{' '}
              {(inProgressMock.currentQuestionIndex ?? 0) + 1} of{' '}
              {inProgressMock.type === 'topic' ? inProgressMock.topicPrompts.length : inProgressMock.questions.length}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowAbandonConfirm(true)}>
              Abandon
            </Button>
            <Button size="sm" onClick={() => navigate(ROUTES.MOCK_SESSION(inProgressMock._id))}>
              <PlayCircle size={14} aria-hidden="true" />
              Continue
            </Button>
          </div>
        </Card>
      )}

      <div className="mt-5">
        <ModuleToggle value={mode} onChange={setMode} options={['lld', 'hld', 'mixed']} labels={{ lld: 'LLD', hld: 'HLD', mixed: 'LLD + HLD' }} />
      </div>

      <div className="mt-4">
        <h3 className="text-base font-semibold text-[#16181D] dark:text-[#E9EAEC]">
          {MODE_LABELS[mode]} {isTopic ? 'Topic Interview' : 'Question Interview'}
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)]">
          {isTopic
            ? "Conceptual questions about what you've completed — not the design problems below."
            : "Real design problems you've completed — not conceptual quizzing."}
        </p>
      </div>

      {isLoading ? (
        <div className="mt-5 flex flex-col gap-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:w-80">
            <Card className="p-4">
              <p className="font-mono text-xl font-semibold text-[#16181D] dark:text-[#E9EAEC]">
                {isTopic ? baseTopics.length : eligible?.completedTopics ?? 0}
              </p>
              <p className="text-xs text-[var(--color-text-faint)]">
                {isTopic ? 'Available topic interviews' : 'Completed topics'}
              </p>
            </Card>
            <Card className="p-4">
              <p className="font-mono text-xl font-semibold text-[#16181D] dark:text-[#E9EAEC]">{eligibleCount}</p>
              <p className="text-xs text-[var(--color-text-faint)]">
                {isTopic ? 'Completed topics' : 'Eligible questions'}
              </p>
            </Card>
          </div>

          <div className="mt-5">
            <ModuleToggle
              value={section}
              onChange={setSection}
              options={['topics', 'questions']}
              labels={{ topics: '🎯 Topic Interview', questions: '💻 Design Questions' }}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="w-full max-w-xs">
              <Input placeholder={`Search ${section}…`} value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="w-full max-w-[180px]">
              <Select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)} aria-label="Filter by difficulty">
                <option value="">All difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </Select>
            </div>
          </div>

          <div className="mt-4">{isTopic ? renderTopicsSection() : renderQuestionsSection()}</div>

          <div className="mt-6 flex justify-end">
            <Button disabled={eligibleCount === 0} onClick={() => setConfigOpen(true)}>
              {isTopic ? <Target size={16} aria-hidden="true" /> : <Code2 size={16} aria-hidden="true" />}
              {isTopic ? 'Start topic interview' : 'Start question interview'}
            </Button>
          </div>
        </>
      )}

      <MockConfigModal
        open={configOpen}
        mode={mode}
        type={type}
        maxEligible={eligibleCount}
        timing={timing}
        onClose={() => setConfigOpen(false)}
        onSubmit={handleCreateMock}
        submitting={createStatus === 'loading'}
      />

      <ConfirmDialog
        open={showAbandonConfirm}
        title="Abandon this interview?"
        message="Your answers so far stay saved in history, but this session can't be resumed after this."
        confirmLabel="Abandon interview"
        onConfirm={handleAbandonResume}
        onCancel={() => setShowAbandonConfirm(false)}
        loading={abandoning}
      />
    </div>
  );
}
