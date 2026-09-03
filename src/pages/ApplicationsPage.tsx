import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/frontend';
import { RealDataStore, RealApplication } from '../services/realDataStore';
import {
  FileText,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  AlertCircle,
  GraduationCap,
  Plane,
  UserPlus,
  Search,
  Trash2,
} from 'lucide-react';

export const ApplicationsPage: React.FC = () => {
  const { user } = useAuth();
  const isUniversity =
    user?.roles.includes(UserRole.UNIVERSITY_ADMIN) ||
    user?.roles.includes(UserRole.UNIVERSITY_STAFF);

  const [applications, setApplications] = useState<RealApplication[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Form State
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [specialty, setSpecialty] = useState('General Surgery & Trauma');
  const [targetHospital, setTargetHospital] = useState('Madina Teaching Hospital (Mogadishu)');
  const [dates, setDates] = useState('Oct 01, 2025 - Dec 31, 2025 (12 wks)');
  const [visaRequired, setVisaRequired] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setApplications(RealDataStore.getApplications());
  }, []);

  const handleNominateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const newApp: RealApplication = {
      id: `APP-REAL-${Date.now().toString().slice(-4)}`,
      studentName,
      studentId,
      universityName: user?.organizationName || 'Faculty of Medicine',
      specialty,
      targetHospital,
      dates,
      visaRequired,
      status: 'SUBMITTED',
      createdAt: new Date().toISOString().split('T')[0],
      notes,
    };

    const updated = RealDataStore.addApplication(newApp);
    setApplications(updated);
    setModalOpen(false);
    setStudentName('');
    setStudentId('');
    setNotes('');
  };

  const handleDeleteApplication = (id: string) => {
    if (window.confirm('Are you sure you want to remove this application?')) {
      const updated = RealDataStore.deleteApplication(id);
      setApplications(updated);
    }
  };

  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.targetHospital.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-sky-500/20 text-sky-300 font-bold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-sky-400/30">
              {isUniversity ? 'University Sending Portal' : 'Clinical Applications'}
            </span>
            {isUniversity && (
              <span className="bg-emerald-500/20 text-emerald-300 font-semibold px-2.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-emerald-400/30 flex items-center gap-1">
                <GraduationCap className="w-3 h-3" />
                {user?.organizationName || 'Faculty of Medicine'}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {isUniversity ? 'Our Student Applications & Nominations' : 'Clinical Placement Applications'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Submit and manage real attachment applications for our medical students to partner teaching hospitals.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg transition self-start md:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Submit Real Application</span>
        </button>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs space-y-4">
          <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <FileText className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-900">No Applications Submitted Yet</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              No clinical attachment applications found. Click below to submit placement requests for your medical students.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Submit First Application</span>
          </button>
        </div>
      ) : (
        <>
          {/* Quick Filter & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search our students, specialty, or hospital..."
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
                <option value="ALL">All Application Statuses</option>
                <option value="APPROVED">Approved & Placed</option>
                <option value="SUBMITTED">Under Review</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {/* Applications Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {isUniversity ? 'Our University Dispatched Student Pipeline' : 'Application Pipeline'}
                </h3>
                <p className="text-xs text-slate-500">
                  Showing {filteredApps.length} student application records
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">App Ref</th>
                    <th className="p-3.5">Student</th>
                    <th className="p-3.5">Specialty</th>
                    <th className="p-3.5">Host Hospital</th>
                    <th className="p-3.5">Rotation Dates</th>
                    <th className="p-3.5">Visa Logistics</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredApps.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-bold font-mono text-sky-800">{app.id}</td>
                      <td className="p-3.5">
                        <span className="font-bold text-slate-900 block">{app.studentName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{app.studentId}</span>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-800">{app.specialty}</td>
                      <td className="p-3.5">
                        <span className="text-slate-900 font-medium block">{app.targetHospital}</span>
                      </td>
                      <td className="p-3.5 text-slate-600">{app.dates}</td>
                      <td className="p-3.5">
                        {app.visaRequired ? (
                          <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded text-[10px] font-semibold inline-flex items-center gap-1">
                            <Plane className="w-3 h-3 text-indigo-500" />
                            International Visa
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-semibold">
                            Domestic
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        {app.status === 'APPROVED' && (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Approved
                          </span>
                        )}
                        {app.status === 'SUBMITTED' && (
                          <span className="bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 text-sky-600" />
                            Under Review
                          </span>
                        )}
                        {app.status === 'REJECTED' && (
                          <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            Rejected
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleDeleteApplication(app.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition"
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

      {/* Nominate / Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-sky-600">
                <UserPlus className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 text-base">
                  {isUniversity ? 'Nominate Real Medical Student' : 'New Application'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleNominateStudent} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Student Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maryam Hassan Ali"
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
                    placeholder="e.g. SNU-MED-2023-112"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Specialty</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. General Surgery & Trauma"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Host Teaching Hospital</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Madina Teaching Hospital"
                    value={targetHospital}
                    onChange={(e) => setTargetHospital(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rotation Term & Dates</label>
                <input
                  type="text"
                  value={dates}
                  onChange={(e) => setDates(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="visaCheck"
                  checked={visaRequired}
                  onChange={(e) => setVisaRequired(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded"
                />
                <label htmlFor="visaCheck" className="text-slate-700 font-semibold cursor-pointer">
                  Requires International Visa Sponsorship & Facilitation by AZAAM
                </label>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Endorsement</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Completed clinical requirements with high honors."
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
                  Submit Nomination
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
