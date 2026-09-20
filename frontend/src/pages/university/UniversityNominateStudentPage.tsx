import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, CheckCircle2, ChevronRight, Clock3, Download, Eye, FileSpreadsheet, FileText, GraduationCap, Loader2, MoreVertical, Pencil, Plus, Search, Trash2, Upload, UserPlus, Users, X, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AdminApiService } from '../../services/admin.service';
import { AdminStudent } from '../../types/admin.types';
import { NOMINATION_DOCUMENT_TYPES } from '../../utils/documentTypes';

type PendingDoc = { docType: string; name: string; mimeType: string; base64Data: string };

type StudentImportRow = {
  rowNumber: number;
  fullName: string;
  studentId: string;
  email: string;
  password: string;
  phone: string;
  program: string;
  academicLevel: string;
  error?: string;
};

const normalizeCsvHeader = (value: string) =>
  value
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const parseCsvRows = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (quoted && next === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (char === ',' && !quoted) {
      row.push(cell.trim());
      cell = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(cell.trim());
      cell = '';
      if (row.some((value) => value !== '')) rows.push(row);
      row = [];
      continue;
    }

    cell += char;
  }

  row.push(cell.trim());
  if (row.some((value) => value !== '')) rows.push(row);
  return rows;
};

type FormState = {
  fullName: string;
  studentId: string;
  phone: string;
  email: string;
  password: string;
  program: string;
  academicLevel: string;
  documents: Record<string, PendingDoc>;
};

const emptyForm: FormState = {
  fullName: '',
  studentId: '',
  phone: '',
  email: '',
  password: '',
  program: '',
  academicLevel: 'Year 5',
  documents: {},
};

const ESSENTIAL_NOMINATION_DOCUMENT_TYPES = NOMINATION_DOCUMENT_TYPES.filter(({ key }) =>
  ['NOMINATION_LETTER', 'ACADEMIC_TRANSCRIPT', 'STUDENT_ID', 'PASSPORT_COPY'].includes(key)
);

const MAX_FILE_BYTES = 5 * 1024 * 1024;

const readFileAsDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result as string);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

