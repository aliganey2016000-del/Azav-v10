import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  ChevronDown,
  CopyPlus,
  Loader2,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import api from '../../services/api';

type RecordObject = Record<string, any>;

type TemplateRow = {
  title: string;
  departmentId: string;
  supervisorId: string;
  durationDays: number;
  capacity: number | null;
};

const asArray = (response: any, key: string): RecordObject[] => {
  const data = response?.data?.data ?? response?.data ?? response;
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.[key]) ? data[key] : [];
};

const asId = (value: any) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return String(value._id || value.id || '');
};

const supervisorName = (supervisor: any) => {
  const user = supervisor?.userId;
  return [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Supervisor';
};

export const AdminRotationTemplatesPage: React.FC = () => {
  const [organizations, setOrganizations] = useState<RecordObject[]>([]);
  const [templates, setTemplates] = useState<RecordObject[]>([]);
  const [departments, setDepartments] = useState<RecordObject[]>([]);
  const [supervisors, setSupervisors] = useState<RecordObject[]>([]);
  const [organizationId, setOrganizationId] = useState('');
  const [editingId, setEditingId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rows, setRows] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadBase = async () => {
    setLoading(true);
    setError('');
    try {
      const [organizationResponse, templateResponse] = await Promise.all([
        api.get('/organizations'),
        api.get('/rotations/templates'),
      ]);
      setOrganizations(asArray(organizationResponse, 'organizations'));
      setTemplates(asArray(templateResponse, 'templates'));
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error?.message || 'Unable to load rotation templates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBase();
  }, []);

  const loadHospitalData = async (nextOrganizationId: string) => {
    setOrganizationId(nextOrganizationId);
    setDepartments([]);
    setSupervisors([]);
    if (!nextOrganizationId) return;

    try {
      const [departmentResponse, supervisorResponse] = await Promise.all([
        api.get(`/organizations/${nextOrganizationId}/departments`),
        api.get(`/organizations/${nextOrganizationId}/supervisors`),
      ]);
      setDepartments(asArray(departmentResponse, 'departments'));
      setSupervisors(asArray(supervisorResponse, 'supervisors'));
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error?.message || 'Unable to load hospital departments.');
    }
  };

  const clearForm = () => {
    setEditingId('');
    setName('');
    setDescription('');
    setRows([]);
    setSuccess('');
  };

  const startNew = () => {
    clearForm();
    if (organizationId && departments.length) {
      setRows(departments.map((department) => ({
        title: department.name || 'Clinical Rotation',
        departmentId: asId(department),
        supervisorId: '',
        durationDays: 28,
        capacity: null,
      })));
    }
  };

  const editTemplate = async (template: RecordObject) => {
    setEditingId(asId(template));
    setName(template.name || '');
    setDescription(template.description || '');
    const nextOrganizationId = asId(template.organizationId);
    await loadHospitalData(nextOrganizationId);
    setRows((template.items || []).map((item: any) => ({
      title: item.title || item.departmentId?.name || 'Rotation',
      departmentId: asId(item.departmentId),
      supervisorId: asId(item.supervisorId),
      durationDays: Number(item.durationDays) || 1,
      capacity: item.capacity == null ? null : Number(item.capacity),
    })));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addRow = () => {
    setRows((current) => [
      ...current,
      {
        title: `Rotation ${current.length + 1}`,
        departmentId: '',
        supervisorId: '',
        durationDays: 28,
        capacity: null,
      },
    ]);
  };

  const updateRow = (index: number, patch: Partial<TemplateRow>) => {
    setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  };

  const removeRow = (index: number) => {
    setRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
  };

  const save = async () => {
    if (!name.trim() || !organizationId || !rows.length || rows.some((row) => !row.departmentId)) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        name: name.trim(),
        organizationId,
        description: description.trim() || undefined,
        items: rows.map((row) => ({
          title: row.title,
          departmentId: row.departmentId,
          supervisorId: row.supervisorId || null,
          durationDays: Number(row.durationDays),
          capacity: row.capacity,
        })),
      };

      if (editingId) {
        await api.patch(`/rotations/templates/${editingId}`, payload);
      } else {
        await api.post('/rotations/templates', payload);
      }

      setSuccess(editingId ? 'Template updated successfully.' : 'Template created successfully.');
      await loadBase();
      clearForm();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error?.message || 'Unable to save rotation template.');
    } finally {
      setSaving(false);
    }
  };

  const removeTemplate = async (templateId: string) => {
    setError('');
    try {
      await api.delete(`/rotations/templates/${templateId}`);
      if (editingId === templateId) clearForm();
      await loadBase();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error?.message || 'Unable to delete rotation template.');
    }
  };

  const filteredTemplates = useMemo(
    () => organizationId
      ? templates.filter((template) => asId(template.organizationId) === organizationId)
      : templates,
    [templates, organizationId]
  );

  const totalDays = rows.reduce((sum, row) => sum + Math.max(1, Number(row.durationDays) || 1), 0);

  return (
    <div className="space-y-5 pb-10">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-violet-700">Clinical Training</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Rotation Templates</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Save hospital rotation patterns once and reuse them for future student batches.
        </p>
      </section>

      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</div>}
      {success && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{success}</div>}

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-black text-slate-950">{editingId ? 'Edit Template' : 'Create Template'}</h2>
            <p className="mt-1 text-xs text-slate-500">Templates are hospital-specific because departments and supervisors belong to a hospital.</p>
          </div>
          <button type="button" onClick={startNew} className="inline-flex items-center gap-2 rounded-xl bg-violet-50 px-3 py-2 text-xs font-black text-violet-700"><CopyPlus className="h-4 w-4" />New Template</button>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <Select label="Hospital" value={organizationId} onChange={(value) => void loadHospitalData(value)}>
            <option value="">Select hospital</option>
            {organizations.map((organization) => <option key={asId(organization)} value={asId(organization)}>{organization.name}</option>)}
          </Select>
          <label>
            <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">Template Name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Medical Internship – 16 Weeks" className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-violet-500" />
          </label>
        </div>

        <label className="mt-3 block">
          <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">Description</span>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={2} placeholder="Optional notes about this rotation pattern" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-violet-500" />
        </label>

        <div className="mt-5 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-900">Rotation Pattern</h3>
            <p className="mt-0.5 text-xs text-slate-500">{rows.length} rotations · {totalDays} total days</p>
          </div>
          <button type="button" onClick={addRow} disabled={!organizationId} className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 disabled:opacity-40"><Plus className="h-4 w-4" />Add Rotation</button>
        </div>

        <div className="mt-3 space-y-3">
          {rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <Building2 className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm font-black text-slate-700">No rotations added</p>
              <p className="mt-1 text-xs text-slate-500">Select a hospital, then add its departments to the template.</p>
            </div>
          ) : rows.map((row, index) => (
            <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 sm:p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-xs font-black text-white">{index + 1}</div>
                <button type="button" onClick={() => removeRow(index)} className="inline-flex items-center gap-1 text-xs font-black text-rose-500"><Trash2 className="h-4 w-4" />Remove</button>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <label>
                  <span className="text-[10px] font-black uppercase text-slate-500">Rotation</span>
                  <input value={row.title} onChange={(event) => updateRow(index, { title: event.target.value })} className="mt-1 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-violet-500" />
                </label>
                <Select label="Department" value={row.departmentId} onChange={(value) => {
                  const department = departments.find((item) => asId(item) === value);
                  updateRow(index, { departmentId: value, title: department?.name || row.title });
                }}>
                  <option value="">Select department</option>
                  {departments.map((department) => <option key={asId(department)} value={asId(department)}>{department.name}</option>)}
                </Select>
                <Select label="Supervisor" value={row.supervisorId} onChange={(value) => updateRow(index, { supervisorId: value })}>
                  <option value="">Optional supervisor</option>
                  {supervisors.map((supervisor) => <option key={asId(supervisor)} value={asId(supervisor)}>{supervisorName(supervisor)}</option>)}
                </Select>
                <label>
                  <span className="text-[10px] font-black uppercase text-slate-500">Duration (days)</span>
                  <input type="number" min={1} max={365} value={row.durationDays} onChange={(event) => updateRow(index, { durationDays: Math.max(1, Number(event.target.value) || 1) })} className="mt-1 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-violet-500" />
                </label>
                <label>
                  <span className="text-[10px] font-black uppercase text-slate-500">Capacity</span>
                  <input type="number" min={1} placeholder="No limit" value={row.capacity ?? ''} onChange={(event) => updateRow(index, { capacity: event.target.value ? Math.max(1, Number(event.target.value)) : null })} className="mt-1 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-violet-500" />
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex justify-end">
          <button type="button" onClick={() => void save()} disabled={saving || !organizationId || !name.trim() || !rows.length || rows.some((row) => !row.departmentId)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-black text-white disabled:opacity-40">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {editingId ? 'Update Template' : 'Save Template'}
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-sm font-black text-slate-950">Saved Templates</h2>
        <p className="mt-1 text-xs text-slate-500">Choose any template later from the Batch Rotation Planner.</p>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm font-bold text-slate-500"><Loader2 className="h-5 w-5 animate-spin" />Loading templates...</div>
        ) : filteredTemplates.length === 0 ? (
          <div className="py-10 text-center text-sm font-semibold text-slate-500">No templates found.</div>
        ) : (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {filteredTemplates.map((template) => (
              <article key={asId(template)} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-black text-slate-950">{template.name}</h3>
                    <p className="mt-1 text-xs font-semibold text-violet-700">{template.organizationId?.name || 'Hospital'}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600">{template.items?.length || 0} rotations</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(template.items || []).map((item: any, index: number) => (
                    <span key={index} className="rounded-lg bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-600">{item.title} · {item.durationDays}d</span>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={() => void editTemplate(template)} className="flex-1 rounded-xl bg-violet-50 px-3 py-2 text-xs font-black text-violet-700">Edit</button>
                  <button type="button" onClick={() => void removeTemplate(asId(template))} className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-600">Delete</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

const Select: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}> = ({ label, value, onChange, children }) => (
  <label>
    <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">{label}</span>
    <div className="relative mt-1">
      <select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm font-semibold text-slate-800 outline-none focus:border-violet-500">
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
    </div>
  </label>
);
