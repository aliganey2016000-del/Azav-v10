import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, CheckCircle2, ChevronRight, Clock3, Eye, FileText, GraduationCap, Loader2, Pencil, Plus, Search, Trash2, Upload, UserPlus, Users, X, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AdminApiService } from '../../services/admin.service';
import { AdminStudent } from '../../types/admin.types';
import { NOMINATION_DOCUMENT_TYPES } from '../../utils/documentTypes';

type PendingDoc = { docType: string; name: string; mimeType: string; base64Data: string };

type FormState = {
  fullName: string; studentId: string; gender: string; dateOfBirth: string; nationality: string;
  phone: string; email: string; password: string; address: string; faculty: string; program: string; academicLevel: string;
  expectedGraduationDate: string; requestedSpecialty: string; requestedDuration: string;
  trainingPurpose: string;
  documents: Record<string, PendingDoc>;
};

const emptyForm: FormState = {
  fullName: '', studentId: '', gender: 'Male', dateOfBirth: '', nationality: '', phone: '', email: '', password: '', address: '',
  faculty: '', program: '', academicLevel: 'Year 5', expectedGraduationDate: '', requestedSpecialty: '', requestedDuration: '8 weeks',
  trainingPurpose: '', documents: {},
};

const MAX_FILE_BYTES = 5 * 1024 * 1024;

const readFileAsDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result as string);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const durationToWeeks = (text: string) => parseInt(text, 10) || 8;

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
      fullName: `${s.firstName} ${s.lastName}`.trim(), studentId: s.studentNumber, gender: 'Male', dateOfBirth: '', nationality: '',
      phone: s.phone || '', email: s.email, password: '', address: '', faculty: '', program: s.specialty, academicLevel: s.studyYear || 'Year 5',
      expectedGraduationDate: '', requestedSpecialty: s.specialty, requestedDuration: s.durationWeeks ? `${s.durationWeeks} weeks` : '8 weeks',
      trainingPurpose: '', documents: {},
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
        ...(form.password ? { password: form.password } : {}),
        phone: form.phone,
        program: form.program,
        specialty: form.requestedSpecialty || form.program,
        academicLevel: form.academicLevel,
        durationWeeks: durationToWeeks(form.requestedDuration),
      };

      const studentId = editingId
        ? (await AdminApiService.updateNomination(editingId, payload))._id
        : (await AdminApiService.nominateStudent(payload))._id;

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
          <button onClick={openAdd} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-blue-700 shadow-lg transition hover:-translate-y-0.5"><Plus className="h-4 w-4" /> Nominate New Student</button>
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

      {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-[2px] sm:p-6" onMouseDown={e => { if (e.target === e.currentTarget) reset(); }}>
        <div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
          <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-600 p-5 text-white sm:p-6"><div className="flex items-start justify-between gap-4"><div className="flex gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15"><GraduationCap className="h-6 w-6"/></div><div><h2 className="text-xl font-black">{editingId ? 'Edit Student Nomination' : 'Nominate a Student'}</h2><p className="mt-1 text-xs text-blue-100">{editingId ? 'Update this student\'s nomination details' : 'Fill in student details for clinical training'}</p></div></div><button onClick={reset} className="rounded-xl bg-white/10 p-2 hover:bg-white/20"><X className="h-5 w-5"/></button></div></div>
          <div className="p-5 sm:p-6">
            <div className="mb-6 grid grid-cols-5 gap-2">{['Student Details','Academic Info','Training Request','Documents','Review & Submit'].map((label, i) => <div key={label} className="text-center"><div className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${step >= i+1 ? 'bg-blue-600 text-white' : 'border border-slate-300 bg-white text-slate-500'}`}>{i+1}</div><div className={`mt-1 hidden text-[10px] font-bold sm:block ${step === i+1 ? 'text-blue-700' : 'text-slate-400'}`}>{label}</div></div>)}</div>

            {submitError && <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">{submitError}</div>}

            {step === 1 && <Panel title="Student Information" subtitle="Basic personal details and student portal login credentials" tone="blue"><Grid><Field label="Full Name *"><Input value={form.fullName} onChange={v=>change('fullName',v)} placeholder="Enter full name"/></Field><Field label="Student ID *"><Input value={form.studentId} onChange={v=>change('studentId',v)} placeholder="Enter student ID"/></Field><Field label="Gender"><Select value={form.gender} onChange={v=>change('gender',v)} options={['Male','Female','Other']}/></Field><Field label="Date of Birth"><DateInput value={form.dateOfBirth} onChange={v=>change('dateOfBirth',v)}/></Field><Field label="Nationality"><Input value={form.nationality} onChange={v=>change('nationality',v)} placeholder="Nationality"/></Field><Field label="Phone Number"><Input value={form.phone} onChange={v=>change('phone',v)} placeholder="Phone number"/></Field><Field label="Login Email *"><div><Input type="email" value={form.email} onChange={v=>change('email',v)} placeholder="student@example.com"/><p className="mt-1 text-[10px] font-semibold text-slate-500">The student will use this email to sign in.</p></div></Field><Field label={editingId ? 'New Login Password' : 'Login Password *'}><div><Input type="password" value={form.password} onChange={v=>change('password',v)} placeholder={editingId ? 'Leave blank to keep current password' : 'Minimum 8 characters'}/><p className="mt-1 text-[10px] font-semibold text-slate-500">{editingId ? 'Only enter a password if you want to change the student login password.' : 'The student will use this password with the login email above.'}</p></div></Field><Field label="Address"><Input value={form.address} onChange={v=>change('address',v)} placeholder="Address"/></Field></Grid></Panel>}
            {step === 2 && <Panel title="Academic Information" subtitle={`${universityName} student academic details`} tone="emerald"><Grid><Field label="Faculty"><Input value={form.faculty} onChange={v=>change('faculty',v)} placeholder="Faculty"/></Field><Field label="Program *"><Input value={form.program} onChange={v=>change('program',v)} placeholder="Program"/></Field><Field label="Academic Level"><Select value={form.academicLevel} onChange={v=>change('academicLevel',v)} options={['Year 1','Year 2','Year 3','Year 4','Year 5','Intern']}/></Field><Field label="Expected Graduation"><DateInput value={form.expectedGraduationDate} onChange={v=>change('expectedGraduationDate',v)}/></Field></Grid></Panel>}
            {step === 3 && <Panel title="Training Request" subtitle="Requested clinical training details" tone="violet"><Grid><Field label="Clinical Specialty"><Input value={form.requestedSpecialty} onChange={v=>change('requestedSpecialty',v)} placeholder="e.g. General Surgery"/></Field><Field label="Duration"><Input value={form.requestedDuration} onChange={v=>change('requestedDuration',v)} placeholder="e.g. 8 weeks"/></Field><Field label="Training Purpose" wide><textarea value={form.trainingPurpose} onChange={e=>change('trainingPurpose',e.target.value)} className="min-h-24 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" placeholder="Brief purpose of training"/></Field></Grid></Panel>}
            {step === 4 && <Panel title="Supporting Documents" subtitle="Upload each required document below" tone="blue">
              {existingDocCount > 0 && <p className="mb-3 text-[11px] font-bold text-slate-500">{existingDocCount} document(s) already submitted for this student.</p>}
              {fileError && <p className="mb-2 text-[11px] font-bold text-rose-600">{fileError}</p>}
              <div className="space-y-2">
                {NOMINATION_DOCUMENT_TYPES.map(({ key, label }) => {
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
            </Panel>}
            {step === 5 && <div className="space-y-4"><Panel title="Review Nomination" subtitle="Confirm the information before submission" tone="emerald"><div className="grid gap-3 sm:grid-cols-2"><Review label="Student" value={form.fullName}/><Review label="Student ID" value={form.studentId}/><Review label="Login Email" value={form.email}/><Review label="Login Password" value={editingId ? (form.password ? 'Will be updated' : 'Unchanged') : (form.password ? 'Set' : 'Not set')}/><Review label="University" value={universityName}/><Review label="Program" value={form.program}/><Review label="Specialty" value={form.requestedSpecialty}/><Review label="Duration" value={form.requestedDuration}/></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{NOMINATION_DOCUMENT_TYPES.map(({key,label}) => <div key={key} className="flex items-center gap-2 text-xs"><span className={form.documents[key] ? 'text-emerald-600' : 'text-slate-300'}>●</span><span className={form.documents[key] ? 'font-bold text-slate-800' : 'text-slate-400'}>{label}</span></div>)}</div></Panel><div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs leading-5 text-blue-800">{editingId ? 'Saving will update this student\'s nomination record.' : <>After submission, the student is added to your nomination list with <b>Pending</b> status for AZAAM coordination.</>}</div></div>}

            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5"><button onClick={() => step === 1 ? reset() : setStep(step-1)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">{step === 1 ? 'Cancel' : 'Back'}</button>{step < 5 ? <button onClick={() => {
              if (step === 1 && (!form.fullName.trim() || !form.studentId.trim() || !form.email.trim() || (!editingId && form.password.length < 8) || (editingId && form.password.length > 0 && form.password.length < 8))) {
                setSubmitError(editingId ? 'Full name, student ID and login email are required. New password must be at least 8 characters when provided.' : 'Full name, student ID, login email and a password of at least 8 characters are required.');
                return;
              }
              setSubmitError(null);
              setStep(step+1);
            }} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-md">Next <ChevronRight className="h-4 w-4"/></button> : <button onClick={submit} disabled={submitting || !form.fullName.trim() || !form.studentId.trim() || !form.email.trim() || (!editingId && form.password.length < 8) || (editingId && form.password.length > 0 && form.password.length < 8)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-2.5 text-xs font-extrabold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-50">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4"/>} {editingId ? 'Save Changes' : 'Submit Nomination'}</button>}</div>
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
function DateInput({value,onChange}:{value:string;onChange:(v:string)=>void}){return <input type="date" value={value} onChange={e=>onChange(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"/>}
function Select({value,onChange,options}:{value:string;onChange:(v:string)=>void;options:string[]}){return <select value={value} onChange={e=>onChange(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">{options.map(o=><option key={o}>{o}</option>)}</select>}
function Review({label,value}:{label:string;value:string}){return <div className="rounded-xl border border-white bg-white/70 p-3"><div className="text-[10px] font-bold uppercase text-slate-400">{label}</div><div className="mt-1 text-sm font-extrabold text-slate-800">{value || '—'}</div></div>}
