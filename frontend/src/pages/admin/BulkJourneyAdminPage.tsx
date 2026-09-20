import React, { useEffect, useMemo, useState } from 'react';
import JSZip from 'jszip';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  FileCheck2,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Upload,
  Users,
  XCircle,
} from 'lucide-react';
import { AdminApiService } from '../../services/admin.service';
import { AdminJourneyStage, AdminStudent, AdminUniversity } from '../../types/admin.types';

type BulkStageKey = 'AZAAM_REVIEW' | 'PERMIT' | 'VISA' | 'RESIDENCE' | 'TRANSPORT' | 'PLACEMENT';
type BulkDoc = { name: string; mimeType: string; base64Data: string };
type ProcessResult = {
  studentId: string;
  studentNumber: string;
  name: string;
  ok: boolean;
  message: string;
};

const STAGES: { key: BulkStageKey; label: string; helper: string }[] = [
  { key: 'AZAAM_REVIEW', label: 'AZAAM Review', helper: 'Approve selected students in the batch' },
  { key: 'PERMIT', label: 'Permit / Host Letter', helper: 'Attach permit or host acceptance documents' },
  { key: 'VISA', label: 'Entry Visa', helper: 'Attach entry visa documents' },
  { key: 'RESIDENCE', label: 'Residence Visa', helper: 'Attach residence documents' },
  { key: 'TRANSPORT', label: 'Arrival & Pickup', helper: 'Confirm arrival with photo evidence' },
  { key: 'PLACEMENT', label: 'Hospital Placement', helper: 'Assign one placement setup to selected students' },
];

const STAGE_DOCUMENT_TYPE: Partial<Record<BulkStageKey, string>> = {
  PERMIT: 'HOST_ACCEPTANCE_LETTER',
  VISA: 'ENTRY_VISA',
  RESIDENCE: 'RESIDENCE_VISA',
  TRANSPORT: 'ARRIVAL_EVIDENCE',
  PLACEMENT: 'PLACEMENT_EVIDENCE',
};

const STAGE_FILE_SUFFIXES: Record<BulkStageKey, string[]> = {
  AZAAM_REVIEW: [],
  PERMIT: ['PERMIT', 'HOST_ACCEPTANCE_LETTER'],
  VISA: ['VISA', 'ENTRY_VISA'],
  RESIDENCE: ['RESIDENCE', 'RESIDENCE_VISA'],
  TRANSPORT: ['ARRIVAL', 'ARRIVAL_EVIDENCE'],
  PLACEMENT: ['PLACEMENT', 'PLACEMENT_EVIDENCE'],
};

const normalizeKey = (value: string) => value.trim().toLowerCase();

const studentName = (student: AdminStudent) =>
  [student.firstName, student.lastName].filter(Boolean).join(' ').trim() || student.email || 'Student';

const fileMimeType = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return 'application/pdf';
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'webp': return 'image/webp';
    case 'doc': return 'application/msword';
    case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    default: return 'application/octet-stream';
  }
};

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const runWithConcurrency = async <T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> => {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      results[index] = await worker(items[index]);
    }
  });

  await Promise.all(runners);
  return results;
};

const stageStatusClass = (status?: string) => {
  switch (status) {
    case 'COMPLETED':
      return 'bg-emerald-100 text-emerald-700';
    case 'CURRENT':
      return 'bg-blue-100 text-blue-700';
    case 'CORRECTION_REQUESTED':
      return 'bg-amber-100 text-amber-700';
    case 'REJECTED':
      return 'bg-rose-100 text-rose-700';
    default:
      return 'bg-slate-100 text-slate-500';
  }
};

