import React, { useEffect, useMemo, useState } from 'react';
import { Activity, AlertCircle, Database, RefreshCw, ShieldCheck } from 'lucide-react';
import api from '../services/api';

interface DashboardMetric {
  label: string;
  endpoint: string;
  candidateKeys?: string[];
}

interface LivePortalDashboardPageProps {
  eyebrow: string;
  title: string;
  description: string;
  metrics: DashboardMetric[];
}

const extractRecords = (payload: any, candidateKeys: string[] = []): any[] => {
  if (Array.isArray(payload)) return payload;
  const source = payload?.data ?? payload;
  if (Array.isArray(source)) return source;
  if (!source || typeof source !== 'object') return [];

  const keys = [
    ...candidateKeys,
    'students',
    'applications',
    'placements',
    'certificates',
    'attendanceLogs',
    'entries',
    'evaluations',
    'payments',
    'records',
    'data',
  ];

  for (const key of keys) {
    if (Array.isArray(source[key])) return source[key];
  }

  return [];
};

export const LivePortalDashboardPage: React.FC<LivePortalDashboardPageProps> = ({
  eyebrow,
  title,
  description,
  metrics,
}) => {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      const responses = await Promise.all(
        metrics.map(async (metric) => {
          const response = await api.get(metric.endpoint);
          const records = extractRecords(response.data, metric.candidateKeys);
          return { metric, records };
        })
      );

      const nextCounts: Record<string, number> = {};
      responses.forEach(({ metric, records }) => {
        nextCounts[metric.label] = records.length;
      });
      setCounts(nextCounts);
      setRecent(responses[0]?.records.slice(0, 6) || []);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error?.message || 'Unable to load live dashboard data.');
      setCounts({});
      setRecent([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [JSON.stringify(metrics)]);

  const recentColumns = useMemo(() => {
    const first = recent[0];
    if (!first || typeof first !== 'object') return [];
    return Object.keys(first)
      .filter((key) => !['__v', 'passwordHash'].includes(key))
      .slice(0, 4);
  }, [recent]);

  const displayValue = (value: any) => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'object') {
      if (value.name) return value.name;
      if (value.firstName || value.lastName) return [value.firstName, value.lastName].filter(Boolean).join(' ');
      if (value.userId?.firstName || value.userId?.lastName) {
        return [value.userId.firstName, value.userId.lastName].filter(Boolean).join(' ');
      }
      return 'Linked record';
    }
    return String(value);
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-teal-50 px-5 py-6 shadow-sm dark:border-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950 dark:shadow-xl sm:px-7 sm:py-8">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">{eyebrow}</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 px-4 text-xs font-extrabold text-white shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={'h-4 w-4 ' + (loading ? 'animate-spin' : '')} />
            Refresh Live Data
          </button>
        </div>
      </section>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-extrabold">Live database unavailable</p>
            <p className="mt-1 text-xs">{error}</p>
          </div>
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.slice(0, 4).map((metric, index) => {
          const Icon = index === 0 ? Database : index === 1 ? Activity : ShieldCheck;
          return (
            <div key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#0f1b2d]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">{metric.label}</p>
                  <p className="mt-2 text-3xl font-extrabold text-slate-950 dark:text-white">{loading ? '…' : counts[metric.label] ?? 0}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0f1b2d]">
        <div className="border-b border-slate-200 px-4 py-4 dark:border-slate-800 sm:px-5">
          <h2 className="font-extrabold text-slate-950 dark:text-white">Recent live records</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Loaded directly from the authenticated database API.</p>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">Loading...</div>
        ) : recent.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">No live records available.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[680px] w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">
                <tr>
                  {recentColumns.map((column) => (
                    <th key={column} className="px-4 py-3 font-extrabold uppercase tracking-wide">{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recent.map((record, index) => (
                  <tr key={record?._id || index}>
                    {recentColumns.map((column) => (
                      <td key={column} className="max-w-[220px] truncate px-4 py-3 text-slate-700 dark:text-slate-200">
                        {displayValue(record?.[column])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
