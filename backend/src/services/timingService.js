import InterviewTimingConfig from '../models/InterviewTimingConfig.js';
import UserInterviewTimingPreference from '../models/UserInterviewTimingPreference.js';
import ApiError from '../utils/ApiError.js';

const MODULES = ['lld', 'hld'];
const TYPES = ['topic', 'question'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];

const getConfigs = async () => {
  const configs = await InterviewTimingConfig.find({});
  const byModule = {};
  for (const c of configs) byModule[c.module] = c;
  return byModule;
};

// The full resolved picture for a user — system default plus this user's
// own override (or null) for every module/type/difficulty combination, used
// by both GET /api/interview-timing and the Settings page directly.
export const getResolvedTiming = async (userId) => {
  const configsByModule = await getConfigs();
  const pref = await UserInterviewTimingPreference.findOne({ userId });

  const result = {};
  for (const module of MODULES) {
    const config = configsByModule[module];
    if (!config) continue;
    result[module] = {};
    for (const type of TYPES) {
      result[module][type] = {};
      for (const difficulty of DIFFICULTIES) {
        const tier = config[type][difficulty];
        const override = pref?.[module]?.[type]?.[difficulty] ?? null;
        result[module][type][difficulty] = {
          min: tier.minMinutes,
          max: tier.maxMinutes,
          default: tier.defaultMinutes,
          selected: override ?? tier.defaultMinutes,
          isCustom: override != null,
        };
      }
    }
    result[module].questionPhases = config.questionPhases;
  }
  return result;
};

// Backend validation — never trusts that the frontend only offered values
// inside the allowed range. Rejects with the exact range in the message,
// matching section 14's example wording.
export const updateUserTimingPreference = async (userId, { module, type, difficulty, durationMinutes }) => {
  if (!MODULES.includes(module) || !TYPES.includes(type) || !DIFFICULTIES.includes(difficulty)) {
    throw new ApiError(400, 'Invalid module, type, or difficulty');
  }
  const config = await InterviewTimingConfig.findOne({ module });
  if (!config) throw new ApiError(404, `No timing configuration exists for module "${module}"`);

  const tier = config[type][difficulty];
  if (durationMinutes < tier.minMinutes || durationMinutes > tier.maxMinutes) {
    throw new ApiError(
      400,
      `${difficulty[0].toUpperCase()}${difficulty.slice(1)} ${module.toUpperCase()} ${type} interviews must be between ${tier.minMinutes} and ${tier.maxMinutes} minutes.`
    );
  }

  const path = `${module}.${type}.${difficulty}`;
  const pref = await UserInterviewTimingPreference.findOneAndUpdate(
    { userId },
    { $set: { [path]: durationMinutes }, $setOnInsert: { userId } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return pref;
};

// Section 41: reset only this user's overrides for one module — never
// touches InterviewTimingConfig, which is shared system state.
export const resetUserTimingToDefault = async (userId, module) => {
  if (!MODULES.includes(module)) throw new ApiError(400, 'Invalid module');
  await UserInterviewTimingPreference.findOneAndUpdate(
    { userId },
    { $set: { [module]: { topic: { easy: null, medium: null, hard: null }, question: { easy: null, medium: null, hard: null } } } },
    { upsert: true }
  );
};

// The one function mock creation actually calls — resolves a single
// item's duration to seconds: this user's override if they have one for
// this exact module/type/difficulty, else the system default. Never reads
// anything the caller supplies about the duration itself.
export const resolveDurationSeconds = async (userId, module, type, difficulty) => {
  const config = await InterviewTimingConfig.findOne({ module });
  if (!config) throw new ApiError(404, `No timing configuration exists for module "${module}"`);
  const tier = config[type][difficulty];
  const pref = await UserInterviewTimingPreference.findOne({ userId });
  const override = pref?.[module]?.[type]?.[difficulty] ?? null;
  const minutes = override ?? tier.defaultMinutes;
  return minutes * 60;
};
