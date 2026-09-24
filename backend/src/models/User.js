import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [60, 'Name must be 60 characters or fewer'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // never returned by default — callers opt in with .select('+password')
    },
    avatar: { type: String, default: '' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    // Admin disable/enable (section 5 of the admin-separation brief) — a
    // disabled account can't log in and can't authenticate an existing
    // session; it isn't deleted, so its data and history stay intact.
    isActive: { type: Boolean, default: true },

    // Gamification — present in the schema now so it never needs a
    // migration once XP/level/streak awarding is wired up to real events.
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActivityDate: { type: Date, default: null },
    totalStudyMinutes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Mongoose 9 removed the next()-callback style entirely for pre() hooks —
// they're async-only now, called with zero arguments. (Source of the
// "next is not a function" bug this file used to have: the old callback
// signature meant `next` was undefined, so calling it threw exactly that.)
userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Belt-and-suspenders alongside `select: false` above: even if a query
// explicitly re-selects the password, it never survives JSON serialization.
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  },
});

export default mongoose.model('User', userSchema);
