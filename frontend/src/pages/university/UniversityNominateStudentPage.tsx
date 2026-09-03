import React, { useState } from 'react';
import { UserPlus, Upload, FileText, CheckCircle2, ArrowRight, GraduationCap, Plane, ShieldCheck } from 'lucide-react';

export const UniversityNominateStudentPage: React.FC = () => {
  const [form, setForm] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: 'Male',
    nationality: '',
    passportNumber: '',
    passportExpiry: '',
    email: '',
    phone: '',
    address: '',
    university: '',
    faculty: '',
    program: '',
    department: '',
    studentId: '',
    academicLevel: 'Year 5',
    expectedGraduationDate: '',
    academicStatus: 'Active',
    requestedSpecialty: 'General Surgery',
    requestedDuration: '8 weeks',
    preferredStartDate: '',
    preferredEndDate: '',
    trainingPurpose: '',
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    alert('Student nomination submitted to AZAAM for coordination.');
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="rounded-xl bg-sky-500/20 p-2">
            <UserPlus className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold">Nominate Student</h1>
        </div>
        <p className="text-sm text-slate-300">
          University nominates the student to AZAAM. Final hospital, visa, accommodation, and supervisor assignment remain under AZAAM coordination.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Personal Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name"><input value={form.fullName} onChange={(e) => handleChange('fullName', e.target.value)} className="input" /></Field>
              <Field label="Date of birth"><input type="date" value={form.dateOfBirth} onChange={(e) => handleChange('dateOfBirth', e.target.value)} className="input" /></Field>
              <Field label="Gender"><select value={form.gender} onChange={(e) => handleChange('gender', e.target.value)} className="input"><option>Male</option><option>Female</option><option>Other</option></select></Field>
              <Field label="Nationality"><input value={form.nationality} onChange={(e) => handleChange('nationality', e.target.value)} className="input" /></Field>
              <Field label="Passport number"><input value={form.passportNumber} onChange={(e) => handleChange('passportNumber', e.target.value)} className="input" /></Field>
              <Field label="Passport expiry"><input type="date" value={form.passportExpiry} onChange={(e) => handleChange('passportExpiry', e.target.value)} className="input" /></Field>
              <Field label="Email" className="sm:col-span-2"><input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} className="input" /></Field>
              <Field label="Phone"><input value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} className="input" /></Field>
              <Field label="Address" className="sm:col-span-2"><input value={form.address} onChange={(e) => handleChange('address', e.target.value)} className="input" /></Field>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Academic Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="University"><input value={form.university} onChange={(e) => handleChange('university', e.target.value)} className="input" /></Field>
              <Field label="Faculty"><input value={form.faculty} onChange={(e) => handleChange('faculty', e.target.value)} className="input" /></Field>
              <Field label="Program"><input value={form.program} onChange={(e) => handleChange('program', e.target.value)} className="input" /></Field>
              <Field label="Department"><input value={form.department} onChange={(e) => handleChange('department', e.target.value)} className="input" /></Field>
              <Field label="Student ID"><input value={form.studentId} onChange={(e) => handleChange('studentId', e.target.value)} className="input" /></Field>
              <Field label="Academic level"><select value={form.academicLevel} onChange={(e) => handleChange('academicLevel', e.target.value)} className="input"><option>Year 4</option><option>Year 5</option><option>Intern</option></select></Field>
              <Field label="Expected graduation date"><input type="date" value={form.expectedGraduationDate} onChange={(e) => handleChange('expectedGraduationDate', e.target.value)} className="input" /></Field>
              <Field label="Academic status"><select value={form.academicStatus} onChange={(e) => handleChange('academicStatus', e.target.value)} className="input"><option>Active</option><option>Probation</option><option>Completed</option></select></Field>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Training Request</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Requested clinical specialty"><input value={form.requestedSpecialty} onChange={(e) => handleChange('requestedSpecialty', e.target.value)} className="input" /></Field>
            <Field label="Requested duration"><input value={form.requestedDuration} onChange={(e) => handleChange('requestedDuration', e.target.value)} className="input" /></Field>
            <Field label="Preferred start date"><input type="date" value={form.preferredStartDate} onChange={(e) => handleChange('preferredStartDate', e.target.value)} className="input" /></Field>
            <Field label="Preferred end date"><input type="date" value={form.preferredEndDate} onChange={(e) => handleChange('preferredEndDate', e.target.value)} className="input" /></Field>
            <Field label="Training purpose" className="sm:col-span-2 lg:col-span-3"><textarea value={form.trainingPurpose} onChange={(e) => handleChange('trainingPurpose', e.target.value)} className="input min-h-[100px]" /></Field>
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900">Supporting Documents</h3>
              <p className="text-xs text-slate-500">Passport, student ID, academic documents, CV, and support files.</p>
            </div>
            <label className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
              <Upload className="h-4 w-4" />
              Upload files
              <input type="file" multiple className="hidden" />
            </label>
          </div>
        </div>

        <div className="flex flex-wrap justify-between gap-3 border-t border-slate-200 pt-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Status: <span className="font-semibold text-emerald-700">NOMINATED → SUBMITTED TO AZAAM → UNDER AZAAM COORDINATION</span>
          </div>
          <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700">
            Submit Nomination <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block text-sm text-slate-700 ${className}`}>
      <span className="mb-1.5 block font-medium">{label}</span>
      {children}
    </label>
  );
}
