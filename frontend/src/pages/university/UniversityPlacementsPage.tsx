import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  GraduationCap,
  Loader2,
  MoreVertical,
  Search,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import api from '../../services/api';

type RecordObject = Record<string, any>;

const asId = (value: any): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return String(value._id || value.id || '');
};

const asArray = (payload: any, key: string): RecordObject[] => {
  const data = payload?.data?.data ?? payload?.data ?? payload;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

const fullName = (user: any): string => {
  if (!user) return '-';
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  return name || user.email || '-';
};

const formatDate = (value: any): string => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const statusLabel = (status: string) => {
  switch (status) {
    case 'CONFIRMED':
      return 'Scheduled';
    case 'ACTIVE':
      return 'Active';
    case 'COMPLETED':
      return 'Completed';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return status ? status.charAt(0) + status.slice(1).toLowerCase() : 'Pending';
  }
};

const statusClass = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-emerald-100 text-emerald-700';
    case 'CONFIRMED':
      return 'bg-sky-100 text-sky-700';
    case 'COMPLETED':
      return 'bg-slate-200 text-slate-700';
    case 'CANCELLED':
      return 'bg-rose-100 text-rose-700';
    default:
      return 'bg-amber-100 text-amber-700';
  }
};

const applicationFor = (placement: RecordObject) => placement.applicationId;
const studentFor = (placement: RecordObject) => placement.studentId;
const userFor = (placement: RecordObject) => studentFor(placement)?.userId;
const hospitalName = (placement: RecordObject) => placement.organizationId?.name || '-';
const programmeName = (placement: RecordObject) =>
  applicationFor(placement)?.programmeId?.name ||
  applicationFor(placement)?.programmeText ||
  '-';

