import Note from '../models/Note.js';
import User from '../models/User.js';
import Topic from '../models/Topic.js';
import Question from '../models/Question.js';
import Module from '../models/Module.js';
import ApiError from '../utils/ApiError.js';
import { logAdminAction } from '../utils/auditLog.js';

const DATE_RANGE_MS = {
  today: 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  '90d': 90 * 24 * 60 * 60 * 1000,
};

const SORT_MAP = {
  updatedAt_desc: '-updatedAt',
  createdAt_desc: '-createdAt',
  title_asc: 'title',
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Server-side search across note title/content AND the note's owner
// (name/email) AND the related topic/question title — never a full-table
// download filtered in the app. Three small lookups (users, topics,
// questions matching the term) resolved to id lists first, then folded
// into one $or on the actual Note query — the same shape as the
// mock-interview monitoring search, extended to cover the extra fields
// this brief specifically requires.
const buildSearchFilter = async (search) => {
  const re = new RegExp(escapeRegex(search.trim()), 'i');
  const [matchingUsers, matchingTopics, matchingQuestions] = await Promise.all([
    User.find({ $or: [{ name: re }, { email: re }] }).select('_id'),
    Topic.find({ name: re }).select('_id'),
    Question.find({ title: re }).select('_id'),
  ]);
  return {
    $or: [
      { title: re },
      { content: re },
      { userId: { $in: matchingUsers.map((u) => u._id) } },
      { targetType: 'topic', targetId: { $in: matchingTopics.map((t) => t._id) } },
      { targetType: 'question', targetId: { $in: matchingQuestions.map((q) => q._id) } },
    ],
  };
};

const buildFilter = async ({ module, type, userId, dateRange, search }) => {
  const filter = {};
  if (type && type !== 'all') filter.targetType = type;
  if (userId && userId !== 'all') filter.userId = userId;
  if (dateRange && dateRange !== 'all' && DATE_RANGE_MS[dateRange]) {
    filter.updatedAt = { $gte: new Date(Date.now() - DATE_RANGE_MS[dateRange]) };
  }
  if (module && module !== 'all') {
    const foundModule = await Module.findOne({ slug: module });
    filter.moduleId = foundModule?._id || null;
  }
  if (search) {
    Object.assign(filter, await buildSearchFilter(search));
  }
  return filter;
};

const toListEntry = (n) => ({
  _id: n._id,
  user: n.userId ? { _id: n.userId._id, name: n.userId.name, email: n.userId.email } : null,
  module: n.moduleId?.slug,
  targetType: n.targetType,
  targetLabel: n.targetId?.name || n.targetId?.title || 'Untitled',
  title: n.title,
  content: n.content,
  createdAt: n.createdAt,
  updatedAt: n.updatedAt,
  lastEditedByAdmin: Boolean(n.lastEditedByAdmin),
});

export const getAdminNoteList = async ({ module, type, userId, dateRange, search, sort = 'updatedAt_desc', page = 1, limit = 20 } = {}) => {
  const filter = await buildFilter({ module, type, userId, dateRange, search });

  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const safePage = Math.max(page, 1);
  const skip = (safePage - 1) * safeLimit;
  const sortSpec = SORT_MAP[sort] || SORT_MAP.updatedAt_desc;

  const [notes, total] = await Promise.all([
    Note.find(filter)
      .sort(sortSpec)
      .skip(skip)
      .limit(safeLimit)
      .populate('userId', 'name email')
      .populate('moduleId', 'slug')
      .populate({ path: 'targetId', select: 'name title' })
      .lean(),
    Note.countDocuments(filter),
  ]);

  return {
    notes: notes.map(toListEntry),
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.max(Math.ceil(total / safeLimit), 1),
  };
};

export const getAdminNoteDetail = async (id) => {
  const note = await Note.findById(id)
    .populate('userId', 'name email')
    .populate('moduleId', 'slug')
    .populate({ path: 'targetId', select: 'name title' })
    .populate('lastEditedByAdmin', 'name email');
  if (!note) throw new ApiError(404, 'Note not found');
  return {
    ...toListEntry(note),
    lastEditedByAdmin: note.lastEditedByAdmin ? { name: note.lastEditedByAdmin.name, email: note.lastEditedByAdmin.email } : null,
    lastEditedByAdminAt: note.lastEditedByAdminAt,
  };
};

// Admin may only ever change title/content — userId, targetType, targetId,
// and moduleId (the fields that identify whose note this is and what it's
// attached to) are never accepted here, structurally: they're simply not
// among the fields this function reads from `data`.
export const updateAdminNote = async (id, { title, content }, adminUser) => {
  const note = await Note.findById(id).populate('userId', 'name email').populate({ path: 'targetId', select: 'name title' });
  if (!note) throw new ApiError(404, 'Note not found');

  const changed = {};
  if (title !== undefined && title.trim() !== note.title) {
    changed.title = true;
    note.title = title.trim();
  }
  if (content !== undefined && content !== note.content) {
    changed.content = true;
    note.content = content;
  }
  if (Object.keys(changed).length === 0) return toListEntry(note);

  note.lastEditedByAdmin = adminUser._id;
  note.lastEditedByAdminAt = new Date();
  await note.save();

  // The audit log records that a correction happened and to what, never
  // the note's actual private content — "corrected note content", not the
  // text itself.
  const fieldsChanged = Object.keys(changed).join(' and ');
  await logAdminAction({
    adminUser,
    action: 'ADMIN_UPDATED_USER_NOTE',
    targetType: 'note',
    targetId: note._id,
    description: `Corrected ${fieldsChanged} of ${note.userId?.name || 'a user'}'s note "${note.title}" (${note.targetId?.name || note.targetId?.title || 'untitled'})`,
    metadata: { owner: note.userId?._id, targetType: note.targetType },
  });

  return toListEntry(note);
};

export const deleteAdminNote = async (id, adminUser) => {
  const note = await Note.findById(id).populate('userId', 'name email').populate({ path: 'targetId', select: 'name title' });
  if (!note) throw new ApiError(404, 'Note not found');

  const ownerLabel = note.userId?.name || 'an unknown user';
  const targetLabel = note.targetId?.name || note.targetId?.title || 'untitled';

  await Note.deleteOne({ _id: id });

  await logAdminAction({
    adminUser,
    action: 'ADMIN_DELETED_USER_NOTE',
    targetType: 'note',
    targetId: note._id,
    description: `Deleted ${ownerLabel}'s note "${note.title}" (${targetLabel})`,
    metadata: { owner: note.userId?._id, targetType: note.targetType },
  });

  return { deletedId: id };
};

export const getAdminNoteStats = async () => {
  const modules = await Module.find({});
  const lldModule = modules.find((m) => m.slug === 'lld');
  const hldModule = modules.find((m) => m.slug === 'hld');

  const [total, lldNotes, hldNotes, theoryNotes, questionNotes] = await Promise.all([
    Note.countDocuments({}),
    lldModule ? Note.countDocuments({ moduleId: lldModule._id }) : 0,
    hldModule ? Note.countDocuments({ moduleId: hldModule._id }) : 0,
    Note.countDocuments({ targetType: 'topic' }),
    Note.countDocuments({ targetType: 'question' }),
  ]);

  return { totalNotes: total, lldNotes, hldNotes, theoryNotes, questionNotes };
};
