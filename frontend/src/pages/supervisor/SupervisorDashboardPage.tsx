import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  UserCheck,
  Users,
  BookOpen,
  Award,
  CheckCircle2,
  Clock,
  Check,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
  Building2,
  FileCheck2,
  Search,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { RealDataStore, RealTrainee } from '../../services/realDataStore';

export const SupervisorDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const supervisorName = user ? `${user.firstName} ${user.lastName}`.trim() || 'Dr. Sarah Jenkins' : 'Dr. Sarah Jenkins';
  const hospitalName = user?.organizationName || 'Madina Teaching Hospital';

  const [trainees, setTrainees] = useState<RealTrainee[]>([]);
  const [selectedTrainee, setSelectedTrainee] = useState<RealTrainee | null>(null);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [evalGrade, setEvalGrade] = useState('Honors (A)');
  const [evalScore, setEvalScore] = useState(92);
  const [evalComments, setEvalComments] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    // Show all trainees or trainees assigned to this supervisor
    setTrainees(RealDataStore.getTrainees());
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Quick procedure sign-off
  const handleQuickSignOff = (t: RealTrainee) => {
    const updated = Math.min(t.logbookRequired, t.logbookProceduresSigned + 1);
    RealDataStore.updateTrainee(t.id, {
      logbookProceduresSigned: updated,
    });
    setTrainees(RealDataStore.getTrainees());
    showToast(`Signed off clinical procedure for ${t.studentName}! (${updated}/${t.logbookRequired})`);
  };

  // Submit evaluation
  const handleSubmitEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrainee) return;

    RealDataStore.updateTrainee(selectedTrainee.id, {
      evaluationGrade: evalGrade,
      evaluationScore: evalScore,
    });

    setTrainees(RealDataStore.getTrainees());
    setShowEvaluationModal(false);
    showToast(`Evaluation and Grade ${evalGrade} recorded for ${selectedTrainee.studentName}!`);
  };

  // Issue Certificate
  const handleIssueCertificate = (t: RealTrainee) => {
    RealDataStore.updateTrainee(t.id, {
      certificateIssued: true,
      certificateNumber: `AZAAM-CERT-${Math.floor(100000 + Math.random() * 900000)}`,
    });
    setTrainees(RealDataStore.getTrainees());
    showToast(`Certificate of Clinical Attachment issued for ${t.studentName}!`);
  };

  const totalProcedures = trainees.reduce((sum, t) => sum + t.logbookProceduresSigned, 0);
  const certifiedCount = trainees.filter((t) => t.certificateIssued).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-4 h-4 text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-teal-500/20 text-teal-300 font-bold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-teal-400/30">
              Clinical Consultant Portal
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 font-semibold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-emerald-400/30 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" />
              {supervisorName}
            </span>
            <span className="bg-sky-500/20 text-sky-300 font-semibold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-sky-400/30 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              {hospitalName}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Supervisory & Clinical Assessment Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Review assigned medical trainees, endorse clinical logbook bedside cases, assess core competencies, and issue certified completion records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/supervisor/trainees"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-lg transition"
          >
            <Users className="w-4 h-4" />
            <span>Assigned Trainees</span>
          </Link>
          <Link
            to="/supervisor/logbooks"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/20 transition"
          >
            <BookOpen className="w-4 h-4 text-teal-300" />
            <span>Logbooks</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Assigned Trainees</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{trainees.length}</p>
          <div className="text-[11px] text-teal-600 font-medium">Under active clinical guidance</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Logbook Endorsements</span>
            <BookOpen className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-2xl font-bold text-sky-700">{totalProcedures}</p>
          <div className="text-[11px] text-slate-500">Total procedures signed off</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Average Attendance</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-indigo-700">93%</p>
          <div className="text-[11px] text-emerald-600 font-medium">All trainees compliant (&gt;85%)</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Certified Completions</span>
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{certifiedCount}</p>
          <div className="text-[11px] text-purple-600 font-medium">Accredited AZAAM diplomas</div>
        </div>
      </div>

      {/* Trainees Roster with Actionable Buttons */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Supervised Clinical Clerkships & Logbook Sign-offs
            </h2>
            <p className="text-xs text-slate-500">
              Directly endorse bedside cases, evaluate procedural competency, and certify rotations
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">Live Roster</span>
        </div>

        <div className="divide-y divide-slate-100">
          {trainees.map((t) => (
            <div
              key={t.id}
              className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/50 p-3 rounded-xl transition"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{t.studentName}</span>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {t.studentId}
                  </span>
                  <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {t.specialty}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {t.studyYear} • {t.durationWeeks} Weeks ({t.startDate} to {t.endDate})
                </p>
              </div>

              {/* Metrics */}
              <div className="flex flex-wrap items-center gap-6 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block">Attendance</span>
                  <span className="font-bold text-slate-800">{t.attendancePercent}%</span>
                </div>

                <div>
                  <span className="text-slate-400 text-[11px] block">Logbook Progress</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono text-emerald-700">
                      {t.logbookProceduresSigned} / {t.logbookRequired}
                    </span>
                    <button
                      onClick={() => handleQuickSignOff(t)}
                      className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded border border-emerald-200 transition flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Endorse Case</span>
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-[11px] block">Evaluation Grade</span>
                  <span className="font-bold text-purple-700">{t.evaluationGrade || 'Pending'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setSelectedTrainee(t);
                    setEvalGrade(t.evaluationGrade || 'Honors (A)');
                    setEvalScore(t.evaluationScore || 92);
                    setShowEvaluationModal(true);
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 rounded-xl text-xs font-semibold transition"
                >
                  Grade / Evaluate
                </button>

                {!t.certificateIssued ? (
                  <button
                    onClick={() => handleIssueCertificate(t)}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow"
                  >
                    Issue Certificate
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Certified
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Clinical Rubric Evaluation Modal */}
      {showEvaluationModal && selectedTrainee && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Clinical Consultant Evaluation</h3>
              <button
                onClick={() => setShowEvaluationModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <p>
                Candidate: <strong>{selectedTrainee.studentName}</strong> ({selectedTrainee.studentId})
              </p>
              <p>
                Rotation: <strong>{selectedTrainee.specialty}</strong>
              </p>
            </div>

            <form onSubmit={handleSubmitEvaluation} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Final Performance Grade</label>
                <select
                  value={evalGrade}
                  onChange={(e) => setEvalGrade(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                >
                  <option value="Honors (A)">Honors (A) - Outstanding</option>
                  <option value="Excellent (A-)">Excellent (A-) - Very High Competence</option>
                  <option value="High Pass (B+)">High Pass (B+) - Above Average</option>
                  <option value="Pass (B)">Pass (B) - Satisfactory</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Competency Score % (1-100)
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  required
                  value={evalScore}
                  onChange={(e) => setEvalScore(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Supervisor Clinical Feedback & Remarks
                </label>
                <textarea
                  rows={3}
                  value={evalComments}
                  onChange={(e) => setEvalComments(e.target.value)}
                  placeholder="Demonstrated strong aseptic surgical techniques, bedside manners, and accurate history taking..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEvaluationModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow"
                >
                  Save Evaluation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
