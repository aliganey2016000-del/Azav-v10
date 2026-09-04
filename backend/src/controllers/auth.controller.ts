import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ApplicantType } from '../types/index.js';

const registerSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
  applicantType: z.nativeEnum(ApplicantType).optional(),
  universityId: z.string().trim().min(1).max(100).nullable().optional(),
  phone: z.string().trim().max(30).optional(),
}).strict();

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
}).strict();

const forgotPasswordSchema = z.object({
  email: z.string().trim().email().max(254),
}).strict();

const resetPasswordSchema = z.object({
  token: z.string().trim().min(32).max(128),
  password: z.string().min(8).max(128),
}).strict();

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Please provide valid registration details.' } });
        return;
      }
      const { firstName, lastName, email, password, applicantType, universityId, phone } = parsed.data;
      const resolvedApplicantType = applicantType || ApplicantType.UNIVERSITY;
      const result = await AuthService.registerUser({ firstName, lastName, email, password, applicantType: resolvedApplicantType, universityId: resolvedApplicantType === ApplicantType.INDEPENDENT ? null : universityId, phone });
      res.status(201).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Please provide a valid email and password.' } });
        return;
      }
      const result = await AuthService.loginUser(parsed.data.email, parsed.data.password);
      res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = forgotPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Please provide a valid email address.' } });
        return;
      }
      const result = await AuthService.requestPasswordReset(parsed.data.email);
      res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = resetPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Please provide a valid reset token and password.' } });
        return;
      }
      const result = await AuthService.resetPassword(parsed.data.token, parsed.data.password);
      res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  static async me(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Not logged in' } });
        return;
      }
      const user = await AuthService.getMe(req.user.userId);
      res.status(200).json({ success: true, data: { user } });
    } catch (error) { next(error); }
  }

  static async logout(_req: Request, res: Response): Promise<void> {
    res.status(200).json({ success: true, data: { message: 'Successfully logged out' } });
  }
}
