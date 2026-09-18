import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CalendarDays,
  Check,
  Clock3,
  Loader2,
  RefreshCw,
  Stethoscope,
  UserRound,
} from 'lucide-react';
import api from '../../services/api';

type Rotation = Record<string, any>;

const asArray = (response: any): Rotation[] => {
  const data = response?.data?.data ?? response?.data ?? response;
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.rotations) ? data.rotations : [];
};

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
};

const supervisorName = (rotation: Rotation) => {
  const user = rotation.supervisorId?.userId;
  return [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Not assigned';
};

const durationWeeks = (rotation: Rotation) => {
  const start = new Date(rotation.startDate);
  const end = new Date(rotation.endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '—';
  return Math.max(1, Math.ceil(((end.getTime() - start.getTime()) / 86400000 + 1) / 7));
};

const statusStyle = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-emerald-100 text-emerald-700';
    case 'COMPLETED':
      return 'bg-slate-200 text-slate-700';
    case 'CANCELLED':
      return 'bg-rose-100 text-rose-700';
    default:
      return 'bg-blue-100 text-blue-700';
  }
};

export const StudentRotationsPage: React.FC = () => {
  const [rotations, setRotations] = useState<Rotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/rotations');
      setRotations(asArray(response));
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error?.message || 'Unable to load your rotation schedule.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const ordered = useMemo(
    () => [...rotations].sort((a, b) => Number(a.sequence || 0) - Number(b.sequence || 0)),
    [rotations]
  );

  const current = ordered.find((item) => item.status === 'ACTIVE');
  const completed = ordered.filter((item) => item.status === 'COMPLETED').length;
  const hospital =
    current?.organizationId?.name ||
    ordered[0]?.organizationId?.name ||
    ordered[0]?.placementId?.organizationId?.name ||
    'Assigned Hospital';

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-5">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-600 shadow-sm dark:border-slate-800 dark:bg-[#0f1b2d] dark:text-slate-300">
          <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
          Loading your rotations...
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
            onClick={() => void load()}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-extrabold text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!ordered.length) {
    return (
      <div className="min-h-full bg-[#f5f8fb] p-4 sm:p-6 dark:bg-[#08111f]">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-[#0f1b2d]">
          <CalendarDays className="mx-auto h-10 w-10 text-slate-300" />
          <h1 className="mt-4 text-xl font-black text-slate-950 dark:text-white">Rotation schedule not available yet</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
            AZAAM will publish your clinical rotation schedule after your placement is confirmed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#f5f8fb] p-3 sm:p-6 lg:p-8 dark:bg-[#08111f]">
      <div className="mx-auto max-w-5xl space-y-4">
        <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0f1b2d]">
          <div className="bg-gradient-to-r from-teal-600 to-emerald-500 px-5 py-6 text-white sm:px-6">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/75">My Journey</p>
            <div className="mt-1 flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black tracking-tight">Clinical Rotations</h1>
                <p className="mt-1 text-sm text-white/80">{hospital}</p>
              </div>
              <div className="rounded-2xl bg-white/15 px-3 py-2 text-right backdrop-blur">
                <div className="text-[10px] font-black uppercase tracking-wide text-white/70">Progress</div>
                <div className="text-lg font-black">{completed}/{ordered.length}</div>
              </div>
            </div>
          </div>

          {current && (
            <div className="p-4 sm:p-6">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                    <Stethoscope className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                      Current Rotation
                    </p>
                    <h2 className="mt-1 text-lg font-black text-slate-950 dark:text-white">{current.title}</h2>
                    <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
                      Rotation {current.sequence} of {ordered.length}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <Info icon={<CalendarDays className="h-4 w-4" />} label="Dates" value={`${formatDate(current.startDate)} — ${formatDate(current.endDate)}`} />
                      <Info icon={<Clock3 className="h-4 w-4" />} label="Duration" value={`${durationWeeks(current)} week(s)`} />
                      <Info icon={<UserRound className="h-4 w-4" />} label="Supervisor" value={supervisorName(current)} />
                      <Info icon={<Building2 className="h-4 w-4" />} label="Department" value={current.departmentId?.name || current.title} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-[#0f1b2d]">
          <h2 className="text-sm font-black text-slate-950 dark:text-white">Full Rotation Schedule</h2>
          <div className="mt-4 space-y-3">
            {ordered.map((rotation, index) => {
              const complete = rotation.status === 'COMPLETED';
              const active = rotation.status === 'ACTIVE';
              return (
                <div
                  key={String(rotation._id)}
                  className={
                    'relative rounded-2xl border p-4 ' +
                    (active
                      ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10'
                      : complete
                        ? 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60'
                        : 'border-blue-100 bg-blue-50/50 dark:border-blue-500/20 dark:bg-blue-500/10')
                  }
                >
                  {index < ordered.length - 1 && (
                    <div className="absolute left-[31px] top-[52px] h-[calc(100%+12px)] w-px bg-slate-200 dark:bg-slate-700" />
                  )}
                  <div className="flex items-start gap-3">
                    <div
                      className={
                        'relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black ' +
                        (complete
                          ? 'bg-slate-700 text-white'
                          : active
                            ? 'bg-emerald-600 text-white'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300')
                      }
                    >
                      {complete ? <Check className="h-4 w-4" /> : rotation.sequence}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-black text-slate-950 dark:text-white">{rotation.title}</h3>
                          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {formatDate(rotation.startDate)} — {formatDate(rotation.endDate)}
                          </p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${statusStyle(rotation.status)}`}>
                          {rotation.status === 'UPCOMING' ? 'UPCOMING' : rotation.status}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        <span>{rotation.departmentId?.name || 'Department pending'}</span>
                        <span>{supervisorName(rotation)}</span>
                        <span>{durationWeeks(rotation)} week(s)</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

const Info: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="rounded-xl bg-white/80 p-3 dark:bg-slate-950/20">
    <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
      {icon}
      <span className="text-[10px] font-black uppercase">{label}</span>
    </div>
    <p className="mt-1 break-words font-extrabold text-slate-800 dark:text-slate-100">{value}</p>
  </div>
);
