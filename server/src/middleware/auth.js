import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { verifyToken } from '../utils/token.js';
import { AUTH_COOKIE, ROLES } from '../config/constants.js';

/** Requires a valid session cookie. Loads the user from the DB into req.user. */
export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[AUTH_COOKIE];
    if (!token) throw ApiError.unauthorized();

    let payload;
    try {
      payload = verifyToken(token);
    } catch (err) {
      throw ApiError.unauthorized(err.name === 'TokenExpiredError' ? 'Your session has expired. Please sign in again.' : 'Invalid session. Please sign in again.');
    }

    const user = await User.findById(payload.sub);
    if (!user) throw ApiError.unauthorized('Account not found. Please sign in again.');

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/** Must be used after requireAuth. The role comes from the database, never from the client. */
export function requireAdmin(req, res, next) {
  if (req.user?.role !== ROLES.ADMIN) {
    return next(ApiError.forbidden('Admin access only.'));
  }
  return next();
}
