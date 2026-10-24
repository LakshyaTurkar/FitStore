/**
 * Promotes (or demotes) a trusted account to admin. Run locally only:
 *   npm run promote-admin -- you@gmail.com
 *   npm run promote-admin -- you@gmail.com --demote
 * The user must have signed in with Google at least once.
 * There is intentionally NO API endpoint for this.
 */
import mongoose from 'mongoose';
import env from '../src/config/env.js';
import { connectDB } from '../src/config/db.js';
import User from '../src/models/User.js';

async function main() {
  const email = (process.argv[2] || '').trim().toLowerCase();
  const demote = process.argv.includes('--demote');

  if (!email || !email.includes('@')) {
    console.error('Usage: npm run promote-admin -- <email> [--demote]');
    process.exitCode = 1;
    return;
  }
  if (!env.mongoUri) throw new Error('MONGODB_URI is not set in server/.env');

  await connectDB();
  const user = await User.findOne({ email });
  if (!user) {
    console.error(`No user found with email ${email}. Sign in once with Google first.`);
    process.exitCode = 1;
    return;
  }
  if (user.isDemoAccount) {
    console.error('Demo accounts cannot be promoted.');
    process.exitCode = 1;
    return;
  }

  user.role = demote ? 'user' : 'admin';
  await user.save();
  console.log(`${user.name} <${user.email}> is now "${user.role}". Sign out and in again (or refresh) to see the change.`);
}

main()
  .catch((err) => {
    console.error('Failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
