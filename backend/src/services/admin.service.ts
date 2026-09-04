import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User, IUser } from '../models/User.js';
import { University, IUniversity } from '../models/University.js';
import { Organization, IOrganization } from '../models/Organization.js';
import { ClinicalSupervisor } from '../models/ClinicalSupervisor.js';
import { Application } from '../models/Application.js';
import { Placement } from '../models/Placement.js';
import { Certificate } from '../models/Certificate.js';
import { Student } from '../models/Student.js';
import { AuditLog } from '../models/AuditLog.js';
import { AuditService } from './audit.service.js';
import { UserRole, AuthUser, PlacementStatus } from '../types/index.js';
import { isDatabaseConnected } from '../config/database.js';
import {
  memoryUsers,
  memoryUniversities,
  memoryOrganizations,
  memorySupervisors,
  memoryAuditLogs,
  MemoryUniversity,
  MemoryOrganization,
} from './memoryStore.js';

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  type?: string;
  universityId?: string;
  organizationId?: string;
}

export class AdminService {
  // ==========================================
  // DASHBOARD METRICS & RECENT ACTIVITIES
  // ==========================================
  static async getDashboard(currentUser: AuthUser) {
    if (!isDatabaseConnected()) {
      return {
        stats: {
          students: memoryUsers.filter(
            (u) => u.roles.includes(UserRole.STUDENT) || u.roles.includes(UserRole.INDEPENDENT_APPLICANT)
          ).length,
          applications: 14,
          placements: 8,
          universities: memoryUniversities.length,
          organizations: memoryOrganizations.length,
          supervisors: memorySupervisors.length,
          attachments: 8,
          certificates: 5,
        },
        recentApplications: [
          {
            _id: 'app-seed-01',
            applicationNumber: 'APP-2025-0012',
            studentId: { firstName: 'John', lastName: 'Kiprotich', email: 'student.harvard@azaammedics.org' },
            universityId: { name: 'Harvard Medical School', code: 'HMS-001' },
            desiredOrganizationId: { name: 'Massachusetts General Hospital', type: 'Tertiary Academic Medical Center' },
            status: 'UNDER_REVIEW',
            createdAt: new Date().toISOString(),
          },
        ],
        recentUsers: memoryUsers.slice(0, 5),
        recentActivity: memoryAuditLogs.slice(0, 5),
        organizationCapacity: memoryOrganizations.map((org) => ({
          _id: org._id,
          name: org.name,
          type: org.type,
          capacity: org.capacity,
          occupied: org.occupiedSlots || 0,
          available: org.availableSlots || org.capacity,
          utilization: org.utilizationPercentage || 0,
          status: org.status,
        })),
      };
    }

    const userFilter: any = {};
    const appFilter: any = {};
    const placementFilter: any = {};
    const uniFilter: any = {};
    const orgFilter: any = {};
    const supFilter: any = {};

    // Tenant isolation filtering
    if (currentUser.roles.includes(UserRole.UNIVERSITY_ADMIN) || currentUser.roles.includes(UserRole.UNIVERSITY_STAFF)) {
      if (currentUser.universityId) {
        const uniId = new mongoose.Types.ObjectId(currentUser.universityId);
        userFilter.universityId = uniId;
        appFilter.universityId = uniId;
        placementFilter.universityId = uniId;
        uniFilter._id = uniId;
      }
    } else if (currentUser.roles.includes(UserRole.ORGANIZATION_ADMIN) || currentUser.roles.includes(UserRole.ORGANIZATION_STAFF)) {
      if (currentUser.organizationId) {
        const orgId = new mongoose.Types.ObjectId(currentUser.organizationId);
        userFilter.organizationId = orgId;
        appFilter.organizationId = orgId;
        placementFilter.organizationId = orgId;
        orgFilter._id = orgId;
        supFilter.organizationId = orgId;
      }
    }

    const [
      studentsCount,
      applicationsCount,
      placementsCount,
      universitiesCount,
      organizationsCount,
      supervisorsCount,
      certificatesCount,
      recentApplications,
      recentUsers,
      recentActivity,
      organizationsList,
    ] = await Promise.all([
      User.countDocuments({ ...userFilter, roles: { $in: [UserRole.STUDENT, UserRole.INDEPENDENT_APPLICANT] } }),
      Application.countDocuments(appFilter),
      Placement.countDocuments(placementFilter),
      University.countDocuments(uniFilter),
      Organization.countDocuments(orgFilter),
      ClinicalSupervisor.countDocuments(supFilter),
      Certificate.countDocuments({}),
      Application.find(appFilter)
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('studentId', 'firstName lastName email')
        .populate('universityId', 'name shortName code')
        .populate('desiredOrganizationId', 'name type')
        .lean(),
      User.find(userFilter)
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('universityId', 'name shortName')
        .populate('organizationId', 'name')
        .lean(),
      AuditLog.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('actorId', 'firstName lastName email roles')
        .lean(),
      Organization.find(orgFilter).limit(10).lean(),
    ]);

    // Calculate capacity for organizations
    const organizationCapacity = await Promise.all(
      organizationsList.map(async (org: any) => {
        const occupied = await Placement.countDocuments({
          organizationId: org._id,
          status: { $in: [PlacementStatus.CONFIRMED, PlacementStatus.ACTIVE] },
        });
        const capacity = org.capacity || 20;
        const available = Math.max(0, capacity - occupied);
        const utilization = capacity > 0 ? Math.min(100, Math.round((occupied / capacity) * 100)) : 0;

        return {
          _id: org._id,
          name: org.name,
          type: org.type,
          capacity,
          occupied,
          available,
          utilization,
          status: org.status,
        };
      })
    );

    return {
      stats: {
        students: studentsCount,
        applications: applicationsCount,
        placements: placementsCount,
        universities: universitiesCount,
        organizations: organizationsCount,
        supervisors: supervisorsCount,
        attachments: placementsCount,
        certificates: certificatesCount,
      },
      recentApplications,
      recentUsers,
      recentActivity,
      organizationCapacity,
    };
  }

  // ==========================================
  // USER MANAGEMENT
  // ==========================================
  static async getUsers(params: PaginationParams, currentUser: AuthUser) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    if (!isDatabaseConnected()) {
      let filtered = [...memoryUsers];
      if (params.role) {
        filtered = filtered.filter((u) => u.roles.includes(params.role as any));
      }
      if (params.status) {
        filtered = filtered.filter((u) => u.status === params.status);
      }
      if (params.search) {
        const s = params.search.toLowerCase();
        filtered = filtered.filter(
          (u) =>
            u.firstName.toLowerCase().includes(s) ||
            u.lastName.toLowerCase().includes(s) ||
            u.email.toLowerCase().includes(s) ||
            (u.phone && u.phone.toLowerCase().includes(s))
        );
      }
      if (currentUser.roles.includes(UserRole.UNIVERSITY_ADMIN) && currentUser.universityId) {
        filtered = filtered.filter(
          (u) => u.universityId?._id === currentUser.universityId || u.universityId === currentUser.universityId
        );
      } else if (currentUser.roles.includes(UserRole.ORGANIZATION_ADMIN) && currentUser.organizationId) {
        filtered = filtered.filter(
          (u) => u.organizationId?._id === currentUser.organizationId || u.organizationId === currentUser.organizationId
        );
      }

      const total = filtered.length;
      return {
        users: filtered.slice(skip, skip + limit),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      };
    }

