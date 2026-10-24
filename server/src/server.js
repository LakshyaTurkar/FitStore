import app from './app.js';
import env, { validateEnv } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';

async function start() {
  try {
    validateEnv();
    await connectDB();
    const server = app.listen(env.port, () => {
      console.log(`[server] FitStore API running on http://localhost:${env.port} (${env.nodeEnv})`);
    });

    const shutdown = (signal) => {
      console.log(`[server] ${signal} received, shutting down...`);
      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    console.error(`[server] Failed to start: ${err.message}`);
    process.exit(1);
  }
}

start();
