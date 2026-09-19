import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  GraduationCap,
  Loader2,
  Search,
  Stethoscope,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import api from '../../services/api';

type Rotation = Record<string, any>;

const asArray = (response: any): Rotation[] => {
  const data = response?.data?.data ?? response?.data ?? response;
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.rotations) ? data.rotations : [];
};

const asId = (value: any) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return String(value._id || value.id || '');
};

const fullName = (rotation: Rotation) => {
  const user = rotation.studentId?.userId;
  return [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Student';
};

const studentNumber = (rotation: Rotation) => rotation.studentId?.studentNumber || '—';

const initials = (rotation: Rotation) => {
  const user = rotation.studentId?.userId;
  return ((user?.firstName?.[0] || 'S') + (user?.lastName?.[0] || '')).toUpperCase();
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
  const [hospitalFilter, setHospitalFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewing, setViewing] = useState<Rotation | null>(null);

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

  useEffect(() => {
    void load();
  }, []);

  const studentGroups = useMemo(() => {
    const map = new Map<string, Rotation[]>();
    rotations.forEach((rotation) => {
      const key = asId(rotation.studentId) + ':' + (asId(rotation.placementId) || 'placement');
      const current = map.get(key) || [];
      current.push(rotation);
      map.set(key, current);
    });
    return Array.from(map.values()).map((items) =>
      [...items].sort((a, b) => Number(a.sequence || 0) - Number(b.sequence || 0))
    );
  }, [rotations]);

  const hospitalOptions = useMemo(() => {
    const map = new Map<string, string>();
    rotations.forEach((rotation) => {
      const id = asId(rotation.organizationId);
      if (id) map.set(id, rotation.organizationId?.name || 'Hospital');
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [rotations]);

  const departmentOptions = useMemo(() => {
    const map = new Map<string, string>();
    rotations.forEach((rotation) => {
      const id = asId(rotation.departmentId);
      if (id) map.set(id, rotation.departmentId?.name || rotation.title || 'Department');
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [rotations]);

  const filteredRotations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rotations
      .filter((rotation) => {
        if (hospitalFilter && asId(rotation.organizationId) !== hospitalFilter) return false;
        if (departmentFilter && asId(rotation.departmentId) !== departmentFilter) return false;
        if (statusFilter && rotation.status !== statusFilter) return false;

        if (!query) return true;

        const haystack = [
          fullName(rotation),
          studentNumber(rotation),
          rotation.studentId?.userId?.email,
          rotation.studentId?.programmeId?.name,
          rotation.organizationId?.name,
          rotation.departmentId?.name,
          rotation.title,
          supervisorName(rotation),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(query);
      })
      .sort((a, b) => {
        const studentCompare = fullName(a).localeCompare(fullName(b));
        if (studentCompare !== 0) return studentCompare;
        return Number(a.sequence || 0) - Number(b.sequence || 0);
      });
  }, [rotations, search, hospitalFilter, departmentFilter, statusFilter]);

  const totalStudents = new Set(rotations.map((rotation) => asId(rotation.studentId)).filter(Boolean)).size;
  const activeRotations = rotations.filter((rotation) => rotation.status === 'ACTIVE').length;
  const completedRotations = rotations.filter((rotation) => rotation.status === 'COMPLETED').length;
  const rotationPlans = studentGroups.length;

  const exportCsv = () => {
    const headers = [
      'Student',
      'Student ID',
      'Programme',
      'Hospital',
      'Rotation',
      'Department',
      'Supervisor',
      'Start Date',
      'End Date',
      'Status',
    ];

    const rows = filteredRotations.map((rotation) => [
      fullName(rotation),
      studentNumber(rotation),
      rotation.studentId?.programmeId?.name || '',
      rotation.organizationId?.name || '',
      rotation.title || '',
      rotation.departmentId?.name || '',
      supervisorName(rotation),
      formatDate(rotation.startDate),
      formatDate(rotation.endDate),
      rotation.status || '',
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => '"' + String(value ?? '').replace(/"/g, '""') + '"')
          .join(',')
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'university-rotations-' + new Date().toISOString().slice(0, 10) + '.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 pb-10">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-950 via-blue-950 to-cyan-950 p-5 text-white shadow-sm sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-16 h-52 w-52 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute right-20 top-8 opacity-20">
          <Stethoscope className="h-28 w-28 rotate-[-12deg]" />
        </div>

        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">
            <GraduationCap className="h-4 w-4" />
            Training Monitoring
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Clinical Rotations</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200">
            Monitor live student rotation schedules, current departments, supervisors and training progress.
          </p>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
          {error}
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard icon={<Users className="h-5 w-5" />} label="Total Students" value={loading ? '—' : String(totalStudents)} tone="blue" />
        <StatCard icon={<CalendarDays className="h-5 w-5" />} label="Rotation Plans" value={loading ? '—' : String(rotationPlans)} tone="emerald" />
        <StatCard icon={<Activity className="h-5 w-5" />} label="Active Rotations" value={loading ? '—' : String(activeRotations)} tone="violet" />
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Completed" value={loading ? '—' : String(completedRotations)} tone="amber" />
      </section>

      <div className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
            <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_180px_180px_160px_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search student, ID, department or hospital..."
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-cyan-500 focus:bg-white"
                />
              </div>

              <FilterSelect value={hospitalFilter} onChange={setHospitalFilter} placeholder="All Hospitals" options={hospitalOptions} />
              <FilterSelect value={departmentFilter} onChange={setDepartmentFilter} placeholder="All Departments" options={departmentOptions} />
              <FilterSelect
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="All Status"
                options={[
                  ['UPCOMING', 'Upcoming'],
                  ['ACTIVE', 'Active'],
                  ['COMPLETED', 'Completed'],
                  ['CANCELLED', 'Cancelled'],
                ]}
              />

              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setHospitalFilter('');
                  setDepartmentFilter('');
                  setStatusFilter('');
                }}
                className="min-h-11 rounded-xl border border-slate-200 px-4 text-xs font-black text-slate-600 transition hover:bg-slate-50"
              >
                Reset
              </button>
            </div>
          </section>

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <h2 className="text-sm font-black text-slate-950">Student Rotations</h2>
                <p className="mt-1 text-xs text-slate-500">Showing live rotation schedules and current placement status.</p>
              </div>

              <button
                type="button"
                onClick={exportCsv}
                disabled={!filteredRotations.length}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-14 text-sm font-bold text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading rotations...
              </div>
            ) : filteredRotations.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <CalendarDays className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm font-black text-slate-700">No rotations found</p>
                <p className="mt-1 text-xs text-slate-500">Try changing your search or filters.</p>
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full min-w-[1080px] text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="px-4 py-3.5">Student</th>
                        <th className="px-4 py-3.5">Hospital</th>
                        <th className="px-4 py-3.5">Department</th>
                        <th className="px-4 py-3.5">Rotation Period</th>
                        <th className="px-4 py-3.5">Supervisor</th>
                        <th className="px-4 py-3.5">Status</th>
                        <th className="px-4 py-3.5 text-right">Action</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {filteredRotations.map((rotation) => (
                        <tr key={String(rotation._id)} className="transition hover:bg-cyan-50/40">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-700 text-[11px] font-black text-white">
                                {initials(rotation)}
                              </div>
                              <div className="min-w-0">
                                <div className="truncate font-black text-slate-900">{fullName(rotation)}</div>
                                <div className="mt-0.5 text-[10px] font-semibold text-slate-500">ID: {studentNumber(rotation)}</div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3.5 font-bold text-slate-700">{rotation.organizationId?.name || 'Hospital'}</td>

                          <td className="px-4 py-3.5">
                            <div className="font-black text-slate-800">{rotation.departmentId?.name || rotation.title || 'Department'}</div>
                            <div className="mt-0.5 text-[10px] font-semibold text-violet-600">{rotation.studentId?.programmeId?.name || 'Programme'}</div>
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="flex items-start gap-2 whitespace-nowrap font-semibold text-slate-600">
                              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />
                              <span>{formatDate(rotation.startDate)}<br />— {formatDate(rotation.endDate)}</span>
                            </div>
                          </td>

                          <td className="px-4 py-3.5 font-semibold text-slate-600">{supervisorName(rotation)}</td>

                          <td className="px-4 py-3.5">
                            <span className={'inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ' + statusStyle(rotation.status)}>
                              {rotation.status || 'UPCOMING'}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            <button
                              type="button"
                              title="View rotation details"
                              onClick={() => setViewing(rotation)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-cyan-700"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid gap-3 p-3 lg:hidden">
                  {filteredRotations.map((rotation) => (
                    <article key={String(rotation._id)} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-700 text-xs font-black text-white">
                            {initials(rotation)}
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-black text-slate-950">{fullName(rotation)}</h3>
                            <p className="mt-0.5 text-[10px] font-semibold text-slate-500">ID: {studentNumber(rotation)}</p>
                          </div>
                        </div>

                        <span className={'shrink-0 rounded-full px-2 py-1 text-[9px] font-black ' + statusStyle(rotation.status)}>
                          {rotation.status || 'UPCOMING'}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <MobileInfo label="Hospital" value={rotation.organizationId?.name || 'Hospital'} />
                        <MobileInfo label="Department" value={rotation.departmentId?.name || rotation.title || 'Department'} />
                        <MobileInfo label="Supervisor" value={supervisorName(rotation)} />
                        <MobileInfo label="Programme" value={rotation.studentId?.programmeId?.name || 'Programme'} />
                      </div>

                      <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 p-3">
                        <div>
                          <div className="text-[9px] font-black uppercase tracking-wide text-slate-400">Rotation Period</div>
                          <div className="mt-1 text-xs font-black text-slate-800">
                            {formatDate(rotation.startDate)} — {formatDate(rotation.endDate)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setViewing(rotation)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-cyan-700 shadow-sm"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>



      {viewing && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <button
            type="button"
            aria-label="Close rotation details"
            className="absolute inset-0 cursor-default"
            onClick={() => setViewing(null)}
          />

          <div className="relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:max-w-2xl sm:rounded-3xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-700">Rotation Details</p>
                <h2 className="mt-1 text-xl font-black text-slate-950">{viewing.title || 'Clinical Rotation'}</h2>
              </div>
              <button
                type="button"
                onClick={() => setViewing(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3 overflow-y-auto p-5 sm:grid-cols-2 sm:p-6">
              <DetailBox label="Student" value={fullName(viewing)} />
              <DetailBox label="Student ID" value={studentNumber(viewing)} />
              <DetailBox label="Programme" value={viewing.studentId?.programmeId?.name || 'Programme'} />
              <DetailBox label="Hospital" value={viewing.organizationId?.name || 'Hospital'} />
              <DetailBox label="Department" value={viewing.departmentId?.name || viewing.title || 'Department'} />
              <DetailBox label="Supervisor" value={supervisorName(viewing)} />
              <DetailBox label="Start Date" value={formatDate(viewing.startDate)} />
              <DetailBox label="End Date" value={formatDate(viewing.endDate)} />
              <DetailBox label="Sequence" value={String(viewing.sequence || '—')} />
              <DetailBox label="Status" value={viewing.status || 'UPCOMING'} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: 'blue' | 'emerald' | 'violet' | 'amber';
}> = ({ icon, label, value, tone }) => {
  const styles = {
    blue: 'from-blue-600/15 to-cyan-500/5 text-blue-700 border-blue-200',
    emerald: 'from-emerald-600/15 to-teal-500/5 text-emerald-700 border-emerald-200',
    violet: 'from-violet-600/15 to-fuchsia-500/5 text-violet-700 border-violet-200',
    amber: 'from-amber-500/15 to-orange-500/5 text-amber-700 border-amber-200',
  }[tone];

  return (
    <article className={'rounded-2xl border bg-gradient-to-br p-4 shadow-sm sm:p-5 ' + styles}>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 shadow-sm">{icon}</div>
      <p className="mt-4 text-2xl font-black text-slate-950 sm:text-3xl">{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-slate-500 sm:text-xs">{label}</p>
    </article>
  );
};

const FilterSelect: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: [string, string][];
}> = ({ value, onChange, placeholder, options }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="min-h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 pr-9 text-sm font-semibold text-slate-700 outline-none transition focus:border-cyan-500 focus:bg-white"
    >
      <option value="">{placeholder}</option>
      {options.map(([id, label]) => (
        <option key={id} value={id}>{label}</option>
      ))}
    </select>
    <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
  </div>
);

const MobileInfo: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl bg-slate-50 p-3">
    <div className="text-[9px] font-black uppercase tracking-wide text-slate-400">{label}</div>
    <div className="mt-1 truncate text-xs font-black text-slate-800">{value}</div>
  </div>
);

const DetailBox: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-2xl bg-slate-50 p-4">
    <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</div>
    <div className="mt-1 break-words text-sm font-black text-slate-800">{value}</div>
  </div>
);

