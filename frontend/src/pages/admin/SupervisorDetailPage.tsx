import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, UserCheck, Building2, ShieldCheck, Mail, Phone, Award } from 'lucide-react';
import { AdminApiService } from '../../services/admin.service';
import { PageHeader } from '../../components/admin/PageHeader';
import { StatusBadge } from '../../components/admin/Badge';
import { LoadingState, ErrorState } from '../../components/admin/States';

export const SupervisorDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [supervisor, setSupervisor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await AdminApiService.getSupervisorById(id);
        setSupervisor(res);
      } catch (err: any) {
        setError(err.message || 'Failed to load supervisor profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) return <LoadingState message="Loading supervisor profile..." />;
  if (error) return <ErrorState message={error} />;
  if (!supervisor) return null;

  const user = supervisor.userId || {};
  const org = supervisor.organizationId || {};

  return (
    <div className="space-y-6">
      <Link to="/admin/supervisors" className="inline-flex items-center space-x-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Supervisors Directory</span>
      </Link>

      <PageHeader
        title={`${user.firstName || 'Supervisor'} ${user.lastName || ''}`}
        description={`Clinical Preceptor & Medical Supervisor | ${org.name || 'Healthcare Facility'}`}
        action={<StatusBadge status={supervisor.status} />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Professional Details */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">Professional Credentials</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-500">Email:</span>
              <span className="font-mono font-semibold text-slate-900">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Phone:</span>
              <span className="text-slate-900">{user.phone || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Qualification:</span>
              <span className="font-bold text-slate-900">{supervisor.qualification || 'Clinical Mentor'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Medical License No:</span>
              <span className="font-mono text-teal-700 font-bold">{supervisor.licenseNumber || 'Verified'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Years of Experience:</span>
              <span className="text-slate-900">{supervisor.yearsOfExperience || 5} years</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Verification Status:</span>
              <span className={`font-bold ${supervisor.verified ? 'text-emerald-700' : 'text-amber-600'}`}>
                {supervisor.verified ? 'VERIFIED PRECEPTOR' : 'PENDING VERIFICATION'}
              </span>
            </div>
          </div>
        </div>

        {/* Assigned Facility Profile */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">Assigned Facility</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-500">Facility Name:</span>
              <span className="font-bold text-slate-900">{org.name || 'Unassigned'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Facility Type:</span>
              <span className="uppercase text-slate-700">{org.type || 'HOSPITAL'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Contact Email:</span>
              <span className="text-slate-900">{org.contactEmail || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
