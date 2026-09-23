import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Award, BookOpen, CheckSquare, Database, RefreshCw, ShieldCheck } from 'lucide-react';
import api from '../../services/api';

type Mode = 'clinical' | 'completion';

interface AdminTrainingOperationsPageProps {
  mode: Mode;
}

interface TabDefinition {
  key: string;
  label: string;
  endpoint: string;
  icon: React.ComponentType<{ className?: string }>;
}

const extractRecords = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const candidates = [
      'items',
      'results',
      'placements',
      'attendanceLogs',
      'entries',
      'evaluations',
      'certificates',
      'data',
    ];
    for (const key of candidates) {
      if (Array.isArray(record[key])) return record[key] as unknown[];
    }
  }
  return payload ? [payload] : [];
};

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'object') {
    const objectValue = value as Record<string, unknown>;
    if (objectValue.name) return String(objectValue.name);
    if (objectValue.firstName || objectValue.lastName) {
      return [objectValue.firstName, objectValue.lastName].filter(Boolean).join(' ');
    }
    return JSON.stringify(value);
  }
  return String(value);
};

export const AdminTrainingOperationsPage: React.FC<AdminTrainingOperationsPageProps> = ({ mode }) => {
  const tabs = useMemo<TabDefinition[]>(
    () =>
      mode === 'clinical'
        ? [
            { key: 'attendance', label: 'Attendance', endpoint: '/attendance', icon: CheckSquare },
            { key: 'logbooks', label: 'Logbook', endpoint: '/logbooks', icon: BookOpen },
            { key: 'evaluations', label: 'Evaluations', endpoint: '/evaluations', icon: Award },
          ]
        : [
            { key: 'evaluations', label: 'Final Evaluations', endpoint: '/evaluations', icon: Award },
            { key: 'certificates', label: 'Certificates', endpoint: '/certificates', icon: ShieldCheck },
          ],
    [mode]
  );

  const [activeTab, setActiveTab] = useState(tabs[0].key);
  const [payload, setPayload] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setActiveTab(tabs[0].key);
  }, [tabs]);

  const activeDefinition = tabs.find((tab) => tab.key === activeTab) || tabs[0];

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(activeDefinition.endpoint);
      setPayload(response.data?.data ?? response.data);
    } catch (requestError: any) {
      setPayload(null);
      setError(requestError?.response?.data?.error?.message || 'Unable to load live training records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [activeDefinition.endpoint]);

  const records = extractRecords(payload);
  const columns =
    records.length > 0 && records[0] && typeof records[0] === 'object'
      ? Object.keys(records[0] as Record<string, unknown>)
          .filter((key) => !['passwordHash', '__v'].includes(key))
          .slice(0, 6)
      : [];

  const clinicalMode = mode === 'clinical';

  return (
    <div className="space-y-5 pb-10">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-teal-700">
              <Activity className="h-3.5 w-3.5" />
              Training Operations
            </div>
            <h1 className="text-xl font-black text-slate-950 sm:text-2xl">
              {clinicalMode ? 'Clinical Training' : 'Completion & Certificates'}
            </h1>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500 sm:text-sm">
              {clinicalMode
                ? 'Monitor attendance, logbook progress and supervisor evaluations from one place.'
                : 'Review final evaluations and issued training certificates from one place.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 text-xs font-extrabold text-white transition hover:bg-teal-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="border-t border-slate-100 px-3 pt-3 sm:px-5">
          <div className="flex gap-2 overflow-x-auto pb-3">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = tab.key === activeTab;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={
                    'inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-4 text-xs font-extrabold transition ' +
                    (active
                      ? 'bg-slate-950 text-white shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50')
                  }
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
          <div>
            <h2 className="text-sm font-black text-slate-950">{activeDefinition.label}</h2>
            <p className="mt-0.5 text-[10px] text-slate-500">Live database records</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-600">
            {loading ? '...' : records.length} records
          </span>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm font-semibold text-slate-500">Loading records...</div>
        ) : records.length === 0 ? (
          <div className="p-10 text-center">
            <Database className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-extrabold text-slate-700">No records found</p>
            <p className="mt-1 text-xs text-slate-500">Records will appear here when training activity is recorded.</p>
          </div>
        ) : columns.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                <tr>
                  {columns.map((column) => (
                    <th key={column} className="whitespace-nowrap px-4 py-3 font-black sm:px-5">
                      {column.replaceAll('_', ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((record, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-slate-50/70">
                    {columns.map((column) => (
                      <td key={column} className="max-w-[260px] truncate px-4 py-3 font-medium text-slate-700 sm:px-5">
                        {formatValue((record as Record<string, unknown>)[column])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <pre className="overflow-x-auto p-5 text-xs text-slate-700">{JSON.stringify(payload, null, 2)}</pre>
        )}
      </section>
    </div>
  );
};
