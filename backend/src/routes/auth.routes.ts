import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/auth.controller.js';
import { HealthController } from '../controllers/health.controller.js';
import { authenticate } from '../middleware/auth.js';

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  validate: { xForwardedForHeader: false },
  message: { success: false, error: { code: 'TOO_MANY_LOGIN_ATTEMPTS', message: 'Too many login attempts. Please try again later.' } },
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { success: false, error: { code: 'TOO_MANY_REGISTRATION_ATTEMPTS', message: 'Too many registration attempts. Please try again later.' } },
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { success: false, error: { code: 'TOO_MANY_PASSWORD_RESET_ATTEMPTS', message: 'Too many password reset attempts. Please try again later.' } },
});

authRouter.post('/register', registerLimiter, AuthController.register);
authRouter.post('/login', loginLimiter, AuthController.login);
authRouter.post('/forgot-password', passwordResetLimiter, AuthController.forgotPassword);
authRouter.post('/reset-password', passwordResetLimiter, AuthController.resetPassword);
authRouter.post('/logout', AuthController.logout);
authRouter.get('/me', authenticate, AuthController.me);

export const healthRouter = Router();
healthRouter.get('/health', HealthController.getHealth);
healthRouter.get('/ready', HealthController.getReady);
