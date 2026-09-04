import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  BookOpen,
  Award,
  FileCheck2,
  Stethoscope,
  Sparkles,
  QrCode,
  Plus,
  ShieldCheck,
  UserCheck,
  Download,
  Check,
  ChevronRight,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { RealDataStore, RealTrainee } from '../../services/realDataStore';

export const StudentDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [trainee, setTrainee] = useState<RealTrainee | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [procedureName, setProcedureName] = useState('');
  const [procedureCategory, setProcedureCategory] = useState<'PERFORMED' | 'ASSISTED' | 'OBSERVED'>('PERFORMED');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCheckedInToday, setIsCheckedInToday] = useState(false);

  useEffect(() => {
    // Get first trainee or matched trainee from RealDataStore
    const trainees = RealDataStore.getTrainees();
    if (trainees.length > 0) {
      setTrainee(trainees[0]);
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCheckInToday = () => {
    if (!trainee) return;
    setIsCheckedInToday(true);
    const newAttendance = Math.min(100, trainee.attendancePercent + 1);
    RealDataStore.updateTrainee(trainee.id, { attendancePercent: newAttendance });
    setTrainee({ ...trainee, attendancePercent: newAttendance });
    showToast(`✓ Biometric QR Check-in verified at ${trainee.targetHospital} (${trainee.specialty})!`);
  };

  const handleLogProcedure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainee || !procedureName) return;

    const newSigned = Math.min(trainee.logbookRequired, trainee.logbookProceduresSigned + 1);
    RealDataStore.updateTrainee(trainee.id, {
      logbookProceduresSigned: newSigned,
    });
    setTrainee({ ...trainee, logbookProceduresSigned: newSigned });
    setShowLogModal(false);
    setProcedureName('');
    showToast(`Clinical case "${procedureName}" recorded in your e-logbook!`);
  };

  if (!trainee) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
        <GraduationCap className="w-8 h-8 text-sky-600 mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Loading student clinical portfolio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-4 h-4 text-sky-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Welcome Card */}
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-lg space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white text-xl font-bold shrink-0">
              <GraduationCap className="w-8 h-8 text-sky-300" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-sky-500/20 text-sky-300 font-bold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-sky-400/30">
                  Medical Trainee
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 font-semibold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-emerald-400/30 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {trainee.targetHospital}
                </span>
                <span className="bg-indigo-500/20 text-indigo-300 font-semibold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-indigo-400/30">
                  {trainee.specialty}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Welcome, {trainee.studentName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300">
                Matriculation ID: <span className="font-mono text-sky-300">{trainee.studentId}</span> • {trainee.studyYear}
              </p>
            </div>
          </div>

          {/* Quick Check-in Button */}
          <div className="flex flex-wrap items-center gap-3">
            {!isCheckedInToday ? (
              <button
                onClick={handleCheckInToday}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg transition flex items-center gap-2"
              >
                <QrCode className="w-4 h-4" />
                <span>QR Ward Check-in Today</span>
              </button>
            ) : (
              <div className="px-4 py-2.5 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Checked In Today (08:14 AM)</span>
              </div>
            )}

            <button
              onClick={() => setShowLogModal(true)}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-lg transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>+ Log Procedure</span>
            </button>
          </div>
        </div>

        {/* Live Rotation Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/10 backdrop-blur p-4 rounded-xl border border-white/10 text-xs">
          <div>
            <span className="text-slate-300 text-[11px] block">Attendance Compliance</span>
            <div className="text-lg font-bold text-white mt-0.5">{trainee.attendancePercent}%</div>
          </div>
          <div>
            <span className="text-slate-300 text-[11px] block">Logbook Cases</span>
            <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
              {trainee.logbookProceduresSigned} / {trainee.logbookRequired}
            </div>
          </div>
          <div>
            <span className="text-slate-300 text-[11px] block">Evaluation Grade</span>
            <div className="text-lg font-bold text-purple-300 mt-0.5">
              {trainee.evaluationGrade || 'In Progress'}
            </div>
          </div>
          <div>
            <span className="text-slate-300 text-[11px] block">Credential Status</span>
            <div className="text-sm font-bold text-sky-300 mt-0.5 flex items-center gap-1">
              {trainee.certificateIssued ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Certified</span>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Active Rotation</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Clinical Posting & Logbook */}
        <div className="lg:col-span-2 space-y-6">
          {/* Clinical Rotation Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-teal-600" />
                <span>Current Clinical Posting & Rotation</span>
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                Active Ward Rotation
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 space-y-1">
                <span className="text-slate-500">Teaching Hospital</span>
                <p className="font-bold text-slate-900">{trainee.targetHospital}</p>
                <p className="text-[11px] text-slate-500">{trainee.cityCountry}</p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 space-y-1">
                <span className="text-slate-500">Department Specialty</span>
                <p className="font-bold text-teal-700">{trainee.specialty}</p>
                <p className="text-[11px] text-slate-500">{trainee.durationWeeks} Weeks Rotation</p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 space-y-1">
                <span className="text-slate-500">Clinical Supervisor</span>
                <p className="font-bold text-slate-900">{trainee.assignedSupervisor.name}</p>
                <p className="text-[11px] text-slate-500">{trainee.assignedSupervisor.title}</p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 space-y-1">
                <span className="text-slate-500">Rotation Schedule</span>
                <p className="font-bold text-slate-900">
                  {trainee.startDate} to {trainee.endDate}
                </p>
                <p className="text-[11px] text-slate-500">Sun - Thu (08:00 - 15:00)</p>
              </div>
            </div>
          </div>

          {/* E-Logbook Clinical Cases */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                  <span>Clinical E-Logbook Entries</span>
                </h2>
                <p className="text-xs text-slate-500">
                  {trainee.logbookProceduresSigned} of {trainee.logbookRequired} clinical procedures endorsed
                </p>
              </div>

              <button
                onClick={() => setShowLogModal(true)}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Case</span>
              </button>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-2.5 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (trainee.logbookProceduresSigned / trainee.logbookRequired) * 100)}%`,
                }}
              />
            </div>

            <div className="space-y-2 text-xs divide-y divide-slate-100">
              {[
                { title: 'Emergency Appendectomy (Laparoscopic Assistance)', type: 'ASSISTED', status: 'ENDORSED', date: 'Yesterday' },
                { title: 'Peripheral Intravenous Cannulation & Blood Draw', type: 'PERFORMED', status: 'ENDORSED', date: '2 days ago' },
                { title: 'Abdominal Trauma Ultrasound (FAST Scan)', type: 'PERFORMED', status: 'ENDORSED', date: '4 days ago' },
                { title: 'Major Burn Wound Debridement & Sterile Dressing', type: 'ASSISTED', status: 'ENDORSED', date: 'Last week' },
                { title: 'Nasogastric Tube Placement in Inpatient Ward', type: 'PERFORMED', status: 'ENDORSED', date: 'Last week' },
              ].map((item, idx) => (
                <div key={idx} className="pt-2 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span className="font-mono">{item.date}</span>
                      <span>•</span>
                      <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-medium">
                        {item.type}
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <Check className="w-3 h-3" />
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Certificate & Timeline */}
        <div className="space-y-6">
          {/* Certificate Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center mx-auto">
              <Award className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-sm">Official Clinical Diploma</h3>
              <p className="text-xs text-slate-500">
                {trainee.certificateIssued
                  ? 'Accredited certificate issued and ready for verification.'
                  : 'Diploma unlocks upon completing rotation hours & supervisor evaluation.'}
              </p>
            </div>

            {trainee.certificateIssued ? (
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 space-y-2">
                <div className="text-xs font-mono font-bold text-purple-900">
                  {trainee.certificateNumber}
                </div>
                <Link
                  to={`/certificates`}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition shadow flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Certificate</span>
                </Link>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                Progress: {trainee.logbookProceduresSigned} / {trainee.logbookRequired} Procedures
              </div>
            )}
          </div>

          {/* 10-Stage Milestone Link */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-sm space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
              Complete Dossier
            </span>
            <h3 className="font-bold text-sm">10-Stage Placement Journey</h3>
            <p className="text-xs text-slate-300">
              Track your nomination, visa processing, fees clearance, and rotation grading.
            </p>
            <Link
              to={`/university/students/${trainee.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300 pt-1"
            >
              <span>View Full Journey</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Log Procedure Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Log Bedside Clinical Case</h3>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLogProcedure} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Procedure / Clinical Case Title
                </label>
                <input
                  type="text"
                  required
                  value={procedureName}
                  onChange={(e) => setProcedureName(e.target.value)}
                  placeholder="e.g. Lumbar Puncture, Suture of Laceration, Endotracheal Intubation..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Participation Role</label>
                <select
                  value={procedureCategory}
                  onChange={(e) => setProcedureCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold"
                >
                  <option value="PERFORMED">Performed Directly under Supervision</option>
                  <option value="ASSISTED">Assisted Consultant / Registrar</option>
                  <option value="OBSERVED">Observed Complex Surgical Case</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow"
                >
                  Save to E-Logbook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
