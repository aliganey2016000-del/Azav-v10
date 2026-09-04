import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Building2, Eye, CheckCircle, XCircle, ShieldAlert, Award, MapPin } from 'lucide-react';
import { AdminApiService } from '../../services/admin.service';
import { AdminOrganization, PaginationMeta } from '../../types/admin.types';
import { PageHeader } from '../../components/admin/PageHeader';
import { SearchInput } from '../../components/admin/SearchInput';
import { Pagination } from '../../components/admin/Pagination';
import { StatusBadge } from '../../components/admin/Badge';
import { Modal } from '../../components/admin/Modal';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { LoadingState, ErrorState, EmptyState } from '../../components/admin/States';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/frontend';

export const OrganizationsPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [organizations, setOrganizations] = useState<AdminOrganization[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<AdminOrganization | null>(null);
  const [confirmStatusOpen, setConfirmStatusOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ARCHIVED'>('ACTIVE');
  const [actionLoading, setActionLoading] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    legalName: '',
    type: 'HOSPITAL',
    registrationNumber: '',
    country: 'Somalia',
    city: '',
    state: '',
    address: '',
    postalCode: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    accreditationNumber: '',
    accreditationStatus: 'PENDING',
    contactPersonName: '',
    contactPersonEmail: '',
    contactPersonPhone: '',
    capacity: 20,
    description: '',
    notes: '',
    // Initial Admin Account Option
    createInitialAdmin: false,
    initialAdminEmail: '',
    initialAdminPassword: '',
    initialAdminFirstName: '',
    initialAdminLastName: '',
  });

  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const searchParam = searchParams.get('search') || '';
  const typeParam = searchParams.get('type') || '';
  const statusParam = searchParams.get('status') || '';
  const countryParam = searchParams.get('country') || '';

  const fetchOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await AdminApiService.getOrganizations({
        page: pageParam,
        limit: 20,
        search: searchParam,
        type: typeParam,
        status: statusParam,
      });

      // Filter by country client-side if requested
      let filtered = res.organizations || [];
      if (countryParam && res.organizations) {
        filtered = res.organizations.filter((org: any) =>
          org.country?.toLowerCase().includes(countryParam.toLowerCase())
        );
      }

      setOrganizations(filtered);
      setPagination(
        res.pagination || {
          page: pageParam,
          limit: 20,
          total: (filtered || []).length,
          totalPages: Math.ceil((filtered || []).length / 20) || 1,
        }
      );
    } catch (err: any) {
      setError(err.message || 'Failed to load healthcare facilities.');
    } finally {
      setLoading(false);
    }
  }, [pageParam, searchParam, typeParam, statusParam, countryParam]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

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
        legalName: formData.legalName || formData.name,
        type: formData.type,
        registrationNumber: formData.registrationNumber,
        country: formData.country,
        city: formData.city,
        state: formData.state,
        address: formData.address,
        postalCode: formData.postalCode,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        website: formData.website,
        accreditationNumber: formData.accreditationNumber,
        accreditationStatus: formData.accreditationStatus,
        contactPersonName: formData.contactPersonName,
        contactPersonEmail: formData.contactPersonEmail,
        contactPersonPhone: formData.contactPersonPhone,
        capacity: formData.capacity,
        description: formData.description,
        notes: formData.notes,
      };

      if (formData.createInitialAdmin) {
        payload.initialAdminEmail = formData.initialAdminEmail;
        payload.initialAdminPassword = formData.initialAdminPassword;
        payload.initialAdminFirstName = formData.initialAdminFirstName;
        payload.initialAdminLastName = formData.initialAdminLastName;
      }

      await AdminApiService.createOrganization(payload);
      setCreateModalOpen(false);
      // Reset form
      setFormData({
        name: '',
        legalName: '',
        type: 'HOSPITAL',
        registrationNumber: '',
        country: 'Somalia',
        city: '',
        state: '',
        address: '',
        postalCode: '',
        contactEmail: '',
        contactPhone: '',
        website: '',
        accreditationNumber: '',
        accreditationStatus: 'PENDING',
        contactPersonName: '',
        contactPersonEmail: '',
        contactPersonPhone: '',
        capacity: 20,
        description: '',
        notes: '',
        createInitialAdmin: false,
        initialAdminEmail: '',
        initialAdminPassword: '',
        initialAdminFirstName: '',
        initialAdminLastName: '',
      });
      fetchOrganizations();
    } catch (err: any) {
      alert(err.message || 'Failed to create healthcare facility.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrg) return;
    try {
      setActionLoading(true);
      await AdminApiService.updateOrganizationStatus(selectedOrg._id, targetStatus);
      setConfirmStatusOpen(false);
      setSelectedOrg(null);
      fetchOrganizations();
    } catch (err: any) {
      alert(err.message || 'Failed to update facility status.');
    } finally {
      setActionLoading(false);
    }
  };

  const canManage = user?.roles?.some(r => r === UserRole.SUPER_ADMIN || r === UserRole.AZAAM_STAFF);

  // Compute stats
  const activeCount = (organizations || []).filter(o => o?.status === 'ACTIVE').length;
  const suspendedCount = (organizations || []).filter(o => o?.status === 'SUSPENDED').length;
  const archivedCount = (organizations || []).filter(o => o?.status === 'ARCHIVED').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Healthcare Facility Management"
        description="Teaching hospitals, medical centers, clinics, and clinical placement capacity."
        action={
          canManage && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition shadow-xs flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Register Facility</span>
            </button>
          )
        }
      />

      {/* Stats Cards Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Registers</div>
          <div className="text-2xl font-bold text-slate-900">{pagination?.total ?? (organizations || []).length}</div>
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

      {/* Filter Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <SearchInput
            value={searchParam}
            onChange={(val) => updateQueryParam('search', val)}
            placeholder="Search facility name, legal, email, registration..."
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={typeParam}
            onChange={(e) => updateQueryParam('type', e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Types</option>
            <option value="HOSPITAL">HOSPITAL</option>
            <option value="CLINIC">CLINIC</option>
            <option value="MEDICAL_CENTER">MEDICAL_CENTER</option>
            <option value="HEALTH_CENTER">HEALTH_CENTER</option>
            <option value="TEACHING_HOSPITAL">TEACHING_HOSPITAL</option>
            <option value="SPECIALIZED_CENTER">SPECIALIZED_CENTER</option>
          </select>

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
        <LoadingState message="Loading facilities..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchOrganizations} />
      ) : organizations.length === 0 ? (
        <EmptyState title="No facilities found" description="Create a new facility or adjust search filters." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Facility Name</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Accreditation</th>
                  <th className="p-3.5">Capacity & Utilization</th>
                  <th className="p-3.5">Location</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {organizations.map((org) => {
                  const utilization = org.utilizationPercentage || 0;
                  return (
                    <tr key={org._id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3.5">
                        <div className="flex flex-col">
                          <Link to={`/admin/organizations/${org._id}`} className="font-bold text-slate-900 hover:text-teal-600 transition">
                            {org.name}
                          </Link>
                          <span className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[250px]">{org.legalName || org.name}</span>
                        </div>
                      </td>
                      <td className="p-3.5 uppercase font-semibold text-[10px] text-slate-500">{org.type?.replace('_', ' ')}</td>
                      <td className="p-3.5">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800">{org.accreditationNumber || 'N/A'}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{org.accreditationStatus || 'PENDING'}</span>
                        </div>
                      </td>
                      <td className="p-3.5 min-w-[180px]">
                        <div className="flex items-center justify-between text-[11px] mb-1 font-semibold text-slate-800">
                          <span>{org.occupiedSlots || 0} / {org.capacity} occupied</span>
                          <span>{utilization}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              utilization >= 90 ? 'bg-rose-500' : utilization >= 70 ? 'bg-amber-500' : 'bg-teal-600'
                            }`}
                            style={{ width: `${Math.min(100, utilization)}%` }}
                          />
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{org.city ? `${org.city}, ` : ''}{org.country || 'Somalia'}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <StatusBadge status={org.status} />
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            to={`/admin/organizations/${org._id}`}
                            className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition"
                            title="View Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          {canManage && (
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => {
                                  setSelectedOrg(org);
                                  setTargetStatus('ACTIVE');
                                  setConfirmStatusOpen(true);
                                }}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md transition"
                                title="Activate"
                                disabled={org.status === 'ACTIVE'}
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedOrg(org);
                                  setTargetStatus('SUSPENDED');
                                  setConfirmStatusOpen(true);
                                }}
                                className="p-1 text-amber-600 hover:bg-amber-50 rounded-md transition"
                                title="Suspend"
                                disabled={org.status === 'SUSPENDED'}
                              >
                                <ShieldAlert className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedOrg(org);
                                  setTargetStatus('ARCHIVED');
                                  setConfirmStatusOpen(true);
                                }}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded-md transition"
                                title="Archive"
                                disabled={org.status === 'ARCHIVED'}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="block md:hidden divide-y divide-slate-100 text-xs">
            {organizations.map((org) => {
              const utilization = org.utilizationPercentage || 0;
              return (
                <div key={org._id} className="p-4 space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <Link to={`/admin/organizations/${org._id}`} className="font-bold text-slate-900 hover:text-teal-600 block text-sm">
                        {org.name}
                      </Link>
                      <span className="text-[10px] font-mono text-slate-400 block uppercase font-bold mt-0.5">{org.type?.replace('_', ' ')}</span>
                    </div>
                    <StatusBadge status={org.status} />
                  </div>

                  <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200/50">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                      <span>Quota: {org.occupiedSlots || 0} / {org.capacity} active</span>
                      <span className="text-teal-700">{utilization}% Capacity</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          utilization >= 90 ? 'bg-rose-500' : utilization >= 70 ? 'bg-amber-500' : 'bg-teal-600'
                        }`}
                        style={{ width: `${Math.min(100, utilization)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-150/30 text-[11px] text-slate-500">
                    <span className="truncate pr-2">{org.contactEmail}</span>
                    <div className="flex items-center space-x-1.5">
                      <Link
                        to={`/admin/organizations/${org._id}`}
                        className="p-1.5 text-slate-500 hover:text-teal-850 hover:bg-slate-100 rounded-lg transition"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      {canManage && (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => {
                              setSelectedOrg(org);
                              setTargetStatus('ACTIVE');
                              setConfirmStatusOpen(true);
                            }}
                            className="p-1 text-emerald-600 rounded"
                            title="Activate"
                            disabled={org.status === 'ACTIVE'}
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedOrg(org);
                              setTargetStatus('SUSPENDED');
                              setConfirmStatusOpen(true);
                            }}
                            className="p-1 text-amber-600 rounded"
                            title="Suspend"
                            disabled={org.status === 'SUSPENDED'}
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedOrg(org);
                              setTargetStatus('ARCHIVED');
                              setConfirmStatusOpen(true);
                            }}
                            className="p-1 text-rose-600 rounded"
                            title="Archive"
                            disabled={org.status === 'ARCHIVED'}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination meta={pagination} onPageChange={(p) => updateQueryParam('page', p.toString())} />
        </div>
      )}

      {/* Add Facility Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Register New Healthcare Facility" maxWidth="lg">
        <form onSubmit={handleCreate} className="space-y-6 text-xs max-h-[80vh] overflow-y-auto pr-2">
          {/* Section 1: Basic Info */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3">
            <h3 className="font-bold text-slate-900 text-xs border-b pb-1.5 flex items-center space-x-1.5 text-teal-800">
              <Building2 className="w-4 h-4" />
              <span>Facility Information</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Display/Public Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Medina Hospital"
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Legal Name</label>
                <input
                  type="text"
                  value={formData.legalName}
                  onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                  placeholder="Official legal business title"
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Facility Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-semibold text-slate-700"
                >
                  <option value="HOSPITAL">HOSPITAL</option>
                  <option value="CLINIC">CLINIC</option>
                  <option value="MEDICAL_CENTER">MEDICAL CENTER</option>
                  <option value="HEALTH_CENTER">HEALTH CENTER</option>
                  <option value="TEACHING_HOSPITAL">TEACHING HOSPITAL</option>
                  <option value="SPECIALIZED_CENTER">SPECIALIZED CENTER</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Registration/License ID *</label>
                <input
                  type="text"
                  required
                  placeholder="MOH-HL-XXXXXXXX"
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Placement Quota (Slots) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value, 10) || 20 })}
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Focal Email *</label>
                <input
                  type="email"
                  required
                  value={formData.contactEmail}
                  placeholder="e.g. clinic@medina.so"
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Telephone</label>
                <input
                  type="text"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Website URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Physical Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
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

          {/* Section 3: Accreditation & Focal Person */}
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
                  placeholder="MoH-ACC-XXXXXXXX"
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
                  placeholder="Medical Director or Supervisor Name"
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Focal Person Email</label>
                <input
                  type="email"
                  value={formData.contactPersonEmail}
                  onChange={(e) => setFormData({ ...formData, contactPersonEmail: e.target.value })}
                  placeholder="director@medina.so"
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
              <span className="font-bold text-slate-900 text-xs">Provision Initial Organization Admin User Account</span>
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
              {actionLoading ? 'Saving...' : 'Register Facility'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Status Change */}
      {selectedOrg && confirmStatusOpen && (
        <ConfirmDialog
          isOpen={confirmStatusOpen}
          onClose={() => setConfirmStatusOpen(false)}
          onConfirm={handleUpdateStatus}
          title={`Set Status to ${targetStatus}`}
          message={`Are you sure you want to transition ${selectedOrg.name} to '${targetStatus}'? This status change will be logged in the system audit logs.`}
          confirmLabel={`Change Status to ${targetStatus}`}
          variant={targetStatus === 'ARCHIVED' || targetStatus === 'SUSPENDED' ? 'danger' : 'info'}
          isLoading={actionLoading}
        />
      )}
    </div>
  );
};
