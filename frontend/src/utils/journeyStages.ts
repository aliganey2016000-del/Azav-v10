import { RealDataStore, RealTraineeDocument, RealTraineeComment, RealTraineeStage } from '../services/realDataStore';
import { AdminJourneyStage } from '../types/admin.types';

export type UiStatus = 'COMPLETED' | 'CURRENT' | 'PENDING' | 'REJECTED' | 'CORRECTION_REQUESTED';
export type StageAction = 'APPROVE' | 'REQUEST_CORRECTION' | 'REJECT';

export type DisplayComment = { id: string; author: 'AZAAM' | 'UNIVERSITY'; authorName?: string; message: string; createdAt: string };

export type DisplayStage = {
  key: string;
  title: string;
  description: string;
  uiStatus: UiStatus;
  reason?: string;
  actionable: boolean;
  hasDocument: boolean;
  documents?: DisplayDocument[];
  comments?: DisplayComment[];
};

export type DisplayDocument = { id: string; name: string; type: string; dataUrl?: string; mimeType?: string; uploadedAt?: string; status?: string };

export const DOCUMENT_CHAT_STAGE_KEYS = ['PERMIT', 'VISA', 'RESIDENCE'] as const;
export const isDocumentChatStage = (stageKey: string) =>
  (DOCUMENT_CHAT_STAGE_KEYS as readonly string[]).includes(stageKey);

export const STATUS_LABEL: Record<UiStatus, string> = {
  COMPLETED: 'COMPLETED',
  CURRENT: 'IN PROGRESS',
  PENDING: 'UPCOMING',
  REJECTED: 'REJECTED',
  CORRECTION_REQUESTED: 'CORRECTION REQUESTED',
};

export const STATUS_STYLE: Record<UiStatus, string> = {
  COMPLETED: 'border-emerald-200 bg-emerald-50/60',
  CURRENT: 'border-amber-300 bg-amber-50 shadow-sm',
  PENDING: 'border-slate-200 bg-slate-50/70',
  REJECTED: 'border-red-300 bg-red-50 shadow-sm',
  CORRECTION_REQUESTED: 'border-orange-300 bg-orange-50 shadow-sm',
};

export const BADGE_STYLE: Record<UiStatus, string> = {
  COMPLETED: 'bg-emerald-100 text-emerald-800',
  CURRENT: 'bg-amber-100 text-amber-800',
  PENDING: 'bg-slate-200 text-slate-600',
  REJECTED: 'bg-red-100 text-red-800',
  CORRECTION_REQUESTED: 'bg-orange-100 text-orange-800',
};

export const isMockId = (studentId: string) => !/^[0-9a-fA-F]{24}$/.test(studentId);

export const MOCK_STAGE_DEFS: { stageKey: string; title: string; description: string }[] = [
  { stageKey: 'AZAAM_REVIEW', title: 'AZAAM Review & Approval', description: 'AZAAM verifies submitted documents and may Approve, Reject or Request Correction.' },
  { stageKey: 'PERMIT', title: 'Permit / Host Acceptance Letter', description: 'Issued after AZAAM approval by the host institution.' },
  { stageKey: 'VISA', title: 'Entry Visa', description: 'Entry visa processing follows host acceptance.' },
  { stageKey: 'RESIDENCE', title: 'Residence Visa', description: 'Residence permit/visa is processed by AZAAM.' },
  { stageKey: 'TRANSPORT', title: 'Travel & Transportation', description: 'AZAAM confirms arrival/transport after the student reaches the destination.' },
  { stageKey: 'PLACEMENT', title: 'Hospital Placement', description: 'AZAAM assigns the approved teaching hospital and department.' },
  { stageKey: 'TRAINING', title: 'Clinical Training', description: 'Attendance, logbook and supervisor evaluation during placement.' },
  { stageKey: 'COMPLETION', title: 'Completion & Certificate', description: 'Final evaluation and certificate are completed at the end of training.' },
];

export const mapApplicationStatusToStageStatus = (status?: string): AdminJourneyStage['status'] => {
  if (status === 'ACCEPTED') return 'COMPLETED';
  if (status === 'REJECTED') return 'REJECTED';
  if (status === 'CORRECTION_REQUESTED') return 'CORRECTION_REQUESTED';
  return 'CURRENT';
};

