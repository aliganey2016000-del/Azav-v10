import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, FileText, Plane, Home, Car, Building2, Stethoscope, Award, ShieldCheck, AlertTriangle, Download, Eye, Loader2, MessageCircle, Send, Upload } from 'lucide-react';
import { AdminApiService } from '../../services/admin.service';
import { AdminStudentJourney, AdminJourneyStage } from '../../types/admin.types';
import { LoadingState, ErrorState } from '../../components/admin/States';
import { StatusBadge } from '../../components/admin/Badge';
import { useAuth } from '../../context/AuthContext';
import { DisplayStage, DisplayDocument, STATUS_LABEL, STATUS_STYLE, BADGE_STYLE, isMockId, loadMockJourney, actOnMockStage, addMockStageComment, markCommentsSeen, buildDisplayStages } from '../../utils/journeyStages';
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
  const authorName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : undefined;

  const [data, setData] = useState<AdminStudentJourney | null>(null);
  const [azaamStages, setAzaamStages] = useState<AdminJourneyStage[]>([]);
  const [documents, setDocuments] = useState<DisplayDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formState, setFormState] = useState<Record<string, { action: ActionType; reason: string; files: File[] }>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});

  const emptyDraft = { action: 'APPROVE' as ActionType, reason: '', files: [] as File[] };

  const applyMockJourney = (studentId: string) => {
    const { stages, documents: docs } = loadMockJourney(studentId);
    setAzaamStages(stages);
    setDocuments(docs);
  };

  const loadJourney = async (studentId: string) => {
    if (isMockId(studentId)) {
      applyMockJourney(studentId);
      return;
    }
    const stages = await AdminApiService.getStudentAzaamJourney(studentId).catch(() => []);
    setAzaamStages(stages);

    try {
      const docs = await AdminApiService.getStudentDocuments(studentId);
      setDocuments(docs.map((d: any) => ({ id: d._id, name: d.originalName, type: d.type })));
    } catch (e: any) {
      setDocuments([]);
      setActionError(e?.response?.data?.error?.message || e.message || 'Student documents could not be loaded.');
    }
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
    markCommentsSeen('AZAAM');
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
      if (isMockId(id)) {
        const docs = await Promise.all(
          draft.files.map(async (file) => ({
            id: `DOC-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: file.name,
            type: file.type || 'application/octet-stream',
            dataUrl: await readFileAsDataUrl(file),
            uploadedAt: new Date().toISOString(),
          }))
        );
        const { stages } = actOnMockStage(id, stageKey, draft.action, draft.reason.trim() || undefined, {
          documents: docs.length ? docs : undefined,
        });
        setAzaamStages(stages);
      } else {
        const updated = await AdminApiService.actOnJourneyStage(id, stageKey, draft.action, draft.reason.trim() || undefined);
        setAzaamStages(updated);
      }
      setFormState((prev) => ({ ...prev, [stageKey]: emptyDraft }));
    } catch (e: any) {
      setActionError(e?.response?.data?.error?.message || e.message || 'Failed to update stage.');
    } finally {
      setSubmitting(null);
    }
  };

  const handleSendComment = (stageKey: string) => {
    if (!id || !isMockId(id)) return;
    const message = (commentDraft[stageKey] || '').trim();
    if (!message) return;
    const { stages } = addMockStageComment(id, stageKey, 'AZAAM', authorName, message);
    setAzaamStages(stages);
    setCommentDraft((prev) => ({ ...prev, [stageKey]: '' }));
  };

  const handleDownload = async (doc: DisplayDocument) => {
    try {
      if (doc.dataUrl) {
        const link = window.document.createElement('a');
        link.href = doc.dataUrl;
        link.setAttribute('download', doc.name);
        window.document.body.appendChild(link);
        link.click();
        link.remove();
        return;
      }
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
            <div className="min-w-56 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <div className="flex justify-between text-xs font-bold"><span>Journey Progress</span><span>{completedCount}/10</span></div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${completedCount * 10}%` }} /></div>
              <p className="mt-2 text-[11px] text-slate-300">University view follows every AZAAM-controlled milestone.</p>
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
                      <div className="mt-2 flex flex-wrap gap-2">
                        {stage.documents.map((doc) => (
                          <span key={doc.id} className="inline-flex items-center gap-1 rounded-lg bg-blue-100 px-2.5 py-1 text-[11px] font-bold text-blue-800">
                            <FileText className="h-3.5 w-3.5" />
                            {doc.dataUrl ? <a href={doc.dataUrl} target="_blank" rel="noreferrer" className="hover:underline">{doc.name}</a> : doc.name}
                          </span>
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

                        {id && isMockId(id) && (
                          <label className="flex cursor-pointer items-center gap-2 text-xs">
                            <Upload className="h-3.5 w-3.5 text-blue-600" />
                            <span className="font-bold text-slate-700">Attach document (optional):</span>
                            <input
                              type="file"
                              multiple
                              onChange={(e) => setFormState((prev) => ({ ...prev, [stage.key]: { ...draft, files: Array.from(e.target.files || []) } }))}
                              className="text-[11px]"
                            />
                            {draft.files.length > 0 && <span className="font-semibold text-blue-700">{draft.files.length} file(s) selected</span>}
                          </label>
                        )}
                      </div>
                    )}

                    {id && isMockId(id) && stage.uiStatus !== 'PENDING' && (
                      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-black text-slate-600"><MessageCircle className="h-3.5 w-3.5" /> Comments</p>
                        {stage.comments && stage.comments.length > 0 && (
                          <div className="mb-2 space-y-2">
                            {stage.comments.map((c) => (
                              <div key={c.id} className={`rounded-lg p-2 text-[11px] ${c.author === 'AZAAM' ? 'bg-teal-50 text-teal-900' : 'bg-white border border-slate-200 text-slate-700'}`}>
                                <span className="font-black">{c.author === 'AZAAM' ? (c.authorName || 'AZAAM') : (c.authorName || 'University')}:</span> {c.message}
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={commentDraft[stage.key] || ''}
                            onChange={(e) => setCommentDraft((prev) => ({ ...prev, [stage.key]: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendComment(stage.key)}
                            placeholder="Write a comment for the university…"
                            className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
                          />
                          <button onClick={() => handleSendComment(stage.key)} className="inline-flex items-center gap-1 rounded-lg bg-slate-700 px-2.5 py-1.5 text-xs font-black text-white hover:bg-slate-800">
                            <Send className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
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
