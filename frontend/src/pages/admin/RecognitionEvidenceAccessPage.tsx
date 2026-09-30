import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Copy,
  FileImage,
  FileKey2,
  FileText,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { LandingPageCmsService } from '../../services/landingPageCms.service';
import {
  RecognitionAccessCodeRecord,
  RecognitionEvidenceRecord,
  RecognitionEvidenceService,
} from '../../services/recognitionEvidence.service';

export const RecognitionEvidenceAccessPage: React.FC = () => {
  const [recognitionNames, setRecognitionNames] = useState<string[]>([]);
  const [evidence, setEvidence] = useState<RecognitionEvidenceRecord[]>([]);
  const [codes, setCodes] = useState<RecognitionAccessCodeRecord[]>([]);
  const [selectedName, setSelectedName] = useState('');
  const [expiresInMinutes, setExpiresInMinutes] = useState(30);
  const [latestCode, setLatestCode] = useState('');
  const [latestCodeExpiresAt, setLatestCodeExpiresAt] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      setLoading(true);
      const [cms, overview] = await Promise.all([
        LandingPageCmsService.getAdmin(),
        RecognitionEvidenceService.getAdminOverview(),
      ]);
      const names = cms.content.recognitions.map((item) => item.name).filter(Boolean);
      const historical = overview.evidence.map((item) => item.recognitionName);
      const merged = Array.from(new Set([...names, ...historical]));
      setRecognitionNames(merged);
      setEvidence(overview.evidence);
      setCodes(overview.codes);
      setSelectedName((current) => current && merged.includes(current) ? current : (merged[0] || ''));
    } catch (error: any) {
      setMessage(error?.response?.data?.error?.message || error.message || 'Unable to load recognition access settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const selectedEvidence = useMemo(
    () => evidence.find((item) => item.recognitionName === selectedName),
    [evidence, selectedName]
  );

  const formatDateTime = (value?: string | null) => {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!selectedName || !files?.length) return;
    try {
      setBusy(true);
      let current: RecognitionEvidenceRecord | undefined;
      for (const file of Array.from(files)) {
        current = await RecognitionEvidenceService.uploadDocument(selectedName, file);
      }
      if (current) {
        setEvidence((items) => {
          const exists = items.some((item) => item.recognitionName === current!.recognitionName);
          return exists
            ? items.map((item) => item.recognitionName === current!.recognitionName ? current! : item)
            : [current!, ...items];
        });
      }
      setMessage(`${files.length} protected evidence file(s) uploaded.`);
    } catch (error: any) {
      setMessage(error?.response?.data?.error?.message || error.message || 'Evidence upload failed.');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const deleteDocument = async (documentId: string) => {
    if (!selectedName || !window.confirm('Delete this protected evidence document?')) return;
    try {
      setBusy(true);
      const updated = await RecognitionEvidenceService.deleteDocument(selectedName, documentId);
      setEvidence((items) => items.map((item) => item.recognitionName === updated.recognitionName ? updated : item));
      setMessage('Evidence document deleted.');
    } catch (error: any) {
      setMessage(error?.response?.data?.error?.message || error.message || 'Could not delete evidence document.');
    } finally {
      setBusy(false);
    }
  };

  const generateCode = async () => {
    if (!selectedName) return;
    try {
      setBusy(true);
      const result = await RecognitionEvidenceService.generateCode(selectedName, expiresInMinutes);
      setLatestCode(result.code);
      setLatestCodeExpiresAt(result.accessCode.expiresAt);
      setCodes((items) => [result.accessCode, ...items]);
      setMessage('New one-time 6-digit access code generated.');
    } catch (error: any) {
      setMessage(error?.response?.data?.error?.message || error.message || 'Could not generate access code.');
    } finally {
      setBusy(false);
    }
  };

  const copyLatestCode = async () => {
    if (!latestCode) return;
    await navigator.clipboard.writeText(latestCode);
    setMessage('One-time code copied.');
  };

  const revokeCode = async (id: string) => {
    try {
      setBusy(true);
      const updated = await RecognitionEvidenceService.revokeCode(id);
      setCodes((items) => items.map((item) => item.id === updated.id ? updated : item));
      setMessage('Access code revoked.');
    } catch (error: any) {
      setMessage(error?.response?.data?.error?.message || error.message || 'Could not revoke access code.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">Loading recognition evidence access...</div>;
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-r from-[#153b78] via-[#24479a] to-[#087b6a] p-5 text-white shadow-lg sm:p-7">
        <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-100">
          <ShieldCheck className="h-4 w-4" /> Super Admin Only
        </div>
        <h1 className="mt-2 text-2xl font-black sm:text-3xl">Recognition Evidence & One-Time Access</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-white/75">
          Store recognition or agreement evidence privately and generate a 6-digit one-time code only when you want someone to view it.
        </p>
      </div>

      {message && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">{message}</div>
      )}

      <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 px-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Recognitions & Approvals</div>
          <div className="max-h-[640px] space-y-2 overflow-y-auto pr-1">
            {recognitionNames.map((name) => {
              const record = evidence.find((item) => item.recognitionName === name);
              const active = name === selectedName;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    setSelectedName(name);
                    setLatestCode('');
                    setLatestCodeExpiresAt('');
                  }}
                  className={`w-full rounded-xl border p-3 text-left transition ${active ? 'border-teal-300 bg-teal-50 dark:border-teal-700 dark:bg-teal-950/30' : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800'}`}
                >
                  <div className="text-xs font-black leading-5 text-slate-900 dark:text-white">{name}</div>
                  <div className="mt-1 text-[10px] text-slate-500">{record?.documents.length || 0} protected document(s)</div>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="min-w-0 space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-teal-600 dark:text-teal-400">Protected Evidence</div>
                <h2 className="mt-1 break-words text-lg font-black text-slate-950 dark:text-white">{selectedName || 'Select a recognition'}</h2>
                <p className="mt-1 text-xs text-slate-500">PDF and image files only. These files are not published in the public landing-page data.</p>
              </div>
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf,image/*"
                  multiple
                  className="hidden"
                  onChange={(event) => uploadFiles(event.target.files)}
                />
                <button
                  type="button"
                  disabled={busy || !selectedName}
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-50"
                >
                  <UploadCloud className="h-4 w-4" /> Upload Evidence
                </button>
              </div>
            </div>

            {!selectedEvidence?.documents.length ? (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 px-5 py-12 text-center dark:border-slate-700">
                <FileKey2 className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm font-bold text-slate-600 dark:text-slate-300">No protected evidence uploaded</p>
                <p className="mt-1 text-xs text-slate-400">Upload the official recognition, approval or agreement document first.</p>
              </div>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {selectedEvidence.documents.map((doc) => (
                  <article key={doc.id} className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                      {doc.mimeType === 'application/pdf' ? <FileText className="h-5 w-5" /> : <FileImage className="h-5 w-5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-black text-slate-900 dark:text-white">{doc.title || doc.originalName}</div>
                      <div className="mt-1 text-[10px] text-slate-500">{doc.mimeType === 'application/pdf' ? 'PDF document' : 'Image evidence'}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteDocument(doc.id)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
                      aria-label="Delete evidence document"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-amber-500" />
              <div>
                <h2 className="font-black text-slate-950 dark:text-white">Generate 6-Digit One-Time Code</h2>
                <p className="mt-1 text-xs text-slate-500">The code works once for the selected recognition and creates a short protected viewing session.</p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <select
                value={expiresInMinutes}
                onChange={(event) => setExpiresInMinutes(Number(event.target.value))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              >
                <option value={15}>Expires in 15 minutes</option>
                <option value={30}>Expires in 30 minutes</option>
                <option value={60}>Expires in 60 minutes</option>
              </select>
              <button
                type="button"
                disabled={busy || !selectedName || !selectedEvidence?.documents.length}
                onClick={generateCode}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ffb612] px-5 py-2.5 text-sm font-black text-[#18375f] disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4" /> Generate Code
              </button>
            </div>

            {latestCode && (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">Share this code once</div>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="font-mono text-4xl font-black tracking-[0.25em] text-slate-950 dark:text-white">{latestCode}</div>
                  <button type="button" onClick={copyLatestCode} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white sm:ml-auto dark:bg-white dark:text-slate-900">
                    <Copy className="h-4 w-4" /> Copy Code
                  </button>
                </div>
                <p className="mt-2 text-xs text-amber-800 dark:text-amber-200">Expires: {formatDateTime(latestCodeExpiresAt)}. The plain code is shown only when generated.</p>
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 px-4 py-4 sm:px-5 dark:border-slate-800">
              <h2 className="font-black text-slate-950 dark:text-white">Recent Access Codes</h2>
              <p className="mt-1 text-xs text-slate-500">Codes are stored hashed; the 6-digit value cannot be recovered after generation.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500 dark:bg-slate-950/50">
                  <tr>
                    <th className="px-4 py-3">Recognition</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Expires</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {codes.map((code) => (
                    <tr key={code.id}>
                      <td className="max-w-[320px] px-4 py-3 font-bold text-slate-800 dark:text-slate-200">{code.recognitionName}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDateTime(code.createdAt)}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDateTime(code.expiresAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${code.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : code.status === 'USED' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                          {code.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {code.status === 'ACTIVE' && (
                          <button type="button" onClick={() => revokeCode(code.id)} className="rounded-lg bg-rose-50 px-3 py-1.5 text-[10px] font-black text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">Revoke</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {codes.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">No access codes generated yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
