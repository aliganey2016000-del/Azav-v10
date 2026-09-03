import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
import { UserRole } from '../types/index.js';
import { Student } from '../models/Student.js';
import { Placement } from '../models/Placement.js';
import { Application } from '../models/Application.js';

export async function validateStudentAccess(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Not authenticated' } });
    return;
  }
  if (req.user.roles.includes(UserRole.SUPER_ADMIN) || req.user.roles.includes(UserRole.AZAAM_STAFF)) {
    next();
    return;
  }
  const targetStudentId = req.params.studentId || req.params.id;
  if (!targetStudentId) {
    res.status(400).json({ success: false, error: { code: 'MISSING_RESOURCE_ID', message: 'Student ID is required for access validation' } });
    return;
  }
  if (req.user.roles.includes(UserRole.STUDENT) || req.user.roles.includes(UserRole.INDEPENDENT_APPLICANT)) {
    if (req.user.studentId && req.user.studentId.toString() === targetStudentId.toString()) {
      next();
      return;
    }
    res.status(403).json({ success: false, error: { code: 'FORBIDDEN_IDOR', message: 'You can only access your own student profile' } });
    return;
  }
  try {
    const student = await Student.findById(targetStudentId);
    if (!student) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Student record not found' } });
      return;
    }
    if (req.user.roles.includes(UserRole.UNIVERSITY_ADMIN) || req.user.roles.includes(UserRole.UNIVERSITY_STAFF)) {
      if (req.user.universityId && student.universityId && req.user.universityId.toString() === student.universityId.toString()) {
        next();
        return;
      }
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN_TENANT', message: 'You do not have permission to view students outside your university' } });
      return;
    }
    res.status(403).json({ success: false, error: { code: 'FORBIDDEN_SCOPE', message: 'You do not have permission to access this student record' } });
  } catch {
    res.status(400).json({ success: false, error: { code: 'INVALID_ID', message: 'Invalid student ID format' } });
  }
}

export async function validateApplicationAccess(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Not authenticated' } });
    return;
  }
  const applicationId = req.params.applicationId || req.params.id;
  if (!applicationId) {
    res.status(400).json({ success: false, error: { code: 'MISSING_RESOURCE_ID', message: 'Application ID is required for access validation' } });
    return;
  }
  if (req.user.roles.includes(UserRole.SUPER_ADMIN) || req.user.roles.includes(UserRole.AZAAM_STAFF)) {
    next();
    return;
  }
  try {
    const application = await Application.findById(applicationId).select('studentId universityId');
    if (!application) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Application not found' } });
      return;
    }
    if ((req.user.roles.includes(UserRole.STUDENT) || req.user.roles.includes(UserRole.INDEPENDENT_APPLICANT)) && req.user.studentId?.toString() === application.studentId.toString()) {
      next();
      return;
    }
    if ((req.user.roles.includes(UserRole.UNIVERSITY_ADMIN) || req.user.roles.includes(UserRole.UNIVERSITY_STAFF)) && req.user.universityId && application.universityId && req.user.universityId.toString() === application.universityId.toString()) {
      next();
      return;
    }
    res.status(403).json({ success: false, error: { code: 'FORBIDDEN_SCOPE', message: 'You do not have permission to access this application' } });
  } catch {
    res.status(400).json({ success: false, error: { code: 'INVALID_ID', message: 'Invalid application ID' } });
  }
}

export async function validatePlacementAccess(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Not authenticated' } });
    return;
  }
  if (req.user.roles.includes(UserRole.SUPER_ADMIN) || req.user.roles.includes(UserRole.AZAAM_STAFF)) {
    next();
    return;
  }
  const placementId = req.params.placementId || req.params.id;
  if (!placementId) {
    res.status(400).json({ success: false, error: { code: 'MISSING_RESOURCE_ID', message: 'Placement ID is required for access validation' } });
    return;
  }
  try {
    const placement = await Placement.findById(placementId);
    if (!placement) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Placement not found' } });
      return;
    }
    if (req.user.roles.includes(UserRole.ORGANIZATION_ADMIN) || req.user.roles.includes(UserRole.ORGANIZATION_STAFF)) {
      if (req.user.organizationId && req.user.organizationId.toString() === placement.organizationId.toString()) { next(); return; }
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN_TENANT', message: 'You cannot access placements hosted by another healthcare organization' } });
      return;
    }
    if (req.user.roles.includes(UserRole.CLINICAL_SUPERVISOR)) {
      if (req.user.organizationId && req.user.organizationId.toString() === placement.organizationId.toString()) { next(); return; }
      if (req.user.userId && placement.supervisorId && req.user.userId.toString() === placement.supervisorId.toString()) { next(); return; }
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN_SCOPE', message: 'You do not have permission to access this placement' } });
      return;
    }
    if (req.user.studentId && req.user.studentId.toString() === placement.studentId.toString()) { next(); return; }
    res.status(403).json({ success: false, error: { code: 'FORBIDDEN_SCOPE', message: 'You do not have permission to access this placement' } });
  } catch {
    res.status(400).json({ success: false, error: { code: 'INVALID_ID', message: 'Invalid placement ID' } });
  }
}
