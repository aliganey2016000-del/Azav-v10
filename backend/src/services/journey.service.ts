import { Student } from '../models/Student.js';
import { DocumentModel } from '../models/Document.js';
import {
  JourneyMilestone,
  IJourneyMilestone,
  JourneyStageKey,
  JourneyStageStatus,
  JourneyStageAction,
  JOURNEY_STAGE_ORDER,
} from '../models/JourneyMilestone.js';
import { AuditLog } from '../models/Notification.js';
import { AuthUser } from '../types/index.js';

const STAGE_LABELS: Record<JourneyStageKey, { title: string; description: string }> = {
  [JourneyStageKey.AZAAM_REVIEW]: {
    title: 'AZAAM Review & Approval',
    description: 'AZAAM verifies submitted documents and may Approve, Reject or Request Correction.',
  },
  [JourneyStageKey.PERMIT]: {
    title: 'Permit / Host Acceptance Letter',
    description: 'Issued after AZAAM approval by the host institution.',
  },
  [JourneyStageKey.VISA]: {
    title: 'Entry Visa',
    description: 'Entry visa processing follows host acceptance.',
  },
  [JourneyStageKey.RESIDENCE]: {
    title: 'Residence Visa',
    description: 'Residence permit/visa is processed by AZAAM.',
  },
  [JourneyStageKey.TRANSPORT]: {
    title: 'Travel & Transportation',
    description: 'AZAAM confirms arrival/transport after the student reaches the destination.',
  },
  [JourneyStageKey.PLACEMENT]: {
    title: 'Hospital Placement',
    description: 'AZAAM assigns the approved teaching hospital and department.',
  },
  [JourneyStageKey.TRAINING]: {
    title: 'Clinical Training',
    description: 'Attendance, logbook and supervisor evaluation during placement.',
  },
  [JourneyStageKey.COMPLETION]: {
    title: 'Completion & Certificate',
    description: 'Final evaluation and certificate are completed at the end of training.',
  },
};

function assertStudentExists(studentId: string) {
  return Student.findById(studentId);
}

export class JourneyService {
  static async getJourney(studentId: string) {
    const student = await assertStudentExists(studentId);
    if (!student) {
      const err: any = new Error('Student not found');
      err.statusCode = 404;
      throw err;
    }

    const docsCount = await DocumentModel.countDocuments({
      $or: [{ studentId }, { ownerId: studentId }],
    });

    let milestones = await JourneyMilestone.find({ studentId }).sort({ order: 1 });

    if (milestones.length === 0) {
      const toCreate = JOURNEY_STAGE_ORDER.map((stageKey, index) => ({
        studentId,
        stageKey,
        order: index,
        status: index === 0 && docsCount > 0 ? JourneyStageStatus.CURRENT : JourneyStageStatus.LOCKED,
      }));
      await JourneyMilestone.insertMany(toCreate);
      milestones = await JourneyMilestone.find({ studentId }).sort({ order: 1 });
    } else if (docsCount > 0 && milestones[0].status === JourneyStageStatus.LOCKED) {
      milestones[0].status = JourneyStageStatus.CURRENT;
      await milestones[0].save();
    }

    const stages = milestones.map((m) => ({
      stageKey: m.stageKey,
      order: m.order,
      status: m.status,
      reason: m.reason,
      actedBy: m.actedBy,
      actedAt: m.actedAt,
      history: m.history,
      title: STAGE_LABELS[m.stageKey].title,
      description: STAGE_LABELS[m.stageKey].description,
    }));

    return {
      documentsSubmitted: docsCount > 0,
      documentsCount: docsCount,
      stages,
    };
  }

  static async actOnStage(
    studentId: string,
    stageKey: JourneyStageKey,
    action: JourneyStageAction,
    reason: string | undefined,
    actor: AuthUser
  ) {
    if (!JOURNEY_STAGE_ORDER.includes(stageKey)) {
      const err: any = new Error('Unknown journey stage');
      err.statusCode = 400;
      throw err;
    }

    if (
      (action === JourneyStageAction.REJECT || action === JourneyStageAction.REQUEST_CORRECTION) &&
      !reason?.trim()
    ) {
      const err: any = new Error('A reason/comment is required for this action.');
      err.statusCode = 400;
      err.code = 'REASON_REQUIRED';
      throw err;
    }

    await this.getJourney(studentId); // ensures milestones exist

    const milestone = await JourneyMilestone.findOne({ studentId, stageKey });
    if (!milestone) {
      const err: any = new Error('Journey stage not found for this student');
      err.statusCode = 404;
      throw err;
    }

    if (milestone.status === JourneyStageStatus.LOCKED || milestone.status === JourneyStageStatus.COMPLETED) {
      const err: any = new Error('This stage is not currently actionable.');
      err.statusCode = 400;
      err.code = 'STAGE_NOT_ACTIONABLE';
      throw err;
    }

    const fromStatus = milestone.status;
    let toStatus: JourneyStageStatus;
    if (action === JourneyStageAction.APPROVE) {
      toStatus = JourneyStageStatus.COMPLETED;
    } else if (action === JourneyStageAction.REQUEST_CORRECTION) {
      toStatus = JourneyStageStatus.CORRECTION_REQUESTED;
    } else {
      toStatus = JourneyStageStatus.REJECTED;
    }

    milestone.status = toStatus;
    milestone.reason = toStatus === JourneyStageStatus.COMPLETED ? undefined : reason?.trim();
    milestone.actedBy = actor.userId as any;
    milestone.actedAt = new Date();
    milestone.history.push({
      action,
      fromStatus,
      toStatus,
      reason: reason?.trim(),
      actedBy: actor.userId as any,
      actedAt: new Date(),
    });

    await milestone.save();

    if (toStatus === JourneyStageStatus.COMPLETED) {
      const nextOrder = milestone.order + 1;
      const next = await JourneyMilestone.findOne({ studentId, order: nextOrder });
      if (next && next.status === JourneyStageStatus.LOCKED) {
        next.status = JourneyStageStatus.CURRENT;
        await next.save();
      }
    }

    await AuditLog.create({
      actorUserId: actor.userId,
      actorId: actor.userId,
      actorEmail: actor.email,
      action: `journey.${action.toLowerCase()}`,
      entityType: 'JourneyMilestone',
      entityId: milestone._id,
      before: { status: fromStatus },
      after: { status: toStatus, reason: milestone.reason },
    });

    return this.getJourney(studentId);
  }
}
