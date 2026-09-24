import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import User from '../models/User.js';

// Reads the httpOnly cookie (never a header — the client never touches the
// token directly), verifies it, and attaches the user document to req.user.
export const protect = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    throw new ApiError(401, 'Not authorized \u2014 please log in');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new ApiError(401, 'Your session has expired \u2014 please log in again');
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new ApiError(401, 'This account no longer exists');
  }
  if (!user.isActive) {
    throw new ApiError(403, 'This account has been disabled. Contact an administrator.');
  }

  req.user = user;
  next();
});

// Not wired to any route yet (no admin routes exist yet), but established
// established now since User.role already exists — see section 34 of the brief.
export const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    throw new ApiError(403, 'You do not have permission to do that');
  }
  next();
};

// Every /api/admin/* route uses this — always after `protect`, so req.user
// is guaranteed to exist first. Frontend route guards are a UX convenience,
// never the actual boundary: this is what a normal user hitting an admin
// endpoint directly actually runs into.
export const requireAdmin = authorize('admin');
