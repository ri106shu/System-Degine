import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { generateToken, setAuthCookie, clearAuthCookie } from '../services/tokenService.js';

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists', [
      { field: 'email', message: 'Email is already registered' },
    ]);
  }

  const user = await User.create({ name, email, password });

  const token = generateToken(user._id, false);
  setAuthCookie(res, token, false);

  res.status(201).json({ success: true, data: { user } });
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password, rememberMe } = req.body;

  const user = await User.findOne({ email }).select('+password');
  const valid = user && (await user.comparePassword(password));

  if (!valid) {
    // Deliberately identical message for "no such user" and "wrong
    // password" so the API never confirms whether an email is registered.
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'This account has been disabled. Contact an administrator.');
  }

  const token = generateToken(user._id, rememberMe);
  setAuthCookie(res, token, rememberMe);

  user.password = undefined;
  res.json({ success: true, data: { user } });
});

// POST /api/auth/logout
export const logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, data: {} });
});

// GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  // req.user is already the full document, attached by the `protect` middleware.
  res.json({ success: true, data: { user: req.user } });
});
