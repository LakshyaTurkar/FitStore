import { OAuth2Client } from 'google-auth-library';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';

let client;
const getClient = () => {
  if (!client) client = new OAuth2Client(env.googleClientId);
  return client;
};

/**
 * Exported as an object so tests can replace `verify` without calling Google.
 */
export const googleVerifier = {
  /**
   * Verifies a Google ID token (signature, expiry, issuer and audience)
   * using Google's official library and returns the trusted profile.
   */
  async verify(idToken) {
    if (!idToken || typeof idToken !== 'string') throw ApiError.badRequest('Google credential is required.');

    let payload;
    try {
      const ticket = await getClient().verifyIdToken({ idToken, audience: env.googleClientId });
      payload = ticket.getPayload();
    } catch {
      throw ApiError.unauthorized('Google sign-in could not be verified. Please try again.');
    }

    if (!payload?.sub || !payload.email) throw ApiError.unauthorized('Google account information is incomplete.');
    if (!payload.email_verified) throw ApiError.unauthorized('Your Google email address is not verified.');

    return {
      googleId: payload.sub,
      email: payload.email.toLowerCase(),
      name: payload.name || payload.email.split('@')[0],
      picture: payload.picture || '',
    };
  },
};
