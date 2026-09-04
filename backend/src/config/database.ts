import mongoose from 'mongoose';
import { env } from './env.js';

let isConnected = false;

export async function connectDatabase(): Promise<boolean> {
  if (isConnected || mongoose.connection.readyState === 1) {
    isConnected = true;
    return true;
  }

  const uri = process.env.MONGODB_URI || env.MONGODB_URI;

  try {
    console.log('[MongoDB] Connecting to database...');
    mongoose.set('strictQuery', true);
    mongoose.set('bufferCommands', false);

    if (!uri) {
      console.warn('[MongoDB] No MONGODB_URI provided. Running with in-memory fallbacks.');
      return false;
    }

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000,
    });

    isConnected = true;
    console.log('[MongoDB] Connected successfully!');
    return true;
  } catch (error) {
    console.warn(`[MongoDB] Database connection unavailable (${(error as Error).message}). Using fallback mode.`);
    isConnected = false;
    return false;
  }
}

export function isDatabaseConnected(): boolean {
  return isConnected || mongoose.connection.readyState === 1;
}

export async function closeDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('[MongoDB] Gracefully disconnected.');
  }
}

// Handle process termination signals
process.on('SIGINT', async () => {
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDatabase();
  process.exit(0);
});
