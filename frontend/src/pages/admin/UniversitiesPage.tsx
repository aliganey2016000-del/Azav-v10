import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, GraduationCap, Eye, Edit2, CheckCircle, XCircle, ShieldAlert, Award, FileSpreadsheet, MapPin, Search } from 'lucide-react';
import { AdminApiService } from '../../services/admin.service';
import { AdminUniversity, PaginationMeta } from '../../types/admin.types';
import { PageHeader } from '../../components/admin/PageHeader';
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
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedUni, setSelectedUni] = useState<AdminUniversity | null>(null);
  const [confirmStatusOpen, setConfirmStatusOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ARCHIVED'>('ACTIVE');
  const [actionLoading, setActionLoading] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
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
    // Initial Admin Account Option
    createInitialAdmin: false,
    initialAdminEmail: '',
    initialAdminPassword: '',
    initialAdminFirstName: '',
    initialAdminLastName: '',
  });

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

      // Filter by country client-side if requested
      let filtered = res.universities || [];
      if (countryParam && res.universities) {
        filtered = res.universities.filter((uni: any) =>
          uni.country?.toLowerCase().includes(countryParam.toLowerCase())
        );
      }

      setUniversities(filtered);
      setPagination(
        res.pagination || {
          page: pageParam,
          limit: 20,
          total: (filtered || []).length,
          totalPages: Math.ceil((filtered || []).length / 20) || 1,
        }
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
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);

      const payload: any = {
        name: formData.name,
        code: formData.code,
        officialName: formData.officialName || formData.name,
        abbreviation: formData.abbreviation || formData.code,
        email: formData.email,
        phone: formData.phone,
        website: formData.website,
        country: formData.country,
        city: formData.city,
        state: formData.state,
        address: formData.address,
        postalCode: formData.postalCode,
        accreditationNumber: formData.accreditationNumber,
        accreditationStatus: formData.accreditationStatus,
        contactPersonName: formData.contactPersonName,
        contactPersonEmail: formData.contactPersonEmail,
        contactPersonPhone: formData.contactPersonPhone,
        notes: formData.notes,
        capacity: formData.capacity,
      };

      if (formData.createInitialAdmin) {
        payload.initialAdminEmail = formData.initialAdminEmail;
        payload.initialAdminPassword = formData.initialAdminPassword;
        payload.initialAdminFirstName = formData.initialAdminFirstName;
        payload.initialAdminLastName = formData.initialAdminLastName;
      }

      await AdminApiService.createUniversity(payload);
      setCreateModalOpen(false);
      // Reset form
      setFormData({
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
      });
      fetchUniversities();
    } catch (err: any) {
      alert(err.message || 'Failed to create university.');
    } finally {
      setActionLoading(false);
    }
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

  const canManage = user?.roles?.some(r => r === UserRole.SUPER_ADMIN || r === UserRole.AZAAM_STAFF);

  // Compute stats based on loaded universities
  const activeCount = (universities || []).filter(u => u?.status === 'ACTIVE').length;
  const suspendedCount = (universities || []).filter(u => u?.status === 'SUSPENDED').length;
  const archivedCount = (universities || []).filter(u => u?.status === 'ARCHIVED').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="University Management"
        description="Partner universities, academic institutions, and student enrollment capacity."
        action={
          canManage && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition shadow-xs flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Register University</span>
            </button>
          )
        }
      />

      {/* Stats Cards Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Registers</div>
          <div className="text-2xl font-bold text-slate-900">{pagination?.total ?? (universities || []).length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1">Active Partner</div>
          <div className="text-2xl font-bold text-slate-900">{activeCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1">Suspended</div>
          <div className="text-2xl font-bold text-slate-900">{suspendedCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-1">Archived</div>
          <div className="text-2xl font-bold text-slate-900">{archivedCount}</div>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <SearchInput
            value={searchParam}
            onChange={(val) => updateQueryParam('search', val)}
            placeholder="Search code, name, official title, city..."
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            value={statusParam}
            onChange={(e) => updateQueryParam('status', e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>

          <input
            type="text"
            placeholder="Filter Country..."
            value={countryParam}
            onChange={(e) => updateQueryParam('country', e.target.value)}
            className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 max-w-[150px]"
          />
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading university list..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchUniversities} />
      ) : universities.length === 0 ? (
        <EmptyState title="No universities found" description="Create a new institution or adjust search filters." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Institution</th>
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5">Accreditation</th>
                  <th className="p-3.5">Location</th>
                  <th className="p-3.5">Capacity</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {universities.map((uni) => (
                  <tr key={uni._id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5">
                      <div className="flex flex-col">
                        <Link to={`/admin/universities/${uni._id}`} className="font-bold text-slate-900 hover:text-teal-600 transition">
                          {uni.name}
                        </Link>
                        <span className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[250px]">{uni.officialName || uni.name}</span>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-teal-700 font-bold">{uni.code}</td>
                    <td className="p-3.5">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800">{uni.accreditationNumber || 'N/A'}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{uni.accreditationStatus || 'PENDING'}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-600">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{uni.city ? `${uni.city}, ` : ''}{(uni as any).country || 'Somalia'}</span>
                      </div>
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">{uni.capacity || 100} students</td>
                    <td className="p-3.5">
                      <StatusBadge status={uni.status} />
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/admin/universities/${uni._id}`}
                          className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition"
                          title="View Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {canManage && (
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => {
                                setSelectedUni(uni);
                                setTargetStatus('ACTIVE');
                                setConfirmStatusOpen(true);
                              }}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md transition"
                              title="Activate"
                              disabled={uni.status === 'ACTIVE'}
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUni(uni);
                                setTargetStatus('SUSPENDED');
                                setConfirmStatusOpen(true);
                              }}
                              className="p-1 text-amber-600 hover:bg-amber-50 rounded-md transition"
                              title="Suspend"
                              disabled={uni.status === 'SUSPENDED'}
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUni(uni);
                                setTargetStatus('ARCHIVED');
                                setConfirmStatusOpen(true);
                              }}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded-md transition"
                              title="Archive"
                              disabled={uni.status === 'ARCHIVED'}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="block md:hidden divide-y divide-slate-100 text-xs">
            {universities.map((uni) => (
              <div key={uni._id} className="p-4 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <Link to={`/admin/universities/${uni._id}`} className="font-bold text-slate-900 hover:text-teal-600 block text-sm">
                      {uni.name}
                    </Link>
                    <span className="text-[10px] font-mono text-teal-700 block font-semibold mt-0.5">{uni.code}</span>
                  </div>
                  <StatusBadge status={uni.status} />
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg text-[11px] text-slate-600 border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Capacity</span>
                    <span className="font-semibold text-slate-800">{uni.capacity || 100} students</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Location</span>
                    <span className="font-medium truncate block">{uni.city || 'Mogadishu'}, {(uni as any).country || 'Somalia'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                  <span className="truncate pr-2">{uni.email}</span>
                  <div className="flex items-center space-x-1.5">
                    <Link
                      to={`/admin/universities/${uni._id}`}
                      className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition font-semibold flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Pagination meta={pagination} onPageChange={(p) => updateQueryParam('page', p.toString())} />
        </div>
      )}

      {/* Add University Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Register New University" maxWidth="lg">
        <form onSubmit={handleCreate} className="space-y-6 text-xs max-h-[80vh] overflow-y-auto pr-2">
          {/* Section 1: Basic Info */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3">
            <h3 className="font-bold text-slate-900 text-xs border-b pb-1.5 flex items-center space-x-1.5 text-teal-800">
              <GraduationCap className="w-4 h-4" />
              <span>Institutional Information</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Display Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Somali National University"
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official/Legal Name</label>
                <input
                  type="text"
                  value={formData.officialName}
                  onChange={(e) => setFormData({ ...formData, officialName: e.target.value })}
                  placeholder="Official legal registration name"
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Institution Code (Unique) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SNU"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none uppercase font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Abbreviation</label>
                <input
                  type="text"
                  placeholder="e.g. SNU"
                  value={formData.abbreviation}
                  onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none uppercase"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Enrollment Capacity (Students) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value, 10) || 100 })}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Contact & Location */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3">
            <h3 className="font-bold text-slate-900 text-xs border-b pb-1.5 flex items-center space-x-1.5 text-teal-800">
              <MapPin className="w-4 h-4" />
              <span>Contact & Location</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Telephone</label>
                <input
                  type="text"
                  placeholder="e.g. +252 61 555 0102"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  placeholder="e.g. Mogadishu"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Physical Address</label>
                <input
                  type="text"
                  placeholder="e.g. KM4 Street, Hodan District"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Country</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Accreditation & Registrar */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3">
            <h3 className="font-bold text-slate-900 text-xs border-b pb-1.5 flex items-center space-x-1.5 text-teal-800">
              <Award className="w-4 h-4" />
              <span>Accreditation & Focal Person</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ministry Accreditation ID</label>
                <input
                  type="text"
                  placeholder="MoE-ACC-XXXXXXXX"
                  value={formData.accreditationNumber}
                  onChange={(e) => setFormData({ ...formData, accreditationNumber: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Accreditation Status</label>
                <select
                  value={formData.accreditationStatus}
                  onChange={(e) => setFormData({ ...formData, accreditationStatus: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  <option value="PENDING">PENDING REVIEW</option>
                  <option value="ACCREDITED">FULLY ACCREDITED</option>
                  <option value="EXPIRED">EXPIRED / SUSPENDED</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Focal Person Name</label>
                <input
                  type="text"
                  value={formData.contactPersonName}
                  onChange={(e) => setFormData({ ...formData, contactPersonName: e.target.value })}
                  placeholder="Registrar or Dean Name"
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Focal Person Email</label>
                <input
                  type="email"
                  value={formData.contactPersonEmail}
                  onChange={(e) => setFormData({ ...formData, contactPersonEmail: e.target.value })}
                  placeholder="focal@snu.edu.so"
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Focal Person Direct Line</label>
                <input
                  type="text"
                  value={formData.contactPersonPhone}
                  onChange={(e) => setFormData({ ...formData, contactPersonPhone: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Optional Initial Admin Account */}
          <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-200/60 space-y-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.createInitialAdmin}
                onChange={(e) => setFormData({ ...formData, createInitialAdmin: e.target.checked })}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="font-bold text-slate-900 text-xs">Provision Initial University Admin User Account</span>
            </label>

            {formData.createInitialAdmin && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Admin First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.initialAdminFirstName}
                    onChange={(e) => setFormData({ ...formData, initialAdminFirstName: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Admin Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.initialAdminLastName}
                    onChange={(e) => setFormData({ ...formData, initialAdminLastName: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Admin Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.initialAdminEmail}
                    onChange={(e) => setFormData({ ...formData, initialAdminEmail: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Admin Initial Password *</label>
                  <input
                    type="password"
                    required
                    value={formData.initialAdminPassword}
                    onChange={(e) => setFormData({ ...formData, initialAdminPassword: e.target.value })}
                    placeholder="Must be secure"
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-semibold shadow-xs transition"
            >
              {actionLoading ? 'Saving...' : 'Register Institution'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Status Change */}
      {selectedUni && confirmStatusOpen && (
        <ConfirmDialog
          isOpen={confirmStatusOpen}
          onClose={() => setConfirmStatusOpen(false)}
          onConfirm={handleUpdateStatus}
          title={`Set Status to ${targetStatus}`}
          message={`Are you sure you want to transition ${selectedUni.name} to '${targetStatus}'? This status change will be logged in the system audit logs.`}
          confirmLabel={`Change Status to ${targetStatus}`}
          variant={targetStatus === 'ARCHIVED' || targetStatus === 'SUSPENDED' ? 'danger' : 'info'}
          isLoading={actionLoading}
        />
      )}
    </div>
  );
};
