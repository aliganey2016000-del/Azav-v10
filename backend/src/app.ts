import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { healthRouter, authRouter } from './routes/auth.routes.js';
import { applicationRouter } from './routes/application.routes.js';
import { documentRouter } from './routes/document.routes.js';
import {
  placementRouter,
  attendanceRouter,
  logbookRouter,
  evaluationRouter,
  certificateRouter,
  universityRouter,
  organizationRouter,
} from './routes/placement.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { financeRouter } from './routes/finance.routes.js';
import { notificationRouter } from './routes/notification.routes.js';
import { rotationRouter } from './routes/rotation.routes.js';
import { landingPageRouter } from './routes/landingPage.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { isDatabaseConnected } from './config/database.js';
import { env } from './config/env.js';

export function createApp() {
  const app = express();

  // Trust reverse proxy (Cloud Run / Nginx / Vite proxy)
  app.set('trust proxy', 1);

  // Security Middleware
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN,
    credentials: true,
  }));
  // Nomination documents are uploaded as base64 JSON. A 5MB file expands to ~6.7MB in base64,
  // so the parser limit must safely exceed the validated file-size limit.
  app.use(express.json({ limit: '12mb' }));
  app.use(express.urlencoded({ extended: true, limit: '12mb' }));

  // Global Rate Limiter
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
    message: {
      success: false,
      error: { code: 'TOO_MANY_REQUESTS', message: 'Rate limit exceeded. Please try again later.' },
    },
  });

  app.use('/api/', apiLimiter);

  // Health check routes
  app.use('/', healthRouter);
  app.use('/api', healthRouter);

  // API v1 Routes
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/landing-page', landingPageRouter);
  app.use('/api/v1/applications', applicationRouter);
  app.use('/api/v1/documents', documentRouter);
  app.use('/api/v1/placements', placementRouter);
  app.use('/api/v1/rotations', rotationRouter);
  app.use('/api/v1/attendance', attendanceRouter);
  app.use('/api/v1/logbooks', logbookRouter);
  app.use('/api/v1/evaluations', evaluationRouter);
  app.use('/api/v1/certificates', certificateRouter);
  app.use('/api/v1/universities', universityRouter);
  app.use('/api/v1/organizations', organizationRouter);
  app.use('/api/v1/admin', adminRouter);
  app.use('/api/v1/finance', financeRouter);
  app.use('/api/v1/notifications', notificationRouter);

  // 404 API Route handler
  app.use('/api/*', (_req, res) => {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'API Endpoint not found' },
    });
  });

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
}
