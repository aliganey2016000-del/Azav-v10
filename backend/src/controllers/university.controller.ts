import { Request, Response, NextFunction } from 'express';
import { University } from '../models/University.js';
import { Organization } from '../models/Organization.js';
import { ClinicalSupervisor } from '../models/ClinicalSupervisor.js';
import { Department } from '../models/Department.js';

export class UniversityController {
  static async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const universities = await University.find({ status: 'ACTIVE' }).sort({ name: 1 });
      res.status(200).json({ success: true, data: { universities } });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, code, email, phone, address, website, capacity } = req.body;
      const university = new University({ name, code, email, phone, address, website, capacity: capacity || 100 });
      await university.save();
      res.status(201).json({ success: true, data: { university } });
    } catch (error) {
      next(error);
    }
  }
}

export class OrganizationController {
  static async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const organizations = await Organization.find({ status: 'ACTIVE' }).sort({ name: 1 });
      res.status(200).json({ success: true, data: { organizations } });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, type, registrationNumber, contactEmail, contactPhone, address, capacity, description } = req.body;
      const organization = new Organization({
        name,
        type,
        registrationNumber,
        contactEmail,
        contactPhone,
        address,
        capacity: capacity || 20,
        description,
      });
      await organization.save();
      res.status(201).json({ success: true, data: { organization } });
    } catch (error) {
      next(error);
    }
  }

  static async listDepartments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { organizationId } = req.params;
      const departments = await Department.find({ organizationId, status: 'ACTIVE' });
      res.status(200).json({ success: true, data: { departments } });
    } catch (error) {
      next(error);
    }
  }

  static async listSupervisors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { organizationId } = req.params;
      const supervisors = await ClinicalSupervisor.find({ organizationId, status: 'ACTIVE' })
        .populate('userId', 'firstName lastName email phone')
        .populate('departmentId', 'name code');
      res.status(200).json({ success: true, data: { supervisors } });
    } catch (error) {
      next(error);
    }
  }
}
