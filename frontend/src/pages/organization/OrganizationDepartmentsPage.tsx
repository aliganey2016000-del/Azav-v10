import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Loader2,
  Plus,
  Stethoscope,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { UserRole } from '../../types/frontend';

interface Department {
  _id: string;
  organizationId: string;
  name: string;
  code: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
}

const asDepartmentList = (response: any): Department[] => {
  const data = response?.data?.data ?? response?.data ?? response;
  return Array.isArray(data?.departments) ? data.departments : [];
};

export const OrganizationDepartmentsPage: React.FC = () => {
  const { user } = useAuth();
  const organizationId = user?.organizationId ? String(user.organizationId) : '';
  const hospitalName = user?.organizationName || 'Healthcare Organization';
  const canAdd =
    user?.roles?.includes(UserRole.ORGANIZATION_ADMIN) ||
    user?.roles?.includes(UserRole.SUPER_ADMIN) ||
    user?.roles?.includes(UserRole.AZAAM_STAFF);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [defaultDepartmentCount, setDefaultDepartmentCount] = useState(8);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDepartment, setNewDepartment] = useState({
    name: '',
    description: '',
  });

  const loadDepartments = async () => {
    if (!organizationId) {
      setLoading(false);
      setError('This account is not linked to a healthcare organization.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.get(`/organizations/${organizationId}/departments`);
      setDepartments(asDepartmentList(response));
      const count = Number(response?.data?.data?.defaultDepartmentCount);
      if (Number.isFinite(count) && count > 0) setDefaultDepartmentCount(count);
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.error?.message ||
          'Unable to load clinical departments.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDepartments();
  }, [organizationId]);

  const additionalDepartmentCount = useMemo(
    () => Math.max(0, departments.length - defaultDepartmentCount),
    [departments.length, defaultDepartmentCount]
  );

  const handleAddDepartment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!organizationId || !newDepartment.name.trim()) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.post(`/organizations/${organizationId}/departments`, {
        name: newDepartment.name.trim(),
        description: newDepartment.description.trim(),
      });

      setNewDepartment({ name: '', description: '' });
      setShowAddModal(false);
      setSuccess('Department added successfully.');
      await loadDepartments();
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.error?.message ||
          'Unable to add the department.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 pb-10">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-teal-700">
                Clinical Training
              </span>
              <span className="text-xs font-semibold text-slate-400">{hospitalName}</span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Clinical Departments
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Eight common medical training departments are provided by default. Add more whenever the hospital needs them.
            </p>
          </div>

          {canAdd && (
            <button
              type="button"
              onClick={() => {
                setError('');
                setSuccess('');
                setShowAddModal(true);
              }}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 text-sm font-black text-white shadow-sm transition hover:bg-teal-700"
            >
              <Plus className="h-4 w-4" />
              Add Department
            </button>
          )}
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Total</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{loading ? '—' : departments.length}</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-500">Departments</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Core</p>
          <p className="mt-1 text-2xl font-black text-teal-700">{defaultDepartmentCount}</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-500">Default units</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Added</p>
          <p className="mt-1 text-2xl font-black text-blue-700">{loading ? '—' : additionalDepartmentCount}</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-500">Extra units</p>
        </div>
      </section>

      <section className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3">
        <div className="flex items-start gap-3">
          <Stethoscope className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
          <div>
            <p className="text-xs font-black text-blue-900">Simple numbered department list</p>
            <p className="mt-1 text-xs leading-5 text-blue-700">
              The standard departments start at 1–8. Every new department automatically appears next as 9, 10, 11 and so on.
            </p>
          </div>
        </div>
      </section>

      {success && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
          <CheckCircle2 className="h-5 w-5" />
          {success}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-56 items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-white text-sm font-bold text-slate-500 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading departments...
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {departments.map((department, index) => (
            <article
              key={department._id}
              className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-sm font-black text-teal-700">
                  {index + 1}
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-emerald-700">
                  Active
                </span>
              </div>

              <div className="mt-4">
                <h2 className="text-sm font-black leading-5 text-slate-950">{department.name}</h2>
                <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-slate-400">
                  {department.code}
                </p>
                <p className="mt-3 min-h-10 text-xs leading-5 text-slate-500">
                  {department.description || 'Clinical training department.'}
                </p>
              </div>
            </article>
          ))}

          {canAdd && (
            <button
              type="button"
              onClick={() => {
                setError('');
                setSuccess('');
                setShowAddModal(true);
              }}
              className="flex min-h-44 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-teal-200 bg-teal-50/40 p-5 text-center transition hover:border-teal-400 hover:bg-teal-50"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-600 text-white shadow-sm">
                <Plus className="h-5 w-5" />
              </span>
              <span className="mt-3 text-sm font-black text-teal-800">Add Department</span>
              <span className="mt-1 text-xs font-semibold text-teal-600">
                This becomes department #{departments.length + 1}
              </span>
            </button>
          )}
        </section>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-700">
                  Department #{departments.length + 1}
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-950">Add Clinical Department</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddDepartment} className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-black text-slate-700">
                  Department Name *
                </label>
                <input
                  autoFocus
                  type="text"
                  required
                  maxLength={120}
                  value={newDepartment.name}
                  onChange={(event) =>
                    setNewDepartment((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="e.g. Cardiology"
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-black text-slate-700">
                  Description
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={newDepartment.description}
                  onChange={(event) =>
                    setNewDepartment((current) => ({ ...current, description: event.target.value }))
                  }
                  placeholder="Optional short description"
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={saving}
                  className="min-h-10 rounded-xl px-4 text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !newDepartment.name.trim()}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-teal-600 px-4 text-sm font-black text-white shadow-sm hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {saving ? 'Saving...' : 'Add Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
