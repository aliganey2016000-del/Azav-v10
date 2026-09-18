import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { Student, IStudent } from '../models/Student.js';
import { Application, IApplication } from '../models/Application.js';
import { University } from '../models/University.js';
import { DocumentModel } from '../models/Document.js';
import { ApplicantType, ApplicationStatus, AuthUser, UserRole } from '../types/index.js';

export interface NominateStudentInput {
  fullName: string;
  studentNumber: string;
  email: string;
  phone?: string;
  program?: string;
  specialty?: string;
  academicLevel?: string;
  preferredStartDate?: string;
  preferredEndDate?: string;
  durationWeeks?: number;
}

const splitName = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0] || 'Student';
  const lastName = parts.slice(1).join(' ') || 'Candidate';
  return { firstName, lastName };
};

const resolveUniversityId = (actor: AuthUser, bodyUniversityId?: string): string => {
  const isUniversityUser = actor.roles.includes(UserRole.UNIVERSITY_ADMIN) || actor.roles.includes(UserRole.UNIVERSITY_STAFF);
  if (isUniversityUser) {
    if (!actor.universityId) {
      const err: any = new Error('Your account is not linked to a university.');
      err.statusCode = 403;
      throw err;
    }
    return actor.universityId;
  }
  if (!bodyUniversityId) {
    const err: any = new Error('universityId is required when nominating as AZAAM staff.');
    err.statusCode = 400;
    throw err;
  }
  return bodyUniversityId;
};

const toAdminStudentShape = async (student: IStudent, application: IApplication | null) => {
  const user: any = await User.findById(student.userId).select('firstName lastName email phone');
  const university: any = student.universityId ? await University.findById(student.universityId).select('name code') : null;
  const documentsCount = await DocumentModel.countDocuments({ studentId: student._id });

  const applicationStatus = application?.status || ApplicationStatus.SUBMITTED;
  const statusMap: Record<string, 'ACTIVE' | 'PENDING' | 'COMPLETED' | 'INACTIVE'> = {
    [ApplicationStatus.DRAFT]: 'PENDING',
    [ApplicationStatus.SUBMITTED]: 'PENDING',
    [ApplicationStatus.UNDER_REVIEW]: 'PENDING',
    [ApplicationStatus.DOCUMENTS_REQUIRED]: 'PENDING',
    [ApplicationStatus.APPROVED]: 'ACTIVE',
    [ApplicationStatus.REJECTED]: 'INACTIVE',
    [ApplicationStatus.PLACEMENT_PENDING]: 'ACTIVE',
    [ApplicationStatus.PLACED]: 'ACTIVE',
    [ApplicationStatus.SUPERVISOR_ASSIGNED]: 'ACTIVE',
    [ApplicationStatus.ACTIVE]: 'ACTIVE',
    [ApplicationStatus.COMPLETED]: 'COMPLETED',
    [ApplicationStatus.CERTIFICATE_ISSUED]: 'COMPLETED',
  };

  return {
    _id: student._id.toString(),
    studentNumber: student.studentNumber || '',
    firstName: user?.firstName || 'Student',
    lastName: user?.lastName || 'Candidate',
    email: user?.email || '',
    phone: user?.phone || student.phone || '',
    university: university ? { _id: university._id.toString(), name: university.name, code: university.code } : { _id: '', name: 'University' },
    studyYear: application?.programmeText || '',
    specialty: application?.specialtyText || '',
    status: statusMap[applicationStatus] || 'PENDING',
    applicationStatus: applicationStatus === ApplicationStatus.APPROVED ? 'ACCEPTED' : applicationStatus === ApplicationStatus.REJECTED ? 'REJECTED' : applicationStatus === ApplicationStatus.UNDER_REVIEW ? 'UNDER_REVIEW' : 'SUBMITTED',
    nominationDate: (application as any)?.createdAt || student.createdAt,
    documentsCount,
    documentsVerified: documentsCount > 0,
    paymentStatus: 'PENDING',
    totalFees: 0,
    paidFees: 0,
    visaStatus: 'NOT_REQUIRED',
    residenceStatus: 'NOT_REQUIRED',
    hospitalPlacement: { name: 'Pending AZAAM placement' },
    rotationSchedule: '',
    startDate: application?.preferredStartDate ? new Date(application.preferredStartDate).toISOString() : '',
    endDate: application?.preferredEndDate ? new Date(application.preferredEndDate).toISOString() : '',
    durationWeeks: application?.durationWeeks || 0,
    attendancePercent: 0,
    attendanceDays: { attended: 0, total: 0 },
    logbookSigned: 0,
    logbookRequired: 0,
    evaluationScore: null,
    evaluationGrade: null,
    evaluationStatus: 'PENDING',
    completionStatus: 'IN_PROGRESS',
    certificateIssued: false,
    createdAt: student.createdAt,
    updatedAt: student.updatedAt,
  };
};

