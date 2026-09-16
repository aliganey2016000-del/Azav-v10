import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';

async function start() {
  const app = createApp();
  const PORT = env.PORT;

  const connected = await connectDatabase();
  if (!connected && env.NODE_ENV === 'production') {
    throw new Error('Production startup aborted because MongoDB is unavailable.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AZAAM Server] Running on http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error('[AZAAM Server Startup Error]:', err);
  process.exitCode = 1;
});
