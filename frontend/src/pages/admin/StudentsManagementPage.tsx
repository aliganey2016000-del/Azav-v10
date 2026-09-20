import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Building2,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  GraduationCap,
  Plane,
  Search,
  Stethoscope,
  Users,
} from 'lucide-react';
import { AdminApiService } from '../../services/admin.service';
import { AdminStudent, AdminUniversity } from '../../types/admin.types';
import { PageHeader } from '../../components/admin/PageHeader';
import { StatusBadge } from '../../components/admin/Badge';
import { LoadingState, EmptyState, ErrorState } from '../../components/admin/States';

export const StudentsManagementPage: React.FC = () => {
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [universities, setUniversities] = useState<AdminUniversity[]>([]);
  const [universityFilter, setUniversityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [createdDateFilter, setCreatedDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await AdminApiService.getStudents({
        page,
        limit,
        search: searchQuery,
        universityId: universityFilter === 'ALL' ? undefined : universityFilter,
        status: statusFilter,
        createdDate: createdDateFilter || undefined,
      });
      setStudents(res.students || []);
      setTotal(res.pagination?.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load trainees registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    AdminApiService.getUniversities({ page: 1, limit: 100 })
      .then((res) =>
        setUniversities(
          (res.universities || []).sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
        )
      )
      .catch(() => setUniversities([]));
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [page, universityFilter, statusFilter, createdDateFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchStudents();
  };

  const activeCount = students.filter((s) => Boolean(s.hospitalPlacement?._id)).length;
  const internationalCount = students.filter((s) => s.visaStatus !== 'NOT_REQUIRED').length;
  const completedCount = students.filter((s) => s.certificateIssued || s.status === 'COMPLETED').length;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const kpis = [
    {
      label: 'Total Students',
      value: total,
      helper: 'Partner universities',
      Icon: Users,
      iconClass: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300',
      valueClass: 'text-slate-950 dark:text-white',
    },
    {
      label: 'Active in Hospital',
      value: activeCount,
      helper: 'Clinical rotation',
      Icon: Stethoscope,
      iconClass: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
      valueClass: 'text-blue-700 dark:text-blue-300',
    },
    {
      label: 'International',
      value: internationalCount,
      helper: 'Visa coordinated',
      Icon: Plane,
      iconClass: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
      valueClass: 'text-violet-700 dark:text-violet-300',
    },
    {
      label: 'Certified',
      value: completedCount,
      helper: 'Graduates',
      Icon: Award,
      iconClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
      valueClass: 'text-emerald-700 dark:text-emerald-300',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Student Trainees Management"
        description="Comprehensive super admin monitoring for medical students, university nominations, hospital rotations, and lifecycle journeys."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/admin/bulk-journey"
              className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 px-3 text-xs font-extrabold text-white shadow-sm"
            >
              <CheckSquare className="h-4 w-4" />
              Bulk Journey
            </Link>
            <span className="inline-flex min-h-9 items-center rounded-xl border border-teal-200 bg-teal-50 px-3 text-xs font-extrabold text-teal-700 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-300">
              Total Enrolled: {total}
            </span>
          </div>
        }
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map(({ label, value, helper, Icon, iconClass, valueClass }) => (
          <div
            key={label}
            className="min-h-[112px] rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#0f1b2d]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 sm:text-[11px]">
                  {label}
                </p>
                <p className={'mt-2 text-3xl font-extrabold tracking-tight ' + valueClass}>{value}</p>
                <p className="mt-1 truncate text-[10px] text-slate-500 dark:text-slate-400 sm:text-[11px]">
                  {helper}
                </p>
              </div>
              <div className={'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ' + iconClass}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-[#0f1b2d] sm:p-4">
        <form onSubmit={handleSearch} className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, student ID, university or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 dark:border-slate-700 dark:bg-slate-900/70 dark:text-white dark:placeholder:text-slate-500"
            />
          </div>
          <button
            type="submit"
            className="h-12 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 px-5 text-sm font-extrabold text-white shadow-sm transition hover:from-teal-700 hover:to-emerald-600"
          >
            Search
          </button>
        </form>

        <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
          <select
            value={universityFilter}
            onChange={(e) => {
              setUniversityFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by university"
            className="h-11 min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
          >
            <option value="ALL">All Universities</option>
            {universities.map((university) => (
              <option key={university._id} value={university._id}>
                {university.name}{university.code ? ' · ' + university.code : ''}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter student status"
            className="h-11 min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="INACTIVE">Rejected / Inactive</option>
          </select>

          <label className="relative">
            <span className="pointer-events-none absolute left-3 top-1.5 text-[9px] font-extrabold uppercase tracking-wide text-slate-400">
              Created Date
            </span>
            <input
              type="date"
              value={createdDateFilter}
              onChange={(e) => {
                setCreatedDateFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by created date"
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 pt-3 text-xs font-bold text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
            />
          </label>
        </div>
      </section>

      {loading ? (
        <LoadingState message="Loading student records..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchStudents} />
      ) : students.length === 0 ? (
        <EmptyState
          title="No Students Found"
          description="No students matched your search criteria. Try modifying your filters."
        />
      ) : (
        <>
          <section className="space-y-3 md:hidden">
            {students.map((student) => (
              <article
                key={student._id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0f1b2d]"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-extrabold text-teal-800 dark:bg-teal-500/15 dark:text-teal-300">
                        {student.firstName?.[0] || 'S'}
                        {student.lastName?.[0] || ''}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-extrabold text-slate-950 dark:text-white">
                          {student.firstName} {student.lastName}
                        </h3>
                        <p className="mt-0.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {student.studentNumber}
                        </p>
                        <p className="truncate text-[11px] text-slate-400 dark:text-slate-500">
                          {student.email}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={student.status} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2.5">
                    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900/60">
                      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
                        <GraduationCap className="h-3.5 w-3.5" />
                        University
                      </div>
                      <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                        {student.university?.name || '—'}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                        {student.studyYear || '—'}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900/60">
                      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
                        <Building2 className="h-3.5 w-3.5" />
                        Placement
                      </div>
                      <p className={
                        'line-clamp-2 text-xs font-extrabold ' +
                        (student.hospitalPlacement?._id
                          ? 'text-slate-800 dark:text-slate-100'
                          : 'text-amber-700 dark:text-amber-300')
                      }>
                        {student.hospitalPlacement?._id
                          ? student.hospitalPlacement.name
                          : 'Pending AZAAM placement'}
                      </p>
                      <p className="mt-0.5 text-[11px] font-bold text-teal-700 dark:text-teal-300">
                        {student.specialty || '—'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50/70 p-3 dark:border-violet-500/20 dark:bg-violet-500/10">
                    <div className="text-[10px] font-extrabold uppercase tracking-wide text-violet-500">
                      Nomination Batch
                    </div>
                    <div className="mt-1 text-xs font-extrabold text-violet-800 dark:text-violet-200">
                      {student.batch?.batchNumber || 'Legacy / No Batch'}
                    </div>
                    {student.batch?.name && (
                      <div className="mt-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        {student.batch.name}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <FileText className="h-4 w-4 text-indigo-500" />
                      <span>{student.documentsCount || 0} document(s)</span>
                    </div>
                    {student.certificateIssued && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-extrabold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                        <Award className="h-3 w-3" /> Certified
                      </span>
                    )}
                  </div>
                </div>

                <Link
                  to={'/admin/students/' + student._id}
                  className="flex min-h-12 items-center justify-center gap-2 border-t border-slate-100 bg-teal-50 px-4 text-sm font-extrabold text-teal-700 transition active:bg-teal-100 dark:border-slate-800 dark:bg-teal-500/10 dark:text-teal-300"
                >
                  <Eye className="h-4 w-4" />
                  Full Journey
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </section>

          <section className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0f1b2d] md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[940px] text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Student & ID</th>
                    <th className="px-4 py-3">University</th>
                    <th className="px-4 py-3">Batch</th>
                    <th className="px-4 py-3">Hospital & Specialty</th>
                    <th className="px-4 py-3">Documents</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {students.map((student) => (
                    <tr key={student._id} className="transition hover:bg-slate-50/70 dark:hover:bg-slate-900/40">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-extrabold text-teal-800 dark:bg-teal-500/15 dark:text-teal-300">
                            {student.firstName?.[0] || 'S'}{student.lastName?.[0] || ''}
                          </div>
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-950 dark:text-white">{student.firstName} {student.lastName}</p>
                            <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">{student.studentNumber}</p>
                            <p className="max-w-[180px] truncate text-[11px] text-slate-400">{student.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-start gap-1.5">
                          <GraduationCap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-100">{student.university?.name || '—'}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{student.studyYear || '—'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-start gap-1.5">
                          <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <div>
                            <p className={
                              'max-w-[220px] font-bold ' +
                              (student.hospitalPlacement?._id
                                ? 'text-slate-800 dark:text-slate-100'
                                : 'text-amber-700 dark:text-amber-300')
                            }>
                              {student.hospitalPlacement?._id
                                ? student.hospitalPlacement.name
                                : 'Pending AZAAM placement'}
                            </p>
                            <p className="text-[11px] font-bold text-teal-700 dark:text-teal-300">{student.specialty || '—'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2 py-1 text-[11px] font-extrabold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                          <FileText className="h-3.5 w-3.5" />
                          {student.documentsCount || 0}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <StatusBadge status={student.status} />
                      </td>

                      <td className="px-4 py-4 text-right">
                        <Link
                          to={'/admin/students/' + student._id}
                          className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 font-extrabold text-teal-700 transition hover:bg-teal-100 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-300"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Full Journey
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {totalPages > 1 && (
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm dark:border-slate-800 dark:bg-[#0f1b2d]">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
