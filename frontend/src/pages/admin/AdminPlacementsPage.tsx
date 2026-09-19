import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Filter,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  GraduationCap,
  Users,
  X,
} from 'lucide-react';
import api from '../../services/api';

type RecordObject = Record<string, any>;

interface PlacementFormState {
  applicationId: string;
  organizationId: string;
  startDate: string;
  endDate: string;
}

const EMPTY_FORM: PlacementFormState = {
  applicationId: '',
  organizationId: '',
  startDate: '',
  endDate: '',
};

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

const toInputDate = (value: any): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const fullName = (user: any): string => {
  if (!user) return '-';
  const first = user.firstName || '';
  const last = user.lastName || '';
  const name = `${first} ${last}`.trim();
  return name || user.email || '-';
};

const placementStudent = (placement: RecordObject) => placement.studentId;
const studentUser = (placement: RecordObject) => placementStudent(placement)?.userId;

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

export const AdminPlacementsPage: React.FC = () => {
  const [placements, setPlacements] = useState<RecordObject[]>([]);
  const [applications, setApplications] = useState<RecordObject[]>([]);
  const [organizations, setOrganizations] = useState<RecordObject[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hospitalSaving, setHospitalSaving] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [showHospitalForm, setShowHospitalForm] = useState(false);
  const [editingPlacement, setEditingPlacement] = useState<RecordObject | null>(null);
  const [viewingPlacement, setViewingPlacement] = useState<RecordObject | null>(null);
  const [openMobileMenuId, setOpenMobileMenuId] = useState<string | null>(null);
  const [form, setForm] = useState<PlacementFormState>(EMPTY_FORM);
  const [hospitalForm, setHospitalForm] = useState({
    name: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    capacity: '20',
  });

  const [filters, setFilters] = useState({
    university: '',
    hospital: '',
    programme: '',
    status: '',
    from: '',
    to: '',
    search: '',
  });
  const [page, setPage] = useState(1);
  const pageSize = 7;

  const loadData = async () => {
    setLoading(true);
    setError('');

    const [placementsResult, applicationsResult, organizationsResult] = await Promise.allSettled([
      api.get('/placements'),
      api.get('/applications'),
      api.get('/admin/organizations', { params: { page: 1, limit: 500, status: 'ACTIVE' } }),
    ]);

    if (placementsResult.status === 'fulfilled') {
      setPlacements(asArray(placementsResult.value, 'placements'));
    } else {
      const requestError: any = placementsResult.reason;
      setPlacements([]);
      setError(
        requestError?.response?.data?.error?.message ||
          'Unable to load placement records. Please try again.'
      );
    }

    if (applicationsResult.status === 'fulfilled') {
      setApplications(asArray(applicationsResult.value, 'applications'));
    }

    if (organizationsResult.status === 'fulfilled') {
      setOrganizations(asArray(organizationsResult.value, 'organizations'));
    }

    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const applicationMap = useMemo(() => {
    const map = new Map<string, RecordObject>();
    applications.forEach((application) => map.set(asId(application), application));
    return map;
  }, [applications]);

  const appForPlacement = (placement: RecordObject) => {
    const fromMap = applicationMap.get(asId(placement.applicationId));
    if (fromMap) return fromMap;
    return placement.applicationId && typeof placement.applicationId === 'object'
      ? placement.applicationId
      : undefined;
  };

  const universityName = (placement: RecordObject) => {
    const application = appForPlacement(placement);
    return application?.universityId?.name || placement.studentId?.universityId?.name || 'Independent';
  };

  const programmeName = (placement: RecordObject) => {
    const application = appForPlacement(placement);
    return application?.programmeId?.name || application?.programmeText || placement.studentId?.programmeId?.name || '-';
  };

  const batchInfo = (placement: RecordObject) => {
    const batch = appForPlacement(placement)?.batchId;
    return {
      number: batch?.batchNumber || 'Legacy / No Batch',
      name: batch?.name || '',
    };
  };

  const hospitalName = (placement: RecordObject) =>
    placement.organizationId?.name || '-';

  const activeStatuses = new Set(['CONFIRMED', 'ACTIVE']);
  const activePlacements = placements.filter((item) => activeStatuses.has(item.status));
  const uniqueStudentCount = new Set(placements.map((item) => asId(item.studentId)).filter(Boolean)).size;
  const totalCapacity = organizations.reduce(
    (sum, organization) => sum + Number(organization.capacity || 0),
    0
  );
  const availableCapacity = Math.max(0, totalCapacity - activePlacements.length);

  const universityOptions = useMemo(() => {
    const values = new Map<string, string>();
    applications.forEach((application) => {
      const id = asId(application.universityId);
      const name = application.universityId?.name;
      if (id && name) values.set(id, name);
    });
    return Array.from(values.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [applications]);

  const programmeOptions = useMemo(() => {
    const values = new Set<string>();
    applications.forEach((application) => {
      const name = application.programmeId?.name || application.programmeText;
      if (name) values.add(name);
    });
    return Array.from(values).sort();
  }, [applications]);


  const filteredPlacements = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return placements.filter((placement) => {
      const application =
        applicationMap.get(asId(placement.applicationId)) ||
        (placement.applicationId && typeof placement.applicationId === 'object'
          ? placement.applicationId
          : undefined);
      const user = placement.studentId?.userId;
      const studentName = fullName(user);
      const studentNumber = placement.studentId?.studentNumber || '';
      const hospital = placement.organizationId?.name || '';
      const universityId = asId(application?.universityId);
      const programme = application?.programmeId?.name || application?.programmeText || '';
      const start = toInputDate(placement.startDate);
      const end = toInputDate(placement.endDate);

      if (filters.university && universityId !== filters.university) return false;
      if (filters.hospital && asId(placement.organizationId) !== filters.hospital) return false;
      if (filters.programme && programme !== filters.programme) return false;
      if (filters.status && placement.status !== filters.status) return false;
      if (filters.from && end && end < filters.from) return false;
      if (filters.to && start && start > filters.to) return false;

      if (search) {
        const haystack = [
          studentName,
          studentNumber,
          user?.email,
          hospital,
          programme,
          application?.universityId?.name,
          application?.batchId?.batchNumber,
          application?.batchId?.name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!haystack.includes(search)) return false;
      }

      return true;
    });
  }, [placements, applicationMap, filters]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const totalPages = Math.max(1, Math.ceil(filteredPlacements.length / pageSize));
  const paginatedPlacements = filteredPlacements.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const resetFilters = () =>
    setFilters({
      university: '',
      hospital: '',
      programme: '',
      status: '',
      from: '',
      to: '',
      search: '',
    });

  const activeAdvancedFilterCount = [
    filters.university,
    filters.hospital,
    filters.programme,
    filters.status,
    filters.from,
    filters.to,
  ].filter(Boolean).length;

  const openCreateForm = () => {
    setEditingPlacement(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowHospitalForm(false);
    setShowForm(true);
  };

  const openEditForm = (placement: RecordObject) => {
    setEditingPlacement(placement);
    setForm({
      applicationId: asId(placement.applicationId),
      organizationId: asId(placement.organizationId),
      startDate: toInputDate(placement.startDate),
      endDate: toInputDate(placement.endDate),
    });
    setFormError('');
    setShowHospitalForm(false);
    setShowForm(true);
  };

  const selectedApplication = applicationMap.get(form.applicationId);

  const savePlacement = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');

    if (!form.organizationId || !form.startDate || !form.endDate) {
      setFormError('Hospital, start date and end date are required.');
      return;
    }

    if (!editingPlacement && !form.applicationId) {
      setFormError('Select a student application before creating the placement.');
      return;
    }

    if (form.endDate < form.startDate) {
      setFormError('End date must be on or after the start date.');
      return;
    }

    setSaving(true);
    try {
      if (editingPlacement) {
        await api.patch(`/placements/${asId(editingPlacement)}`, {
          organizationId: form.organizationId,
          startDate: form.startDate,
          endDate: form.endDate,
        });
      } else {
        const studentId = asId(selectedApplication?.studentId);
        if (!studentId) {
          setFormError('The selected application does not have a valid student record.');
          return;
        }

        await api.post('/placements', {
          applicationId: form.applicationId,
          studentId,
          organizationId: form.organizationId,
          startDate: form.startDate,
          endDate: form.endDate,
        });
      }

      setShowForm(false);
      setEditingPlacement(null);
      setForm(EMPTY_FORM);
      await loadData();
    } catch (requestError: any) {
      setFormError(
        requestError?.response?.data?.error?.message ||
          requestError?.response?.data?.message ||
          'Unable to save this placement.'
      );
    } finally {
      setSaving(false);
    }
  };

  const createHospital = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');

    if (!hospitalForm.name.trim() || !hospitalForm.contactEmail.trim()) {
      setFormError('Hospital name and official email are required.');
      return;
    }

    setHospitalSaving(true);
    try {
      const response = await api.post('/organizations', {
        name: hospitalForm.name.trim(),
        type: 'HOSPITAL',
        contactEmail: hospitalForm.contactEmail.trim(),
        contactPhone: hospitalForm.contactPhone.trim() || undefined,
        address: hospitalForm.address.trim() || undefined,
        capacity: Math.max(1, Number(hospitalForm.capacity || 20)),
      });

      const created =
        response.data?.data?.organization ||
        response.data?.organization ||
        response.data?.data;

      if (created?._id) {
        setOrganizations((current) => [...current, created]);
        setForm((current) => ({ ...current, organizationId: asId(created) }));
      } else {
        await loadData();
      }

      setHospitalForm({
        name: '',
        contactEmail: '',
        contactPhone: '',
        address: '',
        capacity: '20',
      });
      setShowHospitalForm(false);
    } catch (requestError: any) {
      setFormError(
        requestError?.response?.data?.error?.message ||
          'Unable to create the hospital.'
      );
    } finally {
      setHospitalSaving(false);
    }
  };

  const endPlacement = async (placement: RecordObject) => {
    const student = fullName(studentUser(placement));
    if (!window.confirm(`End the placement for ${student}?`)) return;

    try {
      await api.patch(`/placements/${asId(placement)}/status`, {
        status: 'COMPLETED',
      });
      await loadData();
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.error?.message ||
          'Unable to complete this placement.'
      );
    }
  };

  const exportCsv = () => {
    const rows = filteredPlacements.map((placement) => ({
      Student: fullName(studentUser(placement)),
      StudentNumber: placement.studentId?.studentNumber || '',
      University: universityName(placement),
      Batch: batchInfo(placement).number,
      Programme: programmeName(placement),
      Hospital: hospitalName(placement),
      StartDate: formatDate(placement.startDate),
      EndDate: formatDate(placement.endDate),
      Status: statusLabel(placement.status),
    }));

    const headers = Object.keys(rows[0] || {
      Student: '',
      StudentNumber: '',
      University: '',
      Batch: '',
      Programme: '',
      Hospital: '',
      StartDate: '',
      EndDate: '',
      Status: '',
    });

    const escape = (value: any) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = [
      headers.join(','),
      ...rows.map((row) => headers.map((header) => escape((row as any)[header])).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'azaam-placements.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const summaryCards = [
    {
      label: 'Active Placements',
      value: activePlacements.length,
      caption: 'Students currently placed',
      icon: Activity,
      iconClass: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Students Placed',
      value: uniqueStudentCount,
      caption: 'Unique students in records',
      icon: Users,
      iconClass: 'bg-emerald-100 text-emerald-600',
    },
    {
      label: 'Hospitals',
      value: organizations.length,
      caption: 'Active healthcare facilities',
      icon: Building2,
      iconClass: 'bg-violet-100 text-violet-600',
    },
    {
      label: 'Available Capacity',
      value: availableCapacity,
      caption: 'Placement slots available',
      icon: CheckCircle2,
      iconClass: 'bg-orange-100 text-orange-600',
    },
  ];

  return (
    <div className="space-y-5 pb-10">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 text-[11px] font-black uppercase tracking-[0.24em] text-teal-700">
              Training Operations
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Placements
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Manage student hospital placements and placement capacity.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => void loadData()}
              disabled={loading}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-teal-700"
            >
              <Plus className="h-4 w-4" />
              New Placement
            </button>
          </div>
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
            <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${card.iconClass}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="text-[11px] font-bold text-slate-500 sm:text-xs">{card.label}</div>
              <div className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">
                {loading ? '—' : card.value}
              </div>
              <div className="mt-1 hidden text-xs text-slate-400 sm:block">{card.caption}</div>
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
                className="min-h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm font-semibold text-slate-700 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-blue-500"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowMobileFilters((current) => !current)}
              aria-expanded={showMobileFilters}
              className="relative inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 text-xs font-extrabold text-blue-700 transition hover:bg-blue-100"
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeAdvancedFilterCount > 0 && (
                <span className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-black text-white">
                  {activeAdvancedFilterCount}
                </span>
              )}
              <ChevronDown className={`h-4 w-4 transition-transform ${showMobileFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showMobileFilters && (
            <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50/40 p-3">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">More filters</span>
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
                  <span className="text-[10px] font-bold text-slate-500">University</span>
                  <select
                    value={filters.university}
                    onChange={(event) => setFilters((current) => ({ ...current, university: event.target.value }))}
                    className="min-h-10 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
                  >
                    <option value="">All</option>
                    {universityOptions.map(([id, name]) => (
                      <option key={id} value={id}>{name}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500">Hospital</span>
                  <select
                    value={filters.hospital}
                    onChange={(event) => setFilters((current) => ({ ...current, hospital: event.target.value }))}
                    className="min-h-10 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
                  >
                    <option value="">All</option>
                    {organizations.map((organization) => (
                      <option key={asId(organization)} value={asId(organization)}>
                        {organization.name}
                      </option>
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

                <label className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500">Status</span>
                  <select
                    value={filters.status}
                    onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
                    className="min-h-10 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
                  >
                    <option value="">All</option>
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Scheduled</option>
                    <option value="ACTIVE">Active</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500">From</span>
                    <input
                      type="date"
                      value={filters.from}
                      onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))}
                      className="min-h-10 w-full rounded-xl border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-700 outline-none focus:border-blue-500"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500">To</span>
                    <input
                      type="date"
                      value={filters.to}
                      onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))}
                      className="min-h-10 w-full rounded-xl border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-700 outline-none focus:border-blue-500"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="hidden lg:block">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-teal-600" />
              <h2 className="text-sm font-black text-slate-950">Filters</h2>
            </div>
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-extrabold text-teal-700 hover:text-teal-800"
            >
              Reset
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500">University</span>
              <select
                value={filters.university}
                onChange={(event) => setFilters((current) => ({ ...current, university: event.target.value }))}
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-teal-500"
              >
                <option value="">All Universities</option>
                {universityOptions.map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500">Hospital</span>
              <select
                value={filters.hospital}
                onChange={(event) => setFilters((current) => ({ ...current, hospital: event.target.value }))}
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-teal-500"
              >
                <option value="">All Hospitals</option>
                {organizations.map((organization) => (
                  <option key={asId(organization)} value={asId(organization)}>
                    {organization.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500">Programme</span>
              <select
                value={filters.programme}
                onChange={(event) => setFilters((current) => ({ ...current, programme: event.target.value }))}
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-teal-500"
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
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-teal-500"
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
              <span className="text-[11px] font-bold text-slate-500">From</span>
              <input
                type="date"
                value={filters.from}
                onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))}
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-teal-500"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500">To</span>
              <input
                type="date"
                value={filters.to}
                onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))}
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-teal-500"
              />
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
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm font-semibold text-slate-700 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-teal-500"
                />
              </div>
            </label>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
          <div>
            <h2 className="text-sm font-black text-slate-950">
              Student Placements ({filteredPlacements.length})
            </h2>
            <p className="mt-1 text-[11px] text-slate-500">Live placement records from the database</p>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-extrabold text-slate-600 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
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
            <p className="mt-1 text-xs text-slate-500">Create a placement or change the filters.</p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-[1020px] w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-black">#</th>
                    <th className="px-4 py-3 font-black">Student</th>
                    <th className="px-4 py-3 font-black">Batch</th>
                    <th className="px-4 py-3 font-black">Programme</th>
                    <th className="px-4 py-3 font-black">Hospital</th>
                    <th className="px-4 py-3 font-black">Start Date</th>
                    <th className="px-4 py-3 font-black">End Date</th>
                    <th className="px-4 py-3 font-black">Status</th>
                    <th className="px-4 py-3 text-right font-black">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedPlacements.map((placement, index) => {
                    const user = studentUser(placement);
                    return (
                      <tr key={asId(placement)} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-semibold text-slate-400">
                          {(page - 1) * pageSize + index + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-black text-teal-700">
                              {(user?.firstName?.[0] || 'S').toUpperCase()}
                              {(user?.lastName?.[0] || '').toUpperCase()}
                            </div>
                            <div>
                              <div className="font-extrabold text-slate-900">{fullName(user)}</div>
                              <div className="mt-0.5 text-[10px] text-slate-500">
                                {placement.studentId?.studentNumber || user?.email || '-'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-extrabold text-violet-700">{batchInfo(placement).number}</div>
                          {batchInfo(placement).name && (
                            <div className="mt-0.5 max-w-[150px] truncate text-[10px] font-semibold text-slate-400">
                              {batchInfo(placement).name}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-600">{programmeName(placement)}</td>
                        <td className="px-4 py-3 font-semibold text-slate-600">{hospitalName(placement)}</td>
                        <td className="px-4 py-3 whitespace-nowrap font-semibold text-slate-600">{formatDate(placement.startDate)}</td>
                        <td className="px-4 py-3 whitespace-nowrap font-semibold text-slate-600">{formatDate(placement.endDate)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${statusClass(placement.status)}`}>
                            {statusLabel(placement.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              title="View"
                              onClick={() => setViewingPlacement(placement)}
                              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              title="Edit placement"
                              onClick={() => openEditForm(placement)}
                              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            {!['COMPLETED', 'CANCELLED'].includes(placement.status) && (
                              <button
                                type="button"
                                title="End placement"
                                onClick={() => void endPlacement(placement)}
                                className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 p-3 lg:hidden">
              {paginatedPlacements.map((placement) => {
                const user = studentUser(placement);
                const placementId = asId(placement);
                const menuOpen = openMobileMenuId === placementId;

                return (
                  <article
                    key={placementId}
                    className="relative overflow-visible rounded-[22px] border border-sky-200 bg-gradient-to-br from-white via-blue-50/35 to-sky-50/60 p-4 shadow-[0_10px_30px_rgba(37,99,235,0.10)]"
                  >
                    <button
                      type="button"
                      aria-label="Placement actions"
                      aria-expanded={menuOpen}
                      onClick={() => setOpenMobileMenuId(menuOpen ? null : placementId)}
                      className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-100/90 text-blue-700 shadow-sm transition hover:bg-blue-200"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>

                    {menuOpen && (
                      <div className="absolute right-3 top-14 z-30 w-48 overflow-hidden rounded-2xl border border-blue-100 bg-white p-1.5 shadow-2xl">
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMobileMenuId(null);
                            setViewingPlacement(placement);
                          }}
                          className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-xs font-extrabold text-blue-700 transition hover:bg-blue-50"
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <Eye className="h-4 w-4" />
                          </span>
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMobileMenuId(null);
                            openEditForm(placement);
                          }}
                          className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-xs font-extrabold text-sky-700 transition hover:bg-sky-50"
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                            <Pencil className="h-4 w-4" />
                          </span>
                          Edit
                        </button>
                        {!['COMPLETED', 'CANCELLED'].includes(placement.status) && (
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMobileMenuId(null);
                              void endPlacement(placement);
                            }}
                            className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-xs font-extrabold text-rose-600 transition hover:bg-rose-50"
                          >
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                              <CheckCircle2 className="h-4 w-4" />
                            </span>
                            End Placement
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
                          ID: {placement.studentId?.studentNumber || user?.email || '-'}
                        </p>
                        <span className={`mt-2 inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black shadow-sm ${statusClass(placement.status)}`}>
                          {statusLabel(placement.status)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-0 overflow-hidden rounded-2xl border border-blue-100 bg-white/80">
                      <div className="flex min-w-0 items-center gap-2.5 border-b border-r border-blue-100 p-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <Building2 className="h-4.5 w-4.5" />
                        </span>
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold text-blue-500">Hospital</div>
                          <div className="mt-0.5 truncate text-xs font-black text-slate-800">{hospitalName(placement)}</div>
                        </div>
                      </div>

                      <div className="flex min-w-0 items-center gap-2.5 border-b border-r border-blue-100 p-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                          <GraduationCap className="h-4.5 w-4.5" />
                        </span>
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold text-blue-500">Programme</div>
                          <div className="mt-0.5 truncate text-xs font-black text-slate-800">{programmeName(placement)}</div>
                        </div>
                      </div>

                      <div className="col-span-2 flex min-w-0 items-center gap-2.5 border-b border-blue-100 p-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                          <Users className="h-4.5 w-4.5" />
                        </span>
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold text-violet-500">Batch No</div>
                          <div className="mt-0.5 truncate text-xs font-black text-slate-800">
                            {batchInfo(placement).number}
                          </div>
                        </div>
                      </div>

                      <div className="col-span-2 flex min-w-0 items-center gap-2.5 p-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <CalendarDays className="h-4.5 w-4.5" />
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
                {Array.from({ length: totalPages }, (_, index) => index + 1)
                  .filter((value) => value === 1 || value === totalPages || Math.abs(value - page) <= 1)
                  .map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPage(value)}
                      className={
                        'h-9 min-w-9 rounded-lg px-2 text-xs font-black ' +
                        (value === page
                          ? 'bg-teal-600 text-white'
                          : 'border border-slate-200 text-slate-600 hover:bg-slate-50')
                      }
                    >
                      {value}
                    </button>
                  ))}
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

      {showForm && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-4">
          <div className="max-h-[94vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-3xl sm:rounded-3xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-700">Placement Management</div>
                <h2 className="mt-1 text-xl font-black text-slate-950">
                  {editingPlacement ? 'Edit Placement' : 'New Placement'}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Assign the student to a hospital and placement dates. Department and supervisor are assigned in Rotation Planner.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={savePlacement} className="space-y-5 p-5 sm:p-6">
              {formError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">
                  {formError}
                </div>
              )}

              {!editingPlacement && (
                <label className="block space-y-1.5">
                  <span className="text-xs font-extrabold text-slate-700">Student / Application *</span>
                  <select
                    required
                    value={form.applicationId}
                    onChange={(event) => setForm((current) => ({ ...current, applicationId: event.target.value }))}
                    className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-teal-500"
                  >
                    <option value="">Select student application</option>
                    {applications.map((application) => {
                      const user = application.studentId?.userId;
                      const label = [
                        fullName(user),
                        application.studentId?.studentNumber,
                        application.programmeId?.name || application.programmeText,
                        application.status,
                      ].filter(Boolean).join(' • ');
                      return (
                        <option key={asId(application)} value={asId(application)}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                </label>
              )}

              {selectedApplication && !editingPlacement && (
                <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-xs sm:grid-cols-3">
                  <div>
                    <div className="font-bold text-slate-400">University</div>
                    <div className="mt-1 font-extrabold text-slate-700">{selectedApplication.universityId?.name || 'Independent'}</div>
                  </div>
                  <div>
                    <div className="font-bold text-slate-400">Programme</div>
                    <div className="mt-1 font-extrabold text-slate-700">{selectedApplication.programmeId?.name || selectedApplication.programmeText || '-'}</div>
                  </div>
                  <div>
                    <div className="font-bold text-slate-400">Application Status</div>
                    <div className="mt-1 font-extrabold text-slate-700">{selectedApplication.status || '-'}</div>
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1.5 sm:col-span-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-extrabold text-slate-700">Hospital *</span>
                    {!editingPlacement && (
                      <button
                        type="button"
                        onClick={() => setShowHospitalForm((current) => !current)}
                        className="text-[11px] font-black text-teal-700"
                      >
                        + Add New Hospital
                      </button>
                    )}
                  </div>
                  <select
                    required
                    value={form.organizationId}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, organizationId: event.target.value }))
                    }
                    className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-teal-500"
                  >
                    <option value="">Select hospital</option>
                    {organizations.map((organization) => (
                      <option key={asId(organization)} value={asId(organization)}>
                        {organization.name} ({organization.capacity || 0} slots)
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-extrabold text-slate-700">Start Date *</span>
                  <input
                    required
                    type="date"
                    value={form.startDate}
                    onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
                    className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-teal-500"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-extrabold text-slate-700">End Date *</span>
                  <input
                    required
                    type="date"
                    min={form.startDate || undefined}
                    value={form.endDate}
                    onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
                    className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-teal-500"
                  />
                </label>
              </div>

              {showHospitalForm && !editingPlacement && (
                <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-teal-700" />
                    <h3 className="text-sm font-black text-slate-900">Create Hospital</h3>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      value={hospitalForm.name}
                      onChange={(event) => setHospitalForm((current) => ({ ...current, name: event.target.value }))}
                      placeholder="Hospital name *"
                      className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-teal-500"
                    />
                    <input
                      type="email"
                      value={hospitalForm.contactEmail}
                      onChange={(event) => setHospitalForm((current) => ({ ...current, contactEmail: event.target.value }))}
                      placeholder="Official email *"
                      className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-teal-500"
                    />
                    <input
                      value={hospitalForm.contactPhone}
                      onChange={(event) => setHospitalForm((current) => ({ ...current, contactPhone: event.target.value }))}
                      placeholder="Telephone"
                      className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-teal-500"
                    />
                    <input
                      type="number"
                      min="1"
                      value={hospitalForm.capacity}
                      onChange={(event) => setHospitalForm((current) => ({ ...current, capacity: event.target.value }))}
                      placeholder="Capacity"
                      className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-teal-500"
                    />
                    <input
                      value={hospitalForm.address}
                      onChange={(event) => setHospitalForm((current) => ({ ...current, address: event.target.value }))}
                      placeholder="Address"
                      className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-teal-500 sm:col-span-2"
                    />
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowHospitalForm(false)}
                      className="min-h-9 rounded-xl px-3 text-xs font-extrabold text-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={hospitalSaving}
                      onClick={(event) => void createHospital(event as any)}
                      className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-teal-700 px-3 text-xs font-extrabold text-white disabled:opacity-50"
                    >
                      {hospitalSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                      Save Hospital
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-extrabold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 text-sm font-extrabold text-white hover:bg-teal-700 disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingPlacement ? 'Save Changes' : 'Create Placement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingPlacement && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-4">
          <div className="w-full rounded-t-3xl bg-white shadow-2xl sm:max-w-xl sm:rounded-3xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-700">Placement Details</div>
                <h2 className="mt-1 text-xl font-black text-slate-950">{fullName(studentUser(viewingPlacement))}</h2>
              </div>
              <button
                type="button"
                onClick={() => setViewingPlacement(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 p-5 text-sm sm:grid-cols-2">
              {[
                ['University', universityName(viewingPlacement)],
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
              <button
                type="button"
                onClick={() => {
                  setViewingPlacement(null);
                  openEditForm(viewingPlacement);
                }}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-extrabold text-slate-700"
              >
                <Pencil className="h-4 w-4" />
                Edit Placement
              </button>
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
