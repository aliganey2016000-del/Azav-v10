import { Certificate, ICertificate } from '../models/Certificate.js';
import { ClinicalAttachment, Placement } from '../models/Placement.js';
import { ApplicationService } from './application.service.js';
import { AuditLog } from '../models/Notification.js';
import { CertificateStatus, ClinicalAttachmentStatus, ApplicationStatus, AuthUser, UserRole } from '../types/index.js';

export class CertificateService {
  static async issueCertificate(actorUserId: string, attachmentId: string, ipAddress?: string, userAgent?: string) {
    const attachment = await ClinicalAttachment.findById(attachmentId)
      .populate({ path: 'studentId', populate: { path: 'userId', select: 'firstName lastName' } })
      .populate('organizationId');

    if (!attachment) {
      const err: any = new Error('Clinical attachment record not found');
      err.statusCode = 404;
      throw err;
    }

    if (attachment.status !== ClinicalAttachmentStatus.COMPLETED) {
      const err: any = new Error('Certificate can only be issued for completed clinical attachments.');
      err.statusCode = 400;
      err.code = 'ATTACHMENT_NOT_COMPLETED';
      throw err;
    }

    const existingCert = await Certificate.findOne({ attachmentId });
    if (existingCert) {
      return existingCert;
    }

    const certNum = 'AZAAM-CERT-' + Math.floor(100000 + Math.random() * 900000);
    const verifyCode = 'AZ-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    const certificate = new Certificate({
      attachmentId: attachment._id,
      studentId: attachment.studentId,
      organizationId: attachment.organizationId,
      certificateNumber: certNum,
      verificationCode: verifyCode,
      issueDate: new Date(),
      status: CertificateStatus.ISSUED,
    });

    await certificate.save();

    const placement = await Placement.findById(attachment.placementId);
    if (placement) {
      await ApplicationService.updateStatus(
        placement.applicationId.toString(),
        ApplicationStatus.CERTIFICATE_ISSUED,
        actorUserId,
        'Digital Certificate issued'
      );
    }

    await AuditLog.create({
      actorUserId,
      actorId: actorUserId,
      action: 'certificate.issue',
      entityType: 'Certificate',
      entityId: certificate._id,
      after: { certificateNumber: certNum, verificationCode: verifyCode },
      ipAddress,
      userAgent,
    });

    return certificate;
  }

  static async revokeCertificate(
    certificateId: string,
    reason: string,
    actor: AuthUser,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ICertificate> {
    if (!reason || !reason.trim()) {
      const err: any = new Error('A valid revocation reason is required.');
      err.statusCode = 400;
      err.code = 'REVOCATION_REASON_REQUIRED';
      throw err;
    }

    const cert = await Certificate.findById(certificateId);
    if (!cert) {
      const err: any = new Error('Certificate not found');
      err.statusCode = 404;
      throw err;
    }

    if (cert.status === CertificateStatus.REVOKED) {
      const err: any = new Error('Certificate is already revoked.');
      err.statusCode = 400;
      throw err;
    }

    // Tenant authorization check for organization admins
    if (actor.roles.includes(UserRole.ORGANIZATION_ADMIN) || actor.roles.includes(UserRole.ORGANIZATION_STAFF)) {
      if (!actor.organizationId || cert.organizationId.toString() !== actor.organizationId.toString()) {
        const err: any = new Error('Tenant isolation violation: Cannot revoke certificate outside your organization scope.');
        err.statusCode = 403;
        throw err;
      }
    }

    const previousStatus = cert.status;
    cert.status = CertificateStatus.REVOKED;
    cert.revokedAt = new Date();
    cert.revokedBy = actor.userId as any;
    cert.revocationReason = reason.trim();

    await cert.save();

    await AuditLog.create({
      actorUserId: actor.userId,
      actorId: actor.userId,
      actorEmail: actor.email,
      action: 'certificate.revoke',
      entityType: 'Certificate',
      entityId: cert._id,
      before: { status: previousStatus },
      after: { status: cert.status, revocationReason: cert.revocationReason },
      ipAddress,
      userAgent,
    });

    return cert;
  }

  static async listCertificates(query: {
    page?: number;
    limit?: number;
    status?: string;
    organizationId?: string;
    search?: string;
  }, actor: AuthUser) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (actor.roles.includes(UserRole.ORGANIZATION_ADMIN) || actor.roles.includes(UserRole.ORGANIZATION_STAFF)) {
      if (actor.organizationId) {
        filter.organizationId = actor.organizationId;
      }
    } else if (actor.roles.includes(UserRole.UNIVERSITY_ADMIN) || actor.roles.includes(UserRole.UNIVERSITY_STAFF)) {
      // University scope can view certificates of their students
      if (actor.universityId) {
        // We can filter by students belonging to university
      }
    } else if (actor.roles.includes(UserRole.STUDENT)) {
      if (actor.studentId) {
        filter.studentId = actor.studentId;
      }
    }

    if (query.status) {
      filter.status = query.status.toUpperCase();
    }
    if (query.organizationId && (actor.roles.includes(UserRole.SUPER_ADMIN) || actor.roles.includes(UserRole.AZAAM_STAFF))) {
      filter.organizationId = query.organizationId;
    }

    const [certificates, total] = await Promise.all([
      Certificate.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: 'studentId', populate: { path: 'userId', select: 'firstName lastName email' } })
        .populate('organizationId', 'name type')
        .populate('revokedBy', 'firstName lastName email'),
      Certificate.countDocuments(filter),
    ]);

    return {
      certificates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async verifyCertificatePublic(query: string) {
    const cleanQuery = query.trim().toUpperCase();
    const cert = await Certificate.findOne({
      $or: [{ certificateNumber: cleanQuery }, { verificationCode: cleanQuery }],
    })
      .populate({ path: 'studentId', populate: { path: 'userId', select: 'firstName lastName' } })
      .populate('organizationId', 'name type');

    if (!cert) {
      return {
        verified: false,
        message: 'No certificate found matching the provided reference or verification code.',
      };
    }

    // PRIVACY SAFE RESPONSE: Returns ONLY essential verification details!
    const studentUser: any = (cert.studentId as any)?.userId;
    const organization: any = cert.organizationId;

    return {
      verified: cert.status === CertificateStatus.ISSUED,
      certificateNumber: cert.certificateNumber,
      verificationCode: cert.verificationCode,
      recipientName: studentUser ? `${studentUser.firstName} ${studentUser.lastName}` : 'Medical Student',
      issuerOrganization: organization ? organization.name : 'AZAAM Healthcare Network',
      issueDate: cert.issueDate,
      status: cert.status,
      revokedAt: cert.revokedAt,
      revocationReason: cert.revocationReason,
      message:
        cert.status === CertificateStatus.ISSUED
          ? 'Valid Official AZAAM Clinical Attachment Certificate'
          : 'This certificate has been REVOKED by the issuing authority.',
    };
  }
}
