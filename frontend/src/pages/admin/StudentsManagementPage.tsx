import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  GraduationCap,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Plane,
  Award,
  ChevronRight,
  Eye,
  FileCheck,
  Stethoscope,
  Sparkles,
  ExternalLink,
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

  // Filters
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
      setStudents(res.students);
      setTotal(res.pagination.total);
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

  // Metrics
  const activeCount = students.filter((s) => s.status === 'ACTIVE').length;
  const internationalCount = students.filter((s) => s.visaStatus !== 'NOT_REQUIRED').length;
  const completedCount = students.filter((s) => s.certificateIssued || s.status === 'COMPLETED').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Trainees Management"
        description="Comprehensive super admin monitoring for all medical students, university nominations, hospital rotations, and lifecycle journeys."
        action={
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold px-3 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-lg">
              Total Enrolled: {total}
            </span>
          </div>
        }
      />

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase">Total Students</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">{total}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Across all accredited partner universities</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase">Active In Hospital</span>
            <Stethoscope className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-700 mt-1">{activeCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Under active clinical rotation</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase">International</span>
            <Plane className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-indigo-700 mt-1">{internationalCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Visa & residency coordinated</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase">Certified Graduates</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{completedCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Verified clinical competency</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="flex items-center space-x-2 flex-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search student by name, student ID, university, hospital or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
          >
            Filter
          </button>
        </form>

        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Rotations</option>
              <option value="PENDING">Pending Placements</option>
              <option value="COMPLETED">Graduated / Certified</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-medium">Immigration:</span>
            <select
              value={visaFilter}
              onChange={(e) => {
                setVisaFilter(e.target.value);
                setPage(1);
              }}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            >
              <option value="ALL">All Trainees</option>
              <option value="NOT_REQUIRED">Local (No Visa)</option>
              <option value="GRANTED">Visa Granted</option>
              <option value="EMBASSY_PROCESSING">Embassy Processing</option>
              <option value="APPLIED">Visa Applied</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table & Content */}
      {loading ? (
        <LoadingState message="Loading student records..." />
      ) : error ? (
        <ErrorState message={error} />
      ) : students.length === 0 ? (
        <EmptyState
          title="No Students Found"
          description="No students matched your search criteria. Try modifying your filter options."
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Student & ID</th>
                  <th className="px-4 py-3">University</th>
                  <th className="px-4 py-3">Hospital & Specialty</th>
                  <th className="px-4 py-3">Immigration & Fees</th>
                  <th className="px-4 py-3">Clinical Progress</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student._id} className="hover:bg-slate-50/60 transition group">
                    {/* Student Info */}
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs shrink-0">
                          {student.firstName[0]}
                          {student.lastName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-teal-700 transition">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono">{student.studentNumber}</p>
                          <p className="text-[11px] text-slate-400">{student.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* University */}
                    <td className="px-4 py-3">
                      <div className="flex items-start space-x-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-slate-800">{student.university.name}</p>
                          <p className="text-[11px] text-slate-500">{student.studyYear}</p>
                        </div>
                      </div>
                    </td>

                    {/* Hospital & Specialty */}
                    <td className="px-4 py-3">
                      <div className="flex items-start space-x-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-slate-800">{student.hospitalPlacement.name}</p>
                          <p className="text-[11px] text-teal-700 font-medium">{student.specialty}</p>
                          {student.assignedSupervisor && (
                            <p className="text-[10px] text-slate-500">Sup: {student.assignedSupervisor.name}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Visa & Fees */}
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div>
                          {student.visaStatus === 'NOT_REQUIRED' ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                              Local National
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              Visa: {student.visaStatus.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Tuition: <span className="font-semibold text-slate-700">${student.paidFees} / ${student.totalFees}</span>
                        </div>
                      </div>
                    </td>

                    {/* Progress */}
                    <td className="px-4 py-3">
                      <div className="space-y-1 w-32">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500">Attendance</span>
                          <span className="font-bold text-slate-800">{student.attendancePercent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-teal-600 h-1.5 rounded-full"
                            style={{ width: `${Math.min(student.attendancePercent, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Logbook:</span>
                          <span className="font-medium text-slate-600">
                            {student.logbookSigned} / {student.logbookRequired}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <StatusBadge status={student.status} />
                        {student.certificateIssued && (
                          <div className="flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            <Award className="w-3 h-3 text-emerald-600" />
                            <span>Certified</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/admin/students/${student._id}`}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 rounded-lg font-semibold transition text-xs shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Full Journey</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
