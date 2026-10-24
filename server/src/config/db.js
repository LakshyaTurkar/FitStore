import mongoose from 'mongoose';
import env from './env.js';

let transactionsSupported = false;

export async function connectDB(uri = env.mongoUri) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);

  // Transactions need a replica set (MongoDB Atlas always is one).
  // A local standalone mongod is not, so we detect it and fall back.
  try {
    const hello = await mongoose.connection.db.admin().command({ hello: 1 });
    transactionsSupported = Boolean(hello.setName) || hello.msg === 'isdbgrid';
  } catch {
    transactionsSupported = false;
  }

  console.log(`[db] Connected to MongoDB (${mongoose.connection.name}). Transactions ${transactionsSupported ? 'enabled' : 'not supported - using safe conditional updates'}.`);
}

export function supportsTransactions() {
  return transactionsSupported;
}

/**
 * Runs `work(session)` inside a MongoDB transaction when available.
 * Without transaction support `work(null)` runs directly - the callers are
 * written so that every step is a conditional (atomic) update.
 */
export async function runInTransaction(work) {
  if (!transactionsSupported) return work(null);

  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
