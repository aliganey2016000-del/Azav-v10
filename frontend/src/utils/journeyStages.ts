import { AdminJourneyStage } from '../types/admin.types';

export type UiStatus = 'COMPLETED' | 'CURRENT' | 'PENDING' | 'REJECTED' | 'CORRECTION_REQUESTED';

export type DisplayComment = {
  id: string;
  author: 'AZAAM' | 'UNIVERSITY';
  authorName?: string;
  message: string;
  readBy?: ('AZAAM' | 'UNIVERSITY')[];
  createdAt: string;
};

export type DisplayDocument = {
  id: string;
  name: string;
  type: string;
  dataUrl?: string;
  mimeType?: string;
  uploadedAt?: string;
  status?: string;
};

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

export const DOCUMENT_CHAT_STAGE_KEYS = ['PERMIT', 'VISA', 'RESIDENCE'] as const;

export const isDocumentChatStage = (stageKey: string) =>
  (DOCUMENT_CHAT_STAGE_KEYS as readonly string[]).includes(stageKey);

export const EVIDENCE_UPDATE_STAGE_KEYS = ['TRANSPORT'] as const;

export const isEvidenceUpdateStage = (stageKey: string) =>
  (EVIDENCE_UPDATE_STAGE_KEYS as readonly string[]).includes(stageKey);

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
      description: docsSubmitted
        ? `${documents.length} supporting document(s) received.`
        : 'Waiting for required supporting documents.',
      uiStatus: docsSubmitted ? 'COMPLETED' : 'CURRENT',
      actionable: false,
      hasDocument: false,
    },
  ];

  azaamStages.forEach((stage) => {
    const uiStatus: UiStatus =
      stage.status === 'LOCKED' ? 'PENDING' : (stage.status as UiStatus);

    list.push({
      key: stage.stageKey,
      title: stage.title,
      description: stage.description,
      uiStatus,
      reason: stage.reason,
      actionable:
        canAct &&
        uiStatus !== 'PENDING' &&
        !isDocumentChatStage(stage.stageKey) &&
        !isEvidenceUpdateStage(stage.stageKey),
      hasDocument: true,
      documents: stage.documents,
      comments: stage.comments,
    });
  });

  return list;
};
