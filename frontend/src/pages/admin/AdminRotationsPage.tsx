import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Eye,
  FileStack,
  Loader2,
  MoreVertical,
  Pencil,
  RefreshCw,
  Search,
  Send,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import api from '../../services/api';

type RecordObject = Record<string, any>;

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

const studentName = (student: any) => {
  const user = student?.userId;
  return [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Student';
};

const supervisorName = (supervisor: any) => {
  const user = supervisor?.userId;
  return [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Not assigned';
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
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const toInputDate = (value?: string | Date) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
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

const rotationStatusClass = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-emerald-50 text-emerald-700';
    case 'COMPLETED':
      return 'bg-slate-100 text-slate-600';
    case 'CANCELLED':
      return 'bg-rose-50 text-rose-700';
    default:
      return 'bg-blue-50 text-blue-700';
  }
};

export const AdminRotationsPage: React.FC = () => {
  const [placements, setPlacements] = useState<RecordObject[]>([]);
  const [rotations, setRotations] = useState<RecordObject[]>([]);
  const [templates, setTemplates] = useState<RecordObject[]>([]);

  const [loading, setLoading] = useState(true);
  const [referenceLoading, setReferenceLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [rowActionMenuId, setRowActionMenuId] = useState<string | null>(null);
  const [expandedStudentIds, setExpandedStudentIds] = useState<Set<string>>(new Set());
  const [viewingRotation, setViewingRotation] = useState<RecordObject | null>(null);
  const [editingRotation, setEditingRotation] = useState<RecordObject | null>(null);
  const [statusRotation, setStatusRotation] = useState<RecordObject | null>(null);
  const [actionSaving, setActionSaving] = useState(false);
  const [actionReferenceLoading, setActionReferenceLoading] = useState(false);
  const [actionDepartments, setActionDepartments] = useState<RecordObject[]>([]);
  const [actionSupervisors, setActionSupervisors] = useState<RecordObject[]>([]);
  const [editForm, setEditForm] = useState({
    title: '',
    departmentId: '',
    supervisorId: '',
    startDate: '',
    endDate: '',
  });

  const [rotationSearch, setRotationSearch] = useState('');
  const [rotationHospitalFilter, setRotationHospitalFilter] = useState('');
  const [rotationStatusFilter, setRotationStatusFilter] = useState('');

  const [universityFilter, setUniversityFilter] = useState('');
  const [programmeFilter, setProgrammeFilter] = useState('');
  const [hospitalFilter, setHospitalFilter] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [cohortKey, setCohortKey] = useState('');
  const [selectedPlacementIds, setSelectedPlacementIds] = useState<string[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
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
      setError(requestError?.response?.data?.error?.message || 'Unable to load rotation data.');
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

  const eligiblePlacements = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();

    return placements.filter((placement) => {
      if (['COMPLETED', 'CANCELLED'].includes(String(placement.status || '').toUpperCase())) return false;

      const universityId = asId(placement.studentId?.universityId || placement.applicationId?.universityId);
      const programmeId = asId(placement.studentId?.programmeId || placement.applicationId?.programmeId);
      const organizationId = asId(placement.organizationId);

      if (universityFilter && universityId !== universityFilter) return false;
      if (programmeFilter && programmeId !== programmeFilter) return false;
      if (hospitalFilter && organizationId !== hospitalFilter) return false;

      if (!query) return true;

      const haystack = [
        studentName(placement.studentId),
        placement.studentId?.studentNumber,
        placement.organizationId?.name,
        placement.studentId?.universityId?.name,
        placement.studentId?.programmeId?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [placements, universityFilter, programmeFilter, hospitalFilter, studentSearch]);

  const cohorts = useMemo(() => {
    const map = new Map<string, RecordObject[]>();

    eligiblePlacements.forEach((placement) => {
      const universityId =
        asId(placement.studentId?.universityId || placement.applicationId?.universityId) || 'independent';
      const programmeId =
        asId(placement.studentId?.programmeId || placement.applicationId?.programmeId) || 'programme';
      const organizationId = asId(placement.organizationId);

      const key = [
        organizationId,
        universityId,
        programmeId,
        isoDay(placement.startDate),
        isoDay(placement.endDate),
      ].join('|');

      const current = map.get(key) || [];
      current.push(placement);
      map.set(key, current);
    });

    return Array.from(map.entries())
      .map(([key, items]) => ({ key, items }))
      .sort((a, b) => new Date(b.items[0]?.startDate).getTime() - new Date(a.items[0]?.startDate).getTime());
  }, [eligiblePlacements]);

  const selectedCohort = useMemo(
    () => cohorts.find((cohort) => cohort.key === cohortKey) || null,
    [cohorts, cohortKey]
  );

  const selectedTemplate = useMemo(
    () => templates.find((template) => asId(template) === selectedTemplateId) || null,
    [templates, selectedTemplateId]
  );

  const selectedTemplateDays = useMemo(
    () =>
      (selectedTemplate?.items || []).reduce(
        (sum: number, item: RecordObject) => sum + Math.max(1, Number(item.durationDays) || 1),
        0
      ),
    [selectedTemplate]
  );

  const availableDays = selectedCohort?.items?.[0] ? placementDays(selectedCohort.items[0]) : 0;
  const planTooLong = Boolean(selectedTemplate && availableDays > 0 && selectedTemplateDays > availableDays);

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
    setTemplates([]);
    setError('');
    setSuccess('');

    const cohort = cohorts.find((item) => item.key === key);
    if (!cohort) {
      setSelectedPlacementIds([]);
      return;
    }

    const ids = cohort.items.map((placement) => asId(placement));
    setSelectedPlacementIds(ids);
    setGroupCount(Math.max(1, Math.min(ids.length, 1)));

    const organizationId = asId(cohort.items[0]?.organizationId);
    setReferenceLoading(true);

    try {
      const templateResponse = await api.get('/rotations/templates', {
        params: { organizationId },
      });
      const nextTemplates = asArray(templateResponse, 'templates');
      setTemplates(nextTemplates);

      if (nextTemplates.length === 1) {
        const onlyTemplate = nextTemplates[0];
        setSelectedTemplateId(asId(onlyTemplate));
        const rotationsCount = Math.max(1, Number(onlyTemplate.items?.length || 1));
        setGroupCount(Math.max(1, Math.min(rotationsCount, ids.length || 1)));
      }
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error?.message || 'Unable to load hospital rotation templates.');
    } finally {
      setReferenceLoading(false);
    }
  };

  const chooseTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find((item) => asId(item) === templateId);
    const rotationsCount = Math.max(1, Number(template?.items?.length || 1));
    setGroupCount((current) =>
      Math.max(1, Math.min(current, rotationsCount, selectedPlacementIds.length || 1))
    );
  };

  const togglePlacement = (placementId: string) => {
    setSelectedPlacementIds((current) => {
      const next = current.includes(placementId)
        ? current.filter((id) => id !== placementId)
        : [...current, placementId];

      const maxGroups = Math.max(
        1,
        Math.min(selectedTemplate?.items?.length || 1, next.length || 1)
      );
      setGroupCount((groups) => Math.max(1, Math.min(groups, maxGroups)));

      return next;
    });
  };

  const resetAssignFlow = () => {
    setUniversityFilter('');
    setProgrammeFilter('');
    setHospitalFilter('');
    setStudentSearch('');
    setCohortKey('');
    setSelectedPlacementIds([]);
    setSelectedTemplateId('');
    setTemplates([]);
    setGroupCount(1);
  };

  const openAssignModal = () => {
    resetAssignFlow();
    setError('');
    setSuccess('');
    setActionMenuOpen(false);
    setAssignModalOpen(true);
  };

  const closeAssignModal = () => {
    if (publishing) return;
    setAssignModalOpen(false);
    resetAssignFlow();
  };

  const publish = async () => {
    if (!selectedTemplate || !selectedPlacementIds.length || planTooLong) return;

    setPublishing(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/rotations/batch', {
        placementIds: selectedPlacementIds,
        items: (selectedTemplate.items || []).map((item: any) => ({
          title: item.title || item.departmentId?.name || 'Clinical Rotation',
          departmentId: asId(item.departmentId),
          supervisorId: asId(item.supervisorId) || null,
          durationDays: Number(item.durationDays),
          capacity: item.capacity == null ? null : Number(item.capacity),
        })),
        groupCount,
        replaceExisting: existingPlanPlacements > 0,
        templateId: selectedTemplateId,
      });

      const data = response.data?.data;
      await loadBase();
      setAssignModalOpen(false);
      resetAssignFlow();
      setSuccess(
        `Assigned ${data?.studentCount || selectedPlacementIds.length} student schedule(s) successfully.`
      );
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error?.message || 'Unable to assign the rotation template.');
    } finally {
      setPublishing(false);
    }
  };

  const closeRowMenu = () => setRowActionMenuId(null);

  const openRotationDetails = (rotation: RecordObject) => {
    closeRowMenu();
    setViewingRotation(rotation);
  };

  const loadActionReferences = async (rotation: RecordObject) => {
    const organizationId = asId(rotation.organizationId);
    setActionDepartments([]);
    setActionSupervisors([]);
    if (!organizationId) return;

    setActionReferenceLoading(true);
    try {
      const [departmentResponse, supervisorResponse] = await Promise.all([
        api.get(`/organizations/${organizationId}/departments`),
        api.get(`/organizations/${organizationId}/supervisors`),
      ]);
      setActionDepartments(asArray(departmentResponse, 'departments'));
      setActionSupervisors(asArray(supervisorResponse, 'supervisors'));
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.error?.message ||
          'Unable to load hospital departments and supervisors.'
      );
    } finally {
      setActionReferenceLoading(false);
    }
  };

  const openEditRotation = async (rotation: RecordObject) => {
    closeRowMenu();
    setEditingRotation(rotation);
    setEditForm({
      title: rotation.title || '',
      departmentId: asId(rotation.departmentId),
      supervisorId: asId(rotation.supervisorId),
      startDate: toInputDate(rotation.startDate),
      endDate: toInputDate(rotation.endDate),
    });
    await loadActionReferences(rotation);
  };

  const saveRotationEdit = async () => {
    if (!editingRotation || !editForm.title.trim() || !editForm.startDate || !editForm.endDate) return;

    setActionSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.patch(`/rotations/${asId(editingRotation)}`, {
        title: editForm.title.trim(),
        departmentId: editForm.departmentId || null,
        supervisorId: editForm.supervisorId || null,
        startDate: editForm.startDate,
        endDate: editForm.endDate,
      });
      setEditingRotation(null);
      await loadBase();
      setSuccess('Rotation updated successfully.');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error?.message || 'Unable to update rotation.');
    } finally {
      setActionSaving(false);
    }
  };

  const changeRotationStatus = async (mode: 'AUTO' | 'CANCELLED') => {
    if (!statusRotation) return;

    setActionSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.patch(`/rotations/${asId(statusRotation)}/status`, { status: mode });
      setStatusRotation(null);
      await loadBase();
      setSuccess(
        mode === 'CANCELLED'
          ? 'Rotation cancelled successfully.'
          : 'Rotation status restored to automatic date-based tracking.'
      );
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error?.message || 'Unable to change rotation status.');
    } finally {
      setActionSaving(false);
    }
  };

  const deleteRotation = async (rotation: RecordObject) => {
    closeRowMenu();
    const label = `${studentName(rotation.studentId)} — ${rotation.title || 'Rotation'}`;
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;

    setActionSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.delete(`/rotations/${asId(rotation)}`);
      await loadBase();
      setSuccess('Rotation deleted successfully.');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error?.message || 'Unable to delete rotation.');
    } finally {
      setActionSaving(false);
    }
  };

  const rotationHospitals = useMemo(() => {
    const map = new Map<string, string>();
    rotations.forEach((rotation) => {
      if (rotation.organizationId?._id) {
        map.set(asId(rotation.organizationId), rotation.organizationId.name || 'Hospital');
      }
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [rotations]);

  const filteredRotations = useMemo(() => {
    const query = rotationSearch.trim().toLowerCase();

    return rotations.filter((rotation) => {
      if (
        rotationHospitalFilter &&
        asId(rotation.organizationId) !== rotationHospitalFilter
      ) {
        return false;
      }

      if (rotationStatusFilter && rotation.status !== rotationStatusFilter) return false;

      if (!query) return true;

      const haystack = [
        studentName(rotation.studentId),
        rotation.studentId?.studentNumber,
        rotation.organizationId?.name,
        rotation.departmentId?.name,
        supervisorName(rotation.supervisorId),
        rotation.title,
        rotation.templateId?.name,
        rotation.groupCode,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [rotations, rotationSearch, rotationHospitalFilter, rotationStatusFilter]);

  const filteredStudentGroups = useMemo(() => {
    const map = new Map<string, RecordObject[]>();

    filteredRotations.forEach((rotation) => {
      const studentId = asId(rotation.studentId) || asId(rotation);
      const current = map.get(studentId) || [];
      current.push(rotation);
      map.set(studentId, current);
    });

    return Array.from(map.entries())
      .map(([studentId, items]) => ({
        studentId,
        rotations: [...items].sort((a, b) => Number(a.sequence || 0) - Number(b.sequence || 0)),
      }))
      .sort((a, b) => studentName(a.rotations[0]?.studentId).localeCompare(studentName(b.rotations[0]?.studentId)));
  }, [filteredRotations]);

  const toggleStudentRotations = (studentId: string) => {
    setExpandedStudentIds((current) => {
      const next = new Set(current);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
    closeRowMenu();
  };

  const studentOverallStatus = (items: RecordObject[]) => {
    if (items.some((rotation) => rotation.status === 'ACTIVE')) return 'ACTIVE';
    if (items.some((rotation) => rotation.status === 'UPCOMING')) return 'UPCOMING';
    if (items.length > 0 && items.every((rotation) => rotation.status === 'COMPLETED')) return 'COMPLETED';
    if (items.length > 0 && items.every((rotation) => rotation.status === 'CANCELLED')) return 'CANCELLED';
    return items[0]?.status || 'UPCOMING';
  };

  const studentProgramme = (items: RecordObject[]) =>
    items[0]?.studentId?.programmeId?.name ||
    items[0]?.placementId?.studentId?.programmeId?.name ||
    'Programme';

  const studentHospitals = (items: RecordObject[]) => {
    const names = Array.from(
      new Set(items.map((rotation) => rotation.organizationId?.name).filter(Boolean))
    );
    if (!names.length) return 'Hospital';
    if (names.length === 1) return names[0];
    return names.join(', ');
  };

  const rotationStudents = useMemo(
    () => new Set(rotations.map((rotation) => asId(rotation.studentId)).filter(Boolean)).size,
    [rotations]
  );

  const activeRotations = rotations.filter((rotation) => rotation.status === 'ACTIVE').length;

  const assignedHospitals = useMemo(
    () => new Set(rotations.map((rotation) => asId(rotation.organizationId)).filter(Boolean)).size,
    [rotations]
  );

  const first = selectedCohort?.items?.[0];
  const universityName =
    first?.studentId?.universityId?.name ||
    first?.applicationId?.universityId?.name ||
    'Independent';
  const programmeName =
    first?.studentId?.programmeId?.name ||
    first?.applicationId?.programmeId?.name ||
    'Programme';
  const hospitalName = first?.organizationId?.name || 'Hospital';

  const maxGroups = Math.max(
    1,
    Math.min(selectedTemplate?.items?.length || 1, selectedPlacementIds.length || 1)
  );

  return (
    <div className="space-y-5 pb-10">
      <section className="relative rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="pr-14">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-blue-700">
            Clinical Training
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Batch Rotation Planner
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Assign saved rotation templates to eligible student placement cohorts and review published schedules.
          </p>
        </div>

        <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
          <button
            type="button"
            aria-label="Rotation planner actions"
            aria-expanded={actionMenuOpen}
            onClick={() => setActionMenuOpen((current) => !current)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          {actionMenuOpen && (
            <div className="absolute right-0 top-12 z-30 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl">
              <button
                type="button"
                onClick={openAssignModal}
                className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-xs font-black text-blue-700 transition hover:bg-blue-50"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                  <Send className="h-4 w-4" />
                </span>
                Assign Rotation
              </button>
            </div>
          )}
        </div>
      </section>

      {error && !assignModalOpen && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
          {error}
        </div>
      )}

      {success && !assignModalOpen && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
          {success}
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard icon={<FileStack className="h-5 w-5" />} label="Rotation Records" value={loading ? '—' : String(rotations.length)} />
        <StatCard icon={<Users className="h-5 w-5" />} label="Students Assigned" value={loading ? '—' : String(rotationStudents)} />
        <StatCard icon={<CalendarDays className="h-5 w-5" />} label="Active Rotations" value={loading ? '—' : String(activeRotations)} />
        <StatCard icon={<Building2 className="h-5 w-5" />} label="Hospitals" value={loading ? '—' : String(assignedHospitals)} />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-950">Assigned Rotations</h2>
              <p className="mt-1 text-xs text-slate-500">
                Published student rotation schedules from the live database.
              </p>
            </div>

            <div className="grid w-full gap-2 sm:grid-cols-3 lg:w-auto lg:min-w-[760px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="search"
                  value={rotationSearch}
                  onChange={(event) => setRotationSearch(event.target.value)}
                  placeholder="Search student, department..."
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <FilterSelect
                value={rotationHospitalFilter}
                onChange={setRotationHospitalFilter}
                placeholder="All Hospitals"
                options={rotationHospitals}
              />

              <div className="relative">
                <select
                  value={rotationStatusFilter}
                  onChange={(event) => setRotationStatusFilter(event.target.value)}
                  className="min-h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 pr-9 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
                >
                  <option value="">All Status</option>
                  <option value="UPCOMING">Upcoming</option>
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-14 text-sm font-bold text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading rotations...
          </div>
        ) : filteredRotations.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <CalendarDays className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-black text-slate-700">No assigned rotations found</p>
            <p className="mt-1 text-xs text-slate-500">
              Use the three-dot menu above and choose Assign Rotation.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[980px] text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-3.5">Student</th>
                    <th className="px-4 py-3.5">Programme</th>
                    <th className="px-4 py-3.5">Hospital</th>
                    <th className="px-4 py-3.5">Rotations</th>
                    <th className="px-4 py-3.5">Overall Status</th>
                    <th className="px-4 py-3.5 text-right">Details</th>
                  </tr>
                </thead>

                {filteredStudentGroups.map(({ studentId, rotations: studentRotations }) => {
                  const firstRotation = studentRotations[0];
                  const expanded = expandedStudentIds.has(studentId);
                  const overallStatus = studentOverallStatus(studentRotations);

                  return (
                    <tbody key={studentId} className="border-b border-slate-100 last:border-b-0">
                      <tr
                        role="button"
                        tabIndex={0}
                        aria-expanded={expanded}
                        onClick={() => toggleStudentRotations(studentId)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            toggleStudentRotations(studentId);
                          }
                        }}
                        className={
                          'cursor-pointer transition ' +
                          (expanded ? 'bg-blue-50/60' : 'hover:bg-blue-50/30')
                        }
                      >
                        <td className="px-4 py-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-700 text-[11px] font-black text-white shadow-sm">
                              {(studentName(firstRotation.studentId)
                                .split(' ')
                                .map((part) => part[0])
                                .join('')
                                .slice(0, 2) || 'ST')
                                .toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate font-black text-slate-950">
                                {studentName(firstRotation.studentId)}
                              </div>
                              <div className="mt-0.5 truncate text-[10px] font-semibold text-slate-500">
                                ID: {firstRotation.studentId?.studentNumber || firstRotation.studentId?.userId?.email || 'Student'}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 font-bold text-slate-700">
                          {studentProgramme(studentRotations)}
                        </td>

                        <td className="px-4 py-4 font-bold text-slate-700">
                          {studentHospitals(studentRotations)}
                        </td>

                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-[10px] font-black text-violet-700">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {studentRotations.length} rotation{studentRotations.length === 1 ? '' : 's'}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${rotationStatusClass(overallStatus)}`}>
                            {overallStatus}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-right">
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm">
                            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </span>
                        </td>
                      </tr>

                      {expanded && (
                        <tr>
                          <td colSpan={6} className="bg-slate-50/70 px-4 py-4">
                            <div className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm">
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
                                <div>
                                  <h3 className="text-xs font-black text-slate-900">Rotation Details</h3>
                                  <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
                                    Full clinical rotation schedule for {studentName(firstRotation.studentId)}
                                  </p>
                                </div>
                                <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-[10px] font-black text-blue-700">
                                  {studentRotations.length} total
                                </span>
                              </div>

                              <div className="overflow-x-auto">
                                <table className="w-full min-w-[1050px] text-left text-xs">
                                  <thead className="bg-slate-50 text-[9px] font-black uppercase tracking-wider text-slate-400">
                                    <tr>
                                      <th className="px-4 py-3">#</th>
                                      <th className="px-4 py-3">Department</th>
                                      <th className="px-4 py-3">Rotation Period</th>
                                      <th className="px-4 py-3">Supervisor</th>
                                      <th className="px-4 py-3">Group</th>
                                      <th className="px-4 py-3">Status</th>
                                      <th className="px-4 py-3 text-right">Action</th>
                                    </tr>
                                  </thead>

                                  <tbody className="divide-y divide-slate-100">
                                    {studentRotations.map((rotation, index) => (
                                      <tr key={asId(rotation)} className="transition hover:bg-slate-50/80">
                                        <td className="px-4 py-3 font-black text-slate-400">
                                          {String(index + 1).padStart(2, '0')}
                                        </td>

                                        <td className="px-4 py-3">
                                          <div className="font-black text-slate-800">
                                            {rotation.departmentId?.name || rotation.title || 'Not assigned'}
                                          </div>
                                          <div className="mt-0.5 text-[10px] font-semibold text-violet-600">
                                            {rotation.title || rotation.templateId?.name || `Sequence ${rotation.sequence || '—'}`}
                                          </div>
                                        </td>

                                        <td className="px-4 py-3 whitespace-nowrap font-semibold text-slate-600">
                                          {formatDate(rotation.startDate)} — {formatDate(rotation.endDate)}
                                        </td>

                                        <td className="px-4 py-3 font-semibold text-slate-600">
                                          {supervisorName(rotation.supervisorId)}
                                        </td>

                                        <td className="px-4 py-3">
                                          <span className="inline-flex min-w-8 justify-center rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black text-blue-700">
                                            {rotation.groupCode || '—'}
                                          </span>
                                        </td>

                                        <td className="px-4 py-3">
                                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${rotationStatusClass(rotation.status)}`}>
                                            {rotation.status || 'UPCOMING'}
                                          </span>
                                        </td>

                                        <td className="px-4 py-3 text-right">
                                          <div className="relative inline-flex">
                                            <button
                                              type="button"
                                              aria-label="Rotation actions"
                                              aria-expanded={rowActionMenuId === asId(rotation)}
                                              onClick={() =>
                                                setRowActionMenuId((current) =>
                                                  current === asId(rotation) ? null : asId(rotation)
                                                )
                                              }
                                              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                                            >
                                              <MoreVertical className="h-4 w-4" />
                                            </button>

                                            {rowActionMenuId === asId(rotation) && (
                                              <div className="absolute right-0 top-10 z-30 w-48 rounded-2xl border border-slate-200 bg-white p-1.5 text-left shadow-xl">
                                                <ActionItem icon={<Eye className="h-4 w-4" />} label="View Details" onClick={() => openRotationDetails(rotation)} />
                                                <ActionItem icon={<Pencil className="h-4 w-4" />} label="Edit / Reassign" onClick={() => void openEditRotation(rotation)} />
                                                <ActionItem icon={<RefreshCw className="h-4 w-4" />} label="Change Status" onClick={() => { closeRowMenu(); setStatusRotation(rotation); }} />
                                                <ActionItem danger icon={<Trash2 className="h-4 w-4" />} label="Delete" onClick={() => void deleteRotation(rotation)} />
                                              </div>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  );
                })}
              </table>
            </div>

            <div className="grid gap-3 p-3 md:hidden">
              {filteredStudentGroups.map(({ studentId, rotations: studentRotations }) => {
                const firstRotation = studentRotations[0];
                const expanded = expandedStudentIds.has(studentId);
                const overallStatus = studentOverallStatus(studentRotations);

                return (
                  <article key={studentId} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <button
                      type="button"
                      aria-expanded={expanded}
                      onClick={() => toggleStudentRotations(studentId)}
                      className="flex w-full items-start justify-between gap-3 p-4 text-left"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-700 text-xs font-black text-white">
                          {(studentName(firstRotation.studentId)
                            .split(' ')
                            .map((part) => part[0])
                            .join('')
                            .slice(0, 2) || 'ST')
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-black text-slate-950">
                            {studentName(firstRotation.studentId)}
                          </h3>
                          <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-500">
                            ID: {firstRotation.studentId?.studentNumber || '—'} · {studentProgramme(studentRotations)}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[9px] font-black text-violet-700">
                              {studentRotations.length} rotations
                            </span>
                            <span className={`rounded-full px-2.5 py-1 text-[9px] font-black ${rotationStatusClass(overallStatus)}`}>
                              {overallStatus}
                            </span>
                          </div>
                        </div>
                      </div>

                      <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
                        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </span>
                    </button>

                    {expanded && (
                      <div className="space-y-2 border-t border-slate-100 bg-slate-50/70 p-3">
                        {studentRotations.map((rotation, index) => (
                          <div key={asId(rotation)} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-[9px] font-black uppercase tracking-wide text-blue-600">
                                  Rotation {index + 1}
                                </p>
                                <h4 className="mt-1 truncate text-xs font-black text-slate-900">
                                  {rotation.departmentId?.name || rotation.title || 'Not assigned'}
                                </h4>
                                <p className="mt-1 text-[10px] font-semibold text-slate-500">
                                  {formatDate(rotation.startDate)} — {formatDate(rotation.endDate)}
                                </p>
                              </div>

                              <span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-black ${rotationStatusClass(rotation.status)}`}>
                                {rotation.status || 'UPCOMING'}
                              </span>
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                              <MobileInfo label="Hospital" value={rotation.organizationId?.name || 'Hospital'} />
                              <MobileInfo label="Supervisor" value={supervisorName(rotation.supervisorId)} />
                              <MobileInfo label="Group" value={rotation.groupCode || '—'} />
                              <MobileInfo label="Template" value={rotation.templateId?.name || '—'} />
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setRowActionMenuId((current) =>
                                  current === asId(rotation) ? null : asId(rotation)
                                )
                              }
                              className="mt-3 inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 text-[10px] font-black text-slate-700"
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                              Rotation Actions
                            </button>

                            {rowActionMenuId === asId(rotation) && (
                              <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
                                <ActionItem icon={<Eye className="h-4 w-4" />} label="View Details" onClick={() => openRotationDetails(rotation)} />
                                <ActionItem icon={<Pencil className="h-4 w-4" />} label="Edit / Reassign" onClick={() => void openEditRotation(rotation)} />
                                <ActionItem icon={<RefreshCw className="h-4 w-4" />} label="Change Status" onClick={() => { closeRowMenu(); setStatusRotation(rotation); }} />
                                <ActionItem danger icon={<Trash2 className="h-4 w-4" />} label="Delete" onClick={() => void deleteRotation(rotation)} />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>            </div>
          </>
        )}
      </section>

      {viewingRotation && (
        <ModalShell
          title="Rotation Details"
          eyebrow="Assigned Rotation"
          onClose={() => setViewingRotation(null)}
        >
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <DetailBox label="Student" value={studentName(viewingRotation.studentId)} />
            <DetailBox label="Student ID" value={viewingRotation.studentId?.studentNumber || '—'} />
            <DetailBox label="Hospital" value={viewingRotation.organizationId?.name || 'Hospital'} />
            <DetailBox label="Rotation" value={viewingRotation.title || '—'} />
            <DetailBox label="Department" value={viewingRotation.departmentId?.name || 'Not assigned'} />
            <DetailBox label="Supervisor" value={supervisorName(viewingRotation.supervisorId)} />
            <DetailBox label="Start Date" value={formatDate(viewingRotation.startDate)} />
            <DetailBox label="End Date" value={formatDate(viewingRotation.endDate)} />
            <DetailBox label="Group" value={viewingRotation.groupCode || '—'} />
            <DetailBox label="Status" value={viewingRotation.status || 'UPCOMING'} />
          </div>
        </ModalShell>
      )}

      {editingRotation && (
        <ModalShell
          title="Edit / Reassign Rotation"
          eyebrow="Rotation Management"
          onClose={() => !actionSaving && setEditingRotation(null)}
          footer={
            <>
              <button
                type="button"
                disabled={actionSaving}
                onClick={() => setEditingRotation(null)}
                className="min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-black text-slate-600 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  actionSaving ||
                  actionReferenceLoading ||
                  !editForm.title.trim() ||
                  !editForm.startDate ||
                  !editForm.endDate
                }
                onClick={() => void saveRotationEdit()}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white disabled:opacity-40"
              >
                {actionSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Changes
              </button>
            </>
          }
        >
          {actionReferenceLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm font-bold text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading hospital data...
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">Rotation Title *</span>
                <input
                  value={editForm.title}
                  onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))}
                  className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500"
                />
              </label>

              <Select
                label="Department"
                value={editForm.departmentId}
                onChange={(value) => setEditForm((current) => ({ ...current, departmentId: value }))}
              >
                <option value="">Not assigned</option>
                {actionDepartments.map((department) => (
                  <option key={asId(department)} value={asId(department)}>
                    {department.name}
                  </option>
                ))}
              </Select>

              <Select
                label="Supervisor"
                value={editForm.supervisorId}
                onChange={(value) => setEditForm((current) => ({ ...current, supervisorId: value }))}
              >
                <option value="">Not assigned</option>
                {actionSupervisors.map((supervisor) => (
                  <option key={asId(supervisor)} value={asId(supervisor)}>
                    {supervisorName(supervisor)}
                  </option>
                ))}
              </Select>

              <label>
                <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">Start Date *</span>
                <input
                  type="date"
                  value={editForm.startDate}
                  onChange={(event) => setEditForm((current) => ({ ...current, startDate: event.target.value }))}
                  className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500"
                />
              </label>

              <label>
                <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">End Date *</span>
                <input
                  type="date"
                  min={editForm.startDate || undefined}
                  value={editForm.endDate}
                  onChange={(event) => setEditForm((current) => ({ ...current, endDate: event.target.value }))}
                  className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500"
                />
              </label>
            </div>
          )}
        </ModalShell>
      )}

      {statusRotation && (
        <ModalShell
          title="Change Rotation Status"
          eyebrow="Status Management"
          onClose={() => !actionSaving && setStatusRotation(null)}
        >
          <p className="text-sm leading-6 text-slate-600">
            Rotation status normally follows its dates automatically. Cancel only when the rotation should no longer run.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={actionSaving}
              onClick={() => void changeRotationStatus('AUTO')}
              className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-left transition hover:bg-blue-100 disabled:opacity-50"
            >
              <RefreshCw className="h-5 w-5 text-blue-700" />
              <div className="mt-3 text-sm font-black text-slate-900">Automatic Status</div>
              <div className="mt-1 text-xs leading-5 text-slate-500">
                Upcoming, Active and Completed are calculated from the rotation dates.
              </div>
            </button>

            <button
              type="button"
              disabled={actionSaving}
              onClick={() => void changeRotationStatus('CANCELLED')}
              className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-left transition hover:bg-rose-100 disabled:opacity-50"
            >
              <X className="h-5 w-5 text-rose-700" />
              <div className="mt-3 text-sm font-black text-slate-900">Cancel Rotation</div>
              <div className="mt-1 text-xs leading-5 text-slate-500">
                Keeps the historical record but marks this rotation as cancelled.
              </div>
            </button>
          </div>
        </ModalShell>
      )}

      {assignModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <button
            type="button"
            aria-label="Close assign rotation modal"
            className="absolute inset-0 cursor-default"
            onClick={closeAssignModal}
          />

          <div className="relative z-10 flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:max-w-6xl sm:rounded-3xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700">
                  Rotation Assignment
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-950">Assign Rotation</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Select a placement cohort, choose a saved template, select students and assign schedules.
                </p>
              </div>

              <button
                type="button"
                disabled={publishing}
                onClick={closeAssignModal}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">
                  {error}
                </div>
              )}

              <section className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-xs font-black text-blue-700">
                    1
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Select Placement Cohort</h3>
                    <p className="text-xs text-slate-500">Choose students who share the same hospital and placement period.</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <Select
                    label="University"
                    value={universityFilter}
                    onChange={(value) => {
                      setUniversityFilter(value);
                      setCohortKey('');
                    }}
                  >
                    <option value="">All universities</option>
                    {universityOptions.map(([id, label]) => (
                      <option key={id} value={id}>{label}</option>
                    ))}
                  </Select>

                  <Select
                    label="Programme"
                    value={programmeFilter}
                    onChange={(value) => {
                      setProgrammeFilter(value);
                      setCohortKey('');
                    }}
                  >
                    <option value="">All programmes</option>
                    {programmeOptions.map(([id, label]) => (
                      <option key={id} value={id}>{label}</option>
                    ))}
                  </Select>

                  <Select
                    label="Hospital"
                    value={hospitalFilter}
                    onChange={(value) => {
                      setHospitalFilter(value);
                      setCohortKey('');
                    }}
                  >
                    <option value="">All hospitals</option>
                    {hospitalOptions.map(([id, label]) => (
                      <option key={id} value={id}>{label}</option>
                    ))}
                  </Select>

                  <label>
                    <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">Search Student</span>
                    <input
                      value={studentSearch}
                      onChange={(event) => setStudentSearch(event.target.value)}
                      placeholder="Name or Student ID"
                      className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500"
                    />
                  </label>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  {cohorts.length === 0 ? (
                    <div className="col-span-full rounded-xl bg-slate-50 p-5 text-center text-xs font-semibold text-slate-500">
                      No matching placement cohort found.
                    </div>
                  ) : (
                    cohorts.map((cohort) => {
                      const placement = cohort.items[0];
                      const selected = cohort.key === cohortKey;

                      return (
                        <button
                          key={cohort.key}
                          type="button"
                          onClick={() => void selectCohort(cohort.key)}
                          className={`rounded-2xl border p-4 text-left transition ${selected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-200'}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black text-slate-950">
                                {placement.organizationId?.name || 'Hospital'}
                              </p>
                              <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                                {placement.studentId?.universityId?.name || placement.applicationId?.universityId?.name || 'Independent'}
                                {' · '}
                                {placement.studentId?.programmeId?.name || placement.applicationId?.programmeId?.name || 'Programme'}
                              </p>
                            </div>

                            <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-blue-700">
                              {cohort.items.length} students
                            </span>
                          </div>

                          <div className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-500">
                            <CalendarDays className="h-4 w-4 text-blue-500" />
                            {formatDate(placement.startDate)} — {formatDate(placement.endDate)} · {placementDays(placement)} days
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </section>

              {selectedCohort && (
                <>
                  <section className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-xs font-black text-violet-700">
                        2
                      </span>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">Choose Rotation Template</h3>
                        <p className="text-xs text-slate-500">
                          {hospitalName} · {universityName} · {programmeName}
                        </p>
                      </div>
                    </div>

                    {referenceLoading ? (
                      <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 p-4 text-xs font-bold text-slate-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading rotation templates...
                      </div>
                    ) : templates.length === 0 ? (
                      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-800">
                        No saved rotation template exists for this hospital. Create one from Rotation Templates first.
                      </div>
                    ) : (
                      <div className="mt-4">
                        <Select label="Rotation Template *" value={selectedTemplateId} onChange={chooseTemplate}>
                          <option value="">Select template</option>
                          {templates.map((template) => (
                            <option key={asId(template)} value={asId(template)}>
                              {template.name}
                            </option>
                          ))}
                        </Select>

                        {selectedTemplate && (
                          <div className="mt-3 rounded-2xl bg-violet-50/60 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="text-sm font-black text-slate-900">{selectedTemplate.name}</p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {selectedTemplate.items?.length || 0} rotations · {selectedTemplateDays} total days
                                </p>
                              </div>
                              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-violet-700">
                                Placement: {availableDays} days
                              </span>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {(selectedTemplate.items || []).map((item: any, index: number) => (
                                <span
                                  key={index}
                                  className="rounded-lg bg-white px-2 py-1 text-[10px] font-bold text-slate-600"
                                >
                                  {item.title || item.departmentId?.name} · {durationLabel(Number(item.durationDays) || 1)}
                                </span>
                              ))}
                            </div>

                            {planTooLong && (
                              <p className="mt-3 text-xs font-bold text-rose-700">
                                This template is longer than the selected placement period.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </section>

                  <section className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-xs font-black text-emerald-700">
                          3
                        </span>
                        <div>
                          <h3 className="text-sm font-black text-slate-900">Select Students</h3>
                          <p className="text-xs text-slate-500">
                            {selectedPlacementIds.length} of {selectedCohort.items.length} selected
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedPlacementIds(selectedCohort.items.map((item) => asId(item)))
                        }
                        className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-700"
                      >
                        Select All
                      </button>
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {selectedCohort.items.map((placement) => {
                        const id = asId(placement);
                        const checked = selectedPlacementIds.includes(id);

                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => togglePlacement(id)}
                            className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${checked ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'}`}
                          >
                            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${checked ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'}`}>
                              {checked && <Check className="h-4 w-4" />}
                            </span>

                            <span className="min-w-0">
                              <span className="block truncate text-xs font-black text-slate-900">
                                {studentName(placement.studentId)}
                              </span>
                              <span className="block truncate text-[10px] font-semibold text-slate-500">
                                {placement.studentId?.studentNumber || 'No Student ID'}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <section className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-50 text-xs font-black text-cyan-700">
                        4
                      </span>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">Confirm Assignment</h3>
                        <p className="text-xs text-slate-500">Review the group setting before assigning schedules.</p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <SummaryBox label="Selected Students" value={String(selectedPlacementIds.length)} />
                      <SummaryBox label="Template" value={selectedTemplate?.name || 'Not selected'} />
                      <label className="rounded-2xl border border-slate-200 p-3">
                        <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">Number of Groups</span>
                        <input
                          type="number"
                          min={1}
                          max={maxGroups}
                          value={groupCount}
                          onChange={(event) =>
                            setGroupCount(Math.max(1, Math.min(Number(event.target.value) || 1, maxGroups)))
                          }
                          className="mt-1 w-full bg-transparent text-xl font-black text-slate-950 outline-none"
                        />
                      </label>
                    </div>

                    {existingPlanPlacements > 0 && (
                      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-800">
                        {existingPlanPlacements} selected student(s) already have rotation plans. Assigning will replace those plans.
                      </div>
                    )}
                  </section>
                </>
              )}
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                disabled={publishing}
                onClick={closeAssignModal}
                className="min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-black text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  publishing ||
                  !selectedCohort ||
                  !selectedTemplate ||
                  !selectedPlacementIds.length ||
                  planTooLong
                }
                onClick={() => void publish()}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-5 text-sm font-black text-white shadow-lg shadow-cyan-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {publishing ? 'Assigning...' : `Assign ${selectedPlacementIds.length} Student${selectedPlacementIds.length === 1 ? '' : 's'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ActionItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}> = ({ icon, label, onClick, danger = false }) => (
  <button
    type="button"
    onClick={onClick}
    className={
      'flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-xs font-black transition ' +
      (danger
        ? 'text-rose-600 hover:bg-rose-50'
        : 'text-slate-700 hover:bg-slate-100')
    }
  >
    <span className={danger ? 'text-rose-500' : 'text-blue-600'}>{icon}</span>
    {label}
  </button>
);

const ModalShell: React.FC<{
  eyebrow: string;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}> = ({ eyebrow, title, onClose, children, footer }) => (
  <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4">
    <button type="button" aria-label="Close modal" className="absolute inset-0 cursor-default" onClick={onClose} />
    <div className="relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:max-w-2xl sm:rounded-3xl">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700">{eyebrow}</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">{title}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 sm:p-6">{children}</div>
      {footer && (
        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          {footer}
        </div>
      )}
    </div>
  </div>
);

const DetailBox: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-2xl bg-slate-50 p-4">
    <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</div>
    <div className="mt-1 font-black text-slate-800">{value}</div>
  </div>
);

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
        className="min-h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
    </div>
  </label>
);

const FilterSelect: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: [string, string][];
}> = ({ value, onChange, placeholder, options }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="min-h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 pr-9 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:bg-white"
    >
      <option value="">{placeholder}</option>
      {options.map(([id, label]) => (
        <option key={id} value={id}>{label}</option>
      ))}
    </select>
    <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
  </div>
);

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
      {icon}
    </div>
    <p className="mt-4 text-2xl font-black text-slate-950 sm:text-3xl">{value}</p>
    <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-slate-400 sm:text-xs">
      {label}
    </p>
  </article>
);

const MobileInfo: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl bg-slate-50 p-3">
    <div className="text-[9px] font-black uppercase tracking-wide text-slate-400">{label}</div>
    <div className="mt-1 truncate text-xs font-black text-slate-800">{value}</div>
  </div>
);

const SummaryBox: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-200 p-3">
    <div className="text-[10px] font-black uppercase tracking-wide text-slate-500">{label}</div>
    <div className="mt-1 truncate text-sm font-black text-slate-950">{value}</div>
  </div>
);
