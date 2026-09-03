import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/frontend';
import { RealDataStore, RealTrainee } from '../services/realDataStore';
import {
  FileText,
  Building,
  Users,
  CheckSquare,
  BookOpen,
  Award,
  ShieldCheck,
  GraduationCap,
  Building2,
  UserCheck,
  Plus,
  ArrowUpRight,
  Sparkles,
  Plane,
  FileCheck2,
  DollarSign,
  UserPlus,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Stethoscope,
  QrCode,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const partnerName = user?.organizationName || 'Faculty of Medicine';
  const [trainees, setTrainees] = useState<RealTrainee[]>([]);
  const [invoices, setInvoices] = useState(RealDataStore.getInvoices());
  const [mouConfig, setMouConfig] = useState(RealDataStore.getMouConfig(partnerName));

  useEffect(() => {
    setTrainees(RealDataStore.getTrainees());
    setInvoices(RealDataStore.getInvoices());
    setMouConfig(RealDataStore.getMouConfig(partnerName));
  }, [partnerName]);

  if (!user) return null;

  const role = user.roles[0] || UserRole.STUDENT;

  // Real Dynamic Calculations
  const quotaUsed = trainees.length;
  const totalQuota = mouConfig.annualQuota || 60;
  const internationalCount = trainees.filter((t) => t.visaStatus !== 'NOT_REQUIRED').length;
  const activeRotationsCount = trainees.filter((t) => t.hospitalPlacementStatus === 'CONFIRMED' && !t.certificateIssued).length;
  const totalBilled = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const totalBalance = invoices.reduce((sum, inv) => sum + inv.balanceAmount, 0);

  // 1. UNIVERSITY PORTAL VIEW (UNIVERSITY_ADMIN / UNIVERSITY_STAFF)
  if (role === UserRole.UNIVERSITY_ADMIN || role === UserRole.UNIVERSITY_STAFF) {
    return (
      <div className="space-y-8">
        {/* University Header Banner */}
        <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-sky-500/20 text-sky-300 font-bold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-sky-400/30">
                University Academic Portal
              </span>
              {mouConfig.isSigned ? (
                <span className="bg-emerald-500/20 text-emerald-300 font-semibold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-emerald-400/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Verified Bilateral MoU Partner (Signed)
                </span>
              ) : (
                <span className="bg-amber-500/20 text-amber-300 font-semibold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-amber-400/30 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  MoU Pending Signature
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {user.firstName} • {partnerName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Manage medical student attachments, track visa logistics, monitor hospital rotations, supervisor
              evaluations, logbook sign-offs, and institutional financial accounts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur p-4 rounded-xl border border-white/10 text-center min-w-28">
              <span className="block text-2xl font-bold text-white">
                {quotaUsed} / {totalQuota}
              </span>
              <span className="text-[10px] text-sky-200 uppercase tracking-wider font-semibold">
                MoU Quota Used
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur p-4 rounded-xl border border-white/10 text-center min-w-28">
              <span className="block text-2xl font-bold text-emerald-400">
                {trainees.length > 0 ? `${trainees.length} Active` : '0 Trainees'}
              </span>
              <span className="text-[10px] text-emerald-200 uppercase tracking-wider font-semibold">
                Enrolled Students
              </span>
            </div>
          </div>
        </div>

        {/* Step-by-Step Onboarding Guidance if MoU not signed */}
        {!mouConfig.isSigned && (
          <div className="bg-amber-50 border-2 border-amber-400/40 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-amber-500 text-white rounded-xl shrink-0">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-amber-950 text-sm">
                  Step 1: Sign Institutional Bilateral MoU Agreement
                </h3>
                <p className="text-xs text-amber-800 mt-1 max-w-2xl leading-relaxed">
                  Signing the Bilateral MoU unlocks your university's annual training quota ({totalQuota} Student slots)
                  and enables official hospital department rotations. Once signed, you can immediately begin nominating students.
                </p>
              </div>
            </div>
            <Link
              to="/university/mou"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md transition shrink-0"
            >
              <span>✍️ Sign Bilateral MoU</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* University Quick Action Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Sparkles className="w-4 h-4 text-sky-600" />
            <span>University Quick Workflows:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={mouConfig.isSigned ? "/university/students" : "/university/mou"}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs ${
                mouConfig.isSigned
                  ? 'bg-sky-600 hover:bg-sky-700 text-white'
                  : 'bg-amber-600 hover:bg-amber-700 text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{mouConfig.isSigned ? 'Nominate & Dispatch Student' : '1. Sign MoU to Nominate Students'}</span>
            </Link>
            <Link
              to="/university/students"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition"
            >
              <Plane className="w-3.5 h-3.5 text-indigo-600" />
              <span>Track Trainees (A to Z)</span>
            </Link>
            <Link
              to="/university/mou"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Bilateral MoU Agreement</span>
            </Link>
            <Link
              to="/university/financials"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition"
            >
              <DollarSign className="w-3.5 h-3.5 text-amber-600" />
              <span>Placement Invoices & Balance</span>
            </Link>
          </div>
        </div>

        {/* University Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Dispatched Medical Students</span>
              <Users className="w-4 h-4 text-sky-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{trainees.length}</p>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Real Trainee Database</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>International Visa Pipeline</span>
              <Plane className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold text-indigo-700">{internationalCount} Trainees</p>
            <div className="text-[11px] text-slate-500">
              <span>Embassy Facilitation</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Active in Hospital Rotations</span>
              <Building2 className="w-4 h-4 text-teal-600" />
            </div>
            <p className="text-2xl font-bold text-teal-700">{activeRotationsCount}</p>
            <div className="text-[11px] text-emerald-600 font-semibold">
              <span>Clinical Postings</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Financials (Paid vs Outstanding)</span>
              <DollarSign className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">
              ${totalPaid.toLocaleString()} / ${totalBilled.toLocaleString()}
            </p>
            <div className="text-[11px] text-amber-700 font-semibold">
              <span>${totalBalance.toLocaleString()} Remaining Balance</span>
            </div>
          </div>
        </div>

        {/* Live A-to-Z Trainee Journey Stream */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                End-to-End Trainee Clinical Pipeline (A to Z)
              </h3>
              <p className="text-xs text-slate-500">
                Real-time tracking of admission, visa, hospital ward, supervisor, logbook points, and certification
              </p>
            </div>
            <Link
              to="/university/students"
              className="text-xs text-sky-600 hover:text-sky-800 font-bold inline-flex items-center gap-1"
            >
              <span>View / Add Trainees</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {trainees.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-3">
              <Users className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800">No Trainees Registered Yet</p>
                <p className="text-xs text-slate-500">
                  All previous sample placeholders have been cleared. Nominate your real medical students to begin tracking.
                </p>
              </div>
              <Link
                to="/university/students"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Nominate Student Now</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Student</th>
                    <th className="p-3.5">Specialty & Hospital</th>
                    <th className="p-3.5">Visa Status</th>
                    <th className="p-3.5">Assigned Preceptor</th>
                    <th className="p-3.5">Attendance & Logbook</th>
                    <th className="p-3.5">Clinical Grade</th>
                    <th className="p-3.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {trainees.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5">
                        <span className="font-bold text-slate-900 block">{row.studentName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{row.studentId}</span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-semibold text-slate-800 block">{row.specialty}</span>
                        <span className="text-[10px] text-slate-500">{row.targetHospital}</span>
                      </td>
                      <td className="p-3.5">
                        {row.visaStatus === 'NOT_REQUIRED' && (
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-semibold">
                            Domestic
                          </span>
                        )}
                        {row.visaStatus === 'GRANTED' && (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                            Visa Granted
                          </span>
                        )}
                        {row.visaStatus === 'APPLIED' && (
                          <span className="bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                            Visa Applied
                          </span>
                        )}
                        {row.visaStatus === 'EMBASSY_PROCESSING' && (
                          <span className="bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                            Embassy Vetting
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-800">{row.assignedSupervisor.name}</td>
                      <td className="p-3.5">
                        <span className="font-semibold text-slate-800 block">{row.attendancePercent}% Attendance</span>
                        <span className="text-[10px] text-emerald-600">
                          {row.logbookProceduresSigned} / {row.logbookRequired} Logged
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold">
                          {row.evaluationGrade || 'In Rotation'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {row.certificateIssued ? (
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            Certified
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-medium">
                            Active
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MoU & Financials Dual Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-sky-600" />
                <span>Bilateral MoU Status</span>
              </h4>
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded">
                Protocol: AZAAM-MOU-2025
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Valid framework agreement. Provides quota reservations across partner teaching hospitals in Somalia,
              Kenya, Turkey, and Uganda with guaranteed supervisor allocation and electronic logbook certification.
            </p>
            <div className="pt-2">
              <Link
                to="/university/mou"
                className="text-xs text-sky-600 hover:text-sky-800 font-bold inline-flex items-center gap-1"
              >
                <span>Read Full MoU Agreement & Clauses</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Placement Financials & Billing</span>
              </h4>
              <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded">
                Outstanding: ${totalBalance.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Total Invoiced: <strong>${totalBilled.toLocaleString()}</strong> • Paid by University:{' '}
              <strong className="text-emerald-700">${totalPaid.toLocaleString()}</strong>.
              Detailed per-student invoices and fee receipts are available in financials.
            </p>
            <div className="pt-2">
              <Link
                to="/university/financials"
                className="text-xs text-sky-600 hover:text-sky-800 font-bold inline-flex items-center gap-1"
              >
                <span>View Invoices & Billing Details</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. CLINICAL SUPERVISOR PORTAL VIEW
  if (role === UserRole.CLINICAL_SUPERVISOR) {
    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-sky-950 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="bg-teal-500/20 text-teal-300 font-bold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-teal-400/30">
              Clinical Preceptor & Supervisor Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Dr. {user.firstName} {user.lastName} • Consultant Preceptor
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Conduct bedside teaching, review electronic student logbooks, verify clinical attendance, and submit
              official evaluation grades and competency points.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur p-4 rounded-xl border border-white/10 text-center min-w-28">
              <span className="block text-2xl font-bold text-white">{trainees.length}</span>
              <span className="text-[10px] text-teal-200 uppercase tracking-wider font-semibold">
                Assigned Trainees
              </span>
            </div>
          </div>
        </div>

        {/* Supervisor Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/dashboard/logbooks"
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-teal-500 shadow-xs space-y-2 transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm group-hover:text-teal-700 transition">
              Review Digital Logbooks
            </h3>
            <p className="text-xs text-slate-500">Sign off surgeries, patient ward cases, and procedures</p>
          </Link>

          <Link
            to="/dashboard/attendance"
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-sky-500 shadow-xs space-y-2 transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold">
              <CheckSquare className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm group-hover:text-sky-700 transition">
              Verify Daily Attendance
            </h3>
            <p className="text-xs text-slate-500">Scan QR codes or mark daily clinical ward presence</p>
          </Link>

          <Link
            to="/dashboard/evaluations"
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-amber-500 shadow-xs space-y-2 transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm group-hover:text-amber-700 transition">
              Clinical Evaluations & Grading
            </h3>
            <p className="text-xs text-slate-500">Submit points (out of 100) and final competency remarks</p>
          </Link>
        </div>
      </div>
    );
  }

  // 3. STUDENT PORTAL VIEW (STUDENT / INDEPENDENT_APPLICANT)
  if (role === UserRole.STUDENT || role === UserRole.INDEPENDENT_APPLICANT) {
    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-sky-950 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="bg-indigo-500/20 text-indigo-300 font-bold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-indigo-400/30">
              Medical Student Attachment Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hello, {user.firstName}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Track your clinical rotation, log surgical procedures, record your daily hospital ward attendance, and
              view verified certificates.
            </p>
          </div>
        </div>

        {/* Student Quick Action Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/dashboard/placements"
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-500 shadow-xs space-y-2 transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-700 transition">
              My Hospital Placement
            </h3>
            <p className="text-xs text-slate-500">View assigned hospital, department, and consultant preceptor</p>
          </Link>

          <Link
            to="/dashboard/attendance"
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-sky-500 shadow-xs space-y-2 transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold">
              <CheckSquare className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm group-hover:text-sky-700 transition">
              Daily Ward Attendance
            </h3>
            <p className="text-xs text-slate-500">Check in to clinical rotations and track attendance records</p>
          </Link>

          <Link
            to="/dashboard/logbooks"
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-teal-500 shadow-xs space-y-2 transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm group-hover:text-teal-700 transition">
              Digital Procedure Logbook
            </h3>
            <p className="text-xs text-slate-500">Log clinical procedures and request preceptor sign-offs</p>
          </Link>

          <Link
            to="/dashboard/certificates"
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-amber-500 shadow-xs space-y-2 transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm group-hover:text-amber-700 transition">
              Verified Certificate
            </h3>
            <p className="text-xs text-slate-500">Download accredited clinical completion certificate & transcript</p>
          </Link>
        </div>
      </div>
    );
  }

  // Fallback / Admin redirect or view
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900">Welcome to AZAAM Medics Network</h1>
        <p className="text-xs text-slate-500 mt-1">Select an item from the sidebar navigation to begin.</p>
      </div>
    </div>
  );
};
