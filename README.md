# InterviewForge

**Learn. Practice. Mock. Improve.**

A personal interview preparation tracker for Low-Level Design (and, as content is added,
High-Level Design) interviews. It tracks LLD and HLD independently, lets you add your own
topics and questions alongside a seeded catalog, tracks completion per user, and turns that
into a real dashboard — not a static page, an actual read of your own MongoDB data.

## Table of contents

- [Features](#features)
- [Dashboard](#dashboard)
- [Roadmap](#roadmap)
- [LLD and HLD tracking](#lld-and-hld-tracking)
- [Topic and question management](#topic-and-question-management)
- [Mock interviews](#mock-interviews)
- [Mock interview timing](#mock-interview-timing)
- [Mock interview sessions](#mock-interview-sessions)
- [Mock history](#mock-history)
- [Analytics](#analytics)
- [Achievements](#achievements)
- [Notes](#notes)
- [Admin Settings](#admin-settings)
- [Authentication](#authentication)
- [Admin panel](#admin-panel)
- [Not yet included](#not-yet-included)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Database models](#database-models)
- [API documentation](#api-documentation)
- [Environment variables](#environment-variables)
- [Installation](#installation)
- [Running locally](#running-locally)
- [Seeding the database](#seeding-the-database)
- [Production build](#production-build)
- [Troubleshooting](#troubleshooting)
- [A note on this repo's origin](#a-note-on-this-repos-origin)
- [Future HLD expansion](#future-hld-expansion)

## Features

- **Real authentication** — register/login/logout with a JWT in an httpOnly cookie (never
  localStorage), bcrypt-hashed passwords, rate-limited auth endpoints
- **A dashboard that reads your actual data** — LLD/HLD topic and question coverage, an overall
  preparation percentage, weak areas from your own confidence ratings, a recent-activity feed,
  and real mock-interview counts/scores, all computed from MongoDB for whoever is logged in
- **A real, trackable day-by-day roadmap** — the exact 6-week/42-day JPMorgan LLD plan, seeded
  from the uploaded source PDF and verified against it programmatically, not just transcribed by
  eye. Mark any day complete, in progress, or not started; rest days are visually distinct and
  never counted toward completion
- **Two genuinely separate mock interview types, built from what you've actually completed** —
  a conceptual Topic Interview and a Design Questions interview, each with its own eligibility
  pool, in LLD, HLD, and combined modes, computed and enforced entirely on the backend; the
  frontend never decides what's allowed into a mock
- **A real per-item timing system, not one flat mock timer** — every topic or question in a mock
  gets its own duration, resolved against its own module and difficulty (an HLD item in a mixed
  mock uses HLD's timing, an LLD item uses LLD's), editable per user in Settings without ever
  touching the system default or another user's preferences, and validated on the backend against
  the configured range rather than trusted from the client
- **A real, live interview session — not a preview** — starting a mock takes you one question at
  a time through a countdown that's genuinely backed by the server (`expiresAt` on each item,
  checked independently of the browser's clock), saves every answer as you go, resumes correctly
  after a refresh or a closed tab, and auto-advances when time actually runs out. Mock History
  keeps every finished or abandoned session — filterable, searchable, deletable — readable even
  after the original topic or question it was built from is edited or deleted
- **Independent LLD/HLD tracking** — Topics and Questions each have their own LLD/HLD toggle,
  filtered server-side, never fetched-then-hidden
- **User-owned content** — add your own topics and questions under either module; delete only
  what you created. System/seeded content is protected against deletion by anyone but an admin
- **Per-user completion tracking** — mark a topic Not Started / In Progress / Completed, and a
  question Not Solved / Attempted / Completed, fully independent between users
- **Responsive app shell** — desktop sidebar, mobile drawer, dark/light theme
- **A seeded LLD catalog** — 63 topics and 15 machine-coding questions extracted from an
  uploaded JPMorgan-style LLD roadmap, organized into the same categories a real prep plan uses
- **A real analytics dashboard, not the placeholder it replaced** — topic/question status and
  difficulty breakdowns, mock activity and preparation-activity time series, study time, weekly
  roadmap progress, and weak/strong areas from your own confidence ratings, computed from
  MongoDB behind module and date-range filters. A real streak, too — computed from actual
  completion timestamps, since nothing in this codebase ever wrote to the `User.currentStreak`
  field that used to sit there unused
- **A real achievement system, not the placeholder it replaced** — 20 badges across topics,
  questions, mock interviews, roadmap progress, streaks, and LLD/HLD-specific milestones, each
  tracked against real thresholds and unlocked automatically the moment you actually qualify,
  never by opening a page

## Dashboard

The dashboard is the home screen after logging in, backed by one aggregation endpoint
(`GET /api/analytics/dashboard`) that computes, per authenticated user:

- **Coverage** — completed/total topics and questions for LLD and HLD separately, as counts and
  percentages
- **Overall preparation** — `(completedTopics + completedQuestions) / (totalTopics + totalQuestions) × 100`
- **LLD vs HLD comparison** — the same numbers side by side
- **Weak areas** — topics/questions you've rated 2 or below (out of 5) on confidence, each
  linking back to where you can review it
- **Recent activity** — your last few completions and in-progress items, with real relative
  timestamps ("2 hours ago", "Yesterday", a weekday name, or a date)
- **Quick actions** — every button navigates somewhere real; adding a topic or question opens
  the actual add form

A module with zero seeded or user-created content (HLD, until you add to it) shows **"Not
started"**, never a misleading `0%` — division by zero is handled explicitly, not glossed over.

"Today's preparation" reads from the Roadmap below — your actual current day (the
lowest-numbered incomplete study day, not a calendar date), or an honest "roadmap complete"
state once every study day is marked done.

## Roadmap

A real, day-by-day study plan — not a static page, a `Roadmap` → `RoadmapWeek` → `RoadmapDay`
structure in MongoDB, with your own completion tracked per day via the same generic
`UserProgress` system Topics and Questions already use (`targetType: 'roadmap'`). One
architecture serves both LLD and HLD; there is no `LLDRoadmap`/`HLDRoadmap` split anywhere in the
code, so adding an HLD roadmap later needs new data, not new models or new pages.

**The seeded LLD roadmap is the actual uploaded PDF's content, verified against it, not just
transcribed by eye.** Every one of the 42 days' focus text and time estimate, and all 6 week
titles, were diffed programmatically against `pdftotext`-extracted PDF content before being
written to the seed file — the same discipline applied to the topic-prompt library. One thing
worth knowing: the PDF's own header calls this "42 study days," but its day-by-day table
contains 5 explicit rest days (7, 14, 21, 28, 35). This app treats that distinction literally —
**37**, not 42, is the real study-day count used as the denominator everywhere completion
percentage is calculated, both overall and per week. "42" describes the whole 6-week span in the
UI; it is never used as a progress denominator.

Rest days are visually distinct (no checkbox, no status, a calm dashed card) and structurally
cannot accumulate a completion status — `PATCH /api/progress/roadmap/:id` checks the target
day's `dayType` on the backend and rejects the request with a 400 if it's a rest day, rather
than relying on the UI simply not offering the button.

**"Current day"** is the lowest-numbered study day you haven't completed yet — never date-based,
and never a gate. Days can be marked complete in any order; nothing locks Day 2 until Day 1 is
done. This is a tracker, not a locked course.

**Not included in this pass:** full add/edit/delete for custom roadmaps, weeks, and days — the
CRUD layer described in the original request (ownership enforcement, cascading soft-deletes,
duplicate roadmap, search, the 5-week/7-8-week schedule-option display) is a second, comparably
large feature on top of the view-and-track system above, and isn't built yet. The `source`/
`createdBy` fields the models already carry are exactly what that layer would build on, so
adding it later doesn't need a schema change — but the create/edit/delete API endpoints and UI
themselves don't exist yet.

## LLD and HLD tracking

Topics and Questions each have an `[ LLD ] [ HLD ]` toggle, synced to the URL
(`?module=lld`/`?module=hld`) so it survives a refresh and is shareable. The filtering happens
in the database query, not by fetching everything and hiding half of it client-side. HLD starts
empty by design — nothing fake is seeded to make it look populated — and uses the exact same
`Topic`/`Question`/`UserProgress` collections as LLD, distinguished only by `moduleId`. Adding
HLD content later needs new data, not new models or new code paths.

## Topic and question management

- **Add** your own topic or question under either module (`+ Add Topic` / `+ Add Question`)
- **Delete** only what you created — system content and other users' content show no delete
  option in the UI, and the backend independently rejects the request even if called directly
- Deleting a topic soft-deletes it (and cascades to soft-delete its questions) rather than hard
  removing it, so nothing referencing it is ever left broken
- **Mark progress** — every topic/question card shows its current status and lets you change it;
  the status belongs to you specifically, via `UserProgress`, never written onto the shared
  `Topic`/`Question` document itself

## Mock interviews

Three modes — `[ LLD ] [ HLD ] [ LLD + HLD ]` — and inside each, two genuinely different
interview experiences, not two views of the same data: **🎯 Topic Interview** (conceptual —
"What is Abstraction?") and **💻 Design Questions** (an actual problem — "Design a Parking
Lot"). Both are synced to the URL (`?mode=lld&section=topics` / `?section=questions`). This
split exists because an earlier version of this page let you select the Topics tab and still
get handed a design question when you started a mock — the tab only changed which list you were
*browsing*, not which pool the backend actually built the mock from. That's fixed structurally:
`type` (`topic` | `question`) now flows through eligibility, the config modal, and mock creation
as one value, sourced from whichever tab is open, not defaulted.

**Topic Interview eligibility:** a topic is eligible once it's completed, in the right module,
and active — full stop. No question needs to be completed, and completing zero questions doesn't
block it. Each eligible topic is paired with its `TopicInterviewPrompt` (a conceptual question
and a few follow-ups, seeded for all 63 LLD topics — see below); a completed topic with no prompt
yet (only possible for a user-created topic, since every seeded one has one) is excluded rather
than shown with nothing to ask.

**Design Questions eligibility:** a question is eligible once it itself is completed — not also
requiring its topic to be completed (a deliberate rule from earlier in this app's development:
solving a build problem directly is just as legitimate as working through its topic first). A
question's topic must still genuinely exist and be active, which is a data-integrity check, not
a completion requirement.

**This is computed on the backend, not the frontend**, via two separate functions —
`getEligibleTopicInterviewContent` and `getEligibleQuestionInterviewContent` — not one generic
function with a type flag threaded through shared logic. `GET /api/mocks/eligible?mode=lld&type=topic`
and `...&type=question` return two genuinely different response shapes. `POST /api/mocks` computes
the same eligible pool itself and picks from it; there is no `topicIds` or `questionIds` field
anywhere in its validator or either service function, so a request trying to smuggle in an
ineligible topic or question has nothing to attach to — verified directly, including that an
invalid `type` value is rejected outright.

Mixed mode combines both modules and badges every item `[LLD]`/`[HLD]`. If one module has
eligible content and the other doesn't, mixed mode shows what's real and a small note for the
empty one — never a hard error, and never content invented to fill the gap.

Clicking **Start topic interview** / **Start question interview** opens a short config step
(difficulty, count, duration — the type is fixed to whichever tab you had open) and genuinely
calls `POST /api/mocks`. A real `MockInterview` document is created — `topicPrompts` populated
for a topic-type mock, `questions` for a question-type one, never both — with a real,
backend-verified selection; you'll see exactly what got selected. The screen to actually work
through them on a timer doesn't exist yet for either type (see
[Not yet included](#not-yet-included)); creating the mock and picking its content correctly is
the part that was actually specified in enough detail to build without guessing at a scoring
rubric that doesn't exist yet.

**Topic interview prompts** live in their own collection (`TopicInterviewPrompt`), never mixed
into `Question` — a conceptual prompt like "What is Abstraction?" is a different kind of thing
from a design problem like "Design a Parking Lot," and keeping them separate is what makes the
two interview types possible to keep distinct at all. Seeded with one prompt (plus 1-3
follow-ups) for every one of the 63 LLD topics — not just the OOP/UML/SOLID topics with worked
examples; the pattern, design-concept, and build-problem topics have their own accurate prompts
too, framed conceptually rather than duplicating the "design X" question that may also exist for
that topic.

**If a completed topic or question still doesn't show up as eligible,**
`GET /api/mocks/eligibility-debug?mode=lld&type=topic` (or `type=question`) breaks down why:
for topics, `completedTopicCount` vs. `eligibleTopicCount` and `excludedNoPromptTopicCount`; for
questions, the same `completedQuestionCount`/`eligibleQuestionCount` breakdown as before,
including `wrongModuleQuestionCount`. Both eligibility functions also log this same trace to the
server console outside production (`NODE_ENV=production` silences it).

## Mock interview timing

Every mock has a real, per-item duration — not one flat timer for the whole session. A topic
interview and a question (design) interview use different timing tracks entirely (a concept
question runs minutes, a design question runs tens of minutes), and each item's duration is
resolved against **its own** module and difficulty, which matters most in mixed mode: an HLD
item in an LLD+HLD mock uses HLD's configured time, an LLD item uses LLD's — never one timer
applied uniformly regardless of what's actually being asked. Verified directly against the
brief's own worked examples (an LLD Easy topic, an HLD Medium topic, and an LLD Hard topic in one
mixed mock, each resolving to a different, correct duration; the 4-topics-at-4-minutes and
3-questions-at-55-minutes totals from its examples reproduced exactly).

**System defaults vs. your own overrides** — two separate things, `InterviewTimingConfig`
(system-wide, one document per module) and `UserInterviewTimingPreference` (one per user,
covering both modules, `null` meaning "no override, use the default" rather than a frozen copy
of whatever the default happened to be). Changing your own timing in Settings never touches the
system default, and never affects another user — verified directly, including that an
out-of-range value (e.g. 5 minutes for a tier whose allowed range is 1–2) is rejected on the
backend with the actual allowed range in the error message, not silently clamped or trusted from
the frontend.

**The LLD default values are the exact figures given in this feature's own specification** — 1–2
min / 3–5 min / 5–8 min for Easy/Medium/Hard topic (concept) questions, 30–45 / ~45 (40–45 in
practice) / 45–60 min for design questions — checked programmatically against that spec text, the
same discipline used for the roadmap's PDF. No separate timing-guide document was uploaded for
this feature the way the roadmap PDF was, so unlike the roadmap there's no independent source file
to cross-verify against; these are the values as given, not independently sourced. **HLD timing
has no source at all** and says so in the UI (`Settings → Mock interview timing`) — the shipped
defaults are a neutral placeholder mirroring LLD's numbers, immediately editable, never presented
as if some HLD interview guide specified them.

**Custom vs. automatic** — starting a mock offers "Automatic" (each item's duration resolved from
config/your overrides, as above) or "Custom" (one duration you choose, applied to every item in
that mock, bypassing per-item resolution entirely — the brief's explicit allowance for a
non-guided practice session). Either way, the exact seconds selected for every item are saved
permanently on the `MockInterview` record at creation time and never recalculated — changing your
timing settings afterward does not alter a mock that already exists.

Design-question guidance (the rough Design/Coding/Walkthrough split from the brief) is stored per
difficulty tier (`InterviewTimingConfig.questionPhases`) and returned by the API, ready for
whatever surface eventually displays it — see [Not yet included](#not-yet-included) for what that
surface is.

## Mock interview sessions

Starting a mock no longer shows a static list and stops — it creates a real, persistent session
(`MockInterview.status: 'in_progress'` from the moment it's created) and takes you into it one
item at a time at `/mock-interview/session/:id`.

**The countdown is genuinely backed by the server, not just the browser.** Every item's
`expiresAt` is set the instant you actually reach it (not all upfront — the rest of the mock sits
untimed until you get there), and the backend independently checks real elapsed time against it
when you submit an answer: an item is recorded as `timed_out` if its clock had actually run out,
regardless of what the request claims. The frontend's timer is a genuinely accurate display of
that same deadline, not a second, disconnected source of truth — it's derived from `expiresAt`
and the real clock on every tick, which is also what makes it immune to resetting if you're
mid-answer and something elsewhere on the page re-renders; only actually moving to a different
question changes it. This was checked with a real interactive DOM simulation (a mounted
component, a controlled fake clock, and a deliberately unrelated state update fired mid-countdown
to confirm it doesn't reset), not just by reading the code — the failure mode here is exactly the
kind that looks fine on a read-through and breaks the moment someone types into the answer box.

**Refreshing, closing the tab, or pressing back never loses your place.** The session, its
current position, and every answer already given live in MongoDB from the start; reopening the
same URL reloads the real state rather than starting over or reshuffling. Going back to a
question you've already answered (Previous) shows what you wrote and does not restart its timer
— only a question you're reaching for the first time gets its clock started.

**Finishing saves the last answer before the session is marked complete, not after** — one
request does both, atomically, so there's no window where a page navigation could complete the
mock and lose what you just typed. Leaving early is always an explicit choice (Abandon, with a
confirmation), never an accidental side effect of the back button, and an abandoned session stays
in history rather than disappearing.

**No fabricated score, anywhere in this flow.** `totalScore` is only ever a real average of
actual per-item `score` values when at least one exists; with none, it's `null`, and the result
screen says plainly that scoring isn't built yet rather than showing a number. This isn't just a
frontend display choice — the API layer itself gives a client no field to submit a score through
on any endpoint in this flow, checked directly against the actual request schemas, not assumed
safe because the UI doesn't offer it.

A banner on the Mock Interview page detects an unfinished session and offers **Continue** (back
into the live screen, exactly where you left off) or **Abandon**, rather than silently blocking a
new mock or silently discarding the old one.

## Mock history

Every session you've started — completed, abandoned, or still in progress — lives at
`/mock-history`, real and paginated from MongoDB, newest first. Filter by module, type, status,
or difficulty; search matches the topic and question text actually saved on that mock, not a live
lookup against today's Topics/Questions collection, which is what keeps a deleted or renamed
topic's old mock history readable exactly as it was. Deleting a mock is ownership-checked on the
backend independently of anything the UI already enforced — verified directly, not assumed:
attempting to delete another user's session returns a not-found, not a permission error that
would confirm the session exists.

Clicking into any entry shows the same full per-question breakdown as the result screen right
after finishing (same component, one place this logic lives) — prompt or question text, your
answer, time spent against the allowed duration, and whether it was answered or timed out.

## Analytics

`/analytics` replaced its old placeholder with a real dashboard, behind a single aggregated
`GET /api/analytics?module=lld|hld|all&range=7d|30d|90d|all` call rather than a dozen small
requests — `userId` always comes from the authenticated session, never a query parameter, so
there's no way to request another user's analytics by editing the URL.

Reuses `dashboardService`'s existing per-module aggregation helpers rather than duplicating that
logic — the same `totalsByModule`/`completedByModule`/`resolveTargets` functions the dashboard
already relies on, now exported and shared. What's genuinely new: status and difficulty
breakdowns for topics and questions, a mock-activity and preparation-activity time series grouped
by real completion dates, study time (from `UserProgress.timeSpent` and each mock's
`totalTimeSpentSeconds`), weekly roadmap progress, and a real streak.

**The streak is computed from actual activity, not read from `User.currentStreak`** — that field
exists on the schema but nothing in this codebase ever writes to it, so using it directly would
show zero forever regardless of real usage. Streaks are derived instead from real completion
timestamps (a topic, a question, a roadmap study day, or a finished mock — never just logging in),
with a day counting as active only once no matter how many things were completed on it, a streak
that stays alive if yesterday had activity even though today doesn't yet, and a "longest streak"
that correctly finds the best run anywhere in history even when the *current* run is shorter.

**Every section fails independently, not the whole page.** With mock data empty but topics and
questions populated, the mock section shows its own "no mock interview data yet" message while
every other section — including the roadmap and difficulty charts — still renders in full. No
chart is drawn from an empty dataset; each one falls back to an honest, specific empty state
instead.

Charts are Recharts (already a dependency, unused elsewhere in the app until this) — bar charts
for status/difficulty/activity, and a small GitHub-style activity grid built directly from the
day-key → count map the backend returns, since Recharts has no native heatmap.

## Achievements

`/achievements` replaced its old placeholder with a real badge system — 20 achievements across
topics, questions, mock interviews, roadmap progress, streaks, and LLD/HLD-specific milestones,
defined in `backend/src/config/achievements.js`.

**The catalog itself is code, not a database collection** — these are fixed unlock rules (a
target threshold and which real metric it checks), not user-editable content the way Topics and
Questions are, so modeling them as `AchievementDefinition` documents would add a collection with
nothing that actually varies per install. What *is* real, persisted data is `UserAchievement` —
one document per user per earned achievement, with a unique index on `{userId, achievementKey}`
that's the actual, database-enforced guarantee against awarding the same badge twice, not just
application code being careful.

Every achievement's progress comes from a real computed metric — completed topics/questions/
mocks/roadmap days, LLD- and HLD-specific topic counts, and the same streak calculation Analytics
uses. "Complete an entire roadmap" is the one boolean achievement in the catalog (every study day
of some roadmap done, not a partial-credit count) and is kept in the same `{progress, target}`
shape as every other achievement rather than needing special-cased UI.

**Unlocking happens automatically, the moment a real threshold is actually crossed** — evaluated
on every relevant completion (a topic, a question, a roadmap day, or finishing a mock) and again
whenever the Achievements page itself loads, so nothing is ever missed. A newly-unlocked
achievement rides along on that same completion response as an additive `newAchievements` field
— existing endpoints' response shapes are unchanged, this is purely additive — and the frontend
shows a toast for exactly the ones that just unlocked, never for ones already earned.

With zero badges earned, the page shows an honest "No achievements earned yet" message and still
lists every locked achievement with its real progress underneath — never the old "isn't available
yet" placeholder, and never a blank page just because nothing's been unlocked yet.

## Notes

`/notes` is a real personal notes system — one primary note per topic and one per question, per
user, organized by the same LLD/HLD → Theory/Questions hierarchy the rest of the app already
uses. Before building anything, this pass checked whether `UserProgress.notes` (a field that
already existed on the schema) held any real data worth migrating: nothing in the frontend has
ever written to it — confirmed directly by grep, not assumed — so every existing document holds
only the empty-string default, and a dedicated `Note` model could be built cleanly with nothing
to carry forward.

**The user is never asked to classify a note.** Clicking "Add note" from a Topic or a Question
sends only `targetType` and `targetId`; the backend resolves the real Topic or Question document
and derives `moduleId` from *it* — a client can't claim "this is an LLD note" on its own say-so,
and there's no `module` or `targetType` field in the create payload for a client to even attempt
that with. Creating a note for a target that doesn't exist, or has been soft-deleted, is rejected
with a 404 rather than silently accepted. Create is upsert-safe: a second create attempt for a
target that already has a note edits it in place instead of hitting the unique
`{userId, targetType, targetId}` index as a user-visible error — a defensive backstop for the rare
case (two tabs open) where the frontend's own "show Edit instead of Add" check is stale.

**Ownership is enforced on every read and write, checked directly against the exact scenario the
brief specified**: a second user requesting the first user's note by ID — to read, edit, or
delete — gets a clean 404, never the content. Every query is scoped to `{_id, userId}` from the
authenticated session; nothing here trusts an ownership claim from the client.

Topic rows and question cards show a note indicator — a filled icon and "View note" once a note
exists, an outline icon and "Add note" before one does — driven by a `byTarget` lookup map the
Redux slice derives from one full fetch of the user's notes, rather than a request per row.
`TopicRow` is reused read-only by the Mock Interview page's completed-topics preview; the note
button is one of the things explicitly excluded from that read-only mode, checked directly rather
than assumed from the `readOnly` flag alone.

Search spans the note's own title and content plus the related topic or question's title —
checked against the brief's own example: searching "parking" finds a note via its related
question's title even when neither the note's title nor its content contains that word. This
happens in application code rather than a MongoDB text index, since it has to reach across a
polymorphic reference (a topic's `name` and a question's `title` live in different collections),
which a single query can't express as cleanly as a small in-memory filter over an already-fetched,
already-personal, necessarily-small dataset.

Notes never touch completion. `UserProgress` remains the only source of truth for whether a topic
or question is done; a topic can be completed with no note, not-started with a note, or any other
combination, exactly as specified — the Note model has no status field and nothing in the
completion flow reads or writes to it.

**`/admin/notes` gives admins a genuinely separate, global view over every user's notes — two
independent authorization paths against the same `Note` collection, not one endpoint with a role
check bolted on.** `/api/notes/*` (the user path) still derives `userId` exclusively from
`req.user._id` and scopes every query to `{_id, userId}`, completely unchanged by this work —
verified directly by re-reading the controller and route file, not assumed to still be true.
`/api/admin/notes/*` is a separate router entirely, gated by `requireAdmin`, that never filters
by `userId` on reads (that's the whole point — a global view) and independently re-verifies the
admin role on every request, never trusting the frontend's `AdminRoute` guard.

**An admin correction can only ever change `title` and `content` — structurally, not just by
convention.** The identity fields that decide whose note this is and what it's attached to
(`userId`, `targetType`, `targetId`, `moduleId`) are never accepted by the update endpoint at
all: the Zod validator strips anything outside `{title, content}` before the controller even sees
the body (confirmed directly against `validateMiddleware.js`'s actual behavior, not assumed from
how Zod usually works), and the service function only ever reads those same two fields regardless
of what's in its input. Tested by deliberately sending all four identity fields in a correction
payload and confirming every one of them is untouched on the saved document. An edit sets
`lastEditedByAdmin`/`lastEditedByAdminAt` — additive fields, the original `userId` (the real
owner) is never touched — and the user sees the corrected text the next time they open the note,
because it's the same MongoDB document, not a separate admin-side copy.

**Deleting a user's note is structurally incapable of touching anything else.** `UserProgress`
isn't imported into `adminNoteService.js` at all — checked directly against the file's own import
list, a stronger guarantee than a runtime test that merely happens not to call it. `Topic` and
`Question` are imported, but only ever queried with `.find()` for search matching, never written
to — so a topic or question's completion state, and the topic/question documents themselves,
cannot be affected by a note deletion or correction, regardless of what the request contains.

The audit log records that a correction or deletion happened, who did it, and whose note it was —
never the note's actual content. "Corrected title and content of Priya Sharma's note" is what gets
logged, not the corrected text itself, since a moderation log shouldn't become a second copy of
someone's private notes.

Search (title, content, the owner's name/email, and the related topic/question's title) resolves
to id lists server-side and folds them into one query — the same shape as the mock-interview
monitoring search built earlier — rather than downloading every note in the platform to filter in
the browser, which the brief explicitly ruled out.

## Admin Settings

`/admin/settings` is a real, MongoDB-backed `SystemSettings` singleton — one document, found by a
well-known id rather than any query that could accidentally match more than one (checked directly:
repeated calls to the fetch-or-create helper never create a second document). Given the size of
this brief, this pass built a deliberately focused subset completely and correctly rather than
building all of it shallowly: **Change Password**, **Platform Information**, **Module
Availability** (with real enforcement, not just storage), **Database Statistics**, and **Reset to
Defaults** are fully functional. Two-Factor Authentication, Active Sessions, Login Security,
Interview Configuration, Content Defaults, Notifications, Dashboard Preferences, System
Preferences (timezone/date/time format), Clear Cache, and Export Data all show an honest "not yet
available" state instead — following the brief's own explicit instruction not to fake a toggle
that does nothing.

**Module Availability has real, enforced effect — the specific thing the brief's acceptance test
checks first.** Disabling HLD doesn't just flip a stored boolean; a `checkModuleEnabled`
middleware sits in front of the topic, question, and roadmap listing endpoints and mock-interview
creation, and rejects a request for a disabled module with a 403 before the controller ever runs.
This was checked at the level that actually matters: rather than trusting the isolated middleware
function, the actual middleware was pulled directly out of each route's live, registered Express
stack (not a re-imported copy) and invoked in sequence, confirming a disabled-module request
never reaches the controller at all — and a stack-length comparison against an unmodified control
route confirmed the middleware is genuinely wired in, not just written and forgotten. No live
MongoDB is reachable in this build environment, so this is the strongest verification available
short of an actual running database; a manual end-to-end pass (disable HLD, confirm
`GET /api/topics?module=hld` 403s for a real logged-in user) is worth doing once this is deployed
somewhere with a real Mongo instance.

Admin password changes reuse `User`'s own password hashing and `comparePassword` — nothing here
reimplements password handling. The current password is verified before any change is accepted
(tested directly with a wrong password, confirming the stored hash is untouched and nothing is
logged), and the audit entry for a password change carries no metadata field at all, on purpose —
nothing password-adjacent belongs in a log a wider audience might read.

**A broader escape-sequence lesson surfaced while building this page, worth recording precisely.**
Earlier in this build, the fix for broken dark-mode text was to avoid a CSS custom property. This
time the bug was different in kind: a Unicode escape (`\u2014`, `\u00b7`) written directly as *bare
JSX text* — `<p>text \u2014 more</p>` — renders as the literal six characters, not the character it
names, because JSX's text parser doesn't process JS escape sequences. That much had been
established already. What hadn't been checked, and turned out to be wrong on assumption, is that a
**quoted JSX attribute** (`note="text \u2014 more"`, no curly braces) behaves identically — also
broken, also rendering the literal escape — which is easy to miss because it looks exactly like an
ordinary JavaScript string. Confirmed directly via two small throwaway test components rendered
through SSR before touching the real page: bare text and quoted attributes both broke; the same
text wrapped in curly braces as a genuine JS expression (`{'text \u2014 more'}` or a ternary
already inside `{}`) rendered correctly. All eight occurrences in this page were found by grep and
fixed the same way, then re-verified via SSR against the actual rendered output rather than
assumed fixed from the diff alone.

**The module toggle was refactored into a genuinely reusable `<Toggle />` component**
(`components/ui/Toggle.jsx`), replacing the inline switch markup that previously lived only inside
`ModuleAvailability`. It's a native `<button role="switch">` rather than a styled checkbox, so
Enter/Space activation and focus handling come from the browser rather than being reimplemented —
`aria-checked` and an explicit `aria-label` (e.g. "Disable HLD module") are layered on top for
screen readers. The component holds no state of its own; `checked` always reflects whatever the
caller passes in, which is what makes both toggle policies possible from the same component: a
destructive toggle's `onChange` can open a confirmation and leave `checked` reading from the
unconfirmed server state, while a future non-destructive one could flip `checked` immediately and
revert it on failure — the policy lives entirely in the caller, not in `<Toggle />` itself.

Two real gaps got fixed alongside the extraction, not just the visual styling. First, there was no
tracked loading state for module updates at all — `updateModuleSettings` only handled `.fulfilled`
in the slice, so nothing prevented a second click while the first request was still in flight. A
`moduleSaveStatus` field now tracks `pending`/`fulfilled`/`rejected`, and both the toggle and the
confirmation dialog's buttons are disabled while it's `loading`. Second, this was verified as an
actual behavioral guarantee, not just added and assumed correct: a test held a `updateModuleSettings`
dispatch mid-flight (before resolving its mocked API call) and confirmed `settings.modules.hldEnabled`
in the store genuinely had not changed yet — proving there's no optimistic flip to revert on
failure, because the value never moves until the request actually succeeds. A separate failure-case
test confirmed the same thing from the other direction: after a rejected request, the setting is
still exactly what it was before, with `moduleSaveStatus` reporting `failed` so the UI can show the
error toast the thunk already dispatches.

**The toggle's off-state track color was measured, fixed, then pushed further on request — two
iterations, both driven by actual video evidence rather than a description alone.** A first
reference video showed the LLD/HLD toggles' off state as barely visible — just a white thumb with
almost no track around it. Rather than guess at a fix from the screenshot alone, the actual CSS
variables were checked: `--color-surface-2` (the track's fill) against `--color-surface` (its card
background) computed to a 1.09 WCAG contrast ratio in dark mode and 1.12 in light — both far below
the 3.0 minimum for UI component boundaries, meaning the two colors were nearly indistinguishable
by design, not by accident. The first fix reused `--color-text-faint`, an existing design token,
landing at 3.72 dark / 3.25 light — comfortably past the minimum. A follow-up video was checked
frame-by-frame against the original to confirm that fix genuinely rendered (it did — a visibly
gray track where there had been none), but on request for something unmistakable at a glance
rather than merely passing, a second pass introduced a dedicated `--color-toggle-off` token
(defined for both themes in `index.css`, following this app's existing pattern of theme-aware CSS
variables rather than hardcoded hex in the component) at 4.78 dark / 4.69 light — clearly more
visible than the first fix while still reading as a muted gray rather than a bright color that
could be confused with an active state.

**A subsequent report claimed the off-state thumb was rendering on the right instead of the
left — the opposite of every prior verification.** That's a serious enough claim (and a direct
contradiction of the video-frame evidence from the previous round) that it was investigated rather
than either dismissed or blindly "fixed" without understanding why. The investigation: re-read the
component's actual logic (`checked ? 'translate-x-5' : 'translate-x-0.5'` — correct on inspection),
checked whether `cn()` could be silently dropping or reordering the transform class (it's plain
`clsx`, a pure concatenation helper with no Tailwind-conflict resolution, so it couldn't be), and
searched the whole frontend for every other toggle/switch/checkbox pattern that could be a second,
unpatched implementation (found exactly two unrelated matches — a multi-select checkbox in the
roadmap editor and a login "remember me" checkbox, neither related to Admin Settings). No bug
turned up in that investigation. Rather than stop at "I couldn't reproduce it," the component was
rebuilt to the exact, more explicit spec provided — a 64×36px track, a 30×30px thumb, a fixed
`left-[3px]` base position moved by a single `translateX` (`translate-x-0` off, `translate-x-[28px]`
on, since 64 − 3 − 30 − 3 = 28, the precise remaining travel distance) rather than the previous
`top-0.5`/`translate-x-0.5`/`translate-x-5` approach on a smaller 44×24px track. This removes any
ambiguity about how the position is computed regardless of what the actual discrepancy was, and was
re-verified the same rigorous way — SSR-checked for both states, and the geometry confirmed
mathematically: the off-state thumb's right edge sits at 33px (well left of the 64px track), the
on-state thumb's right edge sits at exactly 61px, 3px from the track's own right edge, matching the
spec's symmetric 3px margin on both states.

## Authentication

Register, log in, log out, and stay logged in across a refresh, all via a JWT stored in an
httpOnly cookie — never touched by JavaScript, never in localStorage. Passwords are
bcrypt-hashed. Auth endpoints are rate-limited.

## Admin panel

Admin and User are two separate application experiences sharing only authentication, the
database, and generic UI chrome (theme toggle, logout) — not "a user account with extra pages."
An admin never sees the personal Dashboard, the personal Analytics page, or the normal user
sidebar; a regular user never sees any Admin UI at all. `getPostAuthRoute()` is the one place
that decides where a session lands — after login, and for an already-authenticated user who
revisits `/login` — so an admin lands on `/admin/dashboard` and a user on `/dashboard`, from one
function rather than duplicated logic scattered across pages. An admin who follows the normal
`/analytics` link is redirected to `/admin/analytics` instead, since that's a genuinely different,
global-data page, not the same view with more permissions.

**Security is enforced only on the backend, never inferred from the frontend.** `requireAdmin`
independently re-checks `req.user.role` on every single `/api/admin/*` request. The `AdminRoute`
guard on the frontend is a UX convenience — a non-admin who reaches `/admin/*` sees a genuine
"Admin access required" state rather than a silent redirect — but a non-admin calling an admin
endpoint directly gets a 403 regardless of what the frontend shows: verified directly, including
that `requireAdmin` rejects a request with no `req.user` at all rather than crashing through, and
doesn't fuzzy-match a near-miss role string. Registration can never self-assign the admin role —
checked directly against the controller, which only ever reads `name`/`email`/`password` from the
request body; `role` always falls back to the schema default.

**What's real today:**
- `/admin/dashboard` — genuine MongoDB-computed content statistics, per module (LLD/HLD topic,
  question, prompt, and roadmap counts, each linking straight to its management page), a
  mock-interview activity breakdown, and real recently-added/recently-updated content feeds —
  framed explicitly as "InterviewForge Administration," a platform view, never a personal
  preparation one. There is deliberately no user-account data on this page at all — not a user
  count, not an active-users figure — because Admin doesn't manage accounts (see below).
- `AdminAuditLog` and a shared `logAdminAction()` helper exist and are ready for every admin
  mutation still to be built to write into, so logging stays consistent as content management
  gets built out rather than each new admin feature inventing its own shape.

**Admin User Management was built, then deliberately removed.** An earlier pass added full
account search, role changes with last-admin protection, and disable/enable — all real, all
tested. It was the wrong shape for what this admin role is for: Admin manages the *content*
users prepare with, not the user accounts themselves, and having a "manage other people's
accounts" surface made Admin feel like a super-user rather than a genuinely different
application. `/admin/users`, its API, service, Redux slice, and every UI reference to it are
gone — searched for and confirmed absent across the whole codebase, not just unlinked.
Authentication, `User.role`, `requireAdmin`, and `AdminRoute` are untouched; an admin account
still authenticates exactly the same way, it simply has nowhere to browse other users once
logged in.

**`/admin/topics` is real, full CRUD.** Create, edit, soft-delete, and restore, with search,
module and status filters, and pagination — all backed by the actual `Topic` model, no separate
`LLDTopic`/`HLDTopic` models. Admin-created content is stored as `source: 'system'` with
`createdBy: null` (platform content, not attributed to one admin's personal account, so any
admin can edit it later), and every create/update/delete/restore writes a real `AdminAuditLog`
entry via the shared `logAdminAction()` helper — checked directly, including that a genuine no-op
edit (submitting the same values back) does *not* create a spurious log entry, and that deleting
a topic correctly cascades to soft-delete its questions, matching the exact rule the user-facing
delete already followed.

**`/admin/questions` and `/admin/topic-prompts` are real too**, built on the same audited
create/edit/soft-delete/restore pattern as Topics, reusing the actual `Question` and
`TopicInterviewPrompt` models — filterable by module, topic, difficulty (and type, for
Questions), searchable, paginated. Both correctly distinguish a genuine field change from a
no-op: an array field (tags, follow-up questions) submitted back with identical content, just a
new array reference, does *not* write a spurious audit entry — checked directly, since `!==`
alone would have gotten this wrong for arrays. Deleting a Question doesn't cascade to anything
(unlike Topic → Question): nothing holds a live reference to a Question that could dangle, since
`MockInterview` snapshots a question's title/topic/difficulty at creation time specifically so a
later edit or deletion never breaks past mock history.

**The LLD/HLD roadmap sidebar links are two genuinely distinct routes**
(`/admin/roadmaps/lld` / `/admin/roadmaps/hld`), not one route with a query string — the earlier
version used `?module=lld` / `?module=hld` on the same pathname, and since `NavLink`'s active
matching is pathname-based, both links lit up as active together regardless of which one was
actually open. Verified directly: at each route, exactly one of the two links carries the active
class, never both, never neither.

**The Admin sidebar has no link back into the user application at all** — no "Back to app," no
path into `/dashboard` or any other learner-facing page. Admin is a separate application, not a
mode a user account switches into and out of.

**`/admin/roadmaps/lld` and `/admin/roadmaps/hld` are a real, full roadmap editor** — the same
`Roadmap` → `RoadmapWeek` → `RoadmapDay` architecture the seed and the user-facing pages already
use, no `LLDRoadmap`/`HLDRoadmap` split. Both routes render the same component with the module
passed as a literal prop, not a query string, which is also the actual fix for a real bug: the
two sidebar links used to share one pathname differing only by `?module=`, and since React
Router's `NavLink` matches on pathname alone, both lit up as active together. Verified directly
that exactly one is active at each route now.

A roadmap's module is locked at creation and enforced structurally, not just in the UI: the
module comes from which route created the roadmap (`/admin/roadmaps/lld` vs. `/hld`), and the
edit endpoint's field allowlist never includes `moduleId` at all — tested directly by sending a
`moduleId` in an edit request and confirming it's silently ignored rather than merely "not shown
in the form." Reordering weeks or days swaps two adjacent items through a safe three-write
sequence (move one to a temporary out-of-range number, write the other into the freed slot, then
give the first its final number) — necessary because `weekNumber` and `dayNumber` both carry a
real unique index, and writing two final values directly, one at a time, would collide on
whichever save happens second. Verified with a mock that actually simulates that unique-index
rejection, not just a happy-path assertion. Deleting a week cascades to its days and then closes
the numbering gap for everything after it — including `dayNumber`, which is global across the
whole roadmap, not per-week — checked directly that a week full of days can be deleted from the
middle of a roadmap without leaving a "Day 6, Day 7, Day 10" gap behind. Attaching a topic or
question to a day is rejected if it belongs to the wrong module (an HLD topic can't be linked
into an LLD roadmap's day), checked directly against a mixed-module id list. An empty HLD roadmap
shows "No HLD roadmap exists yet" with a real create action — never the old "isn't available yet"
placeholder, which would have meant the feature itself wasn't built rather than the database
being empty.

**`/admin/mock-interviews` is real platform monitoring** — every filter (module, status,
difficulty, date range) and sort option is a real backend query parameter, paginated server-side
rather than fetched wholesale and filtered in the browser. Search resolves to matching user ids
first, then filters the mock collection by those ids, rather than attempting an unsupported
full-text query. The detail view never shows a score — `totalScore` stays `null` everywhere in
this codebase, and the UI says "Not scored" rather than inventing a number.

**Admin can also delete a mock interview, and this is a genuine hard delete of the same
`MockInterview` document the owning user's own Mock History reads from** — there's no separate
admin-side copy of this data, so removing it here removes it everywhere it's shown, exactly like
this app's existing user-facing delete (also a hard delete; `MockInterview` has no soft-delete
field). The only difference from the user-facing version is that the admin path has no ownership
restriction, since an admin needs to remove any user's mock, not just their own — verified
directly that the delete query carries no `userId` filter at all. The confirmation dialog names
the actual affected user and says plainly that it will disappear from their own history too,
rather than leaving that as a surprise. Every delete writes an audit log entry that records whose
mock was removed, distinct from which admin removed it.

**"Delete all" bulk-deletes every mock interview matching the currently applied filters** — not
literally every mock interview on the platform unconditionally, unless no filters happen to be
set, which is the admin's own choice rather than a hidden default. The critical property here is
that "delete all" can never target a different set of documents than what "view all" is currently
showing: both are built from the exact same shared filter-construction function, and this was
checked directly — the same parameters produce a byte-for-byte identical MongoDB filter (aside
from the expected few-millisecond difference in a relative date-range cutoff, which is normal
timing variance, not drift). The confirmation dialog states the real count and, when filters are
active, says so explicitly rather than implying a platform-wide wipe when the scope is actually
narrower. A single audit log entry records the count and the distinct number of users affected,
rather than one entry per deleted interview.

**`/admin/analytics` is real, global platform analytics — with one non-obvious but important
property: it actively excludes admin accounts' own activity from every number.** Content counts
(topics, questions, prompts, roadmaps) aren't time-scoped, since "how much content exists" isn't
a period metric; interview activity, the daily chart, the LLD/HLD comparison, question and topic
rankings, difficulty distribution, and recent activity all respect the selected time range.
"Most attempted" and "most completed" questions are computed from real `UserProgress`
aggregation — attempted means any progress record exists at all, completed means
`status:'completed'` specifically — not two names for the same number. Roadmap activity reports
only what this schema actually tracks (study/rest day counts, real day-completion counts); there
is no "roadmap views" metric anywhere because nothing records that, and none was invented to fill
the space. The admin-exclusion behavior was verified directly: a test that deliberately doesn't
exclude the admin id returns a contaminated, obviously-wrong count, and the real implementation
was checked against that failure mode specifically, not just checked to return *some* number.

**`/admin/audit-log` now reads back the record every admin action has been writing all along.**
Every Topic/Question/Prompt/Roadmap/Week/Day/Mock-interview mutation across this entire admin
build already wrote a real, human-readable entry (`AdminAuditLog`, via the shared
`logAdminAction()` helper) — this page is the first thing that actually shows them. Rather than a
26-option dropdown for the 26+ distinct action strings this codebase has accumulated
(`ADMIN_CREATED_TOPIC`, `ADMIN_DUPLICATED_ROADMAP`, `ADMIN_BULK_DELETED_MOCK_INTERVIEWS`, and so
on), the filter is a coarse "what kind of change" — Created / Updated / Deleted / Restored /
Reordered / Other — derived from the consistent `ADMIN_<VERB>_<NOUN>` shape every action already
follows, checked directly against real action strings so "Other" genuinely catches everything
that isn't one of the five known verbs (duplication, bulk delete, activate/deactivate) rather
than silently missing something.

**What's a stub today:** Interview Timing administration and editing the Achievement catalog —
each has a real route, a real sidebar entry, and an honest "isn't available yet" state. Settings
(`/admin/settings`) is no longer on this list — see the [Admin Settings](#admin-settings) section
below for exactly which parts of it are real and which parts still show an honest "not configured"
state rather than a fake toggle.

**The admin account itself** is seeded (or an existing account promoted) via `ADMIN_EMAIL`/
`ADMIN_PASSWORD` environment variables, read at seed time — never hardcoded into a committed
file. Password hashing happens in `User`'s own pre-save hook, the same single place every other
account's password is hashed; the seed script never touches a plaintext password beyond passing
it through. Set these in `backend/.env` (gitignored) and run `npm run seed`; leave them unset
and this step is skipped entirely, no error.

## Not yet included

Stated plainly, as a normal description of the product's current scope, not a development
schedule:

- **Custom roadmap creation, editing, and deletion** — the seeded LLD roadmap is fully real and
  trackable (see [Roadmap](#roadmap)); creating your own roadmap, or editing/deleting days,
  weeks, or roadmaps, isn't built yet. The admin panel's roadmap editor (see
  [Admin panel](#admin-panel)) is the planned way this actually gets built — an admin-managed
  CRUD layer, not a separate per-user one.
- **Most of the admin panel's content and monitoring sections** — the role system, backend
  authorization, and a real content-focused dashboard exist (see [Admin panel](#admin-panel));
  Topics, Questions, Topic Prompts, Roadmaps, Mock Interview monitoring, Interview Timing
  administration, Analytics, and Settings are each a real route with an honest "isn't available
  yet" state, not built out yet. The Audit Log model and logging helper are real and ready; there's
  no page to read the log back yet, and nothing writes to it yet either, since the content-mutation
  features that would trigger it aren't built.
- **Admin analytics** — `/analytics` and `/achievements` are real, per-user, and described above;
  the separate `/admin/analytics` (global stats across every user — registrations, mock activity,
  topic/question completion platform-wide) that the admin panel calls for is still one of the
  admin-panel sections not built yet, not to be confused with the real per-user page at the same
  general idea.
- **Answer evaluation and scoring** — the live session (see
  [Mock interview sessions](#mock-interview-sessions)) is real end to end: a genuine countdown,
  saved answers, resume-after-refresh, atomic finish. What it can't do is grade what you wrote.
  `MockInterview.totalScore` and each item's `score`/`feedback` stay `null` until a real
  evaluation mechanism exists — the result and history screens say so plainly rather than
  inventing a number, and no endpoint in the answer-submission flow even accepts a score field
  from the client for this to leak through.
- **Guided phase timers for design questions** — the Design/Coding/Walkthrough split is stored
  per difficulty tier (`InterviewTimingConfig.questionPhases`, see
  [Mock interview timing](#mock-interview-timing)) and returned by the API; the live session
  screen uses one continuous timer for every item type today rather than switching between phase
  timers partway through a design question.
- **Achievements, Notes, a standalone Analytics page** — routes exist and describe what they'll
  do; none show fake content in the meantime.

## Tech stack

**Frontend:** React 19, Vite, Tailwind CSS v4, React Router 7, Redux Toolkit, Axios, React Hook
Form + Zod, Framer Motion, Lucide icons, react-hot-toast, Recharts (once a chart-worthy page
exists).

**Backend:** Node.js, Express 5, MongoDB, Mongoose, JWT, bcryptjs, cookie-parser, CORS, Helmet,
express-rate-limit, Zod, Morgan.

## Architecture

```
interview-forge/
├── frontend/              React + Vite
│   └── src/
│       ├── app/           app-wide constants (route paths)
│       ├── components/    ui/ (Button, Modal, ModuleToggle, ConfirmDialog…), layout/,
│       │                  dashboard/, and one folder per feature area
│       ├── features/      Redux slices per domain (auth, topics, questions, progress,
│       │                  dashboard…)
│       ├── pages/         route-level screens
│       ├── routes/        AppRoutes, ProtectedRoute, PublicOnlyRoute
│       ├── services/      axios instance + one file per API resource
│       ├── store/         root store + cross-cutting slices (theme, modules)
│       ├── hooks/
│       └── utils/
└── backend/               Express + MongoDB
    └── src/
        ├── config/        Mongoose connection
        ├── controllers/   thin — parse the request, call a service, shape the response
        ├── services/      the actual business logic: ownership checks, cascades,
        │                  progress upserts, dashboard aggregation — never in controllers
        ├── middleware/     auth, error handling, rate limiting, validation
        ├── models/
        ├── routes/
        ├── utils/         ApiError, asyncHandler, slugify
        ├── validators/    Zod schemas
        └── seed/
```

**The rule that shapes everything else:** no collection is ever named `LLD<Thing>` or
`HLD<Thing>`. Every content collection (`Topic`, `Question`) carries a `moduleId` instead.
Ownership follows the same instinct — `createdBy`/`source` on the shared collection, not
separate "UserTopic"/"SystemTopic" models.

## Database models

`User`, `Module`, `Topic`, `Question`, `UserProgress`, `MockInterview`, `TopicInterviewPrompt`,
`Roadmap`, `RoadmapWeek`, and `RoadmapDay` exist in code today (`backend/src/models/`).
`UserProgress` is polymorphic — one collection tracks completion for topics, questions, and
roadmap days via a `targetType`/`targetId` pair, rather than duplicating the concept per content
type:

```js
{ userId, targetType: 'topic' | 'question' | 'roadmap', targetId, status, confidence, completedAt, timeSpent, notes }
```

`status` uses one shared vocabulary (`not_started` / `in_progress` / `completed`) for both
topics and questions; the UI maps it to different display labels per context, since
`'completed'` is the one state that matters for progress percentages either way.

`Topic.slug` gives topics a stable identity independent of the display `name`. Its uniqueness
(`moduleId + slug + source`) is a **partial** index — only enforced where `slug` is actually
set — so it can never reject a document from before this field existed.

`MockInterview` embeds its content as snapshots captured at creation time — `questions`
(`titleSnapshot`, `topicSnapshot`, `moduleSnapshot`, `difficultySnapshot`) for a question-type
mock, `topicPrompts` (`topicSnapshot`, `promptSnapshot`, `followUpsSnapshot`, `moduleSnapshot`,
`difficultySnapshot`) for a topic-type one, distinguished by `type` — rather than only storing an
id, so a mock's record stays intact and readable even if the source `Topic`/`Question`/
`TopicInterviewPrompt` is later edited or soft-deleted. Exactly one of the two arrays is
populated per mock; the other stays empty.

`TopicInterviewPrompt` is its own collection, not rows added to `Question` — a conceptual prompt
("What is Abstraction?") and a design question ("Design a Parking Lot") are different kinds of
content, and merging them would make the two interview types impossible to keep genuinely
separate. One document per topic (`topicId`, `moduleId`, `prompt`, `followUps`, `difficulty`,
`category`), seeded for all 63 LLD topics.

`Roadmap` → `RoadmapWeek` → `RoadmapDay` is one architecture for both LLD and HLD — no
`LLDRoadmap`/`HLDRoadmap` split, distinguished only by `moduleId` on the `Roadmap` document, the
same pattern `Topic`/`Question` already use. `RoadmapDay.dayType` (`study`/`rest`) is what every
progress calculation keys off to exclude rest days from a denominator; `RoadmapDay.time` is a
free-text field (`"25m + 54m"`, `"Self-practice"`, `"Flexible"`) rather than a numeric minutes
field, since the source material isn't uniformly numeric and forcing it to be would mean
reinterpreting text that was never a clean number. `source`/`createdBy` on all three models
mirror `Topic`/`Question`'s ownership pattern exactly, ready for the custom-roadmap CRUD layer
described in [Roadmap](#roadmap) once that's built — no schema change needed for it later.

`InterviewTimingConfig` and `UserInterviewTimingPreference` are deliberately two separate models,
not one with a "this is an override" flag — `InterviewTimingConfig` is purely system state (one
document per module, no `source`/`createdBy`, never user-editable directly), while
`UserInterviewTimingPreference` is one document per user with `null` in any field it doesn't
override, so a user who has customized only one tier doesn't silently freeze the other eleven at
today's defaults. `MockInterview`'s embedded question/topic-prompt results also carry
`selectedDurationSeconds` (resolved once, at creation, and never recalculated — history has to
keep reflecting what was actually used even after settings change later) alongside
`startedAt`/`expiresAt`/`itemStatus` — these are live now, not placeholders: `expiresAt` is set
the moment an item is actually reached (not all upfront) and is what the backend checks
independently against real elapsed time to decide `completed` vs. `timed_out`, regardless of
what a request claims. `MockInterview.status` itself is `in_progress`/`completed`/`abandoned` —
a session is genuinely live in that first state from the moment it's created, not a placeholder
value with no real meaning until later. `currentQuestionIndex` and `totalTimeSpentSeconds` at the
top level, alongside `abandonedAt`, are what make refresh-safe resume and Mock History's
duration/progress figures real rather than recomputed guesses.

`UserAchievement` is the one genuinely new model this pass — `{ userId, achievementKey, earnedAt }`
with a unique index on `{userId, achievementKey}` that's the actual mechanism preventing a
duplicate award, not just application code checking first. It references the achievement catalog
(`backend/src/config/achievements.js`) by a stable string key rather than an ObjectId, because
that catalog is static code — fixed unlock rules, not a `Topic`/`Question`-style collection with
per-document CRUD — so there's no `AchievementDefinition` document to actually point at.

## API documentation

All responses follow one shape:

```jsonc
// success
{ "success": true, "data": { /* ... */ } }
// failure
{ "success": false, "message": "Human-readable summary", "errors": [ { "field": "email", "message": "..." } ] }
```

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | — | Liveness check, independent of the database |
| POST | `/api/auth/register` | — | Create an account, sets the auth cookie |
| POST | `/api/auth/login` | — | `{ email, password, rememberMe }` |
| POST | `/api/auth/logout` | Cookie | Clears the auth cookie |
| GET | `/api/auth/me` | Cookie | Current user |
| GET | `/api/modules` | Cookie | List modules |
| GET | `/api/modules/:id` | Cookie | Single module |
| GET | `/api/topics` | Cookie | `?module=lld\|hld&category=SOLID` |
| GET / POST / PATCH / DELETE | `/api/topics[/:id]` | Cookie (write: owner/admin) | Full topic CRUD |
| GET | `/api/questions` | Cookie | `?module=lld\|hld&topic=<id>&difficulty=Medium&search=parking` |
| GET / POST / PATCH / DELETE | `/api/questions[/:id]` | Cookie (write: owner/admin) | Full question CRUD |
| GET | `/api/progress/topics` \| `/api/progress/questions` \| `/api/progress/roadmap` | Cookie | Your progress, as `{ [id]: { status, ... } }` |
| PATCH | `/api/progress/topic/:id` \| `/api/progress/question/:id` \| `/api/progress/roadmap/:id` | Cookie | Set your own status/confidence — `userId` always comes from the auth cookie, never the request body. Roadmap: rejects rest days with a 400 |
| GET | `/api/roadmaps` | Cookie | `?module=lld\|hld` — system roadmaps for that module, plus any of your own |
| GET | `/api/roadmaps/:id` | Cookie | Full detail: weeks, days, your per-day status, and real stats (rest days excluded from every percentage) |
| GET | `/api/analytics/dashboard` | Cookie | The full dashboard payload in one aggregated call, including your roadmap's current day |
| GET | `/api/mocks/eligible` | Cookie | `?mode=lld\|hld\|mixed&type=topic\|question` — the real eligible pool for this user |
| POST | `/api/mocks` | Cookie | `{ mode, type, difficulty, questionCount, durationMode, customDurationMinutes }` — creates a real, `in_progress` session from a backend-computed pool; no field for client-supplied topic/question IDs or a client-chosen `duration` exists, since every duration is resolved server-side |
| GET | `/api/mocks` | Cookie | This user's mock interviews, most recent first (unfiltered; see `/history` for the paginated, filtered version) |
| GET | `/api/mocks/eligibility-debug` | Cookie | `?mode=lld\|hld\|mixed&type=topic\|question` — diagnostic breakdown of *why* something is or isn't eligible (see [Mock interviews](#mock-interviews)) |
| GET | `/api/mocks/history` | Cookie | `?page&limit(max 50)&mode&type&status&difficulty&search` — paginated, filtered, and searched against the snapshotted text on each mock, never a live join |
| GET | `/api/mocks/:id` | Cookie | A single mock (owner only) — used for both an active session and a finished one's detail view |
| PATCH | `/api/mocks/:id/answer` | Cookie | `{ questionIndex, answer, timeSpentSeconds }` — saves one item's answer; the backend independently checks `expiresAt` and marks `timed_out` regardless of what the request claims |
| PATCH | `/api/mocks/:id/navigate` | Cookie | `{ questionIndex }` — moves the current-question pointer; starts that item's timer only the first time it's reached, never resets an already-visited one |
| POST | `/api/mocks/:id/finish` | Cookie | Optionally `{ questionIndex, answer, timeSpentSeconds }` for the final item — saves it and completes the session atomically, so there's no window where a navigation could finish the mock and lose the last answer |
| POST | `/api/mocks/:id/abandon` | Cookie | Marks the session `abandoned`; stays in history rather than disappearing |
| DELETE | `/api/mocks/:id` | Cookie | Ownership independently verified server-side — deleting another user's session returns not-found, never a permission error that would confirm it exists |
| GET | `/api/interview-timing` | Cookie | System defaults + your overrides for every module/type/difficulty, with a resolved `selected` value for each |
| PATCH | `/api/interview-timing` | Cookie | `{ module, type, difficulty, durationMinutes }` — validated against that tier's allowed range on the backend; out-of-range is rejected, not clamped |
| POST | `/api/interview-timing/reset` | Cookie | `{ module }` — clears your overrides for one module only, never the system default or the other module |
| GET | `/api/admin/dashboard` | Cookie + admin | Real, content-focused MongoDB statistics — no user-account data of any kind |
| GET / POST | `/api/admin/topics[/:id]` | Cookie + admin | Full topic CRUD, paginated/filtered/searched; `?status=active\|inactive\|all` controls whether soft-deleted topics are included |
| PATCH / DELETE | `/api/admin/topics/:id` | Cookie + admin | Edit or soft-delete; delete cascades to the topic's questions |
| POST | `/api/admin/topics/:id/restore` | Cookie + admin | Reactivates a soft-deleted topic |
| GET / POST | `/api/admin/questions[/:id]` | Cookie + admin | Full question CRUD, same filter/search/pagination shape as Topics |
| PATCH / DELETE / POST `:id/restore` | `/api/admin/questions/:id[/restore]` | Cookie + admin | Edit, soft-delete, or restore a question — no cascade, since `MockInterview` snapshots question data rather than referencing it live |
| GET / POST | `/api/admin/topic-prompts[/:id]` | Cookie + admin | Full CRUD over `TopicInterviewPrompt` |
| GET / POST | `/api/admin/roadmaps/module/:moduleSlug` | Cookie + admin | Loads or creates the roadmap for a module; module comes from the URL, never the body |
| PATCH `:id`, `:id/active`, POST `:id/duplicate`, DELETE `:id` | `/api/admin/roadmaps/...` | Cookie + admin | Edit, activate/deactivate, duplicate, or soft-delete a roadmap; `moduleId` is never an accepted field |
| POST / PATCH / DELETE / PATCH `:id/move` | `/api/admin/roadmap-weeks/...`, `/api/admin/roadmap-days/...` | Cookie + admin | Week and day CRUD plus adjacent-swap reordering |
| GET | `/api/admin/mock-interviews`, `/api/admin/mock-interviews/summary`, `/api/admin/mock-interviews/:id` | Cookie + admin | Filtered/paginated list, filter-respecting summary counts, and a detail view — real `MockInterview` data, never a fabricated score |
| DELETE | `/api/admin/mock-interviews/:id` | Cookie + admin | Hard-deletes the mock — no ownership restriction (unlike the user-facing delete), so it disappears from the owning user's history too |
| DELETE | `/api/admin/mock-interviews` | Cookie + admin | Bulk delete — accepts the same `module`/`status`/`difficulty`/`dateRange`/`search` query params as the list endpoint, built from the identical shared filter function |
| GET | `/api/admin/analytics` | Cookie + admin | `?range=today\|7d\|30d\|90d\|all` — the full platform analytics payload in one call, admin accounts excluded from every activity number |
| GET | `/api/admin/audit-log` | Cookie + admin | `?targetType=&verb=created\|updated\|deleted\|restored\|reordered\|other&dateRange=`, paginated. The rest of `/api/admin/*` (Interview Timing, Settings) is planned, not built (see [Admin panel](#admin-panel)) |
| GET | `/api/analytics` | Cookie | `?module=lld\|hld\|all&range=7d\|30d\|90d\|all` — the full Analytics page payload in one call; `userId` always from the session, never a query parameter |
| GET | `/api/achievements` | Cookie | Every achievement in the catalog with this user's real progress, earned state, and earned date; also persists any newly-crossed achievement |
| GET | `/api/achievements/stats` | Cookie | `{ earnedCount, totalCount, completionPercentage, recentAchievements }` |
| GET / POST | `/api/notes` | Cookie | `?module=lld\|hld&type=topic\|question&search=` — the user's own notes only, always |
| GET | `/api/notes/target/:targetType/:targetId` | Cookie | Returns the user's note for this topic/question, or `null` if none exists yet — not a 404, since that's the normal state |
| GET / PATCH / DELETE | `/api/notes/:id` | Cookie + owner | Ownership enforced on every one — a different user's note id returns 404, never the content |
| GET | `/api/admin/notes`, `/api/admin/notes/stats` | Cookie + admin | Global list (search/module/type/user/date/sort, paginated) and platform-wide note counts — a separate router from `/api/notes`, never scoped by `userId` |
| GET / PATCH / DELETE | `/api/admin/notes/:id` | Cookie + admin | View, correct (title/content only — structurally, the identity fields are never accepted), or delete any user's note |
| GET | `/api/admin/settings`, `/api/admin/settings/database-stats` | Cookie + admin | The full `SystemSettings` singleton, and real counts (topics/questions/prompts/roadmaps/notes/mocks) from MongoDB |
| PATCH | `/api/admin/settings/platform`, `/api/admin/settings/modules`, `/api/admin/settings/password` | Cookie + admin | Platform name/description; LLD/HLD availability (genuinely enforced — see [Admin Settings](#admin-settings)); admin's own password (current-password verified, never accepts a userId) |
| POST | `/api/admin/settings/reset` | Cookie + admin | Restores every setting to its schema default |

Planned, not yet implemented: `POST/PATCH/DELETE /api/roadmaps[/:id]`, `/api/roadmaps/:id/weeks`,
`/api/roadmap-days/:dayId` (the full custom-roadmap CRUD layer — see [Roadmap](#roadmap)), a
submit/score endpoint for an in-progress mock, `/api/notes`, `/api/achievements*`.

## Environment variables

**This repo ships with real, working `.env` files already in place** — `frontend/.env` and
`backend/.env` — so `npm run dev` works immediately after `npm run install:all`. `backend/.env`
includes a genuinely random `JWT_SECRET` and points `MONGODB_URI` at a local `mongod` on its
default port; swap in an Atlas string if you're using that instead (see
[Troubleshooting](#troubleshooting) for the DNS issue that's common with `mongodb+srv://`).

Both folders also keep a `.env.example` as a template. Both real `.env` files are excluded from
version control by their own local `.gitignore`, not just the root one.

**`frontend/.env.example`**
```
VITE_API_URL=http://localhost:5000/api
```

**`backend/.env.example`**
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/interviewforge
JWT_SECRET=<generate one — see below>
CLIENT_URL=http://localhost:5173
```

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Installation

Requires Node.js 20+ and a MongoDB instance (local `mongod`, or a free
[MongoDB Atlas](https://www.mongodb.com/atlas) cluster).

```bash
git clone <this-repo>
cd interview-forge
npm run install:all
```

## Running locally

```bash
npm run dev
```

Runs the frontend (`http://localhost:5173`) and API (`http://localhost:5000`) together. To run
them separately: `npm run dev --prefix backend` / `npm run dev --prefix frontend`.

## Seeding the database

```bash
npm run seed
```

Upserts the two `Module` documents, 63 `Topic` documents, 15 `Question` documents, 63
`TopicInterviewPrompt` documents, and 1 `Roadmap` with 6 `RoadmapWeek` and 42 `RoadmapDay`
documents (37 study, 5 rest) — all as `source: 'system'`. Prints a real summary computed from
the database afterward:

```
--------------------------------
InterviewForge Seed Summary
--------------------------------
LLD Topics: 63

OOP: 6
UML: 3
SOLID: 6
Creational Patterns: 4
Structural Patterns: 7
Behavioral Patterns: 11
Design Concepts: 5
LLD Problems: 18
Interview Problems: 3

Topic Interview Prompts: 63
HLD Topics: 0
Roadmap: "Low-Level Design Roadmap" — 6 weeks, 37 study days, 5 rest days
--------------------------------
```

Safe to re-run, including upgrading from an earlier version of this script. Content you add
yourself through the app is never touched by seeding. If you seeded before this version, re-run
it — four questions (Splitwise, Tic-Tac-Toe, Snake and Ladder, Chess) previously failed to link
to their topic and were silently skipped; re-seeding creates them without touching anything else.

## Production build

```bash
npm run build                 # builds frontend/dist
cd backend && npm start       # NODE_ENV=production
```

Serve `frontend/dist` from any static host and deploy `backend/` to any Node host with a
`MONGODB_URI` it can reach. Set real production environment variables on that host.

## A note on the dark-mode text color pattern

Earlier in this build, a specific pattern — `text-[var(--color-text-primary)]`, a Tailwind
arbitrary value pointing at a CSS custom property — turned up broken in three unrelated places:
the sidebar logo, a mock interview's prompt text, and (most recently) every modal's title bar. In
each case the text rendered at roughly the brightness of the page background rather than the
light color the code specified, and a live browser was never available in this environment to
pin down the exact underlying mechanism (a Playwright browser download is blocked here). Fixing
each report individually risked leaving the same latent issue in whatever wasn't reported yet.

Once the same failure showed up a third time in an unrelated file, that stopped looking like
three isolated incidents and started looking like a property of the pattern itself. So this
version replaces `text-[var(--color-text-primary)]` everywhere in the frontend — 187 occurrences
across 51 files — with a different mechanism entirely: direct hex values through Tailwind's
native `dark:` variant (`text-[#16181D] dark:text-[#E9EAEC]`), which resolves colors directly in
the compiled CSS rather than through a custom-property lookup, sidestepping whatever the original
issue was rather than depending on fully diagnosing it.

A mechanical, codebase-wide find-and-replace like this carries its own risk, and it surfaced one:
six places used the color conditionally — `hover:text-[var(--color-text-primary)]`, meant to
brighten text only on hover — and a naive substitution would have attached the light-mode
`hover:` class correctly while leaving the new dark-mode class unconditional, quietly turning
"brightens on hover" into "always bright in dark mode." Caught by grepping the result for exactly
that shape before trusting it, and fixed to `hover:text-[#16181D] dark:hover:text-[#E9EAEC]` —
confirmed in the actual compiled CSS output that the dark-mode rule is genuinely scoped to both
`.dark` and `:hover` together, not just one of the two.

Going forward, new text in this codebase should use the same `text-[#16181D] dark:text-[#E9EAEC]`
pattern (or the equivalent for secondary/faint text) rather than the custom-property form that
caused this.

## Troubleshooting

**`querySrv ECONNREFUSED _mongodb._tcp.<cluster>.mongodb.net`** with MongoDB Atlas — a DNS SRV
lookup failure, not a credentials problem. `backend/src/config/db.js` already works around the
common cause (a Node.js DNS resolver issue, common on Windows) by pointing Node at a public
resolver before connecting. If it persists: try a different network to confirm it's
network-related, update Node.js, or use the standard (non-SRV) `mongodb://` connection string
from Atlas's connect dialog.

**Atlas connection string missing a database name or `retryWrites`/`w=majority`** — add them:
`mongodb+srv://<user>:<pass>@<cluster>/interviewforge?retryWrites=true&w=majority`.

**The server logs a connection error but never crashes** — intentional. Express starts
regardless of Mongo's connection state, so `/api/health` always works, and any endpoint that
actually touches the database returns a clean `500` instead of a hard crash until
`MONGODB_URI` resolves.

**403 "You can only delete topics/questions you created"** — correct behavior. Only content
where `createdBy` matches your own user ID (or where you're an admin) can be edited or deleted.
System content can't be deleted by a normal user at all, by design.

## A note on this repo's origin

This was built and verified inside a sandboxed environment with no reachable MongoDB instance —
confirmed directly, not assumed: `mongodb-memory-server` was actually attempted here, and its
binary download failed because `fastdl.mongodb.org` isn't a reachable host in this environment,
and there's no `mongod` package available through the system's own package manager either.
Everything that doesn't require a live database was verified directly: clean install/build/lint
on both frontend and backend, every backend file syntax-checked, all seeded content validated
against the real Mongoose schemas, every API route confirmed wired and auth-gated, ownership
authorization tested directly against several scenarios, the mock-eligibility engine tested
against a full topic/question completion matrix with real assertions on the output, the
`POST /api/mocks` security property confirmed by inspecting both the validator and the service
function's source for any code path that could read a caller-supplied question list (there is
none), and the dashboard and Mock Interview pages server-rendered against realistic data to
confirm the right content actually reaches the screen. A rendering-specific bug class (a Unicode
escape sequence typed as literal text in bare JSX) was found by a full-codebase sweep, including
two instances that had shipped unnoticed in an earlier version of this app, and fixed with SSR
output as proof.

A later report of "completed topics detected correctly, but completed questions always show
zero eligible" was investigated the same way rather than re-explained from memory: every layer
of the write and read paths was read against the real current source, and — specifically because
memory-mocked test functions can't catch this class of bug — real Mongoose schema validation
(`Document.validateSync()`) and real query-casting behavior (`Query.prototype.cast()`) were
exercised directly, confirming a string array correctly casts to `ObjectId` before reaching the
query engine. That first hypothesis checked out clean rather than being assumed clean. The
investigation did find one real, confirmed bug: four seeded questions (Splitwise, Tic-Tac-Toe,
Snake and Ladder, Chess) referenced their topic by a name that didn't exactly match the seeded
`Topic.name` ("Splitwise" vs. the actual "Splitwise Clone," etc.), so the seed script's
exact-match lookup silently skipped creating them — confirmed by diffing every question's lookup
key against every actual seeded topic name, not just the four that stood out on inspection.
Because the seed upserts idempotently, re-running `npm run seed` on an existing database picks
these four up without touching anything else. A second, separate cause was also identified as
the likely explanation for that specific report, and a persistent diagnostic endpoint was built
to confirm it against real data, since this environment can't.

A further request then changed the eligibility rule itself — not a bug fix, a deliberate
reversal: a question no longer needs its topic completed too, on the reasoning that solving a
build problem directly is just as legitimate as working through its topic first. This is
implemented and tested against the exact scenario in the request (foundational topics completed
with no questions of their own, build-problem questions completed with their own topics not yet
marked complete) plus the deleted-topic edge case from [Mock interviews](#mock-interviews),
using the same real-document-and-cast verification approach as above — 13 assertions, all
passing, including the one the request marked as critical: a completed question whose topic is
not completed now correctly appears.

A final request split Mock Interview into two genuinely independent interview types (topic vs.
question), reporting that the Topics tab was still creating question-based mocks — a real
architectural gap: the tab only ever changed which list was displayed, never which pool a mock
was built from. Fixed with two separate eligibility functions and a `type` value threaded through
config and creation as one thing, not defaulted; verified with a topic-eligibility test including
the case the request marked as most important (topics completed, zero questions completed, still
eligible) and a full SSR pass of the rewritten page across both interview types, empty states,
mixed-mode grouping for topics, and — specifically, because it's exactly the kind of thing that's
easy to get wrong in a page this size — a stale-response guard, tested directly: cached data from
the tab just left does not render under the tab just opened. The 63-topic prompt library needed
for Topic Interview was diffed programmatically against the real seeded topic names before
writing anything to the database, the same safeguard that would have caught an earlier seed bug
immediately instead of after the fact.

The Roadmap feature was built from an actually-uploaded source PDF, read and cross-checked
against it rather than trusted from a transcription: every one of the 42 days' text, every time
string, and all 6 week titles were diffed programmatically against `pdftotext`-extracted content.
That first verification pass produced 4 false mismatches, traced to `pdftotext -layout`
interleaving the "Day N" label into the middle of longer wrapped table cells — a PDF-extraction
quirk in the verification script itself, confirmed by re-extracting in plain mode and getting a
clean match, not assumed innocent and left alone. Separately, the PDF's own header text ("42
study days") doesn't match its actual day-by-day content (37 study days, 5 explicit rest days);
since the brief was explicit that rest days must never count toward completion, 37 was used as
the real denominator everywhere, verified with 14 assertions covering rest-day exclusion at both
the whole-roadmap and per-week level, current-day/next-up selection, and per-user isolation. A
full SSR pass covered the real page against realistic data, the roadmap-complete state, and both
module empty states — and, checking proactively this time rather than after a report, caught two
real instances of the same bare-JSX-text Unicode-escape bug from earlier in this build before
they shipped, this time in code that had just been written rather than found from a screenshot.

The mock-interview timing system's LLD default values were checked programmatically against the
feature's own specification text (the same discipline as the roadmap, though — worth being exact
about — no separate timing-guide file was actually uploaded for this feature the way the roadmap
PDF was, so there was no independent source document to cross-verify those numbers against here).
The per-item duration resolution was verified against the brief's own worked examples directly:
a mixed-mode mock with an LLD Easy topic, an HLD Medium topic, and an LLD Hard topic resolved each
to its own module's configured time rather than one shared value (confirming the HLD item used
HLD's default, not LLD's, since both configs deliberately used different numbers in the test to
make that distinguishable), and the 4-topics-at-4-minutes and 3-questions-at-55-minutes totals
from the brief's own examples reproduced exactly. Backend-side range validation was confirmed to
actually reject an out-of-range value rather than clamp or ignore it, and that one user's override
never appears for another user or leaks across modules on reset — 14 assertions on the resolution
service alone, plus a further 8 on mock creation's use of it. Two real instances of the bare-JSX
Unicode-escape bug were again found and fixed proactively in the new Settings UI before they
shipped, and a real stale-reference bug (a controller still reading a request field the validator
had just stopped producing) was caught by re-reading the code rather than assumed fine because it
matched the pattern of surrounding lines.

The live interview session's timer was the one piece of this whole build where reading the code
carefully genuinely isn't enough — "does this survive a re-render" is a claim about behavior over
time, not structure, so it was checked with an actual interactive DOM simulation instead: `jsdom`
installed specifically for this, a real React root, a controlled fake clock, and a deliberately
unrelated state update fired in the middle of a countdown to confirm it keeps going rather than
snapping back — 7 assertions, including that moving to a genuinely new question does still reset
it correctly, so the fix isn't just "never reset." Backend timer authority (an item is marked
`timed_out` from real elapsed time against `expiresAt`, never from what a request claims) and the
atomic finish-saves-the-last-answer-before-completing behavior were each verified directly against
constructed sessions, not inferred from the code shape. Building the dashboard's resume banner
surfaced a real state-management bug before it shipped: the first version reused the same Redux
slot `MockHistoryPage` already populates for its own filtered list, which would have made the two
pages silently stomp on each other's data — caught by tracing the actual data flow, not assumed
safe because each page's own logic looked correct in isolation. The same review pass also caught
that the dashboard's mock counts, unchanged since before real sessions existed, would have started
quietly counting in-progress and abandoned sessions as "mocks completed" now that those states are
real — fixed by scoping the aggregation to `completed` specifically. And re-reading this README
while documenting the change surfaced an accidental duplicated paragraph left over from an earlier
edit, fixed here rather than left in because it wasn't part of what this turn was about.

This pass also included a real, if inconclusive, investigation: a specific dark-theme contrast
bug was reported against the mock interview screen, backed by what was described as an uploaded
video. No video was actually attached — only unrelated images from earlier in the build were
present — and a thorough audit (every hardcoded dark-text class, the actual **compiled** CSS
output for the dark-mode token overrides, and both components that render interview question
text) found nothing wrong. Rather than make speculative changes to a system that checked out
under real scrutiny, that was reported plainly rather than papered over with an unverifiable fix.
The admin foundation added this pass was verified the same way as everything else: `requireAdmin`
against five scenarios including a non-admin, a missing `req.user`, and a near-miss role string;
the dashboard's statistics aggregation against constructed data, including that "active users"
correctly deduplicates a user active in two different ways rather than double-counting them; and
`AdminRoute`'s three-way behavior (admin, non-admin, unauthenticated) with server-rendered React
Router — a first attempt at that last check used a route structure that didn't faithfully mirror
how the routes actually nest in `AppRoutes.jsx`, produced a false failure, and was redone to match
exactly before being trusted.

This pass opened with a second attempt at the dark-theme contrast bug, this time backed by an
actually-uploaded video rather than none. The whole 40 seconds were reviewed — a broad survey plus
a programmatic frame-difference scan across every transition, so nothing brief could hide between
samples — and it never once reached an actual mock interview question; the account it was recorded
with has no completed content, so both interview types stay on their empty state throughout. Every
page it does show renders with clean, readable text, confirmed from actual pixels rather than
compiled CSS this time. That's reported here plainly rather than resolved, because a change made
to "fix" a bug that can't be reproduced risks touching something that already works.

Analytics and Achievements were each verified on their own terms. The shared streak algorithm —
used by both — was tested against twelve constructed date sequences before either feature was
built on top of it, including the case most likely to be gotten wrong: a streak that's alive
because yesterday had activity even though today doesn't yet, versus one that's genuinely broken
after a two-day gap, and a "longest streak" that correctly finds an older, longer run in history
even while the *current* run is shorter. The analytics aggregation was checked end-to-end against
constructed data for real computed values, not just "did it throw," and a proactive escape-sequence
sweep of the new page caught three real instances of the same bare-JSX-text Unicode bug from
earlier in this build — this time in freshly-written code, before they shipped rather than after a
report. The achievement system's unlock logic was checked for the property that actually matters
for a persistence-backed catalog: evaluating twice in a row does not duplicate-award anything, and
a purpose-built boolean achievement ("complete an entire roadmap") was separately confirmed to stay
locked at 2 of 3 study days and unlock only exactly at 3 of 3. Wiring the unlock check into the
existing progress-completion endpoints surfaced a real mock-fidelity bug during testing — the mock
for `findOneAndUpdate` was shaped wrong, which silently meant the achievement check was never being
exercised at all — caught by a failing assertion rather than a passing one that wasn't actually
testing what it claimed to.

The contrast bug got a third, decisive look this pass, backed for the first time by an actual
screenshot rather than a video that never reached the relevant screen. Pixel sampling gave real
numbers instead of an impression: the background and accent orange matched this app's dark-mode
tokens exactly, but neither "InterviewForge" nor the page title showed any pixel near the expected
light text color — ruling out a screenshot/compression artifact directly (correctly-colored text,
downscaled the same way in a controlled test, stayed bright; it didn't fade toward invisible the
way the real screenshot did) and pointing at a genuine `var()`-resolution failure specific to those
two elements, consistent with an earlier jsdom result that had been dismissed as a tooling
limitation. Unable to get a live browser to confirm the exact mechanism (the sandbox's network
allowlist blocks Playwright's browser download), the fix was made robust to that uncertainty
instead: both elements now use direct hex values with Tailwind's native `dark:` variant rather than
a CSS custom property, a different code path that can't fail the same way — confirmed directly in
the compiled CSS output, and deliberately not applied any more broadly than the two elements
actually evidenced.

The admin/user separation work was verified at the two places it actually matters: the shared
`getPostAuthRoute()` helper (one function, used identically in three places, rather than the
redirect logic drifting across them), and User Management's safety mechanisms specifically —
demoting the last remaining admin is rejected with a live database count, not a stale client-side
assumption; an admin cannot disable their own account; a disabled account is rejected both at a
fresh login attempt and, separately, on its very next request with an already-valid session
cookie, since disabling mid-session should actually end that session, not just block new ones. The
bulk per-user stats query for the user list was checked for the thing that would be worst to get
wrong silently — that one user's completed-topics count doesn't leak onto another user's row.

This pass resolved the contrast bug for real, and it's worth being specific about why the earlier
attempts hadn't: the video finally showed the actual live Mock Interview screen (the two before it
never reached it), and pixel sampling on that frame showed the main prompt text rendering at
almost exactly the brightness of `--color-text-faint` rather than the `--color-text-primary` the
code specifies — the same failure signature already confirmed once in the Logo/Topbar case, now
confirmed a second time in an unrelated component. That repetition was itself useful evidence: it
turned "maybe an isolated fluke" into "a real, specific pattern," which is why the same proven fix
(direct hex colors via Tailwind's `dark:` variant, bypassing the custom property entirely) was this
time extended proactively to `MockResultPage.jsx` and `TopicPromptCard.jsx` — two components
showing the same kind of content through the same vulnerable pattern, not yet individually
reported. Removing User Management was verified the way a deletion should be: not just unlinking
the page, but grepping the entire codebase for every name the feature was known by, which caught a
real, otherwise-invisible bug — `usePageTitle.js` still referenced the deleted route constant,
which would have evaluated to `undefined` as an object key and sat there harmlessly until someone
next touched that file. The new content-focused dashboard was checked for the specific thing that
would have been an embarrassing regression: that the word "users" doesn't appear on it anywhere,
not just that a stats card was removed.

What was **not** possible to verify here is an actual successful write/read against MongoDB —
that needs your own `MONGODB_URI`, a one-line change (see
[Environment variables](#environment-variables)).

## Future HLD expansion

The architecture is already HLD-ready — `Module`, `Topic`, and `Question` all key off
`moduleId`, and the `hld` module is already seeded (just empty). Adding HLD content means
inserting `Topic`/`Question` documents with `moduleId` pointing at `hld` — through the existing
`+ Add Topic`/`+ Add Question` forms, a future seed file, or a future import feature — with no
schema changes and no new code paths required. It will appear under the existing `[ HLD ]`
toggle on Topics and Questions, and factor into the dashboard's HLD coverage and LLD vs HLD
comparison, automatically.
