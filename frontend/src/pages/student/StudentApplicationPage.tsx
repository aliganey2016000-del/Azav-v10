import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import api from '../../services/api';

type ApplicationRecord = {
  _id: string;
  applicantType?: 'UNIVERSITY' | 'INDEPENDENT' | string;
  status?: string;
  programmeText?: string;
  specialtyText?: string;
  durationWeeks?: number;
  preferredStartDate?: string;
  preferredEndDate?: string;
  submissionDate?: string;
  createdAt?: string;
  universityId?: {
    _id?: string;
    name?: string;
    code?: string;
  } | string | null;
  programmeId?: Record<string, unknown> | string | null;
  specialtyId?: Record<string, unknown> | string | null;
  studentId?: {
    _id?: string;
    studentNumber?: string;
    userId?: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
    } | string | null;
  } | string | null;
};

const VERIFIED_STATUSES = new Set([
  'APPROVED',
  'PLACEMENT_PENDING',
  'PLACED',
  'SUPERVISOR_ASSIGNED',
  'ACTIVE',
  'COMPLETED',
  'CERTIFICATE_ISSUED',
]);

const PLACEMENT_STATUSES = new Set([
  'PLACED',
  'SUPERVISOR_ASSIGNED',
  'ACTIVE',
  'COMPLETED',
  'CERTIFICATE_ISSUED',
]);

const TRAINING_STATUSES = new Set([
  'ACTIVE',
  'COMPLETED',
  'CERTIFICATE_ISSUED',
]);

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const readNamedValue = (value?: Record<string, unknown> | string | null) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  for (const key of ['name', 'title', 'code']) {
    const candidate = value[key];
    if (typeof candidate === 'string' && candidate.trim()) return candidate;
  }
  return '';
};

const statusMeta = (status = 'SUBMITTED') => {
  const map: Record<string, { label: string; classes: string }> = {
    DRAFT: { label: 'Draft', classes: 'bg-slate-100 text-slate-700' },
    SUBMITTED: { label: 'Nominated', classes: 'bg-emerald-100 text-emerald-700' },
    UNDER_REVIEW: { label: 'Under Review', classes: 'bg-blue-100 text-blue-700' },
    DOCUMENTS_REQUIRED: { label: 'Documents Required', classes: 'bg-amber-100 text-amber-800' },
    APPROVED: { label: 'Verified', classes: 'bg-teal-100 text-teal-700' },
    PLACEMENT_PENDING: { label: 'Placement Pending', classes: 'bg-cyan-100 text-cyan-800' },
    PLACED: { label: 'Placed', classes: 'bg-indigo-100 text-indigo-700' },
    SUPERVISOR_ASSIGNED: { label: 'Supervisor Assigned', classes: 'bg-violet-100 text-violet-700' },
    ACTIVE: { label: 'Training Active', classes: 'bg-emerald-100 text-emerald-700' },
    COMPLETED: { label: 'Completed', classes: 'bg-green-100 text-green-700' },
    CERTIFICATE_ISSUED: { label: 'Certificate Issued', classes: 'bg-purple-100 text-purple-700' },
    REJECTED: { label: 'Rejected', classes: 'bg-rose-100 text-rose-700' },
  };
  return map[status] || { label: status.replaceAll('_', ' '), classes: 'bg-slate-100 text-slate-700' };
};

const nextStepMessage = (status = 'SUBMITTED') => {
  switch (status) {
    case 'DRAFT':
    case 'SUBMITTED':
      return 'AZAAM has received your university nomination. The nomination will now be verified before placement begins.';
    case 'UNDER_REVIEW':
      return 'Your nomination is being reviewed by AZAAM. You will be notified when verification is complete.';
    case 'DOCUMENTS_REQUIRED':
      return 'Additional information or documents are required. Check Documents and follow the latest instructions.';
    case 'APPROVED':
    case 'PLACEMENT_PENDING':
      return 'Your nomination has been verified. AZAAM is now arranging your clinical placement.';
    case 'PLACED':
      return 'Your clinical placement has been confirmed. Supervisor and training details will follow.';
    case 'SUPERVISOR_ASSIGNED':
      return 'Your placement and supervisor are ready. Check My Training for the next training steps.';
    case 'ACTIVE':
      return 'Your clinical training is active. Use My Training to follow attendance and training activity.';
    case 'COMPLETED':
      return 'Your clinical training is complete. Final completion and certificate processing may now continue.';
    case 'CERTIFICATE_ISSUED':
      return 'Your training journey is complete and your certificate has been issued.';
    case 'REJECTED':
      return 'This nomination requires attention. Contact your university or AZAAM support for the recorded decision.';
    default:
      return 'Follow this page for the latest nomination and placement updates.';
  }
};