    const query: any = {};

    // Tenant Isolation
    if (currentUser.roles.includes(UserRole.UNIVERSITY_ADMIN) || currentUser.roles.includes(UserRole.UNIVERSITY_STAFF)) {
      if (currentUser.universityId) {
        query.universityId = new mongoose.Types.ObjectId(currentUser.universityId);
      }
    } else if (currentUser.roles.includes(UserRole.ORGANIZATION_ADMIN) || currentUser.roles.includes(UserRole.ORGANIZATION_STAFF)) {
      if (currentUser.organizationId) {
        query.organizationId = new mongoose.Types.ObjectId(currentUser.organizationId);
      }
    } else {
      if (params.universityId) {
        query.universityId = new mongoose.Types.ObjectId(params.universityId);
      }
      if (params.organizationId) {
        query.organizationId = new mongoose.Types.ObjectId(params.organizationId);
      }
    }

    if (params.role) {
      query.roles = params.role;
    }

    if (params.status) {
      query.status = params.status;
    }

    if (params.search) {
      const searchRegex = new RegExp(params.search, 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('universityId', 'name shortName code')
        .populate('organizationId', 'name type')
        .populate('studentId', 'studentNumber programme')
        .lean(),
      User.countDocuments(query),
    ]);

    // Ensure password hashes are stripped out
    const sanitizedUsers = users.map(user => {
      const { passwordHash, ...rest } = user as any;
      return rest;
    });

