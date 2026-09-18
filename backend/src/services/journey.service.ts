import { Student } from '../models/Student.js';
import { User } from '../models/User.js';
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
import { AuthUser, UserRole } from '../types/index.js';

const STAGE_LABELS: Record<JourneyStageKey, { title: string; description: string }> = {
  [JourneyStageKey.AZAAM_REVIEW]: {
    title: 'AZAAM Review & Approval',
    description: 'AZAAM verifies submitted documents and may Approve, Reject or Request Correction.',
  },
  [JourneyStageKey.PERMIT]: {
    title: 'Permit / Host Acceptance Letter',
    description: 'AZAAM uploads the host acceptance/permit document and shares progress updates with the university.',
  },
  [JourneyStageKey.VISA]: {
    title: 'Entry Visa',
    description: 'AZAAM uploads the entry visa document and shares visa-processing updates with the university.',
  },
  [JourneyStageKey.RESIDENCE]: {
    title: 'Residence Visa',
    description: 'AZAAM uploads the residence permit/visa document and shares updates with the university.',
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

const DOCUMENT_UPDATE_STAGES = new Set<JourneyStageKey>([
  JourneyStageKey.PERMIT,
  JourneyStageKey.VISA,
  JourneyStageKey.RESIDENCE,
]);

const isAzaamActor = (actor: AuthUser) =>
  actor.roles.includes(UserRole.SUPER_ADMIN) || actor.roles.includes(UserRole.AZAAM_STAFF);

const isUniversityActor = (actor: AuthUser) =>
  actor.roles.includes(UserRole.UNIVERSITY_ADMIN) || actor.roles.includes(UserRole.UNIVERSITY_STAFF);

const chatRoleFor = (actor: AuthUser): 'AZAAM' | 'UNIVERSITY' =>
  isAzaamActor(actor) ? 'AZAAM' : 'UNIVERSITY';

export class JourneyService {
  private static async assertStudentAccess(studentId: string, actor?: AuthUser) {
    const student = await Student.findById(studentId);
    if (!student) {
      const err: any = new Error('Student not found');
      err.statusCode = 404;
      throw err;
    }

    if (actor && isUniversityActor(actor)) {
      const sameUniversity =
        Boolean(actor.universityId) &&
        Boolean(student.universityId) &&
        student.universityId?.toString() === actor.universityId?.toString();

      if (!sameUniversity) {
        const err: any = new Error('You cannot access a student outside your university.');
        err.statusCode = 403;
        err.code = 'FORBIDDEN_TENANT';
        throw err;
      }
    }

    return student;
  }

  private static async authorName(actor: AuthUser): Promise<string> {
    const user = await User.findById(actor.userId).select('firstName lastName').lean();
    const fullName = user ? [user.firstName, user.lastName].filter(Boolean).join(' ').trim() : '';
    return fullName || actor.email;
  }

  private static async ensureMilestones(studentId: string, docsCount: number) {
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

    return milestones;
  }

  private static async unlockNext(studentId: string, currentOrder: number) {
    const next = await JourneyMilestone.findOne({ studentId, order: currentOrder + 1 });
    if (next && next.status === JourneyStageStatus.LOCKED) {
      next.status = JourneyStageStatus.CURRENT;
      await next.save();
    }
  }

  static async getJourney(studentId: string, actor?: AuthUser) {
    await this.assertStudentAccess(studentId, actor);

    const docsCount = await DocumentModel.countDocuments({
      $or: [{ studentId }, { ownerId: studentId }],
    });

    await this.ensureMilestones(studentId, docsCount);

    const milestones: any[] = await JourneyMilestone.find({ studentId })
      .sort({ order: 1 })
      .populate('documents', 'originalName type mimeType createdAt status')
      .lean();

    const stages = milestones.map((m: any) => ({
      stageKey: m.stageKey,
      order: m.order,
      status: m.status,
      reason: m.reason,
      actedBy: m.actedBy,
      actedAt: m.actedAt,
      history: m.history,
      title: STAGE_LABELS[m.stageKey as JourneyStageKey].title,
      description: STAGE_LABELS[m.stageKey as JourneyStageKey].description,
      documents: (m.documents || []).map((doc: any) => ({
        id: String(doc._id),
        name: doc.originalName,
        type: doc.type,
        mimeType: doc.mimeType,
        uploadedAt: doc.createdAt,
        status: doc.status,
      })),
      comments: (m.comments || []).map((comment: any) => ({
        id: String(comment._id),
        author: comment.author,
        authorName: comment.authorName,
        message: comment.message,
        readBy: comment.readBy || [],
        createdAt: comment.createdAt,
      })),
      updateMode: DOCUMENT_UPDATE_STAGES.has(m.stageKey as JourneyStageKey) ? 'DOCUMENT_CHAT' : 'APPROVAL',
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

    if (DOCUMENT_UPDATE_STAGES.has(stageKey)) {
      const err: any = new Error('This stage does not use Approve/Reject. Upload the stage document and post an update instead.');
      err.statusCode = 400;
      err.code = 'DOCUMENT_UPDATE_STAGE';
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

    await this.getJourney(studentId, actor);

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
      await this.unlockNext(studentId, milestone.order);
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

    return this.getJourney(studentId, actor);
  }

  static async addStageUpdate(
    studentId: string,
    stageKey: JourneyStageKey,
    input: { documentIds?: string[]; comment?: string },
    actor: AuthUser
  ) {
    if (!isAzaamActor(actor)) {
      const err: any = new Error('Only AZAAM staff can upload official documents to this stage.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN_STAGE_UPDATE';
      throw err;
    }

    if (!DOCUMENT_UPDATE_STAGES.has(stageKey)) {
      const err: any = new Error('This endpoint is only for Permit, Entry Visa and Residence Visa updates.');
      err.statusCode = 400;
      err.code = 'INVALID_UPDATE_STAGE';
      throw err;
    }

    const documentIds = Array.from(new Set((input.documentIds || []).filter(Boolean)));
    const comment = input.comment?.trim();

    if (documentIds.length === 0 && !comment) {
      const err: any = new Error('Upload a document or enter an update comment.');
      err.statusCode = 400;
      err.code = 'EMPTY_STAGE_UPDATE';
      throw err;
    }

    await this.getJourney(studentId, actor);

    const milestone = await JourneyMilestone.findOne({ studentId, stageKey });
    if (!milestone) {
      const err: any = new Error('Journey stage not found for this student.');
      err.statusCode = 404;
      throw err;
    }

    if (milestone.status === JourneyStageStatus.LOCKED) {
      const err: any = new Error('This stage is not open yet.');
      err.statusCode = 400;
      err.code = 'STAGE_LOCKED';
      throw err;
    }

    if (documentIds.length > 0) {
      const docs = await DocumentModel.find({
        _id: { $in: documentIds },
        $or: [{ studentId }, { ownerId: studentId }],
      }).select('_id');

      if (docs.length !== documentIds.length) {
        const err: any = new Error('One or more uploaded documents do not belong to this student.');
        err.statusCode = 400;
        err.code = 'INVALID_STAGE_DOCUMENT';
        throw err;
      }

      const existing = new Set((milestone.documents || []).map((id: any) => id.toString()));
      docs.forEach((doc: any) => existing.add(doc._id.toString()));
      milestone.documents = Array.from(existing) as any;

      if (milestone.status !== JourneyStageStatus.COMPLETED) {
        milestone.status = JourneyStageStatus.COMPLETED;
        milestone.actedBy = actor.userId as any;
        milestone.actedAt = new Date();
      }
    }

    if (comment) {
      milestone.comments.push({
        author: 'AZAAM',
        authorUserId: actor.userId as any,
        authorName: await this.authorName(actor),
        message: comment,
        readBy: ['AZAAM'],
        createdAt: new Date(),
      } as any);
    }

    await milestone.save();

    if (documentIds.length > 0) {
      await this.unlockNext(studentId, milestone.order);
    }

    await AuditLog.create({
      actorUserId: actor.userId,
      actorId: actor.userId,
      actorEmail: actor.email,
      action: 'journey.stage_update',
      entityType: 'JourneyMilestone',
      entityId: milestone._id,
      after: { stageKey, documentIds, comment: comment || undefined, status: milestone.status },
    });

    return this.getJourney(studentId, actor);
  }

  static async addComment(
    studentId: string,
    stageKey: JourneyStageKey,
    message: string,
    actor: AuthUser
  ) {
    if (!DOCUMENT_UPDATE_STAGES.has(stageKey)) {
      const err: any = new Error('Chat is available on Permit, Entry Visa and Residence Visa stages.');
      err.statusCode = 400;
      err.code = 'CHAT_NOT_AVAILABLE';
      throw err;
    }

    const cleanMessage = message?.trim();
    if (!cleanMessage) {
      const err: any = new Error('Comment message is required.');
      err.statusCode = 400;
      err.code = 'COMMENT_REQUIRED';
      throw err;
    }

    if (!isAzaamActor(actor) && !isUniversityActor(actor)) {
      const err: any = new Error('Your role cannot post journey comments.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN_COMMENT';
      throw err;
    }

    await this.getJourney(studentId, actor);

    const milestone = await JourneyMilestone.findOne({ studentId, stageKey });
    if (!milestone) {
      const err: any = new Error('Journey stage not found.');
      err.statusCode = 404;
      throw err;
    }

    if (milestone.status === JourneyStageStatus.LOCKED) {
      const err: any = new Error('This stage is not open yet.');
      err.statusCode = 400;
      err.code = 'STAGE_LOCKED';
      throw err;
    }

    milestone.comments.push({
      author: isAzaamActor(actor) ? 'AZAAM' : 'UNIVERSITY',
      authorUserId: actor.userId as any,
      authorName: await this.authorName(actor),
      message: cleanMessage,
      readBy: [chatRoleFor(actor)],
      createdAt: new Date(),
    } as any);

    await milestone.save();

    await AuditLog.create({
      actorUserId: actor.userId,
      actorId: actor.userId,
      actorEmail: actor.email,
      action: 'journey.comment',
      entityType: 'JourneyMilestone',
      entityId: milestone._id,
      after: { stageKey, message: cleanMessage },
    });

    return this.getJourney(studentId, actor);
  }

  static async getChat(studentId: string, actor: AuthUser) {
    await this.assertStudentAccess(studentId, actor);
    const viewerRole = chatRoleFor(actor);

    const milestones: any[] = await JourneyMilestone.find({
      studentId,
      stageKey: { $in: Array.from(DOCUMENT_UPDATE_STAGES) },
    })
      .sort({ order: 1 })
      .lean();

    const messages = milestones
      .flatMap((m: any) =>
        (m.comments || []).map((comment: any) => ({
          id: String(comment._id),
          stageKey: m.stageKey,
          stageTitle: STAGE_LABELS[m.stageKey as JourneyStageKey].title,
          author: comment.author,
          authorName: comment.authorName,
          message: comment.message,
          readBy: comment.readBy || [],
          createdAt: comment.createdAt,
        }))
      )
      .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const unreadCount = messages.filter(
      (m: any) => m.author !== viewerRole && !(m.readBy || []).includes(viewerRole)
    ).length;

    return {
      viewerRole,
      unreadCount,
      messages,
      availableStages: milestones.map((m: any) => ({
        stageKey: m.stageKey,
        title: STAGE_LABELS[m.stageKey as JourneyStageKey].title,
        status: m.status,
        enabled: m.status !== JourneyStageStatus.LOCKED,
      })),
    };
  }

  static async markChatRead(studentId: string, actor: AuthUser) {
    await this.assertStudentAccess(studentId, actor);
    const viewerRole = chatRoleFor(actor);

    const milestones = await JourneyMilestone.find({
      studentId,
      stageKey: { $in: Array.from(DOCUMENT_UPDATE_STAGES) },
    });

    for (const milestone of milestones) {
      let changed = false;
      for (const comment of milestone.comments as any[]) {
        const readBy = Array.isArray(comment.readBy) ? comment.readBy : [];
        if (comment.author !== viewerRole && !readBy.includes(viewerRole)) {
          comment.readBy = [...readBy, viewerRole];
          changed = true;
        }
      }
      if (changed) {
        milestone.markModified('comments');
        await milestone.save();
      }
    }

    return this.getChat(studentId, actor);
  }
}
