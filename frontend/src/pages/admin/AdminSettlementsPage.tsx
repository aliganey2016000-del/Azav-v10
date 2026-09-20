import React, { useEffect, useMemo, useState } from 'react';
import {
  Banknote,
  Ban,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Loader2,
  MoreVertical,
  Pencil,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import api from '../../services/api';

type RecordObject = Record<string, any>;

type SettlementForm = {
  organizationId: string;
  amount: string;
  description: string;
  currency: string;
  status: string;
  reference: string;
  paidAt: string;
};

const asArray = (response: any): RecordObject[] => {
  const data = response?.data?.data ?? response?.data ?? response;
  return Array.isArray(data) ? data : [];
};

const asId = (value: any) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return String(value._id || value.id || '');
};

const inputDateToday = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
};

const emptyForm = (): SettlementForm => ({
  organizationId: '',
  amount: '',
  description: '',
  currency: 'USD',
  status: 'PAID',
  reference: '',
  paidAt: inputDateToday(),
});

const formatMoney = (amount: any, currency = 'USD') => {
  const value = Number(amount || 0);
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return String(currency || 'USD') + ' ' + value.toFixed(2);
  }
};

const formatDate = (value?: string | Date) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const toInputDate = (value?: string | Date) => {
  if (!value) return inputDateToday();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return inputDateToday();
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
};

const statusClass = (status?: string) => {
  switch (status) {
    case 'PAID':
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100';
    case 'PENDING':
      return 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-100';
    case 'CANCELLED':
      return 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-100';
    default:
      return 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200';
  }
};

const loadAllOrganizations = async () => {
  const collected: RecordObject[] = [];
  let page = 1;

  while (page <= 25) {
    const response = await api.get('/admin/organizations', {
      params: { page, limit: 100 },
    });
    collected.push(...asArray(response));

    const pagination = response?.data?.pagination;
    if (!pagination?.totalPages || page >= Number(pagination.totalPages)) break;
    page += 1;
  }

  return collected;
};

