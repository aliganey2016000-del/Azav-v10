import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Loader2,
  MapPin,
  RefreshCw,
  Stethoscope,
  UserRound,
  Users,
} from 'lucide-react';
import api from '../../services/api';

type PlacementRecord = Record<string, any>;

const asArray = (response: any): PlacementRecord[] => {
  const data = response?.data?.data ?? response?.data ?? response;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.placements)) return data.placements;
  return [];
};

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

const fullName = (user: any) => {
  if (!user) return 'Not assigned';
  return [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'Not assigned';
};

const statusMeta = (status?: string) => {
  switch (status) {
    case 'ACTIVE':
      return { label: 'Active', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' };
    case 'CONFIRMED':
      return { label: 'Confirmed', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' };
    case 'COMPLETED':
      return { label: 'Completed', badge: 'bg-slate-200 text-slate-700', dot: 'bg-slate-500' };
    case 'CANCELLED':
      return { label: 'Cancelled', badge: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500' };
    default:
      return { label: 'Pending', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' };
  }
};

const programmeName = (placement: PlacementRecord) =>
  placement.applicationId?.programmeId?.name ||
  placement.applicationId?.programmeText ||
  placement.studentId?.programmeId?.name ||
  '—';

const batchInfo = (placement: PlacementRecord) => {
  const batch = placement.applicationId?.batchId;
  return {
    number: batch?.batchNumber || 'Legacy / No Batch',
    name: batch?.name || '',
  };
};

const hospitalName = (placement: PlacementRecord) =>
  placement.organizationId?.name || 'Hospital not assigned';

const hospitalLocation = (placement: PlacementRecord) => {
  const organization = placement.organizationId;
  return [organization?.city, organization?.country].filter(Boolean).join(', ') || '—';
};

const departmentName = (placement: PlacementRecord) =>
  placement.departmentId?.name || 'Not assigned';

const supervisorName = (placement: PlacementRecord) =>
  fullName(placement.supervisorId?.userId);

const durationText = (placement: PlacementRecord) => {
  if (!placement.startDate || !placement.endDate) return '—';
  const start = new Date(placement.startDate);
  const end = new Date(placement.endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '—';
  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1);
  const weeks = Math.ceil(days / 7);
  return `${weeks} week${weeks === 1 ? '' : 's'}`;
};

export const StudentPlacementPage: React.FC = () => {
  const [placements, setPlacements] = useState<PlacementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPlacements = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/placements');
      setPlacements(asArray(response));
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.error?.message ||
          'Unable to load your placement.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPlacements();
  }, []);

  const currentPlacement = useMemo(() => {
    if (!placements.length) return null;
    return (
      placements.find((item) => item.status === 'ACTIVE') ||
      placements.find((item) => item.status === 'CONFIRMED') ||
      placements[0]
    );
  }, [placements]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-5">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-600 shadow-sm dark:border-slate-800 dark:bg-[#0f1b2d] dark:text-slate-300">
          <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
          Loading your placement...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl p-4 sm:p-6">
        <div className="rounded-3xl border border-rose-200 bg-white p-6 text-center shadow-sm dark:border-rose-500/30 dark:bg-[#0f1b2d]">
          <p className="text-sm font-bold text-rose-700 dark:text-rose-300">{error}</p>
          <button
            type="button"
            onClick={() => void loadPlacements()}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-extrabold text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!currentPlacement) {
    return (
      <div className="min-h-full bg-[#f5f8fb] p-4 sm:p-6 dark:bg-[#08111f]">
        <div className="mx-auto max-w-3xl">
          <section className="rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm dark:border-slate-800 dark:bg-[#0f1b2d]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
              <Building2 className="h-7 w-7" />
            </div>
            <h1 className="mt-4 text-xl font-black text-slate-950 dark:text-white">Placement not assigned yet</h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
              Your hospital placement will appear here automatically after AZAAM completes the placement stage.
            </p>
          </section>
        </div>
      </div>
    );
  }

  const meta = statusMeta(currentPlacement.status);

  return (
    <div className="min-h-full bg-[#f5f8fb] p-3 sm:p-6 lg:p-8 dark:bg-[#08111f]">
      <div className="mx-auto max-w-5xl space-y-4">
        <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0f1b2d]">
          <div className="bg-gradient-to-r from-teal-600 to-emerald-500 px-5 py-6 text-white sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/75">
                  My Journey
                </p>
                <h1 className="mt-1 text-2xl font-black tracking-tight">My Placement</h1>
                <p className="mt-1 text-sm text-white/80">
                  Your assigned clinical training location and placement details.
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-black text-slate-800">
                <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                {meta.label}
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                    Assigned Hospital
                  </p>
                  <h2 className="mt-0.5 text-lg font-black leading-6 text-slate-950 dark:text-white">
                    {hospitalName(currentPlacement)}
                  </h2>
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <MapPin className="h-3.5 w-3.5" />
                    {hospitalLocation(currentPlacement)}
                  </p>
                  <p className="mt-1 text-[11px] font-extrabold text-violet-700 dark:text-violet-300">
                    Batch: {batchInfo(currentPlacement).number}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <DetailCard
                icon={<Stethoscope className="h-4 w-4" />}
                label="Department"
                value={departmentName(currentPlacement)}
              />
              <DetailCard
                icon={<UserRound className="h-4 w-4" />}
                label="Supervisor"
                value={supervisorName(currentPlacement)}
              />
              <DetailCard
                icon={<GraduationCap className="h-4 w-4" />}
                label="Programme"
                value={programmeName(currentPlacement)}
              />
              <DetailCard
                icon={<Users className="h-4 w-4" />}
                label="Batch No"
                value={batchInfo(currentPlacement).number}
              />
              <DetailCard
                icon={<CalendarDays className="h-4 w-4" />}
                label="Start Date"
                value={formatDate(currentPlacement.startDate)}
              />
              <DetailCard
                icon={<CalendarDays className="h-4 w-4" />}
                label="End Date"
                value={formatDate(currentPlacement.endDate)}
              />
              <DetailCard
                icon={<Clock3 className="h-4 w-4" />}
                label="Duration"
                value={durationText(currentPlacement)}
              />
            </div>

            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-500/20 dark:bg-blue-500/10">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-300" />
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white">Placement confirmed by AZAAM</p>
                <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                  Attendance, logbook and evaluation records will use this placement during your clinical training.
                </p>
              </div>
            </div>
          </div>
        </section>

        {placements.length > 1 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-[#0f1b2d]">
            <h2 className="text-sm font-black text-slate-950 dark:text-white">Placement History</h2>
            <div className="mt-3 space-y-2">
              {placements.map((placement) => {
                const itemMeta = statusMeta(placement.status);
                return (
                  <div
                    key={String(placement._id)}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-black text-slate-900 dark:text-white">
                        {hospitalName(placement)}
                      </p>
                      <p className="mt-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        {batchInfo(placement).number} · {formatDate(placement.startDate)} — {formatDate(placement.endDate)}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${itemMeta.badge}`}>
                      {itemMeta.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

const DetailCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
}> = ({ icon, label, value }) => (
  <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/60">
    <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-300">
      {icon}
      <span className="text-[10px] font-black uppercase tracking-wide">{label}</span>
    </div>
    <p className="mt-2 break-words text-xs font-extrabold leading-5 text-slate-900 dark:text-slate-100">
      {value}
    </p>
  </div>
);
