import mongoose from 'mongoose';
import { env } from './env.js';

let isConnected = false;

export async function connectDatabase(): Promise<boolean> {
  if (isConnected || mongoose.connection.readyState === 1) {
    isConnected = true;
    return true;
  }

  const uri = process.env.MONGODB_URI || env.MONGODB_URI;
  if (!uri || uri.includes('127.0.0.1') || uri.includes('localhost')) {
    console.info('[MongoDB] Operating in local memory/fallback mode for development preview.');
    return false;
  }

  try {
    console.log('[MongoDB] Connecting to database...');
    mongoose.set('strictQuery', true);
    mongoose.set('bufferCommands', false);

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 4000,
    });

    isConnected = true;
    console.log('[MongoDB] Connected successfully!');
    return true;
  } catch (error) {
    console.warn(`[MongoDB] Database connection notice: ${(error as Error).message}`);
    console.info('[MongoDB] Operating in development mock fallback mode.');
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
