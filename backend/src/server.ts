import express from 'express';
import path from 'path';
import fs from 'fs';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';

async function start() {
  const app = createApp();
  const PORT = 3000;

  // Mount Vite development middleware in development mode
  if (process.env.NODE_ENV !== 'production') {
    console.log('[AZAAM Server] Mounting Vite development middleware');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Bind and listen immediately on port 3000
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AZAAM Server] Running on http://0.0.0.0:${PORT}`);
  });

  // Attempt database connection in background without blocking server startup
  connectDatabase().catch(err => {
    console.warn('[MongoDB] Connection notice:', (err as Error)?.message || err);
  });
}

start().catch(err => {
  console.error('[AZAAM Server Startup Error]:', err);
});
