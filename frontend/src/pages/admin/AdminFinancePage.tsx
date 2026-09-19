import React, { useEffect, useMemo, useState } from 'react';
import {
  Banknote,
  Ban,
  Building2,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  Eye,
  FileText,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Trash2,
  Search,
  Users,
  WalletCards,
  X,
} from 'lucide-react';
import api from '../../services/api';

type RecordObject = Record<string, any>;
export type FinanceMode = 'fees' | 'payments' | 'transactions' | 'settlements' | 'refunds';

type FinancePageProps = {
  mode: FinanceMode;
  readOnly?: boolean;
  titleOverride?: string;
  eyebrowOverride?: string;
  descriptionOverride?: string;
  registerTitleOverride?: string;
  registerDescriptionOverride?: string;
};

type FinanceForm = {
  payerType: string;
  userId: string;
  universityId: string;
  organizationId: string;
  invoiceId: string;
  description: string;
  amount: string;
  currency: string;
  status: string;
  invoiceNumber: string;
  reference: string;
  dueDate: string;
  paidAt: string;
  paymentMethod: string;
  notes: string;
};

const CONFIG: Record<FinanceMode, {
  title: string;
  eyebrow: string;
  description: string;
  type: string;
  action: string;
}> = {
  fees: {
    title: 'Fees & Invoices',
    eyebrow: 'Finance · Billing',
    description: 'Create and manage training fees, invoices, balances and due dates.',
    type: 'FEE',
    action: 'New Invoice',
  },
  payments: {
    title: 'Payments',
    eyebrow: 'Finance · Receipts',
    description: 'Record incoming payments and maintain verified payment references.',
    type: 'PAYMENT',
    action: 'Record Payment',
  },
  transactions: {
    title: 'Transactions',
    eyebrow: 'Finance · Ledger',
    description: 'Review the complete financial ledger across fees, payments, refunds and settlements.',
    type: '',
    action: '',
  },
  settlements: {
    title: 'Settlements',
    eyebrow: 'Finance · Partners',
    description: 'Record settlement transfers to hospitals and partner organizations.',
    type: 'SETTLEMENT',
    action: 'Record Settlement',
  },
  refunds: {
    title: 'Refunds',
    eyebrow: 'Finance · Reversals',
    description: 'Review refunds created from original payment records and maintain a clear reversal audit trail.',
    type: 'REFUND',
    action: '',
  },
};

const EMPTY_FORM: FinanceForm = {
  payerType: 'UNIVERSITY',
  userId: '',
  universityId: '',
  organizationId: '',
  invoiceId: '',
  description: '',
  amount: '',
  currency: 'USD',
  status: 'PENDING',
  invoiceNumber: '',
  reference: '',
  dueDate: '',
  paidAt: '',
  paymentMethod: '',
  notes: '',
};

const asArray = (response: any, key?: string): RecordObject[] => {
  const data = response?.data?.data ?? response?.data ?? response;
  if (Array.isArray(data)) return data;
  if (key && Array.isArray(data?.[key])) return data[key];
  return [];
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

const asId = (value: any) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return String(value._id || value.id || '');
};

