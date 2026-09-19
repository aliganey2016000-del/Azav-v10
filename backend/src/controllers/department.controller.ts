import mongoose from 'mongoose';
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Department } from '../models/Department.js';
import { Organization } from '../models/Organization.js';
import { UserRole } from '../types/index.js';

const DEFAULT_DEPARTMENTS = [
  { name: 'Internal Medicine', code: 'INT-MED', description: 'Adult medical care, inpatient medicine and general medical ward rotations.' },
  { name: 'General Surgery', code: 'GEN-SURG', description: 'General surgical care, theatre exposure and peri-operative clinical training.' },
  { name: 'Pediatrics', code: 'PEDS', description: 'Child health, pediatric inpatient care, clinics and emergency pediatric exposure.' },
  { name: 'Obstetrics & Gynecology', code: 'OBGYN', description: 'Maternity, labour ward, antenatal, postnatal and gynecology clinical training.' },
  { name: 'Emergency Medicine', code: 'EMERG', description: 'Emergency assessment, triage, acute care and resuscitation exposure.' },
  { name: 'Orthopedics', code: 'ORTHO', description: 'Musculoskeletal care, trauma, fracture management and orthopedic ward training.' },
  { name: 'Psychiatry', code: 'PSYCH', description: 'Mental health assessment, psychiatric care and supervised clinical exposure.' },
  { name: 'Family Medicine / General Practice', code: 'FAM-MED', description: 'Primary care, outpatient consultations, prevention and continuity-of-care training.' },
] as const;

const DEFAULT_ORDER = new Map(DEFAULT_DEPARTMENTS.map((department, index) => [department.code, index]));

const escapeRegex = (value: string) => value.replace(/[.*+?^$()|[\]\\{}]/g, '\\$&');

const makeCode = (name: string) => {
  const code = name
    .toUpperCase()
    .replace(/&/g, ' AND ')
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);

  return code || 'DEPT';
};

const isGlobalManager = (req: AuthenticatedRequest) =>
  Boolean(
    req.user?.roles.includes(UserRole.SUPER_ADMIN) ||
      req.user?.roles.includes(UserRole.AZAAM_STAFF)
  );

const isSameOrganization = (req: AuthenticatedRequest, organizationId: string) =>
  Boolean(req.user?.organizationId && String(req.user.organizationId) === organizationId);

const canReadOrganizationDepartments = (req: AuthenticatedRequest, organizationId: string) =>
  isGlobalManager(req) ||
  (isSameOrganization(req, organizationId) &&
    Boolean(
      req.user?.roles.includes(UserRole.ORGANIZATION_ADMIN) ||
        req.user?.roles.includes(UserRole.ORGANIZATION_STAFF)
    ));

const canManageOrganizationDepartments = (req: AuthenticatedRequest, organizationId: string) =>
  isGlobalManager(req) ||
  (isSameOrganization(req, organizationId) &&
    Boolean(req.user?.roles.includes(UserRole.ORGANIZATION_ADMIN)));

async function ensureDefaultDepartments(organizationId: string) {
  await Promise.all(
    DEFAULT_DEPARTMENTS.map((department) =>
      Department.updateOne(
        { organizationId, code: department.code },
        {
          $setOnInsert: {
            organizationId,
            name: department.name,
            code: department.code,
            description: department.description,
            status: 'ACTIVE',
          },
        },
        { upsert: true }
      )
    )
  );
}

export class DepartmentController {
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Not logged in' } });
        return;
      }

      const { organizationId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(organizationId)) {
        res.status(400).json({ success: false, error: { code: 'INVALID_ORGANIZATION_ID', message: 'Invalid organization id.' } });
        return;
      }

      if (!canReadOrganizationDepartments(req, organizationId)) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You cannot access departments for this organization.' } });
        return;
      }

      const organizationExists = await Organization.exists({ _id: organizationId });
      if (!organizationExists) {
        res.status(404).json({ success: false, error: { code: 'ORGANIZATION_NOT_FOUND', message: 'Organization not found.' } });
        return;
      }

      await ensureDefaultDepartments(organizationId);

      const departments = await Department.find({ organizationId, status: 'ACTIVE' }).lean();
      departments.sort((a: any, b: any) => {
        const aDefault = DEFAULT_ORDER.has(a.code) ? DEFAULT_ORDER.get(a.code)! : Number.MAX_SAFE_INTEGER;
        const bDefault = DEFAULT_ORDER.has(b.code) ? DEFAULT_ORDER.get(b.code)! : Number.MAX_SAFE_INTEGER;
        if (aDefault !== bDefault) return aDefault - bDefault;

        const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return aCreated - bCreated || String(a.name).localeCompare(String(b.name));
      });

      res.status(200).json({
        success: true,
        data: { departments, defaultDepartmentCount: DEFAULT_DEPARTMENTS.length },
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Not logged in' } });
        return;
      }

      const { organizationId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(organizationId)) {
        res.status(400).json({ success: false, error: { code: 'INVALID_ORGANIZATION_ID', message: 'Invalid organization id.' } });
        return;
      }

      if (!canManageOrganizationDepartments(req, organizationId)) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You cannot add departments for this organization.' } });
        return;
      }

      const organizationExists = await Organization.exists({ _id: organizationId });
      if (!organizationExists) {
        res.status(404).json({ success: false, error: { code: 'ORGANIZATION_NOT_FOUND', message: 'Organization not found.' } });
        return;
      }

      const name = String(req.body?.name || '').trim();
      const description = String(req.body?.description || '').trim();

      if (!name) {
        res.status(400).json({ success: false, error: { code: 'DEPARTMENT_NAME_REQUIRED', message: 'Department name is required.' } });
        return;
      }

      if (name.length > 120) {
        res.status(400).json({ success: false, error: { code: 'DEPARTMENT_NAME_TOO_LONG', message: 'Department name must be 120 characters or fewer.' } });
        return;
      }

      if (description.length > 500) {
        res.status(400).json({ success: false, error: { code: 'DEPARTMENT_DESCRIPTION_TOO_LONG', message: 'Description must be 500 characters or fewer.' } });
        return;
      }

      await ensureDefaultDepartments(organizationId);

      const duplicate = await Department.findOne({
        organizationId,
        name: { $regex: new RegExp('^' + escapeRegex(name) + '$', 'i') },
        status: 'ACTIVE',
      }).select('_id');

      if (duplicate) {
        res.status(409).json({ success: false, error: { code: 'DEPARTMENT_EXISTS', message: 'A department with this name already exists.' } });
        return;
      }

      const baseCode = makeCode(name);
      let code = baseCode;
      let suffix = 2;

      while (await Department.exists({ organizationId, code })) {
        code = baseCode.slice(0, 20) + '-' + suffix;
        suffix += 1;
      }

      const department = await Department.create({
        organizationId,
        name,
        code,
        description: description || undefined,
        status: 'ACTIVE',
      });

      res.status(201).json({ success: true, data: { department } });
    } catch (error) {
      next(error);
    }
  }
}