export const UniversityPlacementsPage: React.FC = () => {
  const navigate = useNavigate();
  const [placements, setPlacements] = useState<RecordObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewingPlacement, setViewingPlacement] = useState<RecordObject | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filters, setFilters] = useState({
    hospital: '',
    programme: '',
    status: '',
    search: '',
  });
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const loadPlacements = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/placements');
      setPlacements(asArray(response, 'placements'));
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.error?.message ||
          'Unable to load university placement records.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPlacements();
  }, []);

  const hospitalOptions = useMemo(() => {
    const values = new Map<string, string>();
    placements.forEach((placement) => {
      const id = asId(placement.organizationId);
      const name = hospitalName(placement);
      if (id && name && name !== '-') values.set(id, name);
    });
    return Array.from(values.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [placements]);

  const programmeOptions = useMemo(() => {
    const values = new Set<string>();
    placements.forEach((placement) => {
      const name = programmeName(placement);
      if (name && name !== '-') values.add(name);
    });
    return Array.from(values).sort();
  }, [placements]);

  const filteredPlacements = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return placements.filter((placement) => {
      if (filters.hospital && asId(placement.organizationId) !== filters.hospital) return false;
      if (filters.programme && programmeName(placement) !== filters.programme) return false;
      if (filters.status && placement.status !== filters.status) return false;

      if (search) {
        const user = userFor(placement);
        const haystack = [
          fullName(user),
          studentFor(placement)?.studentNumber,
          user?.email,
          hospitalName(placement),
          programmeName(placement),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!haystack.includes(search)) return false;
      }

      return true;
    });
  }, [placements, filters]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const totalPages = Math.max(1, Math.ceil(filteredPlacements.length / pageSize));
  const paginatedPlacements = filteredPlacements.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const summaryCards = [
    {
      label: 'Total Placements',
      value: placements.length,
      icon: Users,
      className: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Scheduled',
      value: placements.filter((item) => item.status === 'CONFIRMED').length,
      icon: CalendarDays,
      className: 'bg-sky-50 text-sky-600',
    },
    {
      label: 'Active',
      value: placements.filter((item) => item.status === 'ACTIVE').length,
      icon: Activity,
      className: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Completed',
      value: placements.filter((item) => item.status === 'COMPLETED').length,
      icon: CheckCircle2,
      className: 'bg-slate-100 text-slate-600',
    },
  ];

  const resetFilters = () =>
    setFilters({
      hospital: '',
      programme: '',
      status: '',
      search: '',
    });

  const activeFilterCount = [filters.hospital, filters.programme, filters.status].filter(Boolean).length;

  return (
    <div className="space-y-5 pb-10">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div>
          <div className="mb-2 text-[11px] font-black uppercase tracking-[0.24em] text-blue-700">
            Training Monitoring
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Placements
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Monitor hospital placements assigned to students from your university.
          </p>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
          {error}
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl ${card.className}`}>
                <Icon className="h-4.5 w-4.5" />
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                {card.label}
              </div>
              <div className="mt-1 text-2xl font-black text-slate-950">
                {loading ? '—' : card.value}
              </div>
            </div>
          );
        })}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-5">
        <div className="lg:hidden">
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="search"
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                placeholder="Search student..."
                className="min-h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowMobileFilters((current) => !current)}
              className="relative inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 text-xs font-extrabold text-blue-700"
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-black text-white">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown className={`h-4 w-4 transition-transform ${showMobileFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showMobileFilters && (
            <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50/40 p-3">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                  More filters
                </span>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-[11px] font-extrabold text-blue-700"
                >
                  Reset all
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <label className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500">Hospital</span>
                  <select
                    value={filters.hospital}
                    onChange={(event) => setFilters((current) => ({ ...current, hospital: event.target.value }))}
                    className="min-h-10 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
                  >
                    <option value="">All</option>
                    {hospitalOptions.map(([id, name]) => (
                      <option key={id} value={id}>{name}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500">Programme</span>
                  <select
                    value={filters.programme}
                    onChange={(event) => setFilters((current) => ({ ...current, programme: event.target.value }))}
                    className="min-h-10 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
                  >
                    <option value="">All</option>
                    {programmeOptions.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </label>

                <label className="col-span-2 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500">Status</span>
                  <select
                    value={filters.status}
                    onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
                    className="min-h-10 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Scheduled</option>
                    <option value="ACTIVE">Active</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="hidden lg:block">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-black text-slate-950">Filters</h2>
            </div>
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-extrabold text-blue-700"
            >
              Reset
            </button>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <label className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500">Hospital</span>
              <select
                value={filters.hospital}
                onChange={(event) => setFilters((current) => ({ ...current, hospital: event.target.value }))}
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
              >
                <option value="">All Hospitals</option>
                {hospitalOptions.map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500">Programme</span>
              <select
                value={filters.programme}
                onChange={(event) => setFilters((current) => ({ ...current, programme: event.target.value }))}
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
              >
                <option value="">All Programmes</option>
                {programmeOptions.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500">Status</span>
              <select
                value={filters.status}
                onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Scheduled</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500">Search Student</span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="search"
                  value={filters.search}
                  onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                  placeholder="Name, ID or email..."
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
                />
              </div>
            </label>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
          <h2 className="text-sm font-black text-slate-950">
            Student Placements ({filteredPlacements.length})
          </h2>
          <p className="mt-1 text-[11px] text-slate-500">
            Placements assigned to students from your university
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-sm font-bold text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading placements...
          </div>
        ) : filteredPlacements.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="mx-auto h-9 w-9 text-slate-300" />
            <p className="mt-3 text-sm font-black text-slate-700">No placements found</p>
            <p className="mt-1 text-xs text-slate-500">
              No student placement records match the selected filters.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-[760px] w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-black">Student</th>
                    <th className="px-4 py-3 font-black">Programme</th>
                    <th className="px-4 py-3 font-black">Hospital</th>
                    <th className="px-4 py-3 font-black">Dates</th>
                    <th className="px-4 py-3 font-black">Status</th>
                    <th className="px-4 py-3 text-right font-black">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedPlacements.map((placement) => {
                    const user = userFor(placement);
                    return (
                      <tr key={asId(placement)} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-black text-blue-700">
                              {(user?.firstName?.[0] || 'S').toUpperCase()}
                              {(user?.lastName?.[0] || '').toUpperCase()}
                            </div>
                            <div>
                              <div className="font-extrabold text-slate-900">{fullName(user)}</div>
                              <div className="mt-0.5 text-[10px] text-slate-500">
                                {studentFor(placement)?.studentNumber || user?.email || '-'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-600">{programmeName(placement)}</td>
                        <td className="px-4 py-3 font-semibold text-slate-600">{hospitalName(placement)}</td>
                        <td className="px-4 py-3 whitespace-nowrap font-semibold text-slate-600">
                          {formatDate(placement.startDate)} — {formatDate(placement.endDate)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${statusClass(placement.status)}`}>
                            {statusLabel(placement.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setViewingPlacement(placement)}
                            className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 text-xs font-extrabold text-blue-700"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 p-3 lg:hidden">
              {paginatedPlacements.map((placement) => {
                const user = userFor(placement);
                const placementId = asId(placement);
                const menuOpen = openMenuId === placementId;

                return (
                  <article
                    key={placementId}
                    className="relative rounded-[22px] border border-sky-200 bg-gradient-to-br from-white via-blue-50/35 to-sky-50/60 p-4 shadow-[0_10px_30px_rgba(37,99,235,0.10)]"
                  >
                    <button
                      type="button"
                      aria-label="Placement actions"
                      aria-expanded={menuOpen}
                      onClick={() => setOpenMenuId(menuOpen ? null : placementId)}
                      className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-100/90 text-blue-700 shadow-sm"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>

                    {menuOpen && (
                      <div className="absolute right-3 top-14 z-30 w-48 overflow-hidden rounded-2xl border border-blue-100 bg-white p-1.5 shadow-2xl">
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            setViewingPlacement(placement);
                          }}
                          className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-xs font-extrabold text-blue-700 hover:bg-blue-50"
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <Eye className="h-4 w-4" />
                          </span>
                          View Placement
                        </button>
                        {asId(studentFor(placement)) && (
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              navigate(`/university/students/${asId(studentFor(placement))}`);
                            }}
                            className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-xs font-extrabold text-sky-700 hover:bg-sky-50"
                          >
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                              <UserRound className="h-4 w-4" />
                            </span>
                            Student Journey
                          </button>
                        )}
                      </div>
                    )}

                    <div className="flex items-start gap-3 pr-12">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white bg-gradient-to-br from-blue-100 to-sky-50 text-sm font-black text-blue-800 shadow-sm">
                        {(user?.firstName?.[0] || 'S').toUpperCase()}
                        {(user?.lastName?.[0] || '').toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-base font-black tracking-tight text-slate-950">
                          {fullName(user)}
                        </h3>
                        <p className="mt-0.5 text-xs font-semibold text-slate-500">
                          ID: {studentFor(placement)?.studentNumber || user?.email || '-'}
                        </p>
                        <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-[10px] font-black shadow-sm ${statusClass(placement.status)}`}>
                          {statusLabel(placement.status)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 overflow-hidden rounded-2xl border border-blue-100 bg-white/80">
                      <div className="flex min-w-0 items-center gap-2.5 border-b border-r border-blue-100 p-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <Building2 className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold text-blue-500">Hospital</div>
                          <div className="mt-0.5 truncate text-xs font-black text-slate-800">{hospitalName(placement)}</div>
                        </div>
                      </div>

                      <div className="flex min-w-0 items-center gap-2.5 border-b border-blue-100 p-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                          <GraduationCap className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold text-blue-500">Programme</div>
                          <div className="mt-0.5 truncate text-xs font-black text-slate-800">{programmeName(placement)}</div>
                        </div>
                      </div>

                      <div className="col-span-2 flex min-w-0 items-center gap-2.5 p-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <CalendarDays className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold text-blue-500">Dates</div>
                          <div className="mt-0.5 truncate text-xs font-black text-slate-800">
                            {formatDate(placement.startDate)} — {formatDate(placement.endDate)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-semibold text-slate-500">
                Showing {filteredPlacements.length === 0 ? 0 : (page - 1) * pageSize + 1} to{' '}
                {Math.min(page * pageSize, filteredPlacements.length)} of {filteredPlacements.length} placements
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg bg-blue-600 px-2 text-xs font-black text-white">
                  {page}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {viewingPlacement && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-4">
          <div className="w-full rounded-t-3xl bg-white shadow-2xl sm:max-w-xl sm:rounded-3xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700">
                  Placement Details
                </div>
                <h2 className="mt-1 text-xl font-black text-slate-950">
                  {fullName(userFor(viewingPlacement))}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setViewingPlacement(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-3 p-5 text-sm sm:grid-cols-2">
              {[
                ['Student ID', studentFor(viewingPlacement)?.studentNumber || '-'],
                ['Programme', programmeName(viewingPlacement)],
                ['Hospital', hospitalName(viewingPlacement)],
                ['Status', statusLabel(viewingPlacement.status)],
                ['Start Date', formatDate(viewingPlacement.startDate)],
                ['End Date', formatDate(viewingPlacement.endDate)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</div>
                  <div className="mt-1 font-extrabold text-slate-800">{value}</div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 border-t border-slate-100 p-5">
              {asId(studentFor(viewingPlacement)) && (
                <button
                  type="button"
                  onClick={() => navigate(`/university/students/${asId(studentFor(viewingPlacement))}`)}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 text-sm font-extrabold text-blue-700"
                >
                  <UserRound className="h-4 w-4" />
                  Student Journey
                </button>
              )}
              <button
                type="button"
                onClick={() => setViewingPlacement(null)}
                className="min-h-11 rounded-xl bg-slate-950 px-5 text-sm font-extrabold text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
