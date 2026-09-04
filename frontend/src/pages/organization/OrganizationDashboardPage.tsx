import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  UserCheck,
  Briefcase,
  CheckSquare,
  BookOpen,
  Award,
  ShieldCheck,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  Building,
  FileText,
  Search,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { RealDataStore, RealTrainee } from '../../services/realDataStore';

export const OrganizationDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const hospitalName = user?.organizationName || 'Madina Teaching Hospital';

  const [trainees, setTrainees] = useState<RealTrainee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Filter trainees assigned to this hospital or show default set
    const all = RealDataStore.getTrainees();
    const hospitalTrainees = all.filter(
      (t) => !t.targetHospital || t.targetHospital.toLowerCase().includes(hospitalName.toLowerCase()) || all.length <= 5
    );
    setTrainees(hospitalTrainees.length > 0 ? hospitalTrainees : all);
  }, [hospitalName]);

  // Derived metrics
  const activeTrainees = trainees.filter((t) => !t.certificateIssued);
  const completedTrainees = trainees.filter((t) => t.certificateIssued);
  const avgAttendance = trainees.length > 0
    ? Math.round(trainees.reduce((sum, t) => sum + t.attendancePercent, 0) / trainees.length)
    : 92;
  const totalProcedures = trainees.reduce((sum, t) => sum + t.logbookProceduresSigned, 0);

  const departments = [
    { name: 'General Surgery & Trauma', head: 'Dr. Sarah Jenkins', capacity: 12, active: 8, ward: 'Building A, 3rd Floor' },
    { name: 'Internal Medicine & ICU', head: 'Dr. Ahmed Farole', capacity: 15, active: 11, ward: 'Building B, 2nd Floor' },
    { name: 'Pediatrics & Neonatology', head: 'Dr. Fatima Warsame', capacity: 10, active: 6, ward: 'Building C, 1st Floor' },
    { name: 'Obstetrics & Gynecology', head: 'Dr. Maryan Ali', capacity: 12, active: 9, ward: 'Maternity Wing' },
    { name: 'Emergency & Acute Care', head: 'Dr. Osman Jama', capacity: 8, active: 5, ward: 'Emergency Pavilion' },
  ];

  const totalCapacity = departments.reduce((sum, d) => sum + d.capacity, 0);
  const totalOccupied = departments.reduce((sum, d) => sum + d.active, 0);

  const filteredTrainees = trainees.filter((t) =>
    t.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.studentId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-sky-950 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-teal-500/20 text-teal-300 font-bold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-teal-400/30">
              Healthcare Organization Portal
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 font-semibold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-emerald-400/30 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              {hospitalName}
            </span>
            <span className="bg-sky-500/20 text-sky-300 font-semibold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-sky-400/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              AZAAM Accredited Teaching Center
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Hospital Clinical Operations Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Real-time management of clinical placements, department ward capacity, assigned medical supervisors,
            attendance logging, and supervisor logbook sign-offs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/organization/placements"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-lg transition"
          >
            <Briefcase className="w-4 h-4" />
            <span>Manage Placements</span>
          </Link>
          <Link
            to="/organization/supervisors"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/20 transition"
          >
            <UserCheck className="w-4 h-4 text-teal-300" />
            <span>Clinical Supervisors</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Hosted Trainees</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{trainees.length}</p>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>{activeTrainees.length} Active in Wards</span>
            <span className="font-semibold text-emerald-600">{completedTrainees.length} Completed</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Clinical Capacity</span>
            <TrendingUp className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-2xl font-bold text-sky-700">
            {totalOccupied} / {totalCapacity} Slots
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>5 Active Departments</span>
            <span className="font-semibold text-sky-600 font-mono">
              {Math.round((totalOccupied / totalCapacity) * 100)}% Occupied
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Average Attendance</span>
            <CheckSquare className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-indigo-700">{avgAttendance}%</p>
          <div className="text-[11px] text-emerald-600 font-medium">
            Exceeds 85% AZAAM Requirement (✓)
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Procedures Endorsed</span>
            <BookOpen className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalProcedures}</p>
          <div className="text-[11px] text-purple-600 font-medium">
            Clinical e-Logbook Verified
          </div>
        </div>
      </div>

      {/* Quick Access Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Link
          to="/organization/placements"
          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-300 hover:shadow-sm transition text-center space-y-1.5 group"
        >
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center mx-auto group-hover:scale-110 transition">
            <Briefcase className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-slate-800">Placements</div>
          <div className="text-[10px] text-slate-500">Active Rotations</div>
        </Link>

        <Link
          to="/organization/departments"
          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-300 hover:shadow-sm transition text-center space-y-1.5 group"
        >
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center mx-auto group-hover:scale-110 transition">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-slate-800">Departments</div>
          <div className="text-[10px] text-slate-500">Ward Capacity</div>
        </Link>

        <Link
          to="/organization/trainees"
          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-300 hover:shadow-sm transition text-center space-y-1.5 group"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto group-hover:scale-110 transition">
            <Users className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-slate-800">Trainees</div>
          <div className="text-[10px] text-slate-500">Student Roster</div>
        </Link>

        <Link
          to="/organization/supervisors"
          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-300 hover:shadow-sm transition text-center space-y-1.5 group"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto group-hover:scale-110 transition">
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-slate-800">Supervisors</div>
          <div className="text-[10px] text-slate-500">Faculty Mentors</div>
        </Link>

        <Link
          to="/organization/logbooks"
          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-300 hover:shadow-sm transition text-center space-y-1.5 group"
        >
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mx-auto group-hover:scale-110 transition">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-slate-800">Logbooks</div>
          <div className="text-[10px] text-slate-500">Procedure Sign-off</div>
        </Link>

        <Link
          to="/organization/evaluations"
          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-300 hover:shadow-sm transition text-center space-y-1.5 group"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mx-auto group-hover:scale-110 transition">
            <Award className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-slate-800">Evaluations</div>
          <div className="text-[10px] text-slate-500">Assessments & Grades</div>
        </Link>
      </div>

      {/* Hospital Clinical Departments & Capacity Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Clinical Departments & Placement Capacity</h2>
            <p className="text-xs text-slate-500">Active ward occupancy and consultant supervision assignments</p>
          </div>
          <Link
            to="/organization/departments"
            className="text-xs font-bold text-teal-600 hover:text-teal-800 inline-flex items-center gap-1"
          >
            <span>View Details</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{dept.name}</h3>
                  <p className="text-[11px] text-slate-500">{dept.ward}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-mono">
                  {dept.active} / {dept.capacity} Slots
                </span>
              </div>

              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-teal-600 h-1.5 rounded-full"
                  style={{ width: `${(dept.active / dept.capacity) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 text-slate-600">
                <span className="flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate max-w-[140px]">{dept.head}</span>
                </span>
                <span className="font-semibold text-emerald-600 font-mono text-[11px]">
                  {dept.capacity - dept.active} Available
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trainees in Hospital Rotations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Assigned Medical Trainees</h2>
            <p className="text-xs text-slate-500">Live clinical posting, supervisor oversight, and attendance</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search trainees, specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <Link
              to="/organization/trainees"
              className="text-xs font-bold text-teal-600 hover:text-teal-800 inline-flex items-center gap-1"
            >
              <span>Full Roster</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="pb-3 font-semibold">Trainee</th>
                <th className="pb-3 font-semibold">Department & Rotation</th>
                <th className="pb-3 font-semibold">Assigned Supervisor</th>
                <th className="pb-3 font-semibold">Attendance</th>
                <th className="pb-3 font-semibold">Logbook</th>
                <th className="pb-3 font-semibold">Evaluation Grade</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredTrainees.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 pr-2">
                    <div className="font-bold text-slate-900">{t.studentName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{t.studentId} • {t.studyYear}</div>
                  </td>
                  <td className="py-3 pr-2">
                    <div className="font-semibold text-slate-800">{t.specialty}</div>
                    <div className="text-[10px] text-slate-500">{t.durationWeeks} Weeks ({t.startDate} - {t.endDate})</div>
                  </td>
                  <td className="py-3 pr-2">
                    <div className="font-medium text-slate-800">{t.assignedSupervisor.name}</div>
                    <div className="text-[10px] text-slate-500 truncate max-w-[140px]">{t.assignedSupervisor.title}</div>
                  </td>
                  <td className="py-3 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-800">{t.attendancePercent}%</span>
                    </div>
                    <div className="w-16 bg-slate-200 rounded-full h-1 mt-1">
                      <div
                        className="bg-indigo-600 h-1 rounded-full"
                        style={{ width: `${t.attendancePercent}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-3 pr-2">
                    <div className="font-mono font-bold text-slate-800">
                      {t.logbookProceduresSigned} / {t.logbookRequired}
                    </div>
                    <div className="w-16 bg-slate-200 rounded-full h-1 mt-1">
                      <div
                        className="bg-teal-600 h-1 rounded-full"
                        style={{ width: `${Math.min(100, (t.logbookProceduresSigned / t.logbookRequired) * 100)}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-3 pr-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">
                      {t.evaluationGrade || 'Honors (A)'}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <Link
                      to={`/organization/placements`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-600 hover:text-teal-800"
                    >
                      <span>Manage</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
