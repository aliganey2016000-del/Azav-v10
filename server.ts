import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createApp } from './backend/src/app.js';
import { connectDatabase } from './backend/src/config/database.js';

async function startServer() {
  const app = createApp();
  // PORT 3000 is required by AI Studio environment
  const PORT = 3000;

  // Graceful database connection (fallback active when offline)
  try {
    await connectDatabase();
  } catch (err) {
    console.warn('[MongoDB] Database offline. App will use fallback mode.');
  }

  // Vite middleware in development; static dist serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
      root: path.resolve(process.cwd(), 'frontend'),
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'frontend', 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AZAAM Platform] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[AZAAM Platform Startup Error]:', err);
  process.exit(1);
});
