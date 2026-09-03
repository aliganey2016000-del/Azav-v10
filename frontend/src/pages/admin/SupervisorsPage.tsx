import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { UserCheck, Eye, ShieldCheck, CheckCircle, XCircle } from 'lucide-react';
import { AdminApiService } from '../../services/admin.service';
import { AdminSupervisor, PaginationMeta } from '../../types/admin.types';
import { PageHeader } from '../../components/admin/PageHeader';
import { SearchInput } from '../../components/admin/SearchInput';
import { Pagination } from '../../components/admin/Pagination';
import { StatusBadge } from '../../components/admin/Badge';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { LoadingState, ErrorState, EmptyState } from '../../components/admin/States';

export const SupervisorsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [supervisors, setSupervisors] = useState<AdminSupervisor[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSupervisor, setSelectedSupervisor] = useState<AdminSupervisor | null>(null);
  const [confirmToggleOpen, setConfirmToggleOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const searchParam = searchParams.get('search') || '';
  const statusParam = searchParams.get('status') || '';

  const fetchSupervisors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await AdminApiService.getSupervisors({
        page: pageParam,
        limit: 20,
        search: searchParam,
        status: statusParam,
      });
      setSupervisors(res.supervisors || []);
      setPagination(
        res.pagination || {
          page: pageParam,
          limit: 20,
          total: (res.supervisors || []).length,
          totalPages: Math.ceil((res.supervisors || []).length / 20) || 1,
        }
      );
    } catch (err: any) {
      setError(err.message || 'Failed to load supervisors directory.');
    } finally {
      setLoading(false);
    }
  }, [pageParam, searchParam, statusParam]);

  useEffect(() => {
    fetchSupervisors();
  }, [fetchSupervisors]);

  const updateQueryParam = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleToggleStatus = async () => {
    if (!selectedSupervisor) return;
    try {
      setActionLoading(true);
      const newStatus = selectedSupervisor.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await AdminApiService.updateSupervisorStatus(selectedSupervisor._id, newStatus);
      setConfirmToggleOpen(false);
      setSelectedSupervisor(null);
      fetchSupervisors();
    } catch (err: any) {
      alert(err.message || 'Failed to update supervisor status.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clinical Supervisors Directory"
        description="Verified medical mentors, clinical preceptors, and department heads overseeing student placements."
      />

      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <SearchInput
          value={searchParam}
          onChange={(val) => updateQueryParam('search', val)}
          placeholder="Search supervisor name, email, or license..."
        />

        <select
          value={statusParam}
          onChange={(e) => updateQueryParam('status', e.target.value)}
          className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
      </div>

      {loading ? (
        <LoadingState message="Loading supervisors..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchSupervisors} />
      ) : supervisors.length === 0 ? (
        <EmptyState title="No supervisors found" description="Adjust your search criteria." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Supervisor</th>
                  <th className="p-3.5">Facility</th>
                  <th className="p-3.5">Qualification & License</th>
                  <th className="p-3.5">Verification</th>
                  <th className="p-3.5">Assigned Trainees</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {supervisors.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5">
                      <Link to={`/admin/supervisors/${s._id}`} className="font-bold text-slate-900 hover:text-teal-600 transition">
                        {s.userId?.firstName} {s.userId?.lastName}
                      </Link>
                      <div className="text-[11px] text-slate-500 font-normal">{s.userId?.email}</div>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-800">{s.organizationId?.name || 'Unassigned'}</td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-900">{s.qualification || 'Clinical Preceptor'}</div>
                      <div className="text-[11px] font-mono text-slate-500">Lic: {s.licenseNumber || 'N/A'}</div>
                    </td>
                    <td className="p-3.5">
                      {s.verified ? (
                        <span className="inline-flex items-center space-x-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">
                          <ShieldCheck className="w-3 h-3" />
                          <span>VERIFIED</span>
                        </span>
                      ) : (
                        <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full text-[10px]">
                          UNVERIFIED
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">{s.assignedTraineesCount || 0}</td>
                    <td className="p-3.5">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/admin/supervisors/${s._id}`}
                          className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition"
                          title="View Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => {
                            setSelectedSupervisor(s);
                            setConfirmToggleOpen(true);
                          }}
                          className={`p-1.5 rounded-lg transition ${
                            s.status === 'ACTIVE'
                              ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={s.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        >
                          {s.status === 'ACTIVE' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination meta={pagination} onPageChange={(p) => updateQueryParam('page', p.toString())} />
        </div>
      )}

      {/* Confirm Status Toggle */}
      {selectedSupervisor && confirmToggleOpen && (
        <ConfirmDialog
          isOpen={confirmToggleOpen}
          onClose={() => setConfirmToggleOpen(false)}
          onConfirm={handleToggleStatus}
          title={selectedSupervisor.status === 'ACTIVE' ? 'Deactivate Supervisor' : 'Activate Supervisor'}
          message={`Are you sure you want to change status of ${selectedSupervisor.userId?.firstName} ${selectedSupervisor.userId?.lastName} to ${
            selectedSupervisor.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
          }?`}
          confirmLabel={selectedSupervisor.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          variant={selectedSupervisor.status === 'ACTIVE' ? 'danger' : 'info'}
          isLoading={actionLoading}
        />
      )}
    </div>
  );
};
