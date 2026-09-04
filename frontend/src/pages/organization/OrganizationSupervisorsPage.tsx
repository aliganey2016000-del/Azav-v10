import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  UserCheck,
  Building2,
  Mail,
  Phone,
  Search,
  Plus,
  CheckCircle2,
  BookOpen,
  Award,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { RealDataStore, RealTrainee } from '../../services/realDataStore';

interface Supervisor {
  id: string;
  name: string;
  title: string;
  department: string;
  email: string;
  phone: string;
  activeTraineesCount: number;
  totalEndorsements: number;
  status: 'ACTIVE' | 'ON_LEAVE';
}

export const OrganizationSupervisorsPage: React.FC = () => {
  const { user } = useAuth();
  const hospitalName = user?.organizationName || 'Madina Teaching Hospital';

  const [trainees, setTrainees] = useState<RealTrainee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [supervisors, setSupervisors] = useState<Supervisor[]>([
    {
      id: 'SUP-001',
      name: 'Dr. Sarah Jenkins',
      title: 'Consultant General Surgeon & Trauma Lead',
      department: 'General Surgery & Trauma',
      email: 'sjenkins@hospital.org',
      phone: '+252 61 700 0110',
      activeTraineesCount: 3,
      totalEndorsements: 48,
      status: 'ACTIVE',
    },
    {
      id: 'SUP-002',
      name: 'Dr. Ahmed Farole',
      title: 'Senior Consultant Physician & ICU Director',
      department: 'Internal Medicine & ICU',
      email: 'afarole@hospital.org',
      phone: '+252 61 700 0220',
      activeTraineesCount: 4,
      totalEndorsements: 52,
      status: 'ACTIVE',
    },
    {
      id: 'SUP-003',
      name: 'Dr. Fatima Warsame',
      title: 'Head of Pediatrics & Neonatal Care',
      department: 'Pediatrics & Neonatology',
      email: 'fwarsame@hospital.org',
      phone: '+252 61 700 0330',
      activeTraineesCount: 2,
      totalEndorsements: 34,
      status: 'ACTIVE',
    },
    {
      id: 'SUP-004',
      name: 'Dr. Maryan Ali',
      title: 'Consultant Obstetrician & Gynecologist',
      department: 'Obstetrics & Gynecology',
      email: 'mali@hospital.org',
      phone: '+252 61 700 0440',
      activeTraineesCount: 3,
      totalEndorsements: 39,
      status: 'ACTIVE',
    },
  ]);

  const [newSup, setNewSup] = useState({
    name: '',
    title: '',
    department: 'General Surgery & Trauma',
    email: '',
    phone: '',
  });

  useEffect(() => {
    setTrainees(RealDataStore.getTrainees());
  }, []);

  const handleAddSupervisor = (e: React.FormEvent) => {
    e.preventDefault();
    const created: Supervisor = {
      id: `SUP-00${supervisors.length + 1}`,
      name: newSup.name,
      title: newSup.title,
      department: newSup.department,
      email: newSup.email,
      phone: newSup.phone,
      activeTraineesCount: 0,
      totalEndorsements: 0,
      status: 'ACTIVE',
    };
    setSupervisors([...supervisors, created]);
    setShowAddModal(false);
    setNewSup({ name: '', title: '', department: 'General Surgery & Trauma', email: '', phone: '' });
  };

  const filtered = supervisors.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-teal-50 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded border border-teal-200 uppercase tracking-wider">
              Faculty & Mentorship
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">{hospitalName}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
            Clinical Supervisors & Faculty Mentors
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl mt-0.5">
            Hospital consultants accredited for medical student teaching, logbook verifications, and clinical assessments.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Supervisor</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search consultants by name, title, department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Supervisors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((sup) => (
          <div
            key={sup.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-teal-300 transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 border border-teal-200 flex items-center justify-center font-bold text-base shrink-0">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{sup.name}</h3>
                  <p className="text-xs font-semibold text-teal-700">{sup.title}</p>
                  <p className="text-[11px] text-slate-500">{sup.department}</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {sup.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <div>
                <span className="text-slate-500">Supervised Trainees</span>
                <p className="font-bold text-slate-900 mt-0.5">{sup.activeTraineesCount} Active</p>
              </div>
              <div>
                <span className="text-slate-500">Logbook Endorsements</span>
                <p className="font-bold text-teal-700 mt-0.5">{sup.totalEndorsements} Verified</p>
              </div>
            </div>

            <div className="space-y-1 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{sup.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{sup.phone}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[11px] font-mono text-slate-400">ID: {sup.id}</span>
              <Link
                to="/organization/placements"
                className="text-teal-600 hover:text-teal-800 font-bold inline-flex items-center gap-1 text-[11px]"
              >
                <span>Assign Trainees</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Add Supervisor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Clinical Supervisor</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSupervisor} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name with Title</label>
                <input
                  type="text"
                  required
                  value={newSup.name}
                  onChange={(e) => setNewSup({ ...newSup, name: e.target.value })}
                  placeholder="e.g. Dr. Abdirahman Shire"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinical Designation</label>
                <input
                  type="text"
                  required
                  value={newSup.title}
                  onChange={(e) => setNewSup({ ...newSup, title: e.target.value })}
                  placeholder="e.g. Consultant Orthopedic Surgeon"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  required
                  value={newSup.department}
                  onChange={(e) => setNewSup({ ...newSup, department: e.target.value })}
                  placeholder="e.g. General Surgery & Trauma"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={newSup.email}
                    onChange={(e) => setNewSup({ ...newSup, email: e.target.value })}
                    placeholder="doctor@hospital.org"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    required
                    value={newSup.phone}
                    onChange={(e) => setNewSup({ ...newSup, phone: e.target.value })}
                    placeholder="+252 61..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow"
                >
                  Register Supervisor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
