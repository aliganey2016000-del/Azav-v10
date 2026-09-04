import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  UserCheck,
  Calendar,
  Sparkles,
  Download,
  Eye,
  Edit,
  ChevronRight,
  GraduationCap,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { RealDataStore, RealTrainee } from '../../services/realDataStore';

export const OrganizationPlacementsPage: React.FC = () => {
  const { user } = useAuth();
  const hospitalName = user?.organizationName || 'Madina Teaching Hospital';

  const [trainees, setTrainees] = useState<RealTrainee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedTrainee, setSelectedTrainee] = useState<RealTrainee | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [supervisorName, setSupervisorName] = useState('');
  const [supervisorTitle, setSupervisorTitle] = useState('');

  useEffect(() => {
    setTrainees(RealDataStore.getTrainees());
  }, []);

  const specialties = Array.from(new Set(trainees.map((t) => t.specialty)));

  const filteredTrainees = trainees.filter((t) => {
    const matchesSearch =
      t.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = filterSpecialty === 'ALL' || t.specialty === filterSpecialty;
    const matchesStatus =
      filterStatus === 'ALL' ||
      (filterStatus === 'ACTIVE' && !t.certificateIssued) ||
      (filterStatus === 'COMPLETED' && t.certificateIssued);

    return matchesSearch && matchesSpecialty && matchesStatus;
  });

  const handleAssignSupervisor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrainee || !supervisorName) return;

    RealDataStore.updateTrainee(selectedTrainee.id, {
      assignedSupervisor: {
        name: supervisorName,
        title: supervisorTitle || 'Consultant Specialist',
        phone: selectedTrainee.assignedSupervisor.phone || '+252 61 700 0000',
        email: selectedTrainee.assignedSupervisor.email || 'supervisor@hospital.org',
      },
    });

    setTrainees(RealDataStore.getTrainees());
    setShowAssignModal(false);
    setSelectedTrainee(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-teal-50 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded border border-teal-200 uppercase tracking-wider">
              Hospital Operations
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">{hospitalName}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
            Clinical Placement & Rotation Manager
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl mt-0.5">
            Coordinate student ward rotations, clinical mentors, and verify rotation completion records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/organization/departments"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <Building2 className="w-4 h-4 text-teal-600" />
            <span>Ward Capacity</span>
          </Link>
          <Link
            to="/organization/supervisors"
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow flex items-center gap-1.5"
          >
            <UserCheck className="w-4 h-4" />
            <span>Supervisors</span>
          </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search trainees by name, ID, specialty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterSpecialty}
            onChange={(e) => setFilterSpecialty(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
          >
            <option value="ALL">All Departments</option>
            {specialties.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active in Wards</option>
            <option value="COMPLETED">Completed Rotations</option>
          </select>
        </div>
      </div>

      {/* Trainees Placement Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Clinical Placements Roster ({filteredTrainees.length})
          </h2>
          <span className="text-xs text-slate-500">Updated from real-time database</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="pb-3 font-semibold">Trainee</th>
                <th className="pb-3 font-semibold">Clinical Department</th>
                <th className="pb-3 font-semibold">Assigned Supervisor</th>
                <th className="pb-3 font-semibold">Rotation Dates</th>
                <th className="pb-3 font-semibold">Attendance</th>
                <th className="pb-3 font-semibold">Logbook</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredTrainees.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 pr-2">
                    <div className="font-bold text-slate-900">{t.studentName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {t.studentId} • {t.studyYear}
                    </div>
                  </td>
                  <td className="py-3 pr-2">
                    <span className="font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {t.specialty}
                    </span>
                  </td>
                  <td className="py-3 pr-2">
                    <div className="font-medium text-slate-800">{t.assignedSupervisor.name}</div>
                    <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                      {t.assignedSupervisor.title}
                    </div>
                  </td>
                  <td className="py-3 pr-2">
                    <div className="font-medium text-slate-800">
                      {t.startDate} - {t.endDate}
                    </div>
                    <div className="text-[10px] text-slate-500">{t.durationWeeks} Weeks Full-time</div>
                  </td>
                  <td className="py-3 pr-2">
                    <div className="font-mono font-bold text-slate-800">{t.attendancePercent}%</div>
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
                        Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-100 text-sky-800 text-[10px] font-bold">
                        <Clock className="w-3 h-3" />
                        In Rotation
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => {
                        setSelectedTrainee(t);
                        setSupervisorName(t.assignedSupervisor.name);
                        setSupervisorTitle(t.assignedSupervisor.title);
                        setShowAssignModal(true);
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 rounded-lg text-xs font-semibold transition"
                    >
                      Assign Supervisor
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supervisor Assignment Modal */}
      {showAssignModal && selectedTrainee && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Assign Clinical Supervisor
              </h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <p>
                Trainee: <strong>{selectedTrainee.studentName}</strong> ({selectedTrainee.studentId})
              </p>
              <p>
                Department: <strong>{selectedTrainee.specialty}</strong>
              </p>
            </div>

            <form onSubmit={handleAssignSupervisor} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Supervisor Full Name
                </label>
                <input
                  type="text"
                  required
                  value={supervisorName}
                  onChange={(e) => setSupervisorName(e.target.value)}
                  placeholder="e.g. Dr. Sarah Jenkins"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Consultant Title / Designation
                </label>
                <input
                  type="text"
                  required
                  value={supervisorTitle}
                  onChange={(e) => setSupervisorTitle(e.target.value)}
                  placeholder="e.g. Consultant General Surgeon"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
