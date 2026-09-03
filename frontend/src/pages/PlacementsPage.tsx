import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/frontend';
import { RealDataStore, RealPlacement } from '../services/realDataStore';
import {
  Building2,
  Calendar,
  UserCheck,
  MapPin,
  Clock,
  CheckCircle2,
  Plus,
  Filter,
  Search,
  GraduationCap,
  Sparkles,
  Trash2,
} from 'lucide-react';

export const PlacementsPage: React.FC = () => {
  const { user } = useAuth();
  const isUniversity =
    user?.roles.includes(UserRole.UNIVERSITY_ADMIN) ||
    user?.roles.includes(UserRole.UNIVERSITY_STAFF);

  const [placements, setPlacements] = useState<RealPlacement[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Form State
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [hospitalName, setHospitalName] = useState('Madina Teaching Hospital');
  const [cityCountry, setCityCountry] = useState('Mogadishu, Somalia');
  const [department, setDepartment] = useState('Department of Surgery & Trauma');
  const [supervisor, setSupervisor] = useState('Dr. Sarah Jenkins');
  const [supervisorTitle, setSupervisorTitle] = useState('Consultant General Surgeon');
  const [dates, setDates] = useState('Oct 01, 2025 - Dec 31, 2025');

  useEffect(() => {
    setPlacements(RealDataStore.getPlacements());
  }, []);

  const handleAddPlacement = (e: React.FormEvent) => {
    e.preventDefault();
    const newPlacement: RealPlacement = {
      id: `PLC-REAL-${Date.now().toString().slice(-4)}`,
      studentName,
      studentId,
      universityName: user?.organizationName || 'Faculty of Medicine',
      hospitalName,
      cityCountry,
      department,
      supervisor,
      supervisorTitle,
      dates,
      status: 'ACTIVE',
      createdAt: new Date().toISOString().split('T')[0],
    };

    const updated = RealDataStore.addPlacement(newPlacement);
    setPlacements(updated);
    setModalOpen(false);
    setStudentName('');
    setStudentId('');
  };

  const handleDeletePlacement = (id: string) => {
    if (window.confirm('Are you sure you want to remove this clinical placement?')) {
      const updated = RealDataStore.deletePlacement(id);
      setPlacements(updated);
    }
  };

  const filteredPlacements = placements.filter((p) => {
    const matchesSearch =
      p.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.hospitalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-sky-500/20 text-sky-300 font-bold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-sky-400/30">
              {isUniversity ? 'University Rotation Center' : 'Clinical Rotations'}
            </span>
            {isUniversity && (
              <span className="bg-emerald-500/20 text-emerald-300 font-semibold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-emerald-400/30 flex items-center gap-1">
                <GraduationCap className="w-3 h-3" />
                {user?.organizationName || 'Faculty of Medicine'}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {isUniversity ? 'Our Medical Student Hospital Rotations' : 'Active Hospital Placements'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Live monitoring of hospital department postings, assigned clinical preceptors, and ward training shifts.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg transition self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Real Placement</span>
        </button>
      </div>

      {placements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs space-y-4">
          <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Building2 className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-900">No Rotations Posted Yet</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              No hospital placements found. Click below to assign student clinical shifts and hospital department postings.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Placement</span>
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
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              >
                <option value="ALL">All Rotation Statuses</option>
                <option value="ACTIVE">Active in Hospital</option>
                <option value="CONFIRMED">Upcoming</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPlacements.map((plc) => (
              <div
                key={plc.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-sky-300 transition space-y-4 relative"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{plc.studentName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{plc.studentId}</span>
                    </div>
                    <p className="text-xs font-semibold text-sky-800">{plc.department}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded">
                      {plc.status}
                    </span>
                    <button
                      onClick={() => handleDeletePlacement(plc.id)}
                      className="text-slate-300 hover:text-rose-600 p-1 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-900">{plc.hospitalName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{plc.cityCountry}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                    <span>
                      Preceptor: <strong>{plc.supervisor}</strong> ({plc.supervisorTitle})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{plc.dates}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal to Add Real Placement */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-sky-600">
                <Plus className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 text-base">Add Real Hospital Rotation</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddPlacement} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Student Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ali Abdi Nur"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">University Student ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SNU-MED-2022-088"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Host Teaching Hospital</label>
                  <input
                    type="text"
                    required
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City & Country</label>
                  <input
                    type="text"
                    required
                    value={cityCountry}
                    onChange={(e) => setCityCountry(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department / Ward Unit</label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Preceptor</label>
                  <input
                    type="text"
                    required
                    value={supervisor}
                    onChange={(e) => setSupervisor(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Preceptor Role / Title</label>
                  <input
                    type="text"
                    required
                    value={supervisorTitle}
                    onChange={(e) => setSupervisorTitle(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rotation Dates</label>
                <input
                  type="text"
                  required
                  value={dates}
                  onChange={(e) => setDates(e.target.value)}
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
                  Add Placement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
