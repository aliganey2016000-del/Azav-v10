import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, FileText, Plane, Home, Car, Building2, Stethoscope, Award, ShieldCheck, AlertTriangle, Download, Eye, Loader2, MessageCircle, Upload } from 'lucide-react';
import { AdminApiService } from '../../services/admin.service';
import { AdminStudentJourney, AdminJourneyStage, JourneyChatData } from '../../types/admin.types';
import { LoadingState, ErrorState } from '../../components/admin/States';
import { StatusBadge } from '../../components/admin/Badge';
import { useAuth } from '../../context/AuthContext';
import { DisplayStage, DisplayDocument, STATUS_LABEL, STATUS_STYLE, BADGE_STYLE, buildDisplayStages, isDocumentChatStage } from '../../utils/journeyStages';
import { documentTypeLabel } from '../../utils/documentTypes';

type ActionType = 'APPROVE' | 'REQUEST_CORRECTION' | 'REJECT';

const readFileAsDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result as string);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

export const StudentJourneyAdminPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const canAct = Boolean(user?.roles?.some((r) => r === 'AZAAM_STAFF' || r === 'SUPER_ADMIN'));

  const [data, setData] = useState<AdminStudentJourney | null>(null);
  const [azaamStages, setAzaamStages] = useState<AdminJourneyStage[]>([]);
  const [documents, setDocuments] = useState<DisplayDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formState, setFormState] = useState<Record<string, { action: ActionType; reason: string; files: File[] }>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [chatData, setChatData] = useState<JourneyChatData | null>(null);
  const [stageUpdateFiles, setStageUpdateFiles] = useState<Record<string, File[]>>({});
  const [stageUpdateNote, setStageUpdateNote] = useState<Record<string, string>>({});

  const emptyDraft = { action: 'APPROVE' as ActionType, reason: '', files: [] as File[] };

  const loadJourney = async (studentId: string) => {
    const [stages, docs, chat] = await Promise.all([
      AdminApiService.getStudentAzaamJourney(studentId),
      AdminApiService.getStudentDocuments(studentId),
      AdminApiService.getJourneyChat(studentId),
    ]);
    setAzaamStages(stages);
    setDocuments(docs.map((d: any) => ({ id: d._id, name: d.originalName, type: d.type })));
    setChatData(chat);
  };

  useEffect(() => {
    if (!id) return;
    AdminApiService.getStudentById(id)
      .then((d) => {
        setData(d);
        return loadJourney(id);
      })
      .catch((e: any) => setError(e.message || 'Failed to load student journey.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const timer = window.setInterval(() => {
      AdminApiService.getJourneyChat(id).then(setChatData).catch(() => {});
    }, 5000);
    return () => window.clearInterval(timer);
  }, [id]);

  const stages = useMemo<DisplayStage[]>(
    () => buildDisplayStages(documents, azaamStages, canAct),
    [documents, azaamStages, canAct]
  );

  const handleAction = async (stageKey: string) => {
    if (!id) return;
    const draft = formState[stageKey] || emptyDraft;
    if ((draft.action === 'REQUEST_CORRECTION' || draft.action === 'REJECT') && !draft.reason.trim()) {
      setActionError('A reason/comment is required for Request Correction or Reject.');
      return;
    }
    setActionError(null);
    setSubmitting(stageKey);
    try {
      const updated = await AdminApiService.actOnJourneyStage(
        id,
        stageKey,
        draft.action,
        draft.reason.trim() || undefined
      );
      setAzaamStages(updated);
      setFormState((prev) => ({ ...prev, [stageKey]: emptyDraft }));
    } catch (e: any) {
      setActionError(e?.response?.data?.error?.message || e.message || 'Failed to update stage.');
    } finally {
      setSubmitting(null);
    }
  };

  const handleDocumentStageUpdate = async (stageKey: string) => {
    if (!id) return;
    const files = stageUpdateFiles[stageKey] || [];
    const note = (stageUpdateNote[stageKey] || '').trim();

    if (files.length === 0) {
      setActionError('Select at least one official document before saving this stage update.');
      return;
    }

    setSubmitting('update-' + stageKey);
    setActionError(null);

    try {
      const uploaded = await Promise.all(
        files.map(async (file) => {
          const base64Data = await readFileAsDataUrl(file);
          return AdminApiService.uploadStudentDocument(id, {
            originalName: file.name,
            mimeType: file.type || 'application/octet-stream',
            base64Data,
            type:
              stageKey === 'PERMIT'
                ? 'HOST_ACCEPTANCE_LETTER'
                : stageKey === 'VISA'
                  ? 'ENTRY_VISA'
                  : 'RESIDENCE_VISA',
          });
        })
      );

      const stages = await AdminApiService.updateJourneyStage(
        id,
        stageKey,
        uploaded.map((doc: any) => doc._id),
        note || undefined
      );
      setAzaamStages(stages);
      setChatData(await AdminApiService.getJourneyChat(id));

      setStageUpdateFiles((prev) => ({ ...prev, [stageKey]: [] }));
      setStageUpdateNote((prev) => ({ ...prev, [stageKey]: '' }));
    } catch (e: any) {
      setActionError(e?.response?.data?.error?.message || e.message || 'Failed to save stage update.');
    } finally {
      setSubmitting(null);
    }
  };

  const handleDownload = async (doc: DisplayDocument) => {
    try {
      await AdminApiService.downloadDocument(doc.id, doc.name);
    } catch (e: any) {
      setActionError(e?.response?.data?.error?.message || 'Failed to download document.');
    }
  };

  if (loading) return <LoadingState message="Loading student journey..." />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  const s: any = data.student;
  const completedCount = stages.filter((x) => x.uiStatus === 'COMPLETED').length;
  const current = stages.find((x) => x.uiStatus !== 'COMPLETED');
  const icons = [FileText, FileText, ShieldCheck, FileText, Plane, Home, Car, Building2, Stethoscope, Award];
  const chatUnread = chatData?.unreadCount || 0;
  const stageUnread = (stageKey: string) =>
    (chatData?.messages || []).filter(
      (message) =>
        message.stageKey === stageKey &&
        message.author !== 'AZAAM' &&
        !(message.readBy || []).includes('AZAAM')
    ).length;

  return (
    <div className="space-y-5 pb-10">
      <Link to="/admin/students" className="inline-flex items-center gap-2 text-xs font-bold text-teal-700 hover:text-teal-900">
        <ArrowLeft className="w-4 h-4" /> Back to Students Registry
      </Link>

      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 text-white shadow-xl">
        <div className="p-5 md:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-lg font-black shadow-lg">
                {s.firstName?.[0]}{s.lastName?.[0]}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-black">{s.firstName} {s.lastName}</h1>
                  <StatusBadge status={s.status} />
                </div>
                <p className="mt-1 text-xs text-slate-300">{s.studentNumber} • {s.university?.name} • {s.specialty}</p>
                <p className="mt-2 text-sm font-semibold text-cyan-200">Current stage: {current?.title || 'Journey completed'}</p>
              </div>
            </div>
            <div className="flex min-w-56 flex-col gap-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <div className="flex justify-between text-xs font-bold"><span>Journey Progress</span><span>{completedCount}/10</span></div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${completedCount * 10}%` }} /></div>
                <p className="mt-2 text-[11px] text-slate-300">University view follows every AZAAM-controlled milestone.</p>
              </div>
              <Link
                to={`/admin/students/${id}/chat`}
                className="relative inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#00a884] px-4 text-sm font-extrabold text-white shadow-lg transition hover:bg-[#029978]"
              >
                <MessageCircle className="h-5 w-5" />
                Open Chat
                {chatUnread > 0 && (
                  <span className="absolute -right-2 -top-2 inline-flex min-h-6 min-w-6 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-black text-white ring-2 ring-slate-950">
                    {chatUnread > 99 ? '99+' : chatUnread}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-xs font-bold text-emerald-700">COMPLETED</p><p className="mt-1 text-2xl font-black text-emerald-900">{completedCount}</p></div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-xs font-bold text-amber-700">CURRENT STAGE</p><p className="mt-1 text-sm font-black text-amber-900">{current?.title || 'Completed'}</p></div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4"><p className="text-xs font-bold text-blue-700">UNIVERSITY</p><p className="mt-1 text-sm font-black text-blue-950">{s.university?.name || 'University'}</p></div>
      </div>

      {actionError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">{actionError}</div>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div><h2 className="text-lg font-black text-slate-950">Full Student Journey</h2><p className="text-xs text-slate-500">Completed stages show a green tick. The next stage is highlighted; future stages remain numbered.</p></div>
          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">Live AZAAM Tracking</span>
        </div>

        <div className="relative space-y-3 md:pl-2">
          {stages.map((stage, index) => {
            const Icon = icons[index];
            const complete = stage.uiStatus === 'COMPLETED';
            const draft = formState[stage.key] || emptyDraft;
            return (
              <div key={stage.key} className={`relative rounded-2xl border p-4 transition ${STATUS_STYLE[stage.uiStatus]}`}>
                <div className="flex items-start gap-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-black ${complete ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {complete ? <Check className="h-5 w-5" /> : index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-slate-500" /><h3 className="text-sm font-black text-slate-900">{stage.title}</h3></div>
                      <span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-black ${BADGE_STYLE[stage.uiStatus]}`}>{STATUS_LABEL[stage.uiStatus]}</span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-600">{stage.description}</p>

                    {stage.reason && (stage.uiStatus === 'REJECTED' || stage.uiStatus === 'CORRECTION_REQUESTED') && (
                      <p className="mt-2 rounded-lg bg-white/70 border border-current/20 p-2 text-[11px] font-semibold text-slate-700">
                        <span className="font-black">AZAAM comment:</span> {stage.reason}
                      </p>
                    )}

                    {(stage.documents && stage.documents.length > 0) && (
                      <div className="mt-3 space-y-2">
                        {stage.documents.map((doc) => (
                          <div key={doc.id} className="flex flex-col gap-2 rounded-xl border border-blue-200 bg-blue-50/70 p-3 sm:flex-row sm:items-center sm:justify-between dark:border-blue-500/20 dark:bg-blue-500/10">
                            <div className="flex min-w-0 items-start gap-2">
                              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-blue-700 dark:text-blue-300" />
                              <div className="min-w-0">
                                <p className="break-words text-xs font-extrabold text-slate-800 dark:text-slate-100">{doc.name}</p>
                                <p className="mt-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">{doc.type.replaceAll('_', ' ')}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 sm:flex">
                              <button
                                type="button"
                                onClick={() => (doc.dataUrl ? window.open(doc.dataUrl, '_blank') : handleDownload(doc))}
                                className="inline-flex min-h-9 items-center justify-center gap-1 rounded-lg bg-white px-3 text-[11px] font-bold text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-300"
                              >
                                <Eye className="h-3 w-3" /> View
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownload(doc)}
                                className="inline-flex min-h-9 items-center justify-center gap-1 rounded-lg bg-slate-100 px-3 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              >
                                <Download className="h-3 w-3" /> Download
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {stage.key === 'DOCUMENTS_SUBMITTED' && documents.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {documents.map((doc) => (
                          <div key={doc.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-900/70">
                            <div className="flex min-w-0 items-start gap-2">
                              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-blue-700 dark:text-blue-300" />
                              <div className="min-w-0">
                                <p className="break-words text-xs font-extrabold text-slate-800 dark:text-slate-100">{doc.name}</p>
                                <span className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                                  {documentTypeLabel(doc.type)}
                                </span>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
                              <button
                                type="button"
                                onClick={() => (doc.dataUrl ? window.open(doc.dataUrl, '_blank') : handleDownload(doc))}
                                className="inline-flex min-h-9 items-center justify-center gap-1 rounded-lg bg-blue-100 px-3 text-[11px] font-bold text-blue-800 hover:bg-blue-200 dark:bg-blue-500/15 dark:text-blue-300"
                              >
                                <Eye className="h-3 w-3" /> View
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownload(doc)}
                                className="inline-flex min-h-9 items-center justify-center gap-1 rounded-lg bg-slate-100 px-3 text-[11px] font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                              >
                                <Download className="h-3 w-3" /> Download
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {isDocumentChatStage(stage.key) && stage.uiStatus !== 'PENDING' && (
                      <div className="mt-3 rounded-xl border border-teal-200 bg-teal-50/60 p-3 dark:border-teal-500/20 dark:bg-teal-500/10">
                        <div className="mb-3 flex items-center gap-2">
                          <Upload className="h-4 w-4 text-teal-700 dark:text-teal-300" />
                          <div>
                            <p className="text-xs font-extrabold text-slate-900 dark:text-white">Official document update</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">Upload the official document. This completes the stage and opens the next step.</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <input
                            type="file"
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                            onChange={(e) => setStageUpdateFiles((prev) => ({ ...prev, [stage.key]: Array.from(e.target.files || []) }))}
                            className="block w-full text-[11px] text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-600 file:px-3 file:py-2 file:text-[11px] file:font-bold file:text-white dark:text-slate-300"
                          />
                          <textarea
                            value={stageUpdateNote[stage.key] || ''}
                            onChange={(e) => setStageUpdateNote((prev) => ({ ...prev, [stage.key]: e.target.value }))}
                            placeholder="Optional update note for the university..."
                            className="min-h-20 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                          />
                          <button
                            type="button"
                            onClick={() => handleDocumentStageUpdate(stage.key)}
                            disabled={submitting === 'update-' + stage.key}
                            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 px-4 text-xs font-extrabold text-white disabled:opacity-50 sm:w-auto"
                          >
                            {submitting === 'update-' + stage.key && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            <Upload className="h-3.5 w-3.5" />
                            Upload & Save Update
                          </button>
                        </div>
                      </div>
                    )}

                    {stage.actionable && (
                      <div className="mt-3 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                          <select
                            value={draft.action}
                            onChange={(e) => setFormState((prev) => ({ ...prev, [stage.key]: { ...draft, action: e.target.value as ActionType } }))}
                            className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs font-bold text-slate-800"
                          >
                            <option value="APPROVE">Approve</option>
                            <option value="REQUEST_CORRECTION">Request Correction</option>
                            <option value="REJECT">Reject</option>
                          </select>
                          {draft.action !== 'APPROVE' && (
                            <input
                              type="text"
                              value={draft.reason}
                              onChange={(e) => setFormState((prev) => ({ ...prev, [stage.key]: { ...draft, reason: e.target.value } }))}
                              placeholder="Reason / comment (required)"
                              className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
                            />
                          )}
                          <button
                            onClick={() => handleAction(stage.key)}
                            disabled={submitting === stage.key}
                            className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-black text-white hover:bg-teal-700 disabled:opacity-50"
                          >
                            {submitting === stage.key && <Loader2 className="h-3 w-3 animate-spin" />}
                            Submit
                          </button>
                        </div>
                      </div>
                    )}

                    {isDocumentChatStage(stage.key) && stage.uiStatus !== 'PENDING' && (
                      <Link
                        to={`/admin/students/${id}/chat?stage=${stage.key}`}
                        className="relative mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-xs font-extrabold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Chat with University
                        {stageUnread(stage.key) > 0 && (
                          <span className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white">
                            {stageUnread(stage.key) > 99 ? '99+' : stageUnread(stage.key)}
                          </span>
                        )}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p><strong>Workflow control:</strong> University submits nomination and documents. AZAAM controls review/approval, immigration milestones, transportation, hospital placement, applicable fees and final completion. The university follows progress from this journey.</p>
        </div>
      </section>
    </div>
  );
};
