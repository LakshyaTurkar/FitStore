// Imported FIRST by every test file so config/env.js sees these values.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-that-is-definitely-longer-than-32-chars';
process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.RAZORPAY_KEY_ID = 'rzp_test_dummykey';
process.env.RAZORPAY_KEY_SECRET = 'test_razorpay_secret';
process.env.SHIPPING_CHARGE = '99';
process.env.FREE_SHIPPING_THRESHOLD = '999';
// Emails are not sent in tests (Resend not configured -> logged as "skipped").
process.env.RESEND_API_KEY = '';
process.env.RESEND_FROM_EMAIL = '';
