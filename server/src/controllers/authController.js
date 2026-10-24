import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { googleVerifier } from '../services/googleAuthService.js';
import { sendWelcomeEmail } from '../services/emailService.js';
import { clearAuthCookie, setAuthCookie, signToken } from '../utils/token.js';

/**
 * POST /auth/google
 * Body: { credential } - the Google ID token from Google Identity Services.
 * Everything we store comes from the VERIFIED token, never from the request body.
 */
export const googleSignIn = asyncHandler(async (req, res) => {
  const profile = await googleVerifier.verify(req.body?.credential);

  let user = await User.findOne({ googleId: profile.googleId });
  let isNewUser = false;

  if (!user) {
    // Same verified email but no googleId match (e.g. account re-created) - link it.
    user = await User.findOne({ email: profile.email });
    if (user) {
      user.googleId = profile.googleId;
    } else {
      user = new User({ googleId: profile.googleId, email: profile.email, name: profile.name, picture: profile.picture });
      isNewUser = true;
    }
  }

  user.name = profile.name;
  user.picture = profile.picture;
  user.email = profile.email;
  user.lastLoginAt = new Date();
  await user.save();

  if (isNewUser) {
    // Idempotent and non-blocking: returning users never get another welcome email.
    sendWelcomeEmail(user).catch(() => {});
  }

  setAuthCookie(res, signToken(user._id));
  res.status(isNewUser ? 201 : 200).json({ success: true, data: { user: user.toPublicJSON(), isNewUser } });
});

/** GET /auth/me */
export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user.toPublicJSON() } });
});

/** POST /auth/logout */
export const logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, message: 'Signed out.' });
});
