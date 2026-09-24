import { isModuleEnabled } from '../services/systemSettingsService.js';
import ApiError from '../utils/ApiError.js';

// Blocks a request for a specific module (lld/hld) when an admin has
// disabled it. `source` picks where the module value lives on this route:
// 'query' for the listing endpoints (?module=lld), 'body' for mock
// creation (validated body's `mode` field, which after
// validate(createMockSchema) is always one of lld/hld/mixed).
// 'mixed' is deliberately allowed through — disabling one module doesn't
// forbid a mixed-mode mock outright, since eligibility (whether there's
// enough content left after excluding the disabled module) is mockService's
// own concern, not this middleware's.
const checkModuleEnabled = (source = 'query', field = 'module') => async (req, res, next) => {
  const moduleSlug = source === 'body' ? req.body[field] : req.query[field];
  if (!moduleSlug || moduleSlug === 'all' || moduleSlug === 'mixed') return next();

  const enabled = await isModuleEnabled(moduleSlug);
  if (!enabled) {
    throw new ApiError(403, `${moduleSlug.toUpperCase()} preparation is currently unavailable.`);
  }
  next();
};

export default checkModuleEnabled;