// Lazily initializes and returns a trainee's persisted per-stage records,
// migrating legacy trainees that only had a single `applicationStatus`.
const ensureTraineeStages = (studentId: string): RealTraineeStage[] => {
  const trainees = RealDataStore.getTrainees();
  const trainee = trainees.find((t) => t.id === studentId);
  if (trainee?.stages && trainee.stages.length === MOCK_STAGE_DEFS.length) {
    return trainee.stages;
  }

  const initialStatus = mapApplicationStatusToStageStatus(trainee?.applicationStatus);
  const stages: RealTraineeStage[] = MOCK_STAGE_DEFS.map((def, i) => ({
    stageKey: def.stageKey,
    status: i === 0 ? (initialStatus as RealTraineeStage['status']) : 'LOCKED',
    reason: i === 0 ? trainee?.reviewReason : undefined,
  }));
  RealDataStore.updateTrainee(studentId, { stages });
  return stages;
};

const toDisplayDocs = (docs?: RealTraineeDocument[]): DisplayDocument[] =>
  (docs || []).map((d) => ({ id: d.id, name: d.name, type: d.type, dataUrl: d.dataUrl }));

export const loadMockJourney = (studentId: string): { stages: AdminJourneyStage[]; documents: DisplayDocument[] } => {
  const trainee = RealDataStore.getTrainees().find((t) => t.id === studentId);
  const traineeStages = ensureTraineeStages(studentId);
  const stages = MOCK_STAGE_DEFS.map((def, i) => {
    const record = traineeStages[i];
    return {
      stageKey: def.stageKey,
      order: i,
      status: record?.status || 'LOCKED',
      reason: record?.reason,
      actedAt: record?.actedAt,
      title: def.title,
      description: def.description,
      documents: toDisplayDocs(record?.documents),
      comments: (record?.comments || []) as DisplayComment[],
    };
  });
  const documents = toDisplayDocs(trainee?.documents);
  return { stages, documents };
};

export const actOnMockStage = (
  studentId: string,
  stageKey: string,
  action: StageAction,
  reason: string | undefined,
  extra?: { documents?: RealTraineeDocument[] }
): { stages: AdminJourneyStage[]; documents: DisplayDocument[] } => {
  const stages = ensureTraineeStages(studentId).map((s) => ({ ...s }));
  const index = stages.findIndex((s) => s.stageKey === stageKey);
  if (index === -1) throw new Error('Unknown journey stage');

  const stage = stages[index];
  const toStatus: RealTraineeStage['status'] =
    action === 'APPROVE' ? 'COMPLETED' : action === 'REQUEST_CORRECTION' ? 'CORRECTION_REQUESTED' : 'REJECTED';

  stage.status = toStatus;
  stage.reason = toStatus === 'COMPLETED' ? undefined : reason?.trim();
  stage.actedAt = new Date().toISOString();
  if (extra?.documents?.length) stage.documents = [...(stage.documents || []), ...extra.documents];

  if (toStatus === 'COMPLETED' && stages[index + 1]?.status === 'LOCKED') {
    stages[index + 1].status = 'CURRENT';
  }

  const updates: Parameters<typeof RealDataStore.updateTrainee>[1] = { stages };
  if (stageKey === 'AZAAM_REVIEW') {
    const applicationStatus = toStatus === 'COMPLETED' ? 'ACCEPTED' : toStatus;
    updates.applicationStatus = applicationStatus as any;
    updates.reviewReason = stage.reason;
    updates.reviewedAt = stage.actedAt;
  }
  RealDataStore.updateTrainee(studentId, updates);

  return loadMockJourney(studentId);
};

// Attaches a document to a stage without changing its approval status
// (used when AZAAM or the university needs to add a file outside of an approve/reject action).
export const addMockStageDocument = (
  studentId: string,
  stageKey: string,
  documents: RealTraineeDocument[]
): { stages: AdminJourneyStage[]; documents: DisplayDocument[] } => {
  const stages = ensureTraineeStages(studentId).map((s) => ({ ...s }));
  const stage = stages.find((s) => s.stageKey === stageKey);
  if (!stage) throw new Error('Unknown journey stage');
  stage.documents = [...(stage.documents || []), ...documents];
  RealDataStore.updateTrainee(studentId, { stages });
  return loadMockJourney(studentId);
};

