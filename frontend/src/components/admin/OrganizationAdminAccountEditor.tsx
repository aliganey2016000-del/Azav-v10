import React, { useEffect, useMemo, useState } from 'react';
import { KeyRound, ShieldCheck, X } from 'lucide-react';
import { AdminApiService } from '../../services/admin.service';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/frontend';

interface Props {
  organizationId: string;
}

export const OrganizationAdminAccountEditor: React.FC<Props> = ({ organizationId }) => {
  const { user } = useAuth();
  const canManageCredentials = user?.roles?.some(
    (role) => role === UserRole.SUPER_ADMIN || role === UserRole.AZAAM_STAFF
  );

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [staff, setStaff] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const admins = useMemo(
    () => staff.filter((item) => item?.roles?.includes('ORGANIZATION_ADMIN')),
    [staff]
  );
  const selectedAdmin = admins.find((item) => item._id === selectedId) || admins[0];

  const hydrateSelected = (admin: any) => {
    if (!admin) return;
    setSelectedId(admin._id);
    setFirstName(admin.firstName || '');
    setLastName(admin.lastName || '');
    setEmail(admin.email || '');
    setStatus(admin.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE');
    setNewPassword('');
  };

  const load = async () => {
    try {
      setLoading(true);
      setMessage(null);
      const detail = await AdminApiService.getOrganizationById(organizationId);
      const items = detail.staff || [];
      setStaff(items);
      const current = items.find((item: any) => item?.roles?.includes('ORGANIZATION_ADMIN'));
      if (current) hydrateSelected(current);
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Failed to load hospital admin account.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open, organizationId]);

  useEffect(() => {
    if (selectedAdmin && selectedAdmin._id !== selectedId) hydrateSelected(selectedAdmin);
  }, [selectedAdmin?._id]);

  if (!canManageCredentials) return null;

  const saveAccount = async () => {
    if (!selectedAdmin) return;
    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Login email is required.' });
      return;
    }
    if (newPassword && newPassword.length < 12) {
      setMessage({ type: 'error', text: 'New password must be at least 12 characters.' });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);
      await api.patch(`/admin/organizations/${organizationId}/admin-account/${selectedAdmin._id}`, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        status,
        newPassword: newPassword || undefined,
      });
      setNewPassword('');
      setMessage({ type: 'success', text: newPassword ? 'Hospital admin login and password updated.' : 'Hospital admin account updated.' });
      await load();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error?.response?.data?.error?.message || error?.message || 'Failed to update hospital admin account.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-3.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition shadow-xs flex items-center space-x-1.5"
      >
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Hospital Admin Account</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] bg-slate-950/45 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Hospital Admin Account</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Edit the hospital administrator login account and reset its password.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {loading ? (
                <p className="text-slate-500">Loading hospital admin account...</p>
              ) : admins.length === 0 ? (
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900">
                  No ORGANIZATION_ADMIN account is linked to this hospital yet. Create one from User Management and assign this hospital.
                </div>
              ) : (
                <>
                  {admins.length > 1 && (
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Admin Account</label>
                      <select
                        value={selectedId}
                        onChange={(e) => hydrateSelected(admins.find((item) => item._id === e.target.value))}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg"
                      >
                        {admins.map((admin) => (
                          <option key={admin._id} value={admin._id}>{admin.firstName} {admin.lastName} — {admin.email}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">First Name</label>
                      <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg" />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Last Name</label>
                      <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg" />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Login Email / Username</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-700" />
                    <p className="text-[10px] text-slate-400 mt-1">This is the username/email used on the login page.</p>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Account Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-slate-200">
                    <label className="block font-semibold text-slate-700 mb-1">New Password</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        minLength={12}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Leave blank to keep current password"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Existing passwords cannot be displayed because they are stored securely as hashes. Enter a new 12+ character password to replace it.</p>
                  </div>

                  <button type="button" onClick={saveAccount} disabled={saving} className="w-full px-4 py-2.5 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 disabled:opacity-50">
                    {saving ? 'Saving...' : newPassword ? 'Save Account & Reset Password' : 'Save Admin Account'}
                  </button>
                </>
              )}

              {message && (
                <div className={`p-3 rounded-lg border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                  {message.text}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
