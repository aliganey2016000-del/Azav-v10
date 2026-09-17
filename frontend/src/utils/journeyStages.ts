import { RealDataStore } from '../services/realDataStore';
import { AdminJourneyStage } from '../types/admin.types';

export type UiStatus = 'COMPLETED' | 'CURRENT' | 'PENDING' | 'REJECTED' | 'CORRECTION_REQUESTED';

export type DisplayStage = {
  key: string;
  title: string;
  description: string;
  uiStatus: UiStatus;
  reason?: string;
  actionable: boolean;
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

export const loadMockJourney = (studentId: string): { stages: AdminJourneyStage[]; documents: DisplayDocument[] } => {
  const trainee = RealDataStore.getTrainees().find((t) => t.id === studentId);
  const currentStatus = mapApplicationStatusToStageStatus(trainee?.applicationStatus);
  const stages = MOCK_STAGE_DEFS.map((def, i) => ({
    stageKey: def.stageKey,
    order: i,
    status: i === 0 ? currentStatus : ('LOCKED' as AdminJourneyStage['status']),
    reason: i === 0 ? trainee?.reviewReason : undefined,
    title: def.title,
    description: def.description,
  }));
  const documents = (trainee?.documents || []).map((d) => ({ id: d.id, name: d.name, type: d.type, dataUrl: d.dataUrl }));
  return { stages, documents };
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
    },
    {
      key: 'DOCUMENTS_SUBMITTED',
      title: 'Documents Submitted',
      description: docsSubmitted ? `${documents.length} supporting document(s) received.` : 'Waiting for required supporting documents.',
      uiStatus: docsSubmitted ? 'COMPLETED' : 'CURRENT',
      actionable: false,
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
      actionable: canAct && (uiStatus === 'CURRENT' || uiStatus === 'REJECTED' || uiStatus === 'CORRECTION_REQUESTED'),
    });
  });
  return list;
};
