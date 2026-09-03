import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/frontend';
import { RealDataStore, RealLogbook } from '../services/realDataStore';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Filter,
  Search,
  Stethoscope,
  GraduationCap,
  Sparkles,
  Trash2,
} from 'lucide-react';

export const LogbookPage: React.FC = () => {
  const { user } = useAuth();
  const isUniversity =
    user?.roles.includes(UserRole.UNIVERSITY_ADMIN) ||
    user?.roles.includes(UserRole.UNIVERSITY_STAFF);

  const [logbooks, setLogbooks] = useState<RealLogbook[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [hospitalName, setHospitalName] = useState('Madina Teaching Hospital');
  const [activity, setActivity] = useState('Operating Room / Trauma');
  const [procedure, setProcedure] = useState('Appendectomy (Laparoscopic)');
  const [roleInProcedure, setRoleInProcedure] = useState<'PERFORMED' | 'ASSISTED' | 'OBSERVED'>('ASSISTED');
  const [supervisor, setSupervisor] = useState('Dr. Sarah Jenkins (Consultant)');
  const [comment, setComment] = useState('Excellent anatomical identification and sterile technique.');

  useEffect(() => {
    setLogbooks(RealDataStore.getLogbooks());
  }, []);

  const handleAddLogbook = (e: React.FormEvent) => {
    e.preventDefault();
    const newLog: RealLogbook = {
      id: `LOG-REAL-${Date.now().toString().slice(-4)}`,
      date,
      studentName,
      studentId,
      hospitalName,
      activity,
      procedure,
      roleInProcedure,
      supervisor,
      status: 'APPROVED',
      comment,
      createdAt: new Date().toISOString().split('T')[0],
    };

    const updated = RealDataStore.addLogbook(newLog);
    setLogbooks(updated);
    setModalOpen(false);
    setStudentName('');
    setStudentId('');
  };

  const handleDeleteLogbook = (id: string) => {
    if (window.confirm('Are you sure you want to remove this logbook entry?')) {
      const updated = RealDataStore.deleteLogbook(id);
      setLogbooks(updated);
    }
  };

  const filteredLogs = logbooks.filter((l) => {
    const matchesSearch =
      l.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.procedure.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.activity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.hospitalName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-sky-500/20 text-sky-300 font-bold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-sky-400/30">
              {isUniversity ? 'University Clinical Logbook Audit' : 'Clinical Logbook'}
            </span>
            {isUniversity && (
              <span className="bg-emerald-500/20 text-emerald-300 font-semibold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-emerald-400/30 flex items-center gap-1">
                <GraduationCap className="w-3 h-3" />
                {user?.organizationName || 'Faculty of Medicine'}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {isUniversity ? 'Our Students Clinical Procedure Logbooks' : 'Clinical Logbook Sign-offs'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Surgical procedures, clinical ward rounds, diagnostic skills, and preceptor verified sign-offs.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg transition self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Record Real Procedure</span>
        </button>
      </div>

      {logbooks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs space-y-4">
          <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-900">No Logbook Records Yet</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              No surgical or clinical procedures logged. Click below to document patient cases, surgeries, and preceptor sign-offs.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Record First Procedure</span>
          </button>
        </div>
      ) : (
        <>
          {/* Quick Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search procedure, student, hospital..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              >
                <option value="ALL">All Sign-off Statuses</option>
                <option value="APPROVED">Preceptor Approved</option>
                <option value="SUBMITTED">Pending Sign-off</option>
                <option value="REVISION_REQUESTED">Revision Needed</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Student</th>
                    <th className="p-3.5">Procedure / Case</th>
                    <th className="p-3.5">Activity Area</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Preceptor Sign-off</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Comments</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-bold font-mono text-slate-900">{log.date}</td>
                      <td className="p-3.5">
                        <span className="font-bold text-slate-900 block">{log.studentName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{log.studentId}</span>
                      </td>
                      <td className="p-3.5 font-bold text-sky-900">{log.procedure}</td>
                      <td className="p-3.5 text-slate-700">{log.activity}</td>
                      <td className="p-3.5">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                          {log.roleInProcedure}
                        </span>
                      </td>
                      <td className="p-3.5 font-medium text-slate-900">{log.supervisor}</td>
                      <td className="p-3.5">
                        {log.status === 'APPROVED' && (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Approved
                          </span>
                        )}
                        {log.status === 'SUBMITTED' && (
                          <span className="bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 text-sky-600" />
                            Under Review
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-[11px] text-slate-500 max-w-xs truncate">{log.comment}</td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleDeleteLogbook(log.id)}
                          className="text-slate-300 hover:text-rose-600 p-1 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-sky-600">
                <Plus className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 text-base">Record Real Clinical Procedure</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddLogbook} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role in Procedure *</label>
                  <select
                    value={roleInProcedure}
                    onChange={(e) => setRoleInProcedure(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="PERFORMED">PERFORMED (Primary Operator)</option>
                    <option value="ASSISTED">ASSISTED (First/Second Assist)</option>
                    <option value="OBSERVED">OBSERVED (Clinical Shadow)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Student Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amina Warsame"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Student University ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SNU-MED-2022-094"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Procedure / Clinical Case *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Appendectomy, Lumbar Puncture, Chest Tube Insertion"
                  value={procedure}
                  onChange={(e) => setProcedure(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Host Hospital</label>
                  <input
                    type="text"
                    required
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Activity Area</label>
                  <input
                    type="text"
                    required
                    value={activity}
                    onChange={(e) => setActivity(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Preceptor / Supervising Surgeon</label>
                <input
                  type="text"
                  required
                  value={supervisor}
                  onChange={(e) => setSupervisor(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Preceptor Sign-off Remarks</label>
                <textarea
                  rows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold"
                >
                  Save Logbook Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
