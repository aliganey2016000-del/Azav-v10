import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  Hospital,
  MapPin,
  Plus,
  RefreshCw,
  ShieldCheck,
  Stethoscope,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import { AdminApiService } from '../../services/admin.service';
import { AdminDashboardData, AdminOrganization, AdminUniversity } from '../../types/admin.types';
import { EmptyState, ErrorState, LoadingState } from '../../components/admin/States';

interface MetricCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: 'teal' | 'blue' | 'violet' | 'amber';
}

const metricTone = {
  teal: {
    icon: 'bg-teal-50 text-teal-600',
    accent: 'bg-teal-500/10',
  },
  blue: {
    icon: 'bg-blue-50 text-blue-600',
    accent: 'bg-blue-500/10',
  },
  violet: {
    icon: 'bg-violet-50 text-violet-600',
    accent: 'bg-violet-500/10',
  },
  amber: {
    icon: 'bg-amber-50 text-amber-600',
    accent: 'bg-amber-500/10',
  },
};

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, icon: Icon, tone }) => {
  const styles = metricTone[tone];
  return (
    <div className="relative min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.04)] sm:p-5">
      <div className={`absolute -right-7 -top-7 h-24 w-24 rounded-full ${styles.accent}`} />
      <div className="relative flex items-start gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${styles.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500 sm:text-[11px]">{title}</div>
          <div className="mt-1 flex items-end gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{value.toLocaleString()}</span>
            <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-600">
              <TrendingUp className="h-3 w-3" /> live
            </span>
          </div>
          <div className="mt-1 truncate text-[10px] text-slate-500 sm:text-xs">{subtitle}</div>
        </div>
      </div>
    </div>
  );
};

const StatusPill: React.FC<{ status?: string }> = ({ status }) => {
  const active = String(status || '').toUpperCase() === 'ACTIVE';
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-bold ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
      {status || 'PENDING'}
    </span>
  );
};