export const UniversityNominateStudentPage: React.FC = () => {
  const { user } = useAuth();
  const [universityName, setUniversityName] = useState(user?.universityName || user?.organizationName || '');
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [existingDocCount, setExistingDocCount] = useState(0);
  const [existingDocTypes, setExistingDocTypes] = useState<Set<string>>(new Set());
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [importRows, setImportRows] = useState<StudentImportRow[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const loadStudents = () => {
    setLoading(true);
    AdminApiService.getStudents({ limit: 100 })
      .then((res) => {
        setStudents(res.students);
        if (res.students[0]?.university?.name) setUniversityName(res.students[0].university.name);
      })
      .catch((e: any) => setLoadError(e.message || 'Failed to load nominated students.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (universityName || !user?.universityId) return;
    AdminApiService.getUniversityById(user.universityId)
      .then((res) => setUniversityName(res.university.name))
      .catch(() => {});
  }, [user?.universityId, universityName]);

  useEffect(() => {
    loadStudents();
  }, []);

  const change = (key: keyof FormState, value: string) => setForm(prev => ({ ...prev, [key]: value }));
  const reset = () => { setForm(emptyForm); setStep(1); setOpen(false); setEditingId(null); setFileError(null); setSubmitError(null); setExistingDocCount(0); };
  const openAdd = () => { setForm(emptyForm); setStep(1); setEditingId(null); setFileError(null); setSubmitError(null); setExistingDocCount(0); setOpen(true); };
  const openEdit = (s: AdminStudent) => {
    setForm({
      fullName: `${s.firstName} ${s.lastName}`.trim(),
      studentId: s.studentNumber,
      phone: s.phone || '',
      email: s.email,
      password: '',
      program: s.specialty || '',
      academicLevel: s.studyYear || 'Year 5',
      documents: {},
    });
    setStep(1);
    setEditingId(s._id);
    setFileError(null);
    setSubmitError(null);
    setExistingDocCount(s.documentsCount || 0);
    setExistingDocTypes(new Set());
    AdminApiService.getStudentDocuments(s._id)
      .then((docs) => setExistingDocTypes(new Set(docs.map((d: any) => d.type))))
      .catch(() => {});
    setOpen(true);
  };

  const setFileForType = async (docType: string, file: File | null) => {
    if (!file) return;
    setFileError(null);
    if (file.size > MAX_FILE_BYTES) {
      setFileError(`"${file.name}" exceeds the 5MB upload limit.`);
      return;
    }
    const base64Data = await readFileAsDataUrl(file);
    setForm(prev => ({ ...prev, documents: { ...prev.documents, [docType]: { docType, name: file.name, mimeType: file.type || 'application/octet-stream', base64Data } } }));
  };

  const removeDocument = (docType: string) => setForm(prev => {
    const documents = { ...prev.documents };
    delete documents[docType];
    return { ...prev, documents };
  });
  const filtered = useMemo(
    () => students.filter(s => `${s.firstName} ${s.lastName} ${s.studentNumber} ${s.specialty}`.toLowerCase().includes(query.toLowerCase())),
    [students, query]
  );
  const pending = students.filter(s => s.applicationStatus === 'SUBMITTED' || s.applicationStatus === 'UNDER_REVIEW' || s.applicationStatus === 'CORRECTION_REQUESTED').length;
  const approved = students.filter(s => s.applicationStatus === 'ACCEPTED').length;
  const rejected = students.filter(s => s.applicationStatus === 'REJECTED').length;

  const closeImport = () => {
    if (importing) return;
    setImportOpen(false);
    setImportFileName('');
    setImportRows([]);
    setImportError(null);
  };

  const downloadImportTemplate = () => {
    const headers = [
      'Full Name',
      'Student ID',
      'Phone Number',
      'Login Email',
      'Login Password',
      'Program',
      'Academic Level',
    ];

    const csv = headers.map((value) => '"' + value.replace(/"/g, '""') + '"').join(',') + '\n';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'azaam-student-import-template.csv';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const readImportFile = async (file: File | null) => {
    if (!file) return;

    setImportError(null);
    setImportRows([]);
    setImportFileName(file.name);

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setImportError('Please upload the completed CSV template.');
      return;
    }

    try {
      const text = await file.text();
      const rows = parseCsvRows(text);
      if (rows.length < 2) {
        setImportError('The file has no student rows. Add students below the template header and upload it again.');
        return;
      }

      const headers = rows[0].map(normalizeCsvHeader);
      const headerIndex = (aliases: string[]) =>
        headers.findIndex((header) => aliases.some((alias) => normalizeCsvHeader(alias) === header));

      const indexes = {
        fullName: headerIndex(['Full Name', 'Name']),
        studentId: headerIndex(['Student ID', 'Student Number']),
        phone: headerIndex(['Phone Number', 'Phone']),
        email: headerIndex(['Login Email', 'Email']),
        password: headerIndex(['Login Password', 'Password']),
        program: headerIndex(['Program', 'Programme']),
        academicLevel: headerIndex(['Academic Level', 'Study Year', 'Year']),
      };

      const missing = [
        ['Full Name', indexes.fullName],
        ['Student ID', indexes.studentId],
        ['Login Email', indexes.email],
        ['Login Password', indexes.password],
        ['Program', indexes.program],
      ]
        .filter(([, index]) => Number(index) < 0)
        .map(([label]) => String(label));

      if (missing.length) {
        setImportError('Missing required column(s): ' + missing.join(', ') + '. Please use the downloaded template.');
        return;
      }

      const valueAt = (row: string[], index: number) => (index >= 0 ? String(row[index] || '').trim() : '');

      const parsed = rows.slice(1).map((row, index): StudentImportRow => {
        const fullName = valueAt(row, indexes.fullName);
        const studentId = valueAt(row, indexes.studentId);
        const phone = valueAt(row, indexes.phone);
        const email = valueAt(row, indexes.email).toLowerCase();
        const password = valueAt(row, indexes.password);
        const program = valueAt(row, indexes.program);
        const academicLevel = valueAt(row, indexes.academicLevel) || 'Year 5';

        const errors: string[] = [];
        if (!fullName) errors.push('Full Name required');
        if (!studentId) errors.push('Student ID required');
        if (!email || !email.includes('@')) errors.push('Valid email required');
        if (password.length < 8) errors.push('Password must be at least 8 characters');
        if (!program) errors.push('Program required');

        return {
          rowNumber: index + 2,
          fullName,
          studentId,
          phone,
          email,
          password,
          program,
          academicLevel,
          error: errors.length ? errors.join(' · ') : undefined,
        };
      });

      setImportRows(parsed);
    } catch {
      setImportError('Unable to read this CSV file. Please download a fresh template and try again.');
    }
  };

  const importStudents = async () => {
    const validRows = importRows.filter((row) => !row.error);
    if (!validRows.length || validRows.length !== importRows.length) return;

    setImporting(true);
    setImportError(null);

    let importedCount = 0;
    const failures: string[] = [];

    for (const row of validRows) {
      try {
        await AdminApiService.nominateStudent({
          fullName: row.fullName,
          studentNumber: row.studentId,
          phone: row.phone || undefined,
          email: row.email,
          password: row.password,
          program: row.program,
          specialty: row.program,
          academicLevel: row.academicLevel || 'Year 5',
          durationWeeks: 8,
        });
        importedCount += 1;
      } catch (error: any) {
        failures.push(
          'Row ' +
            row.rowNumber +
            ' (' +
            row.studentId +
            '): ' +
            (error?.response?.data?.error?.message || error?.message || 'Import failed')
        );
      }
    }

    if (failures.length) {
      setImportError(
        importedCount +
          ' student(s) imported. ' +
          failures.length +
          ' failed: ' +
          failures.slice(0, 3).join(' | ') +
          (failures.length > 3 ? ' | +' + (failures.length - 3) + ' more' : '')
      );
      setImporting(false);
      if (importedCount > 0) loadStudents();
      return;
    }

    setImporting(false);
    closeImport();
    setSuccessMessage(importedCount + ' student(s) imported and nominated successfully.');
    window.setTimeout(() => setSuccessMessage(null), 4500);
    loadStudents();
  };

  const submit = async () => {
    if (!form.fullName.trim() || !form.studentId.trim() || !form.email.trim()) return;
    if (!editingId && form.password.length < 8) {
      setSubmitError('Login password must be at least 8 characters.');
      setStep(1);
      return;
    }
    if (editingId && form.password && form.password.length < 8) {
      setSubmitError('New password must be at least 8 characters.');
      setStep(1);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        studentNumber: form.studentId.trim(),
        email: form.email.trim(),
        phone: form.phone,
        program: form.program,
        specialty: form.program,
        academicLevel: form.academicLevel,
        durationWeeks: 8,
      };

      const studentId = editingId
        ? (await AdminApiService.updateNomination(editingId, {
            ...payload,
            ...(form.password ? { password: form.password } : {}),
          }))._id
        : (await AdminApiService.nominateStudent({
            ...payload,
            password: form.password,
          }))._id;

      for (const doc of Object.values(form.documents)) {
        await AdminApiService.uploadStudentDocument(studentId, { originalName: doc.name, mimeType: doc.mimeType, base64Data: doc.base64Data, type: doc.docType });
      }

      reset();
      setSuccessMessage(editingId ? 'Student nomination updated successfully.' : 'Student nomination has been successfully submitted to AZAAM.');
      window.setTimeout(() => setSuccessMessage(null), 4500);
      loadStudents();
    } catch (e: any) {
      setSubmitError(e?.response?.data?.error?.message || e.message || 'Failed to save nomination.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 pb-8">
      {successMessage && (
        <div className="fixed inset-x-3 top-20 z-[70] mx-auto max-w-md sm:inset-x-auto sm:right-5 sm:top-20">
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-white px-4 py-3.5 shadow-2xl dark:border-emerald-500/30 dark:bg-[#0f1b2d]">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-slate-950 dark:text-white">Submission successful</p>
              <p className="mt-0.5 text-xs leading-5 text-slate-600 dark:text-slate-300">{successMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              aria-label="Close success message"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-blue-700 to-teal-500 p-6 text-white shadow-lg sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-100"><GraduationCap className="h-4 w-4" /> {universityName}</div><h1 className="text-2xl font-black sm:text-3xl">Student Nomination</h1><p className="mt-1 max-w-2xl text-sm text-blue-100">Nominate eligible students for clinical training and track every submission from one workspace.</p></div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                aria-label="Nomination actions"
                onClick={() => setHeaderMenuOpen((current) => !current)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/25 bg-white/10 text-white shadow-sm transition hover:bg-white/20"
              >
                <MoreVertical className="h-5 w-5" />
              </button>

              {headerMenuOpen && (
                <div className="absolute right-0 top-12 z-30 w-56 rounded-2xl border border-slate-200 bg-white p-2 text-left shadow-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      setHeaderMenuOpen(false);
                      setImportOpen(true);
                      setImportFileName('');
                      setImportRows([]);
                      setImportError(null);
                    }}
                    className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-extrabold text-slate-700 transition hover:bg-slate-50"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                      <Upload className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block">Import Students</span>
                      <span className="mt-0.5 block text-[10px] font-semibold text-slate-400">Bulk nomination from CSV</span>
                    </span>
                  </button>
                </div>
              )}
            </div>

            <button onClick={openAdd} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-blue-700 shadow-lg transition hover:-translate-y-0.5"><Plus className="h-4 w-4" /> Nominate New Student</button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Total Nominated" value={students.length} sub="All submissions" icon={Users} tone="from-emerald-50 to-teal-50 text-emerald-700" />
        <Stat label="Pending Review" value={pending} sub="Awaiting decision" icon={Clock3} tone="from-blue-50 to-sky-50 text-blue-700" />
        <Stat label="Approved" value={approved} sub="Ready for placement" icon={CheckCircle2} tone="from-green-50 to-emerald-50 text-green-700" />
        <Stat label="Rejected" value={rejected} sub="Requires action" icon={XCircle} tone="from-rose-50 to-red-50 text-rose-700" />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name, ID or program..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-blue-500"/></div>
          <div className="text-xs font-semibold text-slate-500">{filtered.length} nominated student{filtered.length === 1 ? '' : 's'}</div>
        </div>
        {loading ? <div className="p-12 text-center text-xs text-slate-500">Loading nominated students…</div> :
        loadError ? <div className="p-12 text-center text-xs font-bold text-rose-600">{loadError}</div> :
        filtered.length === 0 ? <div className="p-12 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><UserPlus className="h-7 w-7"/></div><h3 className="mt-4 font-extrabold text-slate-900">No nominations yet</h3><p className="mt-1 text-xs text-slate-500">Use “Nominate New Student” to add your first student.</p></div> :
        <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Student</th><th className="px-5 py-3">Student ID</th><th className="px-5 py-3">Program / Specialty</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((s, i) => <tr key={s._id} className="hover:bg-slate-50"><td className="px-5 py-4"><div className="flex items-center gap-3"><div className={`flex h-9 w-9 items-center justify-center rounded-xl font-black ${['bg-blue-100 text-blue-700','bg-emerald-100 text-emerald-700','bg-violet-100 text-violet-700','bg-amber-100 text-amber-700'][i%4]}`}>{s.firstName.charAt(0).toUpperCase()}</div><div><div className="font-extrabold text-slate-900">{s.firstName} {s.lastName}</div><div className="text-[10px] text-slate-500">{s.email}</div></div></div></td><td className="px-5 py-4 font-mono text-slate-600">{s.studentNumber}</td><td className="px-5 py-4 font-semibold text-slate-700">{s.specialty}</td><td className="px-5 py-4"><Status status={s.applicationStatus}/></td><td className="px-5 py-4"><div className="flex justify-end gap-2"><Link to={`/university/students/${s._id}`} title="View Journey" className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"><Eye className="h-4 w-4"/></Link><button title="Edit" onClick={() => openEdit(s)} className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"><Pencil className="h-4 w-4"/></button></div></td></tr>)}</tbody></table></div>}
      </section>

      {importOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-[2px] sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeImport();
          }}
        >
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl dark:bg-[#0f1b2d]">
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0f1b2d] sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl font-black text-slate-950 dark:text-white">Import Students</h2>
                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                      Bulk nominate students for clinical training using the AZAAM CSV template.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeImport}
                  disabled={importing}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-40 dark:bg-slate-800 dark:text-slate-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4 p-5 sm:p-6">
              {importError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold leading-5 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                  {importError}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-500/20 dark:bg-blue-500/10">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                      <Download className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-900 dark:text-white">1. Download Template</div>
                      <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                        Use the official columns so the import can validate each student correctly.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={downloadImportTemplate}
                    className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 text-xs font-black text-white hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4" />
                    Download CSV Template
                  </button>
                </div>

                <label className="cursor-pointer rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/60 p-4 transition hover:bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                      <Upload className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-900 dark:text-white">2. Upload Completed File</div>
                      <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                        CSV columns match Add Student: Full Name, Student ID, Phone Number, Login Email, Login Password, Program and Academic Level.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex min-h-10 items-center justify-center rounded-xl border border-emerald-200 bg-white px-3 text-xs font-black text-emerald-700 dark:border-emerald-500/20 dark:bg-slate-900 dark:text-emerald-300">
                    {importFileName || 'Choose CSV File'}
                  </div>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    disabled={importing}
                    onChange={(event) => void readImportFile(event.target.files?.[0] || null)}
                  />
                </label>
              </div>

              {importRows.length > 0 && (
                <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="flex flex-col gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-black text-slate-900 dark:text-white">Import Preview</div>
                      <div className="mt-0.5 text-[10px] font-semibold text-slate-500">
                        {importRows.length} row{importRows.length === 1 ? '' : 's'} · {importRows.filter((row) => !row.error).length} ready · {importRows.filter((row) => row.error).length} need attention
                      </div>
                    </div>
                  </div>

                  <div className="max-h-64 overflow-auto">
                    <table className="min-w-[650px] w-full text-left text-xs">
                      <thead className="sticky top-0 bg-white text-[9px] font-black uppercase tracking-wide text-slate-400 dark:bg-[#0f1b2d]">
                        <tr>
                          <th className="px-4 py-3">Row</th>
                          <th className="px-4 py-3">Student</th>
                          <th className="px-4 py-3">Student ID</th>
                          <th className="px-4 py-3">Program</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {importRows.slice(0, 25).map((row) => (
                          <tr key={row.rowNumber}>
                            <td className="px-4 py-3 font-mono text-slate-500">{row.rowNumber}</td>
                            <td className="px-4 py-3">
                              <div className="font-black text-slate-900 dark:text-white">{row.fullName || '—'}</div>
                              <div className="mt-0.5 text-[10px] text-slate-500">{row.email || '—'}</div>
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">{row.studentId || '—'}</td>
                            <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">{row.program || '—'}</td>
                            <td className="px-4 py-3">
                              {row.error ? (
                                <span className="text-[10px] font-bold text-rose-600">{row.error}</span>
                              ) : (
                                <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-[9px] font-black text-emerald-700">Ready</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {importRows.length > 25 && (
                    <div className="border-t border-slate-100 px-4 py-2 text-[10px] font-semibold text-slate-500 dark:border-slate-800">
                      Showing first 25 of {importRows.length} rows.
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={importing}
                  onClick={closeImport}
                  className="min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-black text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={
                    importing ||
                    importRows.length === 0 ||
                    importRows.some((row) => Boolean(row.error))
                  }
                  onClick={() => void importStudents()}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 text-sm font-black text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {importing ? 'Importing...' : 'Import ' + importRows.length + ' Student' + (importRows.length === 1 ? '' : 's')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-[2px] sm:p-6" onMouseDown={e => { if (e.target === e.currentTarget) reset(); }}>
        <div className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
          <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-600 p-5 text-white sm:p-6"><div className="flex items-start justify-between gap-4"><div className="flex gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15"><GraduationCap className="h-6 w-6"/></div><div><h2 className="text-xl font-black">{editingId ? 'Edit Student Nomination' : 'Nominate a Student'}</h2><p className="mt-1 text-xs text-blue-100">{editingId ? 'Update this student\'s nomination details' : 'Fill in student details for clinical training'}</p></div></div><button onClick={reset} className="rounded-xl bg-white/10 p-2 hover:bg-white/20"><X className="h-5 w-5"/></button></div></div>
          <div className="p-5 sm:p-6">
            <div className="mb-6 grid grid-cols-3 gap-2">{['Student Details','Academic & Training','Documents & Submit'].map((label, i) => <div key={label} className="text-center"><div className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${step >= i+1 ? 'bg-blue-600 text-white' : 'border border-slate-300 bg-white text-slate-500'}`}>{i+1}</div><div className={`mt-1 hidden text-[10px] font-bold sm:block ${step === i+1 ? 'text-blue-700' : 'text-slate-400'}`}>{label}</div></div>)}</div>

            {submitError && <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">{submitError}</div>}

            {step === 1 && (
              <Panel title="Student Information" subtitle={editingId ? 'Same student details used when adding a nomination' : 'Core student details used by Add, Edit and Import'} tone="blue">
                <Grid>
                  <Field label="Full Name *"><Input value={form.fullName} onChange={v=>change('fullName',v)} placeholder="Enter full name"/></Field>
                  <Field label="Student ID *"><Input value={form.studentId} onChange={v=>change('studentId',v)} placeholder="Enter student ID"/></Field>
                  <Field label="Phone Number"><Input value={form.phone} onChange={v=>change('phone',v)} placeholder="Phone number"/></Field>
                  <Field label="Login Email *"><Input type="email" value={form.email} onChange={v=>change('email',v)} placeholder="student@example.com"/></Field>
                  <Field label={editingId ? 'New Login Password' : 'Login Password *'} wide>
                    <div className="sm:max-w-[calc(50%-0.5rem)]">
                      <Input type="password" value={form.password} onChange={v=>change('password',v)} placeholder={editingId ? 'Leave blank to keep current password' : 'Minimum 8 characters'}/>
                      <p className="mt-1 text-[10px] font-semibold text-slate-500">{editingId ? 'Leave blank unless you want to change the student password.' : 'Used by the student to sign in.'}</p>
                    </div>
                  </Field>
                </Grid>
              </Panel>
            )}

            {step === 2 && (
              <Panel title="Academic & Training" subtitle="Essential academic information" tone="emerald">
                <Grid>
                  <Field label="Program *"><Input value={form.program} onChange={v=>change('program',v)} placeholder="e.g. Medicine"/></Field>
                  <Field label="Academic Level"><Select value={form.academicLevel} onChange={v=>change('academicLevel',v)} options={['Year 1','Year 2','Year 3','Year 4','Year 5','Intern']}/></Field>
                </Grid>
              </Panel>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <Panel title="Key Supporting Documents" subtitle="Upload only the main documents needed for the nomination" tone="blue">
                  {existingDocCount > 0 && <p className="mb-3 text-[11px] font-bold text-slate-500">{existingDocCount} document(s) already submitted for this student.</p>}
                  {fileError && <p className="mb-2 text-[11px] font-bold text-rose-600">{fileError}</p>}
                  <div className="space-y-2">
                    {ESSENTIAL_NOMINATION_DOCUMENT_TYPES.map(({ key, label }) => {
                      const doc = form.documents[key];
                      const alreadySubmitted = !doc && existingDocTypes.has(key);
                      return (
                        <div key={key} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                          <div className="flex min-w-0 items-center gap-2">
                            <FileText className={`h-4 w-4 shrink-0 ${doc || alreadySubmitted ? 'text-emerald-600' : 'text-slate-400'}`} />
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-800">{label}</div>
                              {doc && <div className="truncate text-[11px] text-emerald-700">{doc.name}</div>}
                              {alreadySubmitted && <div className="text-[11px] text-emerald-700">Already submitted</div>}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {doc && <button type="button" onClick={() => removeDocument(key)} className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" /></button>}
                            <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-blue-100 px-2.5 py-1.5 text-[11px] font-bold text-blue-800 hover:bg-blue-200">
                              <Upload className="h-3 w-3" /> {doc || alreadySubmitted ? 'Replace' : 'Upload'}
                              <input type="file" className="hidden" onChange={e => setFileForType(key, e.target.files?.[0] || null)} />
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Panel>

                <Panel title="Quick Review" subtitle="Confirm the core nomination details before saving" tone="emerald">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Review label="Student" value={form.fullName}/>
                    <Review label="Student ID" value={form.studentId}/>
                    <Review label="Login Email" value={form.email}/>
                    <Review label="University" value={universityName}/>
                    <Review label="Program" value={form.program}/>
                    <Review label="Academic Level" value={form.academicLevel}/>
                  </div>
                </Panel>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
              <button onClick={() => step === 1 ? reset() : setStep(step-1)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">{step === 1 ? 'Cancel' : 'Back'}</button>
              {step < 3 ? (
                <button onClick={() => {
                  if (step === 1 && (!form.fullName.trim() || !form.studentId.trim() || !form.email.trim() || (!editingId && form.password.length < 8) || (editingId && form.password.length > 0 && form.password.length < 8))) {
                    setSubmitError(editingId ? 'Full name, student ID and login email are required. New password must be at least 8 characters when provided.' : 'Full name, student ID, login email and a password of at least 8 characters are required.');
                    return;
                  }
                  if (step === 2 && !form.program.trim()) {
                    setSubmitError('Program is required.');
                    return;
                  }
                  setSubmitError(null);
                  setStep(step+1);
                }} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-md">Next <ChevronRight className="h-4 w-4"/></button>
              ) : (
                <button onClick={submit} disabled={submitting || !form.fullName.trim() || !form.studentId.trim() || !form.email.trim() || !form.program.trim() || (!editingId && form.password.length < 8) || (editingId && form.password.length > 0 && form.password.length < 8)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-2.5 text-xs font-extrabold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-50">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4"/>} {editingId ? 'Save Changes' : 'Submit Nomination'}</button>
              )}
            </div>
          </div>
        </div>
      </div>}
    </div>
  );
};

function Stat({label,value,sub,icon:Icon,tone}: any){return <div className={`rounded-2xl border border-slate-200 bg-gradient-to-br ${tone} p-4 shadow-sm sm:p-5`}><div className="flex items-start justify-between"><div><p className="text-[11px] font-bold text-slate-500">{label}</p><p className="mt-1 text-2xl font-black text-slate-900">{value}</p><p className="mt-1 text-[10px] text-slate-500">{sub}</p></div><div className="rounded-xl bg-white/80 p-2.5 shadow-sm"><Icon className="h-5 w-5"/></div></div></div>}
function Status({status}:{status:AdminStudent['applicationStatus']}){const map:any={SUBMITTED:['Pending','bg-amber-100 text-amber-700'],UNDER_REVIEW:['In Review','bg-blue-100 text-blue-700'],ACCEPTED:['Approved','bg-emerald-100 text-emerald-700'],REJECTED:['Rejected','bg-rose-100 text-rose-700'],CORRECTION_REQUESTED:['Correction Needed','bg-orange-100 text-orange-700']};const [label,cls]=map[status]||map.SUBMITTED;return <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${cls}`}>{label}</span>}
function Panel({title,subtitle,tone,children}:any){const cls=tone==='emerald'?'from-emerald-50 to-teal-50 border-emerald-100':tone==='violet'?'from-violet-50 to-indigo-50 border-violet-100':'from-blue-50 to-sky-50 border-blue-100';return <div className={`rounded-2xl border bg-gradient-to-br ${cls} p-4 sm:p-5`}><div className="mb-4"><h3 className="font-extrabold text-slate-900">{title}</h3><p className="text-[11px] text-slate-500">{subtitle}</p></div>{children}</div>}
function Grid({children}:{children:React.ReactNode}){return <div className="grid gap-4 sm:grid-cols-2">{children}</div>}
function Field({label,children,wide=false}:{label:string;children:React.ReactNode;wide?:boolean}){return <label className={`block ${wide?'sm:col-span-2':''}`}><span className="mb-1.5 block text-xs font-bold text-slate-700">{label}</span>{children}</label>}
function Input({value,onChange,placeholder,type='text'}:{value:string;onChange:(v:string)=>void;placeholder:string;type?:string}){return <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"/>}
function Select({value,onChange,options}:{value:string;onChange:(v:string)=>void;options:string[]}){return <select value={value} onChange={e=>onChange(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">{options.map(o=><option key={o}>{o}</option>)}</select>}
function Review({label,value}:{label:string;value:string}){return <div className="rounded-xl border border-white bg-white/70 p-3"><div className="text-[10px] font-bold uppercase text-slate-400">{label}</div><div className="mt-1 text-sm font-extrabold text-slate-800">{value || '—'}</div></div>}
