import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Plus,
  GraduationCap,
  Eye,
  Pencil,
  CheckCircle,
  ShieldAlert,
  MapPin,
  UserRound,
  Phone,
  Mail,
  Building2,
  Archive,
} from 'lucide-react';
import { AdminApiService } from '../../services/admin.service';
import { AdminUniversity, PaginationMeta } from '../../types/admin.types';
import { SearchInput } from '../../components/admin/SearchInput';
import { Pagination } from '../../components/admin/Pagination';
import { StatusBadge } from '../../components/admin/Badge';
import { Modal } from '../../components/admin/Modal';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { LoadingState, ErrorState, EmptyState } from '../../components/admin/States';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/frontend';

export const UniversitiesPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [universities, setUniversities] = useState<AdminUniversity[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [universityModalOpen, setUniversityModalOpen] = useState(false);
  const [editingUniversity, setEditingUniversity] = useState<AdminUniversity | null>(null);
  const [selectedUni, setSelectedUni] = useState<AdminUniversity | null>(null);
  const [confirmStatusOpen, setConfirmStatusOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ARCHIVED'>('ACTIVE');
  const [actionLoading, setActionLoading] = useState(false);

  const initialForm = {
    name: '',
    code: '',
    officialName: '',
    abbreviation: '',
    email: '',
    phone: '',
    website: '',
    country: 'Somalia',
    city: '',
    state: '',
    address: '',
    postalCode: '',
    accreditationNumber: '',
    accreditationStatus: 'PENDING',
    contactPersonName: '',
    contactPersonEmail: '',
    contactPersonPhone: '',
    notes: '',
    capacity: 100,
    createInitialAdmin: false,
    initialAdminEmail: '',
    initialAdminPassword: '',
    initialAdminFirstName: '',
    initialAdminLastName: '',
  };
  const [formData, setFormData] = useState(initialForm);

  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const searchParam = searchParams.get('search') || '';
  const statusParam = searchParams.get('status') || '';
  const countryParam = searchParams.get('country') || '';

  const fetchUniversities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await AdminApiService.getUniversities({
        page: pageParam,
        limit: 20,
        search: searchParam,
        status: statusParam,
      });

      let filtered = res.universities || [];
      if (countryParam && res.universities) {
        filtered = res.universities.filter((uni: any) =>
          uni.country?.toLowerCase().includes(countryParam.toLowerCase()),
        );
      }

      setUniversities(filtered);
      setPagination(
        res.pagination || {
          page: pageParam,
          limit: 20,
          total: filtered.length,
          totalPages: Math.ceil(filtered.length / 20) || 1,
        },
      );
    } catch (err: any) {
      setError(err.message || 'Failed to load universities.');
    } finally {
      setLoading(false);
    }
  }, [pageParam, searchParam, statusParam, countryParam]);

  useEffect(() => {
    fetchUniversities();
  }, [fetchUniversities]);

  const updateQueryParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    params.set('page', '1');
    setSearchParams(params);
  };

  const openCreateModal = () => {
    setEditingUniversity(null);
    setFormData(initialForm);
    setUniversityModalOpen(true);
  };

  const openEditModal = (uni: AdminUniversity) => {
    const data = uni as any;
    setEditingUniversity(uni);
    setFormData({
      ...initialForm,
      name: data.name || data.officialName || '',
      code: data.code || '',
      officialName: data.officialName || data.name || '',
      abbreviation: data.abbreviation || data.code || '',
      email: data.email || data.contactPersonEmail || '',
      phone: data.phone || data.contactPersonPhone || '',
      website: data.website || '',
      country: data.country || 'Somalia',
      city: data.city || '',
      state: data.state || '',
      address: data.address || '',
      postalCode: data.postalCode || '',
      accreditationNumber: data.accreditationNumber || '',
      accreditationStatus: data.accreditationStatus || 'PENDING',
      contactPersonName: data.contactPersonName || '',
      contactPersonEmail: data.contactPersonEmail || data.email || '',
      contactPersonPhone: data.contactPersonPhone || data.phone || '',
      notes: data.notes || '',
      capacity: data.capacity || 100,
      createInitialAdmin: false,
      initialAdminEmail: '',
      initialAdminPassword: '',
      initialAdminFirstName: '',
      initialAdminLastName: '',
    });
    setUniversityModalOpen(true);
  };

  const closeUniversityModal = () => {
    if (actionLoading) return;
    setUniversityModalOpen(false);
    setEditingUniversity(null);
    setFormData(initialForm);
  };

  const handleUniversitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setActionLoading(true);
      const payload: any = {
        name: formData.officialName,
        code: formData.code,
        officialName: formData.officialName,
        abbreviation: formData.code,
        email: formData.contactPersonEmail,
        phone: formData.contactPersonPhone,
        country: formData.country,
        city: formData.city,
        address: formData.address,
        accreditationStatus: formData.accreditationStatus || 'PENDING',
        contactPersonName: formData.contactPersonName,
        contactPersonEmail: formData.contactPersonEmail,
        contactPersonPhone: formData.contactPersonPhone,
        capacity: formData.capacity || 100,
      };

      if (editingUniversity) {
        await AdminApiService.updateUniversity(editingUniversity._id, payload);
      } else {
        if (formData.createInitialAdmin) {
          payload.initialAdminEmail = formData.initialAdminEmail;
          payload.initialAdminPassword = formData.initialAdminPassword;
          payload.initialAdminFirstName = formData.initialAdminFirstName;
          payload.initialAdminLastName = formData.initialAdminLastName;
        }
        await AdminApiService.createUniversity(payload);
      }

      setUniversityModalOpen(false);
      setEditingUniversity(null);
      setFormData(initialForm);
      fetchUniversities();
    } catch (err: any) {
      alert(err.message || ('Failed to ' + (editingUniversity ? 'update' : 'create') + ' university.'));
    } finally {
      setActionLoading(false);
    }
  };

  const askForStatus = (
    uni: AdminUniversity,
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ARCHIVED',
  ) => {
    setSelectedUni(uni);
    setTargetStatus(status);
    setConfirmStatusOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedUni) return;

    try {
      setActionLoading(true);
      await AdminApiService.updateUniversityStatus(selectedUni._id, targetStatus);
      setConfirmStatusOpen(false);
      setSelectedUni(null);
      fetchUniversities();
    } catch (err: any) {
      alert(err.message || 'Failed to update university status.');
    } finally {
      setActionLoading(false);
    }
  };

  const canManage = user?.roles?.some(
    (role) => role === UserRole.SUPER_ADMIN || role === UserRole.AZAAM_STAFF,
  );

  const activeCount = universities.filter((uni) => uni?.status === 'ACTIVE').length;
  const suspendedCount = universities.filter((uni) => uni?.status === 'SUSPENDED').length;
  const archivedCount = universities.filter((uni) => uni?.status === 'ARCHIVED').length;

  const statCards = [
    {
      label: 'Total Registers',
      value: pagination?.total ?? universities.length,
      icon: Building2,
      card: 'border-blue-100 bg-gradient-to-br from-blue-50 via-white to-white',
      iconWrap: 'bg-blue-100 text-blue-600',
      labelClass: 'text-blue-700',
    },
    {
      label: 'Active Partner',
      value: activeCount,
      icon: CheckCircle,
      card: 'border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-white',
      iconWrap: 'bg-emerald-100 text-emerald-600',
      labelClass: 'text-emerald-700',
    },
    {
      label: 'Suspended',
      value: suspendedCount,
      icon: ShieldAlert,
      card: 'border-amber-100 bg-gradient-to-br from-amber-50 via-white to-white',
      iconWrap: 'bg-amber-100 text-amber-600',
      labelClass: 'text-amber-700',
    },
    {
      label: 'Archived',
      value: archivedCount,
      icon: Archive,
      card: 'border-rose-100 bg-gradient-to-br from-rose-50 via-white to-white',
      iconWrap: 'bg-rose-100 text-rose-600',
      labelClass: 'text-rose-700',
    },
  ];

  const inputClass =
    'w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition';

  return (
    <div className="university-option-a min-h-full rounded-[28px] bg-slate-50 p-3 sm:p-5 text-slate-900 space-y-5 sm:space-y-6">
      <section className="relative overflow-hidden rounded-[28px] border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 px-5 py-6 sm:px-7 sm:py-8 shadow-xl">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-10 h-28 w-28 rounded-full bg-cyan-400/10 blur-2xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/10 px-3 py-1.5 text-[10px] sm:text-xs font-extrabold uppercase tracking-[0.14em] text-teal-300">
              <GraduationCap className="w-4 h-4" />
              University Partnerships
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              University Management
            </h1>
            <p className="mt-2 max-w-xl text-sm sm:text-base leading-6 text-slate-300">
              Partner universities, academic institutions, and student enrollment capacity.
            </p>
          </div>

          {canManage && (
            <button
              type="button"
              onClick={openCreateModal}
              className="w-full lg:w-auto min-h-12 px-6 py-3 text-sm font-extrabold text-white bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl hover:from-teal-600 hover:to-emerald-600 transition shadow-lg shadow-teal-950/30 flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>Register University</span>
            </button>
          )}
        </div>
      </section>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className={'min-h-[118px] sm:min-h-[132px] rounded-2xl border p-4 sm:p-5 shadow-sm ' + item.card}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className={'text-[10px] sm:text-xs font-extrabold uppercase tracking-[0.08em] ' + item.labelClass}>
                    {item.label}
                  </div>
                  <div className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
                    {item.value}
                  </div>
                </div>
                <div className={'w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center ' + item.iconWrap}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex-1">
            <SearchInput
              value={searchParam}
              onChange={(value) => updateQueryParam('search', value)}
              placeholder="Search code, name, official title, city..."
            />
          </div>

          <div className="grid grid-cols-2 lg:flex gap-3">
            <select
              value={statusParam}
              onChange={(e) => updateQueryParam('status', e.target.value)}
              className="w-full lg:w-[150px] min-h-10 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="ARCHIVED">Archived</option>
            </select>

            <select
              value={countryParam}
              onChange={(e) => updateQueryParam('country', e.target.value)}
              className="w-full lg:w-[150px] min-h-10 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            >
              <option value="">All Countries</option>
              <option value="Somalia">Somalia</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading university list..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchUniversities} />
      ) : universities.length === 0 ? (
        <EmptyState
          title="No universities found"
          description="Create a new institution or adjust search filters."
        />
      ) : (
        <>
          <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider">#</th>
                    <th className="px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider">University</th>
                    <th className="px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider">Code</th>
                    <th className="px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider">City</th>
                    <th className="px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider">Country</th>
                    <th className="px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider">Status</th>
                    <th className="px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {universities.map((uni, index) => (
                    <tr key={uni._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-4 text-slate-400 font-semibold">
                        {(pagination.page - 1) * pagination.limit + index + 1}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-slate-100 text-blue-700 flex items-center justify-center font-extrabold shrink-0">
                            {(uni.code || uni.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <Link
                              to={'/admin/universities/' + uni._id}
                              className="font-extrabold text-slate-900 hover:text-teal-700 transition"
                            >
                              {uni.name}
                            </Link>
                            <p className="text-xs text-slate-500 mt-0.5 max-w-[280px] truncate">
                              {uni.officialName || uni.name}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 font-mono font-bold text-slate-700">{uni.code}</td>
                      <td className="px-5 py-4 text-slate-600">{uni.city || 'Mogadishu'}</td>
                      <td className="px-5 py-4 text-slate-600">{(uni as any).country || 'Somalia'}</td>
                      <td className="px-5 py-4">
                        <StatusBadge status={uni.status} />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={'/admin/universities/' + uni._id}
                            title="View university"
                            aria-label={'View ' + uni.name}
                            className="w-9 h-9 inline-flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-600 hover:text-white transition"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {canManage && (
                            <>
                              <button
                                type="button"
                                onClick={() => openEditModal(uni)}
                                title="Edit university"
                                aria-label={'Edit ' + uni.name}
                                className="w-9 h-9 inline-flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-600 hover:text-white transition"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>

                              {uni.status === 'ACTIVE' ? (
                                <button
                                  type="button"
                                  onClick={() => askForStatus(uni, 'SUSPENDED')}
                                  title="Suspend university"
                                  aria-label={'Suspend ' + uni.name}
                                  className="w-9 h-9 inline-flex items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-500 hover:text-white transition"
                                >
                                  <ShieldAlert className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => askForStatus(uni, 'ACTIVE')}
                                  title="Activate university"
                                  aria-label={'Activate ' + uni.name}
                                  className="w-9 h-9 inline-flex items-center justify-center rounded-lg bg-teal-50 text-teal-600 border border-teal-100 hover:bg-teal-600 hover:text-white transition"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}

                              {uni.status !== 'ARCHIVED' && (
                                <button
                                  type="button"
                                  onClick={() => askForStatus(uni, 'ARCHIVED')}
                                  title="Archive university"
                                  aria-label={'Archive ' + uni.name}
                                  className="w-9 h-9 inline-flex items-center justify-center rounded-lg bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-600 hover:text-white transition"
                                >
                                  <Archive className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              meta={pagination}
              onPageChange={(page) => updateQueryParam('page', page.toString())}
            />
          </div>

          <div className="md:hidden space-y-3">
            {universities.map((uni) => (
              <div
                key={uni._id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-100 to-slate-100 text-blue-700 flex items-center justify-center font-extrabold shrink-0">
                      {(uni.code || uni.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <Link
                        to={'/admin/universities/' + uni._id}
                        className="block text-base font-extrabold text-slate-950 truncate"
                      >
                        {uni.name}
                      </Link>
                      <p className="text-xs font-bold text-slate-500 mt-0.5">{uni.code}</p>
                    </div>
                  </div>

                  <StatusBadge status={uni.status} />
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    {uni.city || 'Mogadishu'}, {(uni as any).country || 'Somalia'}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link
                    to={'/admin/universities/' + uni._id}
                    className="min-h-10 inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-xs font-bold active:bg-blue-100"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </Link>

                  {canManage && (
                    <button
                      type="button"
                      onClick={() => openEditModal(uni)}
                      className="min-h-10 inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-bold active:bg-emerald-100"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit
                    </button>
                  )}

                  {canManage && uni.status === 'ACTIVE' && (
                    <button
                      type="button"
                      onClick={() => askForStatus(uni, 'SUSPENDED')}
                      className="min-h-10 inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-xs font-bold active:bg-amber-100"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      Suspend
                    </button>
                  )}

                  {canManage && uni.status !== 'ACTIVE' && (
                    <button
                      type="button"
                      onClick={() => askForStatus(uni, 'ACTIVE')}
                      className="min-h-10 inline-flex items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50 text-teal-700 text-xs font-bold active:bg-teal-100"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Activate
                    </button>
                  )}

                  {canManage && uni.status !== 'ARCHIVED' && (
                    <button
                      type="button"
                      onClick={() => askForStatus(uni, 'ARCHIVED')}
                      className="min-h-10 inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold active:bg-rose-100"
                    >
                      <Archive className="w-4 h-4" />
                      Archive
                    </button>
                  )}
                </div>
              </div>
            ))}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <Pagination
                meta={pagination}
                onPageChange={(page) => updateQueryParam('page', page.toString())}
              />
            </div>
          </div>
        </>
      )}

      <Modal
        isOpen={universityModalOpen}
        onClose={closeUniversityModal}
        title={editingUniversity ? 'Edit University' : 'Register New University'}
        maxWidth="2xl"
      >
        <form onSubmit={handleUniversitySubmit} className="space-y-5">
          <div className="flex items-start gap-3 pb-1">
            <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <p className="font-extrabold text-slate-900">
                {editingUniversity ? 'Update university information' : 'Enter the university information'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                The same standard form is used for registration and editing.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              ['1', 'Institution'],
              ['2', 'Location'],
              ['3', 'Focal Person'],
              ['4', 'User Account'],
            ].map(([number, label], index) => (
              <div
                key={number}
                className={
                  'rounded-xl border px-2.5 py-2.5 flex items-center gap-2 ' +
                  (index === 0
                    ? 'border-teal-200 bg-teal-50 text-teal-800'
                    : 'border-slate-200 bg-slate-50 text-slate-500')
                }
              >
                <span
                  className={
                    'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 ' +
                    (index === 0 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600')
                  }
                >
                  {number}
                </span>
                <span className="text-[10px] sm:text-xs font-bold truncate">{label}</span>
              </div>
            ))}
          </div>

          <section className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Institutional Information</h3>
                <p className="text-[11px] text-slate-500">Core university identification</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Official/Legal Name <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  value={formData.officialName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      officialName: e.target.value,
                      name: e.target.value,
                    })
                  }
                  placeholder="e.g. Somali International University"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Institution Code (Unique) <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g. SIU"
                  className={inputClass + ' uppercase font-mono'}
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Contact & Location</h3>
                <p className="text-[11px] text-slate-500">Official contact and institution location</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Official Telephone</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                  <input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        phone: e.target.value,
                        contactPersonPhone: formData.contactPersonPhone || e.target.value,
                      })
                    }
                    placeholder="+252 ..."
                    className={inputClass + ' pl-10'}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">City</label>
                <input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g. Mogadishu"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Physical Address</label>
                <input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street / district"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Country <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-violet-100 bg-violet-50/40 p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
                <UserRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Focal Person</h3>
                <p className="text-[11px] text-slate-500">Primary university contact person</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Focal Person Name</label>
                <div className="relative">
                  <UserRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400" />
                  <input
                    value={formData.contactPersonName}
                    onChange={(e) =>
                      setFormData({ ...formData, contactPersonName: e.target.value })
                    }
                    placeholder="Full name"
                    className={inputClass + ' pl-10'}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Focal Person Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400" />
                  <input
                    type="email"
                    value={formData.contactPersonEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, contactPersonEmail: e.target.value })
                    }
                    placeholder="name@university.edu"
                    className={inputClass + ' pl-10'}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Focal Person Direct Line</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400" />
                  <input
                    value={formData.contactPersonPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, contactPersonPhone: e.target.value })
                    }
                    placeholder="+252 ..."
                    className={inputClass + ' pl-10'}
                  />
                </div>
              </div>
            </div>
          </section>

          {!editingUniversity ? (
            <section className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 sm:p-5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.createInitialAdmin}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      createInitialAdmin: e.target.checked,
                    })
                  }
                  className="mt-0.5 h-4 w-4 rounded border-amber-300 text-teal-600 focus:ring-teal-500"
                />
                <div>
                  <span className="text-sm font-extrabold text-slate-900 block">
                    Provision Initial University Admin User Account
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Create the university's first administrator during registration.
                  </span>
                </div>
              </label>

              {formData.createInitialAdmin && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-amber-200">
                  <input
                    required
                    placeholder="Admin First Name"
                    value={formData.initialAdminFirstName}
                    onChange={(e) =>
                      setFormData({ ...formData, initialAdminFirstName: e.target.value })
                    }
                    className={inputClass}
                  />
                  <input
                    required
                    placeholder="Admin Last Name"
                    value={formData.initialAdminLastName}
                    onChange={(e) =>
                      setFormData({ ...formData, initialAdminLastName: e.target.value })
                    }
                    className={inputClass}
                  />
                  <input
                    required
                    type="email"
                    placeholder="Admin Email Address"
                    value={formData.initialAdminEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, initialAdminEmail: e.target.value })
                    }
                    className={inputClass}
                  />
                  <input
                    required
                    type="password"
                    placeholder="Admin Initial Password"
                    value={formData.initialAdminPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, initialAdminPassword: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
              )}
            </section>
          ) : (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-bold text-amber-900">University Admin User Account</p>
              <p className="text-[11px] text-amber-700 mt-1">
                Initial admin provisioning is available during registration only. Existing accounts are managed separately.
              </p>
            </section>
          )}

          <div className="sticky bottom-0 -mx-1 px-1 pt-4 pb-1 bg-white/95 backdrop-blur border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeUniversityModal}
              disabled={actionLoading}
              className="min-h-11 px-5 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={actionLoading}
              className="min-h-11 px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl hover:from-teal-700 hover:to-emerald-700 font-extrabold shadow-sm shadow-teal-600/20 disabled:opacity-60 transition"
            >
              {actionLoading
                ? 'Saving...'
                : editingUniversity
                  ? 'Update University'
                  : 'Register University'}
            </button>
          </div>
        </form>
      </Modal>

      {selectedUni && confirmStatusOpen && (
        <ConfirmDialog
          isOpen={confirmStatusOpen}
          onClose={() => setConfirmStatusOpen(false)}
          onConfirm={handleUpdateStatus}
          title={'Set Status to ' + targetStatus}
          message={
            'Are you sure you want to transition ' +
            selectedUni.name +
            " to '" +
            targetStatus +
            "'? This status change will be logged in the system audit logs."
          }
          confirmLabel={'Change Status to ' + targetStatus}
          variant={
            targetStatus === 'ARCHIVED' || targetStatus === 'SUSPENDED' ? 'danger' : 'info'
          }
          isLoading={actionLoading}
        />
      )}
    </div>
  );
};
