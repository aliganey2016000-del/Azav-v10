import React, { useEffect, useState } from 'react';
import { Building2, KeyRound, MapPin, ShieldCheck } from 'lucide-react';
import api from '../../services/api';
import { AdminOrganization } from '../../types/admin.types';
import { Modal } from './Modal';

interface Props {
  organization: AdminOrganization | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const EMPTY_FORM = {
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
};

export const OrganizationEditModal: React.FC<Props> = ({ organization, isOpen, onClose, onSaved }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [adminUser, setAdminUser] = useState<any | null>(null);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');
  const [adminStatus, setAdminStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!isOpen || !organization) return;

    const load = async () => {
      try {
        setLoading(true);
        setMessage(null);
        const res = await api.get(`/admin/organizations/${organization._id}`);
        const detail = res.data?.data;
        const org = detail?.organization || organization;

        setForm({
          name: org.name || '',
          legalName: org.legalName || org.name || '',
          type: org.type || 'HOSPITAL',
          registrationNumber: org.registrationNumber || '',
          country: org.country || 'Somalia',
          city: org.city || '',
          state: org.state || '',
          address: org.address || '',
          postalCode: org.postalCode || '',
          contactEmail: org.contactEmail || '',
          contactPhone: org.contactPhone || '',
          website: org.website || '',
          accreditationNumber: org.accreditationNumber || '',
          accreditationStatus: org.accreditationStatus || 'PENDING',
          contactPersonName: org.contactPersonName || '',
          contactPersonEmail: org.contactPersonEmail || '',
          contactPersonPhone: org.contactPersonPhone || '',
          capacity: org.capacity || 20,
          description: org.description || '',
          notes: org.notes || '',
        });

        const admin = (detail?.staff || []).find((item: any) => item?.roles?.includes('ORGANIZATION_ADMIN')) || null;
        setAdminUser(admin);
        setAdminEmail(admin?.email || '');
        setAdminFirstName(admin?.firstName || '');
        setAdminLastName(admin?.lastName || '');
        setAdminStatus(admin?.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE');
        setNewPassword('');
      } catch (error: any) {
        setMessage({ type: 'error', text: error?.response?.data?.error?.message || error?.message || 'Failed to load facility.' });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isOpen, organization?._id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;

    if (adminUser && !adminEmail.trim()) {
      setMessage({ type: 'error', text: 'Admin login email / username is required.' });
      return;
    }
    if (newPassword && newPassword.length < 12) {
      setMessage({ type: 'error', text: 'New password must be at least 12 characters.' });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      await api.patch(`/admin/organizations/${organization._id}`, {
        ...form,
        legalName: form.legalName || form.name,
        capacity: Number(form.capacity) || 20,
      });

      if (adminUser) {
        await api.patch(`/admin/organizations/${organization._id}/admin-account/${adminUser._id}`, {
          firstName: adminFirstName.trim(),
          lastName: adminLastName.trim(),
          email: adminEmail.trim().toLowerCase(),
          status: adminStatus,
          newPassword: newPassword || undefined,
        });
      }

      setMessage({ type: 'success', text: newPassword ? 'Facility, admin user and password updated.' : 'Facility and admin user updated.' });
      setNewPassword('');
      onSaved();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error?.response?.data?.error?.message || error?.message || 'Failed to update facility.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Facility${organization ? ` — ${organization.name}` : ''}`} maxWidth="lg">
      {loading ? (
        <div className="py-8 text-center text-sm text-slate-500">Loading facility details...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 text-xs max-h-[80vh] overflow-y-auto pr-2">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3">
            <h3 className="font-bold text-slate-900 border-b pb-1.5 flex items-center gap-1.5 text-teal-800">
              <Building2 className="w-4 h-4" /> Facility Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Facility Name *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full p-2 bg-white border border-slate-200 rounded-lg" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Legal Name</label>
                <input value={form.legalName} onChange={(e) => setForm({ ...form, legalName: e.target.value })} className="w-full p-2 bg-white border border-slate-200 rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Facility Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full p-2 bg-white border border-slate-200 rounded-lg">
                  <option value="HOSPITAL">HOSPITAL</option>
                  <option value="CLINIC">CLINIC</option>
                  <option value="MEDICAL_CENTER">MEDICAL CENTER</option>
                  <option value="HEALTH_CENTER">HEALTH CENTER</option>
                  <option value="TEACHING_HOSPITAL">TEACHING HOSPITAL</option>
                  <option value="SPECIALIZED_CENTER">SPECIALIZED CENTER</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Registration / License ID</label>
                <input value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Placement Quota</label>
                <input type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value, 10) || 20 })} className="w-full p-2 bg-white border border-slate-200 rounded-lg" />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3">
            <h3 className="font-bold text-slate-900 border-b pb-1.5 flex items-center gap-1.5 text-teal-800">
              <MapPin className="w-4 h-4" /> Contact & Location
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><label className="block font-semibold text-slate-700 mb-1">Official Email</label><input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className="w-full p-2 bg-white border border-slate-200 rounded-lg" /></div>
              <div><label className="block font-semibold text-slate-700 mb-1">Telephone</label><input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className="w-full p-2 bg-white border border-slate-200 rounded-lg" /></div>
              <div><label className="block font-semibold text-slate-700 mb-1">Website</label><input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="w-full p-2 bg-white border border-slate-200 rounded-lg" /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2"><label className="block font-semibold text-slate-700 mb-1">Address</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full p-2 bg-white border border-slate-200 rounded-lg" /></div>
              <div><label className="block font-semibold text-slate-700 mb-1">City</label><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full p-2 bg-white border border-slate-200 rounded-lg" /></div>
              <div><label className="block font-semibold text-slate-700 mb-1">Country</label><input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="w-full p-2 bg-white border border-slate-200 rounded-lg" /></div>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3">
            <h3 className="font-bold text-slate-900 border-b pb-1.5 text-teal-800">Accreditation & Focal Person</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><label className="block font-semibold text-slate-700 mb-1">Accreditation ID</label><input value={form.accreditationNumber} onChange={(e) => setForm({ ...form, accreditationNumber: e.target.value })} className="w-full p-2 bg-white border border-slate-200 rounded-lg" /></div>
              <div><label className="block font-semibold text-slate-700 mb-1">Accreditation Status</label><select value={form.accreditationStatus} onChange={(e) => setForm({ ...form, accreditationStatus: e.target.value })} className="w-full p-2 bg-white border border-slate-200 rounded-lg"><option value="PENDING">PENDING REVIEW</option><option value="ACCREDITED">FULLY ACCREDITED</option><option value="EXPIRED">EXPIRED / SUSPENDED</option></select></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><label className="block font-semibold text-slate-700 mb-1">Focal Person Name</label><input value={form.contactPersonName} onChange={(e) => setForm({ ...form, contactPersonName: e.target.value })} className="w-full p-2 bg-white border border-slate-200 rounded-lg" /></div>
              <div><label className="block font-semibold text-slate-700 mb-1">Focal Person Email</label><input type="email" value={form.contactPersonEmail} onChange={(e) => setForm({ ...form, contactPersonEmail: e.target.value })} className="w-full p-2 bg-white border border-slate-200 rounded-lg" /></div>
              <div><label className="block font-semibold text-slate-700 mb-1">Focal Person Phone</label><input value={form.contactPersonPhone} onChange={(e) => setForm({ ...form, contactPersonPhone: e.target.value })} className="w-full p-2 bg-white border border-slate-200 rounded-lg" /></div>
            </div>
          </div>

          <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-200 space-y-3">
            <h3 className="font-bold text-slate-900 border-b border-indigo-200 pb-1.5 flex items-center gap-1.5 text-indigo-800">
              <ShieldCheck className="w-4 h-4" /> Hospital Admin Login
            </h3>
            {adminUser ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><label className="block font-semibold text-slate-700 mb-1">Admin First Name</label><input value={adminFirstName} onChange={(e) => setAdminFirstName(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg" /></div>
                  <div><label className="block font-semibold text-slate-700 mb-1">Admin Last Name</label><input value={adminLastName} onChange={(e) => setAdminLastName(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">User / Login Email *</label>
                    <input type="email" required value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Account Status</label>
                    <select value={adminStatus} onChange={(e) => setAdminStatus(e.target.value as 'ACTIVE' | 'INACTIVE')} className="w-full p-2 bg-white border border-slate-200 rounded-lg"><option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option></select>
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">New Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input type="password" minLength={12} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Leave blank to keep current password" className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg font-mono" />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Enter 12+ characters only when you want to replace the current password.</p>
                </div>
              </>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">No ORGANIZATION_ADMIN user is linked to this facility yet.</div>
            )}
          </div>

          {message && <div className={`p-3 rounded-lg border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>{message.text}</div>}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-100">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      )}
    </Modal>
  );
};
