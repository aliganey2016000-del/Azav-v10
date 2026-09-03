import React, { useEffect, useState } from 'react';
import { Activity, AlertCircle, CheckCircle2, Database, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface PortalResourcePageProps {
  title: string;
  eyebrow: string;
  description: string;
  endpoint: string;
  actionLabel?: string;
}

function getRecords(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const candidates = ['items', 'results', 'users', 'applications', 'placements', 'documents', 'certificates', 'data'];
    for (const key of candidates) {
      if (Array.isArray(record[key])) return record[key] as unknown[];
    }
  }
  return payload ? [payload] : [];
}

function getValue(record: unknown, key: string): string {
  if (!record || typeof record !== 'object') return String(record ?? '-');
  const value = (record as Record<string, unknown>)[key];
  if (value === null || value === undefined) return '-';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export const PortalResourcePage: React.FC<PortalResourcePageProps> = ({
  title,
  eyebrow,
  description,
  endpoint,
  actionLabel = 'Refresh data',
}) => {
  const { user } = useAuth();
  const [payload, setPayload] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const resolvedEndpoint = endpoint === '/organizations/current/departments' && user?.organizationId
        ? `/organizations/${user.organizationId}/departments`
        : endpoint;
      const response = await api.get(resolvedEndpoint);
      setPayload(response.data?.data ?? response.data);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error?.message || 'Unable to load data from the server.');
      setPayload(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [endpoint, user?.organizationId]);

  const records = getRecords(payload);
  const columns = records.length && typeof records[0] === 'object'
    ? Object.keys(records[0] as Record<string, unknown>).filter((key) => !['passwordHash', '__v'].includes(key)).slice(0, 5)
    : [];

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-700">{eyebrow}</p>
            <h1 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
          </div>
          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {actionLabel}
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Database className="h-5 w-5 text-teal-700" />
            <p className="mt-4 text-2xl font-black text-slate-900">{loading ? '...' : records.length}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Records returned</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Activity className="h-5 w-5 text-blue-700" />
            <p className="mt-4 truncate text-lg font-black text-slate-900">{user?.firstName || 'Account'} {user?.lastName || ''}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Authenticated account</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <CheckCircle2 className="h-5 w-5 text-emerald-700" />
            <p className="mt-4 text-lg font-black text-slate-900">{error ? 'Needs attention' : loading ? 'Loading' : 'Connected'}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Live API status</p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div><p className="font-bold">Unable to load live data</p><p className="mt-1">{error}</p></div>
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-bold text-slate-900">Live records</h2>
            <p className="mt-1 text-xs text-slate-500">Data is read from the authenticated AIMN API.</p>
          </div>
          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">Loading live records...</div>
          ) : records.length === 0 ? (
            <div className="p-10 text-center"><Database className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 font-semibold text-slate-700">No records found</p><p className="mt-1 text-sm text-slate-500">This view will populate when the account has live records.</p></div>
          ) : columns.length ? (
            <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr>{columns.map((column) => <th key={column} className="px-5 py-3 font-bold">{column}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{records.map((record, index) => <tr key={index} className="hover:bg-slate-50">{columns.map((column) => <td key={column} className="max-w-xs truncate px-5 py-4 text-slate-700">{getValue(record, column)}</td>)}</tr>)}</tbody></table></div>
          ) : (
            <pre className="overflow-x-auto p-5 text-xs text-slate-700">{JSON.stringify(payload, null, 2)}</pre>
          )}
        </section>
      </div>
    </div>
  );
};
