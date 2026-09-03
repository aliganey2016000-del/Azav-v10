import React from 'react';
import { CheckCircle2, Clock3, AlertCircle, ShieldCheck, Plane, Building2, FileText, Award, GraduationCap } from 'lucide-react';

const statuses = [
  { label: 'Student Nominated', value: '✓', tone: 'success' },
  { label: 'Documents Submitted', value: '✓', tone: 'success' },
  { label: 'Fees', value: '✓ Paid', tone: 'success' },
  { label: 'Visa', value: '🟡 Processing', tone: 'warning' },
  { label: 'Accommodation', value: '🟢 Confirmed', tone: 'success' },
  { label: 'Hospital', value: '🟢 Assigned', tone: 'success' },
  { label: 'Department', value: '🟢 Assigned', tone: 'success' },
  { label: 'Supervisor', value: '🟢 Assigned', tone: 'success' },
  { label: 'Clinical Training', value: '🟢 Active', tone: 'success' },
  { label: 'Attendance', value: '🟢 94%', tone: 'success' },
  { label: 'Logsheet / Logbook', value: '🟢 80% Complete', tone: 'success' },
  { label: 'Evaluation', value: '🟡 Pending', tone: 'warning' },
  { label: 'Grade', value: '🟡 Pending', tone: 'warning' },
  { label: 'Training Completion', value: '🟡 Pending', tone: 'warning' },
  { label: 'Certificate', value: '🟡 Pending', tone: 'warning' },
];

export const UniversityStudentStatusPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">Student Status</h1>
        <p className="mt-2 text-sm text-slate-300">Monitor each nominated student’s progress without directly managing AZAAM or hospital operations.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {statuses.map((status, index) => (
          <div key={index} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-slate-800">{status.label}</span>
              <span className={status.tone === 'success' ? 'text-emerald-700' : status.tone === 'warning' ? 'text-amber-700' : 'text-slate-700'}>
                {status.tone === 'success' ? <CheckCircle2 className="h-5 w-5" /> : status.tone === 'warning' ? <Clock3 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              </span>
            </div>
            <div className="mt-2 text-sm font-medium text-slate-700">{status.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Status Summary</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MiniCard icon={<Plane className="h-4 w-4" />} label="Visa" value="Processing" tone="amber" />
          <MiniCard icon={<Building2 className="h-4 w-4" />} label="Accommodation" value="Confirmed" tone="emerald" />
          <MiniCard icon={<ShieldCheck className="h-4 w-4" />} label="Hospital" value="Assigned" tone="emerald" />
          <MiniCard icon={<Award className="h-4 w-4" />} label="Evaluation" value="Pending" tone="amber" />
        </div>
      </div>
    </div>
  );
};

function MiniCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: 'amber' | 'emerald' }) {
  return (
    <div className={`rounded-xl border p-4 ${tone === 'emerald' ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
      <div className={`mb-2 inline-flex rounded-lg p-2 ${tone === 'emerald' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{icon}</div>
      <div className="text-xs uppercase tracking-[0.12em] text-slate-500">{label}</div>
      <div className="mt-1 text-base font-bold text-slate-900">{value}</div>
    </div>
  );
}
