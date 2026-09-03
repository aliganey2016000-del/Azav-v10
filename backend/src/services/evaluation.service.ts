import { Evaluation } from '../models/Evaluation.js';
import { ClinicalAttachment, Placement } from '../models/Placement.js';
import { ApplicationService } from './application.service.js';
import { AuditLog } from '../models/Notification.js';
import { EvaluationType, ClinicalAttachmentStatus, PlacementStatus, ApplicationStatus } from '../types/index.js';

export class EvaluationService {
  static async submitEvaluation(supervisorUserId: string, data: {
    attachmentId: string;
    studentId: string;
    supervisorId: string;
    type: EvaluationType;
    clinicalCompetency: number;
    professionalism: number;
    patientCommunication: number;
    medicalKnowledge: number;
    comments?: string;
  }) {
    const attachment = await ClinicalAttachment.findById(data.attachmentId);
    if (!attachment) {
      const err: any = new Error('Clinical attachment record not found');
      err.statusCode = 404;
      throw err;
    }

    // Check duplicate evaluation of the same type
    const existing = await Evaluation.findOne({
      attachmentId: data.attachmentId,
      type: data.type,
    });

    if (existing) {
      const err: any = new Error(`A ${data.type} evaluation has already been submitted for this clinical attachment.`);
      err.statusCode = 409;
      err.code = 'DUPLICATE_EVALUATION';
      throw err;
    }

    const totalPoints = data.clinicalCompetency + data.professionalism + data.patientCommunication + data.medicalKnowledge;
    const overallScore = Math.round((totalPoints / 20) * 100);

    const evaluation = new Evaluation({
      attachmentId: data.attachmentId,
      studentId: data.studentId,
      supervisorId: data.supervisorId,
      type: data.type,
      clinicalCompetency: data.clinicalCompetency,
      professionalism: data.professionalism,
      patientCommunication: data.patientCommunication,
      medicalKnowledge: data.medicalKnowledge,
      overallScore,
      comments: data.comments,
      status: 'SUBMITTED',
      submittedAt: new Date(),
    });

    await evaluation.save();

    // If FINAL evaluation is submitted, trigger completion workflow
    if (data.type === EvaluationType.FINAL && overallScore >= 60) {
      attachment.status = ClinicalAttachmentStatus.COMPLETED;
      await attachment.save();

      const placement = await Placement.findById(attachment.placementId);
      if (placement) {
        placement.status = PlacementStatus.COMPLETED;
        await placement.save();

        await ApplicationService.updateStatus(
          placement.applicationId.toString(),
          ApplicationStatus.COMPLETED,
          supervisorUserId,
          'Clinical attachment and final evaluation successfully completed'
        );
      }
    }

    await AuditLog.create({
      actorUserId: supervisorUserId,
      action: 'evaluation.submit',
      entityType: 'Evaluation',
      entityId: evaluation._id,
      after: { type: data.type, overallScore },
    });

    return evaluation;
  }

  static async getEvaluations(attachmentId: string) {
    return Evaluation.find({ attachmentId }).sort({ createdAt: -1 });
  }
}
