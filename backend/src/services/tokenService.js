import jwt from 'jsonwebtoken';

const DAY_MS = 24 * 60 * 60 * 1000;

export const generateToken = (userId, rememberMe) => {
  const expiresIn = rememberMe ? '30d' : '1d';
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn });
};

export const setAuthCookie = (res, token, rememberMe) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    // 'none' is required for cross-site cookies in production (client and
    // API on different domains); 'lax' is fine for same-site local dev.
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: rememberMe ? 30 * DAY_MS : 1 * DAY_MS,
  });
};

export const clearAuthCookie = (res) => {
  res.cookie('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    expires: new Date(0),
  });
};