export const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [universities, setUniversities] = useState<AdminUniversity[]>([]);
  const [organizations, setOrganizations] = useState<AdminOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const fetchDashboard = async (manual = false) => {
    try {
      if (manual) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const dashboard = await AdminApiService.getDashboard();
      setData(dashboard);

      const [universityResult, organizationResult] = await Promise.allSettled([
        AdminApiService.getUniversities({ page: 1, limit: 2 }),
        AdminApiService.getOrganizations({ page: 1, limit: 2 }),
      ]);

      if (universityResult.status === 'fulfilled') {
        setUniversities(universityResult.value.universities || []);
      }
      if (organizationResult.status === 'fulfilled') {
        setOrganizations(organizationResult.value.organizations || []);
      }

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

  const todayLabel = useMemo(
    () => new Date().toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }),
    []
  );

  if (loading) return <LoadingState message="Loading the Super Admin dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={() => fetchDashboard()} />;
  if (!data) return <EmptyState title="No dashboard data available" />;

  const { stats, recentActivity } = data;
  const institutionTotal = stats.universities + stats.organizations;
  const universityPct = institutionTotal > 0 ? Math.round((stats.universities / institutionTotal) * 100) : 0;
  const hospitalPct = institutionTotal > 0 ? 100 - universityPct : 0;

  const activityItems = [
    { label: 'Applications', value: stats.applications, tone: 'bg-blue-500' },
    { label: 'Placements', value: stats.placements, tone: 'bg-teal-500' },
    { label: 'Supervisors', value: stats.supervisors, tone: 'bg-violet-500' },
    { label: 'Certificates', value: stats.certificates, tone: 'bg-amber-500' },
  ];
  const maxActivity = Math.max(...activityItems.map((item) => item.value), 1);

  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-cyan-100/80 bg-gradient-to-r from-[#eefbff] via-white to-[#dff8f4] p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-6 lg:p-7">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-teal-200/25 blur-2xl" />
        <div className="absolute bottom-0 right-5 hidden h-32 w-32 items-center justify-center rounded-full border border-teal-100/80 bg-white/55 text-teal-700/70 lg:flex">
          <Stethoscope className="h-16 w-16" />
        </div>

        <div className="relative max-w-4xl">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">Super Admin Dashboard</div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">
            Welcome back, <span className="text-teal-600">Azaam Admin</span>
          </h1>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-600 sm:text-sm">
            Real-time institutional oversight, clinical capacity management, user administration, and security monitoring across the AZAAM MEDICS network.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-medium text-slate-500 sm:text-xs">
            <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-teal-600" />{todayLabel}</span>
            <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4 text-teal-600" />Updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-600" />All systems operational</span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
            <Link to="/admin/users" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 text-xs font-bold text-white shadow-[0_8px_20px_rgba(13,148,136,0.22)] transition hover:bg-teal-700">
              <Plus className="h-4 w-4" /> Add User
            </Link>
            <Link to="/admin/universities" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-4 text-xs font-bold text-slate-700 transition hover:bg-white">
              <GraduationCap className="h-4 w-4 text-blue-600" /> Add University
            </Link>
            <Link to="/admin/organizations" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-4 text-xs font-bold text-slate-700 transition hover:bg-white">
              <Hospital className="h-4 w-4 text-violet-600" /> Add Hospital
            </Link>
            <button
              type="button"
              onClick={() => fetchDashboard(true)}
              disabled={refreshing}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-4 text-xs font-bold text-slate-700 transition hover:bg-white disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
        <MetricCard title="Total Students" value={stats.students} subtitle="Enrolled trainees" icon={Users} tone="teal" />
        <MetricCard title="Partner Universities" value={stats.universities} subtitle="Accredited institutions" icon={GraduationCap} tone="blue" />
        <MetricCard title="Partner Hospitals" value={stats.organizations} subtitle="Clinical training sites" icon={Building2} tone="violet" />
        <MetricCard title="Active Placements" value={stats.placements} subtitle="Ongoing clinical attachments" icon={Stethoscope} tone="amber" />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-5">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.04)] sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-extrabold text-slate-950 sm:text-base">Platform Activity Overview</h2>
              <p className="mt-0.5 text-[10px] text-slate-500 sm:text-xs">Current operational totals across the clinical workflow</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <Activity className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {activityItems.map((item) => {
              const width = Math.max(4, Math.round((item.value / maxActivity) * 100));
              return (
                <div key={item.label}>
                  <div className="mb-1.5 flex items-center justify-between text-[10px] sm:text-xs">
                    <span className="font-semibold text-slate-600">{item.label}</span>
                    <span className="font-extrabold text-slate-900">{item.value.toLocaleString()}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${item.tone}`} style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Applications</div>
              <div className="mt-1 text-xl font-black text-slate-900">{stats.applications}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Completed Attachments</div>
              <div className="mt-1 text-xl font-black text-slate-900">{stats.attachments}</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.04)] sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-extrabold text-slate-950 sm:text-base">Distribution by Institution Type</h2>
              <p className="mt-0.5 text-[10px] text-slate-500 sm:text-xs">Current partner network composition</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Building2 className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:justify-center sm:gap-8">
            <div
              className="relative flex h-40 w-40 shrink-0 items-center justify-center rounded-full"
              style={{
                background: institutionTotal > 0
                  ? `conic-gradient(#0d9488 0 ${universityPct}%, #2583e8 ${universityPct}% 100%)`
                  : 'conic-gradient(#e2e8f0 0 100%)',
              }}
            >
              <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white shadow-inner">
                <div className="text-2xl font-black text-slate-950">{institutionTotal}</div>
                <div className="text-[10px] font-semibold text-slate-500">Institutions</div>
              </div>
            </div>

            <div className="w-full max-w-xs space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-xs">
                <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-teal-600" /><span className="font-semibold text-slate-700">Universities</span></div>
                <div className="flex items-center gap-3"><strong className="text-slate-900">{stats.universities}</strong><span className="w-9 text-right text-slate-500">{universityPct}%</span></div>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-xs">
                <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" /><span className="font-semibold text-slate-700">Hospitals</span></div>
                <div className="flex items-center gap-3"><strong className="text-slate-900">{stats.organizations}</strong><span className="w-9 text-right text-slate-500">{hospitalPct}%</span></div>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 px-3 pt-3 text-xs">
                <span className="font-bold text-slate-700">Total</span>
                <strong className="text-slate-950">{institutionTotal}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-5">
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><GraduationCap className="h-4 w-4" /></div>
              <div><h2 className="text-sm font-extrabold text-slate-950">Recent Universities</h2><p className="text-[10px] text-slate-500">Newest partner institutions</p></div>
            </div>
            <Link to="/admin/universities" className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700">View All <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>

          {universities.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {universities.map((university) => (
                <Link key={university._id} to={`/admin/universities/${university._id}`} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-slate-50 sm:px-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><GraduationCap className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-bold text-slate-900">{university.name}</div>
                    <div className="mt-1 flex min-w-0 items-center gap-2 text-[10px] text-slate-500">
                      <span className="truncate">{university.code}</span>
                      {university.city && <span className="inline-flex items-center gap-1 truncate"><MapPin className="h-3 w-3" />{university.city}</span>}
                    </div>
                  </div>
                  <StatusPill status={university.status} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center px-5 py-10 text-center">
              <GraduationCap className="h-8 w-8 text-slate-300" />
              <div className="mt-2 text-xs font-bold text-slate-700">No universities registered yet</div>
              <Link to="/admin/universities" className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-[10px] font-bold text-white"><Plus className="h-3.5 w-3.5" />Add University</Link>
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><Hospital className="h-4 w-4" /></div>
              <div><h2 className="text-sm font-extrabold text-slate-950">Recent Hospitals</h2><p className="text-[10px] text-slate-500">Clinical training partners</p></div>
            </div>
            <Link to="/admin/organizations" className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-600 hover:text-violet-700">View All <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>

          {organizations.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {organizations.map((organization) => (
                <Link key={organization._id} to={`/admin/organizations/${organization._id}`} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-slate-50 sm:px-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><Hospital className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-bold text-slate-900">{organization.name}</div>
                    <div className="mt-1 flex min-w-0 items-center gap-2 text-[10px] text-slate-500">
                      <span className="truncate">{organization.type}</span>
                      {organization.city && <span className="inline-flex items-center gap-1 truncate"><MapPin className="h-3 w-3" />{organization.city}</span>}
                    </div>
                  </div>
                  <StatusPill status={organization.status} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center px-5 py-10 text-center">
              <Hospital className="h-8 w-8 text-slate-300" />
              <div className="mt-2 text-xs font-bold text-slate-700">No hospitals registered yet</div>
              <div className="mt-1 text-[10px] text-slate-500">Add a hospital to start managing clinical attachments.</div>
              <Link to="/admin/organizations" className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2 text-[10px] font-bold text-white"><Plus className="h-3.5 w-3.5" />Add Hospital</Link>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_28px_rgba(15,23,42,0.04)] sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><ShieldCheck className="h-4 w-4" /></div>
            <div><h2 className="text-sm font-extrabold text-slate-950">Security & Audit Activity</h2><p className="text-[10px] text-slate-500">Latest administrative events</p></div>
          </div>
          <Link to="/admin/audit-logs" className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-600 hover:text-teal-700">Audit Logs <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>

        {recentActivity.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-2 lg:grid-cols-3">
            {recentActivity.slice(0, 3).map((log: any) => (
              <div key={log._id} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-teal-600 shadow-sm"><Activity className="h-3.5 w-3.5" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[10px] font-bold text-slate-800">{log.action}</div>
                    <div className="mt-1 truncate text-[9px] text-slate-500">{log.actorEmail || 'System administrator'}</div>
                    <div className="mt-1 text-[9px] text-slate-400">{log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Recent event'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl bg-slate-50 py-6 text-center text-[10px] text-slate-500">No recent audit activity.</div>
        )}
      </section>
    </div>
  );
};
