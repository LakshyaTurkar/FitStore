import ApiError from '../utils/ApiError.js';

export const CSRF_HEADER = 'x-fitstore-client';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF protection for cookie-based auth ("custom request header" pattern).
 * Browsers cannot send a custom header cross-site without a CORS preflight,
 * and our CORS policy only allows CLIENT_URL. Combined with SameSite=Lax
 * cookies this blocks forged state-changing requests.
 */
export function csrfGuard(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  if (req.get(CSRF_HEADER) !== 'web') {
    return next(ApiError.forbidden('Missing or invalid client header.'));
  }
  return next();
}
