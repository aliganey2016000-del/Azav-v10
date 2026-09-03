import { DocumentModel, IDocument } from '../models/Document.js';
import { Student } from '../models/Student.js';
import { Application } from '../models/Application.js';
import { Placement, ClinicalAttachment } from '../models/Placement.js';
import { ClinicalSupervisor } from '../models/ClinicalSupervisor.js';
import { AuditLog } from '../models/Notification.js';
import { AuthUser, UserRole, DocumentStatus, DocumentCategory, DocumentOwnerType } from '../types/index.js';
import { StorageService, FilePayload } from './storage.service.js';

export class DocumentService {
  static async uploadDocument(
    filePayload: FilePayload,
    metadata: {
      type: DocumentCategory;
      ownerType?: DocumentOwnerType;
      ownerId?: string;
      studentId?: string;
      applicationId?: string;
      universityId?: string;
      organizationId?: string;
    },
    actor: AuthUser,
    ipAddress?: string,
    userAgent?: string
  ): Promise<IDocument> {
    // 1. Validate Upload Security
    StorageService.validateFile(filePayload.originalname, filePayload.mimetype, filePayload.buffer.length);
    const sanitizedName = StorageService.sanitizeFilename(filePayload.originalname);

    // 2. Upload to Storage Provider
    const storageProvider = StorageService.getProvider();
    const storageResult = await storageProvider.uploadFile({
      buffer: filePayload.buffer,
      mimetype: filePayload.mimetype,
      originalname: sanitizedName,
    });

    // 3. Resolve Owner Scope & Tenant References
    let targetStudentId = metadata.studentId || null;
    let targetAppId = metadata.applicationId || null;
    let targetUniId = metadata.universityId || actor.universityId || null;
    let targetOrgId = metadata.organizationId || actor.organizationId || null;

    if (actor.roles.includes(UserRole.STUDENT) && actor.studentId) {
      targetStudentId = actor.studentId;
    }

    if (targetStudentId && !targetUniId) {
      const student = await Student.findById(targetStudentId);
      if (student && student.universityId) {
        targetUniId = student.universityId.toString();
      }
    }

    const resolvedOwnerType = metadata.ownerType || DocumentOwnerType.STUDENT;
    const resolvedOwnerId = metadata.ownerId || targetStudentId || actor.userId;

    // 4. Create Document Model Entry
    const doc = new DocumentModel({
      originalName: sanitizedName,
      fileName: sanitizedName,
      storageKey: storageResult.storageKey,
      mimeType: filePayload.mimetype,
      fileSize: storageResult.fileSize,
      type: metadata.type || DocumentCategory.OTHER,
      ownerType: resolvedOwnerType,
      ownerId: resolvedOwnerId,
      studentId: targetStudentId,
      applicationId: targetAppId,
      universityId: targetUniId,
      organizationId: targetOrgId,
      uploadedBy: actor.userId,
      status: DocumentStatus.UPLOADED,
    });

    await doc.save();

    // 5. Audit Log Entry
    await AuditLog.create({
      actorUserId: actor.userId,
      actorId: actor.userId,
      actorEmail: actor.email,
      action: 'document.upload',
      entityType: 'Document',
      entityId: doc._id,
      after: {
        originalName: sanitizedName,
        type: doc.type,
        status: doc.status,
        fileSize: doc.fileSize,
      },
      ipAddress,
      userAgent,
    });

    return doc;
  }

  static async getDocumentById(documentId: string, actor: AuthUser): Promise<IDocument> {
    const doc = await DocumentModel.findById(documentId);
    if (!doc) {
      const err: any = new Error('Document not found');
      err.statusCode = 404;
      throw err;
    }

    // Tenant / Role Authorization Guard (Anti-IDOR)
    await this.verifyDocumentAccess(doc, actor);

    return doc;
  }

