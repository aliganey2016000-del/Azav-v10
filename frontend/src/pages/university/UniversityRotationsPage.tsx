import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Loader2,
  Search,
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

const fullName = (rotation: Rotation) => {
  const user = rotation.studentId?.userId;
  return [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Student';
};

const studentNumber = (rotation: Rotation) => rotation.studentId?.studentNumber || '—';

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

export const UniversityRotationsPage: React.FC = () => {
  const [rotations, setRotations] = useState<Rotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get('/rotations');
        setRotations(asArray(response));
      } catch (requestError: any) {
        setError(requestError?.response?.data?.error?.message || 'Unable to load student rotations.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const groups = useMemo(() => {
    const map = new Map<string, Rotation[]>();
    rotations.forEach((rotation) => {
      const key = `${rotation.studentId?._id || 'student'}:${rotation.placementId?._id || rotation.placementId || 'placement'}`;
      const current = map.get(key) || [];
      current.push(rotation);
      map.set(key, current);
    });

    const value = Array.from(map.values()).map((items) =>
      [...items].sort((a, b) => Number(a.sequence || 0) - Number(b.sequence || 0))
    );

    const query = search.trim().toLowerCase();
    if (!query) return value;

    return value.filter((items) => {
      const first = items[0];
      const haystack = [
        fullName(first),
        studentNumber(first),
        first.studentId?.userId?.email,
        first.organizationId?.name,
        first.studentId?.programmeId?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [rotations, search]);

  const activeCount = groups.filter((items) => items.some((rotation) => rotation.status === 'ACTIVE')).length;
  const completedPlans = groups.filter((items) => items.length > 0 && items.every((rotation) => rotation.status === 'COMPLETED')).length;

  return (
    <div className="space-y-5 pb-10">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-700">Training Monitoring</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Clinical Rotations</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          View each student’s live rotation plan, current department and progress.
        </p>
      </section>

      <section className="grid grid-cols-3 gap-3">
        {[
          { label: 'Rotation Plans', value: groups.length, icon: CalendarDays },
          { label: 'Active Students', value: activeCount, icon: Activity },
          { label: 'Completed', value: completedPlans, icon: CheckCircle2 },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <Icon className="h-5 w-5 text-blue-600" />
              <div className="mt-3 text-[10px] font-black uppercase tracking-wide text-slate-400">{card.label}</div>
              <div className="mt-1 text-2xl font-black text-slate-950">{loading ? '—' : card.value}</div>
            </div>
          );
        })}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search student, ID, hospital..."
            className="min-h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
          />
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-white p-12 text-sm font-bold text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading rotations...
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <CalendarDays className="mx-auto h-9 w-9 text-slate-300" />
          <p className="mt-3 text-sm font-black text-slate-800">No rotation schedules found</p>
          <p className="mt-1 text-xs text-slate-500">AZAAM-created rotation plans will appear here automatically.</p>
        </div>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2">
          {groups.map((items) => {
            const first = items[0];
            const current = items.find((rotation) => rotation.status === 'ACTIVE');
            const completed = items.filter((rotation) => rotation.status === 'COMPLETED').length;
            const progress = items.length ? Math.round((completed / items.length) * 100) : 0;

            return (
              <article key={`${first.studentId?._id}-${first.placementId?._id || first.placementId}`} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-black text-blue-700">
                    {(first.studentId?.userId?.firstName?.[0] || 'S').toUpperCase()}
                    {(first.studentId?.userId?.lastName?.[0] || '').toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-base font-black text-slate-950">{fullName(first)}</h2>
                    <p className="mt-0.5 text-xs font-semibold text-slate-500">
                      {studentNumber(first)} · {first.studentId?.programmeId?.name || 'Programme'}
                    </p>
                    <p className="mt-1 truncate text-xs font-bold text-blue-700">{first.organizationId?.name || 'Hospital'}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600">
                    {completed}/{items.length}
                  </span>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
                </div>

                {current ? (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                    <div className="flex items-center gap-2 text-emerald-700">
                      <Stethoscope className="h-4 w-4" />
                      <span className="text-[10px] font-black uppercase tracking-wide">Current Rotation</span>
                    </div>
                    <div className="mt-2 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-900">{current.title}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {formatDate(current.startDate)} — {formatDate(current.endDate)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">{supervisorName(current)}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${statusStyle(current.status)}`}>ACTIVE</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs font-semibold text-slate-500">
                    No rotation is active today.
                  </div>
                )}

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {items.map((rotation) => (
                    <div key={String(rotation._id)} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-black text-slate-400">#{rotation.sequence}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-black ${statusStyle(rotation.status)}`}>
                          {rotation.status}
                        </span>
                      </div>
                      <p className="mt-2 truncate text-xs font-black text-slate-800">{rotation.title}</p>
                      <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                        <Clock3 className="h-3 w-3" />
                        {formatDate(rotation.startDate)}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                        <UserRound className="h-3 w-3" />
                        <span className="truncate">{supervisorName(rotation)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
};
