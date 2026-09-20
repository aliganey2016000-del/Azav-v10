import React, { useEffect, useMemo, useState } from 'react';
import {
  Banknote,
  Ban,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Download,
  Eye,
  FileText,
  Loader2,
  MoreVertical,
  Pencil,
  RotateCcw,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import api from '../../services/api';

type RecordObject = Record<string, any>;

type SettlementForm = {
  universityId: string;
  batchId: string;
  invoiceId: string;
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
  universityId: '',
  batchId: '',
  invoiceId: '',
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

const loadAllAdminPages = async (endpoint: string) => {
  const collected: RecordObject[] = [];
  let page = 1;

  while (page <= 25) {
    const response = await api.get(endpoint, { params: { page, limit: 100 } });
    collected.push(...asArray(response));
    const pagination = response?.data?.pagination;
    if (!pagination?.totalPages || page >= Number(pagination.totalPages)) break;
    page += 1;
  }

  return collected;
};

export const AdminSettlementsPage: React.FC = () => {
  const [records, setRecords] = useState<RecordObject[]>([]);
  const [universities, setUniversities] = useState<RecordObject[]>([]);
  const [organizations, setOrganizations] = useState<RecordObject[]>([]);
  const [batches, setBatches] = useState<RecordObject[]>([]);
  const [contextInvoices, setContextInvoices] = useState<RecordObject[]>([]);
  const [hospitalOptions, setHospitalOptions] = useState<RecordObject[]>([]);
  const [settlementContext, setSettlementContext] = useState<RecordObject | null>(null);

  const [form, setForm] = useState<SettlementForm>(() => emptyForm());
  const [editing, setEditing] = useState<RecordObject | null>(null);
  const [viewing, setViewing] = useState<RecordObject | null>(null);
  const [rowMenuId, setRowMenuId] = useState<string | null>(null);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [formVisible, setFormVisible] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const [loading, setLoading] = useState(true);
  const [referencesLoading, setReferencesLoading] = useState(true);
  const [batchLoading, setBatchLoading] = useState(false);
  const [contextLoading, setContextLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
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

  const loadReferences = async () => {
    setReferencesLoading(true);
    try {
      const [nextUniversities, nextOrganizations] = await Promise.all([
        loadAllAdminPages('/admin/universities'),
        loadAllAdminPages('/admin/organizations'),
      ]);
      setUniversities(nextUniversities);
      setOrganizations(nextOrganizations);
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.error?.message ||
          'Unable to load settlement reference data.'
      );
    } finally {
      setReferencesLoading(false);
    }
  };

  const loadBatches = async (universityId: string) => {
    if (!universityId) {
      setBatches([]);
      return [];
    }

    setBatchLoading(true);
    try {
      const response = await api.get('/admin/training-batches', {
        params: { universityId },
      });
      const next = asArray(response);
      setBatches(next);
      return next;
    } catch (requestError: any) {
      setBatches([]);
      setError(
        requestError?.response?.data?.error?.message ||
          'Unable to load batches for this university.'
      );
      return [];
    } finally {
      setBatchLoading(false);
    }
  };

  const loadContext = async (
    batchId: string,
    invoiceId = '',
    universityId = form.universityId
  ) => {
    if (!batchId) {
      setContextInvoices([]);
      setHospitalOptions([]);
      setSettlementContext(null);
      return null;
    }

    setContextLoading(true);
    try {
      const response = await api.get('/finance/settlement-context', {
        params: {
          batchId,
          universityId: universityId || undefined,
          invoiceId: invoiceId || undefined,
        },
      });
      const data = response?.data?.data ?? response?.data ?? {};
      const invoices = Array.isArray(data?.invoices) ? data.invoices : [];
      const hospitals = Array.isArray(data?.hospitals) ? data.hospitals : [];
      setContextInvoices(invoices);
      setHospitalOptions(hospitals);
      setSettlementContext(data);
      return data;
    } catch (requestError: any) {
      setContextInvoices([]);
      setHospitalOptions([]);
      setSettlementContext(null);
      setError(
        requestError?.response?.data?.error?.message ||
          'Unable to load hospitals and invoices for this batch.'
      );
      return null;
    } finally {
      setContextLoading(false);
    }
  };

  useEffect(() => {
    void loadRecords();
    void loadReferences();
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
        record.universityId?.name,
        record.batchId?.batchNumber,
        record.invoiceId?.invoiceNumber,
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

  const settlementSummary = useMemo(() => {
    const paid = records.filter((record) => record.status === 'PAID');
    const currencies = Array.from(
      new Set(paid.map((record) => String(record.currency || 'USD')))
    );
    const totalSettled = paid.reduce(
      (sum, record) => sum + Number(record.amount || 0),
      0
    );

    return {
      totalSettled,
      totalSettledCurrency: currencies.length === 1 ? currencies[0] : '',
      totalSettlements: records.length,
      pending: records.filter((record) => record.status === 'PENDING').length,
      cancelled: records.filter((record) => record.status === 'CANCELLED').length,
    };
  }, [records]);

  const selectedUniversity =
    universities.find((item) => asId(item) === form.universityId) || null;
  const selectedBatch =
    batches.find((item) => asId(item) === form.batchId) ||
    settlementContext?.batch ||
    null;
  const selectedInvoice =
    contextInvoices.find((item) => asId(item) === form.invoiceId) ||
    settlementContext?.selectedInvoice ||
    null;
  const selectedHospital =
    hospitalOptions.find((item) => asId(item.organizationId) === form.organizationId) ||
    null;
  const selectedOrganization =
    organizations.find((item) => asId(item) === form.organizationId) || null;

  const isLegacyEditing = Boolean(
    editing && (!form.universityId || !form.batchId || !form.invoiceId)
  );

  const resetForm = () => {
    setEditing(null);
    setFormError('');
    setForm(emptyForm());
    setBatches([]);
    setContextInvoices([]);
    setHospitalOptions([]);
    setSettlementContext(null);
    setRowMenuId(null);
  };

  const closeForm = () => {
    resetForm();
    setFormVisible(false);
  };

  const openCreateSettlement = () => {
    resetForm();
    setSuccess('');
    setError('');
    setFormError('');
    setHeaderMenuOpen(false);
    setFormVisible(true);
    window.requestAnimationFrame(() => {
      document.getElementById('settlement-form-card')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

  const handleUniversityChange = async (universityId: string) => {
    setError('');
    setForm((current) => ({
      ...current,
      universityId,
      batchId: '',
      invoiceId: '',
      organizationId: '',
      amount: '',
      description: '',
      currency: 'USD',
    }));
    setContextInvoices([]);
    setHospitalOptions([]);
    setSettlementContext(null);
    await loadBatches(universityId);
  };

  const handleBatchChange = async (batchId: string) => {
    setError('');
    setForm((current) => ({
      ...current,
      batchId,
      invoiceId: '',
      organizationId: '',
      amount: '',
      description: '',
      currency: 'USD',
    }));
    setContextInvoices([]);
    setHospitalOptions([]);
    setSettlementContext(null);

    if (!batchId) return;

    const data = await loadContext(batchId, '', form.universityId);
    const invoices = Array.isArray(data?.invoices) ? data.invoices : [];

    if (invoices.length === 1) {
      const invoice = invoices[0];
      const invoiceId = asId(invoice);
      setForm((current) => ({
        ...current,
        invoiceId,
        currency: invoice.currency || 'USD',
      }));
      await loadContext(batchId, invoiceId, form.universityId);
    }
  };

  const handleInvoiceChange = async (invoiceId: string) => {
    const invoice = contextInvoices.find((item) => asId(item) === invoiceId);
    setError('');
    setForm((current) => ({
      ...current,
      invoiceId,
      organizationId: '',
      amount: '',
      description: '',
      currency: invoice?.currency || current.currency || 'USD',
    }));

    if (!invoiceId) {
      await loadContext(form.batchId, '', form.universityId);
      return;
    }

    await loadContext(form.batchId, invoiceId, form.universityId);
  };

  const handleHospitalChange = (organizationId: string) => {
    const hospital = hospitalOptions.find(
      (item) => asId(item.organizationId) === organizationId
    );
    const suggested = Number(hospital?.suggestedAmount || 0);
    const remainingCapacity = Number(
      settlementContext?.remainingInvoiceSettlementCapacity ?? suggested
    );
    const safeAmount =
      suggested > 0
        ? Math.max(0, Math.min(suggested, remainingCapacity))
        : 0;

    setFormError('');
    setForm((current) => ({
      ...current,
      organizationId,
      amount: safeAmount > 0 ? String(safeAmount.toFixed(2)) : '',
      description: hospital
        ? [
            selectedBatch?.batchNumber || 'Batch',
            hospital.name,
            hospital.studentCount + ' student' + (hospital.studentCount === 1 ? '' : 's'),
          ].join(' · ') + ' settlement'
        : '',
    }));
  };

  const saveSettlement = async () => {
    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError('Enter a valid settlement amount.');
      return;
    }

    if (!form.description.trim()) {
      setFormError('Enter a settlement description.');
      return;
    }

    if (!editing && (!form.universityId || !form.batchId || !form.invoiceId || !form.organizationId)) {
      setFormError('Select the university, batch, invoice and hospital before recording the settlement.');
      return;
    }

    if (editing && isLegacyEditing && !form.organizationId) {
      setFormError('Select a beneficiary organization.');
      return;
    }

    setSaving(true);
    setError('');
    setFormError('');
    setSuccess('');

    const editablePayload = {
      description: form.description.trim(),
      amount,
      currency: form.currency || 'USD',
      status: form.status,
      reference: form.reference.trim() || undefined,
      paidAt: form.status === 'PAID' ? form.paidAt || undefined : null,
    };

    try {
      if (editing) {
        await api.patch('/finance/' + asId(editing), {
          ...editablePayload,
          organizationId: isLegacyEditing ? form.organizationId : undefined,
        });
        setSuccess('Settlement updated successfully.');
      } else {
        const response = await api.post('/finance', {
          type: 'SETTLEMENT',
          universityId: form.universityId,
          batchId: form.batchId,
          invoiceId: form.invoiceId,
          organizationId: form.organizationId,
          ...editablePayload,
        });
        setSuccess(
          response?.data?.meta?.alreadyExists
            ? 'This batch hospital settlement was already recorded. The existing record is shown below.'
            : 'Batch hospital settlement recorded successfully.'
        );
      }

      resetForm();
      setFormVisible(false);
      await loadRecords();
    } catch (requestError: any) {
      const message =
        requestError?.response?.data?.error?.message ||
        'Unable to save settlement. Please check the selected batch, invoice and hospital.';
      setFormError(message);
      setError('');
    } finally {
      setSaving(false);
    }
  };

  const editSettlement = async (record: RecordObject) => {
    const universityId = asId(record.universityId);
    const batchId = asId(record.batchId);
    const invoiceId = asId(record.invoiceId);

    setEditing(record);
    setViewing(null);
    setRowMenuId(null);
    setSuccess('');
    setError('');
    setFormVisible(true);
    setForm({
      universityId,
      batchId,
      invoiceId,
      organizationId: asId(record.organizationId),
      amount: record.amount == null ? '' : String(record.amount),
      description: record.description || '',
      currency: record.currency || 'USD',
      status: record.status || 'PAID',
      reference: record.reference || '',
      paidAt: toInputDate(record.paidAt || record.createdAt),
    });

    if (universityId) {
      await loadBatches(universityId);
    }
    if (batchId) {
      await loadContext(batchId, invoiceId, universityId);
    }

    window.requestAnimationFrame(() => {
      document.getElementById('settlement-form-card')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
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

  const deleteSettlement = async (record: RecordObject) => {
    setRowMenuId(null);

    const confirmed = window.confirm(
      'Delete this settlement permanently? This will remove the card from the settlement register.'
    );
    if (!confirmed) return;

    setSaving(true);
    setError('');
    setFormError('');
    setSuccess('');

    try {
      await api.delete('/finance/' + asId(record));
      if (viewing && asId(viewing) === asId(record)) {
        setViewing(null);
      }
      if (editing && asId(editing) === asId(record)) {
        closeForm();
      }
      await loadRecords();
      setSuccess('Settlement deleted successfully.');
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.error?.message ||
          'Unable to delete settlement.'
      );
    } finally {
      setSaving(false);
    }
  };

  const exportCsv = () => {
    const headers = [
      'University',
      'Batch',
      'Beneficiary Organization',
      'Invoice',
      'Students',
      'Reference',
      'Description',
      'Amount',
      'Currency',
      'Status',
      'Settlement Date',
    ];

    const rows = filteredRecords.map((record) => [
      record.universityId?.name || '',
      record.batchId?.batchNumber || '',
      record.organizationId?.name || '',
      record.invoiceId?.invoiceNumber || '',
      record.settlementStudentCount || '',
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

  const totalSettledLabel = loading
    ? '—'
    : settlementSummary.totalSettledCurrency
      ? formatMoney(
          settlementSummary.totalSettled,
          settlementSummary.totalSettledCurrency
        )
      : settlementSummary.totalSettled > 0
        ? 'Multiple currencies'
        : formatMoney(0, 'USD');

  const contextLocked = Boolean(editing && !isLegacyEditing);

  return (
    <div className="space-y-5 pb-10">
      <section className="relative overflow-visible rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-cyan-50/45 to-emerald-50/45 p-4 shadow-sm sm:p-6">
        <div className="flex items-center gap-3 pr-14 sm:gap-4 sm:pr-16">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 shadow-sm sm:h-12 sm:w-12">
            <Banknote className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-teal-700 sm:text-[10px] sm:tracking-[0.2em]">
              Finance · Partners
            </p>
            <h1 className="mt-1 whitespace-nowrap text-xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Record Settlement
            </h1>
          </div>
        </div>

        <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
          <button
            type="button"
            aria-label="Settlement actions"
            aria-expanded={headerMenuOpen}
            onClick={() => setHeaderMenuOpen((current) => !current)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white/95 text-slate-500 shadow-sm transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          {headerMenuOpen && (
            <div className="absolute right-0 top-12 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl">
              <button
                type="button"
                onClick={openCreateSettlement}
                className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-xs font-black text-teal-700 transition hover:bg-teal-50"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50">
                  <Banknote className="h-4 w-4" />
                </span>
                Create Settlement
              </button>
            </div>
          )}
        </div>
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

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <SettlementMetric
          icon={<CircleDollarSign className="h-5 w-5" />}
          label="Total Settled"
          value={totalSettledLabel}
          helper="Paid settlements"
          tone="green"
        />
        <SettlementMetric
          icon={<FileText className="h-5 w-5" />}
          label="Total Settlements"
          value={loading ? '—' : String(settlementSummary.totalSettlements)}
          helper="All time"
          tone="blue"
        />
        <SettlementMetric
          icon={<Clock3 className="h-5 w-5" />}
          label="Pending"
          value={loading ? '—' : String(settlementSummary.pending)}
          helper="Needs attention"
          tone="amber"
        />
        <SettlementMetric
          icon={<RotateCcw className="h-5 w-5" />}
          label="Cancelled"
          value={loading ? '—' : String(settlementSummary.cancelled)}
          helper="Recorded reversals"
          tone="rose"
        />
      </section>

      {formVisible && (
        <section
          id="settlement-form-card"
          className="scroll-mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-100 bg-gradient-to-r from-white via-teal-50/35 to-cyan-50/40 p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-black text-slate-950">
                  {editing ? 'Edit Settlement' : 'Create Batch Settlement'}
                </h2>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                  {isLegacyEditing
                    ? 'Legacy settlement record. Update the beneficiary and payment details below.'
                    : 'Select University → Batch → Invoice → Hospital. The hospital list comes directly from student placements.'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {!isLegacyEditing && (
              <>
                <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    ['1', 'University'],
                    ['2', 'Batch'],
                    ['3', 'Invoice'],
                    ['4', 'Hospital'],
                  ].map(([step, label]) => (
                    <div
                      key={step}
                      className="rounded-2xl border border-teal-100 bg-teal-50/55 p-3"
                    >
                      <div className="text-[9px] font-black uppercase tracking-[0.15em] text-teal-700">
                        Step {step}
                      </div>
                      <div className="mt-1 text-xs font-black text-slate-800">
                        {label}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <SelectField
                    label="University *"
                    value={form.universityId}
                    disabled={referencesLoading || saving || contextLocked}
                    onChange={(value) => void handleUniversityChange(value)}
                  >
                    <option value="">
                      {referencesLoading ? 'Loading universities...' : 'Select university'}
                    </option>
                    {universities.map((university) => (
                      <option key={asId(university)} value={asId(university)}>
                        {university.name}
                      </option>
                    ))}
                  </SelectField>

                  <SelectField
                    label="Batch *"
                    value={form.batchId}
                    disabled={!form.universityId || batchLoading || saving || contextLocked}
                    onChange={(value) => void handleBatchChange(value)}
                  >
                    <option value="">
                      {batchLoading ? 'Loading batches...' : 'Select batch'}
                    </option>
                    {batches.map((batch) => (
                      <option key={asId(batch)} value={asId(batch)}>
                        {batch.batchNumber} · {batch.name}
                      </option>
                    ))}
                  </SelectField>

                  <SelectField
                    label="Batch Invoice *"
                    value={form.invoiceId}
                    disabled={!form.batchId || contextLoading || saving || contextLocked}
                    onChange={(value) => void handleInvoiceChange(value)}
                  >
                    <option value="">
                      {contextLoading ? 'Loading invoices...' : 'Select invoice'}
                    </option>
                    {contextInvoices.map((invoice) => (
                      <option key={asId(invoice)} value={asId(invoice)}>
                        {invoice.invoiceNumber || 'Invoice'} · {formatMoney(invoice.amount, invoice.currency)}
                      </option>
                    ))}
                  </SelectField>

                  <SelectField
                    label="Hospital / Beneficiary *"
                    value={form.organizationId}
                    disabled={!form.invoiceId || contextLoading || saving || contextLocked}
                    onChange={handleHospitalChange}
                  >
                    <option value="">
                      {contextLoading ? 'Loading hospitals...' : 'Select hospital'}
                    </option>
                    {hospitalOptions.map((hospital) => (
                      <option
                        key={asId(hospital.organizationId)}
                        value={asId(hospital.organizationId)}
                        disabled={Boolean(hospital.alreadySettled)}
                      >
                        {hospital.name} · {hospital.studentCount} student
                        {hospital.studentCount === 1 ? '' : 's'}
                        {hospital.alreadySettled ? ' · Already settled' : ''}
                      </option>
                    ))}
                  </SelectField>
                </div>

                {form.batchId && !contextLoading && contextInvoices.length === 0 && (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-800">
                    No active invoice was found for this batch. Create the batch invoice before recording a hospital settlement.
                  </div>
                )}

                {form.invoiceId && !contextLoading && hospitalOptions.length === 0 && (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-800">
                    No hospital placements were found for students in this batch.
                  </div>
                )}

                {(selectedInvoice || selectedHospital) && (
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <ContextBox
                      label="Batch Students"
                      value={String(selectedBatch?.studentsCount ?? '—')}
                    />
                    <ContextBox
                      label="Hospital Students"
                      value={selectedHospital ? String(selectedHospital.studentCount || 0) : '—'}
                    />
                    <ContextBox
                      label="Invoice Amount"
                      value={
                        selectedInvoice
                          ? formatMoney(selectedInvoice.amount, selectedInvoice.currency)
                          : '—'
                      }
                    />
                    <ContextBox
                      label="Suggested Settlement"
                      value={
                        selectedHospital && selectedInvoice
                          ? formatMoney(
                              selectedHospital.suggestedAmount || 0,
                              selectedInvoice.currency
                            )
                          : '—'
                      }
                    />
                  </div>
                )}

                {selectedHospital?.students?.length > 0 && (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-teal-700" />
                      <div className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                        Students at {selectedHospital.name}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedHospital.students.map((student: RecordObject) => (
                        <span
                          key={student.studentId}
                          className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold text-slate-700"
                        >
                          {student.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {isLegacyEditing && (
              <div className="mb-4">
                <SelectField
                  label="Beneficiary Organization *"
                  value={form.organizationId}
                  disabled={referencesLoading || saving}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, organizationId: value }))
                  }
                >
                  <option value="">Select beneficiary organization</option>
                  {organizations.map((organization) => (
                    <option key={asId(organization)} value={asId(organization)}>
                      {organization.name}
                    </option>
                  ))}
                </SelectField>
              </div>
            )}

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label>
                <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                  Settlement Amount *
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
                    onChange={(event) => {
                      setFormError('');
                      setForm((current) => ({ ...current, amount: event.target.value }));
                    }}
                    placeholder="0.00"
                    className="min-w-0 flex-1 bg-transparent px-4 text-sm font-black text-slate-900 outline-none disabled:bg-slate-100"
                  />
                </div>
              </label>

              <SelectField
                label="Status"
                value={form.status}
                disabled={saving}
                onChange={(value) =>
                  setForm((current) => ({ ...current, status: value }))
                }
              >
                <option value="PAID">Paid</option>
                <option value="PENDING">Pending</option>
              </SelectField>

              <label className="sm:col-span-2">
                <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                  Description *
                </span>
                <textarea
                  rows={3}
                  maxLength={250}
                  value={form.description}
                  disabled={saving}
                  onChange={(event) => {
                    setFormError('');
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }));
                  }}
                  placeholder="Batch hospital settlement description..."
                  className="mt-1.5 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-800 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 disabled:bg-slate-100"
                />
                <div className="mt-1 text-right text-[9px] font-bold text-slate-400">
                  {form.description.length}/250
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
                    setForm((current) => ({ ...current, reference: event.target.value }))
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
                      setForm((current) => ({ ...current, paidAt: event.target.value }))
                    }
                    className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-bold text-slate-800 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
              </label>
            </div>

            {!isLegacyEditing && selectedHospital && (
              <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-xs font-semibold leading-5 text-slate-600">
                This records one settlement for <strong>{selectedHospital.name}</strong> against{' '}
                <strong>{selectedBatch?.batchNumber || 'the selected batch'}</strong>. The current placement snapshot contains{' '}
                <strong>{selectedHospital.studentCount} student{selectedHospital.studentCount === 1 ? '' : 's'}</strong>. The same hospital, batch and invoice cannot be settled again unless this settlement is cancelled first.
              </div>
            )}

            {formError && (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold leading-5 text-rose-700">
                {formError}
              </div>
            )}

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={saving}
                onClick={closeForm}
                className="min-h-12 rounded-2xl border border-slate-200 bg-white px-6 text-sm font-black text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  saving ||
                  (!editing &&
                    (!form.universityId ||
                      !form.batchId ||
                      !form.invoiceId ||
                      !form.organizationId)) ||
                  !form.description.trim() ||
                  !Number.isFinite(Number(form.amount)) ||
                  Number(form.amount) <= 0
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
                    : 'Record Batch Settlement'}
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-black tracking-tight text-slate-950">
                Recent Settlements
              </h2>
              <p className="mt-1 hidden text-xs font-semibold text-slate-500 sm:block">
                Batch payments made to hospitals and partner organizations.
              </p>
            </div>

            <button
              type="button"
              onClick={exportCsv}
              disabled={filteredRecords.length === 0}
              className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 sm:px-4"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-[minmax(260px,1fr)_180px_180px_auto]">
            <div className="relative col-span-2 lg:col-span-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search hospital, batch, invoice or reference..."
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
              className="col-span-2 min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-600 transition hover:bg-slate-50 lg:col-span-1"
            >
              Reset Filters
            </button>
          </div>

          <div className="mt-3 text-right text-[10px] font-bold text-slate-500 sm:text-xs">
            {filteredRecords.length} result{filteredRecords.length === 1 ? '' : 's'} shown
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
              Batch hospital settlements will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-5 py-3.5">Hospital / Batch</th>
                    <th className="px-4 py-3.5">Reference</th>
                    <th className="px-4 py-3.5">Students</th>
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
                            <div className="max-w-[240px] truncate font-black text-slate-900">
                              {record.organizationId?.name || 'Beneficiary Organization'}
                            </div>
                            <div className="mt-0.5 max-w-[260px] truncate text-[10px] font-semibold text-slate-500">
                              {record.universityId?.name || 'Legacy settlement'}
                              {record.batchId?.batchNumber ? ' · ' + record.batchId.batchNumber : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 font-mono text-[11px] font-black text-teal-700">
                        {record.reference || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 font-black text-slate-700">
                        {record.settlementStudentCount || '—'}
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
                          <div className="absolute right-5 top-12 z-30 w-48 rounded-2xl border border-slate-200 bg-white p-1.5 text-left shadow-xl">
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
                              onClick={() => void editSettlement(record)}
                            />
                            <ActionButton
                              danger
                              icon={<Trash2 className="h-4 w-4" />}
                              label="Delete Settlement"
                              onClick={() => void deleteSettlement(record)}
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
                  className="group relative min-w-0 cursor-pointer overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm transition active:scale-[0.995]"
                >
                  <div className="bg-gradient-to-r from-white via-teal-50/30 to-cyan-50/55 p-3.5">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-black text-slate-950">
                              {record.organizationId?.name || 'Beneficiary Organization'}
                            </h3>
                            <div className="mt-0.5 truncate font-mono text-[10px] font-black text-teal-700">
                              {record.reference || '—'}
                            </div>
                          </div>
                          <div
                            className="relative flex shrink-0 items-center gap-1.5"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <span
                              className={
                                'inline-flex rounded-full px-2.5 py-1 text-[9px] font-black ' +
                                statusClass(record.status)
                              }
                            >
                              {record.status}
                            </span>
                            <button
                              type="button"
                              aria-label="Settlement actions"
                              onClick={() =>
                                setRowMenuId((current) =>
                                  current === asId(record) ? null : asId(record)
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white/95 text-slate-500 shadow-sm"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>

                            {rowMenuId === asId(record) && (
                              <div className="absolute right-0 top-10 z-40 w-48 rounded-2xl border border-slate-200 bg-white p-1.5 text-left shadow-2xl">
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
                                  onClick={() => void editSettlement(record)}
                                />
                                <ActionButton
                                  danger
                                  icon={<Trash2 className="h-4 w-4" />}
                                  label="Delete Settlement"
                                  onClick={() => void deleteSettlement(record)}
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
                          </div>
                        </div>

                        <p className="mt-1 truncate text-[10px] font-semibold text-slate-500">
                          {record.batchId?.batchNumber
                            ? (record.universityId?.name || 'University') +
                              ' · ' +
                              record.batchId.batchNumber +
                              ' · ' +
                              (record.settlementStudentCount || 0) +
                              ' students'
                            : record.description || 'Settlement'}
                        </p>

                        <div className="mt-2 flex items-center justify-between gap-3">
                          <div className="text-sm font-black text-emerald-700">
                            {formatMoney(record.amount, record.currency)}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-600">
                            <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                            {formatDate(record.paidAt || record.createdAt)}
                            <ChevronRight className="ml-1 h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-teal-600" />
                          </div>
                        </div>
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
          <div className="relative z-10 max-h-[94vh] w-full overflow-y-auto rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:max-w-2xl sm:rounded-3xl">
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
                label="University"
                value={viewing.universityId?.name || 'Legacy settlement'}
              />
              <DetailBox
                label="Batch"
                value={
                  viewing.batchId
                    ? (viewing.batchId.batchNumber || 'Batch') +
                      (viewing.batchId.name ? ' · ' + viewing.batchId.name : '')
                    : '—'
                }
              />
              <DetailBox
                label="Hospital / Beneficiary"
                value={viewing.organizationId?.name || '—'}
              />
              <DetailBox
                label="Batch Invoice"
                value={viewing.invoiceId?.invoiceNumber || '—'}
              />
              <DetailBox
                label="Students"
                value={
                  viewing.settlementStudentCount != null
                    ? String(viewing.settlementStudentCount)
                    : '—'
                }
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
                onClick={() => void deleteSettlement(viewing)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-5 text-sm font-black text-rose-700"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
              <button
                type="button"
                onClick={() => void editSettlement(viewing)}
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

const SettlementMetric: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  helper: string;
  tone: 'green' | 'blue' | 'amber' | 'rose';
}> = ({ icon, label, value, helper, tone }) => {
  const tones = {
    green: 'border-emerald-100 bg-emerald-50/65 text-emerald-700',
    blue: 'border-blue-100 bg-blue-50/60 text-blue-700',
    amber: 'border-amber-100 bg-amber-50/70 text-amber-700',
    rose: 'border-rose-100 bg-rose-50/65 text-rose-700',
  } as const;

  return (
    <article className={'min-w-0 rounded-2xl border p-3.5 shadow-sm sm:rounded-3xl sm:p-5 ' + tones[tone]}>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/85 shadow-sm sm:h-10 sm:w-10">
        {icon}
      </div>
      <div className="mt-3 break-words text-lg font-black tracking-tight text-slate-950 sm:text-2xl">
        {value}
      </div>
      <div className="mt-1 text-[9px] font-black uppercase tracking-wide text-slate-500 sm:text-xs">
        {label}
      </div>
      <div className="mt-1 hidden text-[10px] font-semibold text-slate-400 sm:block">
        {helper}
      </div>
    </article>
  );
};

const ContextBox: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
    <div className="text-[9px] font-black uppercase tracking-wide text-slate-400">
      {label}
    </div>
    <div className="mt-1 break-words text-sm font-black text-slate-900">
      {value}
    </div>
  </div>
);

const SelectField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
}> = ({ label, value, onChange, children, disabled = false }) => (
  <label>
    <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">
      {label}
    </span>
    <div className="relative mt-1.5">
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-sm font-bold text-slate-800 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  </label>
);

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
