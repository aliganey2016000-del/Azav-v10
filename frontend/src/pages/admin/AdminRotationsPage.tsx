import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Stethoscope,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react';
import api from '../../services/api';

type RecordObject = Record<string, any>;

type RotationRow = {
  title: string;
  departmentId: string;
  supervisorId: string;
  weeks: number;
  notes: string;
};

const asArray = (response: any, key: string): RecordObject[] => {
  const data = response?.data?.data ?? response?.data ?? response;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  return [];
};

const asId = (value: any) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return String(value._id || value.id || '');
};

const fullName = (student: any) => {
  const user = student?.userId;
  return [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Student';
};

const formatDate = (value?: string | Date) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
};

const dateInput = (value?: string | Date) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const addDays = (value: string | Date, days: number) => {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
};

const weeksBetween = (start: string | Date, end: string | Date) => {
  const a = new Date(start);
  const b = new Date(end);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 1;
  const days = Math.max(1, Math.ceil((b.getTime() - a.getTime()) / 86400000) + 1);
  return Math.max(1, Math.ceil(days / 7));
};

const statusStyle = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-emerald-100 text-emerald-700';
    case 'COMPLETED':
      return 'bg-slate-200 text-slate-700';
    case 'CANCELLED':
      return 'bg-rose-100 text-rose-700';
    default:
      return 'bg-blue-100 text-blue-700';
  }
};

