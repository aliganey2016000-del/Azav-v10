import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  Building2,
  UserCheck,
  FileText,
  Building,
  Award,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Activity,
  History,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { AdminApiService } from '../../services/admin.service';
import { AdminDashboardData } from '../../types/admin.types';
import { KpiCard } from '../../components/admin/KpiCard';
import { PageHeader } from '../../components/admin/PageHeader';
import { LoadingState, ErrorState, EmptyState } from '../../components/admin/States';
import { StatusBadge, RoleBadge } from '../../components/admin/Badge';

export const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await AdminApiService.getDashboard();
      setData(res);
    } catch (err: any) {
      console.error('Failed to load admin dashboard:', err);
      setError(err.message || 'Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) return <LoadingState message="Fetching operational metrics & stats..." />;
  if (error) return <ErrorState message={error} onRetry={fetchDashboard} />;
  if (!data) return <EmptyState title="No metrics available" />;

  const { stats, recentApplications, recentUsers, recentActivity, organizationCapacity } = data;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Operational Dashboard"
        description="Real-time platform metrics, user management, capacity utilization, and clinical audit trail."
        action={
          <div className="flex items-center space-x-3">
            <Link
              to="/admin/users"
              className="px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition shadow-xs flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add User</span>
            </Link>
            <Link
              to="/admin/universities"
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-xs flex items-center space-x-1.5"
            >
              <GraduationCap className="w-4 h-4 text-slate-500" />
              <span>Add University</span>
            </Link>
            <Link
              to="/admin/organizations"
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-xs flex items-center space-x-1.5"
            >
              <Building2 className="w-4 h-4 text-slate-500" />
              <span>Add Facility</span>
            </Link>
          </div>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Students"
          value={stats.students}
          icon={Users}
          color="teal"
          subtext="Enrolled trainees"
        />
        <KpiCard
          title="Active Applications"
          value={stats.applications}
          icon={FileText}
          color="indigo"
          subtext="Placement requests"
        />
        <KpiCard
          title="Active Placements"
          value={stats.placements}
          icon={Building}
          color="emerald"
          subtext="Clinical attachments"
        />
        <KpiCard
          title="Supervisors"
          value={stats.supervisors}
          icon={UserCheck}
          color="violet"
          subtext="Clinical mentors"
        />
        <KpiCard
          title="Universities"
          value={stats.universities}
          icon={GraduationCap}
          color="sky"
          subtext="Partner institutions"
        />
        <KpiCard
          title="Healthcare Facilities"
          value={stats.organizations}
          icon={Building2}
          color="amber"
          subtext="Teaching hospitals"
        />
        <KpiCard
          title="Certificates Issued"
          value={stats.certificates}
          icon={ShieldCheck}
          color="emerald"
          subtext="Verified credentials"
        />
        <KpiCard
          title="Attachments"
          value={stats.attachments}
          icon={Award}
          color="teal"
          subtext="Total clinical cycles"
        />
      </div>

      {/* Capacity & Recent Registrations Dual Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Organization Capacity Overview */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Facility Capacity Utilization</h3>
              <p className="text-xs text-slate-500">Live placement availability across healthcare facilities</p>
            </div>
            <Link to="/admin/organizations" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center space-x-1">
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {organizationCapacity.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No healthcare facilities configured.</p>
          ) : (
            <div className="space-y-4">
              {organizationCapacity.map((org) => (
                <div key={org._id} className="p-3.5 bg-slate-50/70 border border-slate-200/60 rounded-xl">
                  <div className="flex items-center justify-between mb-1.5 text-xs">
                    <span className="font-bold text-slate-900">{org.name}</span>
                    <span className="font-medium text-slate-600">
                      {org.occupied} / {org.capacity} slots ({org.utilization}%)
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        org.utilization >= 90
                          ? 'bg-rose-500'
                          : org.utilization >= 70
                          ? 'bg-amber-500'
                          : 'bg-teal-600'
                      }`}
                      style={{ width: `${Math.min(100, org.utilization)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500">
                    <span>Available: <strong className="text-slate-800">{org.available}</strong></span>
                    <span className="uppercase text-[10px] font-semibold text-slate-400">{org.type}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Registrations Sidebar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Users</h3>
              <p className="text-xs text-slate-500">Newly registered accounts</p>
            </div>
            <Link to="/admin/users" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center space-x-1">
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentUsers.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No recent users.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentUsers.map((u: any) => (
                <div key={u._id} className="py-3 flex items-center justify-between">
                  <div className="truncate pr-2">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{u.email}</p>
                  </div>
                  <RoleBadge role={u.roles?.[0] || 'STUDENT'} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Applications & Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Applications</h3>
              <p className="text-xs text-slate-500">Submitted placement requests</p>
            </div>
            <Link to="/dashboard/applications" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center space-x-1">
              <span>Manage</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentApplications.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No recent applications.</p>
          ) : (
            <div className="space-y-3">
              {recentApplications.map((app: any) => (
                <div key={app._id} className="p-3 bg-slate-50/60 border border-slate-200/60 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900">
                      {app.studentId?.firstName} {app.studentId?.lastName}
                    </span>
                    <span className="text-slate-500 block text-[11px]">
                      Target: {app.desiredOrganizationId?.name || 'General Placement'}
                    </span>
                  </div>
                  <StatusBadge status={app.status || 'SUBMITTED'} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audit Log Events */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Audit Events</h3>
              <p className="text-xs text-slate-500">System changes and administrative logs</p>
            </div>
            <Link to="/admin/audit-logs" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center space-x-1">
              <span>Audit Log</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentActivity.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No audit activity logged yet.</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((log: any) => (
                <div key={log._id} className="p-3 bg-slate-50/60 border border-slate-200/60 rounded-xl flex items-start space-x-3 text-xs">
                  <div className="p-1.5 bg-slate-200 text-slate-700 rounded-lg shrink-0 mt-0.5">
                    <History className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 truncate">{log.action}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px] truncate">
                      By {log.actorEmail} ({log.entityType})
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
