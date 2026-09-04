import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  BookOpen,
  Award,
  CheckCircle2,
  Clock,
  UserCheck,
  Building2,
  Check,
  Plus,
  Calendar,
  Sparkles,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { RealDataStore, RealTrainee } from '../../services/realDataStore';

export const SupervisorTraineesPage: React.FC = () => {
  const { user } = useAuth();
  const supervisorName = user ? `${user.firstName} ${user.lastName}`.trim() || 'Dr. Sarah Jenkins' : 'Dr. Sarah Jenkins';

  const [trainees, setTrainees] = useState<RealTrainee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setTrainees(RealDataStore.getTrainees());
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleEndorseProcedure = (t: RealTrainee) => {
    const updated = Math.min(t.logbookRequired, t.logbookProceduresSigned + 1);
    RealDataStore.updateTrainee(t.id, {
      logbookProceduresSigned: updated,
    });
    setTrainees(RealDataStore.getTrainees());
    showToast(`Endorsed case for ${t.studentName} (${updated}/${t.logbookRequired})`);
  };

  const filtered = trainees.filter((t) => {
    const matchesSearch =
      t.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = filterDept === 'ALL' || t.specialty === filterDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-4 h-4 text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-teal-50 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded border border-teal-200 uppercase tracking-wider">
              Faculty Supervision
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">{supervisorName}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
            Assigned Medical Trainees & Logbook Oversight
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl mt-0.5">
            Monitor clinical attendance, verify bedside patient case logs, and guide clinical clerkship development.
          </p>
        </div>

        <Link
          to="/supervisor/dashboard"
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
        >
          <span>Supervisor Overview</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search assigned trainees by name, matriculation ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Trainees Detailed Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((t) => (
          <div
            key={t.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-teal-300 transition"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="font-mono text-[10px] text-slate-400 font-semibold">{t.studentId}</span>
                <h3 className="font-bold text-slate-900 text-base">{t.studentName}</h3>
                <p className="text-xs text-slate-500">
                  {t.studyYear} • {t.targetHospital}
                </p>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                {t.specialty}
              </span>
            </div>

            {/* Attendance & Logbook Bars */}
            <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <div>
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-600">Ward Attendance Rate</span>
                  <span className="text-slate-900 font-mono">{t.attendancePercent}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-1.5 rounded-full"
                    style={{ width: `${t.attendancePercent}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-600">Clinical Procedures Verified</span>
                  <span className="text-emerald-700 font-mono font-bold">
                    {t.logbookProceduresSigned} / {t.logbookRequired}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-1.5 rounded-full"
                    style={{ width: `${Math.min(100, (t.logbookProceduresSigned / t.logbookRequired) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {t.startDate} - {t.endDate}
                </span>
              </div>
              <span className="font-semibold text-purple-700">
                Grade: {t.evaluationGrade || 'Pending Evaluation'}
              </span>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => handleEndorseProcedure(t)}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Endorse Procedure</span>
              </button>

              <Link
                to={`/university/students/${t.id}`}
                className="text-xs font-bold text-teal-600 hover:text-teal-800 inline-flex items-center gap-1"
              >
                <span>Full Journey Dossier</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