const accountName = (record: RecordObject) => {
  const user = record.userId;
  if (!user) return record.universityId?.name || record.organizationId?.name || 'Account';
  if (typeof user === 'string') return user;
  return [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || record.organizationId?.name || 'Account';
};

const accountEmail = (record: RecordObject) => {
  const user = record.userId;
  if (typeof user === 'object' && user?.email) return user.email;
  return record.universityId?.email || record.organizationId?.contactEmail || '';
};

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
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const statusClass = (status: string) => {
  switch (status) {
    case 'PAID':
      return 'bg-emerald-50 text-emerald-700';
    case 'PARTIAL':
      return 'bg-amber-50 text-amber-700';
    case 'OVERDUE':
      return 'bg-rose-50 text-rose-700';
    case 'REFUNDED':
      return 'bg-violet-50 text-violet-700';
    case 'CANCELLED':
      return 'bg-slate-100 text-slate-500';
    default:
      return 'bg-blue-50 text-blue-700';
  }
};

const typeClass = (type: string) => {
  switch (type) {
    case 'PAYMENT':
      return 'bg-emerald-50 text-emerald-700';
    case 'REFUND':
      return 'bg-rose-50 text-rose-700';
    case 'SETTLEMENT':
      return 'bg-violet-50 text-violet-700';
    default:
      return 'bg-blue-50 text-blue-700';
  }
};

export const AdminFinancePage: React.FC<FinancePageProps> = ({
  mode,
  readOnly = false,
  titleOverride,
  eyebrowOverride,
  descriptionOverride,
  registerTitleOverride,
  registerDescriptionOverride,
}) => {
  const baseConfig = CONFIG[mode];
  const config = {
    ...baseConfig,
    title: titleOverride || baseConfig.title,
    eyebrow: eyebrowOverride || baseConfig.eyebrow,
    description: descriptionOverride || baseConfig.description,
  };

  const [records, setRecords] = useState<RecordObject[]>([]);
  const [users, setUsers] = useState<RecordObject[]>([]);
  const [universities, setUniversities] = useState<RecordObject[]>([]);
  const [organizations, setOrganizations] = useState<RecordObject[]>([]);
  const [invoices, setInvoices] = useState<RecordObject[]>([]);
  const [feeRules, setFeeRules] = useState<RecordObject[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<Array<{ feeRuleId: string; quantity: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [referenceLoading, setReferenceLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [rowMenuId, setRowMenuId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [viewing, setViewing] = useState<RecordObject | null>(null);
  const [editing, setEditing] = useState<RecordObject | null>(null);
  const [form, setForm] = useState<FinanceForm>(EMPTY_FORM);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadRecords = async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {};
      if (config.type) params.type = config.type;
      const response = await api.get('/finance', { params });
      setRecords(asArray(response));
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error?.message || 'Unable to load finance records.');
    } finally {
      setLoading(false);
    }
  };

  const loadReferences = async () => {
    setReferenceLoading(true);
    try {
      const [nextUsers, nextUniversities, nextOrganizations, invoiceResponse] = await Promise.all([
        loadAllAdminPages('/admin/users'),
        loadAllAdminPages('/admin/universities'),
        loadAllAdminPages('/admin/organizations'),
        api.get('/finance', { params: { type: 'FEE' } }),
      ]);
      setUsers(nextUsers);
      setUniversities(nextUniversities);
      setOrganizations(nextOrganizations);
      setInvoices(asArray(invoiceResponse));
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error?.message || 'Unable to load finance reference data.');
    } finally {
      setReferenceLoading(false);
    }
  };

  useEffect(() => {
    void loadRecords();
  }, [mode]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      if (statusFilter && record.status !== statusFilter) return false;
      if (typeFilter && record.type !== typeFilter) return false;

      if (!query) return true;

      return [
        accountName(record),
        accountEmail(record),
        record.invoiceNumber,
        record.reference,
        record.description,
        record.organizationId?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [records, search, statusFilter, typeFilter]);

  const totalAmount = useMemo(
    () => filteredRecords.reduce((sum, record) => sum + Number(record.amount || 0), 0),
    [filteredRecords]
  );

  const currencySet = useMemo(
    () => new Set(filteredRecords.map((record) => record.currency || 'USD')),
    [filteredRecords]
  );

  const totalAmountLabel =
    currencySet.size > 1
      ? 'Multiple currencies'
      : formatMoney(totalAmount, Array.from(currencySet)[0] || 'USD');

  const pendingCount = filteredRecords.filter((record) =>
    ['PENDING', 'PARTIAL', 'OVERDUE'].includes(record.status)
  ).length;

  const completedCount = filteredRecords.filter((record) =>
    ['PAID', 'REFUNDED'].includes(record.status)
  ).length;

  const openCreate = async () => {
    const defaultStatus =
      config.type === 'FEE' ? 'PENDING' : config.type === 'REFUND' ? 'REFUNDED' : 'PAID';

    setForm({
      ...EMPTY_FORM,
      status: defaultStatus,
      paidAt: config.type && config.type !== 'FEE' ? toInputDate(new Date()) : '',
    });
    setEditing(null);
    setInvoiceItems([]);
    setFeeRules([]);
    setHeaderMenuOpen(false);
    setInvoiceItems(
      Array.isArray(record.lineItems)
        ? record.lineItems
            .filter((item: RecordObject) => asId(item.feeRuleId))
            .map((item: RecordObject) => ({
              feeRuleId: asId(item.feeRuleId),
              quantity: Number(item.quantity || 1),
            }))
        : []
    );
    setFormOpen(true);
    await loadReferences();
  };

  const openEdit = async (record: RecordObject) => {
    setEditing(record);
    setRowMenuId(null);
    setForm({
      payerType: record.payerType || (record.universityId ? 'UNIVERSITY' : record.organizationId && !record.userId ? 'ORGANIZATION' : 'STUDENT'),
      userId: asId(record.userId),
      universityId: asId(record.universityId),
      organizationId: asId(record.organizationId),
      invoiceId: asId(record.invoiceId),
      description: record.description || '',
      amount: record.amount == null ? '' : String(record.amount),
      currency: record.currency || 'USD',
      status: record.status || 'PENDING',
      invoiceNumber: record.invoiceNumber || '',
      reference: record.reference || '',
      dueDate: toInputDate(record.dueDate),
      paidAt: toInputDate(record.paidAt),
      paymentMethod: record.paymentMethod || '',
      notes: record.notes || '',
    });
    setFormOpen(true);
    await loadReferences();
  };

  const closeForm = () => {
    if (saving) return;
    setFormOpen(false);
    setEditing(null);
    setInvoiceItems([]);
    setFeeRules([]);
    setForm(EMPTY_FORM);
  };

  const saveRecord = async () => {
    const recordType = editing?.type || config.type;
    const requiresAccount = recordType === 'FEE';
    const requiresOrganization = recordType === 'SETTLEMENT';
    const requiresInvoice = recordType === 'PAYMENT';

    if (
      !recordType ||
      (requiresAccount && !form.userId) ||
      (requiresOrganization && !form.organizationId) ||
      (requiresInvoice && !form.invoiceId) ||
      !form.description.trim() ||
      form.amount === ''
    ) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (editing) {
        let payload: RecordObject;

        if (recordType === 'FEE') {
          payload = {
            description: form.description.trim(),
            amount: Number(form.amount),
            currency: form.currency || 'USD',
            invoiceNumber: form.invoiceNumber.trim() || undefined,
            dueDate: form.dueDate || null,
            notes: form.notes.trim() || undefined,
          };
        } else if (recordType === 'PAYMENT') {
          payload = {
            description: form.description.trim(),
            reference: form.reference.trim() || undefined,
            paidAt: form.paidAt || null,
            paymentMethod: form.paymentMethod || undefined,
            notes: form.notes.trim() || undefined,
          };
        } else if (recordType === 'REFUND') {
          payload = {
            description: form.description.trim(),
            reference: form.reference.trim() || undefined,
            notes: form.notes.trim() || undefined,
          };
        } else {
          payload = {
            organizationId: form.organizationId,
            description: form.description.trim(),
            amount: Number(form.amount),
            currency: form.currency || 'USD',
            status: form.status,
            reference: form.reference.trim() || undefined,
            paidAt: form.paidAt || null,
            paymentMethod: form.paymentMethod || undefined,
            notes: form.notes.trim() || undefined,
          };
        }

        await api.patch('/finance/' + asId(editing), payload);
      } else {
        await api.post('/finance', {
          type: recordType,
          userId: form.userId || undefined,
          organizationId: form.organizationId || undefined,
          invoiceId: form.invoiceId || undefined,
          description: form.description.trim(),
          amount: Number(form.amount),
          currency: form.currency || 'USD',
          status: recordType === 'SETTLEMENT' ? form.status : undefined,
          invoiceNumber: form.invoiceNumber.trim() || undefined,
          reference: form.reference.trim() || undefined,
          dueDate: form.dueDate || null,
          paidAt: form.paidAt || null,
          paymentMethod: form.paymentMethod || undefined,
          notes: form.notes.trim() || undefined,
        });
      }

      const wasEditing = Boolean(editing);
      closeForm();
      await loadRecords();
      setSuccess(wasEditing ? 'Finance record updated successfully.' : config.action + ' saved successfully.');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error?.message || 'Unable to save finance record.');
    } finally {
      setSaving(false);
    }
  };

  const refundPayment = async (record: RecordObject) => {
    setRowMenuId(null);
    const raw = window.prompt(
      'Refund amount',
      String(record.amount || '')
    );
    if (raw === null) return;

    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a valid refund amount.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/finance/' + asId(record) + '/refund', {
        amount,
        description: 'Refund for ' + (record.description || 'payment'),
      });
      await loadRecords();
      setSuccess('Refund recorded successfully.');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error?.message || 'Unable to record refund.');
    } finally {
      setSaving(false);
    }
  };

  const voidRecord = async (record: RecordObject) => {
    setRowMenuId(null);
    const reason = window.prompt('Reason for void / cancellation', '');
    if (reason === null) return;
    if (!reason.trim()) {
      setError('A reason is required to void a finance record.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/finance/' + asId(record) + '/void', { reason: reason.trim() });
      await loadRecords();
      setSuccess('Finance record voided successfully. The audit history has been preserved.');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error?.message || 'Unable to void finance record.');
    } finally {
      setSaving(false);
    }
  };

  const referenceLabel = (record: RecordObject) =>
    record.invoiceNumber || record.reference || '—';

  const formType = editing?.type || config.type;
  const selectedInvoice = invoices.find((invoice) => asId(invoice) === form.invoiceId) || null;
  const openInvoices = invoices.filter((invoice) => {
    if (editing && asId(invoice) === form.invoiceId) return true;
    return !['PAID', 'CANCELLED'].includes(invoice.status) && Number(invoice.balance ?? invoice.amount) > 0;
  });

  return (
    <div className="space-y-5 pb-10">
      <section className="relative rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="pr-14">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-teal-700">
            {config.eyebrow}
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            {config.title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            {config.description}
          </p>
        </div>

        <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
          <button
            type="button"
            aria-label="Finance page actions"
            aria-expanded={headerMenuOpen}
            onClick={() => setHeaderMenuOpen((current) => !current)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          {headerMenuOpen && (
            <div className="absolute right-0 top-12 z-30 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl">
              {!readOnly && config.action && (
                <button
                  type="button"
                  onClick={() => void openCreate()}
                  className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-xs font-black text-teal-700 hover:bg-teal-50"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50">
                    <Plus className="h-4 w-4" />
                  </span>
                  {config.action}
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setHeaderMenuOpen(false);
                  void loadRecords();
                }}
                className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-xs font-black text-slate-700 hover:bg-slate-100"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                  <RefreshCw className="h-4 w-4" />
                </span>
                Refresh Data
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
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
          {success}
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <FinanceStat
          icon={<ReceiptText className="h-5 w-5" />}
          label="Records"
          value={loading ? '—' : String(filteredRecords.length)}
        />
        <FinanceStat
          icon={<CircleDollarSign className="h-5 w-5" />}
          label="Total Amount"
          value={loading ? '—' : totalAmountLabel}
        />
        <FinanceStat
          icon={<CalendarDays className="h-5 w-5" />}
          label="Pending / Open"
          value={loading ? '—' : String(pendingCount)}
        />
        <FinanceStat
          icon={<WalletCards className="h-5 w-5" />}
          label="Completed"
          value={loading ? '—' : String(completedCount)}
        />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-950">
                {registerTitleOverride || (readOnly ? config.title : config.title + ' Register')}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {registerDescriptionOverride ||
                  (readOnly
                    ? 'Read-only live finance records for students associated with your university.'
                    : 'Live finance records with filters, actions and responsive mobile cards.')}
              </p>
            </div>

            <div className="grid w-full gap-2 sm:grid-cols-2 lg:w-auto lg:min-w-[620px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search account, invoice, reference..."
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm font-semibold text-slate-700 outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {mode === 'transactions' ? (
                  <FilterSelect
                    value={typeFilter}
                    onChange={setTypeFilter}
                    placeholder="All Types"
                    options={[
                      ['FEE', 'Fees'],
                      ['PAYMENT', 'Payments'],
                      ['REFUND', 'Refunds'],
                      ['SETTLEMENT', 'Settlements'],
                    ]}
                  />
                ) : (
                  <div className="hidden sm:block" />
                )}

                <FilterSelect
                  value={statusFilter}
                  onChange={setStatusFilter}
                  placeholder="All Status"
                  options={[
                    ['PENDING', 'Pending'],
                    ['PARTIAL', 'Partial'],
                    ['OVERDUE', 'Overdue'],
                    ['PAID', 'Paid'],
                    ['REFUNDED', 'Refunded'],
                    ['CANCELLED', 'Cancelled'],
                  ]}
                />
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-14 text-sm font-bold text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading finance records...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <ReceiptText className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-black text-slate-700">No finance records found</p>
            <p className="mt-1 text-xs text-slate-500">
              {readOnly
                ? 'Records will appear automatically when AZAAM records finance activity for your students.'
                : config.action
                  ? 'Use the three-dot menu to create the first record.'
                  : 'Transactions will appear as finance activity is recorded.'}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1050px] text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-3.5">Account</th>
                    {mode === 'transactions' && <th className="px-4 py-3.5">Type</th>}
                    <th className="px-4 py-3.5">Reference</th>
                    <th className="px-4 py-3.5">Description</th>
                    <th className="px-4 py-3.5">Amount</th>
                    <th className="px-4 py-3.5">Date</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((record) => (
                    <tr key={asId(record)} className="transition hover:bg-teal-50/30">
                      <td className="px-4 py-3.5">
                        <div className="font-black text-slate-900">{accountName(record)}</div>
                        <div className="mt-0.5 max-w-[180px] truncate text-[10px] font-semibold text-slate-500">
                          {accountEmail(record) || 'Finance account'}
                        </div>
                      </td>

                      {mode === 'transactions' && (
                        <td className="px-4 py-3.5">
                          <span className={'inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ' + typeClass(record.type)}>
                            {record.type}
                          </span>
                        </td>
                      )}

                      <td className="px-4 py-3.5 font-mono text-[11px] font-bold text-slate-600">
                        {referenceLabel(record)}
                      </td>

                      <td className="max-w-[240px] px-4 py-3.5">
                        <div className="truncate font-bold text-slate-700">{record.description}</div>
                        {record.organizationId?.name && (
                          <div className="mt-0.5 truncate text-[10px] font-semibold text-violet-600">
                            {record.organizationId.name}
                          </div>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5">
                        <div className="font-black text-slate-900">{formatMoney(record.amount, record.currency)}</div>
                        {record.type === 'FEE' && (
                          <div className="mt-0.5 text-[9px] font-semibold text-slate-500">
                            Paid {formatMoney(record.paidAmount || 0, record.currency)} · Balance {formatMoney(record.balance || 0, record.currency)}
                          </div>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3.5 font-semibold text-slate-600">
                        {formatDate(record.paidAt || record.dueDate || record.createdAt)}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={'inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ' + statusClass(record.status)}>
                          {record.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex flex-col items-end">
                          <button
                            type="button"
                            aria-label="Finance record actions"
                            onClick={() =>
                              setRowMenuId((current) => current === asId(record) ? null : asId(record))
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {rowMenuId === asId(record) && (
                            <div className="mt-1 w-48 rounded-2xl border border-slate-200 bg-white p-1.5 text-left shadow-xl">
                              <ActionItem
                                icon={<Eye className="h-4 w-4" />}
                                label="View Details"
                                onClick={() => {
                                  setRowMenuId(null);
                                  setViewing(record);
                                }}
                              />
                              {!readOnly && (
                                <ActionItem
                                  icon={<Pencil className="h-4 w-4" />}
                                  label="Edit Record"
                                  onClick={() => void openEdit(record)}
                                />
                              )}
                              {!readOnly && record.type === 'PAYMENT' && record.status !== 'REFUNDED' && (
                                <ActionItem
                                  icon={<RotateCcw className="h-4 w-4" />}
                                  label="Create Refund"
                                  onClick={() => void refundPayment(record)}
                                />
                              )}
                              {!readOnly && record.status !== 'CANCELLED' && (
                                <ActionItem
                                  danger
                                  icon={<Ban className="h-4 w-4" />}
                                  label="Void / Cancel"
                                  onClick={() => void voidRecord(record)}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-3 md:hidden">
              {filteredRecords.map((record) => (
                <article key={asId(record)} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-black text-slate-950">{accountName(record)}</h3>
                      <p className="mt-1 truncate text-xs font-bold text-teal-700">{record.description}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setRowMenuId((current) => current === asId(record) ? null : asId(record))
                      }
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>

                  {rowMenuId === asId(record) && (
                    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
                      <ActionItem
                        icon={<Eye className="h-4 w-4" />}
                        label="View Details"
                        onClick={() => {
                          setRowMenuId(null);
                          setViewing(record);
                        }}
                      />
                      {!readOnly && (
                        <ActionItem
                          icon={<Pencil className="h-4 w-4" />}
                          label="Edit Record"
                          onClick={() => void openEdit(record)}
                        />
                      )}
                      {!readOnly && record.type === 'PAYMENT' && record.status !== 'REFUNDED' && (
                        <ActionItem
                          icon={<RotateCcw className="h-4 w-4" />}
                          label="Create Refund"
                          onClick={() => void refundPayment(record)}
                        />
                      )}
                      {!readOnly && record.status !== 'CANCELLED' && (
                        <ActionItem
                          danger
                          icon={<Ban className="h-4 w-4" />}
                          label="Void / Cancel"
                          onClick={() => void voidRecord(record)}
                        />
                      )}
                    </div>
                  )}

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <MobileInfo label="Reference" value={referenceLabel(record)} />
                    <MobileInfo label="Amount" value={formatMoney(record.amount, record.currency)} />
                    <MobileInfo label="Type" value={record.type} />
                    <MobileInfo label="Status" value={record.status} />
                  </div>

                  <div className="mt-3 text-[10px] font-semibold text-slate-500">
                    {formatDate(record.paidAt || record.dueDate || record.createdAt)}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {viewing && (
        <ModalShell
          title="Finance Record"
          eyebrow={viewing.type || 'Finance'}
          onClose={() => setViewing(null)}
        >
          {readOnly && (
            <div className="mb-4 rounded-2xl border border-cyan-200 bg-cyan-50 p-3 text-xs font-semibold leading-5 text-cyan-800">
              This is a read-only university finance view. Financial changes are maintained by AZAAM administration.
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailBox label="Account" value={accountName(viewing)} />
            <DetailBox label="Email" value={accountEmail(viewing) || '—'} />
            <DetailBox label="Type" value={viewing.type || '—'} />
            <DetailBox label="Status" value={viewing.status || '—'} />
            <DetailBox label="Amount" value={formatMoney(viewing.amount, viewing.currency)} />
            <DetailBox label="Reference" value={referenceLabel(viewing)} />
            <DetailBox label="Linked Invoice" value={viewing.invoiceId?.invoiceNumber || (viewing.type === 'FEE' ? viewing.invoiceNumber : '—')} />
            {viewing.type === 'FEE' && <DetailBox label="Paid Amount" value={formatMoney(viewing.paidAmount || 0, viewing.currency)} />}
            {viewing.type === 'FEE' && <DetailBox label="Balance" value={formatMoney(viewing.balance || 0, viewing.currency)} />}
            <DetailBox label="Description" value={viewing.description || '—'} />
            <DetailBox label="Payment Method" value={(viewing.paymentMethod || '—').replace(/_/g, ' ')} />
            <DetailBox label="Due Date" value={formatDate(viewing.dueDate)} />
            <DetailBox label="Paid Date" value={formatDate(viewing.paidAt)} />
            <DetailBox label="Organization" value={viewing.organizationId?.name || '—'} />
            <DetailBox label="Created" value={formatDate(viewing.createdAt)} />
          </div>
          {viewing.notes && (
            <div className="mt-3 rounded-2xl bg-slate-50 p-4">
              <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">Notes</div>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">{viewing.notes}</p>
            </div>
          )}
        </ModalShell>
      )}

      {!readOnly && formOpen && (
        <ModalShell
          title={editing ? 'Edit Finance Record' : config.action}
          eyebrow={editing ? editing.type : config.type || 'Finance'}
          onClose={closeForm}
          footer={
            <>
              <button
                type="button"
                disabled={saving}
                onClick={closeForm}
                className="min-h-11 rounded-xl border border-slate-200 px-5 text-sm font-black text-slate-600 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  saving ||
                  referenceLoading ||
                  (formType === 'FEE' && !form.userId) ||
                  (formType === 'PAYMENT' && !form.invoiceId) ||
                  (formType === 'SETTLEMENT' && !form.organizationId) ||
                  !form.description.trim() ||
                  form.amount === ''
                }
                onClick={() => void saveRecord()}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-5 text-sm font-black text-white disabled:opacity-40"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
                {saving ? 'Saving...' : editing ? 'Save Changes' : config.action}
              </button>
            </>
          }
        >
          {referenceLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm font-bold text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading accounts...
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {formType === 'PAYMENT' && (
                <Select
                  label="Invoice *"
                  value={form.invoiceId}
                  onChange={(value) => {
                    const invoice = invoices.find((item) => asId(item) === value);
                    setForm((current) => ({
                      ...current,
                      invoiceId: value,
                      userId: asId(invoice?.userId),
                      currency: invoice?.currency || current.currency,
                      description: invoice
                        ? 'Payment for ' + (invoice.invoiceNumber || invoice.description || 'invoice')
                        : current.description,
                      amount: invoice?.balance != null ? String(invoice.balance) : current.amount,
                    }));
                  }}
                  disabled={Boolean(editing)}
                >
                  <option value="">Select invoice</option>
                  {openInvoices.map((invoice) => (
                    <option key={asId(invoice)} value={asId(invoice)}>
                      {invoice.invoiceNumber || 'Invoice'} · {accountName(invoice)} · Balance {formatMoney(invoice.balance ?? invoice.amount, invoice.currency)}
                    </option>
                  ))}
                </Select>
              )}

              {formType === 'PAYMENT' && (
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">Invoice Account</div>
                  <div className="mt-1 text-sm font-black text-slate-800">
                    {selectedInvoice ? accountName(selectedInvoice) : 'Select an invoice'}
                  </div>
                  {selectedInvoice && (
                    <div className="mt-1 text-[10px] font-semibold text-slate-500">
                      Remaining balance: {formatMoney(selectedInvoice.balance ?? selectedInvoice.amount, selectedInvoice.currency)}
                    </div>
                  )}
                </div>
              )}

              {formType === 'FEE' && (
                <Select
                  label="Account / User *"
                  value={form.userId}
                  onChange={(value) => setForm((current) => ({ ...current, userId: value }))}
                  disabled={Boolean(editing)}
                >
                  <option value="">Select account</option>
                  {users.map((item) => (
                    <option key={asId(item)} value={asId(item)}>
                      {[item.firstName, item.lastName].filter(Boolean).join(' ') || item.email} · {item.email}
                    </option>
                  ))}
                </Select>
              )}

              {formType === 'SETTLEMENT' && (
                <Select
                  label="Beneficiary Organization *"
                  value={form.organizationId}
                  onChange={(value) => setForm((current) => ({ ...current, organizationId: value }))}
                >
                  <option value="">Select organization</option>
                  {organizations.map((organization) => (
                    <option key={asId(organization)} value={asId(organization)}>
                      {organization.name}
                    </option>
                  ))}
                </Select>
              )}

              <label>
                <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">Amount *</span>
                <input
                  type="number"
                  min="0.01"
                  max={formType === 'PAYMENT' && selectedInvoice ? Number(selectedInvoice.balance ?? selectedInvoice.amount) : undefined}
                  step="0.01"
                  value={form.amount}
                  disabled={Boolean(editing && ['PAYMENT', 'REFUND'].includes(formType))}
                  onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                  placeholder="0.00"
                  className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none focus:border-teal-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                />
              </label>

              <label className="sm:col-span-2">
                <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">Description *</span>
                <input
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Clinical training fee, payment, settlement or refund reason"
                  className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500"
                />
              </label>

              <Select
                label="Currency"
                value={form.currency}
                onChange={(value) => setForm((current) => ({ ...current, currency: value }))}
                disabled={['PAYMENT', 'REFUND'].includes(formType)}
              >
                <option value="USD">USD</option>
                <option value="SOS">SOS</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </Select>

              {formType === 'SETTLEMENT' ? (
                <Select
                  label="Status"
                  value={form.status}
                  onChange={(value) => setForm((current) => ({ ...current, status: value }))}
                >
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                </Select>
              ) : (
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">Status</div>
                  <div className="mt-1 text-sm font-black text-slate-800">
                    {formType === 'FEE' ? 'Calculated automatically' : form.status}
                  </div>
                  {formType === 'FEE' && (
                    <div className="mt-1 text-[10px] font-semibold text-slate-500">
                      Based on invoice balance and due date
                    </div>
                  )}
                </div>
              )}

              {formType === 'FEE' && (
                <>
                  <label>
                    <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">Invoice Number</span>
                    <input
                      value={form.invoiceNumber}
                      onChange={(event) => setForm((current) => ({ ...current, invoiceNumber: event.target.value }))}
                      placeholder="Auto-generated if blank"
                      className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500"
                    />
                  </label>

                  <label>
                    <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">Due Date</span>
                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
                      className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500"
                    />
                  </label>
                </>
              )}

              {formType !== 'FEE' && (
                <>
                  <label>
                    <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">Reference</span>
                    <input
                      value={form.reference}
                      onChange={(event) => setForm((current) => ({ ...current, reference: event.target.value }))}
                      placeholder="Auto-generated if blank"
                      className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500"
                    />
                  </label>

                  <label>
                    <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">Transaction Date</span>
                    <input
                      type="date"
                      value={form.paidAt}
                      onChange={(event) => setForm((current) => ({ ...current, paidAt: event.target.value }))}
                      className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500"
                    />
                  </label>

                  <Select
                    label="Payment Method"
                    value={form.paymentMethod}
                    onChange={(value) => setForm((current) => ({ ...current, paymentMethod: value }))}
                  >
                    <option value="">Not specified</option>
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="MOBILE_MONEY">Mobile Money</option>
                    <option value="CARD">Card</option>
                    <option value="OTHER">Other</option>
                  </Select>
                </>
              )}

              <label className="sm:col-span-2">
                <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">Notes</span>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Optional internal finance notes"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500"
                />
              </label>
            </div>
          )}
        </ModalShell>
      )}
    </div>
  );
};

const FinanceStat: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
      {icon}
    </div>
    <p className="mt-4 truncate text-xl font-black text-slate-950 sm:text-2xl">{value}</p>
    <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-slate-400 sm:text-xs">{label}</p>
  </article>
);

const ActionItem: React.FC<{
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
      (danger ? 'text-rose-600 hover:bg-rose-50' : 'text-slate-700 hover:bg-slate-100')
    }
  >
    <span className={danger ? 'text-rose-500' : 'text-teal-600'}>{icon}</span>
    {label}
  </button>
);

const ModalShell: React.FC<{
  eyebrow: string;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}> = ({ eyebrow, title, onClose, children, footer }) => (
  <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4">
    <button type="button" aria-label="Close modal" className="absolute inset-0 cursor-default" onClick={onClose} />
    <div className="relative z-10 flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:max-w-3xl sm:rounded-3xl">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-700">{eyebrow}</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">{title}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 sm:p-6">{children}</div>
      {footer && (
        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          {footer}
        </div>
      )}
    </div>
  </div>
);

const DetailBox: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-2xl bg-slate-50 p-4">
    <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</div>
    <div className="mt-1 break-words text-sm font-black text-slate-800">{value}</div>
  </div>
);

const MobileInfo: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl bg-slate-50 p-3">
    <div className="text-[9px] font-black uppercase tracking-wide text-slate-400">{label}</div>
    <div className="mt-1 truncate text-xs font-black text-slate-800">{value}</div>
  </div>
);

const FilterSelect: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: [string, string][];
}> = ({ value, onChange, placeholder, options }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="min-h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 pr-9 text-sm font-semibold text-slate-700 outline-none focus:border-teal-500 focus:bg-white"
    >
      <option value="">{placeholder}</option>
      {options.map(([id, label]) => (
        <option key={id} value={id}>{label}</option>
      ))}
    </select>
    <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
  </div>
);

const Select: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
}> = ({ label, value, onChange, children, disabled = false }) => (
  <label>
    <span className="text-[10px] font-black uppercase tracking-wide text-slate-500">{label}</span>
    <div className="relative mt-1">
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm font-semibold text-slate-800 outline-none focus:border-teal-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
    </div>
  </label>
);
