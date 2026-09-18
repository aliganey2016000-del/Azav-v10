import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Layers3,
  Loader2,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Users,
} from 'lucide-react';
import api from '../../services/api';

type RecordObject = Record<string, any>;

type PlannerRow = {
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

const fullName = (student: any) => {
  const user = student?.userId;
  return [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Student';
};

const isoDay = (value?: string | Date) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const formatDate = (value?: string | Date) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
};

const placementDays = (placement: any) => {
  const start = new Date(placement?.startDate);
  const end = new Date(placement?.endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.max(1, Math.floor((end.getTime() - start.getTime()) / 86400000) + 1);
};

const durationLabel = (days: number) => {
  if (days % 7 === 0 && days >= 7) return `${days / 7} week${days === 7 ? '' : 's'}`;
  return `${days} day${days === 1 ? '' : 's'}`;
};

const groupCode = (index: number) => {
  let value = index;
  let label = '';
  do {
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26) - 1;
  } while (value >= 0);
  return label;
};

export const AdminRotationsPage: React.FC = () => {
  const [placements, setPlacements] = useState<RecordObject[]>([]);
  const [rotations, setRotations] = useState<RecordObject[]>([]);
  const [templates, setTemplates] = useState<RecordObject[]>([]);
  const [departments, setDepartments] = useState<RecordObject[]>([]);
  const [supervisors, setSupervisors] = useState<RecordObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [referenceLoading, setReferenceLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [universityFilter, setUniversityFilter] = useState('');
  const [programmeFilter, setProgrammeFilter] = useState('');
  const [hospitalFilter, setHospitalFilter] = useState('');
  const [search, setSearch] = useState('');
  const [cohortKey, setCohortKey] = useState('');
  const [selectedPlacementIds, setSelectedPlacementIds] = useState<string[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [rows, setRows] = useState<PlannerRow[]>([]);
  const [groupCount, setGroupCount] = useState(1);

  const loadBase = async () => {
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
    void loadBase();
  }, []);

  const universityOptions = useMemo(() => {
    const map = new Map<string, string>();
    placements.forEach((placement) => {
      const university = placement.studentId?.universityId || placement.applicationId?.universityId;
      if (university?._id) map.set(asId(university), university.name || 'University');
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [placements]);

  const programmeOptions = useMemo(() => {
    const map = new Map<string, string>();
    placements.forEach((placement) => {
      const programme = placement.studentId?.programmeId || placement.applicationId?.programmeId;
      if (programme?._id) map.set(asId(programme), programme.name || 'Programme');
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [placements]);

  const hospitalOptions = useMemo(() => {
    const map = new Map<string, string>();
    placements.forEach((placement) => {
      if (placement.organizationId?._id) {
        map.set(asId(placement.organizationId), placement.organizationId.name || 'Hospital');
      }
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [placements]);

  const filteredPlacements = useMemo(() => {
    const query = search.trim().toLowerCase();
    return placements.filter((placement) => {
      const universityId = asId(placement.studentId?.universityId || placement.applicationId?.universityId);
      const programmeId = asId(placement.studentId?.programmeId || placement.applicationId?.programmeId);
      const organizationId = asId(placement.organizationId);
      if (universityFilter && universityId !== universityFilter) return false;
      if (programmeFilter && programmeId !== programmeFilter) return false;
      if (hospitalFilter && organizationId !== hospitalFilter) return false;
      if (!query) return true;

      const haystack = [
        fullName(placement.studentId),
        placement.studentId?.studentNumber,
        placement.organizationId?.name,
        placement.studentId?.universityId?.name,
        placement.studentId?.programmeId?.name,
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }, [placements, universityFilter, programmeFilter, hospitalFilter, search]);

  const cohorts = useMemo(() => {
    const map = new Map<string, RecordObject[]>();
    filteredPlacements.forEach((placement) => {
      const universityId = asId(placement.studentId?.universityId || placement.applicationId?.universityId) || 'independent';
      const programmeId = asId(placement.studentId?.programmeId || placement.applicationId?.programmeId) || 'programme';
      const organizationId = asId(placement.organizationId);
      const key = [organizationId, universityId, programmeId, isoDay(placement.startDate), isoDay(placement.endDate)].join('|');
      const current = map.get(key) || [];
      current.push(placement);
      map.set(key, current);
    });
    return Array.from(map.entries())
      .map(([key, items]) => ({ key, items }))
      .sort((a, b) => new Date(b.items[0]?.startDate).getTime() - new Date(a.items[0]?.startDate).getTime());
  }, [filteredPlacements]);

  const selectedCohort = useMemo(
    () => cohorts.find((cohort) => cohort.key === cohortKey) || null,
    [cohorts, cohortKey]
  );

  const selectedPlacements = useMemo(
    () => placements.filter((placement) => selectedPlacementIds.includes(asId(placement))),
    [placements, selectedPlacementIds]
  );

  const availableDays = selectedCohort?.items?.[0] ? placementDays(selectedCohort.items[0]) : 0;
  const totalPlanDays = rows.reduce((sum, row) => sum + Math.max(1, Number(row.durationDays) || 1), 0);
  const planTooLong = availableDays > 0 && totalPlanDays > availableDays;

  const existingPlanPlacements = useMemo(() => {
    const ids = new Set(selectedPlacementIds);
    return new Set(
      rotations
        .map((rotation) => asId(rotation.placementId))
        .filter((placementId) => ids.has(placementId))
    ).size;
  }, [rotations, selectedPlacementIds]);

  const selectCohort = async (key: string) => {
    setCohortKey(key);
    setSelectedTemplateId('');
    setRows([]);
    setSuccess('');
    setError('');

    const cohort = cohorts.find((item) => item.key === key);
    if (!cohort) {
      setSelectedPlacementIds([]);
      setDepartments([]);
      setSupervisors([]);
      setTemplates([]);
      return;
    }

    const ids = cohort.items.map((placement) => asId(placement));
    setSelectedPlacementIds(ids);

    const organizationId = asId(cohort.items[0]?.organizationId);
    setReferenceLoading(true);
    try {
      const [departmentResponse, supervisorResponse, templateResponse] = await Promise.all([
        api.get(`/organizations/${organizationId}/departments`),
        api.get(`/organizations/${organizationId}/supervisors`),
        api.get('/rotations/templates', { params: { organizationId } }),
      ]);
      const nextDepartments = asArray(departmentResponse, 'departments');
      setDepartments(nextDepartments);
      setSupervisors(asArray(supervisorResponse, 'supervisors'));
      setTemplates(asArray(templateResponse, 'templates'));

      const days = placementDays(cohort.items[0]);
      const usableDepartments = nextDepartments.slice(0, Math.max(1, Math.min(nextDepartments.length, days || 1)));
      if (usableDepartments.length) {
        const base = Math.floor(days / usableDepartments.length);
        let remainder = days % usableDepartments.length;
        const autoRows = usableDepartments.map((department) => {
          const durationDays = Math.max(1, base + (remainder-- > 0 ? 1 : 0));
          return {
            title: department.name || 'Clinical Rotation',
            departmentId: asId(department),
            supervisorId: '',
            durationDays,
            capacity: null,
          };
        });
        setRows(autoRows);
        setGroupCount(Math.max(1, Math.min(autoRows.length, ids.length)));
      }
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error?.message || 'Unable to load hospital departments and supervisors.');
    } finally {
      setReferenceLoading(false);
    }
  };

  const useTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find((item) => asId(item) === templateId);
    if (!template) return;
    const nextRows = (template.items || []).map((item: any) => ({
      title: item.title || item.departmentId?.name || 'Rotation',
      departmentId: asId(item.departmentId),
      supervisorId: asId(item.supervisorId),
      durationDays: Number(item.durationDays) || 1,
      capacity: item.capacity == null ? null : Number(item.capacity),
    }));
    setRows(nextRows);
    setGroupCount(Math.max(1, Math.min(nextRows.length, selectedPlacementIds.length || 1)));
  };

  const autoBuild = () => {
    if (!selectedCohort || !departments.length) return;
    const days = placementDays(selectedCohort.items[0]);
    const usable = departments.slice(0, Math.max(1, Math.min(departments.length, days || 1)));
    const base = Math.floor(days / usable.length);
    let remainder = days % usable.length;
    const nextRows = usable.map((department) => ({
      title: department.name || 'Clinical Rotation',
      departmentId: asId(department),
      supervisorId: '',
      durationDays: Math.max(1, base + (remainder-- > 0 ? 1 : 0)),
      capacity: null,
    }));
    setSelectedTemplateId('');
    setRows(nextRows);
    setGroupCount(Math.max(1, Math.min(nextRows.length, selectedPlacementIds.length || 1)));
  };

  const updateRow = (index: number, patch: Partial<PlannerRow>) => {
    setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  };

  const addRow = () => {
    const remaining = Math.max(1, availableDays - totalPlanDays);
    setRows((current) => [
      ...current,
      { title: `Rotation ${current.length + 1}`, departmentId: '', supervisorId: '', durationDays: remaining, capacity: null },
    ]);
  };

  const removeRow = (index: number) => {
    const next = rows.filter((_, rowIndex) => rowIndex !== index);
    setRows(next);
    setGroupCount((current) => Math.max(1, Math.min(current, next.length || 1, selectedPlacementIds.length || 1)));
  };

  const togglePlacement = (placementId: string) => {
    setSelectedPlacementIds((current) => {
      const next = current.includes(placementId)
        ? current.filter((id) => id !== placementId)
        : [...current, placementId];
      setGroupCount((groups) => Math.max(1, Math.min(groups, rows.length || 1, next.length || 1)));
      return next;
    });
  };

  const previewGroups = useMemo(() => {
    const count = Math.max(1, Math.min(groupCount, rows.length || 1, selectedPlacementIds.length || 1));
    const sizes = Array.from({ length: count }, (_, index) =>
      Math.floor(selectedPlacementIds.length / count) + (index < selectedPlacementIds.length % count ? 1 : 0)
    );
    return sizes.map((studentCount, index) => ({
      code: groupCode(index),
      studentCount,
      items: rows.map((_, sequence) => rows[(sequence + index) % rows.length]).filter(Boolean),
    }));
  }, [groupCount, rows, selectedPlacementIds.length]);

  const capacityProblem = useMemo(() => {
    if (!previewGroups.length) return '';
    const largest = Math.max(...previewGroups.map((group) => group.studentCount));
    const limited = rows.find((row) => row.capacity != null && largest > Number(row.capacity));
    return limited ? `Largest group has ${largest} students, but ${limited.title} capacity is ${limited.capacity}.` : '';
  }, [previewGroups, rows]);

  const publish = async () => {
    if (!selectedPlacementIds.length || !rows.length || planTooLong || capacityProblem) return;
    setPublishing(true);
    setError('');
    setSuccess('');
    try {
      const response = await api.post('/rotations/batch', {
        placementIds: selectedPlacementIds,
        items: rows.map((row) => ({
          title: row.title,
          departmentId: row.departmentId,
          supervisorId: row.supervisorId || null,
          durationDays: Number(row.durationDays),
          capacity: row.capacity,
        })),
        groupCount,
        replaceExisting: existingPlanPlacements > 0,
        templateId: selectedTemplateId || null,
      });
      const data = response.data?.data;
      setSuccess(`Published ${data?.studentCount || selectedPlacementIds.length} student schedules in ${data?.groupCount || groupCount} groups.`);
      await loadBase();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error?.message || 'Unable to publish the batch rotation plan.');
    } finally {
      setPublishing(false);
    }
  };

  const first = selectedCohort?.items?.[0];
  const universityName = first?.studentId?.universityId?.name || first?.applicationId?.universityId?.name || 'Independent';
  const programmeName = first?.studentId?.programmeId?.name || first?.applicationId?.programmeId?.name || 'Programme';
  const hospitalName = first?.organizationId?.name || 'Hospital';

  return (
    <div className="space-y-5 pb-10">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-700">Clinical Training</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Batch Rotation Planner</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Select one placement cohort, build the rotation once, and publish individualized schedules to every selected student.
        </p>
      </section>

      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</div>}
      {success && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{success}</div>}

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Search className="h-4 w-4" /></div>
          <div>
            <h2 className="text-sm font-black text-slate-950">1. Find Placement Cohort</h2>
            <p className="text-xs text-slate-500">Filter once instead of selecting students one by one.</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Select label="University" value={universityFilter} onChange={(value) => { setUniversityFilter(value); setCohortKey(''); }}>
            <option value="">All universities</option>
            {universityOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </Select>
          <Select label="Programme" value={programmeFilter} onChange={(value) => { setProgrammeFilter(value); setCohortKey(''); }}>
            <option value="">All programmes</option>
            {programmeOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </Select>
          <Select label="Hospital" value={hospitalFilter} onChange={(value) => { setHospitalFilter(value); setCohortKey(''); }}>
            <option value="">All hospitals</option>
            {hospitalOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </Select>
          <label>
            <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">Search Student</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or Student ID" className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-blue-500" />
          </label>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {loading ? (
            <div className="col-span-full flex items-center justify-center gap-2 py-8 text-sm font-bold text-slate-500"><Loader2 className="h-5 w-5 animate-spin" />Loading placements...</div>
          ) : cohorts.length === 0 ? (
            <div className="col-span-full rounded-2xl bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">No matching placement cohort found.</div>
          ) : cohorts.map((cohort) => {
            const placement = cohort.items[0];
            const selected = cohort.key === cohortKey;
            return (
              <button key={cohort.key} type="button" onClick={() => void selectCohort(cohort.key)} className={`rounded-2xl border p-4 text-left transition ${selected ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-200 hover:border-blue-200'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950">{placement.organizationId?.name || 'Hospital'}</p>
                    <p className="mt-1 truncate text-xs font-semibold text-slate-500">{placement.studentId?.universityId?.name || placement.applicationId?.universityId?.name || 'Independent'} · {placement.studentId?.programmeId?.name || placement.applicationId?.programmeId?.name || 'Programme'}</p>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-blue-700">{cohort.items.length} students</span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-500"><CalendarDays className="h-4 w-4 text-blue-500" />{formatDate(placement.startDate)} — {formatDate(placement.endDate)} · {placementDays(placement)} days</div>
              </button>
            );
          })}
        </div>
      </section>

      {selectedCohort && (
        <>
          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-black text-slate-950">2. Students in this Cohort</h2>
                <p className="mt-1 text-xs text-slate-500">{universityName} · {programmeName} · {hospitalName}</p>
              </div>
              <button type="button" onClick={() => setSelectedPlacementIds(selectedCohort.items.map((item) => asId(item)))} className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">Select All</button>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {selectedCohort.items.map((placement) => {
                const id = asId(placement);
                const checked = selectedPlacementIds.includes(id);
                return (
                  <button key={id} type="button" onClick={() => togglePlacement(id)} className={`flex items-center gap-3 rounded-xl border p-3 text-left ${checked ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${checked ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'}`}>{checked && <Check className="h-4 w-4" />}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-black text-slate-900">{fullName(placement.studentId)}</span>
                      <span className="block truncate text-[10px] font-semibold text-slate-500">{placement.studentId?.studentNumber || 'No Student ID'}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-black text-slate-950">3. Build One Rotation Plan</h2>
                <p className="mt-1 text-xs text-slate-500">Placement period: {availableDays} days. The planner never defaults beyond this period.</p>
              </div>
              <button type="button" onClick={autoBuild} disabled={referenceLoading || !departments.length} className="inline-flex items-center gap-2 rounded-xl bg-violet-50 px-3 py-2 text-xs font-black text-violet-700 disabled:opacity-40"><Sparkles className="h-4 w-4" />Auto Build</button>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
              <Select label="Use Rotation Template" value={selectedTemplateId} onChange={useTemplate}>
                <option value="">Custom / Auto plan</option>
                {templates.map((template) => <option key={asId(template)} value={asId(template)}>{template.name}</option>)}
              </Select>
              <button type="button" onClick={addRow} className="mt-5 min-h-11 rounded-xl border border-blue-200 bg-blue-50 px-4 text-xs font-black text-blue-700">+ Add Rotation</button>
            </div>

            {referenceLoading ? (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 p-4 text-xs font-bold text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Loading hospital departments...</div>
            ) : (
              <div className="mt-4 space-y-3">
                {rows.map((row, index) => (
                  <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">{index + 1}</div>
                      <button type="button" disabled={rows.length <= 1} onClick={() => removeRow(index)} className="text-xs font-black text-rose-500 disabled:opacity-30">Remove</button>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                      <label>
                        <span className="text-[10px] font-black uppercase text-slate-500">Rotation</span>
                        <input value={row.title} onChange={(event) => updateRow(index, { title: event.target.value })} className="mt-1 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-blue-500" />
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
                        {supervisors.map((supervisor) => {
                          const user = supervisor.userId;
                          const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Supervisor';
                          return <option key={asId(supervisor)} value={asId(supervisor)}>{name}</option>;
                        })}
                      </Select>
                      <label>
                        <span className="text-[10px] font-black uppercase text-slate-500">Duration (days)</span>
                        <input type="number" min={1} max={365} value={row.durationDays} onChange={(event) => updateRow(index, { durationDays: Math.max(1, Number(event.target.value) || 1) })} className="mt-1 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-blue-500" />
                      </label>
                      <label>
                        <span className="text-[10px] font-black uppercase text-slate-500">Capacity</span>
                        <input type="number" min={1} placeholder="No limit" value={row.capacity ?? ''} onChange={(event) => updateRow(index, { capacity: event.target.value ? Math.max(1, Number(event.target.value)) : null })} className="mt-1 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-blue-500" />
                      </label>
                    </div>
                    <div className="mt-2 text-[11px] font-bold text-slate-500">{durationLabel(row.durationDays)}</div>
                  </div>
                ))}
              </div>
            )}

            <div className={`mt-4 rounded-2xl border p-4 ${planTooLong ? 'border-amber-300 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
              <div className="flex items-center justify-between gap-3 text-xs font-black">
                <span className={planTooLong ? 'text-amber-800' : 'text-emerald-800'}>Plan length</span>
                <span className={planTooLong ? 'text-amber-800' : 'text-emerald-800'}>{totalPlanDays} / {availableDays} days</span>
              </div>
              {planTooLong && <p className="mt-1 text-xs font-semibold text-amber-800">Reduce the rotation durations before publishing.</p>}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex items-center gap-2">
              <Layers3 className="h-5 w-5 text-blue-600" />
              <div>
                <h2 className="text-sm font-black text-slate-950">4. Auto Groups & Rotation Matrix</h2>
                <p className="text-xs text-slate-500">Students are balanced automatically. Every group starts in a different department.</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Info label="Selected Students" value={String(selectedPlacementIds.length)} icon={<Users className="h-4 w-4" />} />
              <label className="rounded-2xl border border-slate-200 p-3">
                <span className="text-[10px] font-black uppercase text-slate-500">Number of Groups</span>
                <input type="number" min={1} max={Math.max(1, Math.min(rows.length || 1, selectedPlacementIds.length || 1))} value={groupCount} onChange={(event) => setGroupCount(Math.max(1, Math.min(Number(event.target.value) || 1, rows.length || 1, selectedPlacementIds.length || 1)))} className="mt-1 w-full bg-transparent text-xl font-black text-slate-950 outline-none" />
              </label>
              <Info label="Largest Group" value={String(previewGroups.length ? Math.max(...previewGroups.map((group) => group.studentCount)) : 0)} icon={<Users className="h-4 w-4" />} />
            </div>

            {capacityProblem && <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">{capacityProblem}</div>}

            <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-[720px] w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-3">Group</th>
                    <th className="px-3 py-3">Students</th>
                    {rows.map((_, index) => <th key={index} className="px-3 py-3">Period {index + 1}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {previewGroups.map((group) => (
                    <tr key={group.code} className="border-t border-slate-100">
                      <td className="px-3 py-3"><span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 font-black text-white">{group.code}</span></td>
                      <td className="px-3 py-3 font-black text-slate-800">{group.studentCount}</td>
                      {group.items.map((item, index) => <td key={index} className="px-3 py-3"><div className="font-black text-slate-800">{item.title}</div><div className="mt-0.5 text-[10px] font-semibold text-slate-500">{durationLabel(item.durationDays)}</div></td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-black text-slate-950">5. Publish to Students</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {existingPlanPlacements > 0
                    ? `${existingPlanPlacements} selected student(s) already have rotation plans; publishing will replace those plans.`
                    : 'University and students will see the schedules immediately after publishing.'}
                </p>
              </div>
              <button type="button" onClick={() => void publish()} disabled={publishing || !selectedPlacementIds.length || !rows.length || planTooLong || Boolean(capacityProblem) || rows.some((row) => !row.departmentId)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40">
                {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Publish {selectedPlacementIds.length} Schedules
              </button>
            </div>
          </section>
        </>
      )}

      <button type="button" onClick={() => void loadBase()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 shadow-sm"><RefreshCw className="h-4 w-4" />Refresh Data</button>
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
      <select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500">
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
    </div>
  </label>
);

const Info: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="rounded-2xl border border-slate-200 p-3">
    <div className="flex items-center gap-1.5 text-blue-600">{icon}<span className="text-[10px] font-black uppercase">{label}</span></div>
    <div className="mt-1 text-xl font-black text-slate-950">{value}</div>
  </div>
);
