import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Building2, Users, UserCheck, Mail, Phone, MapPin, Globe, Award, Edit2, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import { AdminApiService } from '../../services/admin.service';
import { AdminOrganizationDetail } from '../../types/admin.types';
import { PageHeader } from '../../components/admin/PageHeader';
import { StatusBadge, RoleBadge } from '../../components/admin/Badge';
import { LoadingState, ErrorState } from '../../components/admin/States';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/frontend';

export const OrganizationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [data, setData] = useState<AdminOrganizationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'supervisors' | 'placements' | 'staff'>('overview');

  // Edit Mode States
  const [editMode, setEditMode] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    legalName: '',
    type: 'HOSPITAL',
    registrationNumber: '',
    country: 'Somalia',
    city: '',
    state: '',
    address: '',
    postalCode: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    accreditationNumber: '',
    accreditationStatus: 'PENDING',
    contactPersonName: '',
    contactPersonEmail: '',
    contactPersonPhone: '',
    capacity: 20,
    description: '',
    notes: '',
    status: 'ACTIVE',
  });

  const fetchDetail = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await AdminApiService.getOrganizationById(id);
      setData(res);
      // Pre-populate edit form
      setFormData({
        name: res.organization.name || '',
        legalName: (res.organization as any).legalName || '',
        type: res.organization.type || 'HOSPITAL',
        registrationNumber: res.organization.registrationNumber || '',
        country: (res.organization as any).country || 'Somalia',
        city: (res.organization as any).city || '',
        state: (res.organization as any).state || '',
        address: res.organization.address || '',
        postalCode: (res.organization as any).postalCode || '',
        contactEmail: res.organization.contactEmail || '',
        contactPhone: res.organization.contactPhone || '',
        website: res.organization.website || '',
        accreditationNumber: (res.organization as any).accreditationNumber || '',
        accreditationStatus: (res.organization as any).accreditationStatus || 'PENDING',
        contactPersonName: (res.organization as any).contactPersonName || '',
        contactPersonEmail: (res.organization as any).contactPersonEmail || '',
        contactPersonPhone: (res.organization as any).contactPersonPhone || '',
        capacity: res.organization.capacity || 20,
        description: res.organization.description || '',
        notes: (res.organization as any).notes || '',
        status: res.organization.status || 'ACTIVE',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load facility details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  if (loading) return <LoadingState message="Loading facility details..." />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  const { organization, capacityStats, supervisors, staff, activePlacements } = data;

  const isArchived = organization.status === 'ARCHIVED';
  const canManage = user?.roles?.some(r => r === UserRole.SUPER_ADMIN || r === UserRole.AZAAM_STAFF || (r === UserRole.ORGANIZATION_ADMIN && user?.organizationId === organization._id));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      setActionLoading(true);
      // Front-end capacity checks
      if (formData.capacity < capacityStats.occupiedSlots) {
        const confirmSave = window.confirm(`Warning: The newly specified capacity (${formData.capacity}) is lower than the current occupied student placement slots (${capacityStats.occupiedSlots}). Do you still wish to proceed?`);
        if (!confirmSave) {
          setActionLoading(false);
          return;
        }
      }

      await AdminApiService.updateOrganization(id, formData);
      setEditMode(false);
      fetchDetail();
    } catch (err: any) {
      alert(err.message || 'Failed to update organization details.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      await AdminApiService.updateOrganizationStatus(id, 'ACTIVE');
      fetchDetail();
    } catch (err: any) {
      alert(err.message || 'Failed to restore facility profile.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/admin/organizations" className="inline-flex items-center space-x-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Facilities</span>
        </Link>

        {canManage && !editMode && (
          <button
            onClick={() => setEditMode(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition shadow-xs flex items-center space-x-1"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      {isArchived && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start space-x-3 text-xs text-rose-800">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="space-y-1">
            <p className="font-bold">Archived Healthcare Facility</p>
            <p>This medical organization is currently archived and cannot be modified. To resume active operations, you must restore it first.</p>
            {user?.roles?.some(r => r === UserRole.SUPER_ADMIN || r === UserRole.AZAAM_STAFF) && (
              <button
                onClick={handleRestore}
                disabled={actionLoading}
                className="mt-2 px-3 py-1 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-bold transition"
              >
                {actionLoading ? 'Restoring...' : 'Restore Profile'}
              </button>
            )}
          </div>
        </div>
      )}

      <PageHeader
        title={organization.name}
        description={`License: ${organization.registrationNumber} | Registered Medical Partner`}
        action={<StatusBadge status={organization.status} />}
      />

      {/* Capacity & Occupancy KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs">
          <p className="text-xs text-slate-500 font-medium uppercase">Placement Quota</p>
          <p className="text-xl font-bold text-slate-900">{capacityStats.capacity} slots</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs">
          <p className="text-xs text-slate-500 font-medium uppercase">Active Students</p>
          <p className="text-xl font-bold text-teal-700">{capacityStats.occupiedSlots}</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs">
          <p className="text-xs text-slate-500 font-medium uppercase">Remaining Slots</p>
          <p className="text-xl font-bold text-emerald-700">{capacityStats.availableSlots}</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs">
          <p className="text-xs text-slate-500 font-medium uppercase">Utilization Rate</p>
          <p className={`text-xl font-bold ${capacityStats.utilizationPercentage >= 90 ? 'text-rose-600' : 'text-slate-900'}`}>
            {capacityStats.utilizationPercentage}%
          </p>
        </div>
      </div>

      {!editMode ? (
        <>
          {/* Tabs */}
          <div className="border-b border-slate-200 flex space-x-6 text-xs font-semibold text-slate-600">
            {(['overview', 'supervisors', 'placements', 'staff'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 border-b-2 capitalize transition ${
                  activeTab === tab ? 'border-teal-600 text-teal-700 font-bold' : 'border-transparent hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Profile Details */}
              <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center space-x-1.5 text-teal-800">
                  <Building2 className="w-4 h-4" />
                  <span>Facility Profile</span>
                </h3>

                <div className="space-y-3">
                  <div className="grid grid-cols-2">
                    <span className="font-semibold text-slate-500">Legal/Official Title</span>
                    <span className="text-slate-800 font-bold">{(organization as any).legalName || organization.name}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="font-semibold text-slate-500">Facility Classification</span>
                    <span className="text-slate-800 font-semibold uppercase">{organization.type?.replace('_', ' ')}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="font-semibold text-slate-500">License Authority ID</span>
                    <span className="text-slate-800 font-mono font-bold">{organization.registrationNumber}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="font-semibold text-slate-500">Accreditation ID</span>
                    <span className="text-slate-800 font-semibold">{(organization as any).accreditationNumber || 'N/A'}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="font-semibold text-slate-500">Accreditation Status</span>
                    <span className="text-slate-800 font-bold uppercase">{(organization as any).accreditationStatus || 'PENDING'}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="font-semibold text-slate-500">Physical Address</span>
                    <span className="text-slate-800">{organization.address || 'N/A'}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="font-semibold text-slate-500">Region / Country</span>
                    <span className="text-slate-800">{(organization as any).city ? `${(organization as any).city}, ` : ''}{(organization as any).country || 'Somalia'}</span>
                  </div>
                </div>
              </div>

              {/* Personnel & Focal Person */}
              <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center space-x-1.5 text-teal-800">
                  <Award className="w-4 h-4" />
                  <span>Clinical focal person</span>
                </h3>

                <div className="space-y-3">
                  <div className="grid grid-cols-2">
                    <span className="font-semibold text-slate-500">Focal Name</span>
                    <span className="text-slate-800 font-bold">{(organization as any).contactPersonName || 'N/A'}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="font-semibold text-slate-500">Focal Email</span>
                    <span className="text-slate-800 font-semibold">{(organization as any).contactPersonEmail || 'N/A'}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="font-semibold text-slate-500">Focal Telephone</span>
                    <span className="text-slate-800">{(organization as any).contactPersonPhone || 'N/A'}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="font-semibold text-slate-500">General Facility Email</span>
                    <span className="text-slate-800 font-semibold">{organization.contactEmail}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="font-semibold text-slate-500">Official Website</span>
                    <span className="text-teal-600 hover:underline">{organization.website || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Description & Remarks */}
              {organization.description && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 md:col-span-2">
                  <h4 className="font-bold text-slate-700 mb-1">Facility Description</h4>
                  <p className="text-slate-600">{organization.description}</p>
                </div>
              )}

              {/* System Admin Remarks */}
              {(organization as any).notes && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 md:col-span-2">
                  <h4 className="font-bold text-slate-700 mb-1">Administrative remarks</h4>
                  <p className="text-slate-600 whitespace-pre-wrap">{(organization as any).notes}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'supervisors' && (
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Clinical Supervisors ({supervisors.length})</h3>
              {supervisors.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No supervisors registered for this facility.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {supervisors.map((s: any) => (
                    <div key={s._id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900">{s.userId?.firstName} {s.userId?.lastName}</p>
                        <p className="text-slate-500 text-[11px]">{s.qualification || 'Clinical Mentor'} • License: {s.licenseNumber || 'Verified'}</p>
                      </div>
                      <StatusBadge status={s.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'placements' && (
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Active Student Attachments ({activePlacements.length})</h3>
              {activePlacements.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No active student placements assigned right now.</p>
              ) : (
                <div className="space-y-2 text-xs">
                  {activePlacements.map((p: any) => (
                    <div key={p._id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900">{p.studentId?.firstName} {p.studentId?.lastName}</span>
                        <span className="text-slate-500 block text-[11px]">University: {p.universityId?.name || 'Independent'}</span>
                      </div>
                      <StatusBadge status={p.status || 'ACTIVE'} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Administrative Staff ({staff.length})</h3>
              {staff.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No administrative accounts assigned yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {staff.map((s: any) => (
                    <div key={s._id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900">{s.firstName} {s.lastName}</p>
                        <p className="text-slate-500 text-[11px]">{s.email}</p>
                      </div>
                      <RoleBadge role={s.roles?.[0] || 'ORGANIZATION_STAFF'} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        /* Edit Mode Form */
        <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs space-y-6 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Display Name *</label>
              <input
                type="text"
                required
                disabled={isArchived}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Legal Name</label>
              <input
                type="text"
                disabled={isArchived}
                value={formData.legalName}
                onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Facility Type</label>
              <select
                disabled={isArchived}
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="HOSPITAL">HOSPITAL</option>
                <option value="CLINIC">CLINIC</option>
                <option value="MEDICAL_CENTER">MEDICAL CENTER</option>
                <option value="HEALTH_CENTER">HEALTH CENTER</option>
                <option value="TEACHING_HOSPITAL">TEACHING HOSPITAL</option>
                <option value="SPECIALIZED_CENTER">SPECIALIZED CENTER</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Placement Quota Capacity *</label>
              <input
                type="number"
                required
                disabled={isArchived}
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value, 10) || 20 })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Registration/License Number</label>
              <input
                type="text"
                disabled={isArchived}
                value={formData.registrationNumber}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Accreditation ID</label>
              <input
                type="text"
                disabled={isArchived}
                value={formData.accreditationNumber}
                onChange={(e) => setFormData({ ...formData, accreditationNumber: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Accreditation Status</label>
              <select
                disabled={isArchived}
                value={formData.accreditationStatus}
                onChange={(e) => setFormData({ ...formData, accreditationStatus: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="PENDING">PENDING</option>
                <option value="ACCREDITED">ACCREDITED</option>
                <option value="EXPIRED">EXPIRED</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Focal Person Name</label>
              <input
                type="text"
                disabled={isArchived}
                value={formData.contactPersonName}
                onChange={(e) => setFormData({ ...formData, contactPersonName: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Focal Person Email</label>
              <input
                type="email"
                disabled={isArchived}
                value={formData.contactPersonEmail}
                onChange={(e) => setFormData({ ...formData, contactPersonEmail: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Focal Person Direct Line</label>
              <input
                type="text"
                disabled={isArchived}
                value={formData.contactPersonPhone}
                onChange={(e) => setFormData({ ...formData, contactPersonPhone: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">General Contact Email</label>
              <input
                type="email"
                required
                disabled={isArchived}
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Physical Address</label>
            <input
              type="text"
              disabled={isArchived}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Public Description</label>
            <textarea
              rows={3}
              disabled={isArchived}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Administrative Notes</label>
            <textarea
              rows={3}
              disabled={isArchived}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditMode(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg font-semibold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading || isArchived}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700 transition"
            >
              {actionLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
