import InterviewTimingConfig from '../models/InterviewTimingConfig.js';

const tier = (min, max, def) => ({ minMinutes: min, maxMinutes: max, defaultMinutes: def });

// LLD: the exact figures given directly in the brief's own
// "TIMING CONFIGURATION MODEL" example — concept/topic questions run
// noticeably shorter than design questions, which is the whole point of
// having two separate timing tracks rather than one.
const LLD_CONFIG = {
  module: 'lld',
  topic: { easy: tier(1, 2, 2), medium: tier(3, 5, 5), hard: tier(5, 8, 8) },
  question: { easy: tier(30, 45, 45), medium: tier(40, 45, 45), hard: tier(45, 60, 60) },
  // Guidance only, never enforced — codingMinutes/walkthroughMinutes left
  // null where the brief describes them as "remaining time" rather than a
  // fixed figure, so the resolver computes that share relative to whatever
  // total duration is actually in play, not just the default.
  questionPhases: {
    easy: { designMinutes: 10, codingMinutes: null, walkthroughMinutes: null },
    medium: { designMinutes: 15, codingMinutes: 25, walkthroughMinutes: 5 },
    hard: { designMinutes: 18, codingMinutes: 20, walkthroughMinutes: null },
  },
};

// HLD: no timing guide was provided for this module — these are explicitly
// provisional defaults (mirroring LLD's numbers as a neutral starting
// point), never presented as sourced from anything, and fully editable per
// user from the first login. See section 43 of the brief: do not claim an
// authority these numbers don't have.
const HLD_CONFIG = {
  module: 'hld',
  topic: { easy: tier(1, 2, 2), medium: tier(3, 5, 5), hard: tier(5, 8, 8) },
  question: { easy: tier(30, 45, 45), medium: tier(40, 45, 45), hard: tier(45, 60, 60) },
  questionPhases: {
    easy: { designMinutes: 10, codingMinutes: null, walkthroughMinutes: null },
    medium: { designMinutes: 15, codingMinutes: 25, walkthroughMinutes: 5 },
    hard: { designMinutes: 18, codingMinutes: 20, walkthroughMinutes: null },
  },
};

export const seedTimingConfig = async () => {
  for (const config of [LLD_CONFIG, HLD_CONFIG]) {
    await InterviewTimingConfig.findOneAndUpdate({ module: config.module }, config, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
  }
  console.log('\u2705 Seeded interview timing config (lld, hld)');
};
