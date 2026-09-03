import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Student } from '../models/Student.js';
import { ApplicantType, UserRole } from '../types/index.js';
import { env } from '../config/env.js';

export class AuthService {
  static async registerUser(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    applicantType: ApplicantType;
    universityId?: string | null;
    phone?: string;
  }) {
    const existingUser = await User.findOne({ email: data.email.toLowerCase() });
    if (existingUser) {
      const err: any = new Error('An account with this email address already exists.');
      err.statusCode = 409;
      err.code = 'EMAIL_EXISTS';
      throw err;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const isIndependent = data.applicantType === ApplicantType.INDEPENDENT;
    const finalUniversityId = isIndependent ? null : (data.universityId || null);
    const role = isIndependent ? UserRole.INDEPENDENT_APPLICANT : UserRole.STUDENT;

    const user = new User({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase(),
      passwordHash,
      phone: data.phone,
      roles: [role],
      universityId: finalUniversityId,
      status: 'ACTIVE',
    });

    await user.save();

    // Create associated Student profile
    const student = new Student({
      userId: user._id,
      universityId: finalUniversityId,
      applicantType: data.applicantType,
      phone: data.phone,
      status: 'ACTIVE',
    });

    await student.save();

    // Link studentId back to User
    user.studentId = student._id as any;
    await user.save();

    const token = this.generateToken(user, student._id.toString());

    return {
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        roles: user.roles,
        applicantType: data.applicantType,
        universityId: finalUniversityId,
        studentId: student._id,
      },
    };
  }

  static async loginUser(email: string, password: string) {
    const cleanEmail = email.toLowerCase().trim();
    try {
      const user = await User.findOne({ email: cleanEmail });
      if (!user || !(await user.comparePassword(password))) {
        const err: any = new Error('Invalid email or password.');
        err.statusCode = 401;
        err.code = 'INVALID_CREDENTIALS';
        throw err;
      }

      if (user.status !== 'ACTIVE') {
        const err: any = new Error('This account is not active. Please contact support.');
        err.statusCode = 403;
        err.code = 'ACCOUNT_INACTIVE';
        throw err;
      }

      user.lastLoginAt = new Date();
      await user.save();

      const token = this.generateToken(user, user.studentId ? user.studentId.toString() : null);
      return {
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          roles: user.roles,
          universityId: user.universityId,
          organizationId: user.organizationId,
          studentId: user.studentId,
        },
      };
    } catch (error: any) {
      if (error?.statusCode === 401 || error?.statusCode === 403) throw error;
      const err: any = new Error('Authentication service is unavailable because the database cannot be reached.');
      err.statusCode = 503;
      err.code = 'DATABASE_UNAVAILABLE';
      throw err;
    }
  }

  static generateToken(user: any, studentId?: string | null): string {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      roles: user.roles,
      universityId: user.universityId ? user.universityId.toString() : null,
      organizationId: user.organizationId ? user.organizationId.toString() : null,
      studentId: studentId || (user.studentId ? user.studentId.toString() : null),
    };

    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
  }

  static async getMe(userId: string) {
    const user = await User.findById(userId).populate('universityId').populate('organizationId').populate('studentId');
    if (!user) {
      const err: any = new Error('User profile not found');
      err.statusCode = 404;
      throw err;
    }
    return user;
  }
}
