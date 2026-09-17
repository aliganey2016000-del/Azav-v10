import api from './api';
import { AdminApiService } from './admin.service';

function mutationError(error: any, fallback: string): Error {
  const message =
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.message ||
    fallback;

  return new Error(message);
}

function requireStrongPassword(password: unknown, context: string): void {
  if (typeof password !== 'string' || password.length < 12) {
    throw new Error(`${context} password must be at least 12 characters.`);
  }
}

const service = AdminApiService as any;

service.createUser = async (userData: any) => {
  requireStrongPassword(userData?.password, 'User');
  try {
    const res = await api.post('/admin/users', userData);
    if (!res.data?.data?._id) {
      throw new Error('The server did not confirm that the user account was created.');
    }
    return res.data.data;
  } catch (error) {
    throw mutationError(error, 'Failed to create user account.');
  }
};

service.updateUser = async (id: string, userData: any) => {
  try {
    const res = await api.patch(`/admin/users/${id}`, userData);
    if (!res.data?.data) throw new Error('The server did not confirm the user update.');
    return res.data.data;
  } catch (error) {
    throw mutationError(error, 'Failed to update user account.');
  }
};

service.updateUserStatus = async (id: string, status: 'ACTIVE' | 'INACTIVE') => {
  try {
    const res = await api.patch(`/admin/users/${id}/status`, { status });
    if (!res.data?.data) throw new Error('The server did not confirm the status update.');
    return res.data.data;
  } catch (error) {
    throw mutationError(error, 'Failed to update user status.');
  }
};

service.resetUserPassword = async (id: string, newPassword: string) => {
  requireStrongPassword(newPassword, 'New');
  try {
    const res = await api.post(`/admin/users/${id}/reset-password`, { newPassword });
    if (!res.data?.data) throw new Error('The server did not confirm the password reset.');
    return res.data.data;
  } catch (error) {
    throw mutationError(error, 'Failed to reset user password.');
  }
};

service.createUniversity = async (data: any) => {
  if (data?.initialAdminEmail) requireStrongPassword(data?.initialAdminPassword, 'Initial university admin');
  try {
    const res = await api.post('/admin/universities', data);
    if (!res.data?.data?._id) throw new Error('The server did not confirm university creation.');
    return res.data.data;
  } catch (error) {
    throw mutationError(error, 'Failed to create university.');
  }
};

service.updateUniversity = async (id: string, data: any) => {
  try {
    const res = await api.patch(`/admin/universities/${id}`, data);
    if (!res.data?.data) throw new Error('The server did not confirm the university update.');
    return res.data.data;
  } catch (error) {
    throw mutationError(error, 'Failed to update university.');
  }
};

service.updateUniversityStatus = async (id: string, status: string) => {
  try {
    const res = await api.patch(`/admin/universities/${id}/status`, { status });
    if (!res.data?.data) throw new Error('The server did not confirm the university status update.');
    return res.data.data;
  } catch (error) {
    throw mutationError(error, 'Failed to update university status.');
  }
};

service.createOrganization = async (data: any) => {
  if (data?.initialAdminEmail) requireStrongPassword(data?.initialAdminPassword, 'Initial hospital admin');
  try {
    const res = await api.post('/admin/organizations', data);
    if (!res.data?.data?._id) throw new Error('The server did not confirm healthcare facility creation.');
    return res.data.data;
  } catch (error) {
    throw mutationError(error, 'Failed to create healthcare facility.');
  }
};

service.updateOrganization = async (id: string, data: any) => {
  try {
    const res = await api.patch(`/admin/organizations/${id}`, data);
    if (!res.data?.data) throw new Error('The server did not confirm the facility update.');
    return res.data.data;
  } catch (error) {
    throw mutationError(error, 'Failed to update healthcare facility.');
  }
};

service.updateOrganizationStatus = async (id: string, status: string) => {
  try {
    const res = await api.patch(`/admin/organizations/${id}/status`, { status });
    if (!res.data?.data) throw new Error('The server did not confirm the facility status update.');
    return res.data.data;
  } catch (error) {
    throw mutationError(error, 'Failed to update healthcare facility status.');
  }
};

service.updateSupervisorStatus = async (id: string, status: 'ACTIVE' | 'INACTIVE') => {
  try {
    const res = await api.patch(`/admin/supervisors/${id}/status`, { status });
    if (!res.data?.data) throw new Error('The server did not confirm the supervisor status update.');
    return res.data.data;
  } catch (error) {
    throw mutationError(error, 'Failed to update supervisor status.');
  }
};