    return {
      users: sanitizedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async getUserById(userId: string, currentUser: AuthUser) {
    if (!isDatabaseConnected()) {
      const user = memoryUsers.find((u) => u._id === userId || u.id === userId);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    }

    const user = await User.findById(userId)
      .populate('universityId', 'name shortName code email phone website capacity status')
      .populate('organizationId', 'name type registrationNumber contactEmail contactPhone capacity status')
      .populate('studentId')
      .lean();

    if (!user) {
      throw new Error('User not found');
    }

    // Tenant Check
    if (currentUser.roles.includes(UserRole.UNIVERSITY_ADMIN) && currentUser.universityId) {
      if (user.universityId && user.universityId._id.toString() !== currentUser.universityId) {
        throw new Error('Unauthorized tenant access');
      }
    }
    if (currentUser.roles.includes(UserRole.ORGANIZATION_ADMIN) && currentUser.organizationId) {
      if (user.organizationId && user.organizationId._id.toString() !== currentUser.organizationId) {
        throw new Error('Unauthorized tenant access');
      }
    }

    const { passwordHash, ...sanitized } = user as any;
    return sanitized;
  }

  static async createUser(userData: any, currentUser: AuthUser, reqMeta?: { ip?: string; userAgent?: string }) {
    // Validate role permissions
    let allowedRoles = userData.roles || [UserRole.STUDENT];

    // Tenant Isolation Enforcement
    let universityId = userData.universityId || null;
    let organizationId = userData.organizationId || null;

    if (currentUser.roles.includes(UserRole.UNIVERSITY_ADMIN)) {
      universityId = currentUser.universityId;
      // Cannot grant higher role
      if (allowedRoles.includes(UserRole.SUPER_ADMIN) || allowedRoles.includes(UserRole.AZAAM_STAFF)) {
        throw new Error('University admins cannot create system-wide admin accounts.');
      }
    } else if (currentUser.roles.includes(UserRole.ORGANIZATION_ADMIN)) {
      organizationId = currentUser.organizationId;
      if (allowedRoles.includes(UserRole.SUPER_ADMIN) || allowedRoles.includes(UserRole.AZAAM_STAFF)) {
        throw new Error('Organization admins cannot create system-wide admin accounts.');
      }
    }

    if (!isDatabaseConnected()) {
      const existing = memoryUsers.find((u) => u.email.toLowerCase() === userData.email.toLowerCase());
      if (existing) {
        throw new Error('User with this email already exists');
      }

      let populatedUni = null;
      let populatedOrg = null;
      if (universityId) {
        const uObj = memoryUniversities.find((u) => u._id === universityId || u.id === universityId);
        if (uObj) populatedUni = { _id: uObj._id, name: uObj.name, shortName: uObj.shortName, code: uObj.code };
      }
      if (organizationId) {
        const oObj = memoryOrganizations.find((o) => o._id === organizationId || o.id === organizationId);
        if (oObj) populatedOrg = { _id: oObj._id, name: oObj.name, type: oObj.type };
      }

      const newId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newUser: any = {
        _id: newId,
        id: newId,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email.toLowerCase(),
        phone: userData.phone || '',
        roles: allowedRoles,
        status: userData.status || 'ACTIVE',
        universityId: populatedUni,
        organizationId: populatedOrg,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memoryUsers.unshift(newUser);

      if (allowedRoles.includes(UserRole.CLINICAL_SUPERVISOR) && organizationId) {
        memorySupervisors.unshift({
          _id: `sup-${Date.now()}`,
          id: `sup-${Date.now()}`,
          userId: newUser,
          organizationId: populatedOrg || { _id: organizationId, name: 'General Hospital', type: 'Hospital' },
          department: 'General Medicine',
          specialty: userData.qualification || 'Clinical Specialist',
          licenseNumber: userData.licenseNumber || 'LIC-SOM-900',
          qualification: userData.qualification || 'M.D. / Clinical Specialist',
          status: 'ACTIVE',
          verified: true,
          activeAttachmentsCount: 0,
          totalTraineesSupervised: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      await AuditService.logEvent({
        actorId: currentUser.userId,
        actorEmail: currentUser.email,
        action: 'USER_CREATED',
        entityType: 'User',
        entityId: newId,
        metadata: { email: newUser.email, roles: newUser.roles, universityId, organizationId },
        ipAddress: reqMeta?.ip,
        userAgent: reqMeta?.userAgent,
      });

      return newUser;
    }

    // Check duplicate email
    const existing = await User.findOne({ email: userData.email.toLowerCase() });
    if (existing) {
      throw new Error('User with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(userData.password || 'ChangeMe123!', salt);

    const newUser = new User({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email.toLowerCase(),
      phone: userData.phone,
      passwordHash,
      roles: allowedRoles,
      status: userData.status || 'ACTIVE',
      universityId,
      organizationId,
    });

    await newUser.save();

    // If role is CLINICAL_SUPERVISOR, ensure ClinicalSupervisor record exists
    if (allowedRoles.includes(UserRole.CLINICAL_SUPERVISOR) && organizationId) {
      await ClinicalSupervisor.findOneAndUpdate(
        { userId: newUser._id },
        {
          userId: newUser._id,
          organizationId: organizationId,
          licenseNumber: userData.licenseNumber || '',
          qualification: userData.qualification || 'M.D. / Clinical Specialist',
          status: 'ACTIVE',
          verified: true,
        },
        { upsert: true, new: true }
      );
    }

    // Audit Log
    await AuditService.logEvent({
      actorId: currentUser.userId,
      actorEmail: currentUser.email,
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: newUser._id.toString(),
      metadata: { email: newUser.email, roles: newUser.roles, universityId, organizationId },
      ipAddress: reqMeta?.ip,
      userAgent: reqMeta?.userAgent,
    });

    const createdDoc = await User.findById(newUser._id)
      .populate('universityId', 'name shortName')
      .populate('organizationId', 'name')
      .lean();

    const { passwordHash: _, ...sanitized } = createdDoc as any;
    return sanitized;
  }

  static async updateUser(userId: string, updateData: any, currentUser: AuthUser, reqMeta?: { ip?: string; userAgent?: string }) {
    if (!isDatabaseConnected()) {
      const idx = memoryUsers.findIndex((u) => u._id === userId || u.id === userId);
      if (idx === -1) throw new Error('User not found');
      const user = memoryUsers[idx];
      if (updateData.firstName) user.firstName = updateData.firstName;
      if (updateData.lastName) user.lastName = updateData.lastName;
      if (updateData.phone !== undefined) user.phone = updateData.phone;
      if (updateData.roles && Array.isArray(updateData.roles)) {
        if (currentUser.roles.includes(UserRole.SUPER_ADMIN) || currentUser.roles.includes(UserRole.AZAAM_STAFF)) {
          user.roles = updateData.roles;
        }
      }
      if (updateData.status) user.status = updateData.status;
      if (currentUser.roles.includes(UserRole.SUPER_ADMIN) || currentUser.roles.includes(UserRole.AZAAM_STAFF)) {
        if (updateData.universityId !== undefined) {
          const uObj = memoryUniversities.find((u) => u._id === updateData.universityId || u.id === updateData.universityId);
          user.universityId = uObj ? { _id: uObj._id, name: uObj.name, shortName: uObj.shortName } : null;
        }
        if (updateData.organizationId !== undefined) {
          const oObj = memoryOrganizations.find((o) => o._id === updateData.organizationId || o.id === updateData.organizationId);
          user.organizationId = oObj ? { _id: oObj._id, name: oObj.name, type: oObj.type } : null;
        }
      }
      user.updatedAt = new Date().toISOString();

      await AuditService.logEvent({
        actorId: currentUser.userId,
        actorEmail: currentUser.email,
        action: 'USER_UPDATED',
        entityType: 'User',
        entityId: userId,
        metadata: { updatedFields: Object.keys(updateData) },
        ipAddress: reqMeta?.ip,
        userAgent: reqMeta?.userAgent,
      });

      return user;
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Tenant isolation
    if (currentUser.roles.includes(UserRole.UNIVERSITY_ADMIN) && currentUser.universityId) {
      if (user.universityId?.toString() !== currentUser.universityId) {
        throw new Error('Unauthorized tenant access');
      }
    }
    if (currentUser.roles.includes(UserRole.ORGANIZATION_ADMIN) && currentUser.organizationId) {
      if (user.organizationId?.toString() !== currentUser.organizationId) {
        throw new Error('Unauthorized tenant access');
      }
    }

    if (updateData.firstName) user.firstName = updateData.firstName;
    if (updateData.lastName) user.lastName = updateData.lastName;
    if (updateData.phone !== undefined) user.phone = updateData.phone;
    if (updateData.roles && Array.isArray(updateData.roles)) {
      if (currentUser.roles.includes(UserRole.SUPER_ADMIN) || currentUser.roles.includes(UserRole.AZAAM_STAFF)) {
        user.roles = updateData.roles;
      }
    }
    if (updateData.status) user.status = updateData.status;

    if (currentUser.roles.includes(UserRole.SUPER_ADMIN) || currentUser.roles.includes(UserRole.AZAAM_STAFF)) {
      if (updateData.universityId !== undefined) user.universityId = updateData.universityId || null;
      if (updateData.organizationId !== undefined) user.organizationId = updateData.organizationId || null;
    }

    await user.save();

    await AuditService.logEvent({
      actorId: currentUser.userId,
      actorEmail: currentUser.email,
      action: 'USER_UPDATED',
      entityType: 'User',
      entityId: user._id.toString(),
      metadata: { updatedFields: Object.keys(updateData) },
      ipAddress: reqMeta?.ip,
      userAgent: reqMeta?.userAgent,
    });

    const updatedUser = await User.findById(userId)
      .populate('universityId', 'name shortName')
      .populate('organizationId', 'name')
      .lean();

    const { passwordHash: _, ...sanitized } = updatedUser as any;
    return sanitized;
  }

  static async updateUserStatus(userId: string, status: 'ACTIVE' | 'INACTIVE', currentUser: AuthUser, reqMeta?: { ip?: string; userAgent?: string }) {
    if (!isDatabaseConnected()) {
      const idx = memoryUsers.findIndex((u) => u._id === userId || u.id === userId);
      if (idx === -1) throw new Error('User not found');
      memoryUsers[idx].status = status;
      memoryUsers[idx].updatedAt = new Date().toISOString();

      await AuditService.logEvent({
        actorId: currentUser.userId,
        actorEmail: currentUser.email,
        action: status === 'ACTIVE' ? 'USER_ACTIVATED' : 'USER_DISABLED',
        entityType: 'User',
        entityId: userId,
        metadata: { newStatus: status, userEmail: memoryUsers[idx].email },
        ipAddress: reqMeta?.ip,
        userAgent: reqMeta?.userAgent,
      });

      return { id: userId, status };
    }

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    user.status = status;
    await user.save();

    await AuditService.logEvent({
      actorId: currentUser.userId,
      actorEmail: currentUser.email,
      action: status === 'ACTIVE' ? 'USER_ACTIVATED' : 'USER_DISABLED',
      entityType: 'User',
      entityId: user._id.toString(),
      metadata: { newStatus: status, userEmail: user.email },
      ipAddress: reqMeta?.ip,
      userAgent: reqMeta?.userAgent,
    });

    return { id: user._id, status: user.status };
  }

  static async resetUserPassword(userId: string, newPassword: string, currentUser: AuthUser, reqMeta?: { ip?: string; userAgent?: string }) {
    if (!isDatabaseConnected()) {
      const idx = memoryUsers.findIndex((u) => u._id === userId || u.id === userId);
      if (idx === -1) throw new Error('User not found');
      
      await AuditService.logEvent({
        actorId: currentUser.userId,
        actorEmail: currentUser.email,
        action: 'USER_PASSWORD_RESET',
        entityType: 'User',
        entityId: userId,
        metadata: { email: memoryUsers[idx].email },
        ipAddress: reqMeta?.ip,
        userAgent: reqMeta?.userAgent,
      });

      return { success: true, message: 'Password reset successfully' };
    }
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    await AuditService.logEvent({
      actorId: currentUser.userId,
      actorEmail: currentUser.email,
      action: 'USER_PASSWORD_RESET',
      entityType: 'User',
      entityId: user._id.toString(),
      metadata: { email: user.email },
      ipAddress: reqMeta?.ip,
      userAgent: reqMeta?.userAgent,
    });

    return { success: true, message: 'Password reset successfully' };
  }

  // ==========================================
  // UNIVERSITY MANAGEMENT
  // ==========================================
  static async getUniversities(params: PaginationParams) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    if (!isDatabaseConnected()) {
      let filtered = [...memoryUniversities];
      if (params.status) {
        filtered = filtered.filter((u) => u.status === params.status);
      }
      if (params.search) {
        const s = params.search.toLowerCase();
        filtered = filtered.filter(
          (u) =>
            u.name.toLowerCase().includes(s) ||
            u.code.toLowerCase().includes(s) ||
            u.email.toLowerCase().includes(s)
        );
      }
      const total = filtered.length;
      return {
        universities: filtered.slice(skip, skip + limit),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      };
    }

    const query: any = {};
    if (params.status) query.status = params.status;
    if (params.search) {
      const regex = new RegExp(params.search, 'i');
      query.$or = [
        { name: regex },
        { code: regex },
        { email: regex },
        { officialName: regex },
        { abbreviation: regex },
        { address: regex },
      ];
    }

    const [universities, total] = await Promise.all([
      University.find(query).sort({ name: 1 }).skip(skip).limit(limit).lean(),
      University.countDocuments(query),
    ]);

    // Populate dynamic student & application counts for each university
    const enriched = await Promise.all(
      universities.map(async (uni: any) => {
        const [studentCount, applicationCount] = await Promise.all([
          User.countDocuments({ universityId: uni._id, roles: UserRole.STUDENT }),
          Application.countDocuments({ universityId: uni._id }),
        ]);
        return {
          ...uni,
          studentsCount: studentCount,
          applicationsCount: applicationCount,
        };
      })
    );

    return {
      universities: enriched,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async getUniversityById(id: string) {
    if (!isDatabaseConnected()) {
      const uni = memoryUniversities.find((u) => u._id === id || u.id === id);
      if (!uni) throw new Error('University not found');
      return {
        university: uni,
        stats: {
          studentsCount: memoryUsers.filter(
            (u) => u.universityId?._id === id && u.roles?.includes(UserRole.STUDENT)
          ).length,
          applicationsCount: 4,
          activePlacementsCount: 2,
        },
        administrators: memoryUsers.filter(
          (u) =>
            u.universityId?._id === id &&
            (u.roles?.includes(UserRole.UNIVERSITY_ADMIN) || u.roles?.includes(UserRole.UNIVERSITY_STAFF))
        ),
        recentApplications: [],
      };
    }

    const uni = await University.findById(id).lean();
    if (!uni) throw new Error('University not found');

    const [studentCount, applicationCount, activePlacements, adminsList, recentApps] = await Promise.all([
      User.countDocuments({ universityId: uni._id, roles: UserRole.STUDENT }),
      Application.countDocuments({ universityId: uni._id }),
      Placement.countDocuments({ universityId: uni._id, status: { $in: [PlacementStatus.CONFIRMED, PlacementStatus.ACTIVE] } }),
      User.find({ universityId: uni._id, roles: { $in: [UserRole.UNIVERSITY_ADMIN, UserRole.UNIVERSITY_STAFF] } })
        .select('-passwordHash')
        .lean(),
      Application.find({ universityId: uni._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('studentId', 'firstName lastName email')
        .populate('desiredOrganizationId', 'name')
        .lean(),
    ]);

    return {
      university: uni,
      stats: {
        studentsCount: studentCount,
        applicationsCount: applicationCount,
        activePlacementsCount: activePlacements,
      },
      administrators: adminsList,
      recentApplications: recentApps,
    };
  }

  static async createUniversity(data: any, currentUser: AuthUser, reqMeta?: { ip?: string; userAgent?: string }) {
    if (!isDatabaseConnected()) {
      const newUni: MemoryUniversity = {
        _id: `uni-${Date.now()}`,
        id: `uni-${Date.now()}`,
        name: data.name,
        code: data.code.toUpperCase(),
        shortName: data.shortName || data.abbreviation || data.code.toUpperCase(),
        officialName: data.officialName || data.name,
        abbreviation: data.abbreviation || data.code.toUpperCase(),
        email: data.email.toLowerCase(),
        phone: data.phone || '',
        website: data.website || '',
        country: data.country || 'Somalia',
        city: data.city || '',
        state: data.state || '',
        address: data.address || '',
        postalCode: data.postalCode || '',
        accreditationNumber: data.accreditationNumber || '',
        accreditationStatus: data.accreditationStatus || 'PENDING',
        capacity: data.capacity || 100,
        status: data.status || 'ACTIVE',
        studentsCount: 0,
        applicationsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memoryUniversities.unshift(newUni);

      if (data.initialAdminEmail) {
        memoryUsers.unshift({
          _id: `usr-${Date.now()}`,
          id: `usr-${Date.now()}`,
          firstName: data.initialAdminFirstName || 'University',
          lastName: data.initialAdminLastName || 'Admin',
          email: data.initialAdminEmail.toLowerCase(),
          phone: data.phone || '',
          roles: [UserRole.UNIVERSITY_ADMIN],
          status: 'ACTIVE',
          universityId: newUni,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      await AuditService.logEvent({
        actorId: currentUser.userId,
        actorEmail: currentUser.email,
        action: 'UNIVERSITY_CREATED',
        entityType: 'University',
        entityId: newUni._id,
        metadata: { name: newUni.name, code: newUni.code },
        ipAddress: reqMeta?.ip,
        userAgent: reqMeta?.userAgent,
      });

      return newUni;
    }

    // 1. Prevent duplicate code
    const existingCode = await University.findOne({ code: data.code.toUpperCase() });
    if (existingCode) throw new Error(`University code '${data.code}' already exists`);

    // 2. Prevent duplicate email
    const existingEmail = await University.findOne({ email: data.email.toLowerCase() });
    if (existingEmail) throw new Error(`A university with email '${data.email}' already exists`);

    // 3. Prevent duplicate accreditation number if provided
    if (data.accreditationNumber) {
      const existingAccred = await University.findOne({ accreditationNumber: data.accreditationNumber.trim() });
      if (existingAccred) throw new Error(`A university with accreditation number '${data.accreditationNumber}' already exists`);
    }

    // 4. Prevent duplicate by normalized name + country
    if (data.country) {
      const existingNameAndCountry = await University.findOne({
        name: { $regex: new RegExp('^' + data.name.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') },
        country: { $regex: new RegExp('^' + data.country.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') },
      });
      if (existingNameAndCountry) {
        throw new Error(`A university named '${data.name}' already exists in ${data.country}`);
      }
    }

    const uni = new University({
      name: data.name,
      code: data.code.toUpperCase(),
      officialName: data.officialName || data.name,
      abbreviation: data.abbreviation || data.code.toUpperCase(),
      country: data.country,
      city: data.city,
      state: data.state,
      address: data.address,
      postalCode: data.postalCode,
      email: data.email.toLowerCase(),
      phone: data.phone,
      website: data.website,
      accreditationNumber: data.accreditationNumber,
      accreditationStatus: data.accreditationStatus || 'PENDING',
      contactPersonName: data.contactPersonName,
      contactPersonEmail: data.contactPersonEmail ? data.contactPersonEmail.toLowerCase() : undefined,
      contactPersonPhone: data.contactPersonPhone,
      notes: data.notes,
      capacity: data.capacity || 100,
      status: data.status || 'ACTIVE',
    });

    await uni.save();

    await AuditService.logEvent({
      actorId: currentUser.userId,
      actorEmail: currentUser.email,
      action: 'UNIVERSITY_CREATED',
      entityType: 'University',
      entityId: uni._id.toString(),
      metadata: { name: uni.name, code: uni.code },
      ipAddress: reqMeta?.ip,
      userAgent: reqMeta?.userAgent,
    });

    // Handle optional initial UNIVERSITY_ADMIN creation safely
    if (data.initialAdminEmail) {
      try {
        const existingUser = await User.findOne({ email: data.initialAdminEmail.toLowerCase() });
        if (existingUser) {
          throw new Error(`Email '${data.initialAdminEmail}' is already registered to another user account.`);
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(data.initialAdminPassword || 'ChangeMe123!', salt);

        const newAdmin = new User({
          firstName: data.initialAdminFirstName || 'University',
          lastName: data.initialAdminLastName || 'Admin',
          email: data.initialAdminEmail.toLowerCase(),
          phone: data.phone,
          passwordHash,
          roles: [UserRole.UNIVERSITY_ADMIN],
          status: 'ACTIVE',
          universityId: uni._id,
        });

        await newAdmin.save();

        await AuditService.logEvent({
          actorId: currentUser.userId,
          actorEmail: currentUser.email,
          action: 'ADMIN_USER_CREATED',
          entityType: 'User',
          entityId: newAdmin._id.toString(),
          metadata: { email: newAdmin.email, roles: newAdmin.roles, universityId: uni._id },
          ipAddress: reqMeta?.ip,
          userAgent: reqMeta?.userAgent,
        });
      } catch (err: any) {
        // Safe partial failure: log and clean up uni, or propagate error. Let's cascade rollback or propagate the error to keep the form atomic.
        await University.findByIdAndDelete(uni._id);
        throw new Error(`Failed to create initial university admin: ${err.message}`);
      }
    }

    return uni;
  }

  static async updateUniversity(id: string, data: any, currentUser: AuthUser, reqMeta?: { ip?: string; userAgent?: string }) {
    if (!isDatabaseConnected()) {
      const uni = memoryUniversities.find((u) => u._id === id || u.id === id);
      if (!uni) throw new Error('University not found');

      if (uni.status === 'ARCHIVED' && data.status !== 'ACTIVE' && data.status !== 'INACTIVE') {
        throw new Error('This university is archived and cannot be modified. You must restore it first.');
      }

      if (data.name) uni.name = data.name;
      if (data.code) uni.code = data.code.toUpperCase();
      if (data.officialName !== undefined) uni.officialName = data.officialName;
      if (data.abbreviation !== undefined) uni.abbreviation = data.abbreviation;
      if (data.country !== undefined) uni.country = data.country;
      if (data.city !== undefined) uni.city = data.city;
      if (data.state !== undefined) uni.state = data.state;
      if (data.address !== undefined) uni.address = data.address;
      if (data.postalCode !== undefined) uni.postalCode = data.postalCode;
      if (data.email) uni.email = data.email.toLowerCase();
      if (data.phone !== undefined) uni.phone = data.phone;
      if (data.website !== undefined) uni.website = data.website;
      if (data.accreditationNumber !== undefined) uni.accreditationNumber = data.accreditationNumber;
      if (data.accreditationStatus !== undefined) uni.accreditationStatus = data.accreditationStatus;
      if (data.notes !== undefined) uni.notes = data.notes;
      if (data.capacity !== undefined) {
        if (data.capacity < 0) throw new Error('Student capacity cannot be negative');
        uni.capacity = data.capacity;
      }
      if (data.status) uni.status = data.status;
      uni.updatedAt = new Date().toISOString();

      await AuditService.logEvent({
        actorId: currentUser.userId,
        actorEmail: currentUser.email,
        action: 'UNIVERSITY_UPDATED',
        entityType: 'University',
        entityId: uni._id,
        metadata: { updatedFields: Object.keys(data) },
        ipAddress: reqMeta?.ip,
        userAgent: reqMeta?.userAgent,
      });

      return uni;
    }

    const uni = await University.findById(id);
    if (!uni) throw new Error('University not found');

    // Rule: Archived institutions cannot be modified without explicit restoration workflow
    if (uni.status === 'ARCHIVED' && data.status !== 'ACTIVE' && data.status !== 'INACTIVE') {
      throw new Error('This university is archived and cannot be modified. You must restore it first.');
    }

    if (data.name) uni.name = data.name;
    if (data.code) uni.code = data.code.toUpperCase();
    if (data.officialName !== undefined) uni.officialName = data.officialName;
    if (data.abbreviation !== undefined) uni.abbreviation = data.abbreviation;
    if (data.country !== undefined) uni.country = data.country;
    if (data.city !== undefined) uni.city = data.city;
    if (data.state !== undefined) uni.state = data.state;
    if (data.address !== undefined) uni.address = data.address;
    if (data.postalCode !== undefined) uni.postalCode = data.postalCode;
    if (data.email) uni.email = data.email.toLowerCase();
    if (data.phone !== undefined) uni.phone = data.phone;
    if (data.website !== undefined) uni.website = data.website;
    if (data.accreditationNumber !== undefined) uni.accreditationNumber = data.accreditationNumber;
    if (data.accreditationStatus !== undefined) uni.accreditationStatus = data.accreditationStatus;
    if (data.contactPersonName !== undefined) uni.contactPersonName = data.contactPersonName;
    if (data.contactPersonEmail !== undefined) uni.contactPersonEmail = data.contactPersonEmail ? data.contactPersonEmail.toLowerCase() : undefined;
    if (data.contactPersonPhone !== undefined) uni.contactPersonPhone = data.contactPersonPhone;
    if (data.notes !== undefined) uni.notes = data.notes;
    if (data.capacity !== undefined) {
      if (data.capacity < 0) throw new Error('Student capacity cannot be negative');
      uni.capacity = data.capacity;
    }
    if (data.status) uni.status = data.status;

    await uni.save();

    await AuditService.logEvent({
      actorId: currentUser.userId,
      actorEmail: currentUser.email,
      action: 'UNIVERSITY_UPDATED',
      entityType: 'University',
      entityId: uni._id.toString(),
      metadata: { updatedFields: Object.keys(data) },
      ipAddress: reqMeta?.ip,
      userAgent: reqMeta?.userAgent,
    });

    return uni;
  }

  static async updateUniversityStatus(id: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ARCHIVED', currentUser: AuthUser, reqMeta?: { ip?: string; userAgent?: string }) {
    if (!isDatabaseConnected()) {
      const uni = memoryUniversities.find((u) => u._id === id || u.id === id);
      if (!uni) throw new Error('University not found');

      const oldStatus = uni.status;
      uni.status = status;
      uni.updatedAt = new Date().toISOString();

      let action: string = 'UNIVERSITY_STATUS_UPDATED';
      if (status === 'SUSPENDED') action = 'UNIVERSITY_SUSPENDED';
      if (status === 'ACTIVE' && oldStatus !== 'ACTIVE') action = 'UNIVERSITY_ACTIVATED';
      if (status === 'ARCHIVED') action = 'UNIVERSITY_ARCHIVED';

      await AuditService.logEvent({
        actorId: currentUser.userId,
        actorEmail: currentUser.email,
        action,
        entityType: 'University',
        entityId: uni._id,
        metadata: { status, previousStatus: oldStatus },
        ipAddress: reqMeta?.ip,
        userAgent: reqMeta?.userAgent,
      });

      return uni;
    }

    const uni = await University.findById(id);
    if (!uni) throw new Error('University not found');

    const oldStatus = uni.status;
    uni.status = status;
    await uni.save();

    let action: string = 'UNIVERSITY_STATUS_UPDATED';
    if (status === 'SUSPENDED') action = 'UNIVERSITY_SUSPENDED';
    if (status === 'ACTIVE' && oldStatus !== 'ACTIVE') action = 'UNIVERSITY_ACTIVATED';
    if (status === 'ARCHIVED') action = 'UNIVERSITY_ARCHIVED';

    await AuditService.logEvent({
      actorId: currentUser.userId,
      actorEmail: currentUser.email,
      action,
      entityType: 'University',
      entityId: uni._id.toString(),
      metadata: { status, previousStatus: oldStatus },
      ipAddress: reqMeta?.ip,
      userAgent: reqMeta?.userAgent,
    });

    return uni;
  }

  // ==========================================
  // ORGANIZATION MANAGEMENT
  // ==========================================
  static async getOrganizations(params: PaginationParams) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    if (!isDatabaseConnected()) {
      let filtered = [...memoryOrganizations];
      if (params.type) {
        filtered = filtered.filter((o) => o.type === params.type);
      }
      if (params.status) {
        filtered = filtered.filter((o) => o.status === params.status);
      }
      if (params.search) {
        const s = params.search.toLowerCase();
        filtered = filtered.filter(
          (o) =>
            o.name.toLowerCase().includes(s) ||
            (o.contactEmail && o.contactEmail.toLowerCase().includes(s)) ||
            (o.city && o.city.toLowerCase().includes(s))
        );
      }
      const total = filtered.length;
      return {
        organizations: filtered.slice(skip, skip + limit),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      };
    }

    const query: any = {};
    if (params.type) query.type = params.type;
    if (params.status) query.status = params.status;
    if (params.search) {
      const regex = new RegExp(params.search, 'i');
      query.$or = [
        { name: regex },
        { legalName: regex },
        { contactEmail: regex },
        { registrationNumber: regex },
        { address: regex },
        { website: regex }
      ];
    }

    const [organizations, total] = await Promise.all([
      Organization.find(query).sort({ name: 1 }).skip(skip).limit(limit).lean(),
      Organization.countDocuments(query),
    ]);

    const enriched = await Promise.all(
      organizations.map(async (org: any) => {
        const occupied = await Placement.countDocuments({
          organizationId: org._id,
          status: { $in: [PlacementStatus.CONFIRMED, PlacementStatus.ACTIVE] },
        });
        const capacity = org.capacity || 20;
        const available = Math.max(0, capacity - occupied);
        const utilization = capacity > 0 ? Math.min(100, Math.round((occupied / capacity) * 100)) : 0;

        return {
          ...org,
          occupiedSlots: occupied,
          availableSlots: available,
          utilizationPercentage: utilization,
        };
      })
    );

    return {
      organizations: enriched,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async getOrganizationById(id: string) {
    if (!isDatabaseConnected()) {
      const org = memoryOrganizations.find((o) => o._id === id || o.id === id);
      if (!org) throw new Error('Organization not found');

      const capacity = org.capacity || 20;
      const occupied = 6;
      const available = Math.max(0, capacity - occupied);
      const utilization = capacity > 0 ? Math.min(100, Math.round((occupied / capacity) * 100)) : 0;

      return {
        organization: org,
        capacityStats: {
          capacity,
          occupiedSlots: occupied,
          availableSlots: available,
          utilizationPercentage: utilization,
        },
        supervisors: memorySupervisors.filter((s) => s.organizationId?._id === id || s.organizationId === id),
        staff: memoryUsers.filter((u) => u.organizationId?._id === id),
        activePlacements: [],
      };
    }

    const org = await Organization.findById(id).lean();
    if (!org) throw new Error('Organization not found');

    const [occupied, supervisors, staffList, activePlacements] = await Promise.all([
      Placement.countDocuments({ organizationId: org._id, status: { $in: [PlacementStatus.CONFIRMED, PlacementStatus.ACTIVE] } }),
      ClinicalSupervisor.find({ organizationId: org._id }).populate('userId', 'firstName lastName email phone status').lean(),
      User.find({ organizationId: org._id, roles: { $in: [UserRole.ORGANIZATION_ADMIN, UserRole.ORGANIZATION_STAFF] } })
        .select('-passwordHash')
        .lean(),
      Placement.find({ organizationId: org._id, status: { $in: [PlacementStatus.CONFIRMED, PlacementStatus.ACTIVE] } })
        .populate('studentId', 'firstName lastName email')
        .populate('universityId', 'name shortName')
        .limit(10)
        .lean(),
    ]);

    const capacity = org.capacity || 20;
    const available = Math.max(0, capacity - occupied);
    const utilization = capacity > 0 ? Math.min(100, Math.round((occupied / capacity) * 100)) : 0;

    return {
      organization: org,
      capacityStats: {
        capacity,
        occupiedSlots: occupied,
        availableSlots: available,
        utilizationPercentage: utilization,
      },
      supervisors,
      staff: staffList,
      activePlacements,
    };
  }

  static async createOrganization(data: any, currentUser: AuthUser, reqMeta?: { ip?: string; userAgent?: string }) {
    if (!isDatabaseConnected()) {
      const newOrg: MemoryOrganization = {
        _id: `org-${Date.now()}`,
        id: `org-${Date.now()}`,
        name: data.name,
        legalName: data.legalName || data.name,
        type: data.type || 'Hospital',
        registrationNumber: data.registrationNumber || '',
        country: data.country || 'Somalia',
        city: data.city || '',
        state: data.state || '',
        address: data.address || '',
        contactEmail: data.contactEmail.toLowerCase(),
        contactPhone: data.contactPhone || '',
        website: data.website || '',
        capacity: data.capacity || 20,
        status: data.status || 'ACTIVE',
        occupiedSlots: 0,
        availableSlots: data.capacity || 20,
        utilizationPercentage: 0,
        departments: ['Internal Medicine', 'Pediatrics', 'Surgery'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memoryOrganizations.unshift(newOrg);

      if (data.initialAdminEmail) {
        memoryUsers.unshift({
          _id: `usr-${Date.now()}`,
          id: `usr-${Date.now()}`,
          firstName: data.initialAdminFirstName || 'Organization',
          lastName: data.initialAdminLastName || 'Admin',
          email: data.initialAdminEmail.toLowerCase(),
          phone: data.contactPhone || '',
          roles: [UserRole.ORGANIZATION_ADMIN],
          status: 'ACTIVE',
          organizationId: newOrg,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      await AuditService.logEvent({
        actorId: currentUser.userId,
        actorEmail: currentUser.email,
        action: 'ORGANIZATION_CREATED',
        entityType: 'Organization',
        entityId: newOrg._id,
        metadata: { name: newOrg.name, type: newOrg.type },
        ipAddress: reqMeta?.ip,
        userAgent: reqMeta?.userAgent,
      });

      return newOrg;
    }

    // 1. Prevent duplicate email
    const existingEmail = await Organization.findOne({ contactEmail: data.contactEmail.toLowerCase() });
    if (existingEmail) throw new Error(`An organization with email '${data.contactEmail}' already exists`);

    // 2. Prevent duplicate registrationNumber if provided
    if (data.registrationNumber) {
      const existingReg = await Organization.findOne({ registrationNumber: data.registrationNumber.trim() });
      if (existingReg) throw new Error(`An organization with registration number '${data.registrationNumber}' already exists`);
    }

    // 3. Prevent duplicate accreditationNumber if provided
    if (data.accreditationNumber) {
      const existingAccred = await Organization.findOne({ accreditationNumber: data.accreditationNumber.trim() });
      if (existingAccred) throw new Error(`An organization with accreditation number '${data.accreditationNumber}' already exists`);
    }

    // 4. Prevent duplicate by normalized name + country
    if (data.country) {
      const existingNameAndCountry = await Organization.findOne({
        name: { $regex: new RegExp('^' + data.name.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') },
        country: { $regex: new RegExp('^' + data.country.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') },
      });
      if (existingNameAndCountry) {
        throw new Error(`An organization named '${data.name}' already exists in ${data.country}`);
      }
    }

    const org = new Organization({
      name: data.name,
      legalName: data.legalName || data.name,
      type: data.type || 'HOSPITAL',
      registrationNumber: data.registrationNumber,
      country: data.country,
      city: data.city,
      state: data.state,
      address: data.address,
      postalCode: data.postalCode,
      contactEmail: data.contactEmail.toLowerCase(),
      contactPhone: data.contactPhone,
      website: data.website,
      accreditationNumber: data.accreditationNumber,
      accreditationStatus: data.accreditationStatus || 'PENDING',
      contactPersonName: data.contactPersonName,
      contactPersonEmail: data.contactPersonEmail ? data.contactPersonEmail.toLowerCase() : undefined,
      contactPersonPhone: data.contactPersonPhone,
      capacity: data.capacity || 20,
      description: data.description,
      notes: data.notes,
      status: data.status || 'ACTIVE',
    });

    await org.save();

    await AuditService.logEvent({
      actorId: currentUser.userId,
      actorEmail: currentUser.email,
      action: 'ORGANIZATION_CREATED',
      entityType: 'Organization',
      entityId: org._id.toString(),
      metadata: { name: org.name, type: org.type },
      ipAddress: reqMeta?.ip,
      userAgent: reqMeta?.userAgent,
    });

    // Handle optional initial ORGANIZATION_ADMIN creation safely
    if (data.initialAdminEmail) {
      try {
        const existingUser = await User.findOne({ email: data.initialAdminEmail.toLowerCase() });
        if (existingUser) {
          throw new Error(`Email '${data.initialAdminEmail}' is already registered to another user account.`);
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(data.initialAdminPassword || 'ChangeMe123!', salt);

        const newAdmin = new User({
          firstName: data.initialAdminFirstName || 'Organization',
          lastName: data.initialAdminLastName || 'Admin',
          email: data.initialAdminEmail.toLowerCase(),
          phone: data.contactPhone,
          passwordHash,
          roles: [UserRole.ORGANIZATION_ADMIN],
          status: 'ACTIVE',
          organizationId: org._id,
        });

        await newAdmin.save();

        await AuditService.logEvent({
          actorId: currentUser.userId,
          actorEmail: currentUser.email,
          action: 'ADMIN_USER_CREATED',
          entityType: 'User',
          entityId: newAdmin._id.toString(),
          metadata: { email: newAdmin.email, roles: newAdmin.roles, organizationId: org._id },
          ipAddress: reqMeta?.ip,
          userAgent: reqMeta?.userAgent,
        });
      } catch (err: any) {
        // Rollback organization creation
        await Organization.findByIdAndDelete(org._id);
        throw new Error(`Failed to create initial organization admin: ${err.message}`);
      }
    }

    return org;
  }

  static async updateOrganization(id: string, data: any, currentUser: AuthUser, reqMeta?: { ip?: string; userAgent?: string }) {
    if (!isDatabaseConnected()) {
      const org = memoryOrganizations.find((o) => o._id === id || o.id === id);
      if (!org) throw new Error('Organization not found');

      if (org.status === 'ARCHIVED' && data.status !== 'ACTIVE' && data.status !== 'INACTIVE') {
        throw new Error('This organization is archived and cannot be modified. You must restore it first.');
      }

      if (data.name) org.name = data.name;
      if (data.legalName !== undefined) org.legalName = data.legalName;
      if (data.type) org.type = data.type;
      if (data.registrationNumber !== undefined) org.registrationNumber = data.registrationNumber;
      if (data.country !== undefined) org.country = data.country;
      if (data.city !== undefined) org.city = data.city;
      if (data.state !== undefined) org.state = data.state;
      if (data.address !== undefined) org.address = data.address;
      if (data.postalCode !== undefined) org.postalCode = data.postalCode;
      if (data.contactEmail) org.contactEmail = data.contactEmail.toLowerCase();
      if (data.contactPhone !== undefined) org.contactPhone = data.contactPhone;
      if (data.website !== undefined) org.website = data.website;
      if (data.accreditationNumber !== undefined) org.accreditationNumber = data.accreditationNumber;
      if (data.accreditationStatus !== undefined) org.accreditationStatus = data.accreditationStatus;
      if (data.capacity !== undefined) {
        if (data.capacity < 0) throw new Error('Placement capacity cannot be negative');
        org.capacity = data.capacity;
      }
      if (data.description !== undefined) org.description = data.description;
      if (data.notes !== undefined) org.notes = data.notes;
      if (data.status) org.status = data.status;
      org.updatedAt = new Date().toISOString();

      await AuditService.logEvent({
        actorId: currentUser.userId,
        actorEmail: currentUser.email,
        action: 'ORGANIZATION_UPDATED',
        entityType: 'Organization',
        entityId: org._id,
        metadata: { updatedFields: Object.keys(data) },
        ipAddress: reqMeta?.ip,
        userAgent: reqMeta?.userAgent,
      });

      return org;
    }

    const org = await Organization.findById(id);
    if (!org) throw new Error('Organization not found');

    // Rule: Archived institutions cannot be modified without explicit restoration workflow
    if (org.status === 'ARCHIVED' && data.status !== 'ACTIVE' && data.status !== 'INACTIVE') {
      throw new Error('This organization is archived and cannot be modified. You must restore it first.');
    }

    if (data.name) org.name = data.name;
    if (data.legalName !== undefined) org.legalName = data.legalName;
    if (data.type) org.type = data.type;
    if (data.registrationNumber !== undefined) org.registrationNumber = data.registrationNumber;
    if (data.country !== undefined) org.country = data.country;
    if (data.city !== undefined) org.city = data.city;
    if (data.state !== undefined) org.state = data.state;
    if (data.address !== undefined) org.address = data.address;
    if (data.postalCode !== undefined) org.postalCode = data.postalCode;
    if (data.contactEmail) org.contactEmail = data.contactEmail.toLowerCase();
    if (data.contactPhone !== undefined) org.contactPhone = data.contactPhone;
    if (data.website !== undefined) org.website = data.website;
    if (data.accreditationNumber !== undefined) org.accreditationNumber = data.accreditationNumber;
    if (data.accreditationStatus !== undefined) org.accreditationStatus = data.accreditationStatus;
    if (data.contactPersonName !== undefined) org.contactPersonName = data.contactPersonName;
    if (data.contactPersonEmail !== undefined) org.contactPersonEmail = data.contactPersonEmail ? data.contactPersonEmail.toLowerCase() : undefined;
    if (data.contactPersonPhone !== undefined) org.contactPersonPhone = data.contactPersonPhone;
    if (data.capacity !== undefined) {
      if (data.capacity < 0) throw new Error('Placement capacity cannot be negative');
      org.capacity = data.capacity;
    }
    if (data.description !== undefined) org.description = data.description;
    if (data.notes !== undefined) org.notes = data.notes;
    if (data.status) org.status = data.status;

    await org.save();

    await AuditService.logEvent({
      actorId: currentUser.userId,
      actorEmail: currentUser.email,
      action: 'ORGANIZATION_UPDATED',
      entityType: 'Organization',
      entityId: org._id.toString(),
      metadata: { updatedFields: Object.keys(data) },
      ipAddress: reqMeta?.ip,
      userAgent: reqMeta?.userAgent,
    });

    return org;
  }

  static async updateOrganizationStatus(id: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ARCHIVED', currentUser: AuthUser, reqMeta?: { ip?: string; userAgent?: string }) {
    if (!isDatabaseConnected()) {
      const org = memoryOrganizations.find((o) => o._id === id || o.id === id);
      if (!org) throw new Error('Organization not found');

      const oldStatus = org.status;
      org.status = status;
      org.updatedAt = new Date().toISOString();

      let action: string = 'ORGANIZATION_STATUS_UPDATED';
      if (status === 'SUSPENDED') action = 'ORGANIZATION_SUSPENDED';
      if (status === 'ACTIVE' && oldStatus !== 'ACTIVE') action = 'ORGANIZATION_ACTIVATED';
      if (status === 'ARCHIVED') action = 'ORGANIZATION_ARCHIVED';

      await AuditService.logEvent({
        actorId: currentUser.userId,
        actorEmail: currentUser.email,
        action,
        entityType: 'Organization',
        entityId: org._id,
        metadata: { status, previousStatus: oldStatus },
        ipAddress: reqMeta?.ip,
        userAgent: reqMeta?.userAgent,
      });

      return org;
    }

    const org = await Organization.findById(id);
    if (!org) throw new Error('Organization not found');

    const oldStatus = org.status;
    org.status = status;
    await org.save();

    let action: string = 'ORGANIZATION_STATUS_UPDATED';
    if (status === 'SUSPENDED') action = 'ORGANIZATION_SUSPENDED';
    if (status === 'ACTIVE' && oldStatus !== 'ACTIVE') action = 'ORGANIZATION_ACTIVATED';
    if (status === 'ARCHIVED') action = 'ORGANIZATION_ARCHIVED';

    await AuditService.logEvent({
      actorId: currentUser.userId,
      actorEmail: currentUser.email,
      action,
      entityType: 'Organization',
      entityId: org._id.toString(),
      metadata: { status, previousStatus: oldStatus },
      ipAddress: reqMeta?.ip,
      userAgent: reqMeta?.userAgent,
    });

    return org;
  }

  // ==========================================
  // SUPERVISOR MANAGEMENT
  // ==========================================
  static async getSupervisors(params: PaginationParams, currentUser: AuthUser) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    if (!isDatabaseConnected()) {
      let filtered = [...memorySupervisors];
      if (params.status) {
        filtered = filtered.filter((s) => s.status === params.status);
      }
      const total = filtered.length;
      return {
        supervisors: filtered.slice(skip, skip + limit),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      };
    }

    const query: any = {};

    // Tenant Check
    if (currentUser.roles.includes(UserRole.ORGANIZATION_ADMIN) || currentUser.roles.includes(UserRole.ORGANIZATION_STAFF)) {
      if (currentUser.organizationId) {
        query.organizationId = new mongoose.Types.ObjectId(currentUser.organizationId);
      }
    } else if (params.organizationId) {
      query.organizationId = new mongoose.Types.ObjectId(params.organizationId);
    }

    if (params.status) query.status = params.status;

    const [supervisors, total] = await Promise.all([
      ClinicalSupervisor.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'firstName lastName email phone status')
        .populate('organizationId', 'name type contactEmail')
        .populate('departmentId', 'name')
        .lean(),
      ClinicalSupervisor.countDocuments(query),
    ]);

    // Calculate active trainees assigned to each supervisor
    const enriched = await Promise.all(
      supervisors.map(async (sup: any) => {
        const assignedTraineesCount = await Placement.countDocuments({
          supervisorId: sup._id,
          status: { $in: [PlacementStatus.CONFIRMED, PlacementStatus.ACTIVE] },
        });
        return {
          ...sup,
          assignedTraineesCount,
        };
      })
    );

    return {
      supervisors: enriched,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async getSupervisorById(id: string) {
    const sup = await ClinicalSupervisor.findById(id)
      .populate('userId', 'firstName lastName email phone status lastLoginAt createdAt')
      .populate('organizationId', 'name type contactEmail contactPhone address capacity')
      .populate('departmentId', 'name')
      .lean();

    if (!sup) throw new Error('Clinical supervisor not found');

    const activePlacements = await Placement.find({
      supervisorId: sup._id,
      status: { $in: [PlacementStatus.CONFIRMED, PlacementStatus.ACTIVE] },
    })
      .populate('studentId', 'firstName lastName email')
      .populate('universityId', 'name shortName')
      .lean();

    return {
      supervisor: sup,
      assignedTraineesCount: activePlacements.length,
      activePlacements,
    };
  }

  static async updateSupervisorStatus(id: string, status: 'ACTIVE' | 'INACTIVE', currentUser: AuthUser, reqMeta?: { ip?: string; userAgent?: string }) {
    const sup = await ClinicalSupervisor.findById(id);
    if (!sup) throw new Error('Clinical supervisor not found');

    sup.status = status;
    await sup.save();

    await AuditService.logEvent({
      actorId: currentUser.userId,
      actorEmail: currentUser.email,
      action: 'SUPERVISOR_STATUS_UPDATED',
      entityType: 'ClinicalSupervisor',
      entityId: sup._id.toString(),
      metadata: { status },
      ipAddress: reqMeta?.ip,
      userAgent: reqMeta?.userAgent,
    });

    return sup;
  }
}
