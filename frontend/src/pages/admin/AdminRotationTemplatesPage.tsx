import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  ChevronDown,
  Edit3,
  FileStack,
  Loader2,
  MoreVertical,
  Plus,
  Save,
  Search,
  Trash2,
  Users,
  X,
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

const templateDurationDays = (template: RecordObject) =>
  (template.items || []).reduce(
    (sum: number, item: RecordObject) => sum + Math.max(1, Number(item.durationDays) || 1),
    0
  );

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

  const [search, setSearch] = useState('');
  const [hospitalFilter, setHospitalFilter] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

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

  const resetTemplateForm = () => {
    setEditingId('');
    setOrganizationId('');
    setName('');
    setDescription('');
    setRows([]);
    setDepartments([]);
    setSupervisors([]);
  };

  const startNew = () => {
    resetTemplateForm();
    setError('');
    setActionMenuOpen(false);
    setTemplateModalOpen(true);
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

    setActionMenuOpen(false);
    setTemplateModalOpen(true);
  };

  const closeTemplateModal = () => {
    if (saving) return;
    setTemplateModalOpen(false);
    resetTemplateForm();
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
          title: row.title.trim() || 'Clinical Rotation',
          departmentId: row.departmentId,
          supervisorId: row.supervisorId || null,
          durationDays: Number(row.durationDays),
          capacity: row.capacity,
        })),
      };

      const wasEditing = Boolean(editingId);

      if (editingId) {
        await api.patch(`/rotations/templates/${editingId}`, payload);
      } else {
        await api.post('/rotations/templates', payload);
      }

      await loadBase();
      setSuccess(wasEditing ? 'Template updated successfully.' : 'Template created successfully.');
      setTemplateModalOpen(false);
      resetTemplateForm();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error?.message || 'Unable to save rotation template.');
    } finally {
      setSaving(false);
    }
  };

  const removeTemplate = async (templateId: string) => {
    if (!window.confirm('Delete this rotation template?')) return;

    setError('');
    setSuccess('');

    try {
      await api.delete(`/rotations/templates/${templateId}`);
      if (editingId === templateId) {
        setTemplateModalOpen(false);
        resetTemplateForm();
      }
      await loadBase();
      setSuccess('Template deleted successfully.');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error?.message || 'Unable to delete rotation template.');
    }
  };

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();

    return templates.filter((template) => {
      if (hospitalFilter && asId(template.organizationId) !== hospitalFilter) return false;

      if (query) {
        const haystack = [
          template.name,
          template.description,
          template.organizationId?.name,
          ...(template.items || []).map((item: RecordObject) => item.title || item.departmentId?.name),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!haystack.includes(query)) return false;
      }

      return true;
    });
  }, [templates, hospitalFilter, search]);

  const totalDays = rows.reduce((sum, row) => sum + Math.max(1, Number(row.durationDays) || 1), 0);
  const totalRotations = templates.reduce((sum, template) => sum + Number(template.items?.length || 0), 0);
  const templateHospitals = new Set(
    templates.map((template) => asId(template.organizationId)).filter(Boolean)
  ).size;

  return (
    <div className="space-y-5 pb-10">
      <section className="relative rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="pr-14">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-violet-700">Clinical Training</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Rotation Templates</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Save hospital rotation patterns once and reuse them for future student batches.
          </p>
        </div>

        <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
          <button
            type="button"
            aria-label="Rotation template actions"
            aria-expanded={actionMenuOpen}
            onClick={() => setActionMenuOpen((current) => !current)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          {actionMenuOpen && (
            <div className="absolute right-0 top-12 z-30 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl">
              <button
                type="button"
                onClick={startNew}
                className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-xs font-black text-violet-700 transition hover:bg-violet-50"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
                  <Plus className="h-4 w-4" />
                </span>
                New Template
              </button>
            </div>
          )}
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
          {success}
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <FileStack className="h-5 w-5" />
          </div>
          <p className="mt-4 text-2xl font-black text-slate-950 sm:text-3xl">{loading ? '—' : templates.length}</p>
          <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-slate-400 sm:text-xs">Total Templates</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Building2 className="h-5 w-5" />
          </div>
          <p className="mt-4 text-2xl font-black text-slate-950 sm:text-3xl">{loading ? '—' : templateHospitals}</p>
          <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-slate-400 sm:text-xs">Hospitals</p>
        </article>

        <article className="col-span-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 xl:col-span-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            <Users className="h-5 w-5" />
          </div>
          <p className="mt-4 text-2xl font-black text-slate-950 sm:text-3xl">{loading ? '—' : totalRotations}</p>
          <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-slate-400 sm:text-xs">Rotation Rows</p>
        </article>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-950">Saved Templates</h2>
              <p className="mt-1 text-xs text-slate-500">
                Choose a saved template later from the Rotation Planner.
              </p>
            </div>

            <div className="grid w-full gap-2 sm:grid-cols-2 lg:w-auto lg:min-w-[620px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search template or hospital..."
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-violet-500 focus:bg-white"
                />
              </div>

              <div className="relative">
                <select
                  value={hospitalFilter}
                  onChange={(event) => setHospitalFilter(event.target.value)}
                  className="min-h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 pr-9 text-sm font-semibold text-slate-700 outline-none transition focus:border-violet-500 focus:bg-white"
                >
                  <option value="">All Hospitals</option>
                  {organizations.map((organization) => (
                    <option key={asId(organization)} value={asId(organization)}>
                      {organization.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-14 text-sm font-bold text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading templates...
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <FileStack className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-black text-slate-700">No templates found</p>
            <p className="mt-1 text-xs text-slate-500">Create a template or change the filters.</p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-3.5">#</th>
                    <th className="px-4 py-3.5">Template Name</th>
                    <th className="px-4 py-3.5">Hospital</th>
                    <th className="px-4 py-3.5">Rotations</th>
                    <th className="px-4 py-3.5">Total Duration</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTemplates.map((template, index) => (
                    <tr key={asId(template)} className="transition hover:bg-violet-50/30">
                      <td className="px-4 py-3.5 font-bold text-slate-400">{index + 1}</td>
                      <td className="px-4 py-3.5">
                        <div className="font-black text-slate-900">{template.name}</div>
                        <div className="mt-1 max-w-md truncate text-[11px] font-semibold text-slate-500">
                          {template.description || 'Reusable clinical rotation template'}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-700">
                        {template.organizationId?.name || 'Hospital'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-black text-violet-700">
                          {template.items?.length || 0} rotations
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-700">
                        {templateDurationDays(template)} days
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            title="Edit template"
                            onClick={() => void editTemplate(template)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-violet-600 transition hover:bg-violet-50"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            title="Delete template"
                            onClick={() => void removeTemplate(asId(template))}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-rose-500 transition hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-3 md:hidden">
              {filteredTemplates.map((template) => (
                <article key={asId(template)} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-black text-slate-950">{template.name}</h3>
                      <p className="mt-1 truncate text-xs font-bold text-violet-700">
                        {template.organizationId?.name || 'Hospital'}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-violet-50 px-2 py-1 text-[9px] font-black text-violet-700">
                      {template.items?.length || 0} rotations
                    </span>
                  </div>

                  <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">
                    {template.description || 'Reusable clinical rotation template'}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(template.items || []).slice(0, 4).map((item: any, index: number) => (
                      <span key={index} className="rounded-lg bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-600">
                        {item.title} · {item.durationDays}d
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-[11px] font-black text-slate-500">
                      {templateDurationDays(template)} total days
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void editTemplate(template)}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-violet-50 px-3 text-[10px] font-black text-violet-700"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeTemplate(asId(template))}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-rose-50 px-3 text-[10px] font-black text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {templateModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <button
            type="button"
            aria-label="Close template modal"
            className="absolute inset-0 cursor-default"
            onClick={closeTemplateModal}
          />

          <div className="relative z-10 flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:max-w-5xl sm:rounded-3xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-700">
                  Rotation Template
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-950">
                  {editingId ? 'Edit Rotation Template' : 'Create Rotation Template'}
                </h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Build a reusable hospital rotation pattern with departments, supervisors and durations.
                </p>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={closeTemplateModal}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              <div className="grid gap-4 lg:grid-cols-2">
                <Select label="Hospital *" value={organizationId} onChange={(value) => void loadHospitalData(value)}>
                  <option value="">Select hospital</option>
                  {organizations.map((organization) => (
                    <option key={asId(organization)} value={asId(organization)}>
                      {organization.name}
                    </option>
                  ))}
                </Select>

                <label>
                  <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">Template Name *</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="e.g. Medical Internship – 16 Weeks"
                    className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-violet-500"
                  />
                </label>
              </div>

              <label className="mt-4 block">
                <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">Description</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={2}
                  placeholder="Optional notes about this rotation pattern"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none transition focus:border-violet-500"
                />
              </label>

              <div className="mt-5 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Rotation Pattern</h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {rows.length} rotations · {totalDays} total days
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addRow}
                  disabled={!organizationId}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-3 text-xs font-black text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" />
                  Add Rotation
                </button>
              </div>

              <div className="mt-3 space-y-3">
                {rows.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                    <Building2 className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-2 text-sm font-black text-slate-700">No rotations added</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Select a hospital, then add departments to the rotation pattern.
                    </p>
                  </div>
                ) : rows.map((row, index) => (
                  <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-xs font-black text-white">
                        {index + 1}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        className="inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-xs font-black text-rose-500 transition hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </button>
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                      <label>
                        <span className="text-[10px] font-black uppercase text-slate-500">Rotation</span>
                        <input
                          value={row.title}
                          onChange={(event) => updateRow(index, { title: event.target.value })}
                          className="mt-1 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-violet-500"
                        />
                      </label>

                      <Select
                        label="Department *"
                        value={row.departmentId}
                        onChange={(value) => {
                          const department = departments.find((item) => asId(item) === value);
                          updateRow(index, { departmentId: value, title: department?.name || row.title });
                        }}
                      >
                        <option value="">Select department</option>
                        {departments.map((department) => (
                          <option key={asId(department)} value={asId(department)}>
                            {department.name}
                          </option>
                        ))}
                      </Select>

                      <Select
                        label="Supervisor"
                        value={row.supervisorId}
                        onChange={(value) => updateRow(index, { supervisorId: value })}
                      >
                        <option value="">Optional supervisor</option>
                        {supervisors.map((supervisor) => (
                          <option key={asId(supervisor)} value={asId(supervisor)}>
                            {supervisorName(supervisor)}
                          </option>
                        ))}
                      </Select>

                      <label>
                        <span className="text-[10px] font-black uppercase text-slate-500">Duration (days)</span>
                        <input
                          type="number"
                          min={1}
                          max={365}
                          value={row.durationDays}
                          onChange={(event) =>
                            updateRow(index, { durationDays: Math.max(1, Number(event.target.value) || 1) })
                          }
                          className="mt-1 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none transition focus:border-violet-500"
                        />
                      </label>

                      <label>
                        <span className="text-[10px] font-black uppercase text-slate-500">Capacity</span>
                        <input
                          type="number"
                          min={1}
                          placeholder="No limit"
                          value={row.capacity ?? ''}
                          onChange={(event) =>
                            updateRow(index, {
                              capacity: event.target.value ? Math.max(1, Number(event.target.value)) : null,
                            })
                          }
                          className="mt-1 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none transition focus:border-violet-500"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                disabled={saving}
                onClick={closeTemplateModal}
                className="min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-black text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void save()}
                disabled={saving || !organizationId || !name.trim() || !rows.length || rows.some((row) => !row.departmentId)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-5 text-sm font-black text-white shadow-lg shadow-cyan-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Saving...' : editingId ? 'Update Template' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>
      )}
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
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm font-semibold text-slate-800 outline-none transition focus:border-violet-500"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
    </div>
  </label>
);
