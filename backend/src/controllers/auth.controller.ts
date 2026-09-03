import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ApplicantType } from '../types/index.js';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { firstName, lastName, email, password, applicantType, universityId, phone } = req.body;

      if (!firstName || !lastName || !email || !password) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'First name, last name, email, and password are required.' },
        });
        return;
      }

      const result = await AuthService.registerUser({
        firstName,
        lastName,
        email,
        password,
        applicantType: applicantType || ApplicantType.UNIVERSITY,
        universityId: applicantType === ApplicantType.INDEPENDENT ? null : universityId,
        phone,
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Email and password are required.' },
        });
        return;
      }

      const result = await AuthService.loginUser(email, password);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async me(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Not logged in' } });
        return;
      }

      const user = await AuthService.getMe(req.user.userId);
      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(_req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      data: { message: 'Successfully logged out' },
    });
  }
}