  static async downloadDocument(
    documentId: string,
    actor: AuthUser,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ buffer: Buffer; document: IDocument }> {
    const doc = await this.getDocumentById(documentId, actor);

    const storageProvider = StorageService.getProvider();
    const buffer = await storageProvider.getFile(doc.storageKey);

    // Audit Download
    await AuditLog.create({
      actorUserId: actor.userId,
      actorId: actor.userId,
      actorEmail: actor.email,
      action: 'document.download',
      entityType: 'Document',
      entityId: doc._id,
      after: { originalName: doc.originalName, storageKey: doc.storageKey },
      ipAddress,
      userAgent,
    });

    return { buffer, document: doc };
  }

  static async updateDocumentStatus(
    documentId: string,
    status: DocumentStatus,
    rejectionReason: string | undefined,
    actor: AuthUser,
    ipAddress?: string,
    userAgent?: string
  ): Promise<IDocument> {
    // Students can NEVER alter document verification status
    if (
      actor.roles.includes(UserRole.STUDENT) ||
      actor.roles.includes(UserRole.INDEPENDENT_APPLICANT)
    ) {
      const err: any = new Error('Students are strictly forbidden from self-verifying documents.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN_SELF_VERIFICATION';
      throw err;
    }

    const doc = await this.getDocumentById(documentId, actor);

    if (status === DocumentStatus.REJECTED && !rejectionReason?.trim()) {
      const err: any = new Error('A rejection reason is required when rejecting a document.');
      err.statusCode = 400;
      err.code = 'REJECTION_REASON_REQUIRED';
      throw err;
    }

    const oldStatus = doc.status;
    doc.status = status;
    doc.verifiedBy = actor.userId as any;
    doc.verifiedAt = new Date();
    if (status === DocumentStatus.REJECTED) {
      doc.rejectionReason = rejectionReason?.trim();
    } else {
      doc.rejectionReason = undefined;
    }

    await doc.save();

    // Audit status change
    const actionName =
      status === DocumentStatus.VERIFIED
        ? 'document.verify'
        : status === DocumentStatus.REJECTED
        ? 'document.reject'
        : 'document.review';

    await AuditLog.create({
      actorUserId: actor.userId,
      actorId: actor.userId,
      actorEmail: actor.email,
      action: actionName,
      entityType: 'Document',
      entityId: doc._id,
      before: { status: oldStatus },
      after: { status: doc.status, rejectionReason: doc.rejectionReason },
      ipAddress,
      userAgent,
    });

    return doc;
  }

  static async listDocuments(
    query: {
      page?: number;
      limit?: number;
      type?: string;
      status?: string;
      search?: string;
      studentId?: string;
      applicationId?: string;
      universityId?: string;
      organizationId?: string;
    },
    actor: AuthUser
  ) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter: any = {};

    // 1. Apply user role tenant boundaries
    if (actor.roles.includes(UserRole.SUPER_ADMIN) || actor.roles.includes(UserRole.AZAAM_STAFF)) {
      // Global admin can view all or filter by requested params
      if (query.studentId) filter.studentId = query.studentId;
      if (query.applicationId) filter.applicationId = query.applicationId;
      if (query.universityId) filter.universityId = query.universityId;
      if (query.organizationId) filter.organizationId = query.organizationId;
    } else if (
      actor.roles.includes(UserRole.STUDENT) ||
      actor.roles.includes(UserRole.INDEPENDENT_APPLICANT)
    ) {
      // Student can ONLY view their own uploaded documents
      filter.$or = [
        { uploadedBy: actor.userId },
        ...(actor.studentId ? [{ studentId: actor.studentId }, { ownerId: actor.studentId }] : []),
      ];
    } else if (
      actor.roles.includes(UserRole.UNIVERSITY_ADMIN) ||
      actor.roles.includes(UserRole.UNIVERSITY_STAFF)
    ) {
      // University restricted to university scope
      if (actor.universityId) {
        filter.universityId = actor.universityId;
      }
    } else if (
      actor.roles.includes(UserRole.ORGANIZATION_ADMIN) ||
      actor.roles.includes(UserRole.ORGANIZATION_STAFF)
    ) {
      // Organization restricted to healthcare organization scope
      if (actor.organizationId) {
        filter.organizationId = actor.organizationId;
      }
    } else if (actor.roles.includes(UserRole.CLINICAL_SUPERVISOR)) {
      // Clinical Supervisor: get assigned students
      const supervisor = await ClinicalSupervisor.findOne({ userId: actor.userId });
      if (supervisor) {
        const attachments = await ClinicalAttachment.find({ supervisorId: supervisor._id });
        const studentIds = attachments.map(a => a.studentId);
        filter.studentId = { $in: studentIds };
      } else {
        filter.uploadedBy = actor.userId;
      }
    }

    if (query.type) filter.type = query.type.toUpperCase();
    if (query.status) filter.status = query.status.toUpperCase();

    if (query.search) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { originalName: searchRegex },
        { fileName: searchRegex },
        { type: searchRegex },
      ];
    }

    const [documents, total] = await Promise.all([
      DocumentModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('uploadedBy', 'firstName lastName email roles')
        .populate('studentId', 'studentNumber programme')
        .populate('verifiedBy', 'firstName lastName email'),
      DocumentModel.countDocuments(filter),
    ]);

    return {
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  // Mandatory anti-IDOR helper for Document Access
  private static async verifyDocumentAccess(doc: IDocument, actor: AuthUser): Promise<void> {
    if (actor.roles.includes(UserRole.SUPER_ADMIN) || actor.roles.includes(UserRole.AZAAM_STAFF)) {
      return; // Global access
    }

    // Student access rule
    if (
      actor.roles.includes(UserRole.STUDENT) ||
      actor.roles.includes(UserRole.INDEPENDENT_APPLICANT)
    ) {
      const isUploader = doc.uploadedBy.toString() === actor.userId.toString();
      const isStudentOwner =
        actor.studentId &&
        (doc.studentId?.toString() === actor.studentId.toString() ||
          doc.ownerId?.toString() === actor.studentId.toString());

      if (isUploader || isStudentOwner) {
        return;
      }

      const err: any = new Error('IDOR violation: You do not have permission to access another student\'s document.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN_IDOR';
      throw err;
    }

    // University staff access rule
    if (
      actor.roles.includes(UserRole.UNIVERSITY_ADMIN) ||
      actor.roles.includes(UserRole.UNIVERSITY_STAFF)
    ) {
      if (
        actor.universityId &&
        doc.universityId &&
        doc.universityId.toString() === actor.universityId.toString()
      ) {
        return;
      }

      // Check if student belongs to university
      if (doc.studentId && actor.universityId) {
        const student = await Student.findById(doc.studentId);
        if (student && student.universityId?.toString() === actor.universityId.toString()) {
          return;
        }
      }

      const err: any = new Error('Tenant isolation violation: Cannot access document outside your university scope.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN_TENANT';
      throw err;
    }

    // Organization staff access rule
    if (
      actor.roles.includes(UserRole.ORGANIZATION_ADMIN) ||
      actor.roles.includes(UserRole.ORGANIZATION_STAFF)
    ) {
      if (
        actor.organizationId &&
        doc.organizationId &&
        doc.organizationId.toString() === actor.organizationId.toString()
      ) {
        return;
      }

      const err: any = new Error('Tenant isolation violation: Cannot access document outside your organization scope.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN_TENANT';
      throw err;
    }

    // Clinical Supervisor access rule
    if (actor.roles.includes(UserRole.CLINICAL_SUPERVISOR)) {
      if (doc.uploadedBy.toString() === actor.userId.toString()) {
        return;
      }
      if (doc.studentId) {
        const supervisor = await ClinicalSupervisor.findOne({ userId: actor.userId });
        if (supervisor) {
          const hasAttachment = await ClinicalAttachment.exists({
            supervisorId: supervisor._id,
            studentId: doc.studentId,
          });
          if (hasAttachment) return;
        }
      }

      const err: any = new Error('Access denied: You are not assigned to supervise this student.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN_SUPERVISOR_SCOPE';
      throw err;
    }
  }
}
