import jwt from 'jsonwebtoken';

const DAY_MS = 24 * 60 * 60 * 1000;

const isProduction = process.env.NODE_ENV === 'production';

export const generateToken = (userId, rememberMe) => {
  const expiresIn = rememberMe ? '30d' : '1d';

  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

export const setAuthCookie = (res, token, rememberMe) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    partitioned: isProduction,
    maxAge: rememberMe ? 30 * DAY_MS : 1 * DAY_MS,
    path: '/',
  });
};

export const clearAuthCookie = (res) => {
  res.cookie('token', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    partitioned: isProduction,
    expires: new Date(0),
    path: '/',
  });
};