export class StudentAdminService {
  static async nominateStudent(input: NominateStudentInput, actor: AuthUser, universityIdOverride?: string) {
    if (!input.fullName?.trim() || !input.studentNumber?.trim() || !input.email?.trim()) {
      const err: any = new Error('Full name, student ID and email are required.');
      err.statusCode = 400;
      throw err;
    }

    const universityId = resolveUniversityId(actor, universityIdOverride);
    const email = input.email.trim().toLowerCase();
    const { firstName, lastName } = splitName(input.fullName);

    let user: any = await User.findOne({ email });
    let student: any = null;

    if (user) {
      const isStudentUser = user.roles?.includes(UserRole.STUDENT);
      const sameUniversity = user.universityId?.toString() === universityId.toString();

      if (!isStudentUser || !sameUniversity) {
        const err: any = new Error('This email is already registered to a different account or institution.');
        err.statusCode = 409;
        err.code = 'EMAIL_EXISTS';
        throw err;
      }

      // Reuse the existing university student account instead of creating a duplicate.
      user.firstName = firstName;
      user.lastName = lastName;
      if (input.phone !== undefined) user.phone = input.phone;
      await user.save();

      student = await Student.findOne({ userId: user._id });
      if (!student) {
        student = new Student({
          userId: user._id,
          universityId,
          studentNumber: input.studentNumber.trim(),
          phone: input.phone,
          applicantType: ApplicantType.UNIVERSITY,
          status: 'ACTIVE',
        });
        await student.save();
      } else {
        student.universityId = universityId as any;
        student.studentNumber = input.studentNumber.trim();
        if (input.phone !== undefined) student.phone = input.phone;
        student.applicantType = ApplicantType.UNIVERSITY;
        student.status = 'ACTIVE';
        await student.save();
      }

      user.studentId = student._id as any;
      await user.save();
    } else {
      const tempPassword = crypto.randomBytes(12).toString('hex');
      const passwordHash = await bcrypt.hash(tempPassword, await bcrypt.genSalt(10));

      user = new User({
        firstName,
        lastName,
        email,
        phone: input.phone,
        passwordHash,
        roles: [UserRole.STUDENT],
        universityId,
        status: 'ACTIVE',
      });
      await user.save();

      student = new Student({
        userId: user._id,
        universityId,
        studentNumber: input.studentNumber.trim(),
        phone: input.phone,
        applicantType: ApplicantType.UNIVERSITY,
        status: 'ACTIVE',
      });
      await student.save();

      user.studentId = student._id as any;
      await user.save();
    }

    let application = await Application.findOne({ studentId: student._id }).sort({ createdAt: -1 });

    if (application) {
      // Idempotent retry / nomination of an existing student user.
      application.universityId = universityId as any;
      application.applicantType = ApplicantType.UNIVERSITY;
      application.programmeText = input.academicLevel || input.program;
      application.specialtyText = input.specialty || input.program;
      application.durationWeeks = input.durationWeeks;

      if ([ApplicationStatus.DRAFT, ApplicationStatus.SUBMITTED, ApplicationStatus.DOCUMENTS_REQUIRED].includes(application.status)) {
        application.status = ApplicationStatus.SUBMITTED;
        application.submissionDate = new Date();
      }

      await application.save();
    } else {
      application = new Application({
        studentId: student._id,
        universityId,
        applicantType: ApplicantType.UNIVERSITY,
        programmeText: input.academicLevel || input.program,
        specialtyText: input.specialty || input.program,
        durationWeeks: input.durationWeeks,
        status: ApplicationStatus.SUBMITTED,
        submissionDate: new Date(),
      });
      await application.save();
    }

    return toAdminStudentShape(student, application);
  }

