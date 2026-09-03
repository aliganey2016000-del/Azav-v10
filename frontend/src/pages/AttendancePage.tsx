import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/frontend';
import { RealDataStore, RealAttendance } from '../services/realDataStore';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Filter,
  Search,
  Building2,
  GraduationCap,
  Sparkles,
  Trash2,
} from 'lucide-react';

export const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const isUniversity =
    user?.roles.includes(UserRole.UNIVERSITY_ADMIN) ||
    user?.roles.includes(UserRole.UNIVERSITY_STAFF);

  const [records, setRecords] = useState<RealAttendance[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [hospitalName, setHospitalName] = useState('Madina Teaching Hospital');
  const [wardDepartment, setWardDepartment] = useState('General Surgery OR & Wards');
  const [supervisorName, setSupervisorName] = useState('Dr. Sarah Jenkins');
  const [status, setStatus] = useState<'PRESENT' | 'ABSENT' | 'EXCUSED' | 'LATE'>('PRESENT');
  const [checkIn, setCheckIn] = useState('08:00 AM');
  const [checkOut, setCheckOut] = useState('03:30 PM');
  const [notes, setNotes] = useState('Completed surgical rounds and emergency scrub-in.');

  useEffect(() => {
    setRecords(RealDataStore.getAttendance());
  }, []);

  const handleAddAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: RealAttendance = {
      id: `ATT-REAL-${Date.now().toString().slice(-4)}`,
      date,
      studentName,
      studentId,
      hospitalName,
      wardDepartment,
      supervisorName,
      status,
      checkIn,
      checkOut,
      notes,
      createdAt: new Date().toISOString().split('T')[0],
    };

    const updated = RealDataStore.addAttendance(newRecord);
    setRecords(updated);
    setModalOpen(false);
    setStudentName('');
    setStudentId('');
  };

  const handleDeleteAttendance = (id: string) => {
    if (window.confirm('Are you sure you want to remove this attendance record?')) {
      const updated = RealDataStore.deleteAttendance(id);
      setRecords(updated);
    }
  };

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.hospitalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.wardDepartment.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-sky-500/20 text-sky-300 font-bold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-sky-400/30">
              {isUniversity ? 'University Attendance Oversight' : 'Clinical Attendance'}
            </span>
            {isUniversity && (
              <span className="bg-emerald-500/20 text-emerald-300 font-semibold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-emerald-400/30 flex items-center gap-1">
                <GraduationCap className="w-3 h-3" />
                {user?.organizationName || 'Faculty of Medicine'}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {isUniversity ? 'Our Students Daily Hospital Ward Attendance' : 'Hospital Shift Attendance'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Real daily attendance logs verified by hospital clinical supervisors and ward preceptors.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg transition self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Log Real Attendance</span>
        </button>
      </div>

      {records.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs space-y-4">
          <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Calendar className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-900">No Attendance Records Yet</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              No active attendance records found. Click below to log daily hospital ward shifts for your medical students.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Log First Attendance</span>
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
                placeholder="Search student, hospital, department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="PRESENT">Present on Ward</option>
                <option value="ABSENT">Absent</option>
                <option value="EXCUSED">Excused / Leave</option>
                <option value="LATE">Late Shift</option>
              </select>
            </div>
          </div>

          {/* Records Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Student</th>
                    <th className="p-3.5">Hospital & Department</th>
                    <th className="p-3.5">Shift Hours</th>
                    <th className="p-3.5">Verified Preceptor</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Notes</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-bold font-mono text-slate-900">{rec.date}</td>
                      <td className="p-3.5">
                        <span className="font-bold text-slate-900 block">{rec.studentName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{rec.studentId}</span>
                      </td>
                      <td className="p-3.5">
                        <span className="text-slate-900 font-semibold block">{rec.hospitalName}</span>
                        <span className="text-[11px] text-slate-500">{rec.wardDepartment}</span>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {rec.checkIn} - {rec.checkOut}
                      </td>
                      <td className="p-3.5 font-medium text-sky-900">{rec.supervisorName}</td>
                      <td className="p-3.5">
                        {rec.status === 'PRESENT' && (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Present
                          </span>
                        )}
                        {rec.status === 'LATE' && (
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Late
                          </span>
                        )}
                        {rec.status === 'ABSENT' && (
                          <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            Absent
                          </span>
                        )}
                        {rec.status === 'EXCUSED' && (
                          <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold">
                            Excused
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-[11px] text-slate-500 max-w-xs truncate">{rec.notes}</td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleDeleteAttendance(rec.id)}
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

      {/* Modal to Log Real Attendance */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-sky-600">
                <Plus className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 text-base">Log Real Daily Shift Attendance</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAttendance} className="space-y-3 text-xs">
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
                  <label className="block font-semibold text-slate-700 mb-1">Status *</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="PRESENT">PRESENT</option>
                    <option value="LATE">LATE</option>
                    <option value="EXCUSED">EXCUSED / LEAVE</option>
                    <option value="ABSENT">ABSENT</option>
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
                  <label className="block font-semibold text-slate-700 mb-1">Ward / Unit</label>
                  <input
                    type="text"
                    required
                    value={wardDepartment}
                    onChange={(e) => setWardDepartment(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Check-in Time</label>
                  <input
                    type="text"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Check-out Time</label>
                  <input
                    type="text"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Supervising Doctor / Preceptor</label>
                <input
                  type="text"
                  required
                  value={supervisorName}
                  onChange={(e) => setSupervisorName(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinical Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                  Save Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
