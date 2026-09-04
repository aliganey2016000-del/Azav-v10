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
  AlertCircle,
  Clock,
  RefreshCw,
  Server,
  Database,
  Lock,
  ChevronRight,
  Sparkles,
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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchDashboard = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const res = await AdminApiService.getDashboard();
      setData(res);
      setLastRefreshed(new Date());
    } catch (err: any) {
      console.error('Failed to load admin dashboard:', err);
      setError(err.message || 'Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) return <LoadingState message="Fetching operational metrics & platform statistics..." />;
  if (error) return <ErrorState message={error} onRetry={() => fetchDashboard()} />;
  if (!data) return <EmptyState title="No metrics available" />;

  const { stats, recentApplications, recentUsers, recentActivity, organizationCapacity } = data;

  // Calculate high capacity alerts (>85% utilization)
  const highCapacityFacilities = organizationCapacity.filter((org) => org.utilization >= 85);
  const pendingAppsCount = stats.applications || 0;
  const pendingActionsTotal = highCapacityFacilities.length + (pendingAppsCount > 0 ? 1 : 0);

  return (
    <div className="space-y-8 pb-8">
      {/* Top Header */}
      <PageHeader
        title="Super Admin Control Center"
        description="Real-time institutional oversight, clinical capacity management, user administration, and security audit trail."
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => fetchDashboard(true)}
              disabled={refreshing}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-xs flex items-center space-x-1.5 disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <Link
              to="/admin/users"
              className="px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition shadow-xs flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add User</span>
            </Link>
            <Link
              to="/admin/universities"
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-xs flex items-center space-x-1.5"
            >
              <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
              <span>Add University</span>
            </Link>
            <Link
              to="/admin/organizations"
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-xs flex items-center space-x-1.5"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Add Hospital</span>
            </Link>
          </div>
        }
      />

      {/* System Health & Status Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-4 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400">System Status</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-xs font-semibold text-slate-300">All Systems Operational</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Role-Based Access Control (RBAC) & tenant isolation active. Last updated: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-300">
          <div className="flex items-center space-x-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700">
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span>API Gateway: Online</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700">
            <Database className="w-3.5 h-3.5 text-teal-400" />
            <span>Database: Synced</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700">
            <Lock className="w-3.5 h-3.5 text-indigo-400" />
            <span>JWT Auth: Enforced</span>
          </div>
        </div>
      </div>

      {/* Pending Actions Callout (if any) */}
      {pendingActionsTotal > 0 && (
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                Pending Actions ({pendingActionsTotal})
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                {pendingAppsCount > 0 && `${pendingAppsCount} placement applications require review. `}
                {highCapacityFacilities.length > 0 && `${highCapacityFacilities.length} healthcare facility approaching capacity limit.`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <Link
              to="/dashboard/applications"
              className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-200/70 hover:bg-amber-200 rounded-lg transition"
            >
              Review Applications
            </Link>
            <Link
              to="/admin/organizations"
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-amber-200 hover:bg-amber-50 rounded-lg transition"
            >
              Check Facilities
            </Link>
          </div>
        </div>
      )}

      {/* KPI Cards Grid (8 Core Platform Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Students"
          value={stats.students}
          icon={Users}
          color="teal"
          subtext="Enrolled trainees"
        />
        <KpiCard
          title="Partner Universities"
          value={stats.universities}
          icon={GraduationCap}
          color="sky"
          subtext="Accredited institutions"
        />
        <KpiCard
          title="Teaching Hospitals"
          value={stats.organizations}
          icon={Building2}
          color="amber"
          subtext="Clinical training centers"
        />
        <KpiCard
          title="Clinical Supervisors"
          value={stats.supervisors}
          icon={UserCheck}
          color="violet"
          subtext="Certified medical mentors"
        />
        <KpiCard
          title="Clinical Placements"
          value={stats.placements}
          icon={Building}
          color="emerald"
          subtext="Active rotations"
        />
        <KpiCard
          title="Applications"
          value={stats.applications}
          icon={FileText}
          color="indigo"
          subtext="Placement requests"
        />
        <KpiCard
          title="Certificates Issued"
          value={stats.certificates}
          icon={ShieldCheck}
          color="teal"
          subtext="Verified credentials"
        />
        <KpiCard
          title="Completed Attachments"
          value={stats.attachments}
          icon={Award}
          color="rose"
          subtext="Rotations finished"
        />
      </div>

      {/* Capacity & Recent Registrations Dual Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Healthcare Facility Capacity Utilization */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Hospital Capacity & Slot Allocation</h3>
                <p className="text-xs text-slate-500">Live placement availability across partner teaching hospitals</p>
              </div>
              <Link to="/admin/organizations" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center space-x-1">
                <span>View All</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {organizationCapacity.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No healthcare facilities configured.</p>
            ) : (
              <div className="space-y-4">
                {organizationCapacity.map((org) => {
                  const utilization = org.utilization || Math.round(((org.occupied || 0) / (org.capacity || 1)) * 100);
                  const isHigh = utilization >= 85;
                  const isModerate = utilization >= 60;

                  return (
                    <div key={org._id} className="p-3.5 bg-slate-50/70 border border-slate-200/60 rounded-xl hover:border-slate-300 transition">
                      <div className="flex items-center justify-between mb-1.5 text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900">{org.name}</span>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase px-1.5 py-0.5 bg-slate-200/70 rounded">
                            {org.type}
                          </span>
                        </div>
                        <span className="font-semibold text-slate-700">
                          {org.occupied} / {org.capacity} slots ({utilization}%)
                        </span>
                      </div>

                      {/* Utilization Bar */}
                      <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isHigh
                              ? 'bg-rose-500'
                              : isModerate
                              ? 'bg-amber-500'
                              : 'bg-teal-600'
                          }`}
                          style={{ width: `${Math.min(100, utilization)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500">
                        <span>
                          Available Capacity: <strong className="text-slate-800">{org.available ?? (org.capacity - org.occupied)} slots</strong>
                        </span>
                        <span className={isHigh ? 'text-rose-600 font-semibold' : 'text-emerald-600 font-semibold'}>
                          {isHigh ? 'High Utilization' : 'Slots Available'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Capacity calculations are isolated by clinical department and supervisor quotas.</span>
            <Link to="/admin/organizations" className="font-semibold text-teal-600 hover:text-teal-700">
              Manage Quotas →
            </Link>
          </div>
        </div>

        {/* Recent Registrations Sidebar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Recent Users</h3>
                <p className="text-xs text-slate-500">Newly registered platform accounts</p>
              </div>
              <Link to="/admin/users" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center space-x-1">
                <span>View All</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentUsers.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No recent user registrations.</p>
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

          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link
              to="/admin/users"
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
            >
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>Open User Directory</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Applications & Security Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Applications</h3>
              <p className="text-xs text-slate-500">Latest submitted student placement requests</p>
            </div>
            <Link to="/dashboard/applications" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center space-x-1">
              <span>Manage</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentApplications.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No recent applications submitted.</p>
          ) : (
            <div className="space-y-3">
              {recentApplications.map((app: any) => (
                <div key={app._id} className="p-3 bg-slate-50/60 border border-slate-200/60 rounded-xl flex items-center justify-between text-xs hover:border-slate-300 transition">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900">
                      {app.studentId?.firstName ? `${app.studentId.firstName} ${app.studentId.lastName}` : app.studentName || 'Student Applicant'}
                    </span>
                    <span className="text-slate-500 block text-[11px]">
                      Target: <strong className="text-slate-700">{app.desiredOrganizationId?.name || app.targetFacility || 'General Hospital Placement'}</strong>
                    </span>
                    {app.universityId?.name && (
                      <span className="text-slate-400 block text-[10px]">
                        Nominated by: {app.universityId.name}
                      </span>
                    )}
                  </div>
                  <StatusBadge status={app.status || 'SUBMITTED'} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Real-time Audit Trail */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Security & Audit Events</h3>
              <p className="text-xs text-slate-500">Immutable administrative logs and security events</p>
            </div>
            <Link to="/admin/audit-logs" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center space-x-1">
              <span>Full Log</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentActivity.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No audit activities recorded.</p>
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