export const AdminSettlementsPage: React.FC = () => {
  const [records, setRecords] = useState<RecordObject[]>([]);
  const [organizations, setOrganizations] = useState<RecordObject[]>([]);
  const [form, setForm] = useState<SettlementForm>(() => emptyForm());
  const [editing, setEditing] = useState<RecordObject | null>(null);
  const [viewing, setViewing] = useState<RecordObject | null>(null);
  const [rowMenuId, setRowMenuId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const [loading, setLoading] = useState(true);
  const [organizationsLoading, setOrganizationsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadRecords = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/finance', { params: { type: 'SETTLEMENT' } });
      setRecords(asArray(response));
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.error?.message ||
          'Unable to load settlement records.'
      );
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizations = async () => {
    setOrganizationsLoading(true);
    try {
      setOrganizations(await loadAllOrganizations());
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.error?.message ||
          'Unable to load beneficiary organizations.'
      );
    } finally {
      setOrganizationsLoading(false);
    }
  };

  useEffect(() => {
    void loadRecords();
    void loadOrganizations();
  }, []);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      if (statusFilter && String(record.status || '') !== statusFilter) return false;

      if (dateFilter) {
        const rawDate = record.paidAt || record.createdAt;
        const recordDate = rawDate ? new Date(rawDate) : null;
        if (!recordDate || Number.isNaN(recordDate.getTime())) return false;

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (dateFilter === 'TODAY' && recordDate < todayStart) return false;

        if (dateFilter === '7_DAYS') {
          const cutoff = new Date(todayStart);
          cutoff.setDate(cutoff.getDate() - 6);
          if (recordDate < cutoff) return false;
        }

        if (dateFilter === '30_DAYS') {
          const cutoff = new Date(todayStart);
          cutoff.setDate(cutoff.getDate() - 29);
          if (recordDate < cutoff) return false;
        }

        if (
          dateFilter === 'THIS_MONTH' &&
          (recordDate.getFullYear() !== now.getFullYear() ||
            recordDate.getMonth() !== now.getMonth())
        ) {
          return false;
        }
      }

      if (!query) return true;

      return [
        record.organizationId?.name,
        record.organizationId?.code,
        record.reference,
        record.description,
        record.currency,
        record.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [records, search, statusFilter, dateFilter]);

  const selectedOrganization =
    organizations.find((organization) => asId(organization) === form.organizationId) ||
    null;

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm());
    setRowMenuId(null);
  };

  const saveSettlement = async () => {
    const amount = Number(form.amount);

    if (!form.organizationId) {
      setError('Select a beneficiary organization.');
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a valid settlement amount.');
      return;
    }

    if (!form.description.trim()) {
      setError('Enter a settlement description.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    const payload = {
      type: 'SETTLEMENT',
      organizationId: form.organizationId,
      description: form.description.trim(),
      amount,
      currency: form.currency || 'USD',
      status: form.status,
      reference: form.reference.trim() || undefined,
      paidAt: form.status === 'PAID' ? form.paidAt || undefined : null,
    };

    try {
      if (editing) {
        await api.patch('/finance/' + asId(editing), payload);
        setSuccess('Settlement updated successfully.');
      } else {
        await api.post('/finance', payload);
        setSuccess('Settlement recorded successfully.');
      }

      resetForm();
      await loadRecords();
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.error?.message ||
          'Unable to save settlement.'
      );
    } finally {
      setSaving(false);
    }
  };

  const editSettlement = (record: RecordObject) => {
    setEditing(record);
    setViewing(null);
    setRowMenuId(null);
    setSuccess('');
    setError('');
    setForm({
      organizationId: asId(record.organizationId),
      amount: record.amount == null ? '' : String(record.amount),
      description: record.description || '',
      currency: record.currency || 'USD',
      status: record.status || 'PAID',
      reference: record.reference || '',
      paidAt: toInputDate(record.paidAt || record.createdAt),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const voidSettlement = async (record: RecordObject) => {
    setRowMenuId(null);
    const reason = window.prompt('Reason for void / cancellation', '');
    if (reason === null) return;
    if (!reason.trim()) {
      setError('A reason is required to void this settlement.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/finance/' + asId(record) + '/void', {
        reason: reason.trim(),
      });
      await loadRecords();
      setSuccess('Settlement cancelled. The audit history has been preserved.');
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.error?.message ||
          'Unable to cancel settlement.'
      );
    } finally {
      setSaving(false);
    }
  };

  const exportCsv = () => {
    const headers = [
      'Beneficiary Organization',
      'Reference',
      'Description',
      'Amount',
      'Currency',
      'Status',
      'Settlement Date',
    ];

    const rows = filteredRecords.map((record) => [
      record.organizationId?.name || '',
      record.reference || '',
      record.description || '',
      Number(record.amount || 0).toFixed(2),
      record.currency || 'USD',
      record.status || '',
      formatDate(record.paidAt || record.createdAt),
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => '"' + String(value ?? '').replace(/"/g, '""') + '"')
          .join(',')
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'azaam-settlements-' + inputDateToday() + '.csv';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 pb-10">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-cyan-50/45 to-emerald-50/45 p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-4 pr-14">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 shadow-sm">
            <Banknote className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-700">
              Finance · Partners
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Record Settlement
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Record payments made to hospitals and other beneficiary organizations.
            </p>
          </div>
        </div>

        <button
          type="button"
          aria-label="Refresh settlements"
          onClick={() => void loadRecords()}
          className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white/90 text-slate-500 shadow-sm transition hover:border-teal-200 hover:text-teal-700 sm:right-6 sm:top-6"
        >
          <RefreshCw className={'h-5 w-5 ' + (loading ? 'animate-spin' : '')} />
        </button>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-white via-teal-50/35 to-cyan-50/40 p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-950">
                {editing ? 'Edit Settlement Details' : 'Settlement Details'}
              </h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Enter the beneficiary, amount and settlement information below.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                Beneficiary Organization *
              </span>
              <div className="relative mt-1.5">
                <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  value={form.organizationId}
                  disabled={organizationsLoading || saving}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      organizationId: event.target.value,
                    }))
                  }
                  className="min-h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white pl-10 pr-10 text-sm font-bold text-slate-800 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 disabled:bg-slate-100"
                >
                  <option value="">
                    {organizationsLoading
                      ? 'Loading organizations...'
                      : 'Select beneficiary organization'}
                  </option>
                  {organizations.map((organization) => (
                    <option key={asId(organization)} value={asId(organization)}>
                      {organization.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </label>

            <label>
              <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                Amount *
              </span>
              <div className="mt-1.5 flex min-h-12 overflow-hidden rounded-2xl border border-slate-200 bg-white transition focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-500/10">
                <div className="flex w-12 shrink-0 items-center justify-center border-r border-slate-200 bg-slate-50 text-sm font-black text-slate-500">
                  {form.currency === 'USD' ? '$' : form.currency}
                </div>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  disabled={saving}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      amount: event.target.value,
                    }))
                  }
                  placeholder="0.00"
                  className="min-w-0 flex-1 bg-transparent px-4 text-sm font-black text-slate-900 outline-none disabled:bg-slate-100"
                />
              </div>
            </label>

            <label>
              <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                Currency
              </span>
              <div className="relative mt-1.5">
                <select
                  value={form.currency}
                  disabled={saving}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      currency: event.target.value,
                    }))
                  }
                  className="min-h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-sm font-bold text-slate-800 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                >
                  <option value="USD">USD · US Dollar</option>
                  <option value="SOS">SOS · Somali Shilling</option>
                  <option value="EUR">EUR · Euro</option>
                  <option value="GBP">GBP · Pound Sterling</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </label>

            <label>
              <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                Status
              </span>
              <div className="relative mt-1.5">
                <span
                  className={
                    'pointer-events-none absolute left-4 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full ' +
                    (form.status === 'PAID' ? 'bg-emerald-500' : 'bg-amber-500')
                  }
                />
                <select
                  value={form.status}
                  disabled={saving}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value,
                    }))
                  }
                  className="min-h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white pl-9 pr-10 text-sm font-bold text-slate-800 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                >
                  <option value="PAID">Paid</option>
                  <option value="PENDING">Pending</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </label>

            <label className="sm:col-span-2">
              <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                Description *
              </span>
              <div className="relative mt-1.5">
                <FileText className="pointer-events-none absolute left-3.5 top-4 h-4 w-4 text-slate-400" />
                <textarea
                  rows={3}
                  maxLength={250}
                  value={form.description}
                  disabled={saving}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Clinical training settlement or beneficiary payment..."
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-semibold leading-6 text-slate-800 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 disabled:bg-slate-100"
                />
                <span className="absolute bottom-2.5 right-3 text-[9px] font-bold text-slate-400">
                  {form.description.length}/250
                </span>
              </div>
            </label>

            <label>
              <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                Reference
              </span>
              <input
                value={form.reference}
                disabled={saving}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    reference: event.target.value,
                  }))
                }
                placeholder="Auto-generated if blank"
                className="mt-1.5 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 disabled:bg-slate-100"
              />
            </label>

            <label>
              <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                Settlement Date
              </span>
              <div className="relative mt-1.5">
                <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={form.paidAt}
                  disabled={saving || form.status !== 'PAID'}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      paidAt: event.target.value,
                    }))
                  }
                  className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-bold text-slate-800 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>
            </label>
          </div>

          <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <Building2 className="h-4 w-4" />
              </div>
              <p className="text-xs font-semibold leading-5 text-slate-600">
                {selectedOrganization
                  ? 'This settlement will be recorded against ' +
                    selectedOrganization.name +
                    ' and kept in the finance ledger with a permanent reference.'
                  : 'Select the beneficiary organization. The settlement will be kept in the finance ledger with a permanent reference.'}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={resetForm}
              className="min-h-12 rounded-2xl border border-slate-200 bg-white px-6 text-sm font-black text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={
                saving ||
                organizationsLoading ||
                !form.organizationId ||
                !form.description.trim() ||
                !form.amount
              }
              onClick={() => void saveSettlement()}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-500 px-6 text-sm font-black text-white shadow-lg shadow-teal-500/15 transition hover:from-teal-700 hover:to-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Banknote className="h-4 w-4" />
              )}
              {saving
                ? 'Saving...'
                : editing
                  ? 'Save Changes'
                  : 'Record Settlement'}
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-950">
                Recent Settlements
              </h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {filteredRecords.length} result{filteredRecords.length === 1 ? '' : 's'} shown
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={exportCsv}
                disabled={filteredRecords.length === 0}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(260px,1fr)_180px_180px_auto]">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search organization, reference or description..."
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-teal-500 focus:bg-white"
              />
            </div>

            <FilterSelect
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="All Statuses"
              options={[
                ['PAID', 'Paid'],
                ['PENDING', 'Pending'],
                ['CANCELLED', 'Cancelled'],
              ]}
            />

            <FilterSelect
              value={dateFilter}
              onChange={setDateFilter}
              placeholder="All Dates"
              options={[
                ['TODAY', 'Today'],
                ['7_DAYS', 'Last 7 Days'],
                ['30_DAYS', 'Last 30 Days'],
                ['THIS_MONTH', 'This Month'],
              ]}
            />

            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setDateFilter('');
              }}
              className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-600 transition hover:bg-slate-50"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm font-bold text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading settlements...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <Banknote className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-black text-slate-700">
              No settlements found
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Recorded beneficiary transfers will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[820px] text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-5 py-3.5">Organization</th>
                    <th className="px-4 py-3.5">Reference</th>
                    <th className="px-4 py-3.5">Amount</th>
                    <th className="px-4 py-3.5">Date</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((record) => (
                    <tr
                      key={asId(record)}
                      role="button"
                      tabIndex={0}
                      onClick={() => setViewing(record)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setViewing(record);
                        }
                      }}
                      className="cursor-pointer transition hover:bg-teal-50/40 focus:bg-teal-50/40 focus:outline-none"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="max-w-[220px] truncate font-black text-slate-900">
                              {record.organizationId?.name || 'Beneficiary Organization'}
                            </div>
                            <div className="mt-0.5 max-w-[220px] truncate text-[10px] font-semibold text-slate-500">
                              {record.description || 'Settlement'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 font-mono text-[11px] font-black text-teal-700">
                        {record.reference || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 font-black text-slate-900">
                        {formatMoney(record.amount, record.currency)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-600">
                        {formatDate(record.paidAt || record.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={
                            'inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ' +
                            statusClass(record.status)
                          }
                        >
                          {record.status}
                        </span>
                      </td>
                      <td
                        className="relative px-5 py-4 text-right"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <button
                          type="button"
                          aria-label="Settlement actions"
                          onClick={() =>
                            setRowMenuId((current) =>
                              current === asId(record) ? null : asId(record)
                            )
                          }
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {rowMenuId === asId(record) && (
                          <div className="absolute right-5 top-13 z-30 w-48 rounded-2xl border border-slate-200 bg-white p-1.5 text-left shadow-xl">
                            <ActionButton
                              icon={<Eye className="h-4 w-4" />}
                              label="View Details"
                              onClick={() => {
                                setRowMenuId(null);
                                setViewing(record);
                              }}
                            />
                            <ActionButton
                              icon={<Pencil className="h-4 w-4" />}
                              label="Edit Settlement"
                              onClick={() => editSettlement(record)}
                            />
                            {record.status !== 'CANCELLED' && (
                              <ActionButton
                                danger
                                icon={<Ban className="h-4 w-4" />}
                                label="Void / Cancel"
                                onClick={() => void voidSettlement(record)}
                              />
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-3 md:hidden">
              {filteredRecords.map((record) => (
                <article
                  key={asId(record)}
                  role="button"
                  tabIndex={0}
                  onClick={() => setViewing(record)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setViewing(record);
                    }
                  }}
                  className="group min-w-0 cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition active:scale-[0.995]"
                >
                  <div className="bg-gradient-to-r from-white via-teal-50/35 to-cyan-50/60 p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-black text-slate-950">
                          {record.organizationId?.name || 'Beneficiary Organization'}
                        </h3>
                        <div className="mt-1 truncate font-mono text-[10px] font-black text-teal-700">
                          {record.reference || '—'}
                        </div>
                      </div>
                      <span
                        className={
                          'inline-flex shrink-0 rounded-full px-2.5 py-1 text-[9px] font-black ' +
                          statusClass(record.status)
                        }
                      >
                        {record.status}
                      </span>
                    </div>

                    <div className="mt-4 flex items-end justify-between gap-3">
                      <div>
                        <div className="text-[9px] font-black uppercase tracking-wide text-slate-400">
                          Amount
                        </div>
                        <div className="mt-1 text-sm font-black text-emerald-700">
                          {formatMoney(record.amount, record.currency)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-right">
                        <div>
                          <div className="text-[9px] font-black uppercase tracking-wide text-slate-400">
                            Date
                          </div>
                          <div className="mt-1 text-[11px] font-black text-slate-700">
                            {formatDate(record.paidAt || record.createdAt)}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-teal-600" />
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {viewing && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <button
            type="button"
            aria-label="Close settlement details"
            className="absolute inset-0 cursor-default"
            onClick={() => setViewing(null)}
          />
          <div className="relative z-10 max-h-[94vh] w-full overflow-y-auto rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:max-w-xl sm:rounded-3xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-700">
                  {viewing.reference || 'Settlement'}
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-950">
                  Settlement Details
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setViewing(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3 p-5 sm:grid-cols-2">
              <DetailBox
                label="Beneficiary"
                value={viewing.organizationId?.name || '—'}
              />
              <DetailBox label="Status" value={viewing.status || '—'} />
              <DetailBox
                label="Amount"
                value={formatMoney(viewing.amount, viewing.currency)}
              />
              <DetailBox
                label="Settlement Date"
                value={formatDate(viewing.paidAt || viewing.createdAt)}
              />
              <DetailBox label="Reference" value={viewing.reference || '—'} />
              <DetailBox label="Currency" value={viewing.currency || 'USD'} />
              <div className="sm:col-span-2">
                <DetailBox
                  label="Description"
                  value={viewing.description || '—'}
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setViewing(null)}
                className="min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-black text-slate-600"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => editSettlement(viewing)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 text-sm font-black text-white"
              >
                <Pencil className="h-4 w-4" />
                Edit Settlement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FilterSelect: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: Array<[string, string]>;
}> = ({ value, onChange, placeholder, options }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="min-h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 pr-9 text-sm font-semibold text-slate-700 outline-none transition focus:border-teal-500 focus:bg-white"
    >
      <option value="">{placeholder}</option>
      {options.map(([id, label]) => (
        <option key={id} value={id}>
          {label}
        </option>
      ))}
    </select>
    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
  </div>
);

const ActionButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}> = ({ icon, label, onClick, danger = false }) => (
  <button
    type="button"
    onClick={onClick}
    className={
      'flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-xs font-black transition ' +
      (danger
        ? 'text-rose-600 hover:bg-rose-50'
        : 'text-slate-700 hover:bg-slate-100')
    }
  >
    <span className={danger ? 'text-rose-500' : 'text-teal-600'}>{icon}</span>
    {label}
  </button>
);

const DetailBox: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div className="min-w-0 rounded-2xl bg-slate-50 p-4">
    <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">
      {label}
    </div>
    <div className="mt-1 break-words text-sm font-black leading-6 text-slate-800">
      {value}
    </div>
  </div>
);
