import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Building2,
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
import { AdminStudent } from '../../types/admin.types';
import { PageHeader } from '../../components/admin/PageHeader';
import { StatusBadge } from '../../components/admin/Badge';
import { LoadingState, EmptyState, ErrorState } from '../../components/admin/States';

export const StudentsManagementPage: React.FC = () => {
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [visaFilter, setVisaFilter] = useState('ALL');
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
        status: statusFilter,
        visaStatus: visaFilter,
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
    fetchStudents();
  }, [page, statusFilter, visaFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchStudents();
  };

  const activeCount = students.filter((s) => s.status === 'ACTIVE').length;
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
          <span className="inline-flex min-h-9 items-center rounded-xl border border-teal-200 bg-teal-50 px-3 text-xs font-extrabold text-teal-700 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-300">
            Total Enrolled: {total}
          </span>
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

        <div className="mt-3 grid grid-cols-2 gap-2.5">
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
            <option value="ACTIVE">Active Rotations</option>
            <option value="PENDING">Pending Placements</option>
            <option value="COMPLETED">Graduated / Certified</option>
          </select>

          <select
            value={visaFilter}
            onChange={(e) => {
              setVisaFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter immigration status"
            className="h-11 min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200"
          >
            <option value="ALL">All Trainees</option>
            <option value="NOT_REQUIRED">Local / No Visa</option>
            <option value="GRANTED">Visa Granted</option>
            <option value="EMBASSY_PROCESSING">Embassy Processing</option>
            <option value="APPLIED">Visa Applied</option>
          </select>
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
                      <p className="line-clamp-2 text-xs font-extrabold text-slate-800 dark:text-slate-100">
                        {student.hospitalPlacement?.name || 'Pending AZAAM placement'}
                      </p>
                      <p className="mt-0.5 text-[11px] font-bold text-teal-700 dark:text-teal-300">
                        {student.specialty || '—'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-500 dark:text-slate-400">Clinical progress</span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-100">
                        {student.attendancePercent || 0}%
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500"
                        style={{ width: Math.min(student.attendancePercent || 0, 100) + '%' }}
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                      <span>Logbook: {student.logbookSigned || 0} / {student.logbookRequired || 0}</span>
                      <span>{student.visaStatus === 'NOT_REQUIRED' ? 'Local trainee' : 'Visa: ' + student.visaStatus.replaceAll('_', ' ')}</span>
                    </div>
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
              <table className="w-full min-w-[1080px] text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Student & ID</th>
                    <th className="px-4 py-3">University</th>
                    <th className="px-4 py-3">Hospital & Specialty</th>
                    <th className="px-4 py-3">Immigration & Fees</th>
                    <th className="px-4 py-3">Clinical Progress</th>
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
                            <p className="max-w-[200px] font-bold text-slate-800 dark:text-slate-100">{student.hospitalPlacement?.name || 'Pending AZAAM placement'}</p>
                            <p className="text-[11px] font-bold text-teal-700 dark:text-teal-300">{student.specialty || '—'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="space-y-1 text-[11px]">
                          <span className="inline-flex rounded-lg bg-slate-100 px-2 py-1 font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {student.visaStatus === 'NOT_REQUIRED' ? 'Local National' : 'Visa: ' + student.visaStatus.replaceAll('_', ' ')}
                          </span>
                          <p className="text-slate-500 dark:text-slate-400">
                            Tuition: <span className="font-bold text-slate-700 dark:text-slate-200">${student.paidFees || 0} / ${student.totalFees || 0}</span>
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="w-32 space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-500 dark:text-slate-400">Attendance</span>
                            <span className="font-extrabold text-slate-800 dark:text-slate-100">{student.attendancePercent || 0}%</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div className="h-full rounded-full bg-teal-600" style={{ width: Math.min(student.attendancePercent || 0, 100) + '%' }} />
                          </div>
                          <p className="text-[10px] text-slate-400">Logbook: {student.logbookSigned || 0} / {student.logbookRequired || 0}</p>
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
