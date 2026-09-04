import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  UserPlus,
  Key,
  Shield,
  CheckCircle,
  XCircle,
  Eye,
  Edit2,
  RefreshCw,
  Users,
  GraduationCap,
  Building2,
  Stethoscope,
  Mail,
  Phone,
  Calendar,
  Lock,
  Search,
  Check,
  AlertCircle,
  X,
} from 'lucide-react';
import { AdminApiService } from '../../services/admin.service';
import { AdminUser, AdminUniversity, AdminOrganization, PaginationMeta } from '../../types/admin.types';
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

  // Available Institutions for Selectors & Filters
  const [universities, setUniversities] = useState<AdminUniversity[]>([]);
  const [organizations, setOrganizations] = useState<AdminOrganization[]>([]);

  // Modals & Action States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [confirmToggleOpen, setConfirmToggleOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // In-app Notification / Toast
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Form State for Create
  const [createFormData, setCreateFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: UserRole.STUDENT,
    universityId: '',
    organizationId: '',
    licenseNumber: '',
    qualification: '',
  });

  // Form State for Edit
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    role: UserRole.STUDENT,
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'PENDING',
    universityId: '',
    organizationId: '',
  });

  const [resetPasswordValue, setResetPasswordValue] = useState('');

  // Extract Filters from URL Query Params
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const searchParam = searchParams.get('search') || '';
  const roleParam = searchParams.get('role') || '';
  const statusParam = searchParams.get('status') || '';
  const institutionParam = searchParams.get('institution') || '';

  // Load institutions once
  useEffect(() => {
    const loadInstitutions = async () => {
      try {
        const [uniRes, orgRes] = await Promise.all([
          AdminApiService.getUniversities({ page: 1, limit: 100 }),
          AdminApiService.getOrganizations({ page: 1, limit: 100 }),
        ]);
        setUniversities(uniRes.universities || []);
        setOrganizations(orgRes.organizations || []);
      } catch (err) {
        console.error('Failed to load institutions list', err);
      }
    };
    loadInstitutions();
  }, []);

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
        universityId: institutionParam.startsWith('uni_') ? institutionParam.replace('uni_', '') : undefined,
        organizationId: institutionParam.startsWith('org_') ? institutionParam.replace('org_', '') : undefined,
      });

      let fetchedUsers = res.users || [];
      // Client-side fallback filter if institution param passed
      if (institutionParam) {
        if (institutionParam.startsWith('uni_')) {
          const targetUniId = institutionParam.replace('uni_', '');
          fetchedUsers = fetchedUsers.filter((u) => u.universityId?._id === targetUniId);
        } else if (institutionParam.startsWith('org_')) {
          const targetOrgId = institutionParam.replace('org_', '');
          fetchedUsers = fetchedUsers.filter((u) => u.organizationId?._id === targetOrgId);
        }
      }

      setUsers(fetchedUsers);
      setPagination(
        res.pagination || {
          page: pageParam,
          limit: 20,
          total: fetchedUsers.length,
          totalPages: Math.ceil(fetchedUsers.length / 20) || 1,
        }
      );
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      setError(err.message || 'Failed to fetch user directory.');
    } finally {
      setLoading(false);
    }
  }, [pageParam, searchParam, roleParam, statusParam, institutionParam]);

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
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
  };

  // Metrics summary
  const metrics = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.status === 'ACTIVE').length;
    const students = users.filter((u) => u.roles?.includes(UserRole.STUDENT) || u.roles?.includes('STUDENT')).length;
    const supervisors = users.filter((u) => u.roles?.includes(UserRole.CLINICAL_SUPERVISOR) || u.roles?.includes('CLINICAL_SUPERVISOR')).length;
    const admins = users.filter((u) =>
      u.roles?.some((r) => [UserRole.SUPER_ADMIN, UserRole.UNIVERSITY_ADMIN, UserRole.ORGANIZATION_ADMIN].includes(r as any))
    ).length;
    return { total, active, students, supervisors, admins };
  }, [users]);

  // Check role affiliation requirements
  const isUniversityRole = (role: string) => {
    return [UserRole.UNIVERSITY_ADMIN, UserRole.UNIVERSITY_STAFF, UserRole.STUDENT].includes(role as any);
  };

  const isOrganizationRole = (role: string) => {
    return [UserRole.ORGANIZATION_ADMIN, UserRole.ORGANIZATION_STAFF, UserRole.CLINICAL_SUPERVISOR].includes(role as any);
  };

  // Create User Handler
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await AdminApiService.createUser({
        firstName: createFormData.firstName.trim(),
        lastName: createFormData.lastName.trim(),
        email: createFormData.email.trim().toLowerCase(),
        phone: createFormData.phone.trim(),
        password: createFormData.password || 'ChangeMe123!',
        roles: [createFormData.role],
        universityId: isUniversityRole(createFormData.role) ? createFormData.universityId || null : null,
        organizationId: isOrganizationRole(createFormData.role) ? createFormData.organizationId || null : null,
        licenseNumber: createFormData.licenseNumber || undefined,
        qualification: createFormData.qualification || undefined,
      });

      setCreateModalOpen(false);
      setCreateFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        role: UserRole.STUDENT,
        universityId: '',
        organizationId: '',
        licenseNumber: '',
        qualification: '',
      });
      showToast('success', 'User account created successfully.');
      fetchUsers();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to create user.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (user: AdminUser) => {
    setSelectedUser(user);
    setEditFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
      role: (user.roles?.[0] as UserRole) || UserRole.STUDENT,
      status: user.status,
      universityId: user.universityId?._id || '',
      organizationId: user.organizationId?._id || '',
    });
    setEditModalOpen(true);
  };

  // Update User Handler
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      setActionLoading(true);
      await AdminApiService.updateUser(selectedUser._id, {
        firstName: editFormData.firstName.trim(),
        lastName: editFormData.lastName.trim(),
        phone: editFormData.phone.trim(),
        roles: [editFormData.role],
        status: editFormData.status,
        universityId: isUniversityRole(editFormData.role) ? editFormData.universityId || null : null,
        organizationId: isOrganizationRole(editFormData.role) ? editFormData.organizationId || null : null,
      });

      setEditModalOpen(false);
      setSelectedUser(null);
      showToast('success', 'User details updated successfully.');
      fetchUsers();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update user.');
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
      showToast('success', `Account marked as ${newStatus}.`);
      fetchUsers();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update user status.');
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
      showToast('success', `Password for ${selectedUser.email} has been updated.`);
      setResetModalOpen(false);
      setResetPasswordValue('');
      setSelectedUser(null);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to reset password.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center space-x-2 px-4 py-3 rounded-xl shadow-lg border transition-all text-xs font-medium ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-2 text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="User Management"
        description="Global directory of medical trainees, supervisors, institution directors, and platform staff across all registered universities and hospitals."
        action={
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        }
      />

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Total Users</div>
            <div className="text-base font-bold text-slate-900">{metrics.total}</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Active</div>
            <div className="text-base font-bold text-slate-900">{metrics.active}</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Students</div>
            <div className="text-base font-bold text-slate-900">{metrics.students}</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Supervisors</div>
            <div className="text-base font-bold text-slate-900">{metrics.supervisors}</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs col-span-2 sm:col-span-1 flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Administrators</div>
            <div className="text-base font-bold text-slate-900">{metrics.admins}</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="w-full md:w-72">
          <SearchInput
            value={searchParam}
            onChange={(val) => updateQueryParam('search', val)}
            placeholder="Search by name, email, or phone..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Role Filter */}
          <select
            value={roleParam}
            onChange={(e) => updateQueryParam('role', e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700"
          >
            <option value="">All Roles</option>
            {Object.values(UserRole).map((r) => (
              <option key={r} value={r}>
                {r.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusParam}
            onChange={(e) => updateQueryParam('status', e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="PENDING">Pending</option>
          </select>

          {/* Institution Filter */}
          <select
            value={institutionParam}
            onChange={(e) => updateQueryParam('institution', e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700 max-w-[200px] truncate"
          >
            <option value="">All Institutions</option>
            <optgroup label="Universities">
              {universities.map((uni) => (
                <option key={uni._id} value={`uni_${uni._id}`}>
                  {uni.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Hospitals & Centers">
              {organizations.map((org) => (
                <option key={org._id} value={`org_${org._id}`}>
                  {org.name}
                </option>
              ))}
            </optgroup>
          </select>

          {(searchParam || roleParam || statusParam || institutionParam) && (
            <button
              onClick={() => setSearchParams({})}
              className="px-2.5 py-1.5 text-xs text-rose-600 font-semibold hover:bg-rose-50 rounded-lg transition"
            >
              Clear Filters
            </button>
          )}

          <button
            onClick={fetchUsers}
            title="Refresh"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Table View */}
      {loading ? (
        <LoadingState message="Loading user directory..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchUsers} />
      ) : users.length === 0 ? (
        <EmptyState
          title="No users found"
          description="Try adjusting your search filters or add a new user."
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Affiliation</th>
                  <th className="p-3.5">Phone</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Created</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-teal-800 font-bold flex items-center justify-center text-xs flex-shrink-0 border border-slate-200">
                          {u.firstName?.[0] || 'U'}
                          {u.lastName?.[0] || ''}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">
                            {u.firstName} {u.lastName}
                          </div>
                          <div className="text-[11px] text-slate-500 font-normal">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <RoleBadge role={u.roles?.[0] || 'STUDENT'} />
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {u.universityId?.name ? (
                        <div className="flex items-center space-x-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                          <span className="text-teal-900 font-medium truncate max-w-[200px]" title={u.universityId.name}>
                            {u.universityId.name}
                          </span>
                        </div>
                      ) : u.organizationId?.name ? (
                        <div className="flex items-center space-x-1.5">
                          <Building2 className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                          <span className="text-amber-900 font-medium truncate max-w-[200px]" title={u.organizationId.name}>
                            {u.organizationId.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic font-normal">Independent / Global</span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-600 font-mono text-[11px]">
                      {u.phone || <span className="text-slate-300">-</span>}
                    </td>
                    <td className="p-3.5">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="p-3.5 text-slate-500 text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setViewModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition cursor-pointer"
                          title="Edit User"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setResetModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                          title="Reset Password"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setConfirmToggleOpen(true);
                          }}
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            u.status === 'ACTIVE'
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={u.status === 'ACTIVE' ? 'Deactivate User' : 'Activate User'}
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
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-teal-800 font-bold flex items-center justify-center text-xs border border-slate-200">
                      {u.firstName?.[0] || 'U'}
                      {u.lastName?.[0] || ''}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {u.firstName} {u.lastName}
                      </h4>
                      <p className="text-[10px] text-slate-500">{u.email}</p>
                    </div>
                  </div>
                  <StatusBadge status={u.status} />
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs border-t border-slate-100 pt-2.5">
                  <div>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase block">Role</span>
                    <RoleBadge role={u.roles?.[0] || 'STUDENT'} />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-semibold uppercase block">Affiliation</span>
                    <span className="font-medium text-slate-700 block truncate max-w-[140px]">
                      {u.universityId?.name ? (
                        <span className="text-teal-700 font-semibold">{u.universityId.name}</span>
                      ) : u.organizationId?.name ? (
                        <span className="text-amber-700 font-semibold">{u.organizationId.name}</span>
                      ) : (
                        <span className="text-slate-400 italic">Independent</span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-400">
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
                      onClick={() => openEditModal(u)}
                      className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition"
                    >
                      <Edit2 className="w-4 h-4" />
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
                        u.status === 'ACTIVE' ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'
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
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create User Account"
        maxWidth="md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={createFormData.firstName}
                onChange={(e) => setCreateFormData({ ...createFormData, firstName: e.target.value })}
                placeholder="e.g. Ahmed"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={createFormData.lastName}
                onChange={(e) => setCreateFormData({ ...createFormData, lastName: e.target.value })}
                placeholder="e.g. Jama"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={createFormData.email}
                onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                placeholder="ahmed.jama@example.com"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={createFormData.phone}
                onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
                placeholder="+252 61 555 0199"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Role *</label>
            <select
              value={createFormData.role}
              onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value as UserRole })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-medium"
            >
              {Object.values(UserRole).map((r) => (
                <option key={r} value={r}>
                  {r.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic University Association */}
          {isUniversityRole(createFormData.role) && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Associated University *</label>
              <select
                required
                value={createFormData.universityId}
                onChange={(e) => setCreateFormData({ ...createFormData, universityId: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              >
                <option value="">Select University...</option>
                {universities.map((uni) => (
                  <option key={uni._id} value={uni._id}>
                    {uni.name} ({uni.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Dynamic Organization / Hospital Association */}
          {isOrganizationRole(createFormData.role) && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Associated Hospital / Center *</label>
              <select
                required
                value={createFormData.organizationId}
                onChange={(e) => setCreateFormData({ ...createFormData, organizationId: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
              >
                <option value="">Select Hospital / Center...</option>
                {organizations.map((org) => (
                  <option key={org._id} value={org._id}>
                    {org.name} ({org.type})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Supervisor-Specific Details */}
          {createFormData.role === UserRole.CLINICAL_SUPERVISOR && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50/60 rounded-lg border border-amber-200/60">
              <div>
                <label className="block font-semibold text-amber-900 mb-1">License Number</label>
                <input
                  type="text"
                  placeholder="SOM-MED-8492"
                  value={createFormData.licenseNumber}
                  onChange={(e) => setCreateFormData({ ...createFormData, licenseNumber: e.target.value })}
                  className="w-full p-2 bg-white border border-amber-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-amber-900 mb-1">Specialty / Degree</label>
                <input
                  type="text"
                  placeholder="M.D., Pediatric Surgery"
                  value={createFormData.qualification}
                  onChange={(e) => setCreateFormData({ ...createFormData, qualification: e.target.value })}
                  className="w-full p-2 bg-white border border-amber-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Initial Password</label>
            <input
              type="password"
              placeholder="Default: ChangeMe123!"
              value={createFormData.password}
              onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-mono"
            />
            <p className="text-[10px] text-slate-400 mt-1">If left blank, default password will be 'ChangeMe123!'</p>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium cursor-pointer shadow-xs"
            >
              {actionLoading ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      {selectedUser && editModalOpen && (
        <Modal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title={`Edit User: ${selectedUser.firstName} ${selectedUser.lastName}`}
          maxWidth="md"
        >
          <form onSubmit={handleUpdateUser} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={editFormData.firstName}
                  onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  value={editFormData.lastName}
                  onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Account Status</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-medium"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="PENDING">PENDING</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Role</label>
              <select
                value={editFormData.role}
                onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as UserRole })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-medium"
              >
                {Object.values(UserRole).map((r) => (
                  <option key={r} value={r}>
                    {r.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            {isUniversityRole(editFormData.role) && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Associated University</label>
                <select
                  value={editFormData.universityId}
                  onChange={(e) => setEditFormData({ ...editFormData, universityId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  <option value="">Select University...</option>
                  {universities.map((uni) => (
                    <option key={uni._id} value={uni._id}>
                      {uni.name} ({uni.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {isOrganizationRole(editFormData.role) && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Associated Hospital / Center</label>
                <select
                  value={editFormData.organizationId}
                  onChange={(e) => setEditFormData({ ...editFormData, organizationId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  <option value="">Select Hospital / Center...</option>
                  {organizations.map((org) => (
                    <option key={org._id} value={org._id}>
                      {org.name} ({org.type})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium cursor-pointer shadow-xs"
              >
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* View User Detail Modal */}
      {selectedUser && viewModalOpen && (
        <Modal
          isOpen={viewModalOpen}
          onClose={() => setViewModalOpen(false)}
          title="User Profile Details"
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-12 h-12 rounded-full bg-teal-700 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                {selectedUser.firstName?.[0]}
                {selectedUser.lastName?.[0]}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {selectedUser.firstName} {selectedUser.lastName}
                </h3>
                <div className="flex items-center space-x-2 text-slate-500 mt-0.5">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span className="font-mono text-[11px]">{selectedUser.email}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block font-medium">Role</span>
                <div className="mt-1">
                  <RoleBadge role={selectedUser.roles?.[0] || 'STUDENT'} />
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block font-medium">Status</span>
                <div className="mt-1">
                  <StatusBadge status={selectedUser.status} />
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block font-medium">Phone Number</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {selectedUser.phone || 'Not provided'}
                </span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block font-medium">Affiliated Institution</span>
                <span className="font-semibold text-teal-800 mt-0.5 block truncate">
                  {selectedUser.universityId?.name || selectedUser.organizationId?.name || 'Independent / Global'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50/70 rounded-xl space-y-1.5 border border-slate-100 text-[11px]">
              <div className="flex justify-between text-slate-500">
                <span>Account ID:</span>
                <span className="font-mono text-slate-700">{selectedUser._id}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Registered Date:</span>
                <span className="text-slate-700">{new Date(selectedUser.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Last Login:</span>
                <span className="text-slate-700">
                  {selectedUser.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleString() : 'Never'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reset Password Modal */}
      {selectedUser && resetModalOpen && (
        <Modal
          isOpen={resetModalOpen}
          onClose={() => setResetModalOpen(false)}
          title="Reset User Password"
          maxWidth="sm"
        >
          <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
            <p className="text-slate-600">
              Set a new password for user <strong className="text-slate-900">{selectedUser.email}</strong>.
            </p>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">New Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={resetPasswordValue}
                onChange={(e) => setResetPasswordValue(e.target.value)}
                placeholder="Enter at least 6 characters"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-mono"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-3">
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 cursor-pointer shadow-xs"
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