export const BulkJourneyAdminPage: React.FC = () => {
  const [universities, setUniversities] = useState<AdminUniversity[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [stageMap, setStageMap] = useState<Record<string, AdminJourneyStage | null>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [universityId, setUniversityId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [stageKey, setStageKey] = useState<BulkStageKey>('AZAAM_REVIEW');
  const [query, setQuery] = useState('');

  const [loadingUniversities, setLoadingUniversities] = useState(true);
  const [loadingBatch, setLoadingBatch] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<ProcessResult[]>([]);

  const [sharedFile, setSharedFile] = useState<File | null>(null);
  const [zipFileName, setZipFileName] = useState('');
  const [zipDocuments, setZipDocuments] = useState<Record<string, BulkDoc[]>>({});
  const [zipWarnings, setZipWarnings] = useState<string[]>([]);
  const [readingZip, setReadingZip] = useState(false);
  const [note, setNote] = useState('');

  const [hospitals, setHospitals] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [placement, setPlacement] = useState({
    organizationId: '',
    departmentId: '',
    supervisorId: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    setLoadingUniversities(true);
    AdminApiService.getUniversities({ page: 1, limit: 100, status: 'ACTIVE' })
      .then((res) =>
        setUniversities(
          (res.universities || []).sort((a, b) =>
            String(a.name || '').localeCompare(String(b.name || ''))
          )
        )
      )
      .catch((e: any) => setError(e?.message || 'Unable to load universities.'))
      .finally(() => setLoadingUniversities(false));
  }, []);

  useEffect(() => {
    setBatchId('');
    setBatches([]);
    setStudents([]);
    setStageMap({});
    setSelectedIds(new Set());
    setResults([]);
    if (!universityId) return;

    setLoadingBatch(true);
    AdminApiService.getTrainingBatches(universityId)
      .then(setBatches)
      .catch((e: any) =>
        setError(e?.response?.data?.error?.message || e?.message || 'Unable to load batches.')
      )
      .finally(() => setLoadingBatch(false));
  }, [universityId]);

  useEffect(() => {
    setSharedFile(null);
    setZipFileName('');
    setZipDocuments({});
    setZipWarnings([]);
    setResults([]);
  }, [stageKey, batchId]);

  useEffect(() => {
    if (stageKey !== 'PLACEMENT' || hospitals.length > 0) return;
    AdminApiService.getOrganizations({ page: 1, limit: 100, status: 'ACTIVE' })
      .then((res) =>
        setHospitals(
          (res.organizations || [])
            .filter((org: any) =>
              ['HOSPITAL', 'TEACHING_HOSPITAL'].includes(String(org.type || '').toUpperCase())
            )
            .sort((a: any, b: any) => String(a.name || '').localeCompare(String(b.name || '')))
        )
      )
      .catch((e: any) =>
        setError(e?.response?.data?.error?.message || e?.message || 'Unable to load hospitals.')
      );
  }, [stageKey, hospitals.length]);

  useEffect(() => {
    if (!placement.organizationId) {
      setDepartments([]);
      setSupervisors([]);
      return;
    }

    Promise.all([
      AdminApiService.getOrganizationDepartments(placement.organizationId),
      AdminApiService.getOrganizationSupervisors(placement.organizationId),
    ])
      .then(([departmentItems, supervisorItems]) => {
        setDepartments(departmentItems || []);
        setSupervisors(supervisorItems || []);
      })
      .catch(() => {
        setDepartments([]);
        setSupervisors([]);
      });
  }, [placement.organizationId]);

  const loadBatchStudents = async () => {
    if (!universityId || !batchId) return;

    setLoadingStudents(true);
    setError('');
    setResults([]);

    try {
      const first = await AdminApiService.getStudents({
        page: 1,
        limit: 100,
        universityId,
      });

      const pages = Math.max(1, Number(first.pagination?.totalPages || 1));
      const more =
        pages > 1
          ? await Promise.all(
              Array.from({ length: pages - 1 }, (_, index) =>
                AdminApiService.getStudents({
                  page: index + 2,
                  limit: 100,
                  universityId,
                })
              )
            )
          : [];

      const all = [first.students || [], ...more.map((item) => item.students || [])].flat();
      const batchStudents = all.filter((student) => student.batch?._id === batchId);
      setStudents(batchStudents);

      const stages = await runWithConcurrency(batchStudents, 6, async (student) => {
        try {
          const journey = await AdminApiService.getStudentAzaamJourney(student._id);
          return {
            studentId: student._id,
            stage: journey.find((item) => item.stageKey === stageKey) || null,
          };
        } catch {
          return { studentId: student._id, stage: null };
        }
      });

      const nextMap: Record<string, AdminJourneyStage | null> = {};
      const nextSelected = new Set<string>();
      stages.forEach(({ studentId, stage }) => {
        nextMap[studentId] = stage;
        if (stage && stage.status !== 'LOCKED' && stage.status !== 'COMPLETED') {
          nextSelected.add(studentId);
        }
      });

      setStageMap(nextMap);
      setSelectedIds(nextSelected);
    } catch (e: any) {
      setError(
        e?.response?.data?.error?.message ||
          e?.message ||
          'Unable to load students for this batch.'
      );
      setStudents([]);
      setStageMap({});
      setSelectedIds(new Set());
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (!batchId) return;
    void loadBatchStudents();
  }, [batchId, stageKey]);

  const eligibleStudents = useMemo(
    () =>
      students.filter((student) => {
        const stage = stageMap[student._id];
        return Boolean(stage && stage.status !== 'LOCKED' && stage.status !== 'COMPLETED');
      }),
    [students, stageMap]
  );

  const filteredStudents = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return students;
    return students.filter((student) =>
      [
        studentName(student),
        student.studentNumber,
        student.email,
        student.program,
        student.specialty,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle)
    );
  }, [students, query]);

  const selectedStudents = useMemo(
    () => students.filter((student) => selectedIds.has(student._id)),
    [students, selectedIds]
  );

  const toggleStudent = (student: AdminStudent) => {
    const stage = stageMap[student._id];
    if (!stage || stage.status === 'LOCKED' || stage.status === 'COMPLETED') return;

    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(student._id)) next.delete(student._id);
      else next.add(student._id);
      return next;
    });
  };

  const selectAllEligible = () => {
    setSelectedIds(new Set(eligibleStudents.map((student) => student._id)));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const documentsForStudent = (studentNumber: string) =>
    zipDocuments[normalizeKey(studentNumber)] || [];

  const parseZip = async (file: File | null) => {
    if (!file) return;
    setError('');
    setZipWarnings([]);
    setZipDocuments({});
    setZipFileName(file.name);

    if (!file.name.toLowerCase().endsWith('.zip')) {
      setError('Upload a standard ZIP archive.');
      return;
    }

    setReadingZip(true);
    try {
      const zip = await JSZip.loadAsync(file);
      const next: Record<string, BulkDoc[]> = {};
      const warnings: string[] = [];
      const suffixes = STAGE_FILE_SUFFIXES[stageKey];

      for (const entry of Object.values(zip.files)) {
        if (entry.dir) continue;
        const fileName = entry.name.split('/').pop() || entry.name;
        const dot = fileName.lastIndexOf('.');
        if (dot <= 0) {
          warnings.push('Skipped ' + fileName + ': missing file extension.');
          continue;
        }

        const stem = fileName.slice(0, dot);
        const upper = stem.toUpperCase();
        const suffix = suffixes.find((candidate) => upper.endsWith('_' + candidate));
        if (!suffix) {
          warnings.push(
            'Skipped ' + fileName + ': expected StudentID_' + (suffixes[0] || 'DOCUMENT') + '.ext.'
          );
          continue;
        }

        const studentNumber = stem.slice(0, -(suffix.length + 1)).trim();
        if (!studentNumber) continue;

        const mimeType = fileMimeType(fileName);
        if (
          (stageKey === 'TRANSPORT' || stageKey === 'PLACEMENT') &&
          !mimeType.startsWith('image/')
        ) {
          warnings.push('Skipped ' + fileName + ': this stage requires image evidence.');
          continue;
        }

        const base64 = await entry.async('base64');
        const doc: BulkDoc = {
          name: fileName,
          mimeType,
          base64Data: 'data:' + mimeType + ';base64,' + base64,
        };
        const key = normalizeKey(studentNumber);
        next[key] = [...(next[key] || []), doc];
      }

      const knownStudentNumbers = new Set(students.map((student) => normalizeKey(student.studentNumber)));
      Object.keys(next).forEach((key) => {
        if (!knownStudentNumbers.has(key)) {
          warnings.push('ZIP contains documents for student ID "' + key + '" that is not in this batch.');
        }
      });

      setZipDocuments(next);
      setZipWarnings(warnings.slice(0, 20));
      if (Object.keys(next).length === 0) {
        setError('No documents matched the selected journey step naming format.');
      }
    } catch {
      setError('Unable to read this ZIP archive.');
      setZipDocuments({});
    } finally {
      setReadingZip(false);
    }
  };

  const processBulk = async () => {
    if (!batchId || selectedStudents.length === 0) return;

    if (stageKey === 'PLACEMENT') {
      if (!placement.organizationId || !placement.startDate || !placement.endDate) {
        setError('Hospital, start date and end date are required for bulk placement.');
        return;
      }
      if (placement.endDate < placement.startDate) {
        setError('Placement end date must be on or after the start date.');
        return;
      }
    }

    if (
      ['PERMIT', 'VISA', 'RESIDENCE'].includes(stageKey) &&
      !sharedFile &&
      Object.keys(zipDocuments).length === 0
    ) {
      setError('Upload one shared document or a per-student ZIP before processing this stage.');
      return;
    }

    if (
      ['TRANSPORT', 'PLACEMENT'].includes(stageKey) &&
      Object.keys(zipDocuments).length === 0
    ) {
      setError('Upload the per-student evidence ZIP before processing this stage.');
      return;
    }

    setProcessing(true);
    setError('');
    setResults([]);

    let sharedDoc: BulkDoc | null = null;
    if (sharedFile) {
      sharedDoc = {
        name: sharedFile.name,
        mimeType: sharedFile.type || fileMimeType(sharedFile.name),
        base64Data: await fileToDataUrl(sharedFile),
      };
    }

    const processed = await runWithConcurrency(selectedStudents, 3, async (student): Promise<ProcessResult> => {
      try {
        if (stageKey === 'AZAAM_REVIEW') {
          await AdminApiService.actOnJourneyStage(
            student._id,
            'AZAAM_REVIEW',
            'APPROVE',
            undefined,
            batchId
          );
        } else if (stageKey === 'PERMIT' || stageKey === 'VISA' || stageKey === 'RESIDENCE') {
          const docs = documentsForStudent(student.studentNumber);
          const doc = docs[0] || sharedDoc;
          if (!doc) throw new Error('No document matched this student.');

          const uploaded = await AdminApiService.uploadStudentDocument(student._id, {
            originalName: doc.name,
            mimeType: doc.mimeType,
            base64Data: doc.base64Data,
            type: STAGE_DOCUMENT_TYPE[stageKey],
          });

          await AdminApiService.updateJourneyStage(
            student._id,
            stageKey,
            [uploaded._id],
            note.trim() || undefined
          );
        } else if (stageKey === 'TRANSPORT') {
          const docs = documentsForStudent(student.studentNumber);
          const doc = docs[0];
          if (!doc) throw new Error('Arrival image not found in ZIP for this student.');

          const uploaded = await AdminApiService.uploadStudentDocument(student._id, {
            originalName: doc.name,
            mimeType: doc.mimeType,
            base64Data: doc.base64Data,
            type: 'ARRIVAL_EVIDENCE',
          });

          await AdminApiService.updateJourneyStage(
            student._id,
            'TRANSPORT',
            [uploaded._id],
            'Arrival status: Arrived' + (note.trim() ? ' — ' + note.trim() : '')
          );
        } else {
          const docs = documentsForStudent(student.studentNumber);
          const doc = docs[0];
          if (!doc) throw new Error('Placement image not found in ZIP for this student.');

          const uploaded = await AdminApiService.uploadStudentDocument(student._id, {
            originalName: doc.name,
            mimeType: doc.mimeType,
            base64Data: doc.base64Data,
            type: 'PLACEMENT_EVIDENCE',
          });

          await AdminApiService.confirmHospitalPlacement(student._id, {
            organizationId: placement.organizationId,
            departmentId: placement.departmentId || undefined,
            supervisorId: placement.supervisorId || undefined,
            startDate: placement.startDate,
            endDate: placement.endDate,
            documentIds: [uploaded._id],
            comment: note.trim() || undefined,
          });
        }

        return {
          studentId: student._id,
          studentNumber: student.studentNumber,
          name: studentName(student),
          ok: true,
          message: 'Completed',
        };
      } catch (e: any) {
        return {
          studentId: student._id,
          studentNumber: student.studentNumber,
          name: studentName(student),
          ok: false,
          message:
            e?.response?.data?.error?.message ||
            e?.message ||
            'Unable to process this student.',
        };
      }
    });

    setResults(processed);
    setProcessing(false);
    await loadBatchStudents();
  };

  const stageLabel = STAGES.find((stage) => stage.key === stageKey)?.label || stageKey;
  const selectedBatch = batches.find((batch) => batch._id === batchId);
  const completedResults = results.filter((item) => item.ok).length;
  const failedResults = results.filter((item) => !item.ok).length;

  return (
    <div className="space-y-5 pb-10">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-teal-800 p-5 text-white shadow-xl sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-teal-200">
              AZAAM Operations
            </div>
            <h1 className="text-2xl font-black sm:text-3xl">Bulk Journey Processing</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Process a university batch in one workspace instead of opening every student journey separately.
              Completed or locked students are automatically protected from accidental re-processing.
            </p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-xs backdrop-blur">
            <div className="text-slate-300">Selected batch</div>
            <div className="mt-1 font-black text-white">
              {selectedBatch ? selectedBatch.batchNumber + ' · ' + selectedBatch.studentsCount + ' students' : 'Not selected'}
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 lg:grid-cols-3">
          <label>
            <span className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-slate-500">University</span>
            <select
              value={universityId}
              onChange={(event) => setUniversityId(event.target.value)}
              disabled={loadingUniversities || processing}
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none focus:border-teal-500"
            >
              <option value="">{loadingUniversities ? 'Loading universities...' : 'Select university'}</option>
              {universities.map((university) => (
                <option key={university._id} value={university._id}>
                  {university.name}{university.code ? ' · ' + university.code : ''}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-slate-500">Batch</span>
            <select
              value={batchId}
              onChange={(event) => setBatchId(event.target.value)}
              disabled={!universityId || loadingBatch || processing}
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none focus:border-teal-500 disabled:bg-slate-50"
            >
              <option value="">{loadingBatch ? 'Loading batches...' : 'Select batch'}</option>
              {batches.map((batch) => (
                <option key={batch._id} value={batch._id}>
                  {batch.batchNumber} · {batch.studentsCount || 0} students · {batch.status}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-slate-500">Journey Step</span>
            <select
              value={stageKey}
              onChange={(event) => setStageKey(event.target.value as BulkStageKey)}
              disabled={processing}
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none focus:border-teal-500"
            >
              {STAGES.map((stage) => (
                <option key={stage.key} value={stage.key}>{stage.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {STAGES.map((stage, index) => (
            <button
              key={stage.key}
              type="button"
              onClick={() => setStageKey(stage.key)}
              disabled={processing}
              className={
                'rounded-2xl border p-3 text-left transition ' +
                (stage.key === stageKey
                  ? 'border-teal-500 bg-teal-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:bg-slate-50')
              }
            >
              <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">Step {index + 1}</div>
              <div className="mt-1 text-xs font-black text-slate-900">{stage.label}</div>
              <div className="mt-1 text-[10px] leading-4 text-slate-500">{stage.helper}</div>
            </button>
          ))}
        </div>
      </section>

      {batchId && (
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-black text-slate-950">{stageLabel}</h2>
              <p className="mt-1 text-xs text-slate-500">
                {eligibleStudents.length} eligible · {selectedStudents.length} selected · {students.length} total in batch
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={selectAllEligible}
                disabled={processing || loadingStudents}
                className="min-h-10 rounded-xl bg-teal-50 px-4 text-xs font-black text-teal-700"
              >
                Select All Eligible
              </button>
              <button
                type="button"
                onClick={clearSelection}
                disabled={processing || loadingStudents}
                className="min-h-10 rounded-xl border border-slate-200 px-4 text-xs font-black text-slate-600"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => void loadBatchStudents()}
                disabled={processing || loadingStudents}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-black text-slate-600"
              >
                <RefreshCw className={'h-4 w-4 ' + (loadingStudents ? 'animate-spin' : '')} />
                Refresh
              </button>
            </div>
          </div>

          <div className="relative mt-4 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search student..."
              className="min-h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-semibold text-slate-700 outline-none focus:border-teal-500"
            />
          </div>

          {loadingStudents ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm font-bold text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading batch journeys...
            </div>
          ) : students.length === 0 ? (
            <div className="py-12 text-center text-sm font-bold text-slate-500">
              No students are assigned to this batch.
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-[820px] w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="w-14 px-4 py-3">Select</th>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Student ID</th>
                    <th className="px-4 py-3">Program</th>
                    <th className="px-4 py-3">Current Step Status</th>
                    {stageKey !== 'AZAAM_REVIEW' && <th className="px-4 py-3">ZIP Match</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student) => {
                    const stage = stageMap[student._id];
                    const eligible = Boolean(stage && stage.status !== 'LOCKED' && stage.status !== 'COMPLETED');
                    const docs = documentsForStudent(student.studentNumber);
                    return (
                      <tr key={student._id} className={eligible ? 'hover:bg-slate-50' : 'bg-slate-50/60'}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(student._id)}
                            disabled={!eligible || processing}
                            onChange={() => toggleStudent(student)}
                            className="h-4 w-4 rounded border-slate-300"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-black text-slate-900">{studentName(student)}</div>
                          <div className="mt-0.5 text-[10px] text-slate-500">{student.email}</div>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-600">{student.studentNumber}</td>
                        <td className="px-4 py-3 font-semibold text-slate-700">{student.specialty || student.studyYear || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={'inline-flex rounded-full px-2 py-1 text-[9px] font-black ' + stageStatusClass(stage?.status)}>
                            {stage?.status || 'Unavailable'}
                          </span>
                        </td>
                        {stageKey !== 'AZAAM_REVIEW' && (
                          <td className="px-4 py-3">
                            <span className={
                              'text-[10px] font-black ' +
                              (docs.length ? 'text-emerald-700' : 'text-slate-400')
                            }>
                              {docs.length ? docs.length + ' file(s)' : 'No ZIP file'}
                            </span>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {batchId && students.length > 0 && (
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4">
            <h2 className="font-black text-slate-950">Bulk Action Setup</h2>
            <p className="mt-1 text-xs text-slate-500">
              Configure once, then apply the action to all selected eligible students.
            </p>
          </div>

          {stageKey === 'AZAAM_REVIEW' ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-700" />
                <div>
                  <div className="text-sm font-black text-emerald-950">Approve selected students</div>
                  <p className="mt-1 text-xs leading-5 text-emerald-800">
                    Every selected student will be approved against the currently selected batch.
                    Students whose review is already completed or still locked are excluded automatically.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {(stageKey === 'PERMIT' || stageKey === 'VISA' || stageKey === 'RESIDENCE') && (
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="cursor-pointer rounded-2xl border border-dashed border-blue-300 bg-blue-50/60 p-4">
                    <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Shared Document
                    </div>
                    <p className="mt-1 text-[11px] leading-5 text-slate-500">
                      Use this when the same official document applies to every selected student.
                    </p>
                    <div className="mt-3 rounded-xl bg-white px-3 py-2.5 text-center text-xs font-black text-blue-700">
                      {sharedFile?.name || 'Choose Shared File'}
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      disabled={processing}
                      onChange={(event) => setSharedFile(event.target.files?.[0] || null)}
                    />
                  </label>

                  <label className="cursor-pointer rounded-2xl border border-dashed border-violet-300 bg-violet-50/60 p-4">
                    <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                      <Upload className="h-5 w-5 text-violet-600" />
                      Per-Student ZIP
                    </div>
                    <p className="mt-1 text-[11px] leading-5 text-slate-500">
                      ZIP documents override the shared file for matching student IDs.
                    </p>
                    <div className="mt-3 rounded-xl bg-white px-3 py-2.5 text-center text-xs font-black text-violet-700">
                      {readingZip ? 'Reading ZIP...' : zipFileName || 'Choose ZIP File'}
                    </div>
                    <input
                      type="file"
                      accept=".zip,application/zip"
                      className="hidden"
                      disabled={processing || readingZip}
                      onChange={(event) => void parseZip(event.target.files?.[0] || null)}
                    />
                  </label>
                </div>
              )}

              {(stageKey === 'TRANSPORT' || stageKey === 'PLACEMENT') && (
                <label className="block cursor-pointer rounded-2xl border border-dashed border-violet-300 bg-violet-50/60 p-4">
                  <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                    <Upload className="h-5 w-5 text-violet-600" />
                    {stageKey === 'TRANSPORT' ? 'Arrival Evidence ZIP' : 'Placement Evidence ZIP'}
                  </div>
                  <p className="mt-1 text-[11px] leading-5 text-slate-500">
                    Upload one image per student using the student ID in the filename.
                  </p>
                  <div className="mt-3 rounded-xl bg-white px-3 py-2.5 text-center text-xs font-black text-violet-700">
                    {readingZip ? 'Reading ZIP...' : zipFileName || 'Choose ZIP File'}
                  </div>
                  <input
                    type="file"
                    accept=".zip,application/zip"
                    className="hidden"
                    disabled={processing || readingZip}
                    onChange={(event) => void parseZip(event.target.files?.[0] || null)}
                  />
                </label>
              )}

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-[11px] leading-5 text-slate-600">
                <div className="font-black text-slate-900">ZIP naming for {stageLabel}</div>
                <p className="mt-1">
                  Use the student ID followed by the step name, for example
                  <span className="font-mono font-bold">
                    {' '}123456_{STAGE_FILE_SUFFIXES[stageKey][0] || 'DOCUMENT'}.pdf
                  </span>
                  {(stageKey === 'TRANSPORT' || stageKey === 'PLACEMENT') && ' (JPG/PNG/WEBP image)'}.
                </p>
              </div>

              {zipWarnings.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[11px] text-amber-800">
                  <div className="font-black">ZIP warnings</div>
                  <ul className="mt-1 list-disc space-y-1 pl-4">
                    {zipWarnings.slice(0, 6).map((warning, index) => <li key={index}>{warning}</li>)}
                  </ul>
                </div>
              )}

              {stageKey === 'PLACEMENT' && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <label>
                    <span className="mb-1.5 block text-[11px] font-black text-slate-500">Hospital *</span>
                    <select
                      value={placement.organizationId}
                      onChange={(event) =>
                        setPlacement((current) => ({
                          ...current,
                          organizationId: event.target.value,
                          departmentId: '',
                          supervisorId: '',
                        }))
                      }
                      className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800"
                    >
                      <option value="">Select hospital</option>
                      {hospitals.map((hospital) => (
                        <option key={hospital._id} value={hospital._id}>{hospital.name}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span className="mb-1.5 block text-[11px] font-black text-slate-500">Department</span>
                    <select
                      value={placement.departmentId}
                      onChange={(event) =>
                        setPlacement((current) => ({ ...current, departmentId: event.target.value }))
                      }
                      disabled={!placement.organizationId}
                      className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 disabled:bg-slate-50"
                    >
                      <option value="">Optional</option>
                      {departments.map((department) => (
                        <option key={department._id} value={department._id}>{department.name}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span className="mb-1.5 block text-[11px] font-black text-slate-500">Supervisor</span>
                    <select
                      value={placement.supervisorId}
                      onChange={(event) =>
                        setPlacement((current) => ({ ...current, supervisorId: event.target.value }))
                      }
                      disabled={!placement.organizationId}
                      className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 disabled:bg-slate-50"
                    >
                      <option value="">Optional</option>
                      {supervisors.map((supervisor: any) => {
                        const user = supervisor.userId || {};
                        const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'Supervisor';
                        return <option key={supervisor._id} value={supervisor._id}>{name}</option>;
                      })}
                    </select>
                  </label>

                  <label>
                    <span className="mb-1.5 block text-[11px] font-black text-slate-500">Start Date *</span>
                    <input
                      type="date"
                      value={placement.startDate}
                      onChange={(event) =>
                        setPlacement((current) => ({ ...current, startDate: event.target.value }))
                      }
                      className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800"
                    />
                  </label>

                  <label>
                    <span className="mb-1.5 block text-[11px] font-black text-slate-500">End Date *</span>
                    <input
                      type="date"
                      value={placement.endDate}
                      onChange={(event) =>
                        setPlacement((current) => ({ ...current, endDate: event.target.value }))
                      }
                      className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800"
                    />
                  </label>
                </div>
              )}

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-black text-slate-500">Batch Note</span>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Optional note applied to selected students"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500"
                />
              </label>
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs font-bold text-slate-500">
              {selectedStudents.length} student{selectedStudents.length === 1 ? '' : 's'} selected
            </div>
            <button
              type="button"
              onClick={() => void processBulk()}
              disabled={processing || readingZip || selectedStudents.length === 0}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 px-5 text-sm font-black text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />}
              {processing
                ? 'Processing Batch...'
                : stageKey === 'AZAAM_REVIEW'
                  ? 'Approve Selected'
                  : stageKey === 'PLACEMENT'
                    ? 'Confirm Placements'
                    : 'Complete Selected Step'}
            </button>
          </div>
        </section>
      )}

      {results.length > 0 && (
        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-black text-slate-950">Batch Processing Result</h2>
              <p className="mt-1 text-xs text-slate-500">Only failed students need individual attention.</p>
            </div>
            <div className="flex gap-2 text-xs font-black">
              <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-emerald-700">{completedResults} completed</span>
              <span className="rounded-full bg-rose-100 px-3 py-1.5 text-rose-700">{failedResults} failed</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {results.map((result) => (
              <div
                key={result.studentId}
                className={
                  'flex flex-col gap-2 rounded-2xl border p-3 sm:flex-row sm:items-center sm:justify-between ' +
                  (result.ok
                    ? 'border-emerald-200 bg-emerald-50/60'
                    : 'border-rose-200 bg-rose-50/60')
                }
              >
                <div className="flex items-center gap-3">
                  {result.ok
                    ? <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    : <XCircle className="h-5 w-5 text-rose-600" />}
                  <div>
                    <div className="text-xs font-black text-slate-900">{result.name}</div>
                    <div className="text-[10px] font-mono text-slate-500">{result.studentNumber}</div>
                  </div>
                </div>
                <div className={'text-[11px] font-bold ' + (result.ok ? 'text-emerald-700' : 'text-rose-700')}>
                  {result.message}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
