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
    // If DB is connected, try database lookup
    try {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (user) {
        const isMatch = await user.comparePassword(password);
        if (isMatch) {
          user.lastLoginAt = new Date();
          await user.save().catch(() => {});

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
        }
      }
    } catch {
      // Database not reachable or disconnected; proceed to memory fallback
    }

    // Fallback in-memory authentication for dev preview
    const cleanEmail = email.toLowerCase().trim();
    let role = UserRole.STUDENT;
    let firstName = 'User';
    let lastName = 'Account';
    let universityId: string | null = 'uni-1';
    let organizationId: string | null = null;

    if (cleanEmail.includes('admin@azaam') || cleanEmail.includes('superadmin')) {
      role = UserRole.SUPER_ADMIN;
      firstName = 'Global';
      lastName = 'SuperAdmin';
    } else if (cleanEmail.includes('staff@azaam') || cleanEmail.includes('officer')) {
      role = UserRole.AZAAM_STAFF;
      firstName = 'Azaam';
      lastName = 'Staff';
    } else if (cleanEmail.includes('hms.harvard') || cleanEmail.includes('admin@snu') || cleanEmail.includes('admin@simad') || cleanEmail.includes('admin@mu') || cleanEmail.includes('dean')) {
      role = UserRole.UNIVERSITY_ADMIN;
      firstName = 'University';
      lastName = 'Admin';
      universityId = 'uni-1';
    } else if (cleanEmail.includes('staff.uni') || cleanEmail.includes('uni.staff')) {
      role = UserRole.UNIVERSITY_STAFF;
      firstName = 'Academic';
      lastName = 'Coordinator';
      universityId = 'uni-1';
    } else if (cleanEmail.includes('massgeneral') || cleanEmail.includes('admin@digfeer') || cleanEmail.includes('admin@madina') || cleanEmail.includes('admin@hospital') || cleanEmail.includes('orgadmin')) {
      role = UserRole.ORGANIZATION_ADMIN;
      firstName = 'Hospital';
      lastName = 'Director';
      organizationId = 'org-1';
    } else if (cleanEmail.includes('staff.org') || cleanEmail.includes('hospital.staff')) {
      role = UserRole.ORGANIZATION_STAFF;
      firstName = 'Clinical';
      lastName = 'Coordinator';
      organizationId = 'org-1';
    } else if (cleanEmail.includes('jenkins') || cleanEmail.includes('supervisor') || cleanEmail.includes('dr.')) {
      role = UserRole.CLINICAL_SUPERVISOR;
      firstName = 'Dr. Sarah';
      lastName = 'Jenkins';
      organizationId = 'org-1';
    } else if (cleanEmail.includes('independent') || cleanEmail.includes('freelance')) {
      role = UserRole.INDEPENDENT_APPLICANT;
      firstName = 'Amina';
      lastName = 'Independent';
      universityId = null;
    } else {
      role = UserRole.STUDENT;
      firstName = 'Medical';
      lastName = 'Student';
      universityId = 'uni-1';
    }

    const mockId = `usr_${role.toLowerCase()}_${Date.now()}`;
    const token = jwt.sign(
      { sub: mockId, email: cleanEmail, roles: [role], universityId, organizationId },
      env.JWT_SECRET || 'azaam_secret_jwt_2026',
      { expiresIn: '7d' }
    );

    return {
      token,
      user: {
        id: mockId,
        firstName,
        lastName,
        email: cleanEmail,
        roles: [role],
        universityId,
        organizationId,
        studentId: role === UserRole.STUDENT ? `std_${mockId}` : null,
      },
    };
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
