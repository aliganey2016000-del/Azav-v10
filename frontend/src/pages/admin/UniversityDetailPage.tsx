import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, GraduationCap, Users, FileText, Building, Mail, Phone, Globe, MapPin, Award, Edit2, CheckCircle, ShieldAlert, Archive, Sparkles } from 'lucide-react';
import { AdminApiService } from '../../services/admin.service';
import { AdminUniversityDetail } from '../../types/admin.types';
import { PageHeader } from '../../components/admin/PageHeader';
import { StatusBadge, RoleBadge } from '../../components/admin/Badge';
import { LoadingState, ErrorState } from '../../components/admin/States';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/frontend';

export const UniversityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [data, setData] = useState<AdminUniversityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Mode States
  const [editMode, setEditMode] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    officialName: '',
    abbreviation: '',
    code: '',
    email: '',
    phone: '',
    website: '',
    country: '',
    city: '',
    state: '',
    address: '',
    postalCode: '',
    accreditationNumber: '',
    accreditationStatus: '',
    contactPersonName: '',
    contactPersonEmail: '',
    contactPersonPhone: '',
    notes: '',
    capacity: 100,
    status: '',
  });

  const fetchDetail = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await AdminApiService.getUniversityById(id);
      setData(res);
      // Pre-populate edit form
      setFormData({
        name: res.university.name || '',
        officialName: (res.university as any).officialName || '',
        abbreviation: (res.university as any).abbreviation || '',
        code: res.university.code || '',
        email: res.university.email || '',
        phone: res.university.phone || '',
        website: res.university.website || '',
        country: (res.university as any).country || 'Somalia',
        city: (res.university as any).city || '',
        state: (res.university as any).state || '',
        address: res.university.address || '',
        postalCode: (res.university as any).postalCode || '',
        accreditationNumber: (res.university as any).accreditationNumber || '',
        accreditationStatus: (res.university as any).accreditationStatus || 'PENDING',
        contactPersonName: (res.university as any).contactPersonName || '',
        contactPersonEmail: (res.university as any).contactPersonEmail || '',
        contactPersonPhone: (res.university as any).contactPersonPhone || '',
        notes: (res.university as any).notes || '',
        capacity: res.university.capacity || 100,
        status: res.university.status || 'ACTIVE',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load university details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  if (loading) return <LoadingState message="Loading university details..." />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  const { university, stats, administrators } = data;

  const isArchived = university.status === 'ARCHIVED';
  const canManage = user?.roles?.some(r => r === UserRole.SUPER_ADMIN || r === UserRole.AZAAM_STAFF || (r === UserRole.UNIVERSITY_ADMIN && user?.universityId === university._id));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      setActionLoading(true);
      await AdminApiService.updateUniversity(id, formData);
      setEditMode(false);
      fetchDetail();
    } catch (err: any) {
      alert(err.message || 'Failed to update university details.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      await AdminApiService.updateUniversityStatus(id, 'ACTIVE');
      fetchDetail();
    } catch (err: any) {
      alert(err.message || 'Failed to restore university.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/admin/universities" className="inline-flex items-center space-x-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Universities</span>
        </Link>

        {canManage && !editMode && (
          <button
            onClick={() => setEditMode(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition shadow-xs flex items-center space-x-1"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Information</span>
          </button>
        )}
      </div>

      {isArchived && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start space-x-3 text-xs text-rose-800">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="space-y-1">
            <p className="font-bold">Archived Partner Institution</p>
            <p>This university profile is currently archived and cannot be modified. To resume operations or make changes, you must restore it first.</p>
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
        title={university.name}
        description={`Code: ${university.code} | Registered Academic Partner`}
        action={<StatusBadge status={university.status} />}
      />

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center space-x-3">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase">Active Students</p>
            <p className="text-xl font-bold text-slate-900">{stats.studentsCount}</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center space-x-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase">Total Applications</p>
            <p className="text-xl font-bold text-slate-900">{stats.applicationsCount}</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center space-x-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase">Enrolled Quota</p>
            <p className="text-xl font-bold text-slate-900">{stats.activePlacementsCount} / {university.capacity || 100} slots</p>
          </div>
        </div>
      </div>

      {!editMode ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Metadata */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center space-x-1.5 text-teal-800">
              <GraduationCap className="w-4 h-4" />
              <span>Institutional Metadata</span>
            </h3>

            <div className="space-y-3">
              <div className="grid grid-cols-2">
                <span className="font-semibold text-slate-500">Official Name</span>
                <span className="text-slate-800 font-bold">{(university as any).officialName || university.name}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="font-semibold text-slate-500">Abbreviation</span>
                <span className="text-slate-800 font-mono font-bold">{(university as any).abbreviation || university.code}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="font-semibold text-slate-500">Accreditation ID</span>
                <span className="text-slate-800 font-semibold">{(university as any).accreditationNumber || 'Not Registered'}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="font-semibold text-slate-500">Accreditation Status</span>
                <span className="text-slate-800 font-bold uppercase">{(university as any).accreditationStatus || 'PENDING'}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="font-semibold text-slate-500">Physical Address</span>
                <span className="text-slate-800">{university.address || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="font-semibold text-slate-500">City / Country</span>
                <span className="text-slate-800">{(university as any).city ? `${(university as any).city}, ` : ''}{(university as any).country || 'Somalia'}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Contact & Personnel */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center space-x-1.5 text-teal-800">
              <Award className="w-4 h-4" />
              <span>Registrar & Focal Person</span>
            </h3>

            <div className="space-y-3">
              <div className="grid grid-cols-2">
                <span className="font-semibold text-slate-500">Focal Name</span>
                <span className="text-slate-800 font-bold">{(university as any).contactPersonName || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="font-semibold text-slate-500">Focal Email</span>
                <span className="text-slate-800 font-semibold">{(university as any).contactPersonEmail || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="font-semibold text-slate-500">Focal Telephone</span>
                <span className="text-slate-800">{(university as any).contactPersonPhone || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Bottom Grid: Admins & System Notes */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-3 md:col-span-2">
            <h3 className="text-sm font-bold text-slate-900 pb-1.5 border-b border-slate-100 text-teal-850">University Administrative Contacts</h3>
            {administrators.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No administrative accounts assigned yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {administrators.map((admin) => (
                  <div key={admin._id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{admin.firstName} {admin.lastName}</p>
                      <p className="text-slate-500 text-[11px]">{admin.email}</p>
                    </div>
                    <RoleBadge role={admin.roles?.[0] || 'UNIVERSITY_ADMIN'} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* System Notes */}
          {(university as any).notes && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 md:col-span-2 text-xs">
              <h4 className="font-bold text-slate-700 mb-1">System Audit & Collaboration Notes</h4>
              <p className="text-slate-600 whitespace-pre-wrap">{(university as any).notes}</p>
            </div>
          )}
        </div>
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
                value={formData.officialName}
                onChange={(e) => setFormData({ ...formData, officialName: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Abbreviation</label>
              <input
                type="text"
                disabled={isArchived}
                value={formData.abbreviation}
                onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Student Capacity *</label>
              <input
                type="number"
                required
                disabled={isArchived}
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value, 10) || 100 })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ministry Accreditation Number</label>
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
              <label className="block font-semibold text-slate-700 mb-1">Registrar Focal Person Name</label>
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
              <label className="block font-semibold text-slate-700 mb-1">Focal Person Direct Phone</label>
              <input
                type="text"
                disabled={isArchived}
                value={formData.contactPersonPhone}
                onChange={(e) => setFormData({ ...formData, contactPersonPhone: e.target.value })}
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
            <label className="block font-semibold text-slate-700 mb-1">Administrative Notes & Remarks</label>
            <textarea
              rows={4}
              disabled={isArchived}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add secure remarks visible to authorized staff..."
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
