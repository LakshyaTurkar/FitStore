import dotenv from 'dotenv';

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5050,
  clientUrl: (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, ''),
  mongoUri: process.env.MONGODB_URI,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  resendApiKey: process.env.RESEND_API_KEY,
  resendFromEmail: process.env.RESEND_FROM_EMAIL,
  razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,
  shippingCharge: Number(process.env.SHIPPING_CHARGE ?? 99),
  freeShippingThreshold: Number(process.env.FREE_SHIPPING_THRESHOLD ?? 999),
};

env.isProduction = env.nodeEnv === 'production';
env.isTest = env.nodeEnv === 'test';

// Number of reverse proxies in front of Express (Render's load balancer = 1).
// Lets req.ip be the real visitor IP so rate limiting works per visitor.
env.trustProxy = Number(process.env.TRUST_PROXY) || 0;

// SameSite policy of the session cookie.
// Locally (localhost:5173 -> localhost:5050) client and API are the same "site", so "lax" works.
// In production the client (vercel.app) and API (onrender.com) are different sites, so the
// cookie must be "none" (+ Secure). Override with COOKIE_SAMESITE=lax|strict|none if needed.
const sameSite = String(process.env.COOKIE_SAMESITE || '').toLowerCase();
env.cookieSameSite = ['lax', 'strict', 'none'].includes(sameSite) ? sameSite : env.isProduction ? 'none' : 'lax';

/**
 * Called once when the server starts. Fails fast with a readable message
 * instead of crashing later with a confusing error.
 */
export function validateEnv() {
  const required = {
    MONGODB_URI: env.mongoUri,
    GOOGLE_CLIENT_ID: env.googleClientId,
    JWT_SECRET: env.jwtSecret,
    RAZORPAY_KEY_ID: env.razorpayKeyId,
    RAZORPAY_KEY_SECRET: env.razorpayKeySecret,
  };
  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}. Copy server/.env.example to server/.env and fill them in.`);
  }
  if (env.jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long.');
  }
  if (!env.razorpayKeyId.startsWith('rzp_test_')) {
    throw new Error('FitStore is a demo project: RAZORPAY_KEY_ID must be a TEST key (starts with "rzp_test_").');
  }
  if (!env.resendApiKey || !env.resendFromEmail) {
    console.warn('[config] RESEND_API_KEY / RESEND_FROM_EMAIL not set - emails will be skipped (logged only).');
  }
}

export default env;
