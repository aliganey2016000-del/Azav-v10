import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  Clock3,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  MessageCircle,
  Radio,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { AdminJourneyStage } from '../../types/admin.types';
import {
  BADGE_STYLE,
  STATUS_LABEL,
  STATUS_STYLE,
  UiStatus,
  isDocumentChatStage,
} from '../../utils/journeyStages';

type ApplicationRecord = {
  _id: string;
  applicantType?: 'UNIVERSITY' | 'INDEPENDENT' | string;
};

type JourneyResponse = {
  documentsSubmitted: boolean;
  documentsCount: number;
  stages: AdminJourneyStage[];
};

type JourneyCard = {
  key: string;
  title: string;
  description: string;
  uiStatus: UiStatus;
  reason?: string;
  documents?: {
    id: string;
    name: string;
    type: string;
    mimeType?: string;
    uploadedAt?: string;
    status?: string;
  }[];
};

const toUiStatus = (status: AdminJourneyStage['status']): UiStatus =>
  status === 'LOCKED' ? 'PENDING' : (status as UiStatus);

const studentIdFrom = (value: unknown) => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && '_id' in value) {
    const id = (value as { _id?: unknown })._id;
    return typeof id === 'string' ? id : '';
  }
  return '';
};

const documentTypeLabel = (type: string) =>
  type
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export const StudentApplicationPage: React.FC = () => {
  const { user } = useAuth();
  const studentId = studentIdFrom(user?.studentId);

  const [journey, setJourney] = useState<JourneyResponse | null>(null);
  const [application, setApplication] = useState<ApplicationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [documentBusy, setDocumentBusy] = useState<string | null>(null);

  const load = async () => {
    if (!studentId) {
      setError('Your student profile is not linked to this account.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [applicationResponse, journeyResponse] = await Promise.all([
        api.get('/applications'),
        api.get(`/admin/students/${studentId}/journey`),
      ]);

      const applications =
        applicationResponse.data?.data?.applications ??
        applicationResponse.data?.data ??
        applicationResponse.data;

      setApplication(Array.isArray(applications) ? applications[0] || null : null);
      setJourney(journeyResponse.data?.data || null);
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.error?.message ||
          'Unable to load your AZAAM student journey.'
      );
      setJourney(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [studentId]);

  const cards = useMemo<JourneyCard[]>(() => {
    if (!journey) return [];

    const nominated = application?.applicantType !== 'INDEPENDENT';

    return [
      {
        key: 'NOMINATION',
        title: nominated ? 'Nomination' : 'Application Submitted',
        description: nominated
          ? 'Student nominated by the university and submitted to AZAAM.'
          : 'Application submitted directly to AZAAM.',
        uiStatus: 'COMPLETED',
      },
      {
        key: 'DOCUMENTS_SUBMITTED',
        title: 'Documents Submitted',
        description: journey.documentsSubmitted
          ? `${journey.documentsCount} supporting document(s) received.`
          : 'Waiting for required supporting documents.',
        uiStatus: journey.documentsSubmitted ? 'COMPLETED' : 'CURRENT',
      },
      ...journey.stages.map((stage) => ({
        key: stage.stageKey,
        title: stage.title,
        description: stage.description,
        uiStatus: toUiStatus(stage.status),
        reason: stage.reason,
        documents: stage.documents || [],
      })),
    ];
  }, [journey, application]);

  const getDocumentBlob = async (documentId: string) => {
    const response = await api.get(`/documents/${documentId}/download`, {
      responseType: 'blob',
    });
    return new Blob([response.data], {
      type: String(response.headers?.['content-type'] || 'application/octet-stream'),
    });
  };

  const viewDocument = async (documentId: string) => {
    try {
      setDocumentBusy(documentId);
      const blob = await getDocumentBlob(documentId);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.error?.message ||
          'Unable to open this document.'
      );
    } finally {
      setDocumentBusy(null);
    }
  };

  const downloadDocument = async (documentId: string, fileName: string) => {
    try {
      setDocumentBusy(documentId);
      const blob = await getDocumentBlob(documentId);
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = fileName || 'document';
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.error?.message ||
          'Unable to download this document.'
      );
    } finally {
      setDocumentBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-5">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-600 shadow-sm dark:border-slate-800 dark:bg-[#0f1b2d] dark:text-slate-300">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
          Loading your AZAAM journey...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#f5f8fb] px-3 py-4 sm:px-5 sm:py-6 lg:px-8 dark:bg-[#08111f]">
      <div className="mx-auto w-full max-w-5xl">
        <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0f1b2d]">
          <div className="px-4 pb-4 pt-6 sm:px-6 sm:pb-5 sm:pt-7">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
              My Application
            </p>

            <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-[25px] font-black leading-tight tracking-tight text-slate-950 sm:text-3xl dark:text-white">
                  Full Student Journey
                </h1>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base dark:text-slate-400">
                  Live status of every AZAAM-controlled milestone, exactly as AZAAM sees it.
                </p>
              </div>

              <div className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-extrabold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                <Radio className="h-4 w-4" />
                <span>Live AZAAM Tracking</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mx-4 mb-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 sm:mx-6 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-extrabold">Needs attention</p>
                <p className="mt-1 text-xs leading-5">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => void load()}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-rose-700 shadow-sm dark:bg-slate-900 dark:text-rose-300"
                aria-label="Retry"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          )}

          {!journey ? (
            <div className="px-4 pb-8 sm:px-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900/60">
                <Clock3 className="mx-auto h-8 w-8 text-slate-400" />
                <h2 className="mt-3 font-extrabold text-slate-900 dark:text-white">
                  Journey not available yet
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Your application journey will appear here once AZAAM begins processing it.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 px-4 pb-6 sm:px-6 sm:pb-7">
              {cards.map((stage, index) => {
                const complete = stage.uiStatus === 'COMPLETED';
                const current = stage.uiStatus === 'CURRENT';

                return (
                  <article
                    key={stage.key}
                    className={
                      'rounded-[22px] border p-4 shadow-[0_1px_2px_rgba(15,23,42,0.02)] sm:p-5 ' +
                      STATUS_STYLE[stage.uiStatus]
                    }
                  >
                    <div className="flex items-start gap-3.5 sm:gap-4">
                      <div
                        className={
                          'mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-black sm:h-14 sm:w-14 ' +
                          (complete
                            ? 'bg-emerald-600 text-white'
                            : current
                              ? 'bg-amber-500 text-white'
                              : stage.uiStatus === 'REJECTED'
                                ? 'bg-rose-600 text-white'
                                : stage.uiStatus === 'CORRECTION_REQUESTED'
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-200')
                        }
                      >
                        {complete ? <Check className="h-6 w-6" /> : index + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h2 className="text-[17px] font-black leading-6 text-slate-950 sm:text-lg dark:text-white">
                          {stage.title}
                        </h2>

                        <div className="mt-2">
                          <span
                            className={
                              'inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.05em] ' +
                              BADGE_STYLE[stage.uiStatus]
                            }
                          >
                            {STATUS_LABEL[stage.uiStatus]}
                          </span>
                        </div>

                        <p className="mt-1.5 text-sm leading-6 text-slate-600 sm:text-[15px] dark:text-slate-300">
                          {stage.description}
                        </p>

                        {stage.reason &&
                          (stage.uiStatus === 'REJECTED' ||
                            stage.uiStatus === 'CORRECTION_REQUESTED') && (
                            <div className="mt-3 rounded-xl border border-current/15 bg-white/70 p-3 text-xs font-semibold leading-5 text-slate-700 dark:bg-slate-950/20 dark:text-slate-200">
                              <span className="font-black">AZAAM comment:</span> {stage.reason}
                            </div>
                          )}

                        {stage.documents && stage.documents.length > 0 && (
                          <div className="mt-4 space-y-3">
                            {stage.documents.map((doc) => {
                              const busy = documentBusy === doc.id;

                              return (
                                <div
                                  key={doc.id}
                                  className="rounded-[18px] border border-blue-200 bg-blue-50/80 p-3.5 sm:p-4 dark:border-blue-500/25 dark:bg-blue-500/10"
                                >
                                  <div className="flex min-w-0 items-start gap-3">
                                    <FileText className="mt-0.5 h-5 w-5 shrink-0 text-blue-700 dark:text-blue-300" />
                                    <div className="min-w-0">
                                      <p className="break-words text-sm font-black leading-5 text-slate-800 sm:text-[15px] dark:text-slate-100">
                                        {doc.name}
                                      </p>
                                      <p className="mt-1 text-[11px] font-black uppercase tracking-wide text-blue-700 dark:text-blue-300">
                                        {documentTypeLabel(doc.type)}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="mt-3 grid grid-cols-2 gap-2.5">
                                    <button
                                      type="button"
                                      onClick={() => void viewDocument(doc.id)}
                                      disabled={busy}
                                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-3 text-sm font-extrabold text-blue-700 shadow-sm transition hover:bg-blue-50 disabled:cursor-wait disabled:opacity-60 dark:bg-slate-900 dark:text-blue-300"
                                    >
                                      {busy ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <ExternalLink className="h-4 w-4" />
                                      )}
                                      View
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => void downloadDocument(doc.id, doc.name)}
                                      disabled={busy}
                                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 text-sm font-extrabold text-slate-700 transition hover:bg-slate-200 disabled:cursor-wait disabled:opacity-60 dark:bg-slate-800 dark:text-slate-300"
                                    >
                                      <Download className="h-4 w-4" />
                                      Download
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {isDocumentChatStage(stage.key) && stage.uiStatus !== 'PENDING' && (
                          <div className="mt-4">
                            <div className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 text-sm font-extrabold text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                              <MessageCircle className="h-5 w-5" />
                              Chat with AZAAM
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
