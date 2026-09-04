import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  UserCheck,
  Plus,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  TrendingUp,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Department {
  id: string;
  name: string;
  head: string;
  capacity: number;
  active: number;
  ward: string;
  description: string;
  status: 'ACTIVE' | 'AT_CAPACITY' | 'EXPANDING';
}

export const OrganizationDepartmentsPage: React.FC = () => {
  const { user } = useAuth();
  const hospitalName = user?.organizationName || 'Madina Teaching Hospital';

  const [departments, setDepartments] = useState<Department[]>([
    {
      id: 'DEP-01',
      name: 'General Surgery & Trauma',
      head: 'Dr. Sarah Jenkins',
      capacity: 12,
      active: 8,
      ward: 'Building A, 3rd Floor',
      description: 'Major emergency trauma theatre, minor surgical procedures, ICU post-operative ward.',
      status: 'ACTIVE',
    },
    {
      id: 'DEP-02',
      name: 'Internal Medicine & ICU',
      head: 'Dr. Ahmed Farole',
      capacity: 15,
      active: 11,
      ward: 'Building B, 2nd Floor',
      description: 'Critical care units, nephrology, cardiology step-down, and inpatient medical wards.',
      status: 'ACTIVE',
    },
    {
      id: 'DEP-03',
      name: 'Pediatrics & Neonatology',
      head: 'Dr. Fatima Warsame',
      capacity: 10,
      active: 6,
      ward: 'Building C, 1st Floor',
      description: 'NICU, malnutrition stabilization, pediatric emergency triage, and outpatient clinics.',
      status: 'ACTIVE',
    },
    {
      id: 'DEP-04',
      name: 'Obstetrics & Gynecology',
      head: 'Dr. Maryan Ali',
      capacity: 12,
      active: 9,
      ward: 'Maternity Wing',
      description: 'Labour suites, high-risk pregnancy ward, prenatal ultrasound, and reproductive health.',
      status: 'ACTIVE',
    },
    {
      id: 'DEP-05',
      name: 'Emergency & Acute Care',
      head: 'Dr. Osman Jama',
      capacity: 8,
      active: 8,
      ward: 'Emergency Pavilion',
      description: 'Red/Yellow trauma resuscitation bays, rapid diagnostics, and toxicology.',
      status: 'AT_CAPACITY',
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newDept, setNewDept] = useState({
    name: '',
    head: '',
    capacity: 10,
    ward: '',
    description: '',
  });

  const totalCapacity = departments.reduce((sum, d) => sum + d.capacity, 0);
  const totalOccupied = departments.reduce((sum, d) => sum + d.active, 0);

  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    const created: Department = {
      id: `DEP-0${departments.length + 1}`,
      name: newDept.name,
      head: newDept.head,
      capacity: Number(newDept.capacity),
      active: 0,
      ward: newDept.ward,
      description: newDept.description,
      status: 'ACTIVE',
    };
    setDepartments([...departments, created]);
    setShowAddModal(false);
    setNewDept({ name: '', head: '', capacity: 10, ward: '', description: '' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-teal-50 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded border border-teal-200 uppercase tracking-wider">
              Teaching Hospital Infrastructure
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">{hospitalName}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
            Clinical Departments & Ward Capacity
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl mt-0.5">
            Configure hospital training units, allocated trainee quotas, and designated clinical leads.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Department</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500">Active Clinical Departments</span>
          <p className="text-2xl font-bold text-slate-900">{departments.length} Units</p>
          <p className="text-[11px] text-teal-600 font-medium">All accredited for rotations</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500">Total Placement Quota</span>
          <p className="text-2xl font-bold text-slate-900">{totalCapacity} Trainees</p>
          <p className="text-[11px] text-slate-500">{totalOccupied} Slots Currently Occupied</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500">Occupancy Rate</span>
          <p className="text-2xl font-bold text-sky-700 font-mono">
            {Math.round((totalOccupied / totalCapacity) * 100)}%
          </p>
          <p className="text-[11px] text-emerald-600 font-medium">
            {totalCapacity - totalOccupied} Openings Available
          </p>
        </div>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {departments.map((dept) => (
          <div
            key={dept.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-teal-300 transition"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 font-semibold">{dept.id}</span>
                <h3 className="font-bold text-slate-900 text-sm mt-0.5">{dept.name}</h3>
                <p className="text-xs text-slate-500">{dept.ward}</p>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  dept.status === 'AT_CAPACITY'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-teal-100 text-teal-800'
                }`}
              >
                {dept.status === 'AT_CAPACITY' ? 'Full' : 'Active'}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed min-h-[36px]">
              {dept.description}
            </p>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-600">Capacity Occupancy</span>
                <span className="text-slate-900 font-mono">
                  {dept.active} / {dept.capacity} ({Math.round((dept.active / dept.capacity) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full ${
                    dept.active >= dept.capacity ? 'bg-amber-500' : 'bg-teal-600'
                  }`}
                  style={{ width: `${Math.min(100, (dept.active / dept.capacity) * 100)}%` }}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-700">
                <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                <span className="font-medium truncate max-w-[140px]">{dept.head}</span>
              </div>
              <Link
                to="/organization/placements"
                className="text-teal-600 hover:text-teal-800 font-bold inline-flex items-center gap-1 text-[11px]"
              >
                <span>View Placements</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Add Department Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Clinical Department</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddDept} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  value={newDept.name}
                  onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                  placeholder="e.g. Ophthalmology & Eye Surgery"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Head of Department / Clinical Lead</label>
                <input
                  type="text"
                  required
                  value={newDept.head}
                  onChange={(e) => setNewDept({ ...newDept, head: e.target.value })}
                  placeholder="e.g. Dr. Hassan Nur"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Trainee Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={newDept.capacity}
                    onChange={(e) => setNewDept({ ...newDept, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ward Location</label>
                  <input
                    type="text"
                    required
                    value={newDept.ward}
                    onChange={(e) => setNewDept({ ...newDept, ward: e.target.value })}
                    placeholder="e.g. Wing D, Level 2"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newDept.description}
                  onChange={(e) => setNewDept({ ...newDept, description: e.target.value })}
                  placeholder="Clinical procedures, outpatient services, and teaching rounds..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
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
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
