import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { UserRole } from '../types/index.js';

export const adminRouter = Router();

// All admin routes require authentication
adminRouter.use(authenticate);

// Restricted to Admin roles
const ADMIN_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.AZAAM_STAFF,
  UserRole.UNIVERSITY_ADMIN,
  UserRole.ORGANIZATION_ADMIN,
];

// Dashboard API
adminRouter.get(
  '/dashboard',
  requireRole(...ADMIN_ROLES),
  AdminController.getDashboard
);

// User Management APIs
adminRouter.get(
  '/users',
  requireRole(...ADMIN_ROLES),
  AdminController.getUsers
);
adminRouter.get(
  '/users/:id',
  requireRole(...ADMIN_ROLES),
  AdminController.getUserById
);
adminRouter.post(
  '/users',
  requireRole(UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF, UserRole.UNIVERSITY_ADMIN, UserRole.ORGANIZATION_ADMIN),
  AdminController.createUser
);
adminRouter.patch(
  '/users/:id',
  requireRole(UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF, UserRole.UNIVERSITY_ADMIN, UserRole.ORGANIZATION_ADMIN),
  AdminController.updateUser
);
adminRouter.patch(
  '/users/:id/status',
  requireRole(UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF, UserRole.UNIVERSITY_ADMIN, UserRole.ORGANIZATION_ADMIN),
  AdminController.updateUserStatus
);
adminRouter.post(
  '/users/:id/reset-password',
  requireRole(UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF),
  AdminController.resetUserPassword
);

// University Management APIs
adminRouter.get(
  '/universities',
  requireRole(...ADMIN_ROLES),
  AdminController.getUniversities
);
adminRouter.get(
  '/universities/:id',
  requireRole(...ADMIN_ROLES),
  AdminController.getUniversityById
);
adminRouter.post(
  '/universities',
  requireRole(UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF),
  AdminController.createUniversity
);
adminRouter.patch(
  '/universities/:id',
  requireRole(UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF, UserRole.UNIVERSITY_ADMIN),
  AdminController.updateUniversity
);
adminRouter.patch(
  '/universities/:id/status',
  requireRole(UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF),
  AdminController.updateUniversityStatus
);
adminRouter.post(
  '/universities/:id/activate',
  requireRole(UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF),
  AdminController.activateUniversity
);
adminRouter.post(
  '/universities/:id/suspend',
  requireRole(UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF),
  AdminController.suspendUniversity
);
adminRouter.post(
  '/universities/:id/archive',
  requireRole(UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF),
  AdminController.archiveUniversity
);

// Organization Management APIs
adminRouter.get(
  '/organizations',
  requireRole(...ADMIN_ROLES),
  AdminController.getOrganizations
);
adminRouter.get(
  '/organizations/:id',
  requireRole(...ADMIN_ROLES),
  AdminController.getOrganizationById
);
adminRouter.post(
  '/organizations',
  requireRole(UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF),
  AdminController.createOrganization
);
adminRouter.patch(
  '/organizations/:id',
  requireRole(UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF, UserRole.ORGANIZATION_ADMIN),
  AdminController.updateOrganization
);
adminRouter.patch(
  '/organizations/:id/status',
  requireRole(UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF),
  AdminController.updateOrganizationStatus
);
adminRouter.post(
  '/organizations/:id/activate',
  requireRole(UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF),
  AdminController.activateOrganization
);
adminRouter.post(
  '/organizations/:id/suspend',
  requireRole(UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF),
  AdminController.suspendOrganization
);
adminRouter.post(
  '/organizations/:id/archive',
  requireRole(UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF),
  AdminController.archiveOrganization
);

// Supervisor Management APIs
adminRouter.get(
  '/supervisors',
  requireRole(...ADMIN_ROLES),
  AdminController.getSupervisors
);
adminRouter.get(
  '/supervisors/:id',
  requireRole(...ADMIN_ROLES),
  AdminController.getSupervisorById
);
adminRouter.patch(
  '/supervisors/:id/status',
  requireRole(UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF, UserRole.ORGANIZATION_ADMIN),
  AdminController.updateSupervisorStatus
);

// Audit Logs API
adminRouter.get(
  '/audit-logs',
  requireRole(UserRole.SUPER_ADMIN, UserRole.AZAAM_STAFF),
  AdminController.getAuditLogs
);