export const StudentApplicationPage: React.FC = () => {
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadApplications = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/applications');
      const data = response.data?.data?.applications ?? response.data?.data ?? response.data;
      setApplications(Array.isArray(data) ? data : []);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error?.message || 'Unable to load your nomination.');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadApplications();
  }, []);

  const application = applications[0] || null;

  const details = useMemo(() => {
    if (!application) return null;

    const student = typeof application.studentId === 'object' ? application.studentId : null;
    const studentUser = student && typeof student.userId === 'object' ? student.userId : null;
    const university = typeof application.universityId === 'object' ? application.universityId : null;
    const fullName = [studentUser?.firstName, studentUser?.lastName].filter(Boolean).join(' ') || 'Student';
    const programme = readNamedValue(
      typeof application.programmeId === 'object' ? application.programmeId : null
    ) || application.programmeText || '—';
    const specialty = readNamedValue(
      typeof application.specialtyId === 'object' ? application.specialtyId : null
    ) || application.specialtyText || '—';

    return {
      fullName,
      studentNumber: student?.studentNumber || '—',
      universityName: university?.name || 'Your University',
      universityCode: university?.code || '',
      programme,
      specialty,
      email: studentUser?.email || '—',
      nominationDate: formatDate(application.submissionDate || application.createdAt),
      duration: application.durationWeeks ? `${application.durationWeeks} weeks` : '—',
      reference: application._id ? `NOM-${application._id.slice(-8).toUpperCase()}` : '—',
    };
  }, [application]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-600 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
          Loading your nomination...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl p-4 sm:p-6">
        <div className="rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-sm">
          <AlertCircle className="mx-auto h-9 w-9 text-rose-500" />
          <h1 className="mt-3 text-lg font-extrabold text-slate-900">Unable to load nomination</h1>
          <p className="mt-1 text-sm text-slate-600">{error}</p>
          <button
            type="button"
            onClick={() => void loadApplications()}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!application || !details) {
    return (
      <div className="mx-auto max-w-2xl p-4 sm:p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <FileText className="mx-auto h-10 w-10 text-slate-300" />
          <h1 className="mt-3 text-lg font-extrabold text-slate-900">No nomination found</h1>
          <p className="mt-1 text-sm text-slate-500">
            There is no application or university nomination linked to this student account yet.
          </p>
        </div>
      </div>
    );
  }

  const status = application.status || 'SUBMITTED';
  const statusInfo = statusMeta(status);
  const nominated = true;
  const verified = VERIFIED_STATUSES.has(status);
  const placed = PLACEMENT_STATUSES.has(status);
  const training = TRAINING_STATUSES.has(status);
  const isUniversityNomination = application.applicantType !== 'INDEPENDENT';

  const stages = [
    { label: 'Nominated', complete: nominated },
    { label: 'Verified', complete: verified },
    { label: 'Placement', complete: placed },
    { label: 'Training', complete: training },
  ];

  return (
    <div className="min-h-full bg-[#f5f8fb] p-4 sm:p-6 lg:p-8 dark:bg-[#08111f]">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-400">
              My Application
            </p>
            <h1 className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl dark:text-white">
              {isUniversityNomination ? 'My Nomination' : 'My Application'}
            </h1>
          </div>
          <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-extrabold ${statusInfo.classes}`}>
            {statusInfo.label}
          </span>
        </div>

        <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-teal-50 p-5 shadow-sm sm:p-6 dark:border-emerald-500/20 dark:from-emerald-500/10 dark:via-[#0f1b2d] dark:to-teal-500/10">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-500 text-white shadow-lg shadow-teal-600/15">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
                {isUniversityNomination ? 'University Nominated Student' : 'Independent Applicant'}
              </p>
              <h2 className="mt-1 text-lg font-black leading-snug text-slate-950 sm:text-xl dark:text-white">
                {isUniversityNomination
                  ? `You have been nominated by ${details.universityName}`
                  : 'Your application has been received'}
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {isUniversityNomination
                  ? 'Your nomination is linked to your student account. Follow the status below as it moves to placement and training.'
                  : 'Follow the status below for the latest application, placement and training updates.'}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-[#0f1b2d]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-teal-600" />
              <h2 className="font-black text-slate-950 dark:text-white">Nomination Status</h2>
            </div>
            <span className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${statusInfo.classes}`}>
              {statusInfo.label}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stages.map((stage, index) => (
              <div
                key={stage.label}
                className={
                  'rounded-2xl border p-3 transition ' +
                  (stage.complete
                    ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10'
                    : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60')
                }
              >
                <div
                  className={
                    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ' +
                    (stage.complete
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300')
                  }
                >
                  {stage.complete ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <p className="mt-2 text-xs font-extrabold text-slate-800 dark:text-slate-100">{stage.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0f1b2d]">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <Building2 className="h-5 w-5 text-blue-600" />
            <div>
              <h2 className="font-black text-slate-950 dark:text-white">
                {isUniversityNomination ? 'Nomination Details' : 'Application Details'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Information submitted to AZAAM</p>
            </div>
          </div>

          <div className="grid gap-x-8 gap-y-0 p-5 sm:grid-cols-2">
            <Detail label="Reference No." value={details.reference} mono />
            <Detail label="Student Name" value={details.fullName} />
            <Detail label="Student ID" value={details.studentNumber} mono />
            <Detail label="Nominated By" value={isUniversityNomination ? details.universityName : 'Self Application'} />
            <Detail label="Programme / Level" value={details.programme} />
            <Detail label="Clinical Specialty" value={details.specialty} />
            <Detail label="Requested Duration" value={details.duration} />
            <Detail label="Nomination Date" value={details.nominationDate} icon={<CalendarDays className="h-3.5 w-3.5" />} />
          </div>
        </section>

        <section className="rounded-3xl border border-blue-100 bg-blue-50 p-5 shadow-sm dark:border-blue-500/20 dark:bg-blue-500/10">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
              {status === 'REJECTED' || status === 'DOCUMENTS_REQUIRED'
                ? <AlertCircle className="h-5 w-5" />
                : status === 'CERTIFICATE_ISSUED' || status === 'COMPLETED'
                  ? <CheckCircle2 className="h-5 w-5" />
                  : <Clock3 className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-950 dark:text-white">What happens next?</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{nextStepMessage(status)}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const Detail: React.FC<{
  label: string;
  value: string;
  mono?: boolean;
  icon?: React.ReactNode;
}> = ({ label, value, mono = false, icon }) => (
  <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3.5 last:border-b-0 sm:last:border-b dark:border-slate-800">
    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</span>
    <span className={`flex max-w-[62%] items-center gap-1.5 text-right text-xs font-extrabold text-slate-900 dark:text-slate-100 ${mono ? 'font-mono' : ''}`}>
      {icon}
      {value}
    </span>
  </div>
);
