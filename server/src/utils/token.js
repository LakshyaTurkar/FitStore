import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { AUTH_COOKIE } from '../config/constants.js';

/** The token only carries the user id - role is always re-read from the database. */
export function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, env.jwtSecret, { expiresIn: env.jwtExpiresIn, algorithm: 'HS256' });
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
}

function cookieOptions() {
  return {
    httpOnly: true, // JavaScript in the browser cannot read it (XSS protection)
    // HTTPS only in production. SameSite=None is rejected by browsers unless Secure is set.
    secure: env.isProduction || env.cookieSameSite === 'none',
    sameSite: env.cookieSameSite,
    path: '/',
  };
}

export function setAuthCookie(res, token) {
  const decoded = jwt.decode(token);
  res.cookie(AUTH_COOKIE, token, { ...cookieOptions(), expires: new Date(decoded.exp * 1000) });
}

export function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE, cookieOptions());
}
