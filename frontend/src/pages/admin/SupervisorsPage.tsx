import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Eye,
  GraduationCap,
  Loader2,
  Mail,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Stethoscope,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';
import api from '../../services/api';
import { AdminApiService } from '../../services/admin.service';
import { AdminOrganization, AdminSupervisor, PaginationMeta } from '../../types/admin.types';
import { Pagination } from '../../components/admin/Pagination';
import { Modal } from '../../components/admin/Modal';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';

type DepartmentOption = {
  _id: string;
  name: string;
  code?: string;
};

type SupervisorStats = {
  total: number;
  active: number;
  departments: number;
  assignedStudents: number;
};

const EMPTY_STATS: SupervisorStats = {
  total: 0,
  active: 0,
  departments: 0,
  assignedStudents: 0,
};

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  organizationId: '',
  departmentId: '',
  qualification: '',
  licenseNumber: '',
  yearsOfExperience: '',
  password: '',
  status: 'ACTIVE',
};

const supervisorName = (supervisor: AdminSupervisor) =>
  [supervisor.userId?.firstName, supervisor.userId?.lastName].filter(Boolean).join(' ') || 'Clinical Supervisor';

const initials = (supervisor: AdminSupervisor) => {
  const first = supervisor.userId?.firstName?.[0] || 'S';
  const last = supervisor.userId?.lastName?.[0] || '';
  return `${first}${last}`.toUpperCase();
};

