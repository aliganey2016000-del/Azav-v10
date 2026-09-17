import { RealDataStore, RealTraineeDocument, RealTraineeStage } from '../services/realDataStore';
import { AdminJourneyStage, AdminJourneyInvoice } from '../types/admin.types';

export type UiStatus = 'COMPLETED' | 'CURRENT' | 'PENDING' | 'REJECTED' | 'CORRECTION_REQUESTED';
export type StageAction = 'APPROVE' | 'REQUEST_CORRECTION' | 'REJECT';

export type DisplayStage = {
  key: string;
  title: string;
  description: string;
  uiStatus: UiStatus;
  reason?: string;
  actionable: boolean;
  hasInvoice: boolean;
  hasDocument: boolean;
  invoice?: AdminJourneyInvoice;
  documents?: DisplayDocument[];
  paymentProof?: DisplayDocument[];
};

export type DisplayDocument = { id: string; name: string; type: string; dataUrl?: string };

export const STATUS_LABEL: Record<UiStatus, string> = {
  COMPLETED: 'COMPLETED',
  CURRENT: 'PENDING AZAAM ACTION',
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

export const MOCK_STAGE_DEFS: { stageKey: string; title: string; description: string; hasInvoice: boolean; hasDocument: boolean }[] = [
  { stageKey: 'AZAAM_REVIEW', title: 'AZAAM Review & Approval', description: 'AZAAM verifies submitted documents and may Approve, Reject or Request Correction.', hasInvoice: false, hasDocument: false },
  { stageKey: 'PERMIT', title: 'Permit / Host Acceptance Letter', description: 'Issued after AZAAM approval by the host institution.', hasInvoice: true, hasDocument: true },
  { stageKey: 'VISA', title: 'Entry Visa', description: 'Entry visa processing follows host acceptance.', hasInvoice: true, hasDocument: true },
  { stageKey: 'RESIDENCE', title: 'Residence Visa', description: 'Residence permit/visa is processed by AZAAM.', hasInvoice: true, hasDocument: true },
  { stageKey: 'TRANSPORT', title: 'Travel & Transportation', description: 'AZAAM confirms arrival/transport after the student reaches the destination.', hasInvoice: true, hasDocument: true },
  { stageKey: 'PLACEMENT', title: 'Hospital Placement', description: 'AZAAM assigns the approved teaching hospital and department.', hasInvoice: true, hasDocument: true },
  { stageKey: 'TRAINING', title: 'Clinical Training', description: 'Attendance, logbook and supervisor evaluation during placement.', hasInvoice: false, hasDocument: false },
  { stageKey: 'COMPLETION', title: 'Completion & Certificate', description: 'Final evaluation and certificate are completed at the end of training.', hasInvoice: false, hasDocument: false },
];

const STAGE_DEF_BY_KEY = Object.fromEntries(MOCK_STAGE_DEFS.map((d) => [d.stageKey, d]));

export const mapApplicationStatusToStageStatus = (status?: string): AdminJourneyStage['status'] => {
  if (status === 'ACCEPTED') return 'COMPLETED';
  if (status === 'REJECTED') return 'REJECTED';
  if (status === 'CORRECTION_REQUESTED') return 'CORRECTION_REQUESTED';
  return 'CURRENT';
};

const toInvoice = (raw: RealTraineeStage | undefined): AdminJourneyInvoice | undefined => {
  // Migrate the legacy single `fee` field into a full invoice the first time it's read.
  const invoice = raw?.invoice || (raw?.fee !== undefined ? { amount: raw.fee, amountPaid: raw.fee, updatedAt: raw.actedAt || new Date().toISOString() } : undefined);
  if (!invoice) return undefined;
  const balance = Math.max(0, invoice.amount - invoice.amountPaid);
  return {
    amount: invoice.amount,
    amountPaid: invoice.amountPaid,
    balance,
    status: balance <= 0 ? 'COMPLETED' : 'IN_PROGRESS',
    updatedAt: invoice.updatedAt,
  };
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
      invoice: toInvoice(record),
      documents: toDisplayDocs(record?.documents),
      paymentProof: toDisplayDocs(record?.paymentProof),
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
  extra?: { invoiceAmount?: number; invoiceAmountPaid?: number; documents?: RealTraineeDocument[] }
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
  if (extra?.invoiceAmount !== undefined) {
    stage.invoice = { amount: extra.invoiceAmount, amountPaid: extra.invoiceAmountPaid || 0, updatedAt: stage.actedAt };
  }
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

// Lets AZAAM correct the invoice (amount / amount collected) on a stage after the fact,
// without reopening or changing its approval status.
export const updateMockStageInvoice = (
  studentId: string,
  stageKey: string,
  invoiceAmount: number,
  invoiceAmountPaid: number
): { stages: AdminJourneyStage[]; documents: DisplayDocument[] } => {
  const stages = ensureTraineeStages(studentId).map((s) => ({ ...s }));
  const stage = stages.find((s) => s.stageKey === stageKey);
  if (!stage) throw new Error('Unknown journey stage');
  stage.invoice = { amount: invoiceAmount, amountPaid: invoiceAmountPaid, updatedAt: new Date().toISOString() };
  RealDataStore.updateTrainee(studentId, { stages });
  return loadMockJourney(studentId);
};

// University-side: attach a bank payment / deposit slip as proof of payment for a stage's invoice.
export const addMockPaymentProof = (
  studentId: string,
  stageKey: string,
  documents: RealTraineeDocument[]
): { stages: AdminJourneyStage[]; documents: DisplayDocument[] } => {
  const stages = ensureTraineeStages(studentId).map((s) => ({ ...s }));
  const stage = stages.find((s) => s.stageKey === stageKey);
  if (!stage) throw new Error('Unknown journey stage');
  stage.paymentProof = [...(stage.paymentProof || []), ...documents];
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
      hasInvoice: false,
      hasDocument: false,
    },
    {
      key: 'DOCUMENTS_SUBMITTED',
      title: 'Documents Submitted',
      description: docsSubmitted ? `${documents.length} supporting document(s) received.` : 'Waiting for required supporting documents.',
      uiStatus: docsSubmitted ? 'COMPLETED' : 'CURRENT',
      actionable: false,
      hasInvoice: false,
      hasDocument: false,
    },
  ];
  azaamStages.forEach((s) => {
    const uiStatus: UiStatus = s.status === 'LOCKED' ? 'PENDING' : (s.status as UiStatus);
    const def = STAGE_DEF_BY_KEY[s.stageKey];
    list.push({
      key: s.stageKey,
      title: s.title,
      description: s.description,
      uiStatus,
      reason: s.reason,
      actionable: canAct && (uiStatus === 'CURRENT' || uiStatus === 'REJECTED' || uiStatus === 'CORRECTION_REQUESTED'),
      hasInvoice: def?.hasInvoice || false,
      hasDocument: def?.hasDocument || false,
      invoice: s.invoice,
      documents: s.documents,
      paymentProof: s.paymentProof,
    });
  });
  return list;
};
