import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, CheckCircle2, ChevronRight, Clock3, Eye, FileText, GraduationCap, Pencil, Plus, Search, Trash2, Upload, UserPlus, Users, X, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { RealDataStore, RealTrainee, RealTraineeDocument } from '../../services/realDataStore';

type FormState = {
  fullName: string; studentId: string; gender: string; dateOfBirth: string; nationality: string;
  phone: string; email: string; address: string; faculty: string; program: string; academicLevel: string;
  expectedGraduationDate: string; requestedSpecialty: string; requestedDuration: string;
  preferredStartDate: string; preferredEndDate: string; trainingPurpose: string;
  documents: RealTraineeDocument[];
};

const emptyForm: FormState = {
  fullName: '', studentId: '', gender: 'Male', dateOfBirth: '', nationality: '', phone: '', email: '', address: '',
  faculty: '', program: '', academicLevel: 'Year 5', expectedGraduationDate: '', requestedSpecialty: '', requestedDuration: '8 weeks',
  preferredStartDate: '', preferredEndDate: '', trainingPurpose: '', documents: [],
};

const MAX_FILE_BYTES = 5 * 1024 * 1024;

const readFileAsDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result as string);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

export const UniversityNominateStudentPage: React.FC = () => {
  const { user } = useAuth();
  const universityName = user?.universityName || user?.organizationName || 'University';
  const [students, setStudents] = useState<RealTrainee[]>(() => RealDataStore.getTrainees());
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [fileError, setFileError] = useState<string | null>(null);

  const change = (key: keyof FormState, value: string) => setForm(prev => ({ ...prev, [key]: value }));
  const reset = () => { setForm(emptyForm); setStep(1); setOpen(false); setEditingId(null); setFileError(null); };
  const openAdd = () => { setForm(emptyForm); setStep(1); setEditingId(null); setFileError(null); setOpen(true); };
  const openEdit = (s: RealTrainee) => {
    setForm({
      fullName: s.studentName, studentId: s.studentId, gender: 'Male', dateOfBirth: '', nationality: '',
      phone: s.phone, email: s.email, address: '', faculty: '', program: s.specialty, academicLevel: s.studyYear || 'Year 5',
      expectedGraduationDate: '', requestedSpecialty: s.specialty, requestedDuration: s.durationWeeks ? `${s.durationWeeks} weeks` : '8 weeks',
      preferredStartDate: s.startDate, preferredEndDate: s.endDate, trainingPurpose: '', documents: s.documents || [],
    });
    setStep(1);
    setEditingId(s.id);
    setFileError(null);
    setOpen(true);
  };

  const addFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setFileError(null);
    const accepted: RealTraineeDocument[] = [];
    for (const file of Array.from(fileList)) {
      if (file.size > MAX_FILE_BYTES) {
        setFileError(`"${file.name}" exceeds the 5MB upload limit and was skipped.`);
        continue;
      }
      const dataUrl = await readFileAsDataUrl(file);
      accepted.push({ id: `DOC-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: file.name, type: file.type || 'application/octet-stream', dataUrl, uploadedAt: new Date().toISOString() });
    }
    if (accepted.length > 0) setForm(prev => ({ ...prev, documents: [...prev.documents, ...accepted] }));
  };

  const removeDocument = (id: string) => setForm(prev => ({ ...prev, documents: prev.documents.filter(d => d.id !== id) }));
  const filtered = useMemo(() => students.filter(s => `${s.studentName} ${s.studentId} ${s.specialty}`.toLowerCase().includes(query.toLowerCase())), [students, query]);
  const editingStudent = editingId ? students.find(s => s.id === editingId) : null;
  const pending = students.filter(s => s.applicationStatus === 'SUBMITTED' || s.applicationStatus === 'UNDER_REVIEW').length;
  const approved = students.filter(s => s.applicationStatus === 'ACCEPTED').length;
  const rejected = students.filter(s => s.applicationStatus === 'REJECTED').length;

  const submit = () => {
    if (!form.fullName.trim() || !form.studentId.trim() || !form.email.trim()) return;
    const weeks = parseInt(form.requestedDuration, 10) || 8;

    if (editingId) {
      const wasCorrectionRequested = editingStudent?.applicationStatus === 'CORRECTION_REQUESTED';
      setStudents(RealDataStore.updateTrainee(editingId, {
        studentName: form.fullName.trim(), studentId: form.studentId.trim(), email: form.email.trim(), phone: form.phone,
        studyYear: form.academicLevel, specialty: form.requestedSpecialty || form.program || 'Clinical Training',
        startDate: form.preferredStartDate, endDate: form.preferredEndDate, durationWeeks: weeks, documents: form.documents,
        ...(wasCorrectionRequested ? { applicationStatus: 'SUBMITTED' as const, reviewReason: undefined } : {}),
      }));
      reset();
      return;
    }

    const trainee: RealTrainee = {
      id: `TR-${Date.now()}`, studentName: form.fullName.trim(), studentId: form.studentId.trim(), email: form.email.trim(), phone: form.phone,
      studyYear: form.academicLevel, specialty: form.requestedSpecialty || form.program || 'Clinical Training', targetHospital: 'Pending AZAAM placement',
      cityCountry: '', startDate: form.preferredStartDate, endDate: form.preferredEndDate, durationWeeks: weeks, applicationStatus: 'SUBMITTED',
      documents: form.documents,
      visaStatus: 'NOT_REQUIRED', hospitalPlacementStatus: 'PENDING', assignedSupervisor: { name: 'Pending assignment', title: '', phone: '', email: '' },
      rotationSchedule: '', attendancePercent: 0, attendanceDays: { attended: 0, total: 0 }, logbookProceduresSigned: 0, logbookRequired: 0,
      evaluationScore: null, evaluationGrade: null, evaluationStatus: 'PENDING', certificateIssued: false, createdAt: new Date().toISOString(),
    };
    setStudents(RealDataStore.addTrainee(trainee));
    reset();
  };

  return (
    <div className="space-y-5 pb-8">
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
        {filtered.length === 0 ? <div className="p-12 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><UserPlus className="h-7 w-7"/></div><h3 className="mt-4 font-extrabold text-slate-900">No nominations yet</h3><p className="mt-1 text-xs text-slate-500">Use “Nominate New Student” to add your first student.</p></div> :
        <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Student</th><th className="px-5 py-3">Student ID</th><th className="px-5 py-3">Program / Specialty</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((s, i) => <tr key={s.id} className="hover:bg-slate-50"><td className="px-5 py-4"><div className="flex items-center gap-3"><div className={`flex h-9 w-9 items-center justify-center rounded-xl font-black ${['bg-blue-100 text-blue-700','bg-emerald-100 text-emerald-700','bg-violet-100 text-violet-700','bg-amber-100 text-amber-700'][i%4]}`}>{s.studentName.charAt(0).toUpperCase()}</div><div><div className="font-extrabold text-slate-900">{s.studentName}</div><div className="text-[10px] text-slate-500">{s.email}</div></div></div></td><td className="px-5 py-4 font-mono text-slate-600">{s.studentId}</td><td className="px-5 py-4 font-semibold text-slate-700">{s.specialty}</td><td className="px-5 py-4"><Status status={s.applicationStatus}/></td><td className="px-5 py-4"><div className="flex justify-end gap-2"><Link to={`/university/students/${s.id}`} title="View Journey" className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"><Eye className="h-4 w-4"/></Link><button title="Edit" onClick={() => openEdit(s)} className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"><Pencil className="h-4 w-4"/></button></div></td></tr>)}</tbody></table></div>}
      </section>

      {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-[2px] sm:p-6" onMouseDown={e => { if (e.target === e.currentTarget) reset(); }}>
        <div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
          <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-600 p-5 text-white sm:p-6"><div className="flex items-start justify-between gap-4"><div className="flex gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15"><GraduationCap className="h-6 w-6"/></div><div><h2 className="text-xl font-black">{editingId ? 'Edit Student Nomination' : 'Nominate a Student'}</h2><p className="mt-1 text-xs text-blue-100">{editingId ? 'Update this student\'s nomination details' : 'Fill in student details for clinical training'}</p></div></div><button onClick={reset} className="rounded-xl bg-white/10 p-2 hover:bg-white/20"><X className="h-5 w-5"/></button></div></div>
          <div className="p-5 sm:p-6">
            <div className="mb-6 grid grid-cols-5 gap-2">{['Student Details','Academic Info','Training Request','Documents','Review & Submit'].map((label, i) => <div key={label} className="text-center"><div className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${step >= i+1 ? 'bg-blue-600 text-white' : 'border border-slate-300 bg-white text-slate-500'}`}>{i+1}</div><div className={`mt-1 hidden text-[10px] font-bold sm:block ${step === i+1 ? 'text-blue-700' : 'text-slate-400'}`}>{label}</div></div>)}</div>

            {editingStudent?.applicationStatus === 'CORRECTION_REQUESTED' && editingStudent.reviewReason && (
              <div className="mb-5 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-xs leading-5 text-orange-900"><b>AZAAM requested a correction:</b> {editingStudent.reviewReason}</div>
            )}

            {step === 1 && <Panel title="Student Information" subtitle="Basic personal and contact details" tone="blue"><Grid><Field label="Full Name *"><Input value={form.fullName} onChange={v=>change('fullName',v)} placeholder="Enter full name"/></Field><Field label="Student ID *"><Input value={form.studentId} onChange={v=>change('studentId',v)} placeholder="Enter student ID"/></Field><Field label="Gender"><Select value={form.gender} onChange={v=>change('gender',v)} options={['Male','Female','Other']}/></Field><Field label="Date of Birth"><DateInput value={form.dateOfBirth} onChange={v=>change('dateOfBirth',v)}/></Field><Field label="Nationality"><Input value={form.nationality} onChange={v=>change('nationality',v)} placeholder="Nationality"/></Field><Field label="Phone Number"><Input value={form.phone} onChange={v=>change('phone',v)} placeholder="Phone number"/></Field><Field label="Email Address *"><Input type="email" value={form.email} onChange={v=>change('email',v)} placeholder="Email address"/></Field><Field label="Address"><Input value={form.address} onChange={v=>change('address',v)} placeholder="Address"/></Field></Grid></Panel>}
            {step === 2 && <Panel title="Academic Information" subtitle={`${universityName} student academic details`} tone="emerald"><Grid><Field label="Faculty"><Input value={form.faculty} onChange={v=>change('faculty',v)} placeholder="Faculty"/></Field><Field label="Program *"><Input value={form.program} onChange={v=>change('program',v)} placeholder="Program"/></Field><Field label="Academic Level"><Select value={form.academicLevel} onChange={v=>change('academicLevel',v)} options={['Year 1','Year 2','Year 3','Year 4','Year 5','Intern']}/></Field><Field label="Expected Graduation"><DateInput value={form.expectedGraduationDate} onChange={v=>change('expectedGraduationDate',v)}/></Field></Grid></Panel>}
            {step === 3 && <Panel title="Training Request" subtitle="Requested clinical training details" tone="violet"><Grid><Field label="Clinical Specialty"><Input value={form.requestedSpecialty} onChange={v=>change('requestedSpecialty',v)} placeholder="e.g. General Surgery"/></Field><Field label="Duration"><Input value={form.requestedDuration} onChange={v=>change('requestedDuration',v)} placeholder="e.g. 8 weeks"/></Field><Field label="Preferred Start Date"><DateInput value={form.preferredStartDate} onChange={v=>change('preferredStartDate',v)}/></Field><Field label="Preferred End Date"><DateInput value={form.preferredEndDate} onChange={v=>change('preferredEndDate',v)}/></Field><Field label="Training Purpose" wide><textarea value={form.trainingPurpose} onChange={e=>change('trainingPurpose',e.target.value)} className="min-h-24 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" placeholder="Brief purpose of training"/></Field></Grid></Panel>}
            {step === 4 && <Panel title="Supporting Documents" subtitle="Upload passport, transcripts, medical clearance and other required documents" tone="blue">
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-blue-300 bg-white/70 p-8 text-center hover:bg-blue-50">
                <Upload className="h-6 w-6 text-blue-600" />
                <span className="text-xs font-bold text-blue-700">Click to upload documents</span>
                <span className="text-[10px] text-slate-400">PDF, image or document files, up to 5MB each</span>
                <input type="file" multiple className="hidden" onChange={e => addFiles(e.target.files)} />
              </label>
              {fileError && <p className="mt-2 text-[11px] font-bold text-rose-600">{fileError}</p>}
              {form.documents.length > 0 && <div className="mt-4 space-y-2">{form.documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2"><FileText className="h-4 w-4 shrink-0 text-blue-700" /><span className="truncate text-xs font-bold text-slate-800">{doc.name}</span></div>
                  <button type="button" onClick={() => removeDocument(doc.id)} className="shrink-0 rounded-lg p-1.5 text-rose-600 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}</div>}
            </Panel>}
            {step === 5 && <div className="space-y-4"><Panel title="Review Nomination" subtitle="Confirm the information before submission" tone="emerald"><div className="grid gap-3 sm:grid-cols-2"><Review label="Student" value={form.fullName}/><Review label="Student ID" value={form.studentId}/><Review label="University" value={universityName}/><Review label="Program" value={form.program}/><Review label="Specialty" value={form.requestedSpecialty}/><Review label="Duration" value={form.requestedDuration}/><Review label="Documents" value={form.documents.length ? `${form.documents.length} file(s) attached` : 'None attached'}/></div></Panel><div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs leading-5 text-blue-800">{editingId ? 'Saving will update this student\'s nomination record.' : <>After submission, the student is added to your nomination list with <b>Pending</b> status for AZAAM coordination.</>}</div></div>}

            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5"><button onClick={() => step === 1 ? reset() : setStep(step-1)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">{step === 1 ? 'Cancel' : 'Back'}</button>{step < 5 ? <button onClick={() => setStep(step+1)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-md">Next <ChevronRight className="h-4 w-4"/></button> : <button onClick={submit} disabled={!form.fullName.trim() || !form.studentId.trim() || !form.email.trim()} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-2.5 text-xs font-extrabold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-50"><CheckCircle2 className="h-4 w-4"/> {editingId ? 'Save Changes' : 'Submit Nomination'}</button>}</div>
          </div>
        </div>
      </div>}
    </div>
  );
};

function Stat({label,value,sub,icon:Icon,tone}: any){return <div className={`rounded-2xl border border-slate-200 bg-gradient-to-br ${tone} p-4 shadow-sm sm:p-5`}><div className="flex items-start justify-between"><div><p className="text-[11px] font-bold text-slate-500">{label}</p><p className="mt-1 text-2xl font-black text-slate-900">{value}</p><p className="mt-1 text-[10px] text-slate-500">{sub}</p></div><div className="rounded-xl bg-white/80 p-2.5 shadow-sm"><Icon className="h-5 w-5"/></div></div></div>}
function Status({status}:{status:RealTrainee['applicationStatus']}){const map:any={SUBMITTED:['Pending','bg-amber-100 text-amber-700'],UNDER_REVIEW:['In Review','bg-blue-100 text-blue-700'],ACCEPTED:['Approved','bg-emerald-100 text-emerald-700'],REJECTED:['Rejected','bg-rose-100 text-rose-700'],CORRECTION_REQUESTED:['Correction Needed','bg-orange-100 text-orange-700']};const [label,cls]=map[status]||map.SUBMITTED;return <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${cls}`}>{label}</span>}
function Panel({title,subtitle,tone,children}:any){const cls=tone==='emerald'?'from-emerald-50 to-teal-50 border-emerald-100':tone==='violet'?'from-violet-50 to-indigo-50 border-violet-100':'from-blue-50 to-sky-50 border-blue-100';return <div className={`rounded-2xl border bg-gradient-to-br ${cls} p-4 sm:p-5`}><div className="mb-4"><h3 className="font-extrabold text-slate-900">{title}</h3><p className="text-[11px] text-slate-500">{subtitle}</p></div>{children}</div>}
function Grid({children}:{children:React.ReactNode}){return <div className="grid gap-4 sm:grid-cols-2">{children}</div>}
function Field({label,children,wide=false}:{label:string;children:React.ReactNode;wide?:boolean}){return <label className={`block ${wide?'sm:col-span-2':''}`}><span className="mb-1.5 block text-xs font-bold text-slate-700">{label}</span>{children}</label>}
function Input({value,onChange,placeholder,type='text'}:{value:string;onChange:(v:string)=>void;placeholder:string;type?:string}){return <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"/>}
function DateInput({value,onChange}:{value:string;onChange:(v:string)=>void}){return <input type="date" value={value} onChange={e=>onChange(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"/>}
function Select({value,onChange,options}:{value:string;onChange:(v:string)=>void;options:string[]}){return <select value={value} onChange={e=>onChange(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">{options.map(o=><option key={o}>{o}</option>)}</select>}
function Review({label,value}:{label:string;value:string}){return <div className="rounded-xl border border-white bg-white/70 p-3"><div className="text-[10px] font-bold uppercase text-slate-400">{label}</div><div className="mt-1 text-sm font-extrabold text-slate-800">{value || '—'}</div></div>}
