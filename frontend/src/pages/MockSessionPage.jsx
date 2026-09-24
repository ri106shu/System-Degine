import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { Clock, ChevronLeft, ChevronRight, X, CircleCheck } from 'lucide-react';
import {
  fetchSession,
  submitAnswer,
  navigateToQuestion,
  finishMock,
  abandonMock,
  clearSession,
} from '../features/mock/mockSlice';
import { useCountdownSeconds, formatCountdown } from '../hooks/useCountdown';
import { ROUTES } from '../app/constants';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Textarea from '../components/ui/Textarea';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import PageLoader from '../components/ui/PageLoader';

const MODULE_LABELS = { lld: 'LLD', hld: 'HLD' };

export default function MockSessionPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { session, sessionStatus } = useSelector((s) => s.mock);

  const textareaRef = useRef(null);
  const visitStartRef = useRef(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  const [abandoning, setAbandoning] = useState(false);

  useEffect(() => {
    dispatch(fetchSession(sessionId));
    return () => {
      dispatch(clearSession());
    };
  }, [dispatch, sessionId]);

  const items = session ? (session.type === 'topic' ? session.topicPrompts : session.questions) : null;
  const currentIndex = session?.currentQuestionIndex ?? 0;
  const currentItem = items?.[currentIndex];
  const isLast = items ? currentIndex === items.length - 1 : false;

  // The "how long has the user been on this question" clock resets only
  // when the index genuinely changes — a real navigation — never on a
  // render caused by something else (typing doesn't even reach this
  // component's state at all; see the uncontrolled textarea below).
  useEffect(() => {
    visitStartRef.current = Date.now();
  }, [currentIndex]);

  // Derived from expiresAt + the real clock, not decremented state — see
  // useCountdown.js for why that's what makes this safe against resetting
  // on an unrelated re-render.
  const remaining = useCountdownSeconds(currentItem?.expiresAt);
  const timedOut = currentItem?.itemStatus === 'in_progress' && remaining === 0;

  const currentTimeSpent = () => Math.max(0, Math.round((Date.now() - visitStartRef.current) / 1000));

  const handleFinish = async () => {
    if (submitting) return;
    setSubmitting(true);
    const answer = textareaRef.current?.value ?? '';
    const result = await dispatch(
      finishMock({ id: sessionId, questionIndex: currentIndex, answer, timeSpentSeconds: currentTimeSpent() })
    );
    setSubmitting(false);
    if (finishMock.fulfilled.match(result)) navigate(ROUTES.MOCK_RESULT(sessionId), { replace: true });
  };

  const handleNext = async () => {
    if (submitting) return;
    setSubmitting(true);
    const answer = textareaRef.current?.value ?? '';
    await dispatch(submitAnswer({ id: sessionId, questionIndex: currentIndex, answer, timeSpentSeconds: currentTimeSpent() }));
    await dispatch(navigateToQuestion({ id: sessionId, questionIndex: currentIndex + 1 }));
    setSubmitting(false);
  };

  // Auto-advance (or auto-finish, on the last question) the instant the
  // backend-resolved timer actually reaches zero — never waits for the
  // user to notice and click.
  useEffect(() => {
    if (!timedOut || submitting) return;
    if (isLast) handleFinish();
    else handleNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timedOut]);

  const handlePrevious = async () => {
    if (submitting || currentIndex === 0) return;
    setSubmitting(true);
    const answer = textareaRef.current?.value ?? '';
    await dispatch(submitAnswer({ id: sessionId, questionIndex: currentIndex, answer, timeSpentSeconds: currentTimeSpent() }));
    await dispatch(navigateToQuestion({ id: sessionId, questionIndex: currentIndex - 1 }));
    setSubmitting(false);
  };

  const handleAbandon = async () => {
    setAbandoning(true);
    await dispatch(abandonMock(sessionId));
    setAbandoning(false);
    setShowAbandonConfirm(false);
    navigate(ROUTES.MOCK_INTERVIEW);
  };

  if (sessionStatus === 'loading' || sessionStatus === 'idle') return <PageLoader />;

  if (sessionStatus === 'failed' || !session) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <p className="text-sm text-[var(--color-text-secondary)]">This interview session couldn't be found.</p>
        <Link to={ROUTES.MOCK_INTERVIEW} className="mt-3 inline-block text-sm font-medium text-[var(--color-accent)]">
          Back to Mock Interview
        </Link>
      </div>
    );
  }

  // A session that's already completed or abandoned isn't live anymore —
  // send to the result view instead of rendering a stale interview screen.
  if (session.status !== 'in_progress') {
    navigate(ROUTES.MOCK_RESULT(sessionId), { replace: true });
    return <PageLoader />;
  }

  if (!currentItem) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <p className="text-sm text-[var(--color-text-secondary)]">This interview has no questions to show.</p>
      </div>
    );
  }

  const isTopic = session.type === 'topic';
  const urgentTime = remaining <= 30;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">
            {MODULE_LABELS[currentItem.moduleSnapshot]} {isTopic ? 'Topic Interview' : 'Question Interview'}
          </p>
          <p className="text-xs text-[var(--color-text-faint)]">
            Question {currentIndex + 1} of {items.length} · {currentItem.difficultySnapshot}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAbandonConfirm(true)}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-[var(--color-text-faint)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-secondary)]"
        >
          <X size={14} aria-hidden="true" />
          Exit
        </button>
      </div>

      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]">
        <div
          className="h-full rounded-full bg-[var(--color-accent)] transition-all"
          style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
        />
      </div>

      <Card className="mb-4 p-5">
        <div
          className={`mb-4 flex items-center justify-center gap-2 rounded-lg py-2 font-mono text-2xl font-semibold tabular-nums ${
            urgentTime ? 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]' : 'bg-[var(--color-surface-2)] text-[#16181D] dark:text-[#E9EAEC]'
          }`}
          role="timer"
          aria-live="polite"
        >
          <Clock size={20} aria-hidden="true" />
          {formatCountdown(remaining)}
        </div>

        {isTopic ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-faint)]">{currentItem.topicSnapshot}</p>
            <p className="mt-1.5 text-base font-medium text-[#16181D] dark:text-[#E9EAEC]">{currentItem.promptSnapshot}</p>
            {currentItem.followUpsSnapshot?.length > 0 && (
              <ul className="mt-3 flex flex-col gap-1 border-t border-[var(--color-border)] pt-3">
                {currentItem.followUpsSnapshot.map((f, i) => (
                  <li key={i} className="text-sm text-[var(--color-text-secondary)]">
                    {f}
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <>
            <p className="text-base font-semibold text-[#16181D] dark:text-[#E9EAEC]">{currentItem.titleSnapshot}</p>
            <p className="mt-1 text-xs text-[var(--color-text-faint)]">Topic: {currentItem.topicSnapshot}</p>
          </>
        )}
      </Card>

      <Textarea
        key={currentIndex}
        ref={textareaRef}
        defaultValue={currentItem.answer}
        label="Your answer"
        rows={8}
        placeholder={isTopic ? 'Explain your understanding…' : 'Walk through your approach, design, and trade-offs…'}
      />

      <div className="mt-4 flex items-center justify-between">
        <Button variant="secondary" onClick={handlePrevious} disabled={currentIndex === 0 || submitting}>
          <ChevronLeft size={16} aria-hidden="true" />
          Previous
        </Button>
        {isLast ? (
          <Button onClick={handleFinish} disabled={submitting}>
            <CircleCheck size={16} aria-hidden="true" />
            {submitting ? 'Finishing…' : 'Finish interview'}
          </Button>
        ) : (
          <Button onClick={handleNext} disabled={submitting}>
            {submitting ? 'Saving…' : 'Next'}
            <ChevronRight size={16} aria-hidden="true" />
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={showAbandonConfirm}
        title="Exit this interview?"
        message="Your answers so far are saved, but this session will be marked as abandoned and you won't be able to resume it."
        confirmLabel="Exit interview"
        onConfirm={handleAbandon}
        onCancel={() => setShowAbandonConfirm(false)}
        loading={abandoning}
      />
    </div>
  );
}