export const addMockStageComment = (
  studentId: string,
  stageKey: string,
  author: 'AZAAM' | 'UNIVERSITY',
  authorName: string | undefined,
  message: string
): { stages: AdminJourneyStage[]; documents: DisplayDocument[] } => {
  const stages = ensureTraineeStages(studentId).map((s) => ({ ...s }));
  const stage = stages.find((s) => s.stageKey === stageKey);
  if (!stage) throw new Error('Unknown journey stage');
  const comment: RealTraineeComment = {
    id: `CMT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    author,
    authorName,
    message: message.trim(),
    createdAt: new Date().toISOString(),
  };
  stage.comments = [...(stage.comments || []), comment];
  RealDataStore.updateTrainee(studentId, { stages });
  return loadMockJourney(studentId);
};

export const buildDisplayStages = (
  documents: DisplayDocument[],
  azaamStages: AdminJourneyStage[],
  canAct: boolean
): DisplayStage[] => {
  const docsSubmitted = documents.length > 0;
  const list: DisplayStage[] = [
    {
      key: 'NOMINATION',
      title: 'Nomination',
      description: 'Student nominated by the university and submitted to AZAAM.',
      uiStatus: 'COMPLETED',
      actionable: false,
      hasDocument: false,
    },
    {
      key: 'DOCUMENTS_SUBMITTED',
      title: 'Documents Submitted',
      description: docsSubmitted ? `${documents.length} supporting document(s) received.` : 'Waiting for required supporting documents.',
      uiStatus: docsSubmitted ? 'COMPLETED' : 'CURRENT',
      actionable: false,
      hasDocument: false,
    },
  ];
  azaamStages.forEach((s) => {
    const uiStatus: UiStatus = s.status === 'LOCKED' ? 'PENDING' : (s.status as UiStatus);
    list.push({
      key: s.stageKey,
      title: s.title,
      description: s.description,
      uiStatus,
      reason: s.reason,
      // Once a stage has started, AZAAM can (re-)set its status any time new documents come in,
      // even after it was already approved/completed.
      actionable: canAct && uiStatus !== 'PENDING' && !isDocumentChatStage(s.stageKey),
      hasDocument: true,
      documents: s.documents,
      comments: s.comments,
    });
  });
  return list;
};

// --- Notifications: unread stage-comment counts, tracked per role via localStorage ---

const LAST_SEEN_KEY = (role: 'AZAAM' | 'UNIVERSITY') => `azaam_comments_last_seen_${role}`;

export type FlatComment = DisplayComment & { studentId: string; studentName: string; stageKey: string; stageTitle: string };

export const getAllStageComments = (): FlatComment[] => {
  const trainees = RealDataStore.getTrainees();
  const flat: FlatComment[] = [];
  trainees.forEach((t) => {
    (t.stages || []).forEach((s) => {
      const def = MOCK_STAGE_DEFS.find((d) => d.stageKey === s.stageKey);
      (s.comments || []).forEach((c) => {
        flat.push({ ...c, studentId: t.id, studentName: t.studentName, stageKey: s.stageKey, stageTitle: def?.title || s.stageKey });
      });
    });
  });
  return flat.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

export const getUnreadComments = (viewerRole: 'AZAAM' | 'UNIVERSITY'): FlatComment[] => {
  const lastSeen = localStorage.getItem(LAST_SEEN_KEY(viewerRole)) || '';
  const otherRole = viewerRole === 'AZAAM' ? 'UNIVERSITY' : 'AZAAM';
  return getAllStageComments().filter((c) => c.author === otherRole && c.createdAt > lastSeen);
};

export const markCommentsSeen = (viewerRole: 'AZAAM' | 'UNIVERSITY') => {
  localStorage.setItem(LAST_SEEN_KEY(viewerRole), new Date().toISOString());
};
