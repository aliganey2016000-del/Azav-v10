import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  Building2,
  UserPlus,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  FileCheck2,
  DollarSign,
  Plane,
  ChevronRight,
  BookOpen,
  Award,
  Search,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { RealDataStore, RealTrainee, RealMouConfig, RealInvoice } from '../../services/realDataStore';

export const UniversityDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const partnerName = user?.organizationName || 'Faculty of Medicine & Health Sciences';

  const [trainees, setTrainees] = useState<RealTrainee[]>([]);
  const [invoices, setInvoices] = useState<RealInvoice[]>([]);
  const [mouConfig, setMouConfig] = useState<RealMouConfig>(() => RealDataStore.getMouConfig(partnerName));
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setTrainees(RealDataStore.getTrainees());
    setInvoices(RealDataStore.getInvoices());
    setMouConfig(RealDataStore.getMouConfig(partnerName));
  }, [partnerName]);

  // Derived metrics
  const totalEnrolled = trainees.length;
  const quotaUsed = totalEnrolled;
  const quotaTotal = mouConfig.annualQuota || 60;
  const internationalCount = trainees.filter((t) => t.visaStatus !== 'NOT_REQUIRED').length;
  const activeRotationsCount = trainees.filter(
    (t) => t.hospitalPlacementStatus === 'CONFIRMED' && !t.certificateIssued
  ).length;
  const completedCount = trainees.filter((t) => t.certificateIssued).length;

  const totalBilled = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
  const totalBalance = invoices.reduce((sum, inv) => sum + (inv.balanceAmount || 0), 0);

  const filteredTrainees = trainees.filter((t) =>
    t.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.targetHospital.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-sky-500/20 text-sky-300 font-bold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-sky-400/30">
              University Academic Portal
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 font-semibold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-emerald-400/30 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5" />
              {partnerName}
            </span>
            {mouConfig.isSigned ? (
              <span className="bg-indigo-500/20 text-indigo-300 font-semibold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-indigo-400/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                MoU Active ({quotaUsed} / {quotaTotal} Quota)
              </span>
            ) : (
              <span className="bg-amber-500/20 text-amber-300 font-semibold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-amber-400/30 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                MoU Pending Signature
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Academic Partner Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Oversight of nominated medical trainees, clinical hospital rotations, attendance compliance,
            e-logbook endorsements, and institutional financial accounts under AZAAM coordination.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/university/nominate-student"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-lg transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Nominate Student</span>
          </Link>
          <Link
            to="/university/mou"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/20 transition"
          >
            <FileCheck2 className="w-4 h-4 text-sky-300" />
            <span>Bilateral MoU</span>
          </Link>
        </div>
      </div>

      {/* MoU Alert Banner if not signed */}
      {!mouConfig.isSigned && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl shrink-0 mt-0.5">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-amber-950 text-sm">
                Institutional Bilateral MoU Signature Required
              </h3>
              <p className="text-xs text-amber-800 mt-1 max-w-2xl leading-relaxed">
                Unlock your university's annual clinical placement quota ({quotaTotal} student slots)
                and activate teaching hospital department access.
              </p>
            </div>
          </div>
          <Link
            to="/university/mou"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow transition shrink-0"
          >
            <span>Sign MoU Agreement</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Nominated Students</span>
            <Users className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalEnrolled}</p>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Quota: {quotaUsed} / {quotaTotal}</span>
            <span className="font-semibold text-emerald-600 font-mono">
              {Math.round((quotaUsed / quotaTotal) * 100)}%
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Active Hospital Rotations</span>
            <Building2 className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-bold text-teal-700">{activeRotationsCount}</p>
          <div className="text-[11px] text-teal-600 font-medium">
            Clinical wards & OR placements
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>International Visa Pipeline</span>
            <Plane className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-indigo-700">{internationalCount} Students</p>
          <div className="text-[11px] text-indigo-600 font-medium">
            Embassy clearance active
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Financials (Paid / Billed)</span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">
            ${totalPaid.toLocaleString()}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Total: ${totalBilled.toLocaleString()}</span>
            <span className="font-semibold text-amber-600">
              ${totalBalance.toLocaleString()} Due
            </span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Link
          to="/university/nominate-student"
          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-sky-300 hover:shadow-sm transition text-center space-y-1.5 group"
        >
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center mx-auto group-hover:scale-110 transition">
            <UserPlus className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-slate-800">Nominate</div>
          <div className="text-[10px] text-slate-500">New Trainee</div>
        </Link>

        <Link
          to="/university/students"
          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-sky-300 hover:shadow-sm transition text-center space-y-1.5 group"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto group-hover:scale-110 transition">
            <Users className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-slate-800">Students</div>
          <div className="text-[10px] text-slate-500">A-Z Tracking</div>
        </Link>

        <Link
          to="/university/student-status"
          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-sky-300 hover:shadow-sm transition text-center space-y-1.5 group"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto group-hover:scale-110 transition">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-slate-800">Status Grid</div>
          <div className="text-[10px] text-slate-500">Stage Checklist</div>
        </Link>

        <Link
          to="/university/mou"
          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-sky-300 hover:shadow-sm transition text-center space-y-1.5 group"
        >
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center mx-auto group-hover:scale-110 transition">
            <FileCheck2 className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-slate-800">Bilateral MoU</div>
          <div className="text-[10px] text-slate-500">Quota & Agreement</div>
        </Link>

        <Link
          to="/university/financials"
          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-sky-300 hover:shadow-sm transition text-center space-y-1.5 group"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mx-auto group-hover:scale-110 transition">
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-slate-800">Financials</div>
          <div className="text-[10px] text-slate-500">Invoices & Receipts</div>
        </Link>

        <Link
          to="/university/certificates"
          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-sky-300 hover:shadow-sm transition text-center space-y-1.5 group"
        >
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mx-auto group-hover:scale-110 transition">
            <Award className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-slate-800">Certificates</div>
          <div className="text-[10px] text-slate-500">{completedCount} Issued</div>
        </Link>
      </div>

      {/* Trainees Live Roster */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Enrolled Medical Trainees</h2>
            <p className="text-xs text-slate-500">Real-time status of university students in clinical attachments</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search students, hospital, specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <Link
              to="/university/students"
              className="text-xs font-bold text-sky-600 hover:text-sky-800 inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {filteredTrainees.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-3">
            <GraduationCap className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs text-slate-600">No medical trainees nominated yet.</p>
            <Link
              to="/university/nominate-student"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-bold hover:bg-sky-700 transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Nominate First Student</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="pb-3 font-semibold">Student</th>
                  <th className="pb-3 font-semibold">Specialty & Rotation</th>
                  <th className="pb-3 font-semibold">Hospital & City</th>
                  <th className="pb-3 font-semibold">Supervisor</th>
                  <th className="pb-3 font-semibold">Attendance</th>
                  <th className="pb-3 font-semibold">Logbook</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTrainees.slice(0, 8).map((t) => (
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
                      <div className="font-medium text-slate-800">{t.targetHospital}</div>
                      <div className="text-[10px] text-slate-500">{t.cityCountry}</div>
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
                          className="bg-emerald-600 h-1 rounded-full"
                          style={{ width: `${Math.min(100, (t.logbookProceduresSigned / t.logbookRequired) * 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3 pr-2">
                      {t.certificateIssued ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          Certified
                        </span>
                      ) : t.hospitalPlacementStatus === 'CONFIRMED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-100 text-sky-800 text-[10px] font-bold">
                          <Clock className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        to={`/university/students/${t.id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:text-sky-800"
                      >
                        <span>Journey</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
