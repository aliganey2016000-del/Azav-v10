import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, GraduationCap, Eye, Pencil, CheckCircle, XCircle, ShieldAlert, MapPin, UserRound, Phone, Mail, Building2 } from 'lucide-react';
import { AdminApiService } from '../../services/admin.service';
import { AdminUniversity, PaginationMeta } from '../../types/admin.types';
import { PageHeader } from '../../components/admin/PageHeader';
import { SearchInput } from '../../components/admin/SearchInput';
import { Pagination } from '../../components/admin/Pagination';
import { StatusBadge } from '../../components/admin/Badge';
import { Modal } from '../../components/admin/Modal';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { LoadingState, ErrorState, EmptyState } from '../../components/admin/States';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/frontend';

export const UniversitiesPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [universities, setUniversities] = useState<AdminUniversity[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [universityModalOpen, setUniversityModalOpen] = useState(false);
  const [editingUniversity, setEditingUniversity] = useState<AdminUniversity | null>(null);
  const [selectedUni, setSelectedUni] = useState<AdminUniversity | null>(null);
  const [confirmStatusOpen, setConfirmStatusOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ARCHIVED'>('ACTIVE');
  const [actionLoading, setActionLoading] = useState(false);

  const initialForm = {
    name: '', code: '', officialName: '', abbreviation: '', email: '', phone: '', website: '',
    country: 'Somalia', city: '', state: '', address: '', postalCode: '', accreditationNumber: '',
    accreditationStatus: 'PENDING', contactPersonName: '', contactPersonEmail: '', contactPersonPhone: '',
    notes: '', capacity: 100, createInitialAdmin: false, initialAdminEmail: '', initialAdminPassword: '',
    initialAdminFirstName: '', initialAdminLastName: '',
  };
  const [formData, setFormData] = useState(initialForm);

  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const searchParam = searchParams.get('search') || '';
  const statusParam = searchParams.get('status') || '';
  const countryParam = searchParams.get('country') || '';

  const fetchUniversities = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const res = await AdminApiService.getUniversities({ page: pageParam, limit: 20, search: searchParam, status: statusParam });
      let filtered = res.universities || [];
      if (countryParam && res.universities) filtered = res.universities.filter((uni: any) => uni.country?.toLowerCase().includes(countryParam.toLowerCase()));
      setUniversities(filtered);
      setPagination(res.pagination || { page: pageParam, limit: 20, total: filtered.length, totalPages: Math.ceil(filtered.length / 20) || 1 });
    } catch (err: any) { setError(err.message || 'Failed to load universities.'); }
    finally { setLoading(false); }
  }, [pageParam, searchParam, statusParam, countryParam]);

  useEffect(() => { fetchUniversities(); }, [fetchUniversities]);

  const updateQueryParam = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams); if (value) p.set(key, value); else p.delete(key); p.set('page', '1'); setSearchParams(p);
  };

  const openCreateModal = () => {
    setEditingUniversity(null);
    setFormData(initialForm);
    setUniversityModalOpen(true);
  };

  const openEditModal = (uni: AdminUniversity) => {
    const data = uni as any;
    setEditingUniversity(uni);
    setFormData({
      ...initialForm,
      name: data.name || data.officialName || '',
      code: data.code || '',
      officialName: data.officialName || data.name || '',
      abbreviation: data.abbreviation || data.code || '',
      email: data.email || data.contactPersonEmail || '',
      phone: data.phone || data.contactPersonPhone || '',
      website: data.website || '',
      country: data.country || 'Somalia',
      city: data.city || '',
      state: data.state || '',
      address: data.address || '',
      postalCode: data.postalCode || '',
      accreditationNumber: data.accreditationNumber || '',
      accreditationStatus: data.accreditationStatus || 'PENDING',
      contactPersonName: data.contactPersonName || '',
      contactPersonEmail: data.contactPersonEmail || data.email || '',
      contactPersonPhone: data.contactPersonPhone || data.phone || '',
      notes: data.notes || '',
      capacity: data.capacity || 100,
      createInitialAdmin: false,
      initialAdminEmail: '',
      initialAdminPassword: '',
      initialAdminFirstName: '',
      initialAdminLastName: '',
    });
    setUniversityModalOpen(true);
  };

  const closeUniversityModal = () => {
    if (actionLoading) return;
    setUniversityModalOpen(false);
    setEditingUniversity(null);
    setFormData(initialForm);
  };

  const handleUniversitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const payload: any = {
        name: formData.officialName,
        code: formData.code,
        officialName: formData.officialName,
        abbreviation: formData.code,
        email: formData.contactPersonEmail,
        phone: formData.contactPersonPhone,
        country: formData.country,
        city: formData.city,
        address: formData.address,
        accreditationStatus: formData.accreditationStatus || 'PENDING',
        contactPersonName: formData.contactPersonName,
        contactPersonEmail: formData.contactPersonEmail,
        contactPersonPhone: formData.contactPersonPhone,
        capacity: formData.capacity || 100,
      };

      if (editingUniversity) {
        await AdminApiService.updateUniversity(editingUniversity._id, payload);
      } else {
        if (formData.createInitialAdmin) {
          payload.initialAdminEmail = formData.initialAdminEmail;
          payload.initialAdminPassword = formData.initialAdminPassword;
          payload.initialAdminFirstName = formData.initialAdminFirstName;
          payload.initialAdminLastName = formData.initialAdminLastName;
        }
        await AdminApiService.createUniversity(payload);
      }

      setUniversityModalOpen(false);
      setEditingUniversity(null);
      setFormData(initialForm);
      fetchUniversities();
    } catch (err: any) {
      alert(err.message || ('Failed to ' + (editingUniversity ? 'update' : 'create') + ' university.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedUni) return;
    try { setActionLoading(true); await AdminApiService.updateUniversityStatus(selectedUni._id, targetStatus); setConfirmStatusOpen(false); setSelectedUni(null); fetchUniversities(); }
    catch (err: any) { alert(err.message || 'Failed to update university status.'); }
    finally { setActionLoading(false); }
  };

  const canManage = user?.roles?.some(r => r === UserRole.SUPER_ADMIN || r === UserRole.AZAAM_STAFF);
  const activeCount = universities.filter(u => u?.status === 'ACTIVE').length;
  const suspendedCount = universities.filter(u => u?.status === 'SUSPENDED').length;
  const archivedCount = universities.filter(u => u?.status === 'ARCHIVED').length;
  const inputClass = 'w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-400 outline-none transition shadow-sm';

  return (
    <div className="space-y-6">
      <PageHeader title="University Management" description="Partner universities, academic institutions, and student enrollment capacity." action={canManage && (
        <button onClick={openCreateModal} className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition shadow-xs flex items-center space-x-1.5"><Plus className="w-4 h-4" /><span>Register University</span></button>
      )} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[['Total Registers', pagination?.total ?? universities.length, 'text-slate-400'], ['Active Partner', activeCount, 'text-emerald-500'], ['Suspended', suspendedCount, 'text-amber-500'], ['Archived', archivedCount, 'text-rose-500']].map(([label, value, color]) => (
          <div key={String(label)} className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs"><div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${color}`}>{label}</div><div className="text-2xl font-bold text-slate-900">{value}</div></div>
        ))}
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 max-w-md"><SearchInput value={searchParam} onChange={(v) => updateQueryParam('search', v)} placeholder="Search code, name, official title, city..." /></div>
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select value={statusParam} onChange={(e) => updateQueryParam('status', e.target.value)} className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"><option value="">All Statuses</option><option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option><option value="SUSPENDED">SUSPENDED</option><option value="ARCHIVED">ARCHIVED</option></select>
          <input type="text" placeholder="Filter Country..." value={countryParam} onChange={(e) => updateQueryParam('country', e.target.value)} className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 max-w-[150px]" />
        </div>
      </div>

      {loading ? <LoadingState message="Loading university list..." /> : error ? <ErrorState message={error} onRetry={fetchUniversities} /> : universities.length === 0 ? <EmptyState title="No universities found" description="Create a new institution or adjust search filters." /> : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="hidden md:block overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase text-[10px] tracking-wider"><tr><th className="p-3.5">Institution</th><th className="p-3.5">Code</th><th className="p-3.5">Location</th><th className="p-3.5">Status</th><th className="p-3.5 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {universities.map(uni => <tr key={uni._id} className="hover:bg-slate-50/70 transition"><td className="p-3.5"><Link to={`/admin/universities/${uni._id}`} className="font-bold text-slate-900 hover:text-teal-600">{uni.name}</Link><span className="text-[10px] text-slate-400 block mt-0.5">{uni.officialName || uni.name}</span></td><td className="p-3.5 font-mono text-teal-700 font-bold">{uni.code}</td><td className="p-3.5"><span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" />{uni.city ? `${uni.city}, ` : ''}{(uni as any).country || 'Somalia'}</span></td><td className="p-3.5"><StatusBadge status={uni.status} /></td><td className="p-3.5"><div className="flex justify-end gap-1">{canManage && <button type="button" onClick={() => openEditModal(uni)} title="Edit university" aria-label={'Edit ' + uni.name} className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-md transition"><Pencil className="w-4 h-4" /></button>}<Link to={`/admin/universities/${uni._id}`} title="View university" className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-md transition"><Eye className="w-4 h-4" /></Link>{canManage && <><button onClick={() => { setSelectedUni(uni); setTargetStatus('ACTIVE'); setConfirmStatusOpen(true); }} disabled={uni.status === 'ACTIVE'} className="p-1 text-emerald-600"><CheckCircle className="w-3.5 h-3.5" /></button><button onClick={() => { setSelectedUni(uni); setTargetStatus('SUSPENDED'); setConfirmStatusOpen(true); }} disabled={uni.status === 'SUSPENDED'} className="p-1 text-amber-600"><ShieldAlert className="w-3.5 h-3.5" /></button><button onClick={() => { setSelectedUni(uni); setTargetStatus('ARCHIVED'); setConfirmStatusOpen(true); }} disabled={uni.status === 'ARCHIVED'} className="p-1 text-rose-600"><XCircle className="w-3.5 h-3.5" /></button></>}</div></td></tr>)}
          </tbody></table></div>
          <div className="md:hidden divide-y divide-slate-100">{universities.map(uni => <div key={uni._id} className="p-4 space-y-2"><div className="flex justify-between gap-2"><Link to={`/admin/universities/${uni._id}`} className="font-bold text-slate-900">{uni.name}</Link><StatusBadge status={uni.status} /></div><div className="text-[11px] text-slate-500 flex justify-between"><span>{uni.code}</span><span>{uni.city || 'Mogadishu'}, {(uni as any).country || 'Somalia'}</span></div></div>)}</div>
          <Pagination meta={pagination} onPageChange={(p) => updateQueryParam('page', p.toString())} />
        </div>
      )}

      <Modal isOpen={universityModalOpen} onClose={closeUniversityModal} title={editingUniversity ? "Edit University" : "Register New University"} maxWidth="lg">
        <form onSubmit={handleUniversitySubmit} className="space-y-5 text-xs max-h-[80vh] overflow-y-auto pr-1 sm:pr-2">
          <div className="overflow-hidden rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-cyan-50 shadow-sm">
            <div className="px-4 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white flex items-center gap-2"><GraduationCap className="w-4 h-4" /><div><h3 className="font-bold">Institutional Information</h3><p className="text-[10px] text-teal-50">Core university identification</p></div></div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><label className="block font-semibold text-slate-700 mb-1.5">Official/Legal Name *</label><div className="relative"><Building2 className="absolute left-3 top-3 w-4 h-4 text-teal-500" /><input required value={formData.officialName} onChange={(e) => setFormData({ ...formData, officialName: e.target.value, name: e.target.value })} placeholder="e.g. Somali International University" className={`${inputClass} pl-9`} /></div></div>
              <div className="sm:col-span-2"><label className="block font-semibold text-slate-700 mb-1.5">Institution Code (Unique) *</label><input required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="e.g. SIU" className={`${inputClass} uppercase font-mono`} /></div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-sky-50 shadow-sm">
            <div className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-sky-600 text-white flex items-center gap-2"><MapPin className="w-4 h-4" /><div><h3 className="font-bold">Contact & Location</h3><p className="text-[10px] text-indigo-50">Focal person and institution location</p></div></div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block font-semibold text-slate-700 mb-1.5">Focal Person Name</label><div className="relative"><UserRound className="absolute left-3 top-3 w-4 h-4 text-indigo-400" /><input value={formData.contactPersonName} onChange={(e) => setFormData({ ...formData, contactPersonName: e.target.value })} placeholder="Full name" className={`${inputClass} pl-9`} /></div></div>
              <div><label className="block font-semibold text-slate-700 mb-1.5">Focal Person Email</label><div className="relative"><Mail className="absolute left-3 top-3 w-4 h-4 text-indigo-400" /><input type="email" value={formData.contactPersonEmail} onChange={(e) => setFormData({ ...formData, contactPersonEmail: e.target.value })} placeholder="name@university.edu" className={`${inputClass} pl-9`} /></div></div>
              <div><label className="block font-semibold text-slate-700 mb-1.5">Telephone</label><div className="relative"><Phone className="absolute left-3 top-3 w-4 h-4 text-indigo-400" /><input value={formData.contactPersonPhone} onChange={(e) => setFormData({ ...formData, contactPersonPhone: e.target.value, phone: e.target.value })} placeholder="+252 ..." className={`${inputClass} pl-9`} /></div></div>
              <div><label className="block font-semibold text-slate-700 mb-1.5">City</label><input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="e.g. Mogadishu" className={inputClass} /></div>
              <div><label className="block font-semibold text-slate-700 mb-1.5">Physical Address</label><input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Street / district" className={inputClass} /></div>
              <div><label className="block font-semibold text-slate-700 mb-1.5">Country *</label><input required value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} className={inputClass} /></div>
            </div>
          </div>

          {!editingUniversity && <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm">
            <label className="flex items-start gap-3 cursor-pointer"><input type="checkbox" checked={formData.createInitialAdmin} onChange={(e) => setFormData({ ...formData, createInitialAdmin: e.target.checked })} className="mt-0.5 h-4 w-4 rounded border-amber-300 text-teal-600 focus:ring-teal-500" /><div><span className="font-bold text-slate-900 block">Provision Initial University Admin User Account</span><span className="text-[10px] text-slate-500">Create the university's first administrator during registration.</span></div></label>
            {formData.createInitialAdmin && <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-amber-200"><input required placeholder="Admin First Name" value={formData.initialAdminFirstName} onChange={(e) => setFormData({ ...formData, initialAdminFirstName: e.target.value })} className={inputClass} /><input required placeholder="Admin Last Name" value={formData.initialAdminLastName} onChange={(e) => setFormData({ ...formData, initialAdminLastName: e.target.value })} className={inputClass} /><input required type="email" placeholder="Admin Email Address" value={formData.initialAdminEmail} onChange={(e) => setFormData({ ...formData, initialAdminEmail: e.target.value })} className={inputClass} /><input required type="password" placeholder="Admin Initial Password" value={formData.initialAdminPassword} onChange={(e) => setFormData({ ...formData, initialAdminPassword: e.target.value })} className={inputClass} /></div>}
          </div>}

          <div className="sticky bottom-0 bg-white/95 backdrop-blur flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-4 pb-1 border-t border-slate-100"><button type="button" onClick={closeUniversityModal} className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition">Cancel</button><button type="submit" disabled={actionLoading} className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl hover:from-teal-700 hover:to-cyan-700 font-bold shadow-md disabled:opacity-60 transition">{actionLoading ? 'Saving...' : editingUniversity ? 'Update Institution' : 'Register Institution'}</button></div>
        </form>
      </Modal>

      {selectedUni && confirmStatusOpen && <ConfirmDialog isOpen={confirmStatusOpen} onClose={() => setConfirmStatusOpen(false)} onConfirm={handleUpdateStatus} title={`Set Status to ${targetStatus}`} message={`Are you sure you want to transition ${selectedUni.name} to '${targetStatus}'? This status change will be logged in the system audit logs.`} confirmLabel={`Change Status to ${targetStatus}`} variant={targetStatus === 'ARCHIVED' || targetStatus === 'SUSPENDED' ? 'danger' : 'info'} isLoading={actionLoading} />}
    </div>
  );
};