export const SupervisorsPage: React.FC = () => {
  const [supervisors, setSupervisors] = useState<AdminSupervisor[]>([]);
  const [organizations, setOrganizations] = useState<AdminOrganization[]>([]);
  const [filterDepartments, setFilterDepartments] = useState<DepartmentOption[]>([]);
  const [formDepartments, setFormDepartments] = useState<DepartmentOption[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [stats, setStats] = useState<SupervisorStats>(EMPTY_STATS);

  const [loading, setLoading] = useState(true);
  const [referenceLoading, setReferenceLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [search, setSearch] = useState('');
  const [hospitalFilter, setHospitalFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedSupervisor, setSelectedSupervisor] = useState<AdminSupervisor | null>(null);
  const [confirmToggleOpen, setConfirmToggleOpen] = useState(false);

  const loadOrganizations = useCallback(async () => {
    try {
      const response = await AdminApiService.getOrganizations({ page: 1, limit: 100, status: 'ACTIVE' });
      setOrganizations(response.organizations || []);
    } catch {
      setOrganizations([]);
    }
  }, []);

  const loadFilterDepartments = useCallback(async (organizationId: string) => {
    setDepartmentFilter('');
    if (!organizationId) {
      setFilterDepartments([]);
      return;
    }

    try {
      const departments = await AdminApiService.getOrganizationDepartments(organizationId);
      setFilterDepartments(departments);
    } catch {
      setFilterDepartments([]);
    }
  }, []);

  const loadFormDepartments = useCallback(async (organizationId: string) => {
    setForm((current) => ({ ...current, departmentId: '' }));
    if (!organizationId) {
      setFormDepartments([]);
      return;
    }

    try {
      setReferenceLoading(true);
      const departments = await AdminApiService.getOrganizationDepartments(organizationId);
      setFormDepartments(departments);
    } catch {
      setFormDepartments([]);
    } finally {
      setReferenceLoading(false);
    }
  }, []);

  const fetchSupervisors = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('/admin/supervisors', {
        params: {
          page,
          limit: 20,
          search: search.trim() || undefined,
          organizationId: hospitalFilter || undefined,
          departmentId: departmentFilter || undefined,
          status: statusFilter || undefined,
        },
      });

      const items = Array.isArray(response.data?.data) ? response.data.data : [];
      setSupervisors(items);
      setPagination(
        response.data?.pagination || {
          page,
          limit: 20,
          total: items.length,
          totalPages: Math.ceil(items.length / 20) || 1,
        }
      );
      setStats(response.data?.stats || EMPTY_STATS);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error?.message || 'Unable to load clinical supervisors.');
      setSupervisors([]);
      setStats(EMPTY_STATS);
    } finally {
      setLoading(false);
    }
  }, [page, search, hospitalFilter, departmentFilter, statusFilter]);

  useEffect(() => {
    void loadOrganizations();
  }, [loadOrganizations]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchSupervisors();
    }, search ? 300 : 0);

    return () => window.clearTimeout(timer);
  }, [fetchSupervisors, search]);

  const clearFilters = () => {
    setSearch('');
    setHospitalFilter('');
    setDepartmentFilter('');
    setStatusFilter('');
    setFilterDepartments([]);
    setPage(1);
  };

  const openCreateModal = () => {
    setError('');
    setSuccess('');
    setForm(EMPTY_FORM);
    setFormDepartments([]);
    setCreateModalOpen(true);
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.organizationId || !form.departmentId || !form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setError('Complete all required supervisor, hospital, and department fields.');
      return;
    }

    if (form.password.length < 12) {
      setError('Password must be at least 12 characters.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      await api.post('/admin/supervisors', {
        ...form,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        qualification: form.qualification.trim(),
        licenseNumber: form.licenseNumber.trim(),
        yearsOfExperience: form.yearsOfExperience === '' ? 0 : Number(form.yearsOfExperience),
      });

      setCreateModalOpen(false);
      setForm(EMPTY_FORM);
      setFormDepartments([]);
      setSuccess('Clinical supervisor created successfully and login account is ready.');
      setPage(1);
      await fetchSupervisors();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error?.message || 'Unable to create clinical supervisor.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedSupervisor) return;

    try {
      setActionLoading(true);
      const nextStatus = selectedSupervisor.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await AdminApiService.updateSupervisorStatus(selectedSupervisor._id, nextStatus);
      setConfirmToggleOpen(false);
      setSelectedSupervisor(null);
      setSuccess(`Supervisor status changed to ${nextStatus.toLowerCase()}.`);
      await fetchSupervisors();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error?.message || 'Unable to update supervisor status.');
    } finally {
      setActionLoading(false);
    }
  };

  const cards = useMemo(
    () => [
      {
        label: 'Total Supervisors',
        value: stats.total,
        icon: Users,
        tone: 'from-blue-500 to-cyan-500',
        surface: 'bg-blue-50 text-blue-700',
      },
      {
        label: 'Active Supervisors',
        value: stats.active,
        icon: UserCheck,
        tone: 'from-emerald-500 to-teal-500',
        surface: 'bg-emerald-50 text-emerald-700',
      },
      {
        label: 'Departments Covered',
        value: stats.departments,
        icon: Building2,
        tone: 'from-violet-500 to-fuchsia-500',
        surface: 'bg-violet-50 text-violet-700',
      },
      {
        label: 'Students Assigned',
        value: stats.assignedStudents,
        icon: GraduationCap,
        tone: 'from-sky-500 to-blue-600',
        surface: 'bg-sky-50 text-sky-700',
      },
    ],
    [stats]
  );

  return (
    <div className="space-y-5 pb-10">
      <section className="relative overflow-hidden rounded-3xl border border-cyan-100 bg-gradient-to-br from-white via-cyan-50 to-blue-50 p-5 shadow-sm sm:p-6">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-cyan-200/40 blur-2xl" />
        <div className="absolute bottom-0 right-24 h-24 w-24 rounded-full bg-violet-200/30 blur-2xl" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-700">
              <Stethoscope className="h-3.5 w-3.5" />
              Clinical Workforce
            </div>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Clinical Supervisors
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Manage hospital supervisors, connect each clinician to a department, and monitor trainee assignments.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 px-5 text-sm font-black text-white shadow-lg shadow-cyan-200/60 transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <Plus className="h-5 w-5" />
            Add Supervisor
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${card.tone}`} />
              <div className="flex items-start justify-between gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.surface}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="h-8 w-16 rounded-full bg-gradient-to-r from-slate-50 to-slate-100 opacity-70" />
              </div>
              <p className="mt-4 text-2xl font-black text-slate-950 sm:text-3xl">{loading ? '—' : card.value}</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-slate-400 sm:text-xs">{card.label}</p>
            </article>
          );
        })}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(260px,1.6fr)_1fr_1fr_0.8fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search name, email, phone or license..."
              className="min-h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-semibold text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-100"
            />
          </div>

          <select
            value={hospitalFilter}
            onChange={(event) => {
              const value = event.target.value;
              setHospitalFilter(value);
              setPage(1);
              void loadFilterDepartments(value);
            }}
            className="min-h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none focus:border-cyan-500"
          >
            <option value="">All Hospitals</option>
            {organizations.map((organization) => (
              <option key={organization._id} value={organization._id}>
                {organization.name}
              </option>
            ))}
          </select>

          <select
            value={departmentFilter}
            disabled={!hospitalFilter}
            onChange={(event) => {
              setDepartmentFilter(event.target.value);
              setPage(1);
            }}
            className="min-h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none focus:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">All Departments</option>
            {filterDepartments.map((department) => (
              <option key={department._id} value={department._id}>
                {department.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            className="min-h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none focus:border-cyan-500"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          <button
            type="button"
            onClick={clearFilters}
            className="min-h-10 rounded-xl border border-slate-200 px-4 text-xs font-black text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          >
            Clear
          </button>
        </div>
      </section>

      {success && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          {success}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-72 items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-white text-sm font-bold text-slate-500 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading supervisors...
        </div>
      ) : supervisors.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <UserCheck className="mx-auto h-10 w-10 text-slate-300" />
          <h2 className="mt-3 text-base font-black text-slate-900">No supervisors found</h2>
          <p className="mt-1 text-xs text-slate-500">Adjust the filters or create the first clinical supervisor.</p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-teal-600 px-4 text-xs font-black text-white"
          >
            <Plus className="h-4 w-4" />
            Add Supervisor
          </button>
        </div>
      ) : (
        <>
          <section className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-3.5">Supervisor</th>
                    <th className="px-4 py-3.5">Department</th>
                    <th className="px-4 py-3.5">Hospital</th>
                    <th className="px-4 py-3.5">Contact</th>
                    <th className="px-4 py-3.5">Students</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {supervisors.map((supervisor, index) => (
                    <tr key={supervisor._id} className="group transition hover:bg-cyan-50/30">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
                              index % 4 === 0
                                ? 'bg-blue-100 text-blue-700'
                                : index % 4 === 1
                                  ? 'bg-teal-100 text-teal-700'
                                  : index % 4 === 2
                                    ? 'bg-violet-100 text-violet-700'
                                    : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {initials(supervisor)}
                          </div>
                          <div className="min-w-0">
                            <Link
                              to={`/admin/supervisors/${supervisor._id}`}
                              className="block truncate text-sm font-black text-slate-900 transition hover:text-cyan-700"
                            >
                              {supervisorName(supervisor)}
                            </Link>
                            <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-500">
                              {supervisor.qualification || 'Clinical Supervisor'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex rounded-lg bg-violet-50 px-2.5 py-1.5 text-[11px] font-black text-violet-700">
                          {supervisor.departmentId?.name || 'Not assigned'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs font-bold text-slate-700">
                        {supervisor.organizationId?.name || 'Unassigned'}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="space-y-1 text-[11px] font-semibold text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-cyan-500" />
                            <span>{supervisor.userId?.email || '—'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-teal-500" />
                            <span>{supervisor.userId?.phone || '—'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-black text-slate-900">{supervisor.assignedTraineesCount || 0}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black ${
                            supervisor.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${supervisor.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {supervisor.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/admin/supervisors/${supervisor._id}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-cyan-50 hover:text-cyan-700"
                            title="View supervisor"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSupervisor(supervisor);
                              setConfirmToggleOpen(true);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            title={supervisor.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination meta={pagination} onPageChange={setPage} />
          </section>

          <section className="grid gap-3 md:hidden">
            {supervisors.map((supervisor, index) => (
              <article key={supervisor._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-black ${
                      index % 3 === 0
                        ? 'bg-cyan-100 text-cyan-700'
                        : index % 3 === 1
                          ? 'bg-violet-100 text-violet-700'
                          : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {initials(supervisor)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link to={`/admin/supervisors/${supervisor._id}`} className="block truncate text-sm font-black text-slate-950">
                          {supervisorName(supervisor)}
                        </Link>
                        <p className="mt-0.5 truncate text-[11px] font-bold text-cyan-700">
                          {supervisor.departmentId?.name || 'Department pending'}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-black ${
                          supervisor.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {supervisor.status}
                      </span>
                    </div>

                    <p className="mt-2 truncate text-xs font-semibold text-slate-500">
                      {supervisor.organizationId?.name || 'Hospital pending'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-blue-50 p-3">
                    <p className="text-[9px] font-black uppercase tracking-wide text-blue-500">Students</p>
                    <p className="mt-1 text-lg font-black text-blue-800">{supervisor.assignedTraineesCount || 0}</p>
                  </div>
                  <div className="rounded-xl bg-violet-50 p-3">
                    <p className="text-[9px] font-black uppercase tracking-wide text-violet-500">Experience</p>
                    <p className="mt-1 text-lg font-black text-violet-800">{supervisor.yearsOfExperience || 0} yrs</p>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5 text-[11px] font-semibold text-slate-500">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-cyan-500" />
                    <span className="truncate">{supervisor.userId?.email || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-teal-500" />
                    <span>{supervisor.userId?.phone || '—'}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  {supervisor.verified ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Verified
                    </span>
                  ) : (
                    <span className="text-[10px] font-black text-amber-700">Verification pending</span>
                  )}

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/admin/supervisors/${supervisor._id}`}
                      className="rounded-lg bg-cyan-50 px-3 py-1.5 text-[10px] font-black text-cyan-700"
                    >
                      View
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSupervisor(supervisor);
                        setConfirmToggleOpen(true);
                      }}
                      className="rounded-lg bg-slate-100 px-3 py-1.5 text-[10px] font-black text-slate-600"
                    >
                      {supervisor.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <Pagination meta={pagination} onPageChange={setPage} />
            </div>
          </section>
        </>
      )}

      <Modal
        isOpen={createModalOpen}
        onClose={() => !saving && setCreateModalOpen(false)}
        title="Add New Supervisor"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreate} className="space-y-5 text-xs">
          <div className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-blue-50 p-4 sm:p-5 dark:border-cyan-900/60 dark:from-cyan-950/35 dark:to-blue-950/25">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-cyan-700 shadow-sm ring-1 ring-cyan-100 dark:bg-slate-900 dark:text-cyan-300 dark:ring-cyan-900/70">
                <UserCheck className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="font-black text-slate-950 dark:text-white">Supervisor Identity</h3>
                <p className="mt-0.5 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                  Create the clinician profile and primary contact information.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="First Name *">
                <input
                  required
                  value={form.firstName}
                  onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
                  placeholder="Abdirahman"
                  className="field-control"
                />
              </Field>
              <Field label="Last Name *">
                <input
                  required
                  value={form.lastName}
                  onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
                  placeholder="Shire"
                  className="field-control"
                />
              </Field>
              <Field label="Email *">
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="doctor@hospital.so"
                  className="field-control"
                />
              </Field>
              <Field label="Phone">
                <input
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  placeholder="+252 61 000 0000"
                  className="field-control"
                />
              </Field>
            </div>
          </div>

          <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-4 sm:p-5 dark:border-violet-900/60 dark:bg-violet-950/20">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-violet-700 shadow-sm ring-1 ring-violet-100 dark:bg-slate-900 dark:text-violet-300 dark:ring-violet-900/70">
                <Building2 className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="font-black text-slate-950 dark:text-white">Clinical Assignment</h3>
                <p className="mt-0.5 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                  Connect the supervisor to the correct hospital and department.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Hospital *">
                <select
                  required
                  value={form.organizationId}
                  onChange={(event) => {
                    const value = event.target.value;
                    setForm((current) => ({ ...current, organizationId: value, departmentId: '' }));
                    void loadFormDepartments(value);
                  }}
                  className="field-control"
                >
                  <option value="">Select hospital</option>
                  {organizations.map((organization) => (
                    <option key={organization._id} value={organization._id}>
                      {organization.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Department *">
                <select
                  required
                  disabled={!form.organizationId || referenceLoading}
                  value={form.departmentId}
                  onChange={(event) => setForm((current) => ({ ...current, departmentId: event.target.value }))}
                  className="field-control disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">
                    {referenceLoading ? 'Loading departments...' : 'Select department'}
                  </option>
                  {formDepartments.map((department) => (
                    <option key={department._id} value={department._id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="sm:col-span-2">
                <Field label="Qualification / Designation">
                  <input
                    value={form.qualification}
                    onChange={(event) => setForm((current) => ({ ...current, qualification: event.target.value }))}
                    placeholder="Consultant Physician"
                    className="field-control"
                  />
                </Field>
              </div>

              <Field label="License Number">
                <input
                  value={form.licenseNumber}
                  onChange={(event) => setForm((current) => ({ ...current, licenseNumber: event.target.value }))}
                  placeholder="MOH-12345"
                  className="field-control"
                />
              </Field>

              <Field label="Experience (Years)">
                <input
                  type="number"
                  min={0}
                  max={70}
                  value={form.yearsOfExperience}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, yearsOfExperience: event.target.value }))
                  }
                  placeholder="Enter years"
                  className="field-control"
                />
              </Field>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 sm:p-5 dark:border-emerald-900/60 dark:bg-emerald-950/20">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-100 dark:bg-slate-900 dark:text-emerald-300 dark:ring-emerald-900/70">
                <ShieldCheck className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="font-black text-slate-950 dark:text-white">Login & Status</h3>
                <p className="mt-0.5 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                  Set the initial login password and supervisor account status.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Initial Password *">
                <input
                  type="password"
                  minLength={12}
                  required
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Minimum 12 characters"
                  className="field-control"
                />
              </Field>

              <Field label="Status *">
                <select
                  value={form.status}
                  onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                  className="field-control"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </Field>
            </div>
          </div>

          <div className="-mx-4 -mb-5 flex flex-col-reverse gap-2 border-t border-slate-100 bg-white px-4 pt-4 sm:-mx-6 sm:flex-row sm:justify-end sm:px-6 dark:border-slate-800 dark:bg-[#0f1b2d]">
            <button
              type="button"
              disabled={saving}
              onClick={() => setCreateModalOpen(false)}
              className="min-h-11 w-full rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 sm:w-auto dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-5 text-sm font-black text-white shadow-lg shadow-cyan-100 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50 sm:w-auto dark:shadow-none"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {saving ? 'Saving...' : 'Save Supervisor'}
            </button>
          </div>
        </form>
      </Modal>

      {selectedSupervisor && confirmToggleOpen && (
        <ConfirmDialog
          isOpen={confirmToggleOpen}
          onClose={() => setConfirmToggleOpen(false)}
          onConfirm={handleToggleStatus}
          title={selectedSupervisor.status === 'ACTIVE' ? 'Deactivate Supervisor' : 'Activate Supervisor'}
          message={`Change ${supervisorName(selectedSupervisor)} to ${
            selectedSupervisor.status === 'ACTIVE' ? 'inactive' : 'active'
          } status?`}
          confirmLabel={selectedSupervisor.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          variant={selectedSupervisor.status === 'ACTIVE' ? 'danger' : 'info'}
          isLoading={actionLoading}
        />
      )}

      <style>{`
        .field-control {
          min-height: 44px;
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(226 232 240);
          background: white;
          padding: 0.625rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: rgb(15 23 42);
          outline: none;
          transition: all 150ms ease;
        }
        .field-control:focus {
          border-color: rgb(6 182 212);
          box-shadow: 0 0 0 3px rgb(207 250 254);
        }
        .dark .field-control {
          border-color: rgb(51 65 85);
          background: rgb(15 23 42);
          color: rgb(241 245 249);
        }
        .dark .field-control::placeholder {
          color: rgb(100 116 139);
        }
        .dark .field-control:focus {
          border-color: rgb(34 211 238);
          box-shadow: 0 0 0 3px rgb(8 145 178 / 0.18);
        }
      `}</style>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-[11px] font-black text-slate-700 dark:text-slate-300">{label}</span>
    {children}
  </label>
);
