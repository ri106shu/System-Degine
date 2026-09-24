import rateLimit from 'express-rate-limit';

// Applied only to register/login (see authRoutes.js) — logout and /me stay
// unlimited since they're not guessable/brute-forceable targets.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts \u2014 please wait a few minutes and try again.',
    errors: [],
  },
});