export const AdminRotationsPage: React.FC = () => {
  const [placements, setPlacements] = useState<RecordObject[]>([]);
  const [rotations, setRotations] = useState<RecordObject[]>([]);
  const [departments, setDepartments] = useState<RecordObject[]>([]);
  const [supervisors, setSupervisors] = useState<RecordObject[]>([]);
  const [selectedPlacementId, setSelectedPlacementId] = useState('');
  const [rows, setRows] = useState<RotationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [placementResponse, rotationResponse] = await Promise.all([
        api.get('/placements'),
        api.get('/rotations'),
      ]);
      setPlacements(asArray(placementResponse, 'placements'));
      setRotations(asArray(rotationResponse, 'rotations'));
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error?.message || 'Unable to load rotation planning data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const selectedPlacement = useMemo(
    () => placements.find((item) => asId(item) === selectedPlacementId) || null,
    [placements, selectedPlacementId]
  );

  const existingForPlacement = useMemo(
    () =>
      rotations
        .filter((rotation) => asId(rotation.placementId) === selectedPlacementId)
        .sort((a, b) => Number(a.sequence || 0) - Number(b.sequence || 0)),
    [rotations, selectedPlacementId]
  );

  useEffect(() => {
    const loadReferenceData = async () => {
      if (!selectedPlacement) {
        setDepartments([]);
        setSupervisors([]);
        setRows([]);
        return;
      }

      const organizationId = asId(selectedPlacement.organizationId);
      try {
        const [departmentResponse, supervisorResponse] = await Promise.all([
          api.get(`/organizations/${organizationId}/departments`),
          api.get(`/organizations/${organizationId}/supervisors`),
        ]);
        setDepartments(asArray(departmentResponse, 'departments'));
        setSupervisors(asArray(supervisorResponse, 'supervisors'));
      } catch {
        setDepartments([]);
        setSupervisors([]);
      }

      if (existingForPlacement.length > 0) {
        setRows(
          existingForPlacement.map((rotation) => ({
            title: rotation.title || '',
            departmentId: asId(rotation.departmentId),
            supervisorId: asId(rotation.supervisorId),
            weeks: weeksBetween(rotation.startDate, rotation.endDate),
            notes: rotation.notes || '',
          }))
        );
      } else {
        const departmentName = selectedPlacement.departmentId?.name || '';
        setRows([
          {
            title: departmentName || 'Rotation 1',
            departmentId: asId(selectedPlacement.departmentId),
            supervisorId: asId(selectedPlacement.supervisorId),
            weeks: 4,
            notes: '',
          },
        ]);
      }
    };

    void loadReferenceData();
  }, [selectedPlacementId, existingForPlacement.length]);

  const scheduledRows = useMemo(() => {
    if (!selectedPlacement) return [];
    let cursor = new Date(selectedPlacement.startDate);

    return rows.map((row, index) => {
      const startDate = new Date(cursor);
      const days = Math.max(1, Number(row.weeks) || 1) * 7;
      const endDate = addDays(startDate, days - 1);
      cursor = addDays(endDate, 1);
      return { ...row, sequence: index + 1, startDate, endDate };
    });
  }, [rows, selectedPlacement]);

  const planExceedsPlacement = useMemo(() => {
    if (!selectedPlacement || scheduledRows.length === 0) return false;
    const last = scheduledRows[scheduledRows.length - 1];
    return new Date(last.endDate) > new Date(selectedPlacement.endDate);
  }, [scheduledRows, selectedPlacement]);

  const updateRow = (index: number, patch: Partial<RotationRow>) => {
    setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  };

  const addRow = () => {
    setRows((current) => [
      ...current,
      {
        title: `Rotation ${current.length + 1}`,
        departmentId: '',
        supervisorId: '',
        weeks: 4,
        notes: '',
      },
    ]);
  };

  const removeRow = (index: number) => {
    setRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
  };

  const savePlan = async () => {
    if (!selectedPlacement || rows.length === 0 || planExceedsPlacement) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/rotations/plan', {
        placementId: selectedPlacementId,
        replaceExisting: existingForPlacement.length > 0,
        rotations: scheduledRows.map((row) => ({
          title: row.title,
          departmentId: row.departmentId || null,
          supervisorId: row.supervisorId || null,
          startDate: dateInput(row.startDate),
          endDate: dateInput(row.endDate),
          notes: row.notes || undefined,
        })),
      });
      setSuccess(existingForPlacement.length > 0 ? 'Rotation plan updated successfully.' : 'Rotation plan created successfully.');
      await loadAll();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error?.message || 'Unable to save rotation plan.');
    } finally {
      setSaving(false);
    }
  };

  const plans = useMemo(() => {
    const map = new Map<string, RecordObject[]>();
    rotations.forEach((rotation) => {
      const key = asId(rotation.placementId);
      const current = map.get(key) || [];
      current.push(rotation);
      map.set(key, current);
    });
    return Array.from(map.values()).map((items) =>
      [...items].sort((a, b) => Number(a.sequence || 0) - Number(b.sequence || 0))
    );
  }, [rotations]);

  const activePlans = plans.filter((items) => items.some((item) => item.status === 'ACTIVE')).length;
  const completedPlans = plans.filter((items) => items.length > 0 && items.every((item) => item.status === 'COMPLETED')).length;

  return (
    <div className="space-y-5 pb-10">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-700">Training Operations</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Clinical Rotations</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Build each student’s department-by-department rotation schedule after placement. Universities and students see the same published plan automatically.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Placements', value: placements.length, icon: Users },
          { label: 'Rotation Plans', value: plans.length, icon: CalendarDays },
          { label: 'Active Plans', value: activePlans, icon: Activity },
          { label: 'Completed', value: completedPlans, icon: CheckCircle2 },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <Icon className="h-5 w-5 text-blue-600" />
              <div className="mt-3 text-[10px] font-black uppercase tracking-wide text-slate-400">{card.label}</div>
              <div className="mt-1 text-2xl font-black text-slate-950">{loading ? '—' : card.value}</div>
            </div>
          );
        })}
      </section>

      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</div>}
      {success && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{success}</div>}

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <label className="block flex-1">
            <span className="text-[11px] font-black uppercase tracking-wide text-slate-500">Select Placement</span>
            <div className="relative mt-1.5">
              <select
                value={selectedPlacementId}
                onChange={(event) => setSelectedPlacementId(event.target.value)}
                className="min-h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-10 text-sm font-bold text-slate-800 outline-none focus:border-blue-500"
              >
                <option value="">Choose student placement...</option>
                {placements.map((placement) => (
                  <option key={asId(placement)} value={asId(placement)}>
                    {fullName(placement.studentId)} — {placement.organizationId?.name || 'Hospital'} — {formatDate(placement.startDate)}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-4 h-4 w-4 text-slate-400" />
            </div>
          </label>

          <button
            type="button"
            onClick={() => void loadAll()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-600"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {selectedPlacement && (
          <div className="mt-5">
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-blue-100 bg-blue-50/60 p-3 sm:grid-cols-4">
              <Info label="Student" value={fullName(selectedPlacement.studentId)} />
              <Info label="Hospital" value={selectedPlacement.organizationId?.name || '—'} />
              <Info label="Placement Start" value={formatDate(selectedPlacement.startDate)} />
              <Info label="Placement End" value={formatDate(selectedPlacement.endDate)} />
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-black text-slate-950">
                  {existingForPlacement.length > 0 ? 'Edit Rotation Plan' : 'Create Rotation Plan'}
                </h2>
                <p className="mt-1 text-xs text-slate-500">Dates are calculated automatically from the placement start date and duration in weeks.</p>
              </div>
              <button
                type="button"
                onClick={addRow}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-50 px-3 text-xs font-black text-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Rotation
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {scheduledRows.map((row, index) => (
                <article key={index} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3 sm:p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">
                      {index + 1}
                    </div>
                    <button
                      type="button"
                      disabled={rows.length <= 1}
                      onClick={() => removeRow(index)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-rose-500 hover:bg-rose-50 disabled:opacity-30"
                      aria-label="Remove rotation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <label>
                      <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">Rotation Name</span>
                      <input
                        value={row.title}
                        onChange={(event) => updateRow(index, { title: event.target.value })}
                        placeholder="e.g. Internal Medicine"
                        className="mt-1 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500"
                      />
                    </label>

                    <label>
                      <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">Department</span>
                      <select
                        value={row.departmentId}
                        onChange={(event) => {
                          const department = departments.find((item) => asId(item) === event.target.value);
                          updateRow(index, {
                            departmentId: event.target.value,
                            title: row.title.startsWith('Rotation ') && department?.name ? department.name : row.title,
                          });
                        }}
                        className="mt-1 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500"
                      >
                        <option value="">Select department</option>
                        {departments.map((department) => (
                          <option key={asId(department)} value={asId(department)}>{department.name}</option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">Supervisor</span>
                      <select
                        value={row.supervisorId}
                        onChange={(event) => updateRow(index, { supervisorId: event.target.value })}
                        className="mt-1 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500"
                      >
                        <option value="">Select supervisor</option>
                        {supervisors.map((supervisor) => {
                          const user = supervisor.userId;
                          const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Supervisor';
                          return <option key={asId(supervisor)} value={asId(supervisor)}>{name}</option>;
                        })}
                      </select>
                    </label>

                    <label>
                      <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">Duration</span>
                      <div className="mt-1 flex min-h-10 items-center rounded-xl border border-slate-200 bg-white px-3">
                        <input
                          type="number"
                          min={1}
                          max={24}
                          value={row.weeks}
                          onChange={(event) => updateRow(index, { weeks: Math.max(1, Number(event.target.value) || 1) })}
                          className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none"
                        />
                        <span className="text-xs font-bold text-slate-400">weeks</span>
                      </div>
                    </label>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-500">
                    <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-blue-500" />{formatDate(row.startDate)} — {formatDate(row.endDate)}</span>
                    <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5 text-blue-500" />{row.weeks} week(s)</span>
                  </div>
                </article>
              ))}
            </div>

            {planExceedsPlacement && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-800">
                The rotation plan extends beyond the placement end date. Reduce one or more rotation durations before saving.
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                disabled={saving || rows.length === 0 || planExceedsPlacement}
                onClick={() => void savePlan()}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-black text-white disabled:opacity-40"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {existingForPlacement.length > 0 ? 'Update Rotation Plan' : 'Publish Rotation Plan'}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-sm font-black text-slate-950">Published Rotation Plans</h2>
        <p className="mt-1 text-xs text-slate-500">These plans are visible to the university and student.</p>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm font-bold text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading plans...
          </div>
        ) : plans.length === 0 ? (
          <div className="py-10 text-center text-sm font-semibold text-slate-500">No rotation plans created yet.</div>
        ) : (
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            {plans.map((items) => {
              const first = items[0];
              const current = items.find((item) => item.status === 'ACTIVE');
              const completed = items.filter((item) => item.status === 'COMPLETED').length;
              return (
                <article key={asId(first.placementId)} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                      <UserRound className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-black text-slate-950">{fullName(first.studentId)}</h3>
                      <p className="mt-1 truncate text-xs font-semibold text-slate-500">{first.organizationId?.name || first.placementId?.organizationId?.name || 'Hospital'}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600">{completed}/{items.length}</span>
                  </div>

                  {current && (
                    <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-800">
                      <Stethoscope className="h-4 w-4" />
                      Current: {current.title}
                    </div>
                  )}

                  <div className="mt-3 space-y-2">
                    {items.map((rotation) => (
                      <div key={String(rotation._id)} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-black text-slate-800">#{rotation.sequence} {rotation.title}</p>
                          <p className="mt-0.5 text-[10px] font-semibold text-slate-500">{formatDate(rotation.startDate)} — {formatDate(rotation.endDate)}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black ${statusStyle(rotation.status)}`}>{rotation.status}</span>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

const Info: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="min-w-0 rounded-xl bg-white/80 p-3">
    <div className="text-[10px] font-black uppercase tracking-wide text-blue-500">{label}</div>
    <div className="mt-1 truncate text-xs font-extrabold text-slate-800">{value}</div>
  </div>
);
