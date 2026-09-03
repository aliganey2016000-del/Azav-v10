import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, UserPlus, Key, Shield, CheckCircle, XCircle, Eye, RefreshCw, Filter } from 'lucide-react';
import { AdminApiService } from '../../services/admin.service';
import { AdminUser, PaginationMeta } from '../../types/admin.types';
import { UserRole } from '../../types/frontend';
import { PageHeader } from '../../components/admin/PageHeader';
import { SearchInput } from '../../components/admin/SearchInput';
import { Pagination } from '../../components/admin/Pagination';
import { StatusBadge, RoleBadge } from '../../components/admin/Badge';
import { Modal } from '../../components/admin/Modal';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { LoadingState, ErrorState, EmptyState } from '../../components/admin/States';

export const UsersManagementPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals & Action States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [confirmToggleOpen, setConfirmToggleOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: UserRole.STUDENT,
    universityId: '',
    organizationId: '',
  });

  const [resetPasswordValue, setResetPasswordValue] = useState('');

  // Extract Filters from URL Query Params
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const searchParam = searchParams.get('search') || '';
  const roleParam = searchParams.get('role') || '';
  const statusParam = searchParams.get('status') || '';

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await AdminApiService.getUsers({
        page: pageParam,
        limit: 20,
        search: searchParam,
        role: roleParam,
        status: statusParam,
      });
      setUsers(res.users || []);
      setPagination(
        res.pagination || {
          page: pageParam,
          limit: 20,
          total: (res.users || []).length,
          totalPages: Math.ceil((res.users || []).length / 20) || 1,
        }
      );
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      setError(err.message || 'Failed to fetch user directory.');
    } finally {
      setLoading(false);
    }
  }, [pageParam, searchParam, roleParam, statusParam]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle URL Param Updates
  const updateQueryParam = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1'); // Reset to page 1 on filter change
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
  };

  // Create User Handler
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await AdminApiService.createUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password || 'ChangeMe123!',
        roles: [formData.role],
        universityId: formData.universityId || null,
        organizationId: formData.organizationId || null,
      });
      setCreateModalOpen(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        role: UserRole.STUDENT,
        universityId: '',
        organizationId: '',
      });
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to create user.');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle User Status
  const handleToggleStatus = async () => {
    if (!selectedUser) return;
    try {
      setActionLoading(true);
      const newStatus = selectedUser.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await AdminApiService.updateUserStatus(selectedUser._id, newStatus);
      setConfirmToggleOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Reset Password Handler
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !resetPasswordValue) return;
    try {
      setActionLoading(true);
      await AdminApiService.resetUserPassword(selectedUser._id, resetPasswordValue);
      alert(`Password for ${selectedUser.email} has been updated.`);
      setResetModalOpen(false);
      setResetPasswordValue('');
      setSelectedUser(null);
    } catch (err: any) {
      alert(err.message || 'Failed to reset password.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Comprehensive directory of medical trainees, supervisors, administrators, and staff."
        action={
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition shadow-xs flex items-center space-x-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create User</span>
          </button>
        }
      />

      {/* Filter Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <SearchInput
          value={searchParam}
          onChange={(val) => updateQueryParam('search', val)}
          placeholder="Search by name, email, or phone..."
        />

        <div className="flex flex-wrap items-center gap-3">
          {/* Role Filter */}
          <select
            value={roleParam}
            onChange={(e) => updateQueryParam('role', e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Roles</option>
            {Object.values(UserRole).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusParam}
            onChange={(e) => updateQueryParam('status', e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="PENDING">PENDING</option>
          </select>

          {(searchParam || roleParam || statusParam) && (
            <button
              onClick={() => setSearchParams({})}
              className="text-xs text-rose-600 font-medium hover:underline"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Table View */}
      {loading ? (
        <LoadingState message="Loading users..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchUsers} />
      ) : users.length === 0 ? (
        <EmptyState title="No users found" description="Try adjusting your search criteria or create a new user account." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Association</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Created</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">
                        {u.firstName} {u.lastName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-normal">{u.email}</div>
                    </td>
                    <td className="p-3.5">
                      <RoleBadge role={u.roles?.[0] || 'STUDENT'} />
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {u.universityId?.name ? (
                        <span className="text-teal-700 font-semibold">{u.universityId.name}</span>
                      ) : u.organizationId?.name ? (
                        <span className="text-amber-700 font-semibold">{u.organizationId.name}</span>
                      ) : (
                        <span className="text-slate-400 italic">Independent / Global</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="p-3.5 text-slate-500 text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setViewModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setResetModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Reset Password"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setConfirmToggleOpen(true);
                          }}
                          className={`p-1.5 rounded-lg transition ${
                            u.status === 'ACTIVE'
                              ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        >
                          {u.status === 'ACTIVE' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="block md:hidden divide-y divide-slate-100">
            {users.map((u) => (
              <div key={u._id} className="p-4 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {u.firstName} {u.lastName}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-mono">{u.email}</p>
                  </div>
                  <StatusBadge status={u.status} />
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs border-t border-slate-150/50 pt-2.5">
                  <div>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase block">Role</span>
                    <RoleBadge role={u.roles?.[0] || 'STUDENT'} />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase block">Association</span>
                    <span className="font-semibold text-slate-700 block truncate max-w-[120px]">
                      {u.universityId?.name ? (
                        <span className="text-teal-700 font-bold">{u.universityId.name}</span>
                      ) : u.organizationId?.name ? (
                        <span className="text-amber-700 font-bold">{u.organizationId.name}</span>
                      ) : (
                        <span className="text-slate-400 italic font-medium">Independent</span>
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-150/30 text-[10px] text-slate-400">
                  <span>Joined: {new Date(u.createdAt).toLocaleDateString()}</span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => {
                        setSelectedUser(u);
                        setViewModalOpen(true);
                      }}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedUser(u);
                        setResetModalOpen(true);
                      }}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    >
                      <Key className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedUser(u);
                        setConfirmToggleOpen(true);
                      }}
                      className={`p-1.5 rounded-lg transition ${
                        u.status === 'ACTIVE'
                          ? 'text-rose-600 hover:bg-rose-50'
                          : 'text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      {u.status === 'ACTIVE' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Pagination meta={pagination} onPageChange={handlePageChange} />
        </div>
      )}

      {/* Create User Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create New Account" maxWidth="md">
        <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
            >
              {Object.values(UserRole).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Initial Password</label>
            <input
              type="password"
              placeholder="Default: ChangeMe123!"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium"
            >
              {actionLoading ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View User Detail Modal */}
      {selectedUser && viewModalOpen && (
        <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} title="User Details" maxWidth="md">
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Name:</span>
                <span className="font-bold text-slate-900">
                  {selectedUser.firstName} {selectedUser.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-mono text-slate-900">{selectedUser.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span className="text-slate-900">{selectedUser.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Role:</span>
                <RoleBadge role={selectedUser.roles?.[0] || 'STUDENT'} />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <StatusBadge status={selectedUser.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Created At:</span>
                <span className="text-slate-700">{new Date(selectedUser.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Reset Password Modal */}
      {selectedUser && resetModalOpen && (
        <Modal isOpen={resetModalOpen} onClose={() => setResetModalOpen(false)} title="Reset Password" maxWidth="sm">
          <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
            <p className="text-slate-600">
              Set new password for <strong className="text-slate-900">{selectedUser.email}</strong>.
            </p>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">New Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={resetPasswordValue}
                onChange={(e) => setResetPasswordValue(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-3">
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-medium"
              >
                {actionLoading ? 'Updating...' : 'Set Password'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Status Toggle Confirmation */}
      {selectedUser && confirmToggleOpen && (
        <ConfirmDialog
          isOpen={confirmToggleOpen}
          onClose={() => setConfirmToggleOpen(false)}
          onConfirm={handleToggleStatus}
          title={selectedUser.status === 'ACTIVE' ? 'Deactivate User Account' : 'Activate User Account'}
          message={`Are you sure you want to change the status of ${selectedUser.firstName} ${selectedUser.lastName} to ${
            selectedUser.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
          }?`}
          confirmLabel={selectedUser.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          variant={selectedUser.status === 'ACTIVE' ? 'danger' : 'info'}
          isLoading={actionLoading}
        />
      )}
    </div>
  );
};