  static async updateNomination(studentId: string, input: Partial<NominateStudentInput>, actor: AuthUser) {
    const student = await Student.findById(studentId);
    if (!student) {
      const err: any = new Error('Student not found');
      err.statusCode = 404;
      throw err;
    }
    this.assertTenantAccess(student, actor);

    const user = await User.findById(student.userId);
    if (user) {
      if (input.fullName?.trim()) {
        const { firstName, lastName } = splitName(input.fullName);
        user.firstName = firstName;
        user.lastName = lastName;
      }
      if (input.email?.trim()) user.email = input.email.trim().toLowerCase();
      if (input.phone !== undefined) user.phone = input.phone;
      await user.save();
    }

    if (input.studentNumber?.trim()) student.studentNumber = input.studentNumber.trim();
    if (input.phone !== undefined) student.phone = input.phone;
    await student.save();

    const application = await Application.findOne({ studentId: student._id }).sort({ createdAt: -1 });
    if (application) {
      if (input.program !== undefined) application.programmeText = input.academicLevel || input.program;
      if (input.specialty !== undefined || input.program !== undefined) application.specialtyText = input.specialty || input.program;
      if (input.durationWeeks !== undefined) application.durationWeeks = input.durationWeeks;
      if (input.preferredStartDate !== undefined) application.preferredStartDate = input.preferredStartDate ? new Date(input.preferredStartDate) : undefined;
      if (input.preferredEndDate !== undefined) application.preferredEndDate = input.preferredEndDate ? new Date(input.preferredEndDate) : undefined;
      await application.save();
    }

    return toAdminStudentShape(student, application);
  }

  static async getStudentById(studentId: string, actor: AuthUser) {
    const student = await Student.findById(studentId);
    if (!student) {
      const err: any = new Error('Student not found');
      err.statusCode = 404;
      throw err;
    }
    this.assertTenantAccess(student, actor);
    const application = await Application.findOne({ studentId: student._id }).sort({ createdAt: -1 });
    return toAdminStudentShape(student, application);
  }

  static async listStudents(query: { page?: number; limit?: number; search?: string; universityId?: string }, actor: AuthUser) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: any = {};
    const isUniversityUser = actor.roles.includes(UserRole.UNIVERSITY_ADMIN) || actor.roles.includes(UserRole.UNIVERSITY_STAFF);
    if (isUniversityUser) {
      if (!actor.universityId) return { students: [], pagination: { page, limit, total: 0, totalPages: 1 } };
      filter.universityId = actor.universityId;
    } else if (query.universityId) {
      filter.universityId = query.universityId;
    }

    if (query.search) {
      const regex = new RegExp(query.search.trim(), 'i');
      filter.studentNumber = regex;
    }

    const [students, total] = await Promise.all([
      Student.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Student.countDocuments(filter),
    ]);

    const shaped = await Promise.all(
      students.map(async (s) => {
        const application = await Application.findOne({ studentId: s._id }).sort({ createdAt: -1 });
        return toAdminStudentShape(s, application);
      })
    );

    return { students: shaped, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
  }

  private static assertTenantAccess(student: IStudent, actor: AuthUser) {
    if (actor.roles.includes(UserRole.SUPER_ADMIN) || actor.roles.includes(UserRole.AZAAM_STAFF)) return;
    const isUniversityUser = actor.roles.includes(UserRole.UNIVERSITY_ADMIN) || actor.roles.includes(UserRole.UNIVERSITY_STAFF);
    if (isUniversityUser && actor.universityId && student.universityId?.toString() === actor.universityId.toString()) return;
    const err: any = new Error('You are not authorized to access this student.');
    err.statusCode = 403;
    throw err;
  }
}